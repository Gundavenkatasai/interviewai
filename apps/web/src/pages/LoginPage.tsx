import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, Zap, KeyRound, CheckCircle2 } from "lucide-react";
import { ApiClient } from "../lib/api";
import { useAuth } from "../contexts/AuthProvider";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refetchUser } = useAuth();
  const [email, setEmail] = useState("venkatasaigunda82@gmail.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await ApiClient.login({ email, password });
      refetchUser();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await ApiClient.demoLogin();
      refetchUser();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in as demo user.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res: any = await ApiClient.resetPassword({
        email: resetEmail || email,
        password: newPassword,
      });
      setSuccessMsg(res?.message || "Password updated successfully! You can now sign in.");
      setPassword(newPassword);
      setEmail(resetEmail || email);
      setShowReset(false);
      setNewPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-400">Sign in to access Interview AI career & mock interview tools.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Quick Demo Login Option */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isDemoLoading || isLoading}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 hover:border-emerald-500/50 flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>{isDemoLoading ? "Signing in..." : "⚡ Quick 1-Click Sign In (sai account)"}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">or sign in with email</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => {
                  setShowReset(!showReset);
                  setResetEmail(email);
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                {showReset ? "Hide Reset" : "Forgot Password?"}
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isDemoLoading}
            className="w-full py-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all mt-2"
          >
            <span>{isLoading ? "Signing In..." : "Sign In"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Inline Password Reset Box */}
        {showReset && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
              <KeyRound className="w-4 h-4" />
              <span>Set New Password</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Enter your email and a new password to immediately update your account credentials.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-2.5">
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Account email"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isResetting}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {isResetting ? "Updating..." : "Confirm New Password"}
              </button>
            </form>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800/60 text-center text-xs text-slate-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
