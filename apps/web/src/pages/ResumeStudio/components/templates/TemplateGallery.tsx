import React from "react";
import { Check, Sparkles, Shield, Cpu, Layout, FileText, Compass } from "lucide-react";

interface TemplateGalleryProps {
  currentTemplate: string;
  onSelectTemplate: (templateId: string) => void;
}

export const TEMPLATES = [
  {
    id: "ats_classic",
    name: "ATS Classic",
    category: "ATS",
    description: "Standard single-column format optimized for 100% parsing fidelity with legacy and modern ATS systems.",
    icon: Shield,
    badge: "Recommended for ATS",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  },
  {
    id: "modern_dev",
    name: "Modern Developer",
    category: "Modern",
    description: "High-contrast headings, technology badges, and clean visual hierarchy tailored for software engineers.",
    icon: Cpu,
    badge: "Popular with Tech",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
  },
  {
    id: "minimal",
    name: "Minimalist",
    category: "Minimal",
    description: "Subtle typography with spacious margins. Lets your accomplishments breathe without visual distraction.",
    icon: FileText,
    badge: "Clean & Elegant",
    badgeColor: "bg-slate-500/10 text-slate-300 border-slate-500/20"
  },
  {
    id: "executive",
    name: "Executive Leader",
    category: "Executive",
    description: "Authoritative header band and formal structure emphasizing strategic achievements and business impact.",
    icon: Compass,
    badge: "Senior & Staff",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20"
  },
  {
    id: "technical",
    name: "Terminal Technical",
    category: "Technical",
    description: "Monospaced accents, front-loaded tech stack block, and syntax-inspired headers.",
    icon: Cpu,
    badge: "Systems & Backend",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  },
  {
    id: "two_column",
    name: "Two Column Grid",
    category: "Modern",
    description: "Side column dedicated to skills, contact, and education, maximizing vertical space for project bullets.",
    icon: Layout,
    badge: "Compact Layout",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  },
  {
    id: "creative",
    name: "Creative Accent",
    category: "Creative",
    description: "Sophisticated top gradient band, portfolio highlights, and contemporary typography styling.",
    icon: Sparkles,
    badge: "Product & Frontend",
    badgeColor: "bg-pink-500/10 text-pink-400 border-pink-500/20"
  }
];

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  currentTemplate,
  onSelectTemplate
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Layout className="w-5 h-5 text-indigo-400" />
          Resume Template Gallery
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Choose a design. Switching templates alters presentation only — all your resume content, bullets, and section ordering are preserved.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TEMPLATES.map((tpl) => {
          const isSelected = (currentTemplate || "ats_classic").toLowerCase() === tpl.id;
          const Icon = tpl.icon;

          return (
            <div
              key={tpl.id}
              onClick={() => onSelectTemplate(tpl.id)}
              className={`relative cursor-pointer rounded-2xl p-5 border transition-all ${
                isSelected
                  ? "bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${isSelected ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400" : "bg-slate-800/80 border-slate-700 text-slate-400"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{tpl.name}</h3>
                    <span className="text-[10px] text-slate-500 font-medium uppercase">{tpl.category}</span>
                  </div>
                </div>
                {isSelected && (
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-4">{tpl.description}</p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tpl.badgeColor}`}>
                  {tpl.badge}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTemplate(tpl.id);
                  }}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {isSelected ? "Active" : "Apply"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
