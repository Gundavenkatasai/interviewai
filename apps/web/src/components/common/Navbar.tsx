"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Sparkles,
  LayoutDashboard,
  History,
  ShieldCheck,
  PlayCircle,
  LogOut,
  User as UserIcon,
  Mic,
  Moon,
  Sun,
  Activity,
  Settings,
  Shield
} from "lucide-react";
import { ApiClient } from "@/lib/api";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ full_name: string; email: string; is_admin?: boolean } | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    // Check auth
    const savedUser = localStorage.getItem("interviewai_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }

    // Initialize theme
    if (document.documentElement.classList.contains("dark") || darkMode) {
      document.documentElement.classList.add("dark");
    }
  }, [darkMode]);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  };

  const handleLogout = () => {
    ApiClient.clearToken();
    setUser(null);
    router.push("/auth/login");
  };

  const navLinks = user
    ? [
        { href: "/setup", label: "New Interview", icon: PlayCircle },
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/history", label: "History", icon: History },
        { href: "/performance", label: "Analytics", icon: Activity },
        { href: "/settings", label: "Settings", icon: Settings },
        ...(user.is_admin ? [{ href: "/admin", label: "Admin", icon: Shield }] : [])
      ]
    : [
        { href: "/setup", label: "Try Demo", icon: PlayCircle },
        { href: "/privacy", label: "Privacy & Data", icon: ShieldCheck },
      ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[2px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 group-hover:text-emerald-300 transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              Interview<span className="text-indigo-400">AI</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full">
                Coach
              </span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  isActive
                    ? "text-white bg-indigo-600/15 border border-indigo-500/30 shadow-sm shadow-indigo-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action & Profile */}
        <div className="flex items-center gap-3">
          <button suppressHydrationWarning
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-200 font-medium">{user.full_name}</span>
              </div>
              <button suppressHydrationWarning
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
