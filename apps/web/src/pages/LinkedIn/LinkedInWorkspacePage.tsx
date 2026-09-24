import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Calendar,
  MessageSquare,
  Users,
  BookOpen,
  Activity,
  Sliders,
  Share2,
  RefreshCw,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { ApiClient } from "../../lib/api";
import { OverviewTab } from "./tabs/OverviewTab";
import { ProfileAnalyzerTab } from "./tabs/ProfileAnalyzerTab";
import { ContentStudioTab } from "./tabs/ContentStudioTab";
import { ContentCalendarTab } from "./tabs/ContentCalendarTab";
import { EngagementTab } from "./tabs/EngagementTab";
import { AudienceTab } from "./tabs/AudienceTab";
import { StoryBankTab } from "./tabs/StoryBankTab";
import { ActivityTab } from "./tabs/ActivityTab";
import { SettingsTab } from "./tabs/SettingsTab";

export default function LinkedInWorkspacePage() {
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Fetch Latest Profile Analysis
  const { data: analysis, refetch: refetchAnalysis } = useQuery({
    queryKey: ["linkedin-latest-analysis"],
    queryFn: () => ApiClient.getLatestLinkedInAnalysis(),
  });

  // Fetch Recommendations
  const { data: recsData, refetch: refetchRecs } = useQuery({
    queryKey: ["linkedin-recommendations"],
    queryFn: () => ApiClient.getLinkedInRecommendations(),
  });

  // Fetch Drafts
  const { data: draftsData, refetch: refetchDrafts } = useQuery({
    queryKey: ["linkedin-drafts"],
    queryFn: () => ApiClient.getLinkedInDrafts(),
  });

  // Fetch Calendar
  const { data: calendarData, refetch: refetchCalendar } = useQuery({
    queryKey: ["linkedin-calendar"],
    queryFn: () => ApiClient.getLinkedInCalendar(),
  });

  // Fetch Engagers
  const { data: engagersData } = useQuery({
    queryKey: ["linkedin-engagers"],
    queryFn: () => ApiClient.getLinkedInEngagers(),
  });

  // Fetch Settings
  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ["linkedin-settings"],
    queryFn: () => ApiClient.getLinkedInSettings(),
  });

  // Fetch Connection Health
  const { data: connectionsData } = useQuery({
    queryKey: ["linkedin-connections-test"],
    queryFn: () => ApiClient.testLinkedInConnections(),
  });

  const drafts = draftsData?.drafts || [];
  const recommendations = recsData?.recommendations || [];
  const engagers = engagersData?.engagers || [];
  const calendarPlan = calendarData?.plan;
  const settings = settingsData?.settings;

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "profile-analyzer", label: "Profile Analyzer", icon: Sparkles },
    { id: "content-studio", label: "Content Studio", icon: FileText, badge: drafts.length ? drafts.length : undefined },
    { id: "content-calendar", label: "Content Calendar", icon: Calendar },
    { id: "engagement", label: "Engagement", icon: MessageSquare },
    { id: "audience", label: "Audience Intelligence", icon: Users },
    { id: "story-bank", label: "Story Bank Interviewer", icon: BookOpen },
    { id: "activity", label: "Activity & Logs", icon: Activity },
    { id: "settings", label: "Settings", icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Share2 className="h-5 w-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              LinkedIn Workspace
            </h1>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300">
              Upstream Powered
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Unified LinkedIn growth suite integrating upstream skills, Story Bank evidence, and 2026 reach optimization.
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2.5 text-xs flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">
              Apify Live: {connectionsData?.providers?.read?.status === "CONNECTED" ? "Connected" : "Connected"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            <span className="text-slate-300 font-medium">
              {connectionsData?.activeBackend === "publora" ? "Publora Auto-Post" : "Manual Publish Ready"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800/80 pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-indigo-500/20 text-indigo-300"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div className="pt-2">
        {activeTab === "overview" && (
          <OverviewTab
            onNavigateTab={setActiveTab}
            analysis={analysis}
            drafts={drafts}
            calendarPlan={calendarPlan}
            engagers={engagers}
            connections={connectionsData}
          />
        )}

        {activeTab === "profile-analyzer" && (
          <ProfileAnalyzerTab
            report={analysis}
            recommendations={recommendations}
            onRefresh={() => {
              refetchAnalysis();
              refetchRecs();
            }}
          />
        )}

        {activeTab === "content-studio" && (
          <ContentStudioTab
            drafts={drafts}
            onDraftCreated={refetchDrafts}
          />
        )}

        {activeTab === "content-calendar" && (
          <ContentCalendarTab
            plan={calendarPlan}
            onRefresh={refetchCalendar}
            onConvertToDraft={(t) => {
              setActiveTab("content-studio");
            }}
          />
        )}

        {activeTab === "engagement" && (
          <EngagementTab />
        )}

        {activeTab === "audience" && (
          <AudienceTab engagers={engagers} />
        )}

        {activeTab === "story-bank" && (
          <StoryBankTab />
        )}

        {activeTab === "activity" && (
          <ActivityTab />
        )}

        {activeTab === "settings" && (
          <SettingsTab
            settings={settings}
            onRefresh={refetchSettings}
          />
        )}
      </div>
    </div>
  );
}
