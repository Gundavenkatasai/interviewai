import React from "react";
import { useResumeStore } from "../../store/useResumeStore";

export const BasicsEditor: React.FC = () => {
  const { resume, updateProfileData } = useResumeStore();

  if (!resume) return null;
  const { personal } = resume.profileData;

  const handleChange = (field: string, value: string) => {
    updateProfileData(`personal.${field}`, value);
  };

  const inputClass = "w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-zinc-100 placeholder-zinc-600 transition-colors";
  const labelClass = "block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider";

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Full Name</label>
        <input 
          type="text" 
          value={personal.fullName || ""} 
          onChange={(e) => handleChange("fullName", e.target.value)}
          className={inputClass}
          placeholder="e.g. Jane Doe"
        />
      </div>

      <div>
        <label className={labelClass}>Professional Title</label>
        <input 
          type="text" 
          value={personal.professionalTitle || ""} 
          onChange={(e) => handleChange("professionalTitle", e.target.value)}
          className={inputClass}
          placeholder="e.g. Senior Software Engineer"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Email</label>
          <input 
            type="email" 
            value={personal.email || ""} 
            onChange={(e) => handleChange("email", e.target.value)}
            className={inputClass}
            placeholder="jane@example.com"
          />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input 
            type="text" 
            value={personal.phone || ""} 
            onChange={(e) => handleChange("phone", e.target.value)}
            className={inputClass}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Location</label>
        <input 
          type="text" 
          value={personal.location || ""} 
          onChange={(e) => handleChange("location", e.target.value)}
          className={inputClass}
          placeholder="e.g. San Francisco, CA"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>LinkedIn</label>
          <input 
            type="text" 
            value={personal.linkedin || ""} 
            onChange={(e) => handleChange("linkedin", e.target.value)}
            className={inputClass}
            placeholder="linkedin.com/in/janedoe"
          />
        </div>
        <div>
          <label className={labelClass}>GitHub</label>
          <input 
            type="text" 
            value={personal.github || ""} 
            onChange={(e) => handleChange("github", e.target.value)}
            className={inputClass}
            placeholder="github.com/janedoe"
          />
        </div>
      </div>
      
      <div>
        <label className={labelClass}>Portfolio / Website</label>
        <input 
          type="text" 
          value={personal.website || personal.portfolio || ""} 
          onChange={(e) => handleChange("website", e.target.value)}
          className={inputClass}
          placeholder="janedoe.com"
        />
      </div>
    </div>
  );
};
