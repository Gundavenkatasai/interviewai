import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, PlayCircle, History, Activity, Briefcase, Bookmark,
  FileText, Sparkles, User as UserIcon, Shield, ShieldCheck, LogOut,
  Menu, X, ChevronRight, ChevronLeft, ScanLine, Kanban, BarChart2,
  Compass, Terminal, Share2
} from "lucide-react";
import { useAuth } from "../../contexts/AuthProvider";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Ensure warm editorial light foundation
    document.documentElement.classList.remove("dark");
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const pathname = location.pathname;

  const navGroups = user
    ? [
        {
          title: "PRACTICE & INTERVIEWS",
          links: [
            { href: "/dashboard", label: "Overview Deck", icon: LayoutDashboard },
            { href: "/interview/session/demo", label: "Broadcast Studio", icon: PlayCircle, badge: "LIVE" },
            { href: "/stories", label: "Story Rolodex", icon: Sparkles, badge: "STAR" },
            { href: "/history", label: "Session Archives", icon: History },
          ]
        },
        {
          title: "CAREER ACCELERATION",
          links: [
            { href: "/jobs", label: "Flight Board Jobs", icon: Briefcase },
            { href: "/pipeline", label: "Card Catalog Pipeline", icon: Kanban, badge: "CRM" },
            { href: "/resume/studio", label: "Architect's Resume Studio", icon: FileText },
            { href: "/resume/ats-checker", label: "Optical ATS Bench", icon: ScanLine, badge: "OCR" },
            { href: "/analytics", label: "Swiss Chronometer", icon: BarChart2 },
            { href: "/linkedin", label: "LinkedIn Workspace", icon: Share2 },
          ]
        },
        {
          title: "SYSTEM & METRICS",
          links: [
            { href: "/profile", label: "Career Profile Dossier", icon: UserIcon },
            ...(((user as any)?.isAdmin || (user as any)?.is_admin || (user as any)?.role === "admin") ? [{ href: "/admin", label: "Admin Console", icon: Shield }] : []),
            { href: "/privacy", label: "Statutory Privacy", icon: ShieldCheck },
          ]
        }
      ]
    : [
        {
          title: "GET STARTED",
          links: [
            { href: "/setup", label: "Try Demo Session", icon: PlayCircle },
            { href: "/privacy", label: "Privacy & Security", icon: ShieldCheck },
          ]
        }
      ];

  const renderNavLinks = (isMobile = false) => (
    <div className="space-y-6">
      {navGroups.map((group, idx) => (
        <div key={idx} className="space-y-1.5">
          {(!collapsed || isMobile) && (
            <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-[#8C8479]">
              {group.title}
            </div>
          )}
          <div className="space-y-1">
            {group.links.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && link.href !== "/jobs" && pathname.startsWith(link.href)) ||
                (link.href === "/jobs" && (pathname === "/jobs" || pathname.startsWith("/jobs/")));

              const reallyActive = link.href === "/jobs" ? pathname === "/jobs" : isActive;

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  title={link.label}
                  className={`group relative flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    reallyActive
                      ? "bg-[#FBF0EC] text-[#C84B26] border border-[#F4D4C9] font-semibold shadow-sm"
                      : "text-[#5C564E] hover:text-[#181614] hover:bg-[#FAF8F5] border border-transparent"
                  } ${collapsed && !isMobile ? "justify-center px-2" : ""}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                      reallyActive ? "text-[#C84B26]" : "text-[#8C8479] group-hover:text-[#181614]"
                    }`}
                  />
                  {(!collapsed || isMobile) && (
                    <span className="truncate flex-1 tracking-tight">{link.label}</span>
                  )}
                  {(!collapsed || isMobile) && (link as any).badge && (
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        reallyActive
                          ? "bg-[#C84B26] text-white"
                          : "bg-[#EFECE6] text-[#5C564E] border border-[#D5CEBF]"
                      }`}
                    >
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
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E5E0D4] z-30 sticky top-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#C84B26] text-white flex items-center justify-center font-serif font-bold text-sm shadow-[0_2px_0_0_#983416]">
            IA
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-sm text-[#181614] tracking-tight">INTERVIEW AI</span>
            <span className="text-[9px] font-mono text-[#8C8479]">SYS.EDITION v2.4</span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-md text-[#5C564E] hover:text-[#181614] hover:bg-[#FAF8F5] border border-[#E5E0D4]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-[#181614]/30 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-[#E5E0D4] z-50 md:hidden flex flex-col p-4 shadow-xl transform transition-transform duration-250 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E5E0D4]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#C84B26] text-white flex items-center justify-center font-serif font-bold text-sm">
              IA
            </div>
            <div>
              <div className="font-serif font-bold text-sm text-[#181614]">INTERVIEW AI</div>
              <div className="text-[9px] font-mono text-[#8C8479]">WARM EDITORIAL WORKSPACE</div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 text-[#8C8479] hover:text-[#181614]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {renderNavLinks(true)}
        </div>

        {/* Mobile Footer Authentication Panel */}
        <div className="pt-3 mt-3 border-t border-[#E5E0D4] space-y-2">
          {user && (
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              title="Open Profile Page"
              className="flex items-center gap-2.5 p-2 rounded-md bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D4] transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded bg-[#172535] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-[0_1px_0_0_#0E1721] group-hover:bg-[#C84B26] transition-colors">
                {(user as any).fullName?.charAt(0) || (user as any).full_name?.charAt(0) || user.email?.charAt(0) || "U"}
              </div>
              <div className="truncate flex-1">
                <div className="text-xs font-semibold text-[#181614] truncate group-hover:text-[#C84B26] transition-colors">
                  {(user as any).fullName || (user as any).full_name || user.email}
                </div>
                <div className="text-[10px] font-mono text-[#2E6347] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E6347]" />
                  CALIBRATED • View Profile
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8C8479] group-hover:text-[#181614] transition-colors" />
            </Link>
          )}

          {/* Unified Auth Action Button: Login before auth, Logout after auth */}
          {user ? (
            <button
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              title="Sign Out"
              className="w-full py-2 px-3 text-xs font-semibold rounded-md border border-[#E5E0D4] bg-white hover:bg-[#FCEEEE] hover:border-[#F7D0D0] text-[#9E2A2B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              title="Sign In"
              className="w-full py-2 px-3 text-xs font-semibold rounded-md bg-[#172535] hover:bg-[#23384E] text-white flex items-center justify-center gap-1.5 shadow-[0_2px_0_0_#0E1721] transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Log In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Desktop Sidebar (Physical Architectural Drawer) */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-[#E5E0D4] shrink-0 sticky top-0 h-screen transition-all duration-200 z-20 ${
          collapsed ? "w-18" : "w-64"
        }`}
      >
        {/* Brand Header with Tactile Mechanical Header */}
        <div className="p-4 border-b border-[#E5E0D4] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-[#C84B26] text-white flex items-center justify-center font-serif font-bold text-sm shadow-[0_2px_0_0_#983416] shrink-0">
              IA
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-serif font-bold text-sm text-[#181614] tracking-tight truncate">
                  INTERVIEW AI
                </span>
                <span className="text-[9px] font-mono text-[#8C8479] tracking-wider">
                  INSTRUMENT.v2.4
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand Workspace" : "Collapse Workspace"}
            className="p-1 rounded text-[#8C8479] hover:text-[#181614] hover:bg-[#FAF8F5] transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {renderNavLinks(false)}
        </div>

        {/* Footer User Panel */}
        <div className="p-3 border-t border-[#E5E0D4] bg-[#FAF8F5] space-y-2">
          {user && (
            <Link
              to="/profile"
              title="Open Profile Page"
              className={`flex items-center gap-2.5 p-1.5 rounded-md hover:bg-[#EFECE6] transition-colors cursor-pointer group ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <div className="w-8 h-8 rounded bg-[#172535] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-[0_1px_0_0_#0E1721] group-hover:bg-[#C84B26] transition-colors">
                {(user as any).fullName?.charAt(0) || (user as any).full_name?.charAt(0) || user.email?.charAt(0) || "U"}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#181614] truncate group-hover:text-[#C84B26] transition-colors">
                    {(user as any).fullName || (user as any).full_name || user.email}
                  </div>
                  <div className="text-[10px] font-mono text-[#2E6347] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E6347]" />
                    CALIBRATED
                  </div>
                </div>
              )}
            </Link>
          )}

          {/* Unified Separate Auth Button: Log In before auth, Log Out after auth */}
          {user ? (
            <button
              onClick={handleLogout}
              title="Log Out"
              className={`w-full py-2 px-3 text-xs font-semibold rounded-md border border-[#E5E0D4] bg-white hover:bg-[#FCEEEE] hover:border-[#F7D0D0] text-[#9E2A2B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                collapsed ? "p-2" : ""
              }`}
            >
              <LogOut className="w-3.5 h-3.5 text-[#9E2A2B]" />
              {!collapsed && <span>Log Out</span>}
            </button>
          ) : (
            <Link
              to="/login"
              title="Log In"
              className={`w-full py-2 px-3 text-xs font-semibold rounded-md bg-[#172535] hover:bg-[#23384E] text-white flex items-center justify-center gap-1.5 shadow-[0_2px_0_0_#0E1721] transition-colors ${
                collapsed ? "p-2" : ""
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              {!collapsed && <span>Log In</span>}
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
