import React from "react";
import { BookOpen, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface SummaryEditorProps {
  summary: string;
  onChange: (value: string) => void;
  targetRole: string;
  onTriggerAiSummary: () => void;
}

export const SummaryEditor: React.FC<SummaryEditorProps> = ({
  summary = "",
  onChange,
  targetRole,
  onTriggerAiSummary
}) => {
  const charCount = summary.trim().length;
  const words = summary.trim() ? summary.trim().split(/\s+/).length : 0;

  const isGoodLength = charCount >= 100 && charCount <= 500;
  const isTooShort = charCount > 0 && charCount < 100;
  const isTooLong = charCount > 600;

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Professional Summary
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            A concise 2–3 sentence overview framing your core competencies and domain experience for {targetRole}.
          </p>
        </div>
        <button
          type="button"
          onClick={onTriggerAiSummary}
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 flex items-center gap-1.5 transition-all shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Summary Assistant
        </button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <textarea
            rows={6}
            value={summary}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Results-driven ${targetRole || "Software Engineer"} with experience building scalable web applications and distributed architectures. Skilled in modern cloud technologies, with a track record of delivering resilient production systems.`}
            className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs leading-relaxed placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span>{words} words</span>
            <span>•</span>
            <span>{charCount} characters</span>
          </div>

          <div>
            {isGoodLength && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ideal length for ATS indexing (2-4 sentences)
              </span>
            )}
            {isTooShort && (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Brief summary (aim for 150-350 characters)
              </span>
            )}
            {isTooLong && (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Overly long summary (keep under 500 characters)
              </span>
            )}
            {charCount === 0 && (
              <span className="text-slate-500">Summary is optional but highly recommended by ATS algorithms.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
