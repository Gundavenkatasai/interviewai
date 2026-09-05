"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  TrendingUp,
  Award,
  Clock,
  Briefcase,
  PlayCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar
} from "recharts";

import { ApiClient } from "@/lib/api";
import { DashboardStats } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await ApiClient.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Loading performance analytics...</p>
      </div>
    );
  }

  const s = stats || {
    total_interviews: 0,
    completed_interviews: 0,
    average_score: 0.0,
    technical_score: 0.0,
    communication_score: 0.0,
    problem_solving_score: 0.0,
    confidence_score: 0.0,
    strongest_skills: ["System Design", "JavaScript"],
    weakest_skills: ["Concurrency"],
    recent_interviews: [],
    score_over_time: [],
    performance_radar: [],
    topic_performance: [],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Interview Performance Analytics</span>
            <span className="text-xs uppercase font-semibold tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-full">
              Dashboard
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your progress across technical, communication, and algorithmic interview drills.
          </p>
        </div>

        <Link
          href="/setup"
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
        >
          <PlayCircle className="w-4 h-4" />
          <span>New Interview</span>
        </Link>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Sessions</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">{s.total_interviews}</span>
            <span className="text-xs text-slate-500">({s.completed_interviews} completed)</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
          <span className="text-xs text-slate-400 uppercase font-semibold">Average Score</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-indigo-400">{s.average_score}</span>
            <span className="text-xs text-slate-500">/ 10</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
          <span className="text-xs text-slate-400 uppercase font-semibold">Technical Score</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-emerald-400">{s.technical_score}</span>
            <span className="text-xs text-slate-500">/ 10</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
          <span className="text-xs text-slate-400 uppercase font-semibold">Communication</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-purple-400">{s.communication_score}</span>
            <span className="text-xs text-slate-500">/ 10</span>
          </div>
        </div>
      </div>

      {/* Skills Spotlight: Strongest vs Weakest */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
            Top Demonstrated Strengths
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {s.strongest_skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-950 border border-slate-800 text-slate-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
            Focus Areas for Revision
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {s.weakest_skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-950 border border-slate-800 text-slate-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Over Time Line Chart */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Score Over Time</h3>
            <p className="text-xs text-slate-400">Progression across your recent interview sessions</p>
          </div>

          <div className="h-64 w-full">
            {s.score_over_time.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={s.score_over_time}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[0, 10]} stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#030712",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Overall"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#6366f1" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="technical"
                    name="Technical"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="communication"
                    name="Communication"
                    stroke="#c084fc"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Complete your first interview session to plot progress charts.
              </div>
            )}
          </div>
        </div>

        {/* 5-Dimensional Radar Performance */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-white tracking-wide">Competency Radar</h3>
            <p className="text-xs text-slate-400">Balance across critical hiring metrics</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={s.performance_radar}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                <PolarRadiusAxis domain={[0, 100]} stroke="#334155" fontSize={9} />
                <Radar
                  name="Candidate"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Interviews Table */}
      <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-wide">Recent Interview Sessions</h3>
          <Link href="/history" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
            View All →
          </Link>
        </div>

        {s.recent_interviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Difficulty</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {s.recent_interviews.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">{sess.role}</td>
                    <td className="py-3 px-3">{sess.interview_type}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950 border border-slate-800">
                        {sess.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-3 capitalize">
                      <span
                        className={`inline-flex items-center gap-1.5 ${
                          sess.status === "completed" ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {sess.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {sess.score !== null ? `${sess.score} / 10` : "—"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={sess.status === "completed" ? `/report/${sess.id}` : `/interview/${sess.id}`}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                      >
                        {sess.status === "completed" ? "Report" : "Resume"} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-slate-500">
            No interview sessions yet. Start your first session to begin!
          </div>
        )}
      </div>
    </div>
  );
}
