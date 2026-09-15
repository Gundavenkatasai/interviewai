import React from "react";
import { useResumeStore } from "../../store/useResumeStore";

export const SummaryEditor: React.FC = () => {
  const { resume, updateProfileData } = useResumeStore();

  if (!resume) return null;
  const summary = resume.profileData.summary || "";

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Professional Summary</label>
        <p className="text-xs text-zinc-500 mb-4">
          Write a short, impactful summary highlighting your most valuable skills and experience.
        </p>
        <textarea
          value={summary}
          onChange={(e) => updateProfileData("summary", e.target.value)}
          rows={10}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-zinc-100 placeholder-zinc-600 transition-colors resize-none leading-relaxed"
          placeholder="e.g. Results-driven Software Engineer with 5+ years of experience in building scalable web applications..."
        />
      </div>
    </div>
  );
};
