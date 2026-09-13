import React, { useState } from "react";
import { Wrench, Plus, X, Sparkles, Check, Tag } from "lucide-react";

interface SkillsEditorProps {
  skills: {
    technical?: string[];
    languages?: string[];
    frameworks?: string[];
    databases?: string[];
    cloud?: string[];
    tools?: string[];
    soft?: string[];
  };
  onChange: (newSkills: any) => void;
  targetRole: string;
}

export const SkillsEditor: React.FC<SkillsEditorProps> = ({
  skills = {},
  onChange,
  targetRole
}) => {
  const [inputs, setInputs] = useState<Record<string, string>>({
    languages: "",
    frameworks: "",
    databases: "",
    cloud: "",
    tools: "",
    technical: "",
    soft: ""
  });

  const categories = [
    { key: "languages", label: "Programming Languages", placeholder: "TypeScript, Python, Java, Go..." },
    { key: "frameworks", label: "Frameworks & Libraries", placeholder: "React, Next.js, Node.js, Fastify..." },
    { key: "databases", label: "Databases & Storage", placeholder: "PostgreSQL, MongoDB, Redis, SQLite..." },
    { key: "cloud", label: "Cloud & DevOps", placeholder: "AWS, Docker, Kubernetes, CI/CD, Terraform..." },
    { key: "tools", label: "Developer Tools", placeholder: "Git, Vite, Webpack, Postman, Jest..." },
    { key: "technical", label: "Core Technical Concepts", placeholder: "REST APIs, System Design, Microservices, OAuth..." },
    { key: "soft", label: "Soft Skills & Leadership", placeholder: "Cross-functional Collaboration, Agile, Mentorship..." }
  ];

  // Helper to add skill token
  const addSkill = (category: string, token: string) => {
    const trimmed = token.trim();
    if (!trimmed) return;
    const currentList: string[] = (skills as any)[category] || [];

    // Duplicate detection (case-insensitive)
    if (currentList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }

    const updated = [...currentList, trimmed];
    onChange({ ...skills, [category]: updated });
    setInputs((prev) => ({ ...prev, [category]: "" }));
  };

  // Helper to remove skill
  const removeSkill = (category: string, index: number) => {
    const currentList: string[] = [...((skills as any)[category] || [])];
    currentList.splice(index, 1);
    onChange({ ...skills, [category]: currentList });
  };

  // Curated target role suggestions (differentiated from already possessed skills)
  const roleSuggestions: Record<string, { category: string; skill: string }[]> = {
    engineer: [
      { category: "languages", skill: "TypeScript" },
      { category: "frameworks", skill: "React" },
      { category: "frameworks", skill: "Node.js" },
      { category: "databases", skill: "PostgreSQL" },
      { category: "cloud", skill: "Docker" },
      { category: "cloud", skill: "AWS" },
      { category: "tools", skill: "Git" },
      { category: "technical", skill: "REST APIs" }
    ]
  };

  const currentSuggestions = roleSuggestions.engineer;

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      <div className="pb-3 border-b border-slate-800">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Wrench className="w-5 h-5 text-indigo-400" />
          Technical Skills &amp; Proficiencies
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Categorized skills ensure ATS parsers properly index programming languages, frameworks, and cloud competencies.
        </p>
      </div>

      {/* Suggested Skills for Target Role */}
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
          <Sparkles className="w-3.5 h-3.5" />
          Commonly In-Demand Skills for {targetRole}
        </div>
        <p className="text-[11px] text-slate-300">
          Click <strong className="text-white">+ Add</strong> only if you have genuine hands-on experience with the technology:
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {currentSuggestions.map((rec) => {
            const list: string[] = (skills as any)[rec.category] || [];
            const alreadyHas = list.some((s) => s.toLowerCase() === rec.skill.toLowerCase());

            if (alreadyHas) {
              return (
                <span
                  key={rec.skill}
                  className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> {rec.skill}
                </span>
              );
            }

            return (
              <button
                key={rec.skill}
                type="button"
                onClick={() => addSkill(rec.category, rec.skill)}
                className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-900 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/20 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> {rec.skill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const list: string[] = (skills as any)[cat.key] || [];

          return (
            <div
              key={cat.key}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  {cat.label}
                  <span className="text-[10px] text-slate-500 font-mono font-normal">
                    ({list.length})
                  </span>
                </label>
              </div>

              {/* Tag Pills */}
              <div className="flex flex-wrap gap-1.5 min-h-[30px]">
                {list.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(cat.key, sIdx)}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove skill"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {list.length === 0 && (
                  <span className="text-[11px] text-slate-600 italic">No items added yet</span>
                )}
              </div>

              {/* Input for adding new tag */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={inputs[cat.key] || ""}
                  onChange={(e) => setInputs({ ...inputs, [cat.key]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addSkill(cat.key, inputs[cat.key]);
                    }
                  }}
                  placeholder={cat.placeholder}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => addSkill(cat.key, inputs[cat.key])}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
