import React from "react";
import { useResumeStore } from "../../store/useResumeStore";

export const SkillsEditor: React.FC = () => {
  const { resume, updateProfileData } = useResumeStore();

  if (!resume) return null;
  const skills = resume.profileData?.skills || { technical: [], languages: [], frameworks: [], tools: [], soft: [] };

  const handleChange = (category: string, value: string) => {
    // Split by comma, trim whitespace, remove empty strings
    const newArray = value.split(",").map(s => s.trim()).filter(s => s !== "");
    updateProfileData(`skills.${category}`, newArray);
  };

  const joinSkills = (arr: string[]) => {
    return arr ? arr.join(", ") : "";
  };

  const inputClass = "w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-zinc-100 placeholder-zinc-600 transition-colors resize-none";
  const labelClass = "block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100 mb-1">Skills &amp; Expertise</h3>
        <p className="text-xs text-zinc-500 mb-4">
          Enter your skills as a comma-separated list.
        </p>
      </div>

      <div>
        <label className={labelClass}>Technical Skills</label>
        <textarea
          value={joinSkills(skills.technical)}
          onChange={(e) => handleChange("technical", e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="e.g. JavaScript, Python, SQL"
        />
      </div>

      <div>
        <label className={labelClass}>Frameworks &amp; Libraries</label>
        <textarea
          value={joinSkills(skills.frameworks)}
          onChange={(e) => handleChange("frameworks", e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="e.g. React, Node.js, Django"
        />
      </div>

      <div>
        <label className={labelClass}>Tools &amp; Platforms</label>
        <textarea
          value={joinSkills(skills.tools)}
          onChange={(e) => handleChange("tools", e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="e.g. Git, Docker, AWS"
        />
      </div>

      <div>
        <label className={labelClass}>Spoken Languages</label>
        <input
          type="text"
          value={joinSkills(skills.languages)}
          onChange={(e) => handleChange("languages", e.target.value)}
          className={inputClass}
          placeholder="e.g. English, Spanish"
        />
      </div>

      <div>
        <label className={labelClass}>Soft Skills</label>
        <input
          type="text"
          value={joinSkills(skills.soft)}
          onChange={(e) => handleChange("soft", e.target.value)}
          className={inputClass}
          placeholder="e.g. Leadership, Communication"
        />
      </div>
    </div>
  );
};
