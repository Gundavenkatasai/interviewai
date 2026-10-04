/**
 * InterviewRoomPage — Production SaaS Mock Interview Room
 *
 * Implements:
 * - Authoritative State Machine Driven UI (Phase 1, 24)
 * - Strict Turn-Taking Control Disabling (Phase 4, 7, 24)
 * - LEFT / MAIN: AI Avatar, Question, Live Transcript, Answer Timer
 * - RIGHT / SIDE: Progress, Question Details, Candidate Video, Action Controls
 * - Completion & Report Generation Screen (Phase 17, 18)
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock,
  Briefcase,
  AlertCircle,
  HelpCircle,
  Mic,
  MicOff,
  PhoneOff,
  SkipForward,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronRight,
  Send,
  Loader2,
} from "lucide-react";
import { ApiClient } from "../lib/api";
import { MediaSetup } from "../components/interview/MediaSetup";
import { useMediaDevices } from "../hooks/useMediaDevices";
import { useInterviewRoom } from "../hooks/useInterviewRoom";
import { AIAvatar } from "../components/interview/AIAvatar";
import { CandidateVideo } from "../components/interview/CandidateVideo";
import { EndInterviewModal } from "../components/interview/EndInterviewModal";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function CountdownRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const radius = 24;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.max(0, Math.min(1, timeLeft / total)));
  const urgent = timeLeft <= 15;
  const critical = timeLeft <= 5;

  return (
    <div className="relative flex items-center justify-center w-16 h-16 flex-shrink-0">
      <svg className="absolute" width="64" height="64" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={critical ? "#ef4444" : urgent ? "#f59e0b" : "#6366f1"}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="text-center z-10">
        <span
          className={`text-sm font-bold tabular-nums block ${
            critical ? "text-red-400 animate-pulse" : urgent ? "text-amber-400" : "text-white"
          }`}
        >
          {timeLeft}s
        </span>
      </div>
    </div>
  );
}

function StateIndicator({ state, isAiSpeaking }: { state: string; isAiSpeaking: boolean }) {
  const items: Record<string, { label: string; color: string; icon: string }> = {
    SETUP: { label: "Setting up devices...", color: "text-slate-400", icon: "⚙️" },
    PERMISSION_GRANTED: { label: "Ready to start", color: "text-indigo-400", icon: "👋" },
    AI_SPEAKING: { label: "AI is speaking...", color: "text-indigo-400", icon: "🔊" },
    CANDIDATE_READY: { label: "Your turn — mic opening", color: "text-emerald-400", icon: "🎤" },
    CANDIDATE_SPEAKING: { label: "Listening — speak your answer", color: "text-emerald-400", icon: "🟢" },
    PROCESSING: { label: "Processing answer...", color: "text-blue-400", icon: "⏳" },
    EVALUATING: { label: "AI Evaluating response...", color: "text-amber-400", icon: "🧠" },
    GENERATING_NEXT: { label: "Preparing next question...", color: "text-purple-400", icon: "✨" },
    COMPLETING: { label: "Finalizing interview...", color: "text-emerald-400", icon: "📊" },
    REPORT_GENERATING: { label: "Generating diagnostic report...", color: "text-indigo-400", icon: "📄" },
    COMPLETED: { label: "Interview complete!", color: "text-emerald-400", icon: "🎉" },
    FAILED: { label: "Connection issue", color: "text-rose-400", icon: "⚠️" },
  };

  const effective = isAiSpeaking && state !== "AI_SPEAKING" ? "AI_SPEAKING" : state;
  const info = items[effective] || { label: effective, color: "text-slate-400", icon: "•" };

  return (
    <div className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 ${info.color}`}>
      <span>{info.icon}</span>
      <span>{info.label}</span>
    </div>
  );
}

export default function InterviewRoomPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isEndModalOpen, setEndModal] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    ApiClient.getInterview(sessionId)
      .then((res: any) => setSession(res))
      .catch((err: any) => setSessionError(err.message || "Failed to load session"));
  }, [sessionId]);

  const mediaDevices = useMediaDevices();
  const {
    permissionState,
    videoStream,
    audioStream,
    cameraEnabled,
    micEnabled,
    audioLevel,
    toggleCamera,
    toggleMicrophone,
    requestPermissions,
  } = mediaDevices;

  const {
    state: roomState,
    wsConnectionState,
    currentQuestion,
    transcript,
    elapsedSeconds,
    timeLeft,
    maxAnswerSeconds,
    isAiSpeaking,
    micShouldBeActive,
    timerShouldRun,
    isProcessing,
    isRecording,
    error: roomError,
    setPermissionGranted,
    beginInterview,
    stopAnswer,
    skipQuestion,
    endInterview,
  } = useInterviewRoom({
    sessionId: sessionId!,
    session,
    audioStream,
    onAnswerSubmitted: () => {},
    onNextQuestion: () => {},
    onInterviewComplete: () => navigate(`/report/${sessionId}`),
  });

  // Advance from SETUP to PERMISSION_GRANTED once MediaSetup passes
  useEffect(() => {
    if (setupComplete && session && roomState === "SETUP") {
      setPermissionGranted();
    }
  }, [setupComplete, session, roomState, setPermissionGranted]);

  const handleSkip = useCallback(async () => {
    await skipQuestion();
  }, [skipQuestion]);

  const handleEnd = useCallback(async () => {
    setEndModal(false);
    await endInterview();
  }, [endInterview]);

  const avatarState =
    roomState === "AI_SPEAKING" || isAiSpeaking
      ? "speaking"
      : roomState === "EVALUATING"
      ? "processing"
      : roomState === "GENERATING_NEXT"
      ? "thinking"
      : roomState === "CANDIDATE_SPEAKING"
      ? "listening"
      : "idle";

  const currentQOrder = currentQuestion?.sequenceNumber || currentQuestion?.question_order || 1;
  const totalQ = session?.max_questions || session?.maxQuestions || 5;

  if (sessionError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Interview</h2>
        <p className="text-slate-400 mb-6 max-w-md">{sessionError}</p>
        <button
          onClick={() => navigate("/setup")}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold"
        >
          Return to Setup
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Initializing secure interview room...</p>
      </div>
    );
  }

  // ── Step 1: Media Permissions & Test ──────────────────────────────────────
  if (!setupComplete) {
    return (
      <MediaSetup
        onPermissionsGranted={() => setSetupComplete(true)}
        onCancel={() => navigate("/")}
        mediaDevices={mediaDevices}
        sessionInfo={{
          role: session.role,
          difficulty: session.difficulty,
          interviewType: session.interview_type || session.interviewType,
        }}
      />
    );
  }

  // ── Step 2: PERMISSION_GRANTED Screen (User Gesture for Q1 TTS) ───────────
  if (roomState === "PERMISSION_GRANTED" && currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 gap-6 max-w-2xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Permissions Confirmed</h2>
          <p className="text-slate-400 text-sm">
            Targeting <strong className="text-white">{session.role}</strong> ({session.difficulty} level, {totalQ} questions).
          </p>
        </div>

        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500 rounded-l-2xl" />
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Opening Question 1 of {totalQ}
          </p>
          <p className="text-base text-white font-medium leading-relaxed">{currentQuestion.question_text}</p>
        </div>

        <div className="text-xs text-slate-500 text-center max-w-md">
          When you click Start, the AI interviewer will read the question aloud. Once finished, your microphone unlocks automatically.
        </div>

        <button
          id="begin-interview-btn"
          onClick={beginInterview}
          className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/30 flex items-center gap-3 transition-all"
        >
          <span>🎙️ Start Interview Now</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // ── Step 3: COMPLETING / REPORT_GENERATING Screen ──────────────────────────
  if (roomState === "COMPLETING" || roomState === "REPORT_GENERATING") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 gap-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Interview Complete!</h2>
          <p className="text-slate-400 text-sm max-w-md">
            Aggregating 8 evaluation dimensions, evidence, and generating your comprehensive diagnostic report...
          </p>
        </div>
      </div>
    );
  }

  // ── Step 4: LIVE PRODUCTION INTERVIEW ROOM (Phase 24 Layout) ───────────────
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      {/* ── Top Bar ── */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white truncate">{session.role}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>{formatTime(elapsedSeconds)}</span>
              <span>•</span>
              <span className="capitalize">{session.difficulty}</span>
              <span>•</span>
              <span className="capitalize">{session.interview_type || session.interviewType}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <StateIndicator state={roomState} isAiSpeaking={isAiSpeaking} />

          {/* Answer Countdown */}
          {timerShouldRun ? (
            <CountdownRing timeLeft={timeLeft} total={maxAnswerSeconds} />
          ) : (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-500 text-xs font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>--:--</span>
            </div>
          )}

          <button
            onClick={() => setEndModal(true)}
            className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors"
          >
            End Session
          </button>
        </div>
      </header>

      {/* ── Connection Banner ── */}
      {wsConnectionState !== "CONNECTED" && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-1.5 px-6 flex items-center justify-center gap-2 text-xs text-amber-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>WebSocket Status: {wsConnectionState} (Reconnecting...)</span>
        </div>
      )}

      {/* ── Main Production Grid ── */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* LEFT / MAIN (Cols 1-7): AI Avatar, Question, Candidate Transcript */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          {/* Question Card */}
          {currentQuestion && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1.5 bg-indigo-500 rounded-l-2xl" />
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Question {currentQOrder} of {totalQ}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  {currentQuestion.category}
                </span>
              </div>
              <p className="text-base sm:text-lg text-white font-medium leading-relaxed">
                {currentQuestion.question_text}
              </p>
            </div>
          )}

          {/* AI Avatar & Waveform Area */}
          <div className="flex-1 min-h-[300px] bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 flex flex-col items-center justify-center relative shadow-xl">
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold uppercase tracking-wide">
                AI Interviewer
              </span>
            </div>

            <AIAvatar state={avatarState} />

            <div className="mt-4">
              <StateIndicator state={roomState} isAiSpeaking={isAiSpeaking} />
            </div>

            {roomError && <p className="mt-2 text-xs text-rose-400 font-medium">{roomError}</p>}
          </div>

          {/* Live Transcript Panel */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Live Answer Transcription
              </span>
              {isRecording && (
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Transcribing...
                </span>
              )}
            </div>
            <div className="min-h-[60px] max-h-[100px] overflow-y-auto bg-slate-950/70 border border-slate-800/60 rounded-xl p-3 text-xs leading-relaxed text-slate-200">
              {transcript || (
                <span className="text-slate-500 italic">
                  {isRecording ? "Listening... Speak your answer now." : "Awaiting candidate turn."}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT / SIDE (Cols 8-12): Candidate Video, Progress, Action Controls */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          {/* Candidate Video Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-xl min-h-[220px] flex flex-col">
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 bg-slate-800/80 backdrop-blur-sm text-slate-300 border border-slate-700/50 rounded-full text-xs font-semibold uppercase tracking-wide">
                Candidate Feed
              </span>
            </div>

            <div className="absolute top-4 right-4 z-10">
              {micShouldBeActive ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
                  <Mic className="w-3 h-3" /> Mic On
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 text-slate-400 border border-slate-700/40 rounded-full text-xs font-semibold">
                  <MicOff className="w-3 h-3" /> Mic Off
                </span>
              )}
            </div>

            <div className="flex-1">
              <CandidateVideo
                stream={videoStream}
                cameraEnabled={cameraEnabled}
                permissionDenied={permissionState === "denied"}
                audioLevel={audioLevel}
                userName={session.candidate_name || "You"}
                onRequestPermission={requestPermissions}
              />
            </div>
          </div>

          {/* Progress & Topic Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Interview Progress</span>
              <span className="text-indigo-400 font-bold">
                {currentQOrder} / {totalQ} Questions
              </span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(currentQOrder / totalQ) * 100}%` }}
              />
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <span>Topic: <strong className="text-white">{currentQuestion?.topic || "Technical"}</strong></span>
              <span>Level: <strong className="text-white capitalize">{session.difficulty}</strong></span>
            </div>
          </div>

          {/* Action Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Session Controls
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Camera Toggle */}
              <button
                onClick={toggleCamera}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                  cameraEnabled
                    ? "bg-slate-800 hover:bg-slate-700 text-white"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                <span>📷</span>
                <span>{cameraEnabled ? "Cam On" : "Cam Off"}</span>
              </button>

              {/* Mic Toggle (Disabled during AI speech) */}
              <button
                onClick={toggleMicrophone}
                disabled={roomState === "AI_SPEAKING" || isAiSpeaking}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                  roomState === "AI_SPEAKING" || isAiSpeaking
                    ? "bg-slate-800/40 text-slate-600 cursor-not-allowed border border-slate-800"
                    : micEnabled
                    ? "bg-slate-800 hover:bg-slate-700 text-white"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {micEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                <span>{roomState === "AI_SPEAKING" ? "Mic Locked" : micEnabled ? "Mic On" : "Mic Off"}</span>
              </button>
            </div>

            {/* Turn Actions */}
            <div className="pt-2 border-t border-slate-800/60 space-y-2">
              {/* Submit Answer Button */}
              {isRecording ? (
                <button
                  id="submit-answer-btn"
                  onClick={stopAnswer}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Answer</span>
                </button>
              ) : isProcessing ? (
                <div className="w-full py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Evaluating Response...</span>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full py-3 bg-slate-800/40 text-slate-500 rounded-xl text-xs font-semibold cursor-not-allowed border border-slate-800 flex items-center justify-center gap-2"
                >
                  <span>Submit Disabled (AI Speaking)</span>
                </button>
              )}

              {/* Skip Question Button */}
              {(isRecording || roomState === "CANDIDATE_READY") && (
                <button
                  onClick={handleSkip}
                  className="w-full py-2.5 bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-700/40 flex items-center justify-center gap-1.5"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Skip Question</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      <EndInterviewModal
        isOpen={isEndModalOpen}
        onCancel={() => setEndModal(false)}
        onConfirm={handleEnd}
        questionsAnswered={currentQOrder}
        totalQuestions={totalQ}
      />
    </div>
  );
}
