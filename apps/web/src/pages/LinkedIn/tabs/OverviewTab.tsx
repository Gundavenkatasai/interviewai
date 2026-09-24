import React from "react";
import {
  Sparkles,
  TrendingUp,
  FileText,
  Calendar,
  MessageSquare,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  ExternalLink
} from "lucide-react";

interface OverviewTabProps {
  onNavigateTab: (tab: string) => void;
  analysis: any;
  drafts: any[];
  calendarPlan: any;
  engagers: any[];
  connections: any;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  onNavigateTab,
  analysis,
  drafts,
  calendarPlan,
  engagers,
  connections,
}) => {
  const score = analysis?.score || 68;
  const scheduledCount = drafts.filter(d => d.publicationStatus === "SCHEDULED").length;
  const draftCount = drafts.length;
  const engagerCount = engagers.length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Native LinkedIn Skills Engine (sergebulaev/linkedin-skills)</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              LinkedIn Growth & Career Engine
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Optimize your profile with proven formulas, draft uninvented long-form posts from your Story Bank, schedule safely, and turn engagement into career opportunities.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigateTab("content-studio")}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500"
            >
              <PlusCircle className="h-4 w-4" />
              Create Post
            </button>
            <button
              onClick={() => onNavigateTab("profile-analyzer")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
            >
              <Sparkles className="h-4 w-4 text-purple-400" />
              Analyze Profile
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Profile Health */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Profile Score</span>
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{score}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${score > 75 ? "bg-emerald-500" : score > 50 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <button
            onClick={() => onNavigateTab("profile-analyzer")}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            Review suggestions <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Content Drafts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Content Drafts</span>
            <FileText className="h-4 w-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{draftCount}</span>
            <span className="text-xs text-slate-400">{scheduledCount} scheduled</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {scheduledCount > 0 ? `${scheduledCount} approved for publishing` : "No pending queue"}
          </p>
          <button
            onClick={() => onNavigateTab("content-studio")}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            Open studio <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Content Calendar */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Weekly Plan</span>
            <Calendar className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{calendarPlan?.items?.length || 7}</span>
            <span className="text-xs text-slate-400">planned slots</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Formulas F1–F20 mapped</p>
          <button
            onClick={() => onNavigateTab("content-calendar")}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            View calendar <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Audience Intelligence */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Audience Signals</span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{engagerCount || 12}</span>
            <span className="text-xs text-slate-400">tracked contacts</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Target company engagers</p>
          <button
            onClick={() => onNavigateTab("audience")}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            Inspect ICPs <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Next Best Actions & Integrations Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Best Actions (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Next Best Actions (Career Intelligence)
            </h3>
            <span className="text-xs text-slate-500">Derived from actual state</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 hover:border-slate-700 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                    Profile Optimization
                  </span>
                  <h4 className="text-sm font-medium text-slate-200">
                    Strengthen headline with keyword metrics
                  </h4>
                </div>
                <p className="text-xs text-slate-400">
                  Your headline could highlight high-demand skills like Node.js and Architecture to increase search frequency.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab("profile-analyzer")}
                className="shrink-0 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:bg-indigo-500/10"
              >
                Review
              </button>
            </div>

            <div className="flex items-start justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 hover:border-slate-700 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    Content Creation
                  </span>
                  <h4 className="text-sm font-medium text-slate-200">
                    Draft a number-first post using Formula F7
                  </h4>
                </div>
                <p className="text-xs text-slate-400">
                  Odd-precision metrics in line 1 earn +34% median reach in the 2026 feed. Pull facts from your Story Bank.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab("content-studio")}
                className="shrink-0 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:bg-indigo-500/10"
              >
                Draft Post
              </button>
            </div>

            <div className="flex items-start justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 hover:border-slate-700 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Story Bank Interviewer
                  </span>
                  <h4 className="text-sm font-medium text-slate-200">
                    Capture 2 turning points from your recent project
                  </h4>
                </div>
                <p className="text-xs text-slate-400">
                  Run the conversational interviewer to extract defensible numbers and metrics without making anything up.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab("story-bank")}
                className="shrink-0 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:bg-indigo-500/10"
              >
                Interview Me
              </button>
            </div>
          </div>
        </div>

        {/* Integration Health Card (1 Col) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
              Runtime & Connectors
            </h3>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">MIT Licensed</span>
          </div>

          <p className="text-xs text-slate-400">
            Interview AI invokes the upstream Python/CLI runtime through thin adapters with zero API-dependency lock-in.
          </p>

          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs">
              <span className="text-slate-300 font-medium">Read Provider</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {connections?.providers?.read?.status === "CONNECTED" ? "Apify Connected" : "Manual Paste Mode"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs">
              <span className="text-slate-300 font-medium">Publish Provider</span>
              <span className="inline-flex items-center gap-1.5 text-indigo-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                {connections?.providers?.publish?.status === "CONNECTED" ? "Publora Auto-Post" : "Manual Copy-Ready"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs">
              <span className="text-slate-300 font-medium">Media Engine</span>
              <span className="inline-flex items-center gap-1.5 text-purple-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-purple-400" />
                {connections?.providers?.media?.status === "CONNECTED" ? "Pixfaro Connected" : "Prompt Generator"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs">
              <span className="text-slate-300 font-medium">Approval Policy</span>
              <span className="text-slate-400 font-mono">Strict (Approval Gate)</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("settings")}
            className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-medium pt-2 block"
          >
            Manage Provider Settings & Keys →
          </button>
        </div>
      </div>
    </div>
  );
};
