import React, { useState } from "react";
import {
  TrendingUp, Download, CheckCircle2, ShieldCheck,
  FileCheck, ArrowRight, RefreshCw, Copy, Check,
  Layers, Award, Briefcase, ChevronRight, AlertTriangle, FileText
} from "lucide-react";
import { IBeforeAfterReport, ApiClient } from "../../../lib/api";

interface BeforeAfterReportProps {
  report: IBeforeAfterReport;
  onNewScan: () => void;
  optimizedDocxBase64?: string;
}

export const BeforeAfterReport: React.FC<BeforeAfterReportProps> = ({
  report,
  onNewScan,
  optimizedDocxBase64
}) => {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownloadDocx = async () => {
    setDownloading(true);
    try {
      if (optimizedDocxBase64) {
        // Direct browser download from base64
        const byteCharacters = atob(optimizedDocxBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = report.fileName.endsWith(".docx") ? report.fileName : `${report.fileName.replace(/\.[^/.]+$/, "")}.docx`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = await ApiClient.downloadOptimizedDocx(report.fileName);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = report.fileName.endsWith(".docx") ? report.fileName : `${report.fileName.replace(/\.[^/.]+$/, "")}.docx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert("Failed to download document: " + (err.message || "Unknown error"));
    } finally {
      setDownloading(false);
    }
  };

  const copySummary = () => {
    const text = `ATS Score Improvement: ${report.beforeScore} → ${report.afterScore} (+${report.scoreDelta} pts)\n` +
      `File: ${report.fileName}\n\n` +
      `Why it changed:\n${report.explanation.map((e) => "• " + e).join("\n")}\n\n` +
      `Changes applied:\n${report.changesApplied.map((c) => `• [${c.section}] ${c.reason}: ${c.appliedText}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Format-Preserving Optimization Complete
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Before &amp; After ATS Compatibility</h2>
          <p className="text-sm text-slate-400 mt-1">
            Recalculated directly from your generated file artifact. Exact original fonts, layout, and styling preserved.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={copySummary}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Copied!" : "Copy Summary"}</span>
          </button>

          <button
            onClick={handleDownloadDocx}
            disabled={downloading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 transition flex items-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <FileText className="h-4 w-4" />
            <span>Word (.docx)</span>
          </button>

        </div>
      </div>

      {/* Score Regression Guard Notice */}
      {report.scoreDelta < 0 && (
        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-3">
          <div className="flex items-center gap-2.5 font-bold text-rose-400 text-base">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>The generated version reduced ATS compatibility</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The candidate artifact scored {report.afterScore}/100, which is lower than your original document ({report.beforeScore}/100). As part of our strict measurement policy, we recommend retaining your original resume or trying another optimization pass with different keyword emphasis.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={onNewScan}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition"
            >
              Keep Original Resume
            </button>
            <button
              onClick={onNewScan}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 transition"
            >
              Try Again with New Instructions
            </button>
          </div>
        </div>
      )}

      {/* Score Comparison Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* BEFORE Score Card */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Initial ATS Score
          </span>
          <div className="text-5xl font-black text-slate-300">
            {report.beforeScore}
            <span className="text-sm font-medium text-slate-500 ml-1">/100</span>
          </div>
          <div className="text-xs text-slate-400">
            Pass Probability: <strong className="text-slate-300">{report.passProbabilityBefore}%</strong>
          </div>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
            Health: {report.healthBefore}
          </div>
        </div>

        {/* DELTA Pill Center */}
        <div className={`p-6 rounded-3xl border flex flex-col items-center justify-center text-center space-y-2 ${
          report.scoreDelta >= 0
            ? "bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-slate-950 border-orange-500/30"
            : "bg-rose-500/10 border-rose-500/30"
        }`}>
          <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center ${
            report.scoreDelta >= 0
              ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
              : "bg-rose-500/20 border-rose-500/30 text-rose-400"
          }`}>
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className={`text-3xl font-black ${report.scoreDelta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {report.scoreDelta >= 0 ? `+${report.scoreDelta}` : `${report.scoreDelta}`} pts
          </div>
          <p className="text-xs text-slate-300 max-w-xs">
            {report.scoreDelta >= 0
              ? "Measured gain across keyword density, active verbs, and readability metrics."
              : "Actual measurement detected a net decrease. Revert or re-optimize."}
          </p>
        </div>

        {/* AFTER Score Card */}
        <div className={`p-6 rounded-3xl bg-slate-900/90 border text-center space-y-3 relative overflow-hidden shadow-xl ${
          report.scoreDelta >= 0 ? "border-emerald-500/40 shadow-emerald-500/5" : "border-rose-500/40"
        }`}>
          <div className={`absolute top-0 right-0 left-0 h-1 bg-gradient-to-r ${
            report.scoreDelta >= 0 ? "from-emerald-500 to-teal-400" : "from-rose-500 to-amber-500"
          }`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${
            report.scoreDelta >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}>
            Optimized ATS Score
          </span>
          <div className="text-5xl font-black text-white">
            {report.afterScore}
            <span className="text-sm font-medium text-slate-400 ml-1">/100</span>
          </div>
          <div className="text-xs text-slate-300">
            Pass Probability: <strong className={report.scoreDelta >= 0 ? "text-emerald-400" : "text-rose-400"}>{report.passProbabilityAfter}%</strong>
          </div>
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
            report.healthAfter === "Green"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : report.healthAfter === "Yellow"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
          }`}>
            Health: {report.healthAfter}
          </div>
        </div>
      </div>

      {/* Why the Score Changed (Evidence & Explanations) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="h-5 w-5 text-orange-400" />
          <span>Why Did the ATS Score Improve?</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {report.explanation.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-300"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown Delta Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-orange-400" />
          <span>Category-by-Category Audit</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(report.categoryDeltas).map(([cat, deltaData]) => {
            const isPositive = deltaData.delta > 0;
            return (
              <div
                key={cat}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  {cat}
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-white">
                    {deltaData.after} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                  </span>
                  {isPositive ? (
                    <span className="text-xs font-bold text-emerald-400">+{deltaData.delta}</span>
                  ) : (
                    <span className="text-xs text-slate-500">Unchanged</span>
                  )}
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                    style={{ width: `${Math.min(100, deltaData.after)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* What Changed — Audit Log of Applied Improvements */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-orange-400" />
            <span>Applied Improvements ({report.changesApplied.length})</span>
          </h3>
          <span className="text-xs text-slate-400">100% Verified Truthful</span>
        </div>

        <div className="space-y-4">
          {report.changesApplied.map((change, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-orange-400 uppercase tracking-wider">
                  {change.section} &middot; Issue Fixed: {change.issueFixed}
                </span>
                <span className="text-slate-400">{change.reason}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-slate-400 line-through">
                  {change.originalText}
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 font-medium">
                  {change.appliedText}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/40 border border-slate-800">
        <button
          onClick={onNewScan}
          className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Analyze Another Resume</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadDocx}
            disabled={downloading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-400 text-slate-950 transition flex items-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <FileText className="h-4 w-4" />
            <span>Download Word (.docx)</span>
          </button>

        </div>
      </div>
    </div>
  );
};
