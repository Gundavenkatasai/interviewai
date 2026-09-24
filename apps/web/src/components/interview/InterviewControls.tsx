
import React from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Square, SkipForward } from "lucide-react";

interface InterviewControlsProps {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onEndInterview: () => void;
  onStopAnswer?: () => void;
  onSkipQuestion?: () => void;
  isRecording: boolean;
  interviewState: string;
  disabled?: boolean;
}

export function InterviewControls({
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
  onEndInterview,
  onStopAnswer,
  onSkipQuestion,
  isRecording,
  interviewState,
  disabled = false
}: InterviewControlsProps) {
  const isAiSpeaking = interviewState === 'AI_SPEAKING';
  const isCandidateReady = interviewState === 'CANDIDATE_READY';
  const isCandidateSpeaking = interviewState === 'CANDIDATE_SPEAKING';
  const isProcessing = interviewState === 'PROCESSING' || interviewState === 'EVALUATING' || interviewState === 'GENERATING_NEXT';

  return (
    <div className="flex items-center justify-center gap-3 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-4 rounded-2xl w-full max-w-3xl mx-auto shadow-xl">

      {/* Camera Toggle — always available */}
      <button
        onClick={onToggleCamera}
        disabled={disabled}
        className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
          disabled
            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
            : cameraEnabled
              ? "bg-slate-700 hover:bg-slate-600 text-white"
              : "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 border border-rose-500/50"
        }`}
        title={cameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
      >
        {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>

      {/* Mic Toggle — mute/unmute when speaking, disabled when AI speaking */}
      <div className="relative group">
        <button
          onClick={onToggleMic}
          disabled={isAiSpeaking || disabled}
          className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
            isAiSpeaking || disabled
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : micEnabled
                ? "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 border border-rose-500/50"
          }`}
          title={isAiSpeaking ? "AI is speaking" : micEnabled ? "Mute" : "Unmute"}
        >
          {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          {micEnabled && isCandidateSpeaking && (
            <>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
            </>
          )}
        </button>
        {isAiSpeaking && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Muted while AI speaks
          </div>
        )}
      </div>

      <div className="w-px h-10 bg-slate-700/60 mx-1" />

      {/* ── Primary Action Area ── */}

      {/* CANDIDATE_SPEAKING: auto-started, show mic active indicator */}
      {isCandidateSpeaking && (
        <div className="flex items-center gap-2.5 px-6 h-12 bg-emerald-500/10 text-emerald-300 rounded-xl font-medium border border-emerald-500/20">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          Listening...
        </div>
      )}

      {/* CANDIDATE_SPEAKING: Finish Answer button */}
      {isCandidateSpeaking && onStopAnswer && (
        <button
          onClick={onStopAnswer}
          className="flex items-center gap-2.5 px-7 h-12 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-xl font-semibold transition-all shadow-lg shadow-amber-900/30"
        >
          <Square className="w-4 h-4 fill-current" />
          Finish Answer
        </button>
      )}

      {/* Processing states: show spinner pill */}
      {isProcessing && (
        <div className="flex items-center gap-2.5 px-6 h-12 bg-slate-800 text-slate-300 rounded-xl font-medium border border-slate-700">
          <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          {interviewState === 'EVALUATING' ? 'Evaluating...' : interviewState === 'GENERATING_NEXT' ? 'Next question...' : 'Processing...'}
        </div>
      )}

      {/* AI Speaking: visual indicator */}
      {isAiSpeaking && (
        <div className="flex items-center gap-2.5 px-6 h-12 bg-indigo-500/10 text-indigo-300 rounded-xl font-medium border border-indigo-500/20">
          <span className="flex gap-0.5">
            {[0,1,2].map(i => (
              <span key={i} className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: `${i * 0.15}s`}} />
            ))}
          </span>
          AI is speaking...
        </div>
      )}

      {/* Skip Question (shown when candidate is ready or speaking) */}
      {(isCandidateReady || isCandidateSpeaking) && onSkipQuestion && (
        <button
          onClick={onSkipQuestion}
          className="flex items-center gap-1.5 px-4 h-10 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl text-sm font-medium transition-all border border-slate-700/50"
          title="Skip this question"
        >
          <SkipForward className="w-4 h-4" />
          Skip
        </button>
      )}

      <div className="w-px h-10 bg-slate-700/60 mx-1" />

      {/* End Interview */}
      <button
        onClick={onEndInterview}
        className="flex items-center gap-2 px-5 h-12 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-rose-900/20"
      >
        <PhoneOff className="w-4 h-4" />
        End
      </button>

    </div>
  );
}
