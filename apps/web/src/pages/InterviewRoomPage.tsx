/**
 * InterviewRoomPage — Production Mock Interview Page
 *
 * State flow:
 *   MediaSetup → SETUP → READY → [Begin Interview] →
 *   AI_SPEAKING → CANDIDATE_READY → CANDIDATE_SPEAKING →
 *   PROCESSING → EVALUATING → GENERATING_NEXT → AI_SPEAKING → ...
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Briefcase, AlertCircle, HelpCircle, Mic, MicOff, PhoneOff, SkipForward, Square } from "lucide-react";
import { ApiClient } from "../lib/api";
import { MediaSetup } from "../components/interview/MediaSetup";
import { useMediaDevices } from "../hooks/useMediaDevices";
import { useInterviewRoom } from "../hooks/useInterviewRoom";
import { AIAvatar } from "../components/interview/AIAvatar";
import { CandidateVideo } from "../components/interview/CandidateVideo";
import { EndInterviewModal } from "../components/interview/EndInterviewModal";

// ─── Utilities ───────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Countdown Ring ───────────────────────────────────────────────────────────
// Isolated component — only re-renders when timeLeft/total change,
// does NOT cause the rest of the page to re-render.

function CountdownRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const radius = 22;
  const circ   = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.max(0, Math.min(1, timeLeft / total)));
  const urgent   = timeLeft <= 15;
  const critical = timeLeft <= 5;

  return (
    <div className="relative flex items-center justify-center w-14 h-14 flex-shrink-0">
      <svg className="absolute" width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
        <circle
          cx="28" cy="28" r={radius} fill="none"
          stroke={critical ? '#ef4444' : urgent ? '#f59e0b' : '#6366f1'}
          strokeWidth="3.5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className={`text-xs font-bold tabular-nums z-10 ${critical ? 'text-red-400 animate-pulse' : urgent ? 'text-amber-400' : 'text-slate-200'}`}>
        {timeLeft}s
      </span>
    </div>
  );
}

// ─── State Indicator ─────────────────────────────────────────────────────────

function StateIndicator({ state, isAiSpeaking }: { state: string; isAiSpeaking: boolean }) {
  const items: Record<string, { label: string; color: string; icon: string }> = {
    AI_SPEAKING:         { label: 'AI is speaking...', color: 'text-indigo-400', icon: '🔊' },
    CANDIDATE_READY:     { label: 'Your turn — listening', color: 'text-emerald-400', icon: '🎤' },
    CANDIDATE_SPEAKING:  { label: 'Listening — speak your answer', color: 'text-emerald-400', icon: '🟢' },
    PROCESSING:          { label: 'Processing your answer...', color: 'text-blue-400', icon: '⏳' },
    EVALUATING:          { label: 'Evaluating response...', color: 'text-amber-400', icon: '🧠' },
    GENERATING_NEXT:     { label: 'Preparing next question...', color: 'text-slate-400', icon: '✨' },
    COMPLETED:           { label: 'Interview complete', color: 'text-emerald-400', icon: '🎉' },
    ERROR:               { label: 'Error — see message below', color: 'text-rose-400', icon: '⚠️' },
  };

  const effectiveState = (isAiSpeaking && state !== 'AI_SPEAKING') ? 'AI_SPEAKING' : state;
  const info = items[effectiveState];
  if (!info) return null;

  return (
    <p className={`text-sm font-semibold flex items-center justify-center gap-1.5 ${info.color}`}>
      <span>{info.icon}</span>
      <span>{info.label}</span>
    </p>
  );
}

// ─── Debug Inspector (dev only) ───────────────────────────────────────────────

function DebugInspector({ state, timeLeft, isAiSpeaking, micShouldBeActive, wsConnectionState, questionId }: {
  state: string; timeLeft: number; isAiSpeaking: boolean;
  micShouldBeActive: boolean; wsConnectionState: string; questionId?: string;
}) {
  if (!import.meta.env.DEV) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 text-green-400 font-mono text-xs p-3 rounded-xl border border-green-500/30 space-y-0.5 min-w-[200px]">
      <div>State: <span className="text-white">{state}</span></div>
      <div>Mic: <span className={micShouldBeActive ? 'text-emerald-400' : 'text-red-400'}>{micShouldBeActive ? 'ON' : 'OFF'}</span></div>
      <div>AI Speaking: <span className={isAiSpeaking ? 'text-indigo-400' : 'text-slate-500'}>{String(isAiSpeaking)}</span></div>
      <div>Timer: <span className="text-white">{timeLeft}s</span></div>
      <div>WS: <span className={wsConnectionState === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400'}>{wsConnectionState}</span></div>
      {questionId && <div>Q: <span className="text-slate-400">{questionId.slice(-8)}</span></div>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InterviewRoomPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession]           = useState<any>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isEndModalOpen, setEndModal]   = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  // Load session on mount
  useEffect(() => {
    if (!sessionId) return;
    ApiClient.getInterview(sessionId)
      .then((res: any) => setSession(res))
      .catch((err: any) => setSessionError(err.message || 'Failed to load session'));
  }, [sessionId]);

  const mediaDevices = useMediaDevices();
  const {
    permissionState, videoStream, audioStream,
    cameraEnabled, micEnabled, audioLevel,
    toggleCamera, toggleMicrophone, requestPermissions,
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
    setReady,
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

  // Move from SETUP → READY once setup completes and session is loaded
  useEffect(() => {
    if (setupComplete && session && roomState === 'SETUP') setReady();
  }, [setupComplete, session, roomState, setReady]);

  const handleSkip = useCallback(async () => { await skipQuestion(); }, [skipQuestion]);
  const handleEnd  = useCallback(async () => {
    setEndModal(false);
    await endInterview();
  }, [endInterview]);

  // ── Avatar state derived from room state ──────────────────────────────────
  const avatarState =
    roomState === 'AI_SPEAKING' || isAiSpeaking ? 'speaking'   :
    roomState === 'EVALUATING'                   ? 'processing' :
    roomState === 'GENERATING_NEXT'              ? 'thinking'   :
    roomState === 'CANDIDATE_SPEAKING'           ? 'listening'  : 'idle';

  const currentQ     = currentQuestion?.question_order ?? 1;
  const totalQ       = session?.max_questions || session?.questions?.length || 10;

  // ── Loading / Error states ────────────────────────────────────────────────

  if (sessionError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Interview</h2>
        <p className="text-slate-400 mb-6">{sessionError}</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700">Go Home</button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading session...</p>
      </div>
    );
  }

  // ── MediaSetup screen ─────────────────────────────────────────────────────
  if (!setupComplete) {
    return (
      <MediaSetup
        onPermissionsGranted={() => setSetupComplete(true)}
        onCancel={() => navigate('/')}
        mediaDevices={mediaDevices}
        sessionInfo={{ role: session.role, difficulty: session.difficulty, interviewType: session.interview_type }}
      />
    );
  }

  // ── Begin Interview overlay (READY + question loaded) ─────────────────────
  // The "Begin Interview" click is the USER GESTURE that unlocks Chrome speechSynthesis
  if (roomState === 'READY' && currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 gap-8">
        {/* Question preview */}
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500 rounded-l-2xl" />
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Question {currentQ} of {totalQ}
          </p>
          <p className="text-lg text-white font-medium leading-relaxed">{currentQuestion.question_text}</p>
        </div>

        {/* Instructions */}
        <div className="text-center space-y-2 max-w-md">
          <p className="text-slate-300">The AI will read the question aloud, then your microphone opens automatically.</p>
          <p className="text-slate-500 text-sm">
            You have <span className="text-white font-semibold">{maxAnswerSeconds} seconds</span> to answer.
            Use <strong>Skip</strong> to move on.
          </p>
        </div>

        {/* THE KEY: direct onClick → speakQuestion → Chrome allows TTS */}
        <button
          id="begin-interview-btn"
          onClick={beginInterview}
          className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-2xl font-bold text-xl transition-all shadow-2xl shadow-indigo-900/40 animate-pulse"
          aria-label="Begin Interview — AI will speak the first question"
        >
          🎙️ Begin Interview
        </button>

        <button onClick={() => navigate('/')} className="text-slate-600 hover:text-slate-400 text-sm">Cancel</button>

        <DebugInspector
          state={roomState} timeLeft={timeLeft} isAiSpeaking={isAiSpeaking}
          micShouldBeActive={micShouldBeActive} wsConnectionState={wsConnectionState}
          questionId={currentQuestion?.id}
        />
      </div>
    );
  }

  // ── Main interview room ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* ── Header ── */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate">{session.role}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Clock className="w-3 h-3" />
              <span>{formatTime(elapsedSeconds)}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-semibold">Q {currentQ}/{totalQ}</span>
              <span className="text-slate-600">•</span>
              <span className="capitalize">{session.difficulty}</span>
            </div>
          </div>
        </div>

        {/* Answer countdown — shown during candidate turn */}
        <div className="flex items-center gap-2">
          {timerShouldRun ? (
            <CountdownRing timeLeft={timeLeft} total={maxAnswerSeconds} />
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-sm font-mono text-slate-500">--:--</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setEndModal(true)}
          className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
        >
          End Interview
        </button>
      </header>

      {/* ── Connection warning ── */}
      {wsConnectionState !== 'CONNECTED' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-6 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-400">
            {wsConnectionState === 'CONNECTING' ? 'Connecting...' : 'Reconnecting...'}
          </span>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col gap-5 p-6 max-w-7xl mx-auto w-full">

        {/* Question card */}
        {currentQuestion && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500 rounded-l-2xl" />
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              Question {currentQ} of {totalQ}
            </p>
            <p className="text-lg text-white font-medium leading-relaxed">{currentQuestion.question_text}</p>
          </div>
        )}

        {/* Video panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-[340px]">

          {/* AI panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center relative shadow-xl">
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold uppercase tracking-wide">
                Interviewer
              </span>
            </div>

            <AIAvatar state={avatarState} />

            <div className="mt-5 h-8 flex items-center justify-center w-full">
              <StateIndicator state={roomState} isAiSpeaking={isAiSpeaking} />
            </div>

            {roomError && (
              <p className="mt-2 text-xs text-rose-400 text-center">{roomError}</p>
            )}
          </div>

          {/* Candidate panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-xl flex flex-col">
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 bg-slate-800/80 backdrop-blur-sm text-slate-300 border border-slate-700/50 rounded-full text-xs font-semibold uppercase tracking-wide">
                Candidate
              </span>
            </div>

            {/* Mic status badge */}
            <div className="absolute top-4 right-4 z-10">
              {micShouldBeActive ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Mic On
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
                permissionDenied={permissionState === 'denied'}
                audioLevel={audioLevel}
                userName={session.candidate_name || 'You'}
                onRequestPermission={requestPermissions}
              />
            </div>

            {/* Live transcript */}
            {isRecording && transcript && (
              <div className="m-3 bg-black/60 backdrop-blur-md border border-slate-700/40 rounded-xl p-3 max-h-24 overflow-y-auto">
                <p className="text-white text-sm leading-relaxed">{transcript}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Controls bar ── */}
        <div className="flex items-center justify-center gap-3 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-4 rounded-2xl w-full max-w-3xl mx-auto shadow-xl">

          {/* Camera toggle */}
          <button
            onClick={toggleCamera}
            className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
              cameraEnabled
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
            title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {cameraEnabled
              ? <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14"/><rect x="3" y="7" width="12" height="11" rx="2"/></svg>
              : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="2" y1="2" x2="22" y2="22"/><path d="M10.68 10.68A2 2 0 007 12v1m14-3.87v6.26a1 1 0 01-1.447.9L15 14v-1.68M3 8.87V17a2 2 0 002 2h9.32"/></svg>
            }
          </button>

          {/* Mic toggle — disabled during AI speech */}
          <button
            onClick={toggleMicrophone}
            disabled={roomState === 'AI_SPEAKING' || isAiSpeaking}
            title={
              (roomState === 'AI_SPEAKING' || isAiSpeaking) ? 'Mic locked while AI speaks'
              : micEnabled ? 'Mute mic' : 'Unmute mic'
            }
            aria-label={micEnabled ? 'Microphone On' : 'Microphone Off'}
            className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
              (roomState === 'AI_SPEAKING' || isAiSpeaking)
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : micEnabled
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            {micShouldBeActive && isRecording && (
              <>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              </>
            )}
          </button>

          <div className="w-px h-10 bg-slate-700/50 mx-1" />

          {/* Primary action area */}

          {/* AI speaking */}
          {(roomState === 'AI_SPEAKING' || isAiSpeaking) && (
            <div className="flex items-center gap-2.5 px-5 h-11 bg-indigo-500/10 text-indigo-300 rounded-xl border border-indigo-500/20 text-sm font-medium">
              <span className="flex gap-0.5">
                {[0,1,2].map(i => <span key={i} className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </span>
              AI speaking...
            </div>
          )}

          {/* Candidate recording */}
          {isRecording && (
            <>
              <div className="flex items-center gap-2 px-4 h-11 bg-emerald-500/10 text-emerald-300 rounded-xl border border-emerald-500/20 text-sm font-medium">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                Listening...
              </div>
              <button
                onClick={stopAnswer}
                className="flex items-center gap-2 px-5 h-11 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-xl font-semibold text-sm transition-all"
              >
                <Square className="w-4 h-4 fill-current" />
                Finish Answer
              </button>
            </>
          )}

          {/* Processing / Evaluating / Generating */}
          {isProcessing && (
            <div className="flex items-center gap-2 px-5 h-11 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 text-sm font-medium">
              <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              {roomState === 'EVALUATING' ? 'Evaluating...' : roomState === 'GENERATING_NEXT' ? 'Next question...' : 'Processing...'}
            </div>
          )}

          {/* Skip — shown during candidate turn */}
          {(isRecording || roomState === 'CANDIDATE_READY') && (
            <button
              onClick={handleSkip}
              title="Skip this question"
              className="flex items-center gap-1.5 px-4 h-10 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl text-sm font-medium transition-all border border-slate-700/50"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </button>
          )}

          <div className="w-px h-10 bg-slate-700/50 mx-1" />

          {/* End interview */}
          <button
            onClick={() => setEndModal(true)}
            className="flex items-center gap-2 px-5 h-11 bg-rose-600/90 hover:bg-rose-600 active:scale-95 text-white rounded-xl font-medium text-sm transition-all"
          >
            <PhoneOff className="w-4 h-4" />
            End
          </button>
        </div>
      </main>

      {/* ── Modals ── */}
      <EndInterviewModal
        isOpen={isEndModalOpen}
        onCancel={() => setEndModal(false)}
        onConfirm={handleEnd}
        questionsAnswered={session.questions?.filter((q: any) => q.answers?.length > 0).length || 0}
        totalQuestions={totalQ}
      />

      {/* ── Dev debug inspector ── */}
      <DebugInspector
        state={roomState} timeLeft={timeLeft} isAiSpeaking={isAiSpeaking}
        micShouldBeActive={micShouldBeActive} wsConnectionState={wsConnectionState}
        questionId={currentQuestion?.id}
      />
    </div>
  );
}
