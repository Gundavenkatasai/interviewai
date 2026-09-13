import React, { useState } from "react";
import {
  Sparkles, X, Check, AlertTriangle, RefreshCw, Layers
} from "lucide-react";
import { ApiClient } from "../../../../lib/api";

interface AIResumeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (newResume: any) => void;
}

export const AIResumeGeneratorModal: React.FC<AIResumeGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGenerated,
}) => {
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [skills, setSkills] = useState("");
  const [experienceBrief, setExperienceBrief] = useState("");
  const [educationBrief, setEducationBrief] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!targetRole.trim()) {
      setError("Please specify your target role or career goal.");
      return;
    }
    if (!skills.trim() && !experienceBrief.trim()) {
      setError("Please provide at least some skills or brief experience notes.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.generateAIResume({
        targetRole,
        experienceLevel,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        experienceBrief,
        educationBrief,
        jobDescription: jobDescription.trim() || undefined,
      });

      if (res?.resume) {
        onGenerated(res.resume);
        onClose();
      } else {
        throw new Error(res?.message || "Failed to generate structured resume.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate AI resume.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-slate-100">AI Resume Generator</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Provide your real background parameters. The AI generator will construct a fully structured resume adhering to strict ATS standards. It will not fabricate unverified companies or false qualifications.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Role / Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Seniority Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="entry">Entry-Level / Junior (0-2 years)</option>
                <option value="mid">Mid-Level (2-5 years)</option>
                <option value="senior">Senior (5-8 years)</option>
                <option value="lead">Lead / Principal (8+ years)</option>
                <option value="executive">Executive / Director</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Core Skills & Tools <span className="text-rose-400">*</span> (comma separated)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. TypeScript, Node.js, PostgreSQL, Docker, AWS, React"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Brief Experience Summary / Companies
            </label>
            <textarea
              rows={3}
              value={experienceBrief}
              onChange={(e) => setExperienceBrief(e.target.value)}
              placeholder="e.g. 3 years at FinTech Corp as Full Stack Dev building payment microservices; 2 years at StartupXYZ building customer portal..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Education Notes
            </label>
            <input
              type="text"
              value={educationBrief}
              onChange={(e) => setEducationBrief(e.target.value)}
              placeholder="e.g. B.Tech Computer Science, Anna University (2020-2024)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Target Job Description <span className="text-slate-500">(Optional — for tailored keywords)</span>
            </label>
            <textarea
              rows={3}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job posting requirements if tailoring for a specific job..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Generating Structured Resume..." : "Generate AI Resume"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
