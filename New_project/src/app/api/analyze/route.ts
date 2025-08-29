import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";
import Tesseract from "tesseract.js";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
    }

    // Convert File -> Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // OCR extract text (ignores photos/logos by whitelisting only text characters)
    const { data: { text: rawText } } = await Tesseract.recognize(buffer, "eng", {
      tessedit_char_whitelist:
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:!?@%&()-+=$# ",
    });

    // Clean up OCR text
    const resumeText = rawText.replace(/\s+/g, " ").trim();

    // Build AI prompt
    const prompt = `You are an expert career advisor. Analyze the following resume text:

${resumeText}

Provide:
1. Key strengths in this resume.
2. Weaknesses or missing information.
3. Suggested job roles for this candidate.
4. Recommended skills/certifications.
Respond in clear bullet points.`;

    // Run AI + job fetch in parallel
    const [aiResponse, jobsRes] = await Promise.all([
      ollama.chat({
        model: "llama3",
        messages: [{ role: "user", content: prompt }],
      }),
      fetch("https://remotive.com/api/remote-jobs?search=designer"),
    ]);

    const aiAnalysis = aiResponse.message.content?.trim() || "No analysis available";

    // Process job results
    const jobsData = await jobsRes.json();
    const topJobs = jobsData.jobs.slice(0, 5).map((job: any) => ({
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location,
      url: job.url,
    }));

    // Return both AI analysis + job matches
    return NextResponse.json({
      analysis: aiAnalysis,
      jobs: topJobs,
    });

  } catch (error: any) {
    console.error("Error analyzing resume:", error);
    return NextResponse.json(
      { error: error.message || "Resume analysis failed" },
      { status: 500 }
    );
  }
}
