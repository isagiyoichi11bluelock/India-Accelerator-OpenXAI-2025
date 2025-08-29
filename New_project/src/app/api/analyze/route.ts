import { NextRequest, NextResponse } from "next/server";
import * as mammoth from "mammoth";
import { createWorker } from "tesseract.js";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const lower = file.name.toLowerCase();
    let extractedText = "";

    // Approach 1: Using pdfjs-dist (recommended first try)
    if (lower.endsWith(".pdf")) {
      console.log("Processing PDF file");
      
      try {
        // Try to use pdfjs-dist for PDF parsing
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = await import("pdfjs-dist/build/pdf.worker.js?url");
        
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        let text = "";
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        
        extractedText = text;
        console.log("PDF text extracted successfully with pdfjs-dist");
      } catch (error) {
        console.error("PDF.js parsing failed, trying alternative method:", error);
        
        // Approach 2: Simple text extraction fallback
        try {
          // Convert the buffer to a string and extract text
          const bufferString = buffer.toString('binary');
          
          // Simple regex to extract text from PDFs (not perfect but works for many)
          const textMatches = bufferString.match(/\(([^)]+)\)/g);
          
          if (textMatches) {
            extractedText = textMatches
              .map(match => match.slice(1, -1)) // Remove parentheses
              .join(' ')
              .replace(/\\[nrt]/g, ' ') // Replace escape sequences with spaces
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();
          } else {
            // Approach 3: External API as last resort
            console.log("Simple extraction failed, trying external API");
            
            // Note: You'll need to sign up for a free API key at https://www.pdf.co/
            const API_KEY = process.env.PDF_CO_API_KEY || "your-free-api-key-here";
            
            const formData = new FormData();
            formData.append('file', new Blob([buffer]), file.name);
            
            const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
              method: 'POST',
              headers: {
                'x-api-key': API_KEY
              },
              body: formData
            });
            
            const data = await response.json();
            extractedText = data.body || "Could not extract text from PDF";
            
            console.log("PDF text extracted with external API");
          }
        } catch (fallbackError) {
          console.error("All PDF extraction methods failed:", fallbackError);
          return NextResponse.json(
            { error: "Failed to parse PDF file with all available methods" },
            { status: 400 }
          );
        }
      }
    } else if (lower.endsWith(".docx")) {
      console.log("Processing DOCX file");
      try {
        const { value } = await mammoth.extractRawText({ buffer });
        extractedText = value || "";
      } catch (error) {
        console.error("DOCX parsing error:", error);
        return NextResponse.json(
          { error: "Failed to parse DOCX file" },
          { status: 400 }
        );
      }
    } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) {
      console.log("Processing image file with OCR");
      try {
        const worker = await createWorker("eng");
        const { data } = await worker.recognize(buffer);
        await worker.terminate();
        
        extractedText = data.text
          .split("\n")
          .filter(line => /\w{2,}/.test(line))
          .join("\n");
      } catch (error) {
        console.error("OCR processing error:", error);
        return NextResponse.json(
          { error: "Failed to process image with OCR" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, JPG, or PNG." },
        { status: 400 }
      );
    }

    // If we've successfully extracted text, proceed with Ollama analysis
    if (extractedText && extractedText !== "Could not extract text from PDF") {
      // Build prompt for Ollama
      const prompt = `Analyze this resume and provide:
1. Key skills, education, and experience
2. Recommended job roles
3. Companies that might hire this person (both Indian and international)

Resume text:
${extractedText.substring(0, 3000)}`; // Limit text to avoid token limits

      try {
        const ollamaResp = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama3",
            prompt,
            stream: false,
          }),
        });

        if (!ollamaResp.ok) {
          const errorText = await ollamaResp.text();
          throw new Error(`Ollama error: ${ollamaResp.status} - ${errorText}`);
        }

        const ollamaData = await ollamaResp.json();
        return NextResponse.json({ 
          success: true,
          analysis: ollamaData.response 
        });
      } catch (error: any) {
        console.error("Ollama API error:", error);
        return NextResponse.json(
          { error: "Failed to process with AI", details: error.message },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Could not extract text from the file" },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error("Unexpected error in API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}