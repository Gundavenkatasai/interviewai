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
  Edit3,
  HelpCircle,
  Clock,
  Info
} from "lucide-react";
import { ApiClient } from "../../../lib/api";

interface ProfileAnalyzerTabProps {
  report: any;
  recommendations: any[];
  onRefresh: () => void;
  onNavigateTab?: (tab: string) => void;
}

const SECTION_LABELS: Record<string, { label: string; desc: string }> = {
  PHOTO: { label: "Profile Photo", desc: "Professional headshot discoverability and presence." },
  BANNER: { label: "Background Banner", desc: "Branded visual positioning and career focus." },
  HEADLINE: { label: "Headline Formula", desc: "Algorithmic search ranking and value proposition." },
  ABOUT: { label: "About / Summary", desc: "Structured career narrative and core accomplishments." },
  FEATURED: { label: "Featured Section", desc: "Artifacts, links, open source, and top articles." },
  EXPERIENCE: { label: "Experience Impact", desc: "Action verbs, quantifiable results, and technical scope." },
  EDUCATION: { label: "Education & Degrees", desc: "Academic background and institutional pedigree." },
  SKILLS: { label: "Technical Skills", desc: "Endorsement depth and job-demand alignment." },
  CERTIFICATIONS: { label: "Licenses & Certs", desc: "Industry certifications and accredited competencies." },
  PROJECTS: { label: "Engineering Projects", desc: "Repositories, shipped systems, and practical proofs." },
  CUSTOM_URL: { label: "Custom LinkedIn URL", desc: "Clean public identifier (no random alphanumeric tail)." },
  RECOMMENDATIONS: { label: "Social Proof", desc: "Peer and manager recommendations." },
  ACTIVITY: { label: "Public Activity", desc: "Recent posting frequency and technical dialogue." },
  KEYWORDS: { label: "Keyword Density", desc: "Target role ATS and recruiter search terms." },
};

