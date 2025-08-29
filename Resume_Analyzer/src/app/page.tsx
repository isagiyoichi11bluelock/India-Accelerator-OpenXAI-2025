"use client";

import { useState } from "react";

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

  return (
    <main className="min-h-screen bg-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
          📄 AI Resume Analyzer 📄
        </h1>
        
        <div className="space-y-6">
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileSelect}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className="cursor-pointer block"
            >
              <div className="text-gray-600">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium">Click to upload a resume (PDF, DOCX, or DOC)</p>
                <p className="text-sm text-gray-500">Up to 10MB</p>
              </div>
            </label>
          </div>

          {/* File Info */}
          {selectedFile && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mt-2">{selectedFile?.name}</p>
            </div>
          )}

          {/* Analyze Button */}
          {selectedFile && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? "Analyzing..." : "📊 Analyze Resume 📊"}
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-bold">Skills:</p>
                <p>{result.skills || "Not extracted"}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-bold">Experience:</p>
                <p>{result.experience || "Not extracted"}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-bold">Possible Job Titles:</p>
                <p>{result.jobTitles || "Not extracted"}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-bold">Suggestions to Improve:</p>
                <ul className="list-disc pl-5">
                  {result.suggestions ? result.suggestions.split(";").map((sugg: string, i: number) => (
                    <li key={i}>{sugg.trim()}</li>
                  )) : <li>No suggestions provided</li>}
                </ul>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-bold">Elevator Pitch:</p>
                <p>{result.elevatorPitch || "Not generated"}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-bold">Real-Time Job Recommendations (Top 5):</p>
                {result.jobs && result.jobs.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {result.jobs.map((job: any, i: number) => (
                      <li key={i}>
                        <strong>{job.position}</strong> at {job.company} - <a href={job.link} target="_blank" className="text-blue-600">Apply Here</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No job recommendations found (API issue or no matching jobs).</p>
                )}
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Full AI Response:</p>
                <p className="font-medium text-sm">{result.fullResponse || "No response"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}