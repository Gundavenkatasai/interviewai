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
  ExternalLink,
  Target,
  Clock,
  Search,
  Layers
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
  const hasAnalysis = Boolean(analysis && analysis.score !== undefined);
  const score = hasAnalysis ? analysis.score : null;
  const scheduledDrafts = drafts.filter((d) => d.publicationStatus === "SCHEDULED");
  const draftCount = drafts.length;
  const engagerCount = engagers.length;
  const planItemsCount = calendarPlan?.items?.length || 0;

  // Extract top 3 actual issues from 14 sections
  const sections = analysis?.sections || {};
  const issuesList: { section: string; issue: string }[] = [];
  Object.entries(sections).forEach(([secKey, secVal]: [string, any]) => {
    if (secVal?.issues && Array.isArray(secVal.issues)) {
      secVal.issues.forEach((iss: string) => {
        if (issuesList.length < 3) {
          issuesList.push({ section: secKey, issue: iss });
        }
      });
    }
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Native LinkedIn Career & Content Engine</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Career Intelligence & Content Workspace
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Deterministic 14-section profile rubric, uninvented Story Bank content generation, 4-pass humanizer, and verified career integration.
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

      {/* Metric Cards Grid - 100% Real Stored Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profile Health */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Profile Score</span>
              <TrendingUp className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {score !== null ? score : "—"}
              </span>
              <span className="text-xs text-slate-400">
                {score !== null ? "/ 100" : "Not Analyzed"}
              </span>
            </div>
            {score !== null ? (
              <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    score > 75 ? "bg-emerald-500" : score > 50 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Run profile analysis to compute</p>
            )}
          </div>
          <button
            onClick={() => onNavigateTab("profile-analyzer")}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            {hasAnalysis ? "Review 14 sections" : "Run analysis"}{" "}
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Content Drafts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Content Repository</span>
              <FileText className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{draftCount}</span>
              <span className="text-xs text-slate-400">{scheduledDrafts.length} scheduled</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {scheduledDrafts.length > 0
                ? `${scheduledDrafts.length} approved in calendar`
                : "No posts pending publication"}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab("posts")}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            View post repository <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Content Calendar */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Scheduled Plan</span>
              <Calendar className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{planItemsCount}</span>
              <span className="text-xs text-slate-400">planned slots</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {planItemsCount > 0 ? "Strategic sprint active" : "No active calendar schedule"}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab("content-calendar")}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            View calendar <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Audience Intelligence */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Public Signals</span>
              <Users className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{engagerCount}</span>
              <span className="text-xs text-slate-400">observed engagers</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {engagerCount > 0 ? "Target company contacts" : "Scan post for public engagers"}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab("audience")}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            Inspect engagers <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Top 3 Profile Problems & Next Best Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 3 Identified Problems */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Top Profile Issues & Next Best Action
            </h3>
            <span className="text-xs text-slate-500">Live Rubric Diagnostics</span>
          </div>

          {issuesList.length > 0 ? (
            <div className="space-y-3">
              {issuesList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded uppercase">
                        {item.section}
                      </span>
                      <h4 className="text-xs font-medium text-slate-200">{item.issue}</h4>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab("profile-optimizer")}
                    className="shrink-0 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:bg-indigo-500/10"
                  >
                    Optimize
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-center space-y-2">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400" />
              <p className="text-xs text-slate-300">
                {hasAnalysis
                  ? "All audited sections meet or exceed baseline criteria. Keep headline keywords fresh."
                  : "No profile issues recorded yet. Run a profile analysis to populate audit diagnostics."}
              </p>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => onNavigateTab("profile-optimizer")}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-left transition"
            >
              <div>
                <span className="text-xs font-bold text-white block">Profile Optimizer</span>
                <span className="text-[10px] text-slate-400">Headlines, About, Skills</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
            </button>

            <button
              onClick={() => onNavigateTab("research")}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-left transition"
            >
              <div>
                <span className="text-xs font-bold text-white block">Job & Company Search</span>
                <span className="text-[10px] text-slate-400">Public LinkedIn pipeline</span>
              </div>
              <Search className="h-3.5 w-3.5 text-indigo-400" />
            </button>

            <button
              onClick={() => onNavigateTab("analytics")}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-left transition"
            >
              <div>
                <span className="text-xs font-bold text-white block">Verified Analytics</span>
                <span className="text-[10px] text-slate-400">Post reach & formula trends</span>
              </div>
              <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
            </button>
          </div>
        </div>

        {/* Runtime & Connectors Health */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Runtime Providers & Privacy
            </h3>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Verified</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Active Provider</span>
              <span className="font-semibold text-indigo-400">Public Guest / Browser</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">API Key Requirement</span>
              <span className="font-semibold text-emerald-400">None (Zero Cost)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Session Cookie Harvesting</span>
              <span className="font-semibold text-emerald-400">Disabled (Safe)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Publish Approval Mode</span>
              <span className="font-semibold text-amber-400">Strict (User Confirms)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
