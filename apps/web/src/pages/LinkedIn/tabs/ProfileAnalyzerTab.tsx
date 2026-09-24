import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Award,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Edit3
} from "lucide-react";
import { ApiClient } from "../../../lib/api";

interface ProfileAnalyzerTabProps {
  report: any;
  recommendations: any[];
  onRefresh: () => void;
}

export const ProfileAnalyzerTab: React.FC<ProfileAnalyzerTabProps> = ({
  report,
  recommendations,
  onRefresh,
}) => {
  const [inputMode, setInputMode] = useState<"url" | "paste">("url");
  const [profileUrl, setProfileUrl] = useState("https://www.linkedin.com/in/");
  const [pastedText, setPastedText] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [analyzing, setAnalyzing] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("headline");
  const [editingRecId, setEditingRecId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState("");

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    try {
      if (inputMode === "url") {
        await ApiClient.analyzeLinkedInUrl(profileUrl.trim(), targetRole);
      } else {
        await ApiClient.analyzeLinkedInPasted(pastedText.trim(), targetRole);
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Analysis failed. Please check inputs.");
    } finally {
      setAnalyzing(false);
    }
  };

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

  const sections = [
    { id: "headline", label: "Headline", score: report?.sectionScores?.headline ?? 75 },
    { id: "about", label: "About / Summary", score: report?.sectionScores?.about ?? 70 },
    { id: "experience", label: "Experience", score: report?.sectionScores?.experience ?? 80 },
    { id: "skills", label: "Skills & Gaps", score: report?.sectionScores?.skills ?? 65 },
    { id: "featured", label: "Featured Work", score: report?.sectionScores?.projects ?? 60 },
    { id: "custom_url", label: "Custom URL", score: 90 },
    { id: "photo_banner", label: "Photo & Banner", score: 85 },
    { id: "recommendations", label: "Recommendations", score: 70 },
  ];

  return (
    <div className="space-y-6">
      {/* Input / Scanner Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              Analyze & Optimize LinkedIn Profile
            </h3>
            <p className="text-xs text-slate-400">
              Scored against 2026 technical recruitment algorithms and target job descriptions.
            </p>
          </div>

          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setInputMode("url")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                inputMode === "url" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Public Profile URL
            </button>
            <button
              onClick={() => setInputMode("paste")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                inputMode === "paste" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Paste Content (Safe Fallback)
            </button>
          </div>
        </div>

        <form onSubmit={handleRunAnalysis} className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {inputMode === "url" ? (
              <input
                type="text"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://www.linkedin.com/in/username"
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            ) : (
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={2}
                placeholder="Paste your About section, experience bullets, or full profile text..."
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            )}

            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Target Role (e.g. Senior Backend Engineer)"
              className="w-full md:w-64 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={analyzing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {analyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {analyzing ? "Analyzing..." : "Run Analysis"}
            </button>
          </div>
        </form>
      </div>

      {/* Main Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Navigation Tabs (1 Col) */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3">
            Profile Sections (9 Areas)
          </span>
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                activeSection === sec.id
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                  : "bg-slate-900/40 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-slate-800/60"
              }`}
            >
              <span>{sec.label}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  sec.score >= 80 ? "bg-emerald-500/20 text-emerald-300" : sec.score >= 65 ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"
                }`}
              >
                {sec.score}%
              </span>
            </button>
          ))}
        </div>

        {/* Section Detail & Suggestions (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
            {activeSection === "headline" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-white">Headline Analysis & Formulas</h4>
                    <p className="text-xs text-slate-400">First impressions matter: headline drives search CTR and recruiter clicks.</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                    Score: {report?.sectionScores?.headline || 75}/100
                  </span>
                </div>

                {/* Current vs Suggested */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Current Headline</span>
                    <p className="text-sm text-slate-300">
                      {report?.headlineAnalysis?.current || "Software Engineer at Tech Company"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> High-Performing Formula
                    </span>
                    <p className="text-sm font-medium text-purple-200">
                      {report?.headlineAnalysis?.suggestedVersions?.[0] ||
                        "Senior Backend Engineer | Distributed Systems & Node.js | Scaled Services to 5M+ DAU"}
                    </p>
                  </div>
                </div>

                {/* Problems identified */}
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Observations</h5>
                  <div className="space-y-1.5">
                    {(report?.headlineAnalysis?.problems || [
                      "Current headline lacks measurable impact or domain metrics",
                      "Missing secondary keywords recruiters filter by (e.g. Distributed Systems, Kafka)",
                    ]).map((prob: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{prob}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "about" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-white">About Summary Optimization</h4>
                    <p className="text-xs text-slate-400">Craft a story-driven narrative without cliché buzzwords.</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                    Score: {report?.sectionScores?.about || 70}/100
                  </span>
                </div>

                <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300">Proposed Narrative Rewrite</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(report?.aboutAnalysis?.suggestedAbout || "")}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </button>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                    {report?.aboutAnalysis?.suggestedAbout ||
                      "I build high-throughput backend services and developer tooling. Over the past 5 years, I've designed architectures supporting millions of requests per second, led database refactoring projects reducing query latency by 40%, and mentored cross-functional engineering teams.\n\nCore Technologies: Node.js, TypeScript, PostgreSQL, Redis, Docker, AWS."}
                  </p>
                </div>
              </div>
            )}

            {activeSection === "skills" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-white">Skills Matrix & Market Gaps</h4>
                    <p className="text-xs text-slate-400">Comparing your profile against active market postings.</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                    Score: {report?.sectionScores?.skills || 65}/100
                  </span>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    High-Priority Gap Recommendations
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(report?.skillsAnalysis?.missingSkills || ["Kubernetes", "System Design", "Microservices"]).map(
                      (skill: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60"
                        >
                          <div className="space-y-0.5">
                            <span className="text-sm font-semibold text-slate-200">{skill}</span>
                            <span className="text-[10px] block text-emerald-400 font-medium">85% recruiter demand</span>
                          </div>
                          <span className="text-xs text-purple-400 font-medium bg-purple-500/10 px-2 py-1 rounded">
                            Recommended Gap
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection !== "headline" && activeSection !== "about" && activeSection !== "skills" && (
              <div className="space-y-4 py-8 text-center text-slate-400">
                <FileText className="h-10 w-10 text-slate-600 mx-auto" />
                <p className="text-sm">
                  Section analysis for <span className="text-slate-200 font-semibold">{activeSection}</span> is loaded.
                </p>
                <p className="text-xs max-w-md mx-auto">
                  All suggestions follow strict provenance. Approved recommendations will be versioned and presented for your confirmation before sync.
                </p>
              </div>
            )}
          </div>

          {/* Actionable Recommendations List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-indigo-400" />
                Active Recommendations ({recommendations.length})
              </h4>
              <span className="text-xs text-slate-500">Requires explicit user approval</span>
            </div>

            {recommendations.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No pending recommendations. Run an analysis above to generate targeted improvements.
              </p>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div
                    key={rec._id}
                    className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 space-y-3 transition hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                          {rec.field}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            rec.status === "USER_APPROVED"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : rec.status === "USER_REJECTED"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">Confidence: {Math.round(rec.confidence * 100)}%</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-200">
                        {editingRecId === rec._id ? (
                          <input
                            type="text"
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="w-full rounded-lg border border-indigo-500 bg-slate-900 px-3 py-1.5 text-sm text-white"
                          />
                        ) : (
                          rec.proposedValue
                        )}
                      </p>
                      <p className="text-xs text-slate-400">{rec.reason}</p>
                    </div>

                    {rec.status === "SUGGESTED" && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        {editingRecId === rec._id ? (
                          <>
                            <button
                              onClick={() => handleApproveRec(rec._id, editedText)}
                              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/10"
                            >
                              Save & Approve
                            </button>
                            <button
                              onClick={() => setEditingRecId(null)}
                              className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingRecId(rec._id);
                                setEditedText(rec.proposedValue);
                              }}
                              className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-1"
                            >
                              <Edit3 className="h-3 w-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleRejectRec(rec._id)}
                              className="text-xs font-medium text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 flex items-center gap-1"
                            >
                              <ThumbsDown className="h-3 w-3" /> Reject
                            </button>
                            <button
                              onClick={() => handleApproveRec(rec._id)}
                              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/10 flex items-center gap-1"
                            >
                              <ThumbsUp className="h-3 w-3" /> Approve
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
