import React, { useState } from "react";
import {
  Briefcase, Plus, Trash2, Copy, ChevronUp, ChevronDown,
  Sparkles, Check, ArrowUp, ArrowDown, MapPin, Calendar, Building
} from "lucide-react";

interface ExperienceEditorProps {
  experience: any[];
  onChange: (newList: any[]) => void;
  onOpenAiBulletModal: (expIndex: number, bulletIndex: number, bulletText: string) => void;
}

export const ExperienceEditor: React.FC<ExperienceEditorProps> = ({
  experience = [],
  onChange,
  onOpenAiBulletModal
}) => {
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddExperience = () => {
    const newEntry = {
      id: String(Date.now()),
      company: "",
      role: "",
      location: "",
      startDate: "",
      endDate: "Present",
      current: true,
      description: "",
      bullets: [""]
    };
    onChange([newEntry, ...experience]);
  };

  const handleUpdateField = (index: number, field: string, value: any) => {
    const list = [...experience];
    list[index] = { ...list[index], [field]: value };
    onChange(list);
  };

  const handleDeleteExperience = (index: number) => {
    const list = [...experience];
    list.splice(index, 1);
    onChange(list);
  };

  const handleDuplicateExperience = (index: number) => {
    const source = experience[index];
    const cloned = {
      ...JSON.parse(JSON.stringify(source)),
      id: String(Date.now()),
      company: `${source.company || "Company"} (Copy)`
    };
    const list = [...experience];
    list.splice(index + 1, 0, cloned);
    onChange(list);
  };

  const handleMoveExperience = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === experience.length - 1) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const list = [...experience];
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);
    onChange(list);
  };

  // Bullet manipulation
  const handleAddBullet = (expIndex: number) => {
    const list = [...experience];
    const bullets = [...(list[expIndex].bullets || []), ""];
    list[expIndex] = { ...list[expIndex], bullets };
    onChange(list);
  };

  const handleUpdateBullet = (expIndex: number, bulletIndex: number, text: string) => {
    const list = [...experience];
    const bullets = [...(list[expIndex].bullets || [])];
    bullets[bulletIndex] = text;
    list[expIndex] = { ...list[expIndex], bullets };
    onChange(list);
  };

  const handleRemoveBullet = (expIndex: number, bulletIndex: number) => {
    const list = [...experience];
    const bullets = [...(list[expIndex].bullets || [])];
    bullets.splice(bulletIndex, 1);
    list[expIndex] = { ...list[expIndex], bullets };
    onChange(list);
  };

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            Work Experience
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Add your professional career history. Highlight measurable outcomes and technical ownership.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddExperience}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Experience
        </button>
      </div>

      {experience.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
          <Briefcase className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No experience entries added yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Professional experience is the primary weighting factor for ATS ranking algorithms.
          </p>
          <button
            type="button"
            onClick={handleAddExperience}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            + Add Your First Role
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {experience.map((exp, expIdx) => {
            const isCollapsed = Boolean(collapsedCards[exp.id || String(expIdx)]);

            return (
              <div
                key={exp.id || expIdx}
                className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-lg shadow-black/20 transition-all"
              >
                {/* Card Header Bar */}
                <div className="p-4 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleCollapse(exp.id || String(expIdx))}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {exp.role || "Untitled Role"}
                        <span className="text-slate-400 font-normal"> @ {exp.company || "Company"}</span>
                      </h4>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {exp.startDate || "Start"} — {exp.endDate || (exp.current ? "Present" : "End")}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions: Reorder, Duplicate, Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveExperience(expIdx, "up")}
                      disabled={expIdx === 0}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800 transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveExperience(expIdx, "down")}
                      disabled={expIdx === experience.length - 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800 transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateExperience(expIdx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteExperience(expIdx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Card Body */}
                {!isCollapsed && (
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300">Job Title / Role *</label>
                        <input
                          type="text"
                          value={exp.role || ""}
                          onChange={(e) => handleUpdateField(expIdx, "role", e.target.value)}
                          placeholder="e.g. Senior Backend Engineer"
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300">Company Name *</label>
                        <input
                          type="text"
                          value={exp.company || ""}
                          onChange={(e) => handleUpdateField(expIdx, "company", e.target.value)}
                          placeholder="e.g. Stripe, Inc."
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300">Location</label>
                        <input
                          type="text"
                          value={exp.location || ""}
                          onChange={(e) => handleUpdateField(expIdx, "location", e.target.value)}
                          placeholder="e.g. San Francisco, CA or Remote"
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300">Start Date</label>
                          <input
                            type="text"
                            value={exp.startDate || ""}
                            onChange={(e) => handleUpdateField(expIdx, "startDate", e.target.value)}
                            placeholder="Jan 2023"
                            className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                            <span>End Date</span>
                            <label className="flex items-center gap-1 text-[10px] text-indigo-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(exp.current)}
                                onChange={(e) => {
                                  handleUpdateField(expIdx, "current", e.target.checked);
                                  if (e.target.checked) handleUpdateField(expIdx, "endDate", "Present");
                                }}
                                className="rounded bg-slate-900 border-slate-800 text-indigo-600"
                              />
                              Current
                            </label>
                          </label>
                          <input
                            type="text"
                            disabled={Boolean(exp.current)}
                            value={exp.current ? "Present" : exp.endDate || ""}
                            onChange={(e) => handleUpdateField(expIdx, "endDate", e.target.value)}
                            placeholder="Present"
                            className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bullets List */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Accomplishments / Bullet Points
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddBullet(expIdx)}
                          className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Bullet
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {(exp.bullets || []).map((bullet: string, bIdx: number) => (
                          <div key={bIdx} className="flex items-start gap-2 group">
                            <span className="text-slate-500 font-mono mt-2 text-[10px]">•</span>
                            <div className="flex-1 relative">
                              <textarea
                                rows={2}
                                value={bullet}
                                onChange={(e) => handleUpdateBullet(expIdx, bIdx, e.target.value)}
                                placeholder="Describe your specific technical responsibility, action, and measured result..."
                                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs leading-relaxed focus:outline-none focus:border-indigo-500 transition-colors"
                              />
                            </div>
                            <div className="flex flex-col gap-1 shrink-0 pt-1">
                              <button
                                type="button"
                                onClick={() => onOpenAiBulletModal(expIdx, bIdx, bullet)}
                                className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                                title="AI Improve Bullet"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveBullet(expIdx, bIdx)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                                title="Remove bullet"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
