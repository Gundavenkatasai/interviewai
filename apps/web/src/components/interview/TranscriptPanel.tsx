
import { useEffect, useRef } from "react";
import { User, Sparkles, HelpCircle, CornerDownRight, Check } from "lucide-react";
import { TranscriptItem, Question } from "@/types";

interface TranscriptPanelProps {
  transcripts: TranscriptItem[];
  currentQuestion: Question | null;
  interimTranscript: string;
  isRecording: boolean;
  onTextAnswerSubmit?: (text: string) => void;
  manualText: string;
  setManualText: (t: string) => void;
  isSubmittingAnswer: boolean;
}

export function TranscriptPanel({
  transcripts,
  currentQuestion,
  interimTranscript,
  isRecording,
  onTextAnswerSubmit,
  manualText,
  setManualText,
  isSubmittingAnswer,
}: TranscriptPanelProps) {
  const scrollBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts, interimTranscript]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (manualText.trim() && !isSubmittingAnswer && onTextAnswerSubmit) {
        onTextAnswerSubmit(manualText.trim());
      }
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <h2 className="text-sm font-bold text-white tracking-wide">Live Conversation & Transcript</h2>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">Real-time STT</span>
      </div>

      {/* Transcript Scroll Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {/* Current Question Anchor */}
        {currentQuestion && (
          <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-indigo-400">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Question #{currentQuestion.question_order}</span>
                {currentQuestion.is_follow_up && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                    Follow-up
                  </span>
                )}
                {currentQuestion.source === "resume_ai" && (
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Resume AI
                  </span>
                )}
                {currentQuestion.source === "role_ai" && (
                  <span className="text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
                    Role AI
                  </span>
                )}
              </div>

              {/* Debug / Reference Indicator */}
              {currentQuestion.resume_reference && (
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800">
                  <span className="text-slate-500">Grounded in:</span>
                  <span className="text-emerald-400 font-semibold">{currentQuestion.resume_reference}</span>
                  {currentQuestion.topic && currentQuestion.topic !== currentQuestion.resume_reference && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-indigo-300">{currentQuestion.topic}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
              "{currentQuestion.question_text}"
            </p>
          </div>
        )}

        {/* Existing Transcript Dialogues */}
        {transcripts.map((item, idx) => {
          const isInterviewer = item.speaker === "interviewer" || item.speaker === "ai_coach";
          return (
            <div
              key={idx}
              className={`flex flex-col ${
                isInterviewer ? "items-start" : "items-end"
              } space-y-1`}
            >
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1">
                {isInterviewer ? "Interviewer" : "Candidate"}
              </span>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isInterviewer
                    ? "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-sm"
                    : "bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 rounded-tr-sm"
                }`}
              >
                {item.content}
              </div>
            </div>
          );
        })}

        {/* Live Interim Transcript Bubble */}
        {interimTranscript && (
          <div className="flex flex-col items-end space-y-1">
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider px-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Speaking...
            </span>
            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 italic rounded-tr-sm">
              {interimTranscript}
            </div>
          </div>
        )}

        <div ref={scrollBottomRef} />
      </div>

      {/* Manual Input Fallback & Submit Area */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60">
        <div className="relative flex items-center">
          <textarea suppressHydrationWarning
            rows={2}
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? "Listening to microphone... You can also type or edit your answer here."
                : "Type your answer or use microphone above (Press Enter to submit)..."
            }
            className="w-full pl-3.5 pr-24 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none transition-colors resize-none"
          />

          <button suppressHydrationWarning
            type="button"
            disabled={!manualText.trim() || isSubmittingAnswer}
            onClick={() => onTextAnswerSubmit?.(manualText.trim())}
            className="absolute right-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 shadow-sm flex items-center gap-1 transition-all"
          >
            <span>Submit</span>
            <CornerDownRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
