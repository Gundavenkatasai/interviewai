import React from "react";
import { useResumeStore } from "../../store/useResumeStore";
import { Plus, Trash2 } from "lucide-react";

const FLUENCY_LEVELS = ["Native", "Fluent", "Professional", "Conversational", "Elementary"];

export const LanguagesEditor: React.FC = () => {
  const { resume, updateProfileData } = useResumeStore();

  if (!resume) return null;
  const languages = (resume.profileData?.languages as any[]) || [];

  const handleUpdate = (index: number, field: string, value: string) => {
    const updated = [...languages];
    updated[index] = { ...updated[index], [field]: value };
    updateProfileData("languages", updated);
  };

  const handleAdd = () => {
    const newLangs = [...languages, { id: crypto.randomUUID(), name: "English", fluency: "Native" }];
    updateProfileData("languages", newLangs);
  };

  const handleDelete = (index: number) => {
    const updated = languages.filter((_, i) => i !== index);
    updateProfileData("languages", updated);
  };

  const inputClass = "w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-zinc-100 placeholder-zinc-600 transition-colors outline-none";
  const labelClass = "block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Languages</h3>
          <p className="text-xs text-zinc-500">Add spoken languages and proficiency levels.</p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded hover:bg-indigo-500/20 transition-colors">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="space-y-3">
        {languages.map((lang: any, index: number) => (
          <div key={lang.id || index} className="flex items-center gap-3 p-3 border border-zinc-800 rounded-lg bg-zinc-900">
            <div className="flex-1">
              <input
                type="text"
                value={lang.name || ""}
                onChange={(e) => handleUpdate(index, "name", e.target.value)}
                placeholder="e.g. Spanish"
                className={inputClass}
              />
            </div>
            <div className="w-40">
              <select
                value={lang.fluency || "Fluent"}
                onChange={(e) => handleUpdate(index, "fluency", e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 outline-none"
              >
                {FLUENCY_LEVELS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <button onClick={() => handleDelete(index)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {languages.length === 0 && (
          <div className="text-center py-8 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-500 mb-2">No languages added yet.</p>
            <button onClick={handleAdd} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Add a language</button>
          </div>
        )}
      </div>
    </div>
  );
};
