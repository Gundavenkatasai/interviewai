import React, { useState } from "react";
import {
  Award, Trophy, Bookmark, Globe, Heart, Languages, Sparkles,
  Plus, Trash2, Sliders
} from "lucide-react";

interface AdditionalSectionsEditorProps {
  sectionKey: "certifications" | "achievements" | "internships" | "publications" | "volunteer" | "languages" | "interests" | "custom";
  profileData: any;
  onChange: (field: string, value: any) => void;
}

export const AdditionalSectionsEditor: React.FC<AdditionalSectionsEditorProps> = ({
  sectionKey,
  profileData = {},
  onChange
}) => {
  // CERTIFICATIONS
  if (sectionKey === "certifications") {
    const certs: any[] = profileData.certifications || [];

    const handleAdd = () => {
      onChange("certifications", [
        ...certs,
        { id: String(Date.now()), name: "", issuer: "", date: "", url: "" }
      ]);
    };

    const handleUpdate = (idx: number, field: string, val: string) => {
      const list = [...certs];
      list[idx] = { ...list[idx], [field]: val };
      onChange("certifications", list);
    };

    const handleDelete = (idx: number) => {
      const list = [...certs];
      list.splice(idx, 1);
      onChange("certifications", list);
    };

    return (
      <div className="max-w-2xl mx-auto py-4 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              Certifications &amp; Licenses
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Industry certifications, cloud accreditations, and technical licenses.</p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {certs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs">
            No certifications added yet. Click &quot;Add&quot; to include AWS, Google Cloud, or other accreditations.
          </div>
        ) : (
          <div className="space-y-3">
            {certs.map((c, idx) => (
              <div key={c.id || idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">{c.name || "New Certification"}</span>
                  <button onClick={() => handleDelete(idx)} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Certification Name</label>
                    <input
                      type="text"
                      value={c.name || ""}
                      onChange={(e) => handleUpdate(idx, "name", e.target.value)}
                      placeholder="AWS Certified Solutions Architect"
                      className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Issuing Organization</label>
                    <input
                      type="text"
                      value={c.issuer || ""}
                      onChange={(e) => handleUpdate(idx, "issuer", e.target.value)}
                      placeholder="Amazon Web Services"
                      className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Issue Date</label>
                    <input
                      type="text"
                      value={c.date || ""}
                      onChange={(e) => handleUpdate(idx, "date", e.target.value)}
                      placeholder="2023"
                      className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Credential URL</label>
                    <input
                      type="url"
                      value={c.url || ""}
                      onChange={(e) => handleUpdate(idx, "url", e.target.value)}
                      placeholder="https://..."
                      className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ACHIEVEMENTS
  if (sectionKey === "achievements") {
    const list: any[] = profileData.achievements || [];

    const handleAdd = () => {
      onChange("achievements", [
        ...list,
        { id: String(Date.now()), title: "", description: "", date: "" }
      ]);
    };

    const handleUpdate = (idx: number, field: string, val: string) => {
      const updated = [...list];
      updated[idx] = { ...updated[idx], [field]: val };
      onChange("achievements", updated);
    };

    const handleDelete = (idx: number) => {
      const updated = [...list];
      updated.splice(idx, 1);
      onChange("achievements", updated);
    };

    return (
      <div className="max-w-2xl mx-auto py-4 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-400" />
              Achievements &amp; Honors
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Competitions, awards, hackathons, and technical recognition.</p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {list.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs">
            No achievements added. Include hackathons won, scholarships, or company awards.
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((item, idx) => (
              <div key={item.id || idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">{item.title || "Achievement"}</span>
                  <button onClick={() => handleDelete(idx)} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={item.title || ""}
                      onChange={(e) => handleUpdate(idx, "title", e.target.value)}
                      placeholder="1st Place, National Hackathon"
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                    <input
                      type="text"
                      value={item.date || ""}
                      onChange={(e) => handleUpdate(idx, "date", e.target.value)}
                      placeholder="Year / Date"
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={item.description || ""}
                    onChange={(e) => handleUpdate(idx, "description", e.target.value)}
                    placeholder="Brief description of the accomplishment and outcome..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // LANGUAGES
  if (sectionKey === "languages") {
    const list: any[] = profileData.languages || [];

    const handleAdd = () => {
      onChange("languages", [
        ...list,
        { id: String(Date.now()), language: "", proficiency: "Professional" }
      ]);
    };

    const handleUpdate = (idx: number, field: string, val: string) => {
      const updated = [...list];
      updated[idx] = { ...updated[idx], [field]: val };
      onChange("languages", updated);
    };

    const handleDelete = (idx: number) => {
      const updated = [...list];
      updated.splice(idx, 1);
      onChange("languages", updated);
    };

    return (
      <div className="max-w-2xl mx-auto py-4 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Languages className="w-5 h-5 text-indigo-400" />
              Spoken Languages
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Language proficiencies and bilingual capabilities.</p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        <div className="space-y-2">
          {list.map((l, idx) => (
            <div key={l.id || idx} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
              <input
                type="text"
                value={l.language || ""}
                onChange={(e) => handleUpdate(idx, "language", e.target.value)}
                placeholder="Language (e.g. English, Spanish, Mandarin)"
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
              <select
                value={l.proficiency || "Professional"}
                onChange={(e) => handleUpdate(idx, "proficiency", e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              >
                <option value="Native">Native</option>
                <option value="Fluent">Fluent</option>
                <option value="Professional">Professional</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Basic">Basic</option>
              </select>
              <button onClick={() => handleDelete(idx)} className="text-slate-500 hover:text-rose-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // DEFAULT / CUSTOM SECTION
  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      <div className="pb-3 border-b border-slate-800">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          Custom Section
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Add specialized entries or sections specific to your industry.</p>
      </div>
      <p className="text-xs text-slate-400">Section configured and maintained under canonical schema.</p>
    </div>
  );
};
