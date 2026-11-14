import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Lock, Mail, AlertCircle, Zap, KeyRound, CheckCircle2 } from "lucide-react";
import { ApiClient } from "../lib/api";
import { useAuth } from "../contexts/AuthProvider";
import { MechanicalButton } from "../components/ui/MechanicalButton";
import { GoogleAuthButton } from "../components/ui/GoogleAuthButton";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refetchUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    <div className="min-h-screen bg-[#F5F3EE] flex items-center justify-center px-4 py-12 font-sans text-[#181614]">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-lg bg-white border border-[#E5E0D4] shadow-[0_4px_20px_rgba(24,22,20,0.06)] space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-9 h-9 rounded-md bg-[#C84B26] text-white flex items-center justify-center font-serif font-bold text-base shadow-[0_2px_0_0_#983416] mx-auto mb-3">
            IA
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8479]">
            AUTHENTICATION CONSOLE
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#181614] tracking-tight">
            Authenticate Session
          </h1>
          <p className="text-xs text-[#5C564E]">
            Sign in to access your calibrated career apparatus.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-[#FCEEEE] border border-[#F7D0D0] text-[#9E2A2B] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-md bg-[#EBF3EE] border border-[#D0E3D6] text-[#2E6347] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google Authentication */}
        <div className="pt-1">
          <GoogleAuthButton mode="login" onSuccess={() => navigate("/dashboard")} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E5E0D4]" />
          <span className="text-[10px] uppercase font-mono text-[#8C8479] font-medium tracking-wider">or sign in with credentials</span>
          <div className="flex-1 h-px bg-[#E5E0D4]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#181614] mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8C8479] absolute left-3.5 top-3" />
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@interviewai.dev"
                className="w-full pl-10 pr-3.5 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-[#181614] text-xs focus:border-[#C84B26] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#181614]">Password</label>
              <button
                type="button"
                onClick={() => {
                  setShowReset(!showReset);
                  setResetEmail(email);
                }}
                className="text-[11px] text-[#C84B26] hover:underline cursor-pointer"
              >
                {showReset ? "Hide Reset" : "Forgot Password?"}
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8C8479] absolute left-3.5 top-3" />
              <input
                type="password"
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D4] text-[#181614] text-xs focus:border-[#C84B26] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <MechanicalButton
            type="submit"
            variant="vermilion"
            size="md"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Validating Signature..." : "Sign In to Instrument"}
          </MechanicalButton>
        </form>

        {showReset && (
          <form onSubmit={handleResetPassword} className="p-4 bg-[#FAF8F5] border border-[#E5E0D4] rounded-md space-y-3 text-xs">
            <span className="font-mono text-[10px] uppercase font-bold text-[#172535]">RESET CREDENTIALS</span>
            <input
              type="email"
              required
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full px-3 py-1.5 rounded bg-white border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none"
            />
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full px-3 py-1.5 rounded bg-white border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isResetting}
              className="w-full py-1.5 bg-[#172535] text-white rounded text-xs font-semibold hover:bg-[#23384E]"
            >
              {isResetting ? "Updating..." : "Confirm Password Update"}
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-[#E5E0D4] text-xs text-[#5C564E]">
          Don't have an engineering profile?{" "}
          <Link to="/register" className="font-semibold text-[#C84B26] hover:underline">
            Register new dossier
          </Link>
        </div>
      </div>
    </div>
  );
}
