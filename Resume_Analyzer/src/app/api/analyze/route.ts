import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";
import mammoth from "mammoth";
import pdfParse from "pdf-parse-debugging-disabled";
import WordExtractor from "word-extractor";

export async function POST(request: NextRequest) {
  console.log("API POST called at", new Date().toISOString());
  try {
    console.log("Starting Ollama check");
    try {
      await ollama.list();
    } catch (e) {
      console.error("Ollama connection error:", e);
      return NextResponse.json({ error: "Ollama server not running or Llama3 model not found. Run 'ollama serve' and 'ollama pull llama3:latest'." }, { status: 500 });
    }
    console.log("Ollama check passed");

    const formData = await request.formData();
    console.log("FormData received");

    const file = formData.get("resume") as File;

    if (!file) {
      return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
    }
    console.log("File received - Name:", file.name, "Type:", file.type, "Size:", file.size);

    const fileType = file.type;
    let text = "";

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      console.log("Buffer created, size:", buffer.length);

      if (fileType === "application/pdf") {
        console.log("Processing PDF");
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        console.log("Processing DOCX");
        const docxData = await mammoth.extractRawText({ buffer });
        text = docxData.value;
      } else if (fileType === "application/msword") {
        console.log("Processing DOC");
        const extractor = new WordExtractor();
        const extracted = await extractor.extract(buffer);
        text = extracted.getBody();
      } else {
        console.log("Unsupported file type:", fileType);
        return NextResponse.json({ error: "Unsupported file type. Only PDF, DOCX, or DOC allowed." }, { status: 400 });
      }
      console.log("Text extracted, length:", text.length);
    } catch (e) {
      console.error("File parsing error:", e);
      return NextResponse.json({ error: `Failed to parse resume: ${e instanceof Error ? e.message : "Unknown error"}` }, { status: 500 });
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "No text found in the resume." }, { status: 400 });
    }

    // Analyze with Llama3
    try {
      console.log("Starting Llama3 analysis");
      const response = await ollama.chat({
        model: "llama3:latest",
        messages: [
          {
            role: "user",
            content: `Analyze this resume text and extract:
1. Key skills (list 5-10, comma-separated)
2. Years of experience (estimate total)
3. Possible job titles (3-5, comma-separated)
4. Suggestions to improve the resume (3-5 bullet points)
5. Elevator pitch (short 3-5 sentence professional summary)

Respond exactly in this format:
Skills: [list]
Experience: [X years]
Job Titles: [list]
Suggestions: [bullet1]; [bullet2]; ...
Elevator Pitch: [paragraph]

Resume text: ${text}`,
          },
        ],
      });
      console.log("Llama3 response received");

      const result = response.message.content?.trim();

      // Parse Llama3 response
      let skills = "";
      let experience = "";
      let jobTitles = "";
      let suggestions = "";
      let elevatorPitch = "";

      if (result) {
        const skillsMatch = result.match(/Skills:\s*(.+?)(?:\n|$)/i);
        if (skillsMatch) skills = skillsMatch[1].trim();

        const expMatch = result.match(/Experience:\s*(.+?)(?:\n|$)/i);
        if (expMatch) experience = expMatch[1].trim();

        const titlesMatch = result.match(/Job Titles:\s*(.+?)(?:\n|$)/i);
        if (titlesMatch) jobTitles = titlesMatch[1].trim();

        const suggMatch = result.match(/Suggestions:\s*(.+?)(?:\n|$)/i);
        if (suggMatch) suggestions = suggMatch[1].trim();

        const pitchMatch = result.match(/Elevator Pitch:\s*(.+?)(?:\n|$)/i);
        if (pitchMatch) elevatorPitch = pitchMatch[1].trim();
      }

      // Use extracted info for real-time job search
      const rapidApiKey = process.env.RAPIDAPI_KEY;
      if (!rapidApiKey) {
        console.error("RapidAPI key not found in .env.local");
        return NextResponse.json({ error: "RapidAPI key not configured. Add RAPIDAPI_KEY to .env.local." }, { status: 500 });
      }
      console.log("Starting job search");

      const searchQuery = `${jobTitles.split(",")[0] || "Developer"} in USA`;
      let jobs: any[] = [];

      try {
        const jobResponse = await fetch(
          "https://jsearch.p.rapidapi.com/search?query=" + encodeURIComponent(searchQuery) + "&page=1&num_pages=1",
          {
            method: "GET",
            headers: {
              "X-RapidAPI-Key": rapidApiKey,
              "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
            },
          }
        );

        if (!jobResponse.ok) {
          console.error("RapidAPI error:", await jobResponse.text());
          return NextResponse.json({ error: `RapidAPI request failed: ${jobResponse.statusText}` }, { status: 500 });
        }

        const jobData = await jobResponse.json();
        jobs = jobData.data?.slice(0, 5).map((job: any) => ({
          company: job.employer_name,
          position: job.job_title,
          link: job.job_apply_link,
        })) || [];
        console.log("Job search completed, jobs found:", jobs.length);
      } catch (e) {
        console.error("Job search error:", e);
        jobs = []; // Fallback to empty jobs list to avoid crashing
      }

      return NextResponse.json({
        skills,
        experience,
        jobTitles,
        suggestions,
        elevatorPitch,
        jobs,
        fullResponse: result,
        filename: file.name,
      });
    } catch (e) {
      console.error("Llama3 analysis error:", e);
      return NextResponse.json({ error: `Llama3 analysis failed: ${e instanceof Error ? e.message : "Unknown error"}` }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error("General API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze resume";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}