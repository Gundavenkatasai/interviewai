import React from "react";
import {
  Sparkles, Zap, ChevronRight, ChevronLeft, ArrowRight,
  ShieldCheck, AlertTriangle, Lightbulb, CheckCircle2, RefreshCw, Wand2
} from "lucide-react";
import { NavTabId } from "./ResumeLeftNav";

interface ResumeRightPanelProps {
  activeTab: NavTabId;
  collapsed: boolean;
  onToggleCollapse: () => void;
  resume: any;
  onTriggerAiTool: (tool: string, payload?: any) => void;
}

export const ResumeRightPanel: React.FC<ResumeRightPanelProps> = ({
  activeTab,
  collapsed,
  onToggleCollapse,
  resume,
  onTriggerAiTool
}) => {
  const p = resume?.profileData || {};
  const targetRole = resume?.targetRole || "Software Engineer";
  const atsAnalysis = resume?.atsAnalysis;

  if (collapsed) {
    return (
      <div className="border-l border-slate-800/80 bg-slate-950/60 p-2 flex flex-col items-center shrink-0">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Open AI Copilot"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="mt-4 rotate-90 text-[10px] uppercase font-bold tracking-widest text-indigo-400 whitespace-nowrap">
          AI Assistant
        </div>
      </div>
    );
  }

  return (
    <aside className="w-80 border-l border-slate-800/80 bg-slate-950/70 backdrop-blur-sm flex flex-col shrink-0 transition-all duration-200 z-20">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white leading-none">AI Career Copilot</h3>
            <span className="text-[10px] text-slate-400">Contextual recommendations</span>
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Collapse panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dynamic Content Based on Active Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar text-xs">
        {/* Context 1: Experience Editing */}
        {activeTab === "experience" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300 text-xs">
                <Zap className="w-3.5 h-3.5" />
                Bullet Point Optimizer
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Click <strong className="text-white">AI Improve</strong> on any bullet to rephrase with strong action verbs (Architected, Engineered, Streamlined) following Google's X-Y-Z formula.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
              <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">High-Impact Action Verbs</h4>
              <div className="flex flex-wrap gap-1 text-[10px]">
                {["Architected", "Engineered", "Optimized", "Spearheaded", "Scaled", "Automated", "Deployed", "Refactored"].map((v) => (
                  <span key={v} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    {v}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">Need Quantifiable Metrics?</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Answer 3 guided questions to convert responsibilities into measured achievements without fabricating numbers.
              </p>
              <button
                onClick={() => onTriggerAiTool("ai_achievement")}
                className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Wand2 className="w-3 h-3" /> Launch Achievement Generator
              </button>
            </div>
          </div>
        )}

        {/* Context 2: Summary Editing */}
        {activeTab === "summary" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-purple-300 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Target Role Alignment
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Tailor your summary for <strong className="text-white">{targetRole}</strong>. Generate concise, technical, or leadership variants grounded strictly in your skills.
              </p>
              <button
                onClick={() => onTriggerAiTool("ai_summary")}
                className="w-full py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3 h-3" /> Generate 5 Summary Variants
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-200">Recommended Summary Structure</h4>
              <ul className="space-y-1.5 text-[11px] text-slate-400">
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold">1.</span>
                  <span><strong>Title &amp; Core Domain:</strong> Results-driven {targetRole}...</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold">2.</span>
                  <span><strong>Core Tech Stack:</strong> Proficient in {p.skills?.languages?.slice(0, 3)?.join(", ") || "TypeScript, Node.js"}...</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold">3.</span>
                  <span><strong>Value Proposition:</strong> Demonstrated track record of building resilient systems.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Context 3: Skills Editing */}
        {activeTab === "skills" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
              <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">
                Market In-Demand Skills for {targetRole}
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Commonly requested in job descriptions for your target role:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["TypeScript", "React", "Node.js", "Docker", "AWS", "PostgreSQL", "Redis", "CI/CD"].map((s) => {
                  const alreadyHas = [
                    ...(p.skills?.languages || []),
                    ...(p.skills?.frameworks || []),
                    ...(p.skills?.databases || []),
                    ...(p.skills?.cloud || []),
                    ...(p.skills?.technical || [])
                  ].some((item: string) => item.toLowerCase() === s.toLowerCase());

                  return (
                    <span
                      key={s}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono border ${
                        alreadyHas
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-800/80 text-slate-400 border-slate-700"
                      }`}
                    >
                      {s} {alreadyHas ? "✓" : "+"}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Context 4: ATS Diagnostics Overview */}
        {(activeTab === "ats_scanner" || activeTab === "resume_health") && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">
                Top Priority ATS Fixes
              </h4>
              {atsAnalysis?.issues?.length > 0 ? (
                <div className="space-y-2">
                  {atsAnalysis.issues.slice(0, 3).map((iss: any, idx: number) => (
                    <div key={idx} className="text-[11px] p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="font-bold text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>{iss.problem}</span>
                      </div>
                      <p className="text-slate-400 text-[10px]">{iss.suggestedFix}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> All critical ATS checks passed!
                </p>
              )}
            </div>
          </div>
        )}

        {/* General Tips Card */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-300 text-xs">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Resume Pro Tip
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Keep bullets between 12 to 24 words. Shorter bullets fail to show ownership, while overly lengthy paragraphs are skipped by both recruiters and automated ATS extractors.
          </p>
        </div>
      </div>
    </aside>
  );
};
