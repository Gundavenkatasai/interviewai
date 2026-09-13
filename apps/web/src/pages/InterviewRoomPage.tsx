import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Briefcase, AlertCircle, HelpCircle, Timer } from "lucide-react";
import { ApiClient } from "../lib/api";
import { MediaSetup } from "../components/interview/MediaSetup";
import { useMediaDevices } from "../hooks/useMediaDevices";
import { useInterviewRoom } from "../hooks/useInterviewRoom";
import { AIAvatar } from "../components/interview/AIAvatar";
import { CandidateVideo } from "../components/interview/CandidateVideo";
import { InterviewControls } from "../components/interview/InterviewControls";
import { EndInterviewModal } from "../components/interview/EndInterviewModal";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function CountdownRing({ timeLeft, total = 60 }: { timeLeft: number; total?: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / total) * circumference;
  const isUrgent = timeLeft <= 15;
  const isCritical = timeLeft <= 5;

  return (
    <div className="relative flex items-center justify-center w-14 h-14" title={`${timeLeft}s remaining`}>
      <svg className="absolute" width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle cx="28" cy="28" r={radius} fill="none"
          stroke={isCritical ? "#ef4444" : isUrgent ? "#f59e0b" : "#6366f1"}
          strokeWidth="3" strokeDasharray={circumference}
          strokeDashoffset={circumference - progress} strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <span className={`text-sm font-bold tabular-nums z-10 ${isCritical ? "text-red-400 animate-pulse" : isUrgent ? "text-amber-400" : "text-slate-300"}`}>
        {timeLeft}s
      </span>
    </div>
  );
}

