import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Lock, Mail, User, AlertCircle, LogIn, Compass } from "lucide-react";
import { ApiClient } from "../lib/api";
import { useAuth } from "../contexts/AuthProvider";
import { MechanicalButton } from "../components/ui/MechanicalButton";
import { GoogleAuthButton } from "../components/ui/GoogleAuthButton";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { refetchUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError("You must acknowledge and accept the Terms of Service and Privacy Policy to register.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      await ApiClient.register({
        full_name: fullName,
        fullName,
        email,
        password,
        termsAccepted: true,
        termsVersion: "v2.0"
      });
      refetchUser();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your details.");
    } finally {
      setIsLoading(false);
    }
  };

  const isAlreadyRegistered = error?.toLowerCase().includes("already registered");

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F5F3EE]">
      <div className="w-full max-w-md p-8 rounded-lg bg-white border border-[#E5E0D4] shadow-sm space-y-6">
        {/* Editorial Top Instrument Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EBF3EE] border border-[#D0E3D6] text-[#2E6347] font-mono text-[11px] font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>OPERATOR ENROLLMENT — DOSSIER v2.0</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#181614] tracking-tight">Create Workspace Account</h1>
          <p className="text-xs text-[#181614]/70">
            Provision candidate telemetry, drafting tools, and mock broadcast sessions.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded bg-[#FCEEEE] border border-[#9E2A2B]/20 text-[#9E2A2B] text-xs space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            {isAlreadyRegistered && (
              <div className="pt-2 border-t border-[#9E2A2B]/20">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9E2A2B] hover:underline"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Click here to sign in with {email || "this email"}</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Google Quick Sign Up */}
        <div className="pt-1">
          <GoogleAuthButton mode="signup" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E5E0D4]" />
          <span className="text-[10px] uppercase font-mono text-[#8C8479] font-medium tracking-wider">or register with email</span>
          <div className="flex-1 h-px bg-[#E5E0D4]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1.5">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#181614]/40 absolute left-3.5 top-3" />
              <input
                type="text"
                name="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full pl-10 pr-3.5 py-2.5 rounded border border-[#E5E0D4] bg-[#F5F3EE]/40 text-[#181614] text-xs font-mono focus:border-[#C84B26] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1.5">
              Email Dispatch Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#181614]/40 absolute left-3.5 top-3" />
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.mercer@engineering.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded border border-[#E5E0D4] bg-[#F5F3EE]/40 text-[#181614] text-xs font-mono focus:border-[#C84B26] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-[#181614] uppercase tracking-wider mb-1.5">
              Secret Passkey (Min 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#181614]/40 absolute left-3.5 top-3" />
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded border border-[#E5E0D4] bg-[#F5F3EE]/40 text-[#181614] text-xs font-mono focus:border-[#C84B26] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Terms & Privacy acceptance */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#181614]/80 select-none">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded border-[#E5E0D4] text-[#C84B26] focus:ring-[#C84B26]"
              />
              <span className="leading-relaxed">
                I accept and acknowledge the{" "}
                <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-[#C84B26] hover:underline font-medium">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#C84B26] hover:underline font-medium">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          <div className="pt-2">
            <MechanicalButton
              variant="vermilion"
              size="lg"
              className="w-full"
              disabled={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isLoading ? "Provisioning Dossier..." : "Enroll Account"}
            </MechanicalButton>
          </div>
        </form>

        <div className="pt-4 border-t border-[#E5E0D4] text-center text-xs text-[#181614]/70">
          Already registered in the directory?{" "}
          <Link to="/login" className="text-[#C84B26] hover:underline font-medium">
            Sign In to Terminal
          </Link>
        </div>
      </div>
    </div>
  );
}
