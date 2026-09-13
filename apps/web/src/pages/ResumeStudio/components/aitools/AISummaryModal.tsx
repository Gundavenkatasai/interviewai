import React, { useState } from "react";
import {
  Sparkles, X, Check, Copy, AlertTriangle, RefreshCw, FileText
} from "lucide-react";
import { ApiClient } from "../../../../lib/api";

interface AISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeId: string;
  onApply: (newSummary: string) => void;
}

export const AISummaryModal: React.FC<AISummaryModalProps> = ({
  isOpen,
  onClose,
  resumeId,
  onApply,
}) => {
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.generateSummary(resumeId);
      const generatedVariants = res?.variants || (res?.summary ? [{ type: "Professional", text: res.summary }] : []);
      setVariants(generatedVariants);
      if (generatedVariants.length > 0) setSelectedVariant(0);
    } catch (err: any) {
      setError(err.message || "Failed to generate summary variants.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-slate-100">Professional Summary Generator</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-slate-400 leading-relaxed">
            Synthesizes your real experience, verified skills, and academic background into tailored elevator pitches. No fabricated qualifications.
          </p>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {variants.length === 0 ? (
            <div className="py-8 text-center space-y-4">
              <FileText className="w-10 h-10 text-indigo-400/60 mx-auto" />
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Ready to synthesize your profile data into tailored summary variants (Executive, Technical, Crisp, etc.).
              </p>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Synthesizing Profile..." : "Generate Summary Variants"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Select a Variant
                </span>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                  Regenerate
                </button>
              </div>

              <div className="space-y-3">
                {variants.map((v: any, idx: number) => {
                  const isSelected = selectedVariant === idx;
                  const text = typeof v === "string" ? v : v.text;
                  const type = v.type || v.style || `Style ${idx + 1}`;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedVariant(idx)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-indigo-950/20 border-indigo-500 text-slate-200"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                          {type}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {text.length} chars
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed font-sans">{text}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    if (selectedVariant !== null && variants[selectedVariant]) {
                      const chosen = typeof variants[selectedVariant] === "string"
                        ? variants[selectedVariant]
                        : variants[selectedVariant].text;
                      onApply(chosen);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Apply Selected Summary
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
