import React from "react";
import { CheckCircle2, AlertTriangle, Layers, FileText } from "lucide-react";

export const TEMPLATES = [
  {
    id: "ats_classic",
    name: "ATS Classic",
    description: "A conservative, single-column template with strong typography and standard hierarchy.",
    category: "ATS_SAFE",
    risk: "LOW",
    columns: 1
  },
  {
    id: "ats_compact",
    name: "ATS Compact",
    description: "A single-column template with tighter spacing, optimized for experienced candidates.",
    category: "ATS_SAFE",
    risk: "LOW",
    columns: 1
  },
  {
    id: "professional",
    name: "Professional",
    description: "A polished template with subtle layout enhancements for SaaS and corporate roles.",
    category: "PROFESSIONAL",
    risk: "LOW",
    columns: 1
  },
  {
    id: "executive",
    name: "Executive",
    description: "Premium typography with restrained visual treatment for senior professionals.",
    category: "EXECUTIVE",
    risk: "LOW",
    columns: 1
  },
  {
    id: "modern_ats",
    name: "Modern ATS",
    description: "A contemporary design with clear hierarchy and minimal accent usage.",
    category: "MODERN",
    risk: "LOW",
    columns: 1
  }
];

interface Props {
  selectedTemplate: string;
  onSelect: (id: string) => void;
}

export const TemplateGallery: React.FC<Props> = ({ selectedTemplate, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`flex flex-col text-left border rounded-xl p-4 transition-all ${
            selectedTemplate === t.id 
              ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20" 
              : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800"
          }`}
        >
          <div className="flex justify-between items-start w-full mb-3">
            <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
              <Layers className="w-5 h-5" />
            </div>
            {selectedTemplate === t.id && (
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            )}
          </div>
          
          <h3 className="font-bold text-white mb-1">{t.name}</h3>
          <p className="text-xs text-slate-400 mb-4 flex-1">{t.description}</p>
          
          <div className="flex gap-2 text-[10px] font-bold mt-auto w-full">
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {t.columns} COLUMN
            </span>
            <span className={`px-2 py-1 rounded border ${
              t.risk === "LOW" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              {t.risk} ATS RISK
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};
