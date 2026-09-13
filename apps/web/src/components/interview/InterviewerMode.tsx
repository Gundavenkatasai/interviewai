
import { useState } from "react";
import {
  UserCheck,
  PlusCircle,
  FileEdit,
  CheckCircle2,
  StopCircle,
  Send
} from "lucide-react";
import { Question } from "@/types";

interface InterviewerModeProps {
  questions: Question[];
  currentQuestionIndex: number;
  onSelectQuestion: (idx: number) => void;
  onAddCustomQuestion: (questionText: string, category: string) => void;
  onSaveNotes: (notes: string) => void;
  onEndInterview: () => void;
  initialNotes?: string;
}

export function InterviewerMode({
  questions,
  currentQuestionIndex,
  onSelectQuestion,
  onAddCustomQuestion,
  onSaveNotes,
  onEndInterview,
  initialNotes = "",
}: InterviewerModeProps) {
  const [newQuestionText, setNewQuestionText] = useState("");
  const [category, setCategory] = useState("technical");
  const [interviewerNotes, setInterviewerNotes] = useState(initialNotes);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    onAddCustomQuestion(newQuestionText.trim(), category);
    setNewQuestionText("");
  };

  const handleSaveNotes = () => {
    onSaveNotes(interviewerNotes);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-950/80 p-5 backdrop-blur-md space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Interviewer Mode Panel</h3>
        </div>
        <span className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full">
          Partner View
        </span>
      </div>

      {/* Questions Manager */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          Interview Questions ({questions.length})
        </span>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentQuestionIndex;
            return (
              <div
                key={q.id || idx}
                onClick={() => onSelectQuestion(idx)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  isCurrent
                    ? "bg-indigo-500/15 border-indigo-500 text-white font-medium shadow-sm shadow-indigo-500/10"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-indigo-400">Q#{idx + 1}</span>
                  <span className="text-[10px] uppercase text-slate-500">{q.category}</span>
                </div>
                <p className="line-clamp-2">{q.question_text}</p>
              </div>
            );
          })}
        </div>

        {/* Add Question Form */}
        <form onSubmit={handleAddQuestion} className="space-y-2 pt-2">
          <div className="flex gap-2">
            <input suppressHydrationWarning
              type="text"
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder="Ask an ad-hoc custom question..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
            />
            <select suppressHydrationWarning
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="technical">Technical</option>
              <option value="hr">HR</option>
              <option value="behavioral">Behavioral</option>
              <option value="coding">Coding</option>
            </select>
            <button suppressHydrationWarning
              type="submit"
              disabled={!newQuestionText.trim()}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </div>
        </form>
      </div>

      {/* Interviewer Notes */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileEdit className="w-3.5 h-3.5 text-slate-400" />
            <span>Interviewer Private Notes</span>
          </label>
          {savedSuccess && <span className="text-[11px] text-emerald-400">Notes saved!</span>}
        </div>

        <textarea suppressHydrationWarning
          rows={3}
          value={interviewerNotes}
          onChange={(e) => setInterviewerNotes(e.target.value)}
          placeholder="Jot down notes, observations, or red flags about candidate's explanation..."
          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none resize-none"
        />

        <div className="flex justify-between items-center pt-1">
          <button suppressHydrationWarning
            type="button"
            onClick={onEndInterview}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>End Interview</span>
          </button>

          <button suppressHydrationWarning
            type="button"
            onClick={handleSaveNotes}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}
