"use client";

import { useState } from "react";
import jsPDF from "jspdf";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("resume", selectedFile);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze resume");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Check console logs for details.");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("AI Resume Analysis Report", 20, 20);
    doc.setFontSize(12);
    doc.text("Score: " + result.score, 20, 30);
    doc.text("Skills: " + result.skills, 20, 40);
    doc.text("Experience: " + result.experience, 20, 50);
    doc.text("Job Titles: " + result.jobTitles, 20, 60);
    doc.text("Suggestions: " + result.suggestions.replace(/;/g, '\n'), 20, 70);
    doc.text("Elevator Pitch: " + result.elevatorPitch, 20, 90);
    doc.text("ATS Keywords: " + result.atsKeywords, 20, 110);
    doc.text("Cover Letter Snippet: " + result.coverLetter, 20, 120);
    doc.text("Job Trends: " + result.jobTrends, 20, 140);
    doc.text("Jobs:", 20, 160);
    result.jobs.forEach((job: any, i: number) => {
      doc.text(`${i+1}. ${job.position} at ${job.company} - ${job.link}`, 20, 170 + i*10);
    });
    doc.save("resume-analysis.pdf");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center text-blue-700 mb-4">
          📄 AI Resume Analyzer
        </h1>
        
        <div className="space-y-6">
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileSelect}
              className="hidden"
              id="resume-upload"
              aria-label="Upload resume file"
            />
            <label
              htmlFor="resume-upload"
              className="cursor-pointer block"
            >
              <div className="text-gray-600">
                <svg className="mx-auto h-12 w-12 mb-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium">Click to upload a resume (PDF, DOCX, or DOC)</p>
                <p className="text-sm text-gray-500">Up to 10MB</p>
              </div>
            </label>
          </div>

          {/* File Info */}
          {selectedFile && (
            <div className="text-center text-sm text-gray-600 mt-2">{selectedFile?.name}</div>
          )}

          {/* Analyze Button */}
          {selectedFile && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Analyze resume"
            >
              {loading ? (
                <span className="animate-loading-dots">Analyzing</span>
              ) : "📊 Analyze Resume 📊"}
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-blue-700">Analysis Results</h2>
                <button
                  onClick={exportToPDF}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  aria-label="Export to PDF"
                >
                  Export to PDF
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg shadow">
                  <p className="text-sm font-bold text-blue-600 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Resume Score
                  </p>
                  <p className="text-4xl font-bold text-green-600">{result.score}/100</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg shadow">
                  <p className="text-sm font-bold text-blue-600 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Skills
                  </p>
                  <p>{result.skills}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg shadow">
                  <p className="text-sm font-bold text-blue-600 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Experience
                  </p>
                  <p>{result.experience}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg shadow">
                  <p className="text-sm font-bold text-blue-600 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.34V10a3 3 0 00-3-3H6a3 3 0 00-3 3v3.34m18 0A2.66 2.66 0 0118.66 16H5.34A2.66 2.66 0 013 13.34m2 5.66h14" />
                    </svg>
                    Possible Job Titles
                  </p>
                  <p>{result.jobTitles}</p>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg shadow">
                <p className="text-sm font-bold text-blue-600 flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Suggestions to Improve
                </p>
                <ul className="list-disc pl-5 space-y-2 text-red-600">
                  {result.suggestions.split(";").map((sugg: string, i: number) => (
                    <li key={i}>{sugg.trim()}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg shadow">
                <p className="text-sm font-bold text-blue-600 flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Elevator Pitch
                </p>
                <p className="italic">{result.elevatorPitch}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg shadow">
                <p className="text-sm font-bold text-blue-600 flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  ATS Keywords to Add
                </p>
                <p>{result.atsKeywords}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg shadow">
                <p className="text-sm font-bold text-blue-600 flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Cover Letter Snippet
                </p>
                <p className="italic">{result.coverLetter}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg shadow">
                <p className="text-sm font-bold text-blue-600 flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Job Market Trends (from X)
                </p>
                <p>{result.jobTrends}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg shadow">
                <p className="text-sm font-bold text-blue-600 flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Real-Time Job Recommendations (Top 5 from LinkedIn, Indeed, etc.)
                </p>
                {result.jobs && result.jobs.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2">
                    {result.jobs.map((job: any, i: number) => (
                      <li key={i} className="text-blue-600 hover:underline">
                        <strong>{job.position}</strong> at {job.company} - <a href={job.link} target="_blank" rel="noopener noreferrer">Apply Here</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-red-600">No job recommendations found (API issue or no matching jobs).</p>
                )}
              </div>
              <div className="bg-blue-50 p-4 rounded-lg shadow">
                <p className="text-sm font-bold text-blue-600 flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Full AI Response
                </p>
                <p className="text-sm font-medium text-gray-700">{result.fullResponse || "No response"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}