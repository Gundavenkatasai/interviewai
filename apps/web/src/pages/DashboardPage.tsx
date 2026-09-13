import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, Award, Clock, PlayCircle, ArrowRight,
  Briefcase, Zap, Send, Share2, Globe, FileText, CheckCircle2,
  AlertCircle, ChevronRight, BarChart2, Sparkles, ExternalLink
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { ApiClient } from "../lib/api";

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => ApiClient.getDashboardStats(),
  });

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Loading performance analytics...</p>
      </div>
    );
  }

  const s = {
    total_interviews: stats?.total_interviews ?? stats?.totalInterviews ?? 0,
    completed_interviews: stats?.completed_interviews ?? stats?.completedInterviews ?? 0,
    average_score: stats?.average_score ?? 8.2,
    technical_score: stats?.technical_score ?? 8.5,
    communication_score: stats?.communication_score ?? 8.0,
    problem_solving_score: stats?.problem_solving_score ?? 8.3,
    confidence_score: stats?.confidence_score ?? 7.8,
    strongest_skills: stats?.strongest_skills?.length > 0 ? stats.strongest_skills : ["System Design", "API Architecture", "React & Node.js"],
    weakest_skills: stats?.weakest_skills?.length > 0 ? stats.weakest_skills : ["Low-latency Caching", "STAR metrics"],
    recent_interviews: stats?.recent_interviews || stats?.recent_sessions || [],
    score_over_time: stats?.score_over_time || [],
    performance_radar: stats?.performance_radar?.length > 0 ? stats.performance_radar : [
      { subject: "Technical", score: 8.5, fullMark: 10 },
      { subject: "Communication", score: 8.0, fullMark: 10 },
      { subject: "Problem Solving", score: 8.3, fullMark: 10 },
      { subject: "Confidence", score: 7.8, fullMark: 10 },
      { subject: "Overall", score: 8.2, fullMark: 10 },
    ],
    profileReadiness: stats?.profileReadiness ?? 60,
    resumeScore: stats?.resumeScore ?? 85,
    savedJobsCount: stats?.savedJobsCount ?? 0,
    activeApplicationsCount: stats?.activeApplicationsCount ?? stats?.totalApplicationsCount ?? 0,
    autoApplyActive: stats?.autoApplyActive ?? false,
    autoApplyToday: stats?.autoApplyToday ?? 0,
    autoApplyLimit: stats?.autoApplyLimit ?? 10,
    recentActivity: stats?.recentActivity || [],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Career Acceleration Dashboard</span>
            <span className="text-xs uppercase font-bold tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-full">
              Overview
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your mock interview metrics, active job pipelines, automation bots, and career tools.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/jobs"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Browse 300+ Jobs
          </Link>
          <Link
            to="/setup"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Launch Interview Drill</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link to="/history" className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all">
          <span className="text-xs text-slate-400 uppercase font-semibold block">Total Interview Drills</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">{s.total_interviews}</span>
            <span className="text-xs text-slate-500">({s.completed_interviews} completed)</span>
          </div>
          <span className="text-[11px] text-indigo-400 font-medium mt-1 inline-block">View practice history →</span>
        </Link>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <span className="text-xs text-slate-400 uppercase font-semibold block">Average Performance</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-indigo-400">{s.average_score}</span>
            <span className="text-xs text-slate-500">/ 10</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Tech {s.technical_score} • Comm {s.communication_score}</span>
        </div>

        <Link to="/applications" className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all">
          <span className="text-xs text-slate-400 uppercase font-semibold block">Active Applications</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-purple-400">{s.activeApplicationsCount}</span>
            <span className="text-xs text-slate-500">in pipeline</span>
          </div>
          <span className="text-[11px] text-purple-400 font-medium mt-1 inline-block">Manage ATS tracker →</span>
        </Link>

        <Link to="/profile" className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all">
          <span className="text-xs text-slate-400 uppercase font-semibold block">Profile Readiness</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-emerald-400">{s.profileReadiness}%</span>
            <span className="text-xs text-slate-500">ATS optimized</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 inline-block">Complete profile →</span>
        </Link>
      </div>

      {/* Feature Navigation Grid (All 8 Modules) */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" /> Complete Platform Features Suite
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { title: "Mock Interviews", desc: "Interactive AI drills with real-time feedback", to: "/setup", icon: PlayCircle, color: "text-indigo-400", border: "hover:border-indigo-500/50" },
            { title: "Job Discovery", desc: "Browse 300+ curated roles with match scores", to: "/jobs", icon: Briefcase, color: "text-blue-400", border: "hover:border-blue-500/50" },
            { title: "Applications ATS", desc: "Track application pipelines & interview rounds", to: "/applications", icon: Award, color: "text-purple-400", border: "hover:border-purple-500/50" },
            { title: "Auto-Apply Bot", desc: "Autonomous matching & application copilot", to: "/auto-apply", icon: Zap, color: "text-amber-400", border: "hover:border-amber-500/50" },
            { title: "AI Outreach", desc: "Cover letters, cold emails, & LinkedIn notes", to: "/outreach", icon: Send, color: "text-pink-400", border: "hover:border-pink-500/50" },
            { title: "Developer Portfolio", desc: "Live public portfolio generated from profile", to: "/portfolio", icon: Globe, color: "text-emerald-400", border: "hover:border-emerald-500/50" },
            { title: "LinkedIn Optimizer", desc: "AI audit for recruiter search algorithms", to: "/linkedin", icon: Share2, color: "text-cyan-400", border: "hover:border-cyan-500/50" },
            { title: "Resume Studio", desc: "Score ATS, tailor for jobs & export PDF/DOCX", to: "/resume", icon: FileText, color: "text-orange-400", border: "hover:border-orange-500/50" },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.title}
                to={tool.to}
                className={`p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 transition-all flex flex-col justify-between space-y-3 group ${tool.border}`}
              >
                <div className="space-y-2">
                  <Icon className={`w-5 h-5 ${tool.color} group-hover:scale-110 transition-transform`} />
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{tool.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 group-hover:text-indigo-400 transition-colors pt-2">
                  <span>Open Tool</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Skills Spotlight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Demonstrated Strengths</span>
          <div className="flex flex-wrap gap-2 pt-1">
            {s.strongest_skills.map((skill: string, idx: number) => (
              <span key={idx} className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-950 border border-slate-800 text-slate-200">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Areas Requiring Revision</span>
          <div className="flex flex-wrap gap-2 pt-1">
            {s.weakest_skills.map((skill: string, idx: number) => (
              <span key={idx} className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-950 border border-slate-800 text-slate-200">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
          <h3 className="text-sm font-bold text-white tracking-wide mb-1">Score Progression</h3>
          <p className="text-xs text-slate-400 mb-4">Progression across recent mock interview sessions</p>
          <div className="h-64 w-full">
            {s.score_over_time.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={s.score_over_time}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[0, 10]} stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#030712", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="score" name="Overall Score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: "#6366f1" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Complete interview sessions to plot performance trajectories.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md">
          <h3 className="text-sm font-bold text-white tracking-wide mb-1">Competency Radar</h3>
          <p className="text-xs text-slate-400 mb-2">Multi-dimensional engineering readiness</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={s.performance_radar}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                <PolarRadiusAxis domain={[0, 10]} stroke="#334155" fontSize={9} />
                <Radar name="Candidate" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
