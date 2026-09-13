import React, { useState } from "react";
import { FolderGit2, Plus, Trash2, Copy, Sparkles, ExternalLink, Github } from "lucide-react";

interface ProjectsEditorProps {
  projects: any[];
  onChange: (newList: any[]) => void;
  onOpenAiProjectModal?: (projIndex: number) => void;
}

export const ProjectsEditor: React.FC<ProjectsEditorProps> = ({
  projects = [],
  onChange,
  onOpenAiProjectModal
}) => {
  const handleAddProject = () => {
    const newProj = {
      id: String(Date.now()),
      name: "",
      description: "",
      technologies: [],
      url: "",
      bullets: [""]
    };
    onChange([newProj, ...projects]);
  };

  const handleUpdate = (index: number, field: string, value: any) => {
    const list = [...projects];
    list[index] = { ...list[index], [field]: value };
    onChange(list);
  };

  const handleDelete = (index: number) => {
    const list = [...projects];
    list.splice(index, 1);
    onChange(list);
  };

  const handleUpdateTech = (index: number, rawText: string) => {
    const techs = rawText.split(",").map((t) => t.trim()).filter(Boolean);
    handleUpdate(index, "technologies", techs);
  };

  const handleAddBullet = (projIndex: number) => {
    const list = [...projects];
    const bullets = [...(list[projIndex].bullets || []), ""];
    list[projIndex] = { ...list[projIndex], bullets };
    onChange(list);
  };

  const handleUpdateBullet = (projIndex: number, bulletIndex: number, text: string) => {
    const list = [...projects];
    const bullets = [...(list[projIndex].bullets || [])];
    bullets[bulletIndex] = text;
    list[projIndex] = { ...list[projIndex], bullets };
    onChange(list);
  };

  const handleRemoveBullet = (projIndex: number, bulletIndex: number) => {
    const list = [...projects];
    const bullets = [...(list[projIndex].bullets || [])];
    bullets.splice(bulletIndex, 1);
    list[projIndex] = { ...list[projIndex], bullets };
    onChange(list);
  };

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-indigo-400" />
            Key Projects
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Demonstrate your architectural depth, technical stacks, and production deliverables.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddProject}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
          <FolderGit2 className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No featured projects listed</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Adding 1–3 technical projects significantly strengthens ATS keyword coverage.
          </p>
          <button
            type="button"
            onClick={handleAddProject}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            + Add Project
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((proj, pIdx) => (
            <div
              key={proj.id || pIdx}
              className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg shadow-black/20"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold text-white">
                  {proj.name || "Untitled Project"}
                </span>
                <div className="flex items-center gap-1">
                  {onOpenAiProjectModal && (
                    <button
                      type="button"
                      onClick={() => onOpenAiProjectModal(pIdx)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" /> AI Improve
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(pIdx)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Project Name *</label>
                  <input
                    type="text"
                    value={proj.name || ""}
                    onChange={(e) => handleUpdate(pIdx, "name", e.target.value)}
                    placeholder="e.g. Distributed Cache Proxy"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Live URL or Repository</label>
                  <input
                    type="url"
                    value={proj.url || ""}
                    onChange={(e) => handleUpdate(pIdx, "url", e.target.value)}
                    placeholder="https://github.com/username/project"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Technologies Used (comma separated)
                  </label>
                  <input
                    type="text"
                    value={(proj.technologies || []).join(", ")}
                    onChange={(e) => handleUpdateTech(pIdx, e.target.value)}
                    placeholder="e.g. React, TypeScript, Node.js, Redis, Docker"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-300">Brief Overview</label>
                  <input
                    type="text"
                    value={proj.description || ""}
                    onChange={(e) => handleUpdate(pIdx, "description", e.target.value)}
                    placeholder="e.g. High-throughput distributed caching service handling concurrent requests"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Project Bullets */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Key Features / Bullets
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddBullet(pIdx)}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Bullet
                  </button>
                </div>

                <div className="space-y-2">
                  {(proj.bullets || []).map((bullet: string, bIdx: number) => (
                    <div key={bIdx} className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-[10px]">•</span>
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => handleUpdateBullet(pIdx, bIdx, e.target.value)}
                        placeholder="Architected the microservices ingestion pipeline with automatic retry..."
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveBullet(pIdx, bIdx)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
