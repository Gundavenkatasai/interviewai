import React from "react";
import {
  FileText, ShieldCheck, Target, Sparkles, Palette, Plus,
  Upload, Wand2, Clock, CheckCircle2, ArrowRight, ExternalLink
} from "lucide-react";

interface OverviewWorkspaceProps {
  resume: any;
  allResumes: any[];
  onSelectResume: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  onCreateNew: () => void;
  onImport: () => void;
  onAiGenerate: () => void;
}

export const OverviewWorkspace: React.FC<OverviewWorkspaceProps> = ({
  resume,
  allResumes,
  onSelectResume,
  onNavigateTab,
  onCreateNew,
  onImport,
  onAiGenerate
}) => {
  if (!resume) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-xl shadow-indigo-500/10">
          <FileText className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Create your first resume</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Build a targeted, ATS-optimized resume from scratch, import from your existing PDF/Word file, or generate with AI based on your experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left">
          <button
            onClick={onCreateNew}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all group space-y-3"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Start from scratch</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Clean blank slate with guidance across all sections.</p>
            </div>
          </button>

          <button
            onClick={onImport}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all group space-y-3"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Import existing</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Upload PDF or Word file with section extraction.</p>
            </div>
          </button>

          <button
            onClick={onAiGenerate}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all group space-y-3"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Generate with AI</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Structured generation tailored to your target role.</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  const p = resume.profileData || {};
  const personal = p.personal || {};

  // Calculate section completeness %
  let completedSections = 0;
  if (personal.fullName && personal.email) completedSections++;
  if (p.summary?.trim()) completedSections++;
  if (p.experience?.length > 0) completedSections++;
  if (p.education?.length > 0) completedSections++;
  if (p.projects?.length > 0) completedSections++;
  if (
    (p.skills?.technical?.length || 0) +
    (p.skills?.languages?.length || 0) +
    (p.skills?.frameworks?.length || 0) > 0
  ) completedSections++;
  const completionPercent = Math.round((completedSections / 6) * 100);

  const atsScore = resume.atsScore || 0;

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {/* Resume Overview Header Card */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Resume</span>
            <h1 className="text-xl font-bold text-white mt-0.5">{resume.name || "Software Engineer Resume"}</h1>
            <p className="text-xs text-slate-400">{resume.targetRole || "Software Engineer"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab("personal")}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              Edit Resume <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3 Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Status</span>
            <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Auto-synced with MongoDB</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">ATS Readiness</span>
            <div className="text-sm font-bold text-white mt-1">
              {atsScore > 0 ? `${atsScore} / 100` : "Not calculated"}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {atsScore >= 85 ? "ATS-Ready" : atsScore > 0 ? "Needs minor fixes" : "Run ATS check to score"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Completeness</span>
            <div className="text-sm font-bold text-indigo-400 mt-1">{completionPercent}%</div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigateTab("ats_scanner")}
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all text-left space-y-2 group"
          >
            <ShieldCheck className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-white">Run ATS Check</div>
              <div className="text-[10px] text-slate-500">Scan parsing &amp; keywords</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab("job_match")}
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all text-left space-y-2 group"
          >
            <Target className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-white">Match Job</div>
              <div className="text-[10px] text-slate-500">Compare against a JD</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab("ai_generator")}
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all text-left space-y-2 group"
          >
            <Sparkles className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-white">AI Tools</div>
              <div className="text-[10px] text-slate-500">Refactor bullets &amp; summary</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab("templates")}
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all text-left space-y-2 group"
          >
            <Palette className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-white">Change Template</div>
              <div className="text-[10px] text-slate-500">7 professional layouts</div>
            </div>
          </button>
        </div>
      </div>

      {/* Other Resumes / Switcher */}
      {allResumes.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Your Resumes ({allResumes.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {allResumes.map((r: any) => {
              const isCurrent = r._id === resume._id;
              return (
                <div
                  key={r._id}
                  onClick={() => onSelectResume(r._id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isCurrent
                      ? "bg-indigo-600/10 border-indigo-500/40 text-white"
                      : "bg-slate-900/50 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold truncate max-w-[200px]">{r.name}</h4>
                    <span className="text-[10px] text-slate-500">{r.targetRole || "Software Engineer"}</span>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      Active
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
