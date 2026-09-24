import React, { useState } from "react";
import { useResumeStore } from "../../store/useResumeStore";
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";

export const ProjectsEditor: React.FC = () => {
  const { resume, updateProfileData } = useResumeStore();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!resume) return null;
  const projects = resume.profileData?.projects || [];

  const handleUpdate = (index: number, field: string, value: any) => {
    const updated = [...projects];
    if (field === "technologies") {
      updated[index] = { ...updated[index], technologies: value.split(",").map((s: string) => s.trim()).filter(Boolean) };
    } else if (field === "bullets") {
      updated[index] = { ...updated[index], bullets: value.split("\n").filter((b: string) => b.trim() !== "") };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    updateProfileData("projects", updated);
  };

  const handleAdd = () => {
    const newProjects = [
      { id: crypto.randomUUID(), name: "New Project", description: "", technologies: [], url: "", bullets: [] },
      ...projects,
    ];
    updateProfileData("projects", newProjects);
    setExpandedIndex(0);
  };

  const handleDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = projects.filter((_, i) => i !== index);
    updateProfileData("projects", updated);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const inputClass = "w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-zinc-100 placeholder-zinc-600 transition-colors";
  const labelClass = "block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Projects</h3>
          <p className="text-xs text-zinc-500">Add side projects, open source, etc.</p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded hover:bg-indigo-500/20 transition-colors">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="space-y-3">
        {projects.map((proj, index) => (
          <div key={proj.id || index} className="border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/50 transition-colors" onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}>
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-zinc-600" />
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">{proj.name || "Untitled Project"}</h4>
                  <p className="text-xs text-zinc-500">{(proj.technologies || []).slice(0, 3).join(", ")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => handleDelete(index, e)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                {expandedIndex === index ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
              </div>
            </div>
            {expandedIndex === index && (
              <div className="p-4 border-t border-zinc-800 bg-zinc-950 space-y-4">
                <div>
                  <label className={labelClass}>Project Name</label>
                  <input type="text" value={proj.name || ""} onChange={(e) => handleUpdate(index, "name", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Technologies (comma-separated)</label>
                  <input type="text" value={(proj.technologies || []).join(", ")} onChange={(e) => handleUpdate(index, "technologies", e.target.value)} placeholder="React, Node.js, PostgreSQL" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>URL / Link</label>
                  <input type="text" value={(proj as any).url || ""} onChange={(e) => handleUpdate(index, "url", e.target.value)} placeholder="github.com/you/project" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea value={proj.description || ""} onChange={(e) => handleUpdate(index, "description", e.target.value)} rows={2} className={`${inputClass} resize-y`} />
                </div>
                <div>
                  <label className={labelClass}>Bullets (One per line)</label>
                  <textarea value={(proj.bullets || []).join("\n")} onChange={(e) => handleUpdate(index, "bullets", e.target.value)} rows={4} placeholder="2.3k GitHub stars..." className={`${inputClass} resize-y leading-relaxed`} />
                </div>
              </div>
            )}
          </div>
        ))}
        {projects.length === 0 && (
          <div className="text-center py-8 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-500 mb-2">No projects added yet.</p>
            <button onClick={handleAdd} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Add your first project</button>
          </div>
        )}
      </div>
    </div>
  );
};
