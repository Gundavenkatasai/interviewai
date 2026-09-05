"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Activity,
  Users,
  Database,
  Cpu,
  Mic,
  Settings2,
  ArrowLeft,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { ApiClient } from "@/lib/api";

export default function AdminPage() {
  const router = useRouter();
  const [health, setHealth] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [thresholds, setThresholds] = useState({
    duplicate_threshold: 0.85,
    question_candidates_count: 5,
    default_max_questions: 10
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [healthData, metricsData] = await Promise.all([
          ApiClient.getAdminHealth(),
          ApiClient.getAdminMetrics()
        ]);
        setHealth(healthData);
        setMetrics(metricsData);
        if (healthData.thresholds) {
          setThresholds({
            duplicate_threshold: healthData.thresholds.duplicate_threshold,
            question_candidates_count: healthData.thresholds.candidate_count,
            default_max_questions: healthData.thresholds.default_max_questions
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to load admin data. Are you an administrator?");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleUpdateThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMsg(null);
    try {
      await ApiClient.updateAdminThresholds(thresholds);
      setUpdateMsg("Thresholds updated successfully.");
      setTimeout(() => setUpdateMsg(null), 3000);
    } catch (err: any) {
      alert("Failed to update thresholds: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Loading admin panel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <Shield className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Access Denied</h2>
        <p className="text-sm text-slate-400">{error}</p>
        <Link href="/dashboard" className="inline-block px-5 py-2 bg-indigo-600 rounded-xl font-semibold text-xs text-white">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "healthy" || status === "ok") {
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    }
    return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-800/80 pb-6">
        <Link
          href="/dashboard"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors block"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-400" />
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            System health, usage analytics, and platform configuration.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-emerald-400" />
            System Health
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Database className="w-4 h-4 text-slate-500" /> Database (PostgreSQL)
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                <StatusIcon status={health?.database} /> {health?.database}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Database className="w-4 h-4 text-slate-500" /> Vector Search
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                <StatusIcon status={health?.vectorSearch} /> {health?.vectorSearch}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Cpu className="w-4 h-4 text-slate-500" /> LLM Provider ({health?.llm?.provider})
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                <StatusIcon status={health?.llm?.status} /> {health?.llm?.status}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Mic className="w-4 h-4 text-slate-500" /> Speech Provider ({health?.speech?.provider})
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                <StatusIcon status={health?.speech?.status} /> {health?.speech?.status}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Analytics */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-indigo-400" />
            Platform Usage
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
              <div className="text-xs text-slate-400 font-semibold mb-1">Total Users</div>
              <div className="text-2xl font-bold text-white">{metrics?.overview?.total_users || 0}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
              <div className="text-xs text-slate-400 font-semibold mb-1">Total Sessions</div>
              <div className="text-2xl font-bold text-white">{metrics?.overview?.total_sessions || 0}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
              <div className="text-xs text-slate-400 font-semibold mb-1">Questions Asked</div>
              <div className="text-2xl font-bold text-white">{metrics?.overview?.total_questions_asked || 0}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
              <div className="text-xs text-slate-400 font-semibold mb-1">Avg Global Score</div>
              <div className="text-2xl font-bold text-indigo-400">{metrics?.overview?.average_overall_score || 0} / 10</div>
            </div>
          </div>
        </div>
      </div>

      {/* Threshold Configuration */}
      <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-4">
        <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2 mb-4">
          <Settings2 className="w-4 h-4" />
          Engine Configuration (Live)
        </h3>
        
        {updateMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {updateMsg}
          </div>
        )}

        <form onSubmit={handleUpdateThresholds} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Duplicate Threshold (Cosine Sim)</label>
              <input suppressHydrationWarning
                type="number"
                step="0.01"
                min="0.5"
                max="1.0"
                value={thresholds.duplicate_threshold}
                onChange={(e) => setThresholds({ ...thresholds, duplicate_threshold: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Lower = stricter dedup. Default: 0.85.</p>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Candidates Generated</label>
              <input suppressHydrationWarning
                type="number"
                min="3"
                max="10"
                value={thresholds.question_candidates_count}
                onChange={(e) => setThresholds({ ...thresholds, question_candidates_count: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Number of questions LLM generates per batch. Default: 5.</p>
            </div>
          </div>
          
          <button suppressHydrationWarning
            type="submit"
            disabled={isUpdating}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {isUpdating ? "Applying..." : "Apply Thresholds"}
          </button>
        </form>
      </div>

    </div>
  );
}
