import React, { useState, useEffect } from "react";
import {
  BarChart2, Clock, Activity, ShieldCheck, Target,
  Download, RefreshCw, AlertTriangle
} from "lucide-react";
import { ApiClient } from "../../../../lib/api";

interface ResumeAnalyticsWorkspaceProps {
  resume: any;
}

export const ResumeAnalyticsWorkspace: React.FC<ResumeAnalyticsWorkspaceProps> = ({
  resume,
}) => {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!resume?._id) return;
    setLoading(true);
    setError(null);
    try {
      const [anData, actData] = await Promise.allSettled([
        ApiClient.getResumeAnalytics(resume._id),
        ApiClient.getResumeActivity(resume._id),
      ]);

      if (anData.status === "fulfilled") {
        setAnalytics(anData.value?.analytics || anData.value);
      }
      if (actData.status === "fulfilled") {
        setActivity(actData.value || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load resume analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [resume?._id]);

  const hasActivity = activity && activity.length > 0;
  const scansCount = analytics?.atsScansCount ?? (resume?.atsCompatibility ? 1 : 0);
  const matchesCount = analytics?.jobMatchesCount ?? 0;
  const exportsCount = analytics?.exportsCount ?? 0;
  const versionsCount = analytics?.versionsCount ?? 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-semibold text-slate-100">Resume Activity & Analytics</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Verifiable activity metrics tracked across your editing, ATS scanning, job matching, and export sessions.
            </p>
          </div>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">ATS Scans</span>
          </div>
          <div className="text-2xl font-bold text-slate-100">{scansCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Diagnostics completed</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Job Matches</span>
          </div>
          <div className="text-2xl font-bold text-slate-100">{matchesCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Target roles analyzed</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <Download className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Exports</span>
          </div>
          <div className="text-2xl font-bold text-slate-100">{exportsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">PDF & DOCX generated</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Snapshots</span>
          </div>
          <div className="text-2xl font-bold text-slate-100">{versionsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Document revisions</div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Recorded Event Log
        </h3>

        {hasActivity ? (
          <div className="divide-y divide-slate-800/60">
            {activity.map((act: any, idx: number) => (
              <div key={idx} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div>
                    <div className="font-medium text-slate-200">{act.action || act.description || "Resume Updated"}</div>
                    {act.details && <div className="text-slate-400 mt-0.5">{act.details}</div>}
                  </div>
                </div>
                <div className="text-slate-500 shrink-0 font-mono text-[11px]">
                  {new Date(act.timestamp || act.createdAt || Date.now()).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No historical events logged for this resume yet. Actions like saving, ATS scanning, and tailoring will appear here.
          </div>
        )}
      </div>
    </div>
  );
};
