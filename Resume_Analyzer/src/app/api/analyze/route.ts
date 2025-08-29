import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";
import mammoth from "mammoth";
import pdfParse from "pdf-parse-debugging-disabled";
import WordExtractor from "word-extractor";

export async function POST(request: NextRequest) {
  try {
    try {
      await ollama.list();
    } catch (e) {
      console.error("Ollama connection error:", e);
      return NextResponse.json({ error: "Ollama server not running or Llama3 model not found. Run 'ollama serve' and 'ollama pull llama3:latest'." }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("resume") as File;

    if (!file) {
      return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
    }

    const fileType = file.type;
    let text = "";

    try {
      const buffer = Buffer.from(await file.arrayBuffer());

      if (fileType === "application/pdf") {
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } else if (
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const docxData = await mammoth.extractRawText({ buffer });
        text = docxData.value;
      } else if (fileType === "application/msword") {
        const extractor = new WordExtractor();
        const extracted = await extractor.extract(buffer);
        text = extracted.getBody();
      } else {
        return NextResponse.json({ error: "Unsupported file type. Only PDF, DOCX, or DOC allowed." }, { status: 400 });
      }
    } catch (e) {
      console.error("File parsing error:", e);
      return NextResponse.json(
        { error: `Failed to parse resume: ${e instanceof Error ? e.message : "Unknown error"}` },
        { status: 500 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "No text found in the resume." }, { status: 400 });
    }

    try {
      const response = await ollama.chat({
        model: "llama3:latest",
        messages: [
          {
            role: "user",
            content: `Analyze resume text and provide all fields:
1. Skills (5-10, comma-separated)
2. Experience (estimate years)
3. Job Titles (3-5, comma-separated)
4. Suggestions to Improve (3-5 bullets; ;)
5. Elevator Pitch (3-5 sentences)
6. Score (single number 0-100)
7. ATS Keywords (5-10 to add, comma-separated)
8. Cover Letter (3 sentences)
9. Job Trends (5 key trends, comma-separated)

Format exactly:
Skills: [list]
Experience: [years]
Job Titles: [list]
Suggestions to Improve: [bullet1]; [bullet2]; ...
Elevator Pitch: [paragraph]
Score: [number]
ATS Keywords: [list]
Cover Letter: [paragraph]
Job Trends: [list]

Text: ${text.substring(0, 4000)}`,
          },
        ],
      });

      const result = response.message.content?.trim();

      let skills = "";
      let experience = "";
      let jobTitles = "";
      let suggestions = "";
      let elevatorPitch = "";
      let score = "80";
      let atsKeywords = "";
      let coverLetter = "";
      let jobTrends = "";

      if (result) {
        const skillsMatch = result.match(/Skills:\s*(.+?)(?:\n|$)/i);
        if (skillsMatch) skills = skillsMatch[1].trim().replace(/\*\*/g, "");

        const expMatch = result.match(/Experience:\s*(.+?)(?:\n|$)/i);
        if (expMatch) experience = expMatch[1].trim();

        const titlesMatch = result.match(/Job Titles:\s*(.+?)(?:\n|$)/i);
        if (titlesMatch) jobTitles = titlesMatch[1].trim().replace(/\*\*/g, "");

        const suggMatch = result.match(/Suggestions to Improve:\s*(.+?)(?:\n|$)/i);
        if (suggMatch) suggestions = suggMatch[1].trim();

        const pitchMatch = result.match(/Elevator Pitch:\s*(.+?)(?:\n|$)/i);
        if (pitchMatch) elevatorPitch = pitchMatch[1].trim();

        const scoreMatch = result.match(/Score:\s*(\d{1,3})(?:\n|$)/i);
        if (scoreMatch) score = scoreMatch[1].trim();

        const atsMatch = result.match(/ATS Keywords:\s*(.+?)(?:\n|$)/i);
        if (atsMatch) atsKeywords = atsMatch[1].trim();

        const coverMatch = result.match(/Cover Letter:\s*(.+?)(?:\n|$)/i);
        if (coverMatch) coverLetter = coverMatch[1].trim();

        const trendsMatch = result.match(/Job Trends:\s*(.+?)(?:\n|$)/i);
        if (trendsMatch) jobTrends = trendsMatch[1].trim();
      }

      const rapidApiKey = process.env.RAPIDAPI_KEY;
      if (!rapidApiKey) {
        console.error("RapidAPI key not found in .env.local");
        return NextResponse.json({ error: "RapidAPI key not configured. Add RAPIDAPI_KEY to .env.local." }, { status: 500 });
      }

      const searchQuery = `${jobTitles.split(",")[0] || "Developer"} in USA`;

      const [jsearchResponse, googleJobsResponse] = await Promise.all([
        fetch("https://jsearch.p.rapidapi.com/search?query=" + encodeURIComponent(searchQuery) + "&page=1&num_pages=1", {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": rapidApiKey,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
          },
        }),
        fetch("https://google-for-jobs.p.rapidapi.com/search?query=" + encodeURIComponent(searchQuery) + "&page=1&num_pages=1", {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": rapidApiKey,
            "X-RapidAPI-Host": "google-for-jobs.p.rapidapi.com",
          },
        }),
      ]);

      let jobs: any[] = [];

      if (jsearchResponse.ok) {
        const jsearchData = await jsearchResponse.json();
        jobs = jobs.concat(jsearchData.data?.slice(0, 5).map((job: any) => ({
          company: job.employer_name,
          position: job.job_title,
          link: job.job_apply_link,
        })) || []);
      }

      if (googleJobsResponse.ok) {
        const googleData = await googleJobsResponse.json();
        jobs = jobs.concat(googleData.data?.slice(0, 5).map((job: any) => ({
          company: job.employer_name,
          position: job.job_title,
          link: job.job_apply_link,
        })) || []);
      }

      jobs = Array.from(new Set(jobs.map(j => JSON.stringify(j)))).map(j => JSON.parse(j)).slice(0, 5);

      return NextResponse.json({
        skills,
        experience,
        jobTitles,
        suggestions,
        elevatorPitch,
        score,
        atsKeywords,
        coverLetter,
        jobTrends,
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