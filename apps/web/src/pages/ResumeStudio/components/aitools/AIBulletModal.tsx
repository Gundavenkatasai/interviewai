import React, { useState } from "react";
import {
  Sparkles, X, Check, Copy, AlertTriangle, RefreshCw, ArrowRight
} from "lucide-react";
import { ApiClient } from "../../../../lib/api";

interface AIBulletModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeId: string;
  initialBullet: string;
  onApply: (newBullet: string) => void;
  context?: { role?: string; company?: string };
}

export const AIBulletModal: React.FC<AIBulletModalProps> = ({
  isOpen,
  onClose,
  resumeId,
  initialBullet,
  onApply,
  context,
}) => {
  const [bullet, setBullet] = useState(initialBullet);
  const [mode, setMode] = useState<string>("impact");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const modes = [
    { id: "impact", label: "Impact & Results", desc: "Emphasizes the business outcome and user value" },
    { id: "technical", label: "Technical Precision", desc: "Highlights engineering rigor and system design" },
    { id: "concise", label: "Crisp & Concise", desc: "Removes filler words and tightens phrasing" },
    { id: "action_verbs", label: "Strong Action Verbs", desc: "Replaces passive phrases with decisive verbs" },
    { id: "leadership", label: "Cross-Functional / Lead", desc: "Emphasizes ownership, collaboration and mentoring" },
    { id: "ats_keywords", label: "ATS Optimization", desc: "Structures content for algorithmic clarity" },
  ];

  const handleGenerate = async () => {
    if (!bullet.trim()) {
      setError("Please provide a bullet point to improve.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.improveBullet(resumeId, bullet, mode, context);
      const output = res?.suggestions || (res?.improved ? [res.improved] : []);
      if (output.length > 0) {
        setSuggestions(output);
      } else {
        setSuggestions([res?.result || "No suggestions returned."]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to improve bullet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-slate-100">AI Bullet Point Enhancer</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Current Bullet Input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Original Bullet Statement
            </label>
            <textarea
              rows={3}
              value={bullet}
              onChange={(e) => setBullet(e.target.value)}
              placeholder="e.g. Worked on the API endpoints and made database queries faster"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Enhancement Focus
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    mode === m.id
                      ? "bg-indigo-600/10 border-indigo-500 text-indigo-300"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-200">{m.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Anti-hallucination notice */}
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-slate-400">
            <strong>Factual Integrity Notice:</strong> AI suggestions preserve your authentic technical scope. Unverified metrics or tools will not be fabricated.
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Polishing Bullet..." : "Generate Improvements"}
            </button>
          </div>

          {/* Suggestions List */}
          {suggestions.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Polished Options
              </h4>
              <div className="space-y-2">
                {suggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 hover:border-indigo-500/40 transition-colors"
                  >
                    <p className="text-sm text-slate-200 leading-relaxed">• {sug}</p>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-900">
                      <button
                        onClick={() => handleCopy(sug, idx)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedIdx === idx ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => {
                          onApply(sug);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Use This Bullet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
