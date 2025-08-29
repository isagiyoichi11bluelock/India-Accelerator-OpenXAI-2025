"use client";

import React, { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload a resume file (PDF, DOCX, JPG, PNG).");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      // First check if response is JSON
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || `Server error: ${res.status}`);
        }
        
        setResult(data);
      } else {
        // If not JSON, read as text to see what we got
        const text = await res.text();
        throw new Error(`Server returned: ${text.substring(0, 100)}...`);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
          AI Resume Analyzer
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Upload your resume (PDF, DOCX for faster results, or JPG/PNG for OCR).
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-4"
        >
          <input
            type="file"
            accept=".pdf,.docx,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border rounded-lg p-2 w-full"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            {error.includes("Ollama") && (
              <div className="mt-2 text-sm">
                <p>Make sure you:</p>
                <ol className="list-decimal ml-5 mt-1">
                  <li>Have installed Ollama from https://ollama.ai</li>
                  <li>Run "ollama serve" in your terminal</li>
                  <li>Run "ollama pull llama3" to download the model</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="mt-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                AI Analysis
              </h2>
              <pre className="text-gray-700 whitespace-pre-wrap">
                {result.analysis}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}