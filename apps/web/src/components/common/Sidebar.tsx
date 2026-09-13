import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, PlayCircle, History, Activity, Briefcase, Bookmark,
  FileText, Award, Zap, Send, Share2, Globe, User as UserIcon, Shield,
  ShieldCheck, Sparkles, LogOut, Sun, Moon, Menu, X, ChevronRight,
  ChevronLeft, PanelLeftClose, PanelLeft, BarChart3
} from "lucide-react";
import { useAuth } from "../../contexts/AuthProvider";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const pathname = location.pathname;

  const navGroups = user
    ? [
        {
          title: "PRACTICE & ANALYTICS",
          links: [
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/setup", label: "Mock Interview", icon: PlayCircle },
            { href: "/analytics", label: "Career Analytics", icon: BarChart3 },
            { href: "/history", label: "Practice History", icon: History },
            { href: "/performance", label: "Performance", icon: Activity },
          ]
        },
        {
          title: "CAREER COPILOT",
          links: [
            { href: "/jobs", label: "Job Discovery", icon: Briefcase },
            { href: "/jobs/saved", label: "Saved Jobs", icon: Bookmark },
            { href: "/resume", label: "Resume Studio", icon: FileText, badge: "ATS" },
            { href: "/applications", label: "ATS Tracker", icon: Award },
            { href: "/auto-apply", label: "Auto-Apply Bot", icon: Zap },
            { href: "/outreach", label: "AI Outreach", icon: Send },
            { href: "/linkedin", label: "LinkedIn Analyzer", icon: Share2 },
            { href: "/portfolio", label: "Live Portfolio", icon: Globe },
          ]
        },
        {
          title: "SYSTEM & ACCOUNT",
          links: [
            { href: "/profile", label: "Career Profile", icon: UserIcon },
            ...((user as any).is_admin ? [{ href: "/admin", label: "Admin Panel", icon: Shield }] : []),
            { href: "/privacy", label: "Privacy & Data", icon: ShieldCheck },
          ]
        }
      ]
    : [
        {
          title: "GET STARTED",
          links: [
            { href: "/setup", label: "Try Demo Interview", icon: PlayCircle },
            { href: "/privacy", label: "Privacy & Security", icon: ShieldCheck },
          ]
        }
      ];

  const renderNavLinks = (isMobile = false) => (
    <div className="space-y-6">
      {navGroups.map((group, idx) => (
        <div key={idx} className="space-y-1.5">
          {(!collapsed || isMobile) && (
            <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {group.title}
            </div>
          )}
          <div className="space-y-0.5">
            {group.links.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && link.href !== "/jobs" && pathname.startsWith(link.href)) ||
                (link.href === "/jobs" && (pathname === "/jobs" || pathname.startsWith("/jobs/")));

              // Special active distinction for jobs vs jobs/saved
              const reallyActive = link.href === "/jobs" ? pathname === "/jobs" : isActive;

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  title={link.label}
                  className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    reallyActive
                      ? "bg-indigo-600/20 text-white border border-indigo-500/40 shadow-sm shadow-indigo-500/10 font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  } ${collapsed && !isMobile ? "justify-center px-2" : ""}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      reallyActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  {(!collapsed || isMobile) && (
                    <span className="truncate flex-1">{link.label}</span>
                  )}
                  {(!collapsed || isMobile) && (link as any).badge && (
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {(link as any).badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* ================= MOBILE TOP BAR (md:hidden) ================= */}
      <div className="md:hidden sticky top-0 z-40 w-full h-14 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-400 p-[2px]">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <span className="text-sm font-bold text-white tracking-tight">
            Interview<span className="text-indigo-400">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-white border border-slate-800"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white border border-slate-800"
            aria-label="Toggle navigation drawer"
          >
            {mobileOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ================= MOBILE SLIDE-OVER DRAWER ================= */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] h-full bg-slate-950 border-r border-slate-800 p-5 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200 overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-400 p-[2px]">
                    <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white tracking-tight">
                    Interview<span className="text-indigo-400">AI</span>
                  </span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav */}
              {renderNavLinks(true)}
            </div>

            {/* Mobile Footer User Card */}
            <div className="pt-4 border-t border-slate-800 mt-6">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                      {user.full_name?.charAt(0) || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-2 text-center rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-2 text-center rounded-xl text-xs font-bold text-white bg-indigo-600"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= DESKTOP PERSISTENT SIDEBAR (hidden md:flex) ================= */}
      <aside
        className={`hidden md:flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-slate-800/80 bg-slate-950/90 backdrop-blur-md z-30 transition-all duration-200 ${
          collapsed ? "w-20 p-3" : "w-64 p-4"
        }`}
      >
        {/* Top: Logo & Collapse Trigger */}
        <div className="space-y-6 overflow-y-auto no-scrollbar">
          <div className={`flex items-center justify-between pb-3 border-b border-slate-800/80 ${collapsed ? "justify-center" : ""}`}>
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[2px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-400 group-hover:text-emerald-300 transition-colors" />
                </div>
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                    Interview<span className="text-indigo-400">AI</span>
                    <span className="text-[9px] uppercase font-semibold tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-1 py-0.2 rounded-full">
                      Coach
                    </span>
                  </span>
                </div>
              )}
            </Link>

            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {collapsed && (
            <div className="flex justify-center pb-2">
              <button
                onClick={() => setCollapsed(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
                title="Expand sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Links */}
          {renderNavLinks(false)}
        </div>

        {/* Bottom: User Profile Card & Theme */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          {user ? (
            <div className={`flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 ${collapsed ? "justify-center p-1.5" : ""}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                  {user.full_name?.charAt(0) || "U"}
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate max-w-[110px]">{user.full_name}</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[110px]">{user.email}</p>
                  </div>
                )}
              </div>

              {!collapsed && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleTheme}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Toggle theme"
                  >
                    {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={`space-y-2 ${collapsed ? "flex flex-col items-center" : ""}`}>
              {!collapsed ? (
                <>
                  <Link
                    to="/login"
                    className="w-full py-1.5 text-center rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:text-white block"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="w-full py-1.5 text-center rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 block shadow-md shadow-indigo-600/20"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 block"
                  title="Sign In"
                >
                  <UserIcon className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
