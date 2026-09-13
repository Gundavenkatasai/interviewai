
import { useState } from "react";
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  BookOpen,
  Award
} from "lucide-react";
import { AnswerEvaluation, Question } from "@/types";
const getScoreColor = (score: number) => {
  if (score >= 8) return "text-emerald-400";
  if (score >= 5) return "text-amber-400";
  return "text-rose-400";
};
interface AICoachPanelProps {
  evaluation: AnswerEvaluation | null;
  currentQuestion: Question | null;
  coachMode: "practice" | "interview" | "review";
  onGetHint?: () => void;
  hintData?: { hint: string; key_concepts_to_mention: string[] } | null;
  isLoadingHint?: boolean;
}

export function AICoachPanel({
  evaluation,
  currentQuestion,
  coachMode,
  onGetHint,
  hintData,
  isLoadingHint,
}: AICoachPanelProps) {
  const [activeTab, setActiveTab] = useState<"analysis" | "rubric" | "recommended">("analysis");

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">AI Coach Panel</h2>
        </div>

        <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
          {coachMode} mode
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-semibold text-slate-400 bg-slate-950/30">
        <button suppressHydrationWarning
          onClick={() => setActiveTab("analysis")}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeTab === "analysis"
              ? "border-indigo-500 text-white bg-indigo-500/5"
              : "border-transparent hover:text-slate-200"
          }`}
        >
          Analysis
        </button>
        <button suppressHydrationWarning
          onClick={() => setActiveTab("rubric")}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeTab === "rubric"
              ? "border-indigo-500 text-white bg-indigo-500/5"
              : "border-transparent hover:text-slate-200"
          }`}
        >
          8-Point Rubric
        </button>
        <button suppressHydrationWarning
          onClick={() => setActiveTab("recommended")}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeTab === "recommended"
              ? "border-indigo-500 text-white bg-indigo-500/5"
              : "border-transparent hover:text-slate-200"
          }`}
        >
          Model Answer
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {/* Practice Mode Hint Banner */}
        {coachMode === "practice" && (
          <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                Practice Mode Assistance
              </span>
              <button suppressHydrationWarning
                type="button"
                onClick={onGetHint}
                disabled={isLoadingHint}
                className="text-[11px] px-2.5 py-1 rounded-md bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 transition-colors"
              >
                {isLoadingHint ? "Loading..." : "Request Hint"}
              </button>
            </div>

            {hintData && (
              <div className="text-xs text-slate-300 pt-2 border-t border-indigo-500/20 space-y-1">
                <p className="italic text-indigo-200">"{hintData.hint}"</p>
                {hintData.key_concepts_to_mention?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {hintData.key_concepts_to_mention.map((c, i) => (
                      <span key={i} className="text-[10px] bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!evaluation ? (
          /* Empty / Waiting state */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">Awaiting Candidate Response</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Speak or type your answer and click "Done Answering" to trigger the 8-dimension AI evaluation.
              </p>
            </div>
          </div>
        ) : activeTab === "analysis" ? (
          /* Tab 1: Analysis */
          <div className="space-y-4">
            {/* Score & Confidence Overview */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Answer Score</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold text-white">{evaluation.score}</span>
                  <span className="text-xs text-slate-500 font-medium">/ 10</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Confidence</span>
                <div className="flex items-center gap-1.5 mt-1 justify-end">
                  <span className="text-sm font-bold text-emerald-400">
                    {Math.round(evaluation.confidence * 10)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Critique & Feedback */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Coach Critique</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">{evaluation.feedback}</p>
            </div>

            {/* Missing Concepts */}
            {evaluation.missing_points && evaluation.missing_points.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Missing Key Concepts</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {evaluation.missing_points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actionable Improvements */}
            {evaluation.suggested_improvements && evaluation.suggested_improvements.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <h3 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Suggested Improvements</span>
                </h3>
                <ul className="space-y-1 text-xs text-slate-300">
                  {evaluation.suggested_improvements.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-indigo-400">→</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up Question Indicator */}
            {evaluation.follow_up_question && (
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
                <span className="text-indigo-300 font-semibold block mb-1">Generated Follow-up:</span>
                <p className="text-slate-200 italic">"{evaluation.follow_up_question}"</p>
              </div>
            )}
          </div>
        ) : activeTab === "rubric" ? (
          /* Tab 2: 8-Dimension Rubric */
          <div className="space-y-3">
            {[
              { label: "Correctness", score: evaluation.correctness },
              { label: "Relevance", score: evaluation.relevance },
              { label: "Technical Depth", score: evaluation.technical_depth },
              { label: "Completeness", score: evaluation.completeness },
              { label: "Communication", score: evaluation.communication },
              { label: "Confidence", score: evaluation.confidence },
              { label: "Concrete Examples", score: evaluation.examples },
              { label: "Problem Solving", score: evaluation.problem_solving },
            ].map((metric) => (
              <div key={metric.label} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-300">{metric.label}</span>
                  <span className="text-indigo-400">{metric.score} / 10</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                    style={{ width: `${Math.min(100, metric.score * 10)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Tab 3: Model / Recommended Answer */
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>Recommended Senior-Level Answer</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {evaluation.recommended_answer || "No recommended answer provided."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
