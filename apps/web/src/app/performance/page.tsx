"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  Award,
  ArrowLeft,
  AlertTriangle,
  Brain,
  CheckCircle,
  Activity
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";

import { ApiClient } from "@/lib/api";

export default function PerformanceAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPerformance() {
      try {
        const perfData = await ApiClient.getPerformance();
        setData(perfData);
      } catch (err: any) {
        setError(err.message || "Failed to load performance analytics.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchPerformance();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Loading your performance analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Analytics Unavailable</h2>
        <p className="text-sm text-slate-400">{error}</p>
        <Link href="/dashboard" className="inline-block px-5 py-2 bg-indigo-600 rounded-xl font-semibold text-xs text-white">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Format data for LineChart (historical trends)
  const historyData = data.history?.map((session: any) => ({
    date: new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: session.overall_score,
    role: session.role
  })).reverse() || [];

  // Format data for RadarChart (topic strengths/weaknesses)
  const topicData = data.weak_areas?.map((area: any) => ({
    topic: area.topic,
    score: area.avg_score,
    fullMark: 10
  })).slice(0, 8) || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Bar */}
      <div className="flex items-center gap-4 border-b border-slate-800/80 pb-6">
        <Link
          href="/dashboard"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors block"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" />
            Performance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track your progress and identify areas for improvement.
          </p>
        </div>
      </div>

      {/* High-level stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Avg Score</div>
          <div className="text-3xl font-extrabold text-indigo-400">{data.summary?.average_overall_score || "N/A"}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Total Interviews</div>
          <div className="text-3xl font-extrabold text-emerald-400">{data.summary?.total_completed || 0}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Best Role</div>
          <div className="text-xl font-bold text-violet-400 mt-1 line-clamp-1">{data.summary?.best_role || "N/A"}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Avg Technical</div>
          <div className="text-3xl font-extrabold text-cyan-400">{data.summary?.average_technical_score || "N/A"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Score Trend (Last 10 Interviews)
          </h3>
          <div className="h-64 w-full">
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: "#64748b", fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", fontSize: 12 }}
                    itemStyle={{ color: "#818cf8" }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3} dot={{ r: 4, fill: "#818cf8" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">Not enough data to display trend.</div>
            )}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" />
            Topic Proficiency
          </h3>
          <div className="h-64 w-full">
            {topicData.length >= 3 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={topicData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="topic" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: "#64748b", fontSize: 10 }} />
                  <Radar name="Proficiency" dataKey="score" stroke="#c084fc" fill="#c084fc" fillOpacity={0.4} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", fontSize: 12 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center">Complete more interviews across different topics<br/>to generate your proficiency map (needs min 3 topics).</div>
            )}
          </div>
        </div>
      </div>

      {/* Weak Areas Detail */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-4">Targeted Improvements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.weak_areas?.slice(0, 6).map((area: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-xs text-slate-400 uppercase mb-1">{area.category}</div>
              <div className="font-bold text-white mb-2 line-clamp-1">{area.topic}</div>
              <div className="flex justify-between items-end">
                <div className="text-xs text-slate-500">{area.attempts} attempts</div>
                <div className="text-lg font-bold text-amber-400">{area.avg_score.toFixed(1)} / 10</div>
              </div>
            </div>
          ))}
          {(!data.weak_areas || data.weak_areas.length === 0) && (
            <div className="col-span-full text-xs text-slate-500 py-4">No weak areas identified yet.</div>
          )}
        </div>
      </div>

    </div>
  );
}
