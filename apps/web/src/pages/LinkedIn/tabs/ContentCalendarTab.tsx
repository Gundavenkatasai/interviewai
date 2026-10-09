import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Sparkles,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  CalendarDays,
  CalendarRange
} from "lucide-react";
import { ApiClient } from "../../../lib/api";

interface ContentCalendarTabProps {
  plan: any;
  onRefresh: () => void;
  onConvertToDraft: (topic: string, formulaCode?: string) => void;
}

export const ContentCalendarTab: React.FC<ContentCalendarTabProps> = ({
  plan,
  onRefresh,
  onConvertToDraft,
}) => {
  const [generating, setGenerating] = useState(false);
  const [daysCount, setDaysCount] = useState(7);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await ApiClient.generateLinkedInCalendar({ daysCount });
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  };

  const items = plan?.items || [];

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-indigo-400" />
            Strategic Content Planning & Calendar
          </h3>
          <p className="text-xs text-slate-400">
            Algorithmic distribution across thought-leadership, technical insights, and career achievements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View mode switcher */}
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode("day")}
              className={`px-2.5 py-1 rounded font-medium transition ${
                viewMode === "day" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-2.5 py-1 rounded font-medium transition ${
                viewMode === "week" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-2.5 py-1 rounded font-medium transition ${
                viewMode === "month" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Month
            </button>
          </div>

          <select
            value={daysCount}
            onChange={(e) => setDaysCount(Number(e.target.value))}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value={7}>7-Day Sprint</option>
            <option value={14}>14-Day Sprint</option>
            <option value={30}>30-Day Sprint</option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate Schedule
          </button>
        </div>
      </div>

      {/* Calendar Grid or Truthful Empty State */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
          <CalendarIcon className="mx-auto h-10 w-10 text-slate-600" />
          <h4 className="text-sm font-semibold text-white">No Strategic Content Plan Generated Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click "Generate Schedule" above to build a custom calendar mapped from your verified skills, story bank, and target role.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition mt-2"
          >
            {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Create 7-Day Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item: any, idx: number) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 transition hover:border-indigo-500/40 hover:bg-slate-900/70"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Day {item.day || idx + 1}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {item.pillar || "Technical"}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-slate-200 line-clamp-2">
                  {item.topic}
                </h4>

                {item.hook && (
                  <p className="text-xs text-slate-400 italic line-clamp-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    "{item.hook}"
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {item.formulaCode && (
                    <span className="rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-indigo-300">
                      {item.formulaCode}
                    </span>
                  )}
                  {item.format && (
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                      {item.format}
                    </span>
                  )}
                  {item.objective && (
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                      Goal: {item.objective}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  Status: {item.status || "PLANNED"}
                </span>

                <button
                  onClick={() => onConvertToDraft(item.topic, item.formulaCode)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  Draft Post <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
