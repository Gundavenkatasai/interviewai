"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  ShieldAlert,
  User,
  Moon,
  Sun,
  Monitor,
  Lock,
  ArrowLeft,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { ApiClient } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState("system");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Mock states for UI
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await ApiClient.deleteAllUserData();
      ApiClient.clearToken();
      router.push("/");
    } catch (err: any) {
      alert("Failed to delete account: " + err.message);
      setIsDeleting(false);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Password update requested. (Demo UI)");
    setCurrentPassword("");
    setNewPassword("");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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
            <Settings className="w-6 h-6 text-slate-400" />
            Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your account preferences and security.
          </p>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-400" />
          Appearance
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
            { id: "system", label: "System", icon: Monitor }
          ].map((t) => (
            <button suppressHydrationWarning
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                theme === t.id
                  ? "bg-indigo-600/20 border-indigo-500 text-white"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
              }`}
            >
              <t.icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          Security
        </h3>
        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Current Password</label>
            <input suppressHydrationWarning
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">New Password</label>
            <input suppressHydrationWarning
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <button suppressHydrationWarning
            type="submit"
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-4">
        <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          Danger Zone
        </h3>
        <p className="text-xs text-slate-400">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        
        {!showDeleteConfirm ? (
          <button suppressHydrationWarning
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Account
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3">
            <div className="flex items-start gap-2 text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs font-medium">Are you absolutely sure? This action cannot be undone. This will permanently delete your account and remove all your data from our servers.</p>
            </div>
            <div className="flex gap-2">
              <button suppressHydrationWarning
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "Deleting..." : "Yes, delete my account"}
              </button>
              <button suppressHydrationWarning
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
