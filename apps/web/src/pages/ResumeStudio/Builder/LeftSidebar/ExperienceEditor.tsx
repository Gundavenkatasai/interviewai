import React, { useState } from "react";
import { useResumeStore } from "../../store/useResumeStore";
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";

export const ExperienceEditor: React.FC = () => {
  const { resume, updateProfileData } = useResumeStore();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!resume) return null;
  const experiences = resume.profileData?.experience || [];

  const handleUpdate = (index: number, field: string, value: any) => {
    const newExp = [...experiences];
    if (field === "bullets") {
      newExp[index] = { ...newExp[index], [field]: value.split("\n").filter((b: string) => b.trim() !== "") };
    } else {
      newExp[index] = { ...newExp[index], [field]: value };
    }
    updateProfileData("experience", newExp);
  };

  const handleAdd = () => {
    const newExp = [
      {
        id: crypto.randomUUID(),
        company: "New Company",
        role: "Title",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
        bullets: []
      },
      ...experiences
    ];
    updateProfileData("experience", newExp);
    setExpandedIndex(0);
  };

  const handleDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExp = experiences.filter((_, i) => i !== index);
    updateProfileData("experience", newExp);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const inputClass = "w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-zinc-100 placeholder-zinc-600 transition-colors";
  const labelClass = "block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Work Experience</h3>
          <p className="text-xs text-zinc-500">Add your professional experience.</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded hover:bg-indigo-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="space-y-3">
        {experiences.map((exp, index) => (
          <div key={exp.id || index} className="border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden shadow-sm">
            {/* Header / Accordion Toggle */}
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/50 transition-colors"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-zinc-600" />
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">{exp.role || "Untitled Role"}</h4>
                  <p className="text-xs text-zinc-500">{exp.company || "Company"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => handleDelete(index, e)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {expandedIndex === index ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
              </div>
            </div>

            {/* Body */}
            {expandedIndex === index && (
              <div className="p-4 border-t border-zinc-800 bg-zinc-950 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Company</label>
                    <input 
                      type="text" 
                      value={exp.company || ""} 
                      onChange={(e) => handleUpdate(index, "company", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Job Title</label>
                    <input 
                      type="text" 
                      value={exp.role || ""} 
                      onChange={(e) => handleUpdate(index, "role", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Start Date</label>
                    <input 
                      type="text" 
                      value={exp.startDate || ""} 
                      onChange={(e) => handleUpdate(index, "startDate", e.target.value)}
                      placeholder="e.g. Jan 2020"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>End Date</label>
                    <div className="flex flex-col space-y-2">
                      <input 
                        type="text" 
                        value={exp.endDate || ""} 
                        disabled={exp.current}
                        onChange={(e) => handleUpdate(index, "endDate", e.target.value)}
                        placeholder="e.g. Present"
                        className={`${inputClass} disabled:bg-zinc-900/50 disabled:text-zinc-600 disabled:border-zinc-800/50`}
                      />
                      <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={exp.current} 
                          onChange={(e) => handleUpdate(index, "current", e.target.checked)}
                          className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-950"
                        />
                        I currently work here
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Location</label>
                  <input 
                    type="text" 
                    value={exp.location || ""} 
                    onChange={(e) => handleUpdate(index, "location", e.target.value)}
                    placeholder="e.g. Remote, San Francisco"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Description (Optional)</label>
                  <textarea 
                    value={exp.description || ""} 
                    onChange={(e) => handleUpdate(index, "description", e.target.value)}
                    rows={2}
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Bullets (One per line)</label>
                  <textarea 
                    value={(exp.bullets || []).join("\n")} 
                    onChange={(e) => handleUpdate(index, "bullets", e.target.value)}
                    rows={5}
                    placeholder="Led development of..."
                    className={`${inputClass} resize-y leading-relaxed`}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
        {experiences.length === 0 && (
          <div className="text-center py-8 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-500 mb-2">No work experience added yet.</p>
            <button
              onClick={handleAdd}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Add your first role
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
