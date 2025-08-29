"use client";

import { useState } from "react";
import jsPDF from "jspdf";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

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
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 500);

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
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Check console logs for details.");
      setProgress(0);
    } finally {
      setLoading(false);
      clearInterval(interval);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("AI Resume Analysis Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Score: ${result.score}`, 20, 30);
    doc.text(`Skills: ${result.skills}`, 20, 40);
    doc.text(`Experience: ${result.experience}`, 20, 50);
    doc.text(`Job Titles: ${result.jobTitles}`, 20, 60);
    doc.text(`Suggestions: ${result.suggestions.replace(/;/g, '\n')}`, 20, 70);
    doc.text(`Elevator Pitch: ${result.elevatorPitch}`, 20, 90);
    doc.text(`ATS Keywords: ${result.atsKeywords}`, 20, 110);
    doc.text(`Cover Letter: ${result.coverLetter}`, 20, 120);
    doc.text(`Job Trends: ${result.jobTrends}`, 20, 140);
    doc.text("Jobs:", 20, 160);
    result.jobs.forEach((job: any, i: number) => {
      doc.text(`${i+1}. ${job.position} at ${job.company} - ${job.link}`, 20, 170 + i * 10);
    });
    doc.save("resume-analysis.pdf");
  };

  const shareAnalysis = () => {
    const url = `${window.location.origin}/share?data=${encodeURIComponent(JSON.stringify(result))}`;
    navigator.clipboard.writeText(url);
    alert("Analysis link copied to clipboard! Share it with others.");
  };

  const handleFeedback = (rating: number) => {
    console.log(`User feedback: ${rating} stars`);
    alert(`Thank you for rating us ${rating} stars! Your feedback helps us improve.`);
  };

  return (
    <main className={`min-h-screen flex items-center justify-center p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-navy-700 to-teal-200'}`}>
      <div className={`bg-${darkMode ? 'gray-800' : 'white'} rounded-xl shadow-2xl p-8 max-w-3xl w-full mx-auto space-y-8`}>
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <svg className={`h-16 w-16 ${darkMode ? 'text-gold-300' : 'text-gold-500'}`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10 L90 40 L90 90 L50 70 L10 90 L10 40 Z" fill="currentColor" />
            <path d="M50 30 L70 50 L50 70 L30 50 Z" fill={darkMode ? '#4B5563' : 'white'} />
            <text x="50" y="60" fontSize="12" textAnchor="middle" fill={darkMode ? 'white' : 'navy-700'} fontFamily="Arial">ARA</text>
          </svg>
        </div>
        
        <h1 className={`text-4xl font-semibold ${darkMode ? 'text-teal-300' : 'text-navy-700'} text-center mb-6`}>AI Resume Analyzer</h1>
        
        <div className="space-y-8">
          {/* File Upload */}
          <div className={`border-2 border-dashed ${darkMode ? 'border-gray-600' : 'border-gray-300'} rounded-lg p-6 text-center hover:${darkMode ? 'border-teal-400' : 'border-teal-500'} transition-colors`}>
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileSelect}
              className="hidden"
              id="resume-upload"
              aria-label="Upload resume file"
            />
            <label htmlFor="resume-upload" className="cursor-pointer block">
              <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                <svg className={`mx-auto h-12 w-12 mb-4 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium">Click to upload a resume (PDF, DOCX, or DOC)</p>
                <p className="text-sm">Up to 10MB</p>
              </div>
            </label>
          </div>

          {selectedFile && (
            <div className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-4`}>{selectedFile.name}</div>
          )}

          {selectedFile && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full ${darkMode ? 'bg-teal-700 hover:bg-teal-800 disabled:bg-teal-900' : 'bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400'} text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500`}
              aria-label="Analyze resume"
            >
              {loading ? <span className="animate-loading-dots">Analyzing</span> : "Analyze Resume"}
            </button>
          )}

          {loading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className={`bg-teal-600 h-2.5 rounded-full transition-all duration-300`} style={{ width: `${progress}%` }}></div>
            </div>
          )}

          {error && (
            <div className={`bg-${darkMode ? 'red-900' : 'red-100'} border-${darkMode ? 'red-700' : 'red-400'} text-${darkMode ? 'red-400' : 'red-700'} px-4 py-3 rounded text-center`}>
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className={`text-2xl font-semibold ${darkMode ? 'text-teal-300' : 'text-navy-700'}`}>Analysis Results</h2>
                <div className="space-x-4">
                  <button
                    onClick={exportToPDF}
                    className={`bg-${darkMode ? 'gold-700' : 'gold-500'} hover:${darkMode ? 'bg-gold-800' : 'bg-gold-600'} text-white font-semibold py-2 px-4 rounded-lg transition-colors`}
                    aria-label="Export to PDF"
                  >
                    Export to PDF
                  </button>
                  <button
                    onClick={shareAnalysis}
                    className={`bg-${darkMode ? 'teal-700' : 'teal-600'} hover:${darkMode ? 'bg-teal-800' : 'bg-teal-700'} text-white font-semibold py-2 px-4 rounded-lg transition-colors`}
                    aria-label="Share analysis"
                  >
                    Share Link
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`bg-${darkMode ? 'gray-700' : 'navy-50'} p-5 rounded-lg shadow-md`}>
                  <p className="text-sm font-mono font-medium text-navy-700 flex items-center mb-2">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Resume Score
                  </p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>{result.score}</p>
                </div>
                <div className={`bg-${darkMode ? 'gray-700' : 'navy-50'} p-5 rounded-lg shadow-md`}>
                  <p className="text-sm font-mono font-medium text-navy-700 flex items-center mb-2">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Skills
                  </p>
                  <p className="text-base text-gray-800">{result.skills}</p>
                </div>
                <div className={`bg-${darkMode ? 'gray-700' : 'navy-50'} p-5 rounded-lg shadow-md`}>
                  <p className="text-sm font-mono font-medium text-navy-700 flex items-center mb-2">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Experience
                  </p>
                  <p className="text-base text-gray-800">{result.experience}</p>
                </div>
                <div className={`bg-${darkMode ? 'gray-700' : 'navy-50'} p-5 rounded-lg shadow-md`}>
                  <p className="text-sm font-mono font-medium text-navy-700 flex items-center mb-2">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.34V10a3 3 0 00-3-3H6a3 3 0 00-3 3v3.34m18 0A2.66 2.66 0 0118.66 16H5.34A2.66 2.66 0 013 13.34m2 5.66h14" />
                    </svg>
                    Possible Job Titles
                  </p>
                  <p className="text-base text-gray-800">{result.jobTitles}</p>
                </div>
              </div>
              <div className={`bg-${darkMode ? 'gray-700' : 'navy-50'} p-5 rounded-lg shadow-md`}>
                <p className="text-sm font-mono font-medium text-navy-700 flex items-center mb-2">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Suggestions to Improve
                </p>
                <ul className="list-disc pl-6 space-y-2 text-base text-red-600">
                  {result.suggestions.split(";").map((sugg: string, i: number) => (
                    <li key={i}>{sugg.trim()}</li>
                  ))}
                </ul>
              </div>
              <div className={`bg-${darkMode ? 'gray-700' : 'navy-50'} p-5 rounded-lg shadow-md`}>
                <p className="text-sm font-mono font-medium text-navy-700 flex items-center mb-2">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Elevator Pitch
                </p>
                <p className="text-base text-gray-800 italic">{result.elevatorPitch}</p>
              </div>
              <div className={`bg-${darkMode ? 'gray-700' : 'navy-50'} p-5 rounded-lg shadow-md`}>
                <p className="text-sm font-mono font-medium text-navy-700 flex items-center mb-2">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  ATS Keywords to Add
                </p>
                <p className="text-base text-gray-800">{result.atsKeywords}</p>
              </div>
              <div className={`bg-${darkMode ? 'gray-700' : 'navy-50'} p-5 rounded-lg shadow-md`}>
                <p className="text-sm font-mono font-medium text-navy-700 flex items-center mb-2">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Cover Letter Snippet
                </p>
                <p className="text-base text-gray-800 italic">{result.coverLetter}</p>
              </div>
              <div className={`bg-${darkMode ? 'gray-700' : 'navy-50'} p-5 rounded-lg shadow-md`}>
                <p className="text-sm font-mono font-medium text-navy-700 flex items-center mb-2">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Job Market Trends
                </p>
                <p className="text-base text-gray-800">{result.jobTrends}</p>
              </div>
              <div className={`bg-${darkMode ? 'gray-700' : 'navy-50'} p-5 rounded-lg shadow-md`}>
                <p className="text-sm font-mono font-medium text-navy-700 flex items-center mb-2">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Job Recommendations
                </p>
                {result.jobs && result.jobs.length > 0 ? (
                  <ul className="list-disc pl-6 space-y-2 text-base">
                    {result.jobs.map((job: any, i: number) => (
                      <li key={i}>
                        <strong>{job.position}</strong> at {job.company} - <a href={job.link} target="_blank" rel="noopener noreferrer" className={`text-${darkMode ? 'teal-400' : 'teal-600'} hover:underline`}>Apply Here</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={`text-${darkMode ? 'red-400' : 'red-600'} text-base`}>No job recommendations found.</p>
                )}
              </div>
              <div className={`bg-${darkMode ? 'gray-700' : 'navy-50'} p-5 rounded-lg shadow-md`}>
                <p className="text-sm font-mono font-medium text-navy-700 flex items-center mb-2">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Full AI Response
                </p>
                <div className={`bg-${darkMode ? 'gray-800' : 'white'} p-4 rounded border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap break-words">{result.fullResponse || "No response available"}</pre>
                </div>
              </div>
              <div className={`bg-${darkMode ? 'gray-700' : 'navy-50'} p-5 rounded-lg shadow-md`}>
                <p className="text-sm font-mono font-medium text-navy-700 mb-2">User Feedback</p>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleFeedback(star)}
                      className={`text-2xl ${star <= 3 ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-500`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`mt-4 px-4 py-2 rounded ${darkMode ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-700 hover:bg-gray-800'} text-white font-semibold`}
        >
          Toggle {darkMode ? 'Light' : 'Dark'} Mode
        </button>
      </div>
    </main>
  );
}