export default function InterviewRoomPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    ApiClient.getInterview(sessionId)
      .then((res: any) => setSession(res.session || res))
      .catch((err) => setSessionError(err.message || "Failed to load session"));
  }, [sessionId]);

  const mediaDevices = useMediaDevices();
  const { permissionState, videoStream, audioStream, cameraEnabled, micEnabled, audioLevel, toggleCamera, toggleMicrophone, requestPermissions } = mediaDevices;

  const { 
    state: roomState, 
    connectionState,
    setReady, 
    currentQuestion, 
    transcript, 
    elapsedSeconds, 
    questionTimeLeft, 
    error: roomError, 
    startAnswer, 
    stopAnswer, 
    skipQuestion 
  } = useInterviewRoom({
    sessionId: sessionId!,
    session,
    audioStream,
    onAnswerSubmitted: () => {},
    onNextQuestion: () => {},
    onInterviewComplete: () => navigate(`/report/${sessionId}`),
  });

  useEffect(() => {
    if (setupComplete && session && roomState === 'SETUP') setReady();
  }, [setupComplete, session, roomState, setReady]);

  const handleSkipQuestion = useCallback(async () => {
    if (!currentQuestion) return;
    await skipQuestion();
  }, [currentQuestion, skipQuestion]);

  if (sessionError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Interview</h2>
        <p className="text-slate-400">{sessionError}</p>
        <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-xl">Go Home</button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-slate-400">Loading session...</p>
      </div>
    );
  }

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

  const getAvatarState = () => {
    switch (roomState) {
      case 'AI_SPEAKING': return 'speaking';
      case 'EVALUATING': return 'processing';
      case 'GENERATING_NEXT': return 'thinking';
      case 'CANDIDATE_SPEAKING': return 'listening';
      default: return 'idle';
    }
  };

  const isRecording = roomState === 'CANDIDATE_SPEAKING';
  const isCandidateReady = roomState === 'CANDIDATE_READY';
  const showCountdown = isCandidateReady || isRecording;
  const currentQuestionNumber = currentQuestion?.question_order ?? ((session.questions?.filter((q: any) => q.answers?.length > 0).length ?? 0) + 1);
  const totalQuestions = session.max_questions || 10;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">{session.role}</h1>
            <div className="flex items-center text-xs text-slate-400 font-mono space-x-2">
              <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" />{formatTime(elapsedSeconds)}</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">Question {currentQuestionNumber} of {totalQuestions}</span>
              <span>•</span>
              <span className="capitalize text-slate-500">{session.difficulty}</span>
            </div>
          </div>
        </div>

        {showCountdown && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <Timer className="w-3.5 h-3.5 text-slate-400" />
            <span className={`text-sm font-semibold tabular-nums ${questionTimeLeft <= 5 ? "text-red-400 animate-pulse" : questionTimeLeft <= 15 ? "text-amber-400" : "text-slate-300"}`}>
              {questionTimeLeft}s
            </span>
          </div>
        )}

        <button onClick={() => setIsEndModalOpen(true)}
          className="px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-sm font-semibold transition-colors">
          End Interview
        </button>
      </header>
      
      {connectionState !== 'CONNECTED' && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 py-2 px-6 flex items-center justify-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-400">
            {connectionState === 'CONNECTING' ? 'Connecting to realtime engine...' : 
             connectionState === 'RECONNECTING' ? 'Connection lost. Reconnecting...' : 
             'Disconnected. Attempting to restore connection...'}
          </span>
        </div>
      )}

      <main className="flex-1 p-6 flex flex-col max-w-7xl mx-auto w-full gap-5">
        {currentQuestion && (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center">
                  <HelpCircle className="w-4 h-4 mr-1.5" />Question {currentQuestionNumber} of {totalQuestions}
                </h3>
                <p className="text-lg text-white font-medium leading-relaxed">{currentQuestion.question_text}</p>
              </div>
              {showCountdown && <div className="flex-shrink-0"><CountdownRing timeLeft={questionTimeLeft} total={60} /></div>}
            </div>
            {showCountdown && (
              <div className="mt-4 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${questionTimeLeft <= 5 ? "bg-red-500" : questionTimeLeft <= 15 ? "bg-amber-500" : "bg-indigo-500"}`}
                  style={{ width: `${(questionTimeLeft / 60) * 100}%` }} />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-[360px]">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center relative shadow-xl">
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold uppercase tracking-wider">Interviewer</span>
            </div>
            <AIAvatar state={getAvatarState()} />
            <div className="mt-6 text-center max-w-md h-10">
              {roomState === 'AI_SPEAKING' && <p className="text-indigo-300 font-medium animate-pulse">AI Interviewer is speaking...</p>}
              {roomState === 'CANDIDATE_READY' && <p className="text-emerald-400 font-bold">Your Turn — Press "Start Speaking"</p>}
              {roomState === 'PROCESSING' && <p className="text-blue-300 font-medium flex items-center justify-center"><span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2" />Processing...</p>}
              {roomState === 'EVALUATING' && <p className="text-amber-300 font-medium animate-pulse">Evaluating your answer...</p>}
              {roomState === 'GENERATING_NEXT' && <p className="text-slate-300 font-medium flex items-center justify-center gap-2"><span className="flex gap-0.5">{[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}} />)}</span>Preparing next question...</p>}
              {roomError && <p className="text-rose-400 font-medium">{roomError}</p>}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-xl flex flex-col">
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 bg-slate-800/80 backdrop-blur-sm text-slate-300 border border-slate-700/50 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm">Candidate</span>
            </div>
            <CandidateVideo stream={videoStream} cameraEnabled={cameraEnabled} permissionDenied={permissionState === 'denied'}
              audioLevel={audioLevel} userName={session.candidate_name || "You"} onRequestPermission={requestPermissions} />
            {isRecording && transcript && (
              <div className="absolute bottom-16 left-4 right-4 bg-black/70 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl shadow-lg z-10 max-h-32 overflow-y-auto">
                <p className="text-white text-sm leading-relaxed">{transcript}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto pt-2">
          <InterviewControls
            micEnabled={micEnabled} cameraEnabled={cameraEnabled}
            onToggleMic={toggleMicrophone} onToggleCamera={toggleCamera}
            onEndInterview={() => setIsEndModalOpen(true)}
            onStartAnswer={isCandidateReady ? () => startAnswer() : undefined}
            onStopAnswer={isRecording ? stopAnswer : undefined}
            onSkipQuestion={(isCandidateReady || isRecording) ? handleSkipQuestion : undefined}
            isRecording={isRecording} interviewState={roomState}
          />
        </div>
      </main>

      <EndInterviewModal isOpen={isEndModalOpen} onCancel={() => setIsEndModalOpen(false)}
        onConfirm={() => { setIsEndModalOpen(false); navigate(`/report/${sessionId}`); }}
        questionsAnswered={session.questions?.filter((q: any) => q.answers && q.answers.length > 0).length || 0}
        totalQuestions={session.max_questions || 10}
      />
    </div>
  );
}
