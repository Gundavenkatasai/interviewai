import React, { useState } from "react";
import {
  Award, X, Check, Copy, AlertTriangle, RefreshCw, Sparkles
} from "lucide-react";
import { ApiClient } from "../../../../lib/api";

interface AIAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeId: string;
  onApply: (bullet: string) => void;
}

export const AIAchievementModal: React.FC<AIAchievementModalProps> = ({
  isOpen,
  onClose,
  resumeId,
  onApply,
}) => {
  const [task, setTask] = useState("");
  const [tools, setTools] = useState("");
  const [result, setResult] = useState("");
  const [metric, setMetric] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedBullet, setGeneratedBullet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!task.trim()) {
      setError("Please describe what problem or project you worked on.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.generateAchievement(resumeId, {
        task,
        tools,
        result,
        metric: metric.trim() || undefined,
      });
      const bullet = res?.achievement || res?.bullet || res?.result;
      setGeneratedBullet(bullet);
    } catch (err: any) {
      setError(err.message || "Failed to generate achievement bullet.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedBullet) return;
    navigator.clipboard.writeText(generatedBullet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-slate-100">Guided Achievement Builder</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Answer the 4 guided questions below. The AI will formulate an executive impact bullet without fabricating metrics or unsupplied tools.
          </p>

          {/* Q1 */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              1. What task or system did you improve? <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g. Optimized the backend API data aggregation pipeline"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Q2 */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              2. What tools, techniques, or architectures did you use?
            </label>
            <input
              type="text"
              value={tools}
              onChange={(e) => setTools(e.target.value)}
              placeholder="e.g. Node.js, Redis multi-tier caching, PostgreSQL compound indexes"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Q3 */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              3. What was the tangible business or technical outcome?
            </label>
            <input
              type="text"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="e.g. Prevented database timeouts during peak traffic surges"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Q4 */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              4. Specific metric or scale <span className="text-slate-500">(Optional — only if verified)</span>
            </label>
            <input
              type="text"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              placeholder="e.g. 40% reduction in query latency, 50k DAU"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Constructing Achievement..." : "Generate Polished Bullet"}
            </button>
          </div>

          {/* Output */}
          {generatedBullet && (
            <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Formulated Achievement
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">• {generatedBullet}</p>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    onApply(generatedBullet);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Insert Bullet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
