import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // Use Ollama to analyze the image with resume photo checking prompt
    const response = await ollama.chat({
      model: "llava:latest",
      messages: [
        {
          role: "user",
          content: `Look at this photo and evaluate it as a resume/profile picture.
Respond in this format:

Professionalism: [High / Medium / Low]  
Attire: [Formal / Casual / Inappropriate]  
Background: [Neutral / Distracting / Cluttered]  
Expression: [Friendly / Neutral / Serious / Negative]  
Suggestions: [1-2 short tips to improve]`,
          images: [base64Image]
        }
      ]
    });

    const result = response.message.content?.trim();

    return NextResponse.json({ 
      report: result,
      filename: file.name 
    });

  } catch (error: unknown) {
    console.error("Error analyzing image:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze image";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
