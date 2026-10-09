import React, { useState, useEffect } from "react";
import {
  Sliders,
  Shield,
  Key,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Cpu,
  Mic,
  Activity,
  Layers,
  Info
} from "lucide-react";
import { ApiClient } from "../../../lib/api";

interface SettingsTabProps {
  settings: any;
  onRefresh: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ settings, onRefresh }) => {
  const [activeProvider, setActiveProvider] = useState(settings?.readProvider || "public_guest");
  const [approvalMode, setApprovalMode] = useState(settings?.approvalMode || "STRICT");

  // Voice Profile State
  const [tone, setTone] = useState("pragmatic_engineering");
  const [formality, setFormality] = useState("conversational");
  const [technicalDepth, setTechnicalDepth] = useState("deep");
  const [sentenceLengthPreference, setSentenceLengthPreference] = useState("varied");
  const [preferredPhrases, setPreferredPhrases] = useState("In production, We found that, The tradeoff is");
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [savingVoice, setSavingVoice] = useState(false);

  // Health Status
  const [healthData, setHealthData] = useState<any | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  useEffect(() => {
    loadVoiceProfile();
    checkHealth();
  }, []);

  const loadVoiceProfile = async () => {
    try {
      setLoadingVoice(true);
      const res = await ApiClient.getLinkedInVoiceProfile();
      if (res?.voiceProfile) {
        setTone(res.voiceProfile.tone || "pragmatic_engineering");
        setFormality(res.voiceProfile.formality || "conversational");
        setTechnicalDepth(res.voiceProfile.technicalDepth || "deep");
        setSentenceLengthPreference(res.voiceProfile.sentenceLengthPreference || "varied");
        if (Array.isArray(res.voiceProfile.preferredPhrases)) {
          setPreferredPhrases(res.voiceProfile.preferredPhrases.join(", "));
        }
      }
    } catch {
      // voice profile uninitialized yet, default to presets
    } finally {
      setLoadingVoice(false);
    }
  };

  const checkHealth = async () => {
    try {
      setCheckingHealth(true);
      const res = await ApiClient.getLinkedInProviderHealth();
      setHealthData(res?.health || res);
    } catch {
      // ignore
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleSaveVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVoice(true);
    try {
      const phrases = preferredPhrases
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      await ApiClient.updateLinkedInVoiceProfile({
        tone,
        formality,
        technicalDepth,
        sentenceLengthPreference,
        preferredPhrases: phrases,
      });
      alert("Voice Profile updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update voice profile");
    } finally {
      setSavingVoice(false);
    }
  };

  const providers = [
    {
      id: "public_guest",
      name: "Public Guest Provider",
      desc: "Fast HTTP client with Cheerio parser. No credentials, zero cost. Handles public profile, job search, and company data.",
      caps: { profile: true, posts: false, jobs: true, companies: true },
    },
    {
      id: "playwright_browser",
      name: "Playwright Headless Browser",
      desc: "Resource-bounded browser instance. Extracts rich feed posts, dynamic elements, and JavaScript-rendered pages.",
      caps: { profile: true, posts: true, jobs: true, companies: true },
    },
    {
      id: "manual_input",
      name: "Manual Input / Safe Fallback",
      desc: "Air-gapped manual paste mode. 100% immune to network blocks, authwalls, or rate limits.",
      caps: { profile: true, posts: true, jobs: false, companies: false },
    },
    {
      id: "imported",
      name: "Imported Data Provider",
      desc: "Accepts JSON or data exported directly from LinkedIn archive settings.",
      caps: { profile: true, posts: false, jobs: false, companies: false },
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="h-4 w-4 text-indigo-400" />
          LinkedIn Provider & Voice Profile Settings
        </h3>
        <p className="text-xs text-slate-400">
          Configure active data providers and tune your personalized tone of voice. Zero LinkedIn API key or login credentials required.
        </p>
      </div>

      {/* 1. DATA PROVIDER SELECTION & CAPABILITIES */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="h-4 w-4 text-indigo-400" />
            Active Data Provider
          </h4>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Open-Source First
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p) => {
            const isSelected = activeProvider === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setActiveProvider(p.id)}
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-600/10"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{p.name}</span>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-3 text-[10px]">
                  <span
                    className={`px-2 py-0.5 rounded ${
                      p.caps.profile ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-900 text-slate-600"
                    }`}
                  >
                    Profile {p.caps.profile ? "✓" : "✗"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      p.caps.posts ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-900 text-slate-600"
                    }`}
                  >
                    Posts {p.caps.posts ? "✓" : "✗"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      p.caps.jobs ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-900 text-slate-600"
                    }`}
                  >
                    Jobs {p.caps.jobs ? "✓" : "✗"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. REUSABLE VOICE PROFILE */}
      <form
        onSubmit={handleSaveVoice}
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Mic className="h-4 w-4 text-indigo-400" />
            Candidate Voice Profile (Natural Stylometry)
          </h4>
          <span className="text-xs text-slate-500">Applied across Posts, Comments & About</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Tone & Personality</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="pragmatic_engineering">Pragmatic Engineer (Facts & Tradeoffs)</option>
              <option value="technical_leader">Technical Leader (System Strategy)</option>
              <option value="mentor">Educational Mentor (Lessons & Guidance)</option>
              <option value="builder">Hands-on Builder (Ship & Learn)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Formality Level</label>
            <select
              value={formality}
              onChange={(e) => setFormality(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="conversational">Conversational & Accessible</option>
              <option value="professional">Professional & Polished</option>
              <option value="direct">Direct & Punchy</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Technical Depth</label>
            <select
              value={technicalDepth}
              onChange={(e) => setTechnicalDepth(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="deep">Deep (Architecture, Code, Benchmarks)</option>
              <option value="moderate">Moderate (High-level Patterns)</option>
              <option value="strategic">Strategic (Business & Tech Impact)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Sentence Rhythm Preference</label>
            <select
              value={sentenceLengthPreference}
              onChange={(e) => setSentenceLengthPreference(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="varied">Varied (Natural human cadence)</option>
              <option value="short">Short & Punchy</option>
              <option value="analytical">Analytical (Longer structured clauses)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Preferred Anchor Phrases (Comma-separated)
          </label>
          <input
            type="text"
            value={preferredPhrases}
            onChange={(e) => setPreferredPhrases(e.target.value)}
            placeholder="In our experience, The tradeoff is, We measured that..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:outline-none"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={savingVoice}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {savingVoice ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Save Voice Profile
          </button>
        </div>
      </form>

      {/* 3. SAFETY CONTROLS */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          Safety & Approval Safeguards
        </h4>
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-white">Strict User Approval Mandatory</div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Interview AI never publishes content or updates candidate profiles automatically. Every change requires an explicit review and approval turn.
          </p>
        </div>
      </div>
    </div>
  );
};
