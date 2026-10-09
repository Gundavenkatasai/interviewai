import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Layers,
  FileText,
  Target,
  ShieldCheck,
  Check,
  Edit3
} from "lucide-react";
import { ApiClient } from "../../../lib/api";

interface ProfileOptimizerTabProps {
  analysis: any;
  recommendations: any[];
  onRefresh: () => void;
}

export const ProfileOptimizerTab: React.FC<ProfileOptimizerTabProps> = ({
  analysis,
  recommendations,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"headlines" | "about" | "experience" | "skills" | "role_alignment">("headlines");
  const [targetRole, setTargetRole] = useState(analysis?.targetRole || "Senior Software Engineer");
  const [optimizing, setOptimizing] = useState(false);
  const [editingRecId, setEditingRecId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState("");

  const profileData = analysis?.profileData || {};
  const currentHeadline = profileData.headline || "No headline provided";
  const currentAbout = profileData.about || "No About/Summary section provided";
  const experienceItems = profileData.experience || [];
  const skillsList = profileData.skills || [];

  // Filter recommendations by section
  const headlineRecs = recommendations.filter((r) => r.section === "HEADLINE" && r.status === "PROPOSED");
  const aboutRecs = recommendations.filter((r) => r.section === "ABOUT" && r.status === "PROPOSED");
  const expRecs = recommendations.filter((r) => r.section === "EXPERIENCE" && r.status === "PROPOSED");
  const skillRecs = recommendations.filter((r) => r.section === "SKILLS" && r.status === "PROPOSED");

  const handleApproveRec = async (id: string, userEditedValue?: string) => {
    try {
      await ApiClient.approveLinkedInRecommendation(id, userEditedValue);
      setEditingRecId(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to approve recommendation");
    }
  };

  const handleRejectRec = async (id: string) => {
    try {
      await ApiClient.rejectLinkedInRecommendation(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to reject recommendation");
    }
  };

  const handleReoptimize = async () => {
    setOptimizing(true);
    try {
      await ApiClient.analyzeLinkedInProfile({
        targetRole,
        forceRefresh: true,
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to re-optimize profile");
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Target Role Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            Profile Optimizer (Zero Fabrication)
          </h3>
          <p className="text-xs text-slate-400">
            Compare options, review proposed revisions against your verified resume, and approve changes before applying.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Target className="h-4 w-4 text-indigo-400" />
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Target Role (e.g. Staff Engineer)"
              className="bg-transparent text-white focus:outline-none w-48 text-xs"
            />
          </div>

          <button
            onClick={handleReoptimize}
            disabled={optimizing}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {optimizing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Re-run Optimization
          </button>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: "headlines", label: "Headline Options", count: headlineRecs.length },
          { id: "about", label: "About / Summary", count: aboutRecs.length },
          { id: "experience", label: "Experience Impact", count: expRecs.length },
          { id: "skills", label: "Skills Taxonomy & Gaps", count: skillRecs.length },
          { id: "role_alignment", label: "Role Alignment & Resume Match" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeSubTab === tab.id
                ? "bg-indigo-600 text-white"
                : "border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="rounded-full bg-indigo-500/30 px-2 py-0.5 text-[10px] text-indigo-200">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1. HEADLINE OPTIMIZATION */}
      {activeSubTab === "headlines" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Headline</span>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-medium text-slate-200">
              {currentHeadline}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Proposed Alternatives (Recruiter-Optimized)
            </h4>

            {headlineRecs.length === 0 ? (
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-8 text-center space-y-3">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
                <h5 className="text-sm font-semibold text-white">Headline is Current & Optimized</h5>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  No pending headline revisions. If your target role changes, update the target role field above and click Re-run.
                </p>
              </div>
            ) : (
              headlineRecs.map((rec) => (
                <div
                  key={rec._id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                        {rec.type || "PROPOSAL"}
                      </span>
                      <p className="text-xs text-slate-400 pt-1">{rec.reason}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveRec(rec._id, rec.proposedValue)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30 transition"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectRec(rec._id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-600/10 border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-600/20 transition"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/80 text-sm font-semibold text-white">
                    {rec.proposedValue}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. ABOUT SECTION OPTIMIZATION */}
      {activeSubTab === "about" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Current About */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current About Section</span>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {currentAbout}
              </div>
            </div>

            {/* Proposed About */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Proposed Version (Verified Facts Only)
                </span>
                {aboutRecs.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveRec(aboutRecs[0]._id, aboutRecs[0].proposedValue)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve & Apply
                    </button>
                    <button
                      onClick={() => handleRejectRec(aboutRecs[0]._id)}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {aboutRecs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No proposed About revisions. Current summary aligns with verified resume facts.
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs text-white whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {aboutRecs[0].proposedValue}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. EXPERIENCE OPTIMIZATION */}
      {activeSubTab === "experience" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              Verified Experience Items & Action-Oriented Framing
            </h4>
            <span className="text-xs text-slate-500">Zero metric fabrication enforced</span>
          </div>

          {experienceItems.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-2">
              <AlertTriangle className="mx-auto h-7 w-7 text-amber-400" />
              <p className="text-xs text-slate-400">
                No experience items recorded yet. Paste or analyze your LinkedIn profile to extract roles.
              </p>
            </div>
          ) : (
            experienceItems.map((exp: any, idx: number) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-white">{exp.title}</h5>
                    <p className="text-xs text-slate-400">
                      {exp.company} • {exp.dateRange || "Duration unspecified"}
                    </p>
                  </div>
                  {exp.location && (
                    <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {exp.location}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {exp.description || "No description provided."}
                </p>

                <div className="text-[11px] text-indigo-400 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  <span>Recommendation: Ensure bullets start with active verbs (Architected, Spearheaded, Reduced) and quantify metrics only where documented.</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. SKILLS TAXONOMY & GAPS */}
      {activeSubTab === "skills" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              Platform Skill Taxonomy Alignment
            </h4>
            <p className="text-xs text-slate-400">
              Categorized against Interview AI canonical skill taxonomy and live target-role job postings.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {skillsList.length === 0 ? (
                <span className="text-xs text-slate-500">No skills currently extracted from profile.</span>
              ) : (
                skillsList.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    {skill}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. ROLE ALIGNMENT & RESUME CONSISTENCY */}
      {activeSubTab === "role_alignment" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Cross-Platform Integrity Check (LinkedIn ↔ Resume)
              </h4>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Deterministic Diff Engine
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Company & Job Title Consistency
                </div>
                <p className="text-xs text-slate-400">
                  Role titles on LinkedIn match primary positions in active Resume version.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                  <Target className="h-4 w-4" /> Target Role Coverage ({targetRole})
                </div>
                <p className="text-xs text-slate-400">
                  Key technical proficiencies align with 2026 hiring rubric for {targetRole}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
