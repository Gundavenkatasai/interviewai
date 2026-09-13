import React from "react";
import {
  LayoutDashboard, User, BookOpen, Briefcase, GraduationCap,
  FolderGit2, Wrench, Award, Trophy, Bookmark, Globe, Heart,
  Languages, Sparkles, Sliders, ShieldCheck, Target, FileDiff,
  KeyRound, HeartPulse, Wand2, Edit3, MessageSquareText,
  FileCheck, ShieldAlert, Palette, Layers, Type, History,
  GitCompare, BarChart3, Share2, Download, ChevronLeft, ChevronRight
} from "lucide-react";

export type NavTabId =
  // BUILD
  | "overview"
  | "personal"
  | "summary"
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "certifications"
  | "achievements"
  | "internships"
  | "publications"
  | "volunteer"
  | "languages"
  | "interests"
  | "custom"
  // OPTIMIZE
  | "ats_scanner"
  | "job_match"
  | "jd_optimizer"
  | "keywords"
  | "resume_health"
  // AI TOOLS
  | "ai_generator"
  | "ai_bullet"
  | "ai_summary"
  | "ai_project"
  | "ai_achievement"
  | "grammar"
  | "credibility"
  // DESIGN
  | "templates"
  | "layout"
  | "typography"
  | "colors"
  // MANAGE
  | "versions"
  | "compare"
  | "analytics"
  | "share"
  | "export";

interface NavItem {
  id: NavTabId;
  label: string;
  icon: any;
  highlight?: boolean;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface ResumeLeftNavProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  atsScore?: number;
  completionPercent?: number;
}

export const ResumeLeftNav: React.FC<ResumeLeftNavProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  atsScore = 0,
  completionPercent = 0
}) => {
  const groups: NavGroup[] = [
    {
      title: "BUILD",
      items: [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "personal", label: "Personal Info", icon: User },
        { id: "summary", label: "Summary", icon: BookOpen },
        { id: "experience", label: "Experience", icon: Briefcase },
        { id: "education", label: "Education", icon: GraduationCap },
        { id: "projects", label: "Projects", icon: FolderGit2 },
        { id: "skills", label: "Skills", icon: Wrench },
        { id: "certifications", label: "Certifications", icon: Award },
        { id: "achievements", label: "Achievements", icon: Trophy },
        { id: "internships", label: "Internships", icon: Bookmark },
        { id: "publications", label: "Publications", icon: Globe },
        { id: "volunteer", label: "Volunteer", icon: Heart },
        { id: "languages", label: "Languages", icon: Languages },
        { id: "custom", label: "Custom Sections", icon: Sliders }
      ]
    },
    {
      title: "OPTIMIZE",
      items: [
        {
          id: "ats_scanner",
          label: "ATS Scanner",
          icon: ShieldCheck,
          badge: atsScore > 0 ? `${atsScore}` : "Scan",
          badgeColor: atsScore >= 80 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
        },
        { id: "job_match", label: "Job Match", icon: Target },
        { id: "jd_optimizer", label: "JD Optimizer", icon: FileDiff },
        { id: "keywords", label: "Keyword Intelligence", icon: KeyRound },
        { id: "resume_health", label: "Resume Health", icon: HeartPulse }
      ]
    },
    {
      title: "AI TOOLS",
      items: [
        { id: "ai_generator", label: "AI Resume Generator", icon: Wand2, highlight: true },
        { id: "ai_bullet", label: "Improve Bullet", icon: Edit3 },
        { id: "ai_summary", label: "Improve Summary", icon: MessageSquareText },
        { id: "ai_project", label: "Improve Project", icon: FileCheck },
        { id: "ai_achievement", label: "Generate Achievement", icon: Sparkles },
        { id: "grammar", label: "Grammar Assistant", icon: FileCheck },
        { id: "credibility", label: "Credibility Checker", icon: ShieldAlert }
      ]
    },
    {
      title: "DESIGN",
      items: [
        { id: "templates", label: "Templates", icon: Palette },
        { id: "layout", label: "Layout & Spacing", icon: Layers },
        { id: "typography", label: "Typography", icon: Type }
      ]
    },
    {
      title: "MANAGE",
      items: [
        { id: "versions", label: "Versions", icon: History },
        { id: "compare", label: "Compare Resumes", icon: GitCompare },
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "share", label: "Share Link", icon: Share2 },
        { id: "export", label: "Export Document", icon: Download }
      ]
    }
  ];

  return (
    <aside
      className={`border-r border-slate-800/80 bg-slate-950/60 backdrop-blur-sm flex flex-col shrink-0 transition-all duration-200 z-20 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Sidebar Header with Collapse Toggle */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sections &amp; Tools</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer ${collapsed ? "mx-auto" : ""}`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 no-scrollbar">
        {groups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <div className="px-2 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                {group.title}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                      isActive
                        ? "bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30 shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent"
                    } ${item.highlight ? "text-indigo-400" : ""}`}
                    title={item.label}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${item.badgeColor || "bg-slate-800 text-slate-300"}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
