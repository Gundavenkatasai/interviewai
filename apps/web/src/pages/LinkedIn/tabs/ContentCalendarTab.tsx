import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Sparkles,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send
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

  const items = plan?.items || [
    { day: 1, topic: "Refactoring high-traffic service", pillar: "Technical", format: "Long-form", formulaCode: "F7", hook: "We cut latency by 35% without buying bigger servers.", objective: "comments" },
    { day: 2, topic: "Overlooked feature in TypeScript 5", pillar: "Tips", format: "Quick insight", formulaCode: "F15", hook: "Most developers miss this satisfies operator pattern.", objective: "saves" },
    { day: 3, topic: "Interviewing for senior roles", pillar: "Career", format: "Story", formulaCode: "F4", hook: "3 years ago I failed every system design round.", objective: "reposts" },
    { day: 4, topic: "Why microservices fail early teams", pillar: "Architecture", format: "Contrarian", formulaCode: "F10", hook: "Start with a clean monolith until revenue hurts.", objective: "comments" },
    { day: 5, topic: "Favorite engineering books", pillar: "Community", format: "List", formulaCode: "F14", hook: "The 3 books that actually changed how I write code.", objective: "likes" },
    { day: 6, topic: "A hard debugging bug we solved in production", pillar: "Technical", format: "Anecdote", formulaCode: "F17", hook: "At 2 AM on a Saturday, our Redis cache stopped expiring keys.", objective: "comments" },
    { day: 7, topic: "Weekly Engineering Recap", pillar: "Retrospective", format: "Summary", formulaCode: "F3", hook: "3 technical decisions we made this week that paid off.", objective: "saves" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-indigo-400" />
            7-Day Strategic Content Calendar
          </h3>
          <p className="text-xs text-slate-400">
            Algorithmic distribution across thought-leadership, technical insights, and career evidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
            Regenerate Calendar
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
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
                  {item.pillar}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white line-clamp-1">{item.topic}</h4>
                <p className="text-xs text-slate-400 mt-1 italic line-clamp-2">
                  "{item.hook}"
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="font-mono text-purple-400 font-semibold">{item.formulaCode}</span>
                <span>•</span>
                <span className="capitalize">{item.format}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium capitalize">{item.objective}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/60 mt-4 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" /> 8:30 AM Slot
              </span>

              <button
                onClick={() => onConvertToDraft(item.topic, item.formulaCode)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Draft <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
