import React, { useState } from "react";
import {
  ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw,
  HelpCircle, Eye
} from "lucide-react";
import { ApiClient } from "../../../../lib/api";

interface AICredibilityWorkspaceProps {
  resume: any;
}

export const AICredibilityWorkspace: React.FC<AICredibilityWorkspaceProps> = ({
  resume,
}) => {
  const [checking, setChecking] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunCheck = async () => {
    if (!resume?._id) return;
    setChecking(true);
    setError(null);
    try {
      const res = await ApiClient.checkCredibility(resume._id);
      setReport(res?.report || res?.credibility || res);
    } catch (err: any) {
      setError(err.message || "Failed to complete credibility scan.");
    } finally {
      setChecking(false);
    }
  };

  const concerns = report?.concerns || report?.findings || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-semibold text-slate-100">Resume Credibility & Integrity Checker</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Scans for ambiguous metrics, timeline overlaps, unsupported claims, and phrasing that recruiters frequently challenge during technical screens.
            </p>
          </div>

          <button
            onClick={handleRunCheck}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Scanning Integrity..." : (report ? "Re-Run Scan" : "Check Credibility")}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {report ? (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Credibility Confidence</div>
              <div className="text-2xl font-bold text-slate-100 mt-1">
                {report.score ?? (concerns.length === 0 ? "High Integrity" : `${Math.max(60, 100 - concerns.length * 10)}/100`)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Items For Verification</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{concerns.length}</div>
            </div>
          </div>

          {/* Concerns List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Verification Findings
            </h3>

            {concerns.length > 0 ? (
              concerns.map((c: any, idx: number) => (
                <div
                  key={idx}
                  className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-200">
                        {c.title || c.concern || "Potential Claim For Verification"}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {c.reason || c.description}
                      </p>
                    </div>
                  </div>

                  {c.evidence && (
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300">
                      <span className="text-slate-500 font-sans mr-2">Flagged phrase:</span>
                      "{c.evidence}"
                    </div>
                  )}

                  {c.recommendation && (
                    <div className="text-xs text-indigo-300 bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-500/20">
                      <strong>Recommended adjustment:</strong> {c.recommendation}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-300 text-sm">
                <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
                <div>
                  <div className="font-medium">No credibility concerns detected.</div>
                  <div className="text-xs text-emerald-400/80 mt-0.5">
                    Your dates appear consistent, metrics are grounded, and phrasing is professionally balanced.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-200">Credibility Audit Not Yet Run</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Check your resume for common interview flags like impossible timelines, contradictory technologies, or ungrounded statistics.
          </p>
          <button
            onClick={handleRunCheck}
            disabled={checking}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            {checking ? "Scanning..." : "Run Credibility Audit"}
          </button>
        </div>
      )}
    </div>
  );
};
