"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Briefcase, FileText } from "lucide-react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl w-full bg-white shadow-2xl rounded-3xl p-10"
      >
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-3">
            🚀 AI Resume Analyzer & Job Matcher
          </h1>
          <p className="text-gray-600 text-lg">
            Upload your resume 📄 and let AI give you career insights 💡
            and suggest real jobs from top companies 💼
          </p>
        </div>

        {/* Upload Box */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer"
        >
          <Upload size={40} className="text-blue-600 mb-3" />
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="text-blue-600 font-semibold cursor-pointer"
          >
            {selectedFile ? selectedFile.name : "Click to upload your resume (JPG/PNG)"}
          </label>
        </motion.div>

        {/* Analyze Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition"
        >
          {loading ? "🔎 Analyzing Resume..." : "✨ Analyze Resume"}
        </button>

        {/* Results Section */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mt-8 space-y-6"
          >
            {/* AI Analysis */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-5 rounded-lg shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="text-blue-600" />
                <h2 className="text-xl font-bold text-blue-700">
                  AI Resume Analysis
                </h2>
              </div>
              <pre className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                {result.analysis}
              </pre>
            </div>

            {/* Job Matches */}
            <div className="bg-green-50 border-l-4 border-green-600 p-5 rounded-lg shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="text-green-600" />
                <h2 className="text-xl font-bold text-green-700">
                  Job Matches
                </h2>
              </div>
              <ul className="space-y-3">
                {result.jobs?.map((job: any, i: number) => (
                  <li
                    key={i}
                    className="p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition"
                  >
                    <a
                      href={job.url}
                      target="_blank"
                      className="text-blue-600 font-medium"
                    >
                      {job.title}
                    </a>{" "}
                    <span className="text-gray-700">
                      at {job.company} ({job.location})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