export const ProfileAnalyzerTab: React.FC<ProfileAnalyzerTabProps> = ({
  report,
  recommendations,
  onRefresh,
  onNavigateTab,
}) => {
  const [inputMode, setInputMode] = useState<"url" | "paste">("url");
  const [profileUrl, setProfileUrl] = useState("https://www.linkedin.com/in/");
  const [pastedText, setPastedText] = useState("");
  const [targetRole, setTargetRole] = useState("Senior Software Engineer");
  const [analyzing, setAnalyzing] = useState(false);
  const [activeSectionKey, setActiveSectionKey] = useState<string>("HEADLINE");

  const overallScore = report?.score !== undefined ? report.score : null;
  const sectionsData = report?.sections || {};
  const sectionKeys = Object.keys(SECTION_LABELS);

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    try {
      if (inputMode === "url") {
        await ApiClient.analyzeLinkedInProfile({
          profileUrl: profileUrl.trim(),
          targetRole: targetRole.trim(),
          forceRefresh: true,
        });
      } else {
        await ApiClient.analyzeLinkedInProfile({
          rawText: pastedText.trim(),
          targetRole: targetRole.trim(),
          forceRefresh: true,
        });
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Profile analysis failed. Please verify provider connectivity.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "STRONG":
        return <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">STRONG</span>;
      case "GOOD":
        return <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full">GOOD</span>;
      case "NEEDS_WORK":
        return <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">NEEDS WORK</span>;
      case "MISSING":
        return <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">MISSING</span>;
      case "UNKNOWN":
      default:
        return <span className="bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">UNKNOWN</span>;
    }
  };

  const getConfidenceBadge = (confidence?: string) => {
    switch (confidence) {
      case "high":
        return <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">High Confidence</span>;
      case "medium":
        return <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Medium Confidence</span>;
      default:
        return <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Low Confidence</span>;
    }
  };

  const selectedSection = sectionsData[activeSectionKey];

  return (
    <div className="space-y-6">
      {/* Scanner Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              14-Section Deterministic Profile Analyzer
            </h3>
            <p className="text-xs text-slate-400">
              Zero mock scores. Audits all 14 LinkedIn sections with evidence, issues, confidence, and action recommendations.
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
              Paste Content
            </button>
          </div>
        </div>

        <form onSubmit={handleRunAnalysis} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {inputMode === "url" ? (
              <div className="md:col-span-8 bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
                <span className="text-slate-500 font-medium">URL:</span>
                <input
                  type="text"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/your-handle"
                  className="bg-transparent text-white focus:outline-none w-full"
                />
              </div>
            ) : (
              <div className="md:col-span-8 bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs">
                <textarea
                  rows={2}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste raw LinkedIn profile text (Experience, Headline, About, Skills)..."
                  className="bg-transparent text-white focus:outline-none w-full resize-none"
                />
              </div>
            )}

            <div className="md:col-span-4 flex gap-2">
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Target Role"
                className="bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none w-full"
              />
              <button
                type="submit"
                disabled={analyzing}
                className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50"
              >
                {analyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Analyze
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Profile Score Header & Provenance */}
      {overallScore !== null && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-indigo-500/20 bg-slate-900/40 p-5">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center justify-center h-16 w-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-white">
              <span className="text-2xl font-bold">{overallScore}</span>
              <span className="text-[10px] text-indigo-300">/ 100</span>
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Comprehensive Profile Rubric</h4>
              <p className="text-xs text-slate-400">
                14-section rubric evaluated against 2026 hiring benchmarks for {report?.targetRole || targetRole}.
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400">
            <div className="flex items-center gap-1.5 justify-end text-slate-300 font-medium">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <span>
                {report.retrievedAt ? `Retrieved ${new Date(report.retrievedAt).toLocaleDateString()}` : "Live snapshot"}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Provider: {report.provider || "public_guest"}
            </span>
          </div>
        </div>
      )}

      {/* 14 Sections Navigator & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sections List (4 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
            14 Profile Sections
          </h4>

          <div className="space-y-1.5">
            {sectionKeys.map((key) => {
              const sec = sectionsData[key];
              const score = sec?.score !== undefined ? sec.score : "—";
              const isSelected = activeSectionKey === key;

              return (
                <button
                  key={key}
                  onClick={() => setActiveSectionKey(key)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-600/10 text-white"
                      : "border-slate-800/80 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold block">{SECTION_LABELS[key].label}</span>
                    <span className="text-[10px] text-slate-500">{SECTION_LABELS[key].desc}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {sec && getStatusBadge(sec.status)}
                    <span className="text-xs font-bold text-white min-w-[28px] text-right">
                      {score !== "—" ? `${score}` : "—"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Detail Inspector (7 cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 sticky top-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">
                  Section Analysis
                </span>
                <h4 className="text-lg font-bold text-white pt-1">
                  {SECTION_LABELS[activeSectionKey].label}
                </h4>
                <p className="text-xs text-slate-400">{SECTION_LABELS[activeSectionKey].desc}</p>
              </div>

              {selectedSection && (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedSection.status)}
                    <span className="text-xl font-bold text-white">
                      {selectedSection.score !== undefined ? `${selectedSection.score}/100` : "—"}
                    </span>
                  </div>
                  {getConfidenceBadge(selectedSection.confidence)}
                </div>
              )}
            </div>

            {selectedSection ? (
              <div className="space-y-4 pt-2">
                {/* Evidence */}
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/80 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Observed Evidence
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-mono">
                    {selectedSection.evidence || "No textual evidence observed in source snapshot."}
                  </p>
                </div>

                {/* Issues */}
                {selectedSection.issues && selectedSection.issues.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      Identified Issues
                    </span>
                    <div className="space-y-1.5">
                      {selectedSection.issues.map((issue: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {selectedSection.recommendations && selectedSection.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                      Actionable Recommendations
                    </span>
                    <div className="space-y-1.5">
                      {selectedSection.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-200 bg-indigo-500/5 p-2.5 rounded-lg border border-indigo-500/20">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Run an analysis using the top scanner to inspect evidence and algorithmic suggestions for this section.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
