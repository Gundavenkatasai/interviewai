import React, { useState } from "react";
import {
  ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw,
  FileText, Copy, Check, Eye, HelpCircle, Sparkles, ArrowRight
} from "lucide-react";
import { ApiClient, IOptimizationPlan, IBeforeAfterReport } from "../../../../lib/api";
import { OptimizationReviewModal } from "../OptimizationReviewModal";
import { BeforeAfterReport } from "../BeforeAfterReport";

interface ATSScannerWorkspaceProps {
  resume: any;
  onUpdateResume: (updatedResume: any) => void;
}

export const ATSScannerWorkspace: React.FC<ATSScannerWorkspaceProps> = ({
  resume,
  onUpdateResume,
}) => {
  const [scanning, setScanning] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState<"report" | "plain_text">("report");
  const [plainText, setPlainText] = useState<string>("");
  const [loadingPlainText, setLoadingPlainText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format-preserving AI optimization state
  const [optimizationPlan, setOptimizationPlan] = useState<IOptimizationPlan | null>(null);
  const [optimizationRunId, setOptimizationRunId] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [beforeAfterReport, setBeforeAfterReport] = useState<IBeforeAfterReport | null>(null);
  const [optimizedDocxBase64, setOptimizedDocxBase64] = useState<string | undefined>(undefined);

  const atsData = resume?.atsCompatibility || null;
  const hasAtsScore = typeof atsData?.overallScore === "number" && atsData?.overallScore > 0;
  const score = hasAtsScore ? atsData.overallScore : (resume?.atsScore > 0 ? resume.atsScore : null);

  const handleRunScan = async () => {
    if (!resume?._id) return;
    setScanning(true);
    setError(null);
    try {
      const res = await ApiClient.scanResumeAts(resume._id, {
        targetRole: resume.targetRole || "Software Engineer"
      });
      if (res?.report) {
        onUpdateResume({
          ...resume,
          atsScore: res.report.overallScore,
          atsCompatibility: {
            overallScore: res.report.overallScore,
            issues: res.report.issues.map((i: any) => ({
              id: i.id,
              type: i.severity === "critical" ? "critical" : i.severity === "high" ? "high" : i.severity === "medium" ? "warning" : "info",
              severity: i.severity,
              title: i.title,
              description: i.why,
              recommendation: i.suggestion
            })),
            breakdown: res.report.categoryScores
          }
        });
      } else {
        const fallbackRes = await ApiClient.analyzeResume(resume._id);
        if (fallbackRes?.resume) {
          onUpdateResume(fallbackRes.resume);
        }
      }
    } catch (err: any) {
      try {
        const fallbackRes = await ApiClient.analyzeResume(resume._id);
        if (fallbackRes?.resume) {
          onUpdateResume(fallbackRes.resume);
          return;
        }
      } catch {}
      setError(err.message || "Failed to run ATS analysis. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const handleOptimize = async () => {
    if (!resume?._id) return;
    setOptimizing(true);
    setError(null);
    try {
      const res = await ApiClient.optimizeResume(resume._id, {
        targetRole: resume.targetRole || "Software Engineer"
      });
      if (res?.plan?.proposals?.length) {
        setOptimizationPlan(res.plan);
        setOptimizationRunId(res.runId || res.run?._id || null);
        setReviewModalOpen(true);
      } else {
        setError("No optimization proposals were needed or generated. Your resume already performs well across key ATS categories.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate optimization plan.");
    } finally {
      setOptimizing(false);
    }
  };

  const handleApplyOptimizations = async (
    selectedIds: string[],
    editedProposals: Record<string, string>
  ) => {
    if (!resume?._id || !optimizationRunId) return;
    setIsApplying(true);
    setError(null);
    try {
      const res = await ApiClient.applyOptimizationRun(resume._id, optimizationRunId, {
        acceptedProposalIds: selectedIds,
        editedProposals
      });

      if (res.regressed) {
        setError(res.message || "The optimization resulted in a lower ATS score and was automatically reverted.");
        setReviewModalOpen(false);
        return;
      }

      if (res.beforeAfterReport || res.run) {
        const rep: IBeforeAfterReport = res.beforeAfterReport || {
          resumeId: resume._id,
          fileName: resume.filename || "Resume.docx",
          beforeScore: res.beforeScore || 0,
          afterScore: res.afterScore || 0,
          scoreDelta: res.scoreDelta || 0,
          categoryDeltas: {},
          changesApplied: (res.run?.changes || []).map((c: any) => ({
            id: c.id,
            section: c.section,
            originalText: c.originalText,
            appliedText: editedProposals[c.id] || c.proposedText,
            reason: c.reason,
            issueFixed: c.issueIds?.join(", ") || "ATS Keyword Context"
          })),
          explanation: res.run?.explanation || [
            `ATS score improved from ${res.beforeScore} to ${res.afterScore} (+${res.scoreDelta} pts).`
          ],
          healthBefore: (res.beforeScore || 0) >= 80 ? "Green" : (res.beforeScore || 0) >= 60 ? "Yellow" : "Red",
          healthAfter: (res.afterScore || 0) >= 80 ? "Green" : (res.afterScore || 0) >= 60 ? "Yellow" : "Red",
          passProbabilityBefore: Math.min(100, Math.round((res.beforeScore || 0) * 0.7)),
          passProbabilityAfter: Math.min(100, Math.round((res.afterScore || 0) * 0.7)),
          downloadUrl: res.downloadUrl || `/api/resumes/${resume._id}/download/optimized`
        };

        setBeforeAfterReport(rep);
        setOptimizedDocxBase64(res.optimizedDocxBase64);
        setReviewModalOpen(false);
        if (res.afterScore) {
          onUpdateResume({
            ...resume,
            atsScore: res.afterScore
          });
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to apply optimizations.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleFetchPlainText = async () => {
    if (!resume?._id) return;
    setLoadingPlainText(true);
    try {
      const text = await ApiClient.getPlainText(resume._id);
      setPlainText(text);
    } catch (err: any) {
      setPlainText("Could not extract plain text: " + (err.message || "Unknown error"));
    } finally {
      setLoadingPlainText(false);
    }
  };

  const handleTabSwitch = (tab: "report" | "plain_text") => {
    setActiveTab(tab);
    if (tab === "plain_text" && !plainText) {
      handleFetchPlainText();
    }
  };

  const handleCopyPlainText = () => {
    if (!plainText) return;
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (val: number) => {
    if (val >= 85) return { label: "Excellent", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    if (val >= 70) return { label: "Good", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
    if (val >= 50) return { label: "Needs Improvement", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    return { label: "Critical Attention", bg: "bg-rose-500/10 text-rose-400 border-rose-500/20" };
  };

  // If a Before/After report is active, display the full delta view
  if (beforeAfterReport) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <BeforeAfterReport
          report={beforeAfterReport}
          onNewScan={() => setBeforeAfterReport(null)}
          optimizedDocxBase64={optimizedDocxBase64}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-semibold text-slate-100">ATS Readiness Scanner</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Evaluates your resume against deterministic ATS parsing rules, keyword density, and formatting standards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunScan}
              disabled={scanning || optimizing}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
              {scanning ? "Analyzing Resume..." : (score !== null ? "Re-Run ATS Scan" : "Run ATS Check")}
            </button>

            <button
              onClick={handleOptimize}
              disabled={optimizing || scanning}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-50 text-slate-950 text-sm font-bold rounded-lg shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${optimizing ? "animate-spin" : ""}`} />
              {optimizing ? "Generating Improvements..." : "Improve My Resume"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => handleTabSwitch("report")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === "report"
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          ATS Diagnostics
        </button>
        <button
          onClick={() => handleTabSwitch("plain_text")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === "plain_text"
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Eye className="w-4 h-4" />
          What an ATS Sees
        </button>
      </div>

      {/* Report Tab */}
      {activeTab === "report" && (
        <>
          {score === null ? (
            /* Empty state when no scan was run */
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-slate-200">No ATS score calculated yet</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mt-2 mb-6">
                Run an automated ATS scan to check keyword distribution, structural hierarchy, contact completeness, and readability.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleRunScan}
                  disabled={scanning}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {scanning ? "Analyzing..." : "Calculate ATS Score Now"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Optimization Action Callout Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-slate-900 border border-orange-500/30 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    <Sparkles className="h-3 w-3" />
                    <span>Format-Preserving AI Optimization Engine</span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Fix ATS Weaknesses Without Altering Format
                  </h3>
                  <p className="text-xs text-slate-300">
                    Replaces weak bullet points while strictly preserving your exact original margins, fonts, dates, and company names.
                  </p>
                </div>
                <button
                  onClick={handleOptimize}
                  disabled={optimizing}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 transition flex items-center gap-2 shadow-lg shadow-orange-500/25 shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{optimizing ? "Generating..." : "Optimize Resume"}</span>
                </button>
              </div>

              {/* Score Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={`${
                          score >= 80 ? "text-emerald-500" : score >= 65 ? "text-blue-500" : "text-amber-500"
                        }`}
                        strokeDasharray={`${score}, 100`}
                        strokeWidth="3"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-xl font-bold text-slate-100">{score}</span>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">ATS Readiness</div>
                    <div className="text-xl font-semibold text-slate-100 mt-0.5">{score} / 100</div>
                    <span className={`inline-block text-xs px-2 py-0.5 mt-1 rounded border font-medium ${getStatusBadge(score).bg}`}>
                      {getStatusBadge(score).label}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-center">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Critical Issues</div>
                  <div className="text-2xl font-bold text-rose-400 mt-1">
                    {atsData?.issues?.filter((i: any) => i.type === "critical" || i.severity === "high")?.length || 0}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Blockers that may cause parsing failure</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-center">
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Warnings & Improvements</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">
                    {atsData?.issues?.filter((i: any) => i.type === "warning" || i.severity === "medium")?.length || 0}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Recommended optimizations for higher match</div>
                </div>
              </div>

              {/* 7 Breakdown Categories */}
              {atsData?.breakdown && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">
                    Scoring Breakdown
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(atsData.breakdown).map(([category, catScore]: [string, any]) => {
                      const numScore = typeof catScore === "number" ? catScore : (catScore?.score || 0);
                      return (
                        <div key={category} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium capitalize">
                              {category.replace(/([A-Z])/g, " $1")}
                            </span>
                            <span className="text-slate-400 font-mono">{numScore}/100</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                numScore >= 80 ? "bg-emerald-500" : numScore >= 60 ? "bg-blue-500" : "bg-amber-500"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, numScore))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Issues List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  Diagnostic Findings
                </h3>

                {atsData?.issues && atsData.issues.length > 0 ? (
                  atsData.issues.map((issue: any, index: number) => {
                    const isCrit = issue.type === "critical" || issue.severity === "high";
                    const isWarn = issue.type === "warning" || issue.severity === "medium";
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border flex items-start gap-3 ${
                          isCrit
                            ? "bg-rose-500/5 border-rose-500/20 text-rose-200"
                            : isWarn
                            ? "bg-amber-500/5 border-amber-500/20 text-amber-200"
                            : "bg-emerald-500/5 border-emerald-500/20 text-emerald-200"
                        }`}
                      >
                        {isCrit ? (
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        ) : isWarn ? (
                          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {issue.id && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-orange-400 border border-slate-700">
                                {issue.id}
                              </span>
                            )}
                            <div className="text-sm font-medium text-slate-200">
                              {issue.title || issue.message}
                            </div>
                          </div>
                          {issue.description && (
                            <div className="text-xs text-slate-400 leading-relaxed">
                              {issue.description}
                            </div>
                          )}
                          {issue.recommendation && (
                            <div className="text-xs text-indigo-400 font-medium">
                              Fix: {issue.recommendation}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-300 text-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>No critical parsing issues detected. Your resume structure is standard and readable.</span>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl flex items-start gap-3 text-xs text-slate-400">
                <HelpCircle className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
                <p>
                  <strong>Notice:</strong> Different applicant tracking systems (Workday, Greenhouse, Lever, Taleo) use varied parsing algorithms. This ATS Compatibility score benchmarks your resume against industry-standard extraction, section completeness, and keyword formatting rules.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Plain Text / What ATS Sees Tab */}
      {activeTab === "plain_text" && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Machine-Readable Extracted Text</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  This is the exact linear text extracted by automated resume parsers. If sections look jumbled or unreadable here, an ATS will struggle to index your qualifications.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFetchPlainText}
                  disabled={loadingPlainText}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition-colors cursor-pointer"
                >
                  Refresh
                </button>
                <button
                  onClick={handleCopyPlainText}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium rounded-md transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy Text"}
                </button>
              </div>
            </div>

            {loadingPlainText ? (
              <div className="p-8 text-center text-sm text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                Extracting plain text...
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-[500px] overflow-y-auto leading-relaxed selection:bg-indigo-500/30">
                {plainText || "No text available. Click 'Refresh' to extract."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Format-Preserving Optimization Review Modal */}
      {optimizationPlan && (
        <OptimizationReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          proposals={optimizationPlan.proposals}
          onApply={handleApplyOptimizations}
          isApplying={isApplying}
          fileName={resume?.filename || resume?.name || "Resume"}
          isDocx={Boolean(resume?.filename?.toLowerCase().endsWith(".docx") || resume?.fileType === "docx")}
        />
      )}
    </div>
  );
};
