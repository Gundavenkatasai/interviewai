"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  HelpCircle,
  Code2,
  MessageSquare,
  Users,
  Flag,
  Share2,
  AlertCircle
} from "lucide-react";

import { ApiClient } from "@/lib/api";
import { InterviewSession, Question, AnswerEvaluation, TranscriptItem } from "@/types";
import { useAudio } from "@/hooks/useAudio";
import { useWebSocket } from "@/hooks/useWebSocket";
import { AudioControls } from "@/components/interview/AudioControls";
import { TranscriptPanel } from "@/components/interview/TranscriptPanel";
import { AICoachPanel } from "@/components/interview/AICoachPanel";
import { CodingSandbox } from "@/components/interview/CodingSandbox";
import { InterviewerMode } from "@/components/interview/InterviewerMode";
import { formatTime } from "@/lib/utils";

export default function InterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;

  const initialInterviewerMode = searchParams.get("mode") === "interviewer";

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [manualText, setManualText] = useState("");
  const [currentEvaluation, setCurrentEvaluation] = useState<AnswerEvaluation | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isLoadingNextQuestion, setIsLoadingNextQuestion] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track how many questions the backend has generated so far
  const [totalQuestionsGenerated, setTotalQuestionsGenerated] = useState(0);
  // Interview completed automatically when max_questions reached
  const [interviewAutoComplete, setInterviewAutoComplete] = useState(false);

  // Coding mode toggle & Practice hint
  const [activeCenterView, setActiveCenterView] = useState<"transcript" | "coding">("transcript");
  const [isInterviewerModeOpen, setIsInterviewerModeOpen] = useState(initialInterviewerMode);
  const [hintData, setHintData] = useState<{ hint: string; key_concepts_to_mention: string[] } | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  // Audio Hook
  const onTranscriptReceived = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      setInterimTranscript("");
      setManualText((prev) => (prev ? `${prev} ${text}` : text));
    } else {
      setInterimTranscript(text);
    }
  }, []);

  const audio = useAudio(onTranscriptReceived);

  // WebSocket Hook
  const onWebSocketEvent = useCallback((event: any) => {
    if (event.type === "ai_status") {
      audio.setAiStatus(event.status);
    } else if (event.type === "transcript") {
      setTranscripts((prev) => [
        ...prev,
        {
          speaker: event.speaker,
          content: event.content,
          timestamp: new Date().toISOString(),
        },
      ]);
    } else if (event.type === "evaluation") {
      // Evaluation received via WebSocket
      // Optionally update local evaluation state
    } else if (event.type === "session_completed") {
      router.push(`/report/${sessionId}`);
    }
  }, [sessionId, router, audio]);

  useWebSocket(sessionId, onWebSocketEvent);

  // Load Interview Session
  const loadSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ApiClient.getInterview(sessionId);
      setSession(data);
      setElapsedSeconds(data.elapsed_seconds || 0);

      if (data.transcripts) {
        setTranscripts(data.transcripts);
      }

      // Check if current question has existing evaluation
      if (data.questions && data.questions.length > 0) {
        const q = data.questions[0];
        if (q.answers && q.answers.length > 0 && q.answers[0].evaluation) {
          setCurrentEvaluation(q.answers[0].evaluation);
        }
        if (q.category === "coding" || q.coding_starter_code) {
          setActiveCenterView("coding");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load interview session.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Elapsed Time Clock Interval
  useEffect(() => {
    if (!session || session.status === "completed") return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next % 15 === 0) {
          ApiClient.updateElapsed(sessionId, next).catch(() => {});
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session, sessionId]);

  const questions = session?.questions || [];
  const currentQuestion = questions[currentQuestionIndex] || null;

  // Submit Answer Action
  const handleAnswerSubmit = async (answerText: string, codeSubmission?: string) => {
    if (!currentQuestion || !answerText.trim() || isSubmittingAnswer) return;

    setIsSubmittingAnswer(true);
    audio.setAiStatus("analyzing");

    try {
      const res = await ApiClient.submitAnswer(sessionId, {
        question_id: currentQuestion.id,
        answer_text: answerText,
        code_submission: codeSubmission,
        duration_seconds: 30,
      });

      // Update transcripts list with candidate answer
      setTranscripts((prev) => [
        ...prev,
        {
          speaker: "candidate",
          content: answerText,
          timestamp: new Date().toISOString(),
        },
      ]);

      if (res.evaluation) {
        setCurrentEvaluation(res.evaluation);
      }

      setManualText("");
      setInterimTranscript("");

      // Refresh session to get the latest question list (including new follow-ups)
      const refreshed = await ApiClient.getInterview(sessionId);
      setSession(refreshed);
      setTotalQuestionsGenerated(refreshed.question_count || refreshed.questions?.length || 0);
    } catch (err: any) {
      alert("Error evaluating answer: " + err.message);
    } finally {
      setIsSubmittingAnswer(false);
      audio.setAiStatus("ready");
    }
  };

  /**
   * Requests the BACKEND to generate the next question via the dedup pipeline.
   * This is the correct way to get a new question — NOT navigating the pre-generated list.
   */
  const handleGetNextQuestion = async () => {
    if (isLoadingNextQuestion) return;
    setIsLoadingNextQuestion(true);
    audio.setAiStatus("analyzing");
    try {
      const res = await ApiClient.getNextQuestion(sessionId);

      // Check if interview is now complete (all max_questions answered)
      if (res.interview_complete) {
        setInterviewAutoComplete(true);
        // Auto-complete and navigate to report
        await ApiClient.completeInterview(sessionId);
        router.push(`/report/${sessionId}`);
        return;
      }

      // Refresh full session to get updated question list
      const refreshed = await ApiClient.getInterview(sessionId);
      setSession(refreshed);
      const newIdx = (refreshed.questions?.length ?? 1) - 1;
      setCurrentQuestionIndex(newIdx);
      setCurrentEvaluation(null);
      setTotalQuestionsGenerated(res.session_question_count || newIdx + 1);
      // Auto-switch view for coding questions
      const newQ = refreshed.questions?.[newIdx];
      if (newQ?.category === "coding" || newQ?.coding_starter_code) {
        setActiveCenterView("coding");
      } else {
        setActiveCenterView("transcript");
      }
    } catch (err: any) {
      // If 400 with complete message, navigate to report
      if (err.message?.includes("Interview complete")) {
        await ApiClient.completeInterview(sessionId).catch(() => {});
        router.push(`/report/${sessionId}`);
        return;
      }
      alert("Error getting next question: " + err.message);
    } finally {
      setIsLoadingNextQuestion(false);
      audio.setAiStatus("ready");
    }
  };

  /** Skip current question — just get the next one without answering. */
  const handleSkipQuestion = async () => {
    if (!confirm("Skip this question? It will be marked as unanswered.")) return;
    await handleGetNextQuestion();
  };

  // Switch Question
  const handleSelectQuestion = (idx: number) => {
    if (idx < 0 || idx >= questions.length) return;
    setCurrentQuestionIndex(idx);
    const q = questions[idx];
    setHintData(null);

    // Switch view to coding if question has starter code
    if (q.category === "coding" || q.coding_starter_code) {
      setActiveCenterView("coding");
    } else {
      setActiveCenterView("transcript");
    }

    // Load any existing evaluation for this question
    if (q.answers && q.answers.length > 0 && q.answers[0].evaluation) {
      setCurrentEvaluation(q.answers[0].evaluation);
    } else {
      setCurrentEvaluation(null);
    }
  };

  // Add Custom Question (Interviewer Mode)
  const handleAddCustomQuestion = async (text: string, category: string) => {
    try {
      const newQ = await ApiClient.addQuestion(sessionId, {
        question_text: text,
        category,
      });
      const refreshed = await ApiClient.getInterview(sessionId);
      setSession(refreshed);
      setCurrentQuestionIndex(refreshed.questions.length - 1);
    } catch (err: any) {
      alert("Error adding question: " + err.message);
    }
  };

  // Save Interviewer Notes
  const handleSaveNotes = async (notes: string) => {
    try {
      await ApiClient.updateFeedback(sessionId, { interviewer_notes: notes });
    } catch {}
  };

  // Practice Mode Hint
  const handleGetHint = async () => {
    if (!currentQuestion) return;
    setIsLoadingHint(true);
    try {
      const res = await ApiClient.getPracticeHint(
        currentQuestion.question_text,
        currentQuestion.expected_concepts || [],
        session?.role || "Software Engineer"
      );
      setHintData(res);
    } catch {}
    finally {
      setIsLoadingHint(false);
    }
  };

  // Finish Interview & View Report
  const handleCompleteInterview = async () => {
    if (!confirm("Are you ready to finish this interview and generate your AI evaluation report?")) {
      return;
    }
    setIsCompleting(true);
    audio.stopRecording();

    try {
      await ApiClient.completeInterview(sessionId);
      router.push(`/report/${sessionId}`);
    } catch (err: any) {
      alert("Error completing interview: " + err.message);
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Loading interview session...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Interview Not Found</h2>
        <p className="text-sm text-slate-400">{error || "Could not locate this session."}</p>
        <Link
          href="/setup"
          className="inline-block px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Start New Interview
        </Link>
      </div>
    );
  }

  const questionsRemaining = Math.max(0, questions.length - (currentQuestionIndex + 1));

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Top Banner: Controls, Timer, Status */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
        {/* Left: Role and Timer */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">{session.role}</h1>
              {session.company && (
                <span className="text-xs text-slate-400 font-medium">@ {session.company}</span>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {session.difficulty}
              </span>
              {session.resume_id && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-900/50 text-violet-300 border border-violet-500/30">
                  📄 Resume-Based
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-mono">
              <span className="flex items-center gap-1 text-indigo-300">
                <Clock className="w-3.5 h-3.5" />
                <span>Elapsed: {formatTime(elapsedSeconds)}</span>
              </span>
              <span>•</span>
              {/* Question N of M counter using max_questions */}
              <span className="font-semibold text-emerald-300">
                Question {session.question_count} of {session.max_questions || 10}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Audio Bar */}
        <div className="w-full md:max-w-md">
          <AudioControls
            permissionStatus={audio.permissionStatus}
            isRecording={audio.isRecording}
            isPaused={audio.isPaused}
            isMuted={audio.isMuted}
            aiStatus={audio.aiStatus}
            audioLevel={audio.audioLevel}
            errorMessage={audio.errorMessage}
            onStart={audio.startRecording}
            onPause={audio.pauseRecording}
            onResume={audio.resumeRecording}
            onStop={() => {
              audio.stopRecording();
              if (manualText.trim()) {
                handleAnswerSubmit(manualText.trim());
              }
            }}
            onToggleMute={audio.toggleMute}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Interviewer Mode Switch */}
          <button suppressHydrationWarning
            type="button"
            onClick={() => setIsInterviewerModeOpen((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              isInterviewerModeOpen
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Interviewer Mode</span>
          </button>

          {/* End Interview */}
          <button suppressHydrationWarning
            type="button"
            onClick={handleCompleteInterview}
            disabled={isCompleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{isCompleting ? "Synthesizing..." : "Finish Interview"}</span>
          </button>
        </div>
      </div>

      {/* 3-Panel Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-190px)] min-h-[640px]">
        {/* ================= LEFT PANEL ================= */}
        <div className="lg:col-span-3 flex flex-col space-y-4 h-full overflow-hidden">
          {/* Webcam / Visualizer Placeholder */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-2 backdrop-blur-md relative overflow-hidden flex-shrink-0" style={{ height: "180px" }}>
            <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center border border-slate-800 rounded-xl m-2">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-2 shadow-inner">
                <div className={`w-3 h-3 rounded-full ${audio.isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'}`} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {audio.isRecording ? 'Mic Active' : 'Camera / Mic Off'}
              </span>
              
              {/* Fake visualizer bars when recording */}
              {audio.isRecording && (
                <div className="flex items-end gap-1 mt-3 h-6">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-indigo-500 rounded-full animate-pulse" 
                      style={{ 
                        height: `${Math.max(10, Math.random() * 100)}%`,
                        animationDelay: `${i * 0.1}s` 
                      }} 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Interview Metadata Card */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Details</h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Experience</span>
                <span className="font-semibold text-white">{session.experience_level}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Type</span>
                <span className="font-semibold text-white">{session.interview_type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Progress</span>
                <span className="font-semibold text-indigo-400">
                  {session.question_count} / {session.max_questions || 10}
                </span>
              </div>
              {/* Progress bar */}
              <div className="py-1.5">
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (session.question_count / (session.max_questions || 10)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Technologies */}
            {session.technologies && session.technologies.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Target Tech Stack
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {session.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-950 border border-slate-800 text-indigo-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Question List Navigator */}
          <div className="flex-1 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 backdrop-blur-md overflow-hidden flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
              Interview Questions
            </span>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const hasAnswer = q.answers && q.answers.length > 0;
                return (
                  <button suppressHydrationWarning
                    key={q.id || idx}
                    type="button"
                    onClick={() => handleSelectQuestion(idx)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      isCurrent
                        ? "bg-indigo-600/15 border-indigo-500 text-white shadow-sm shadow-indigo-500/10"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className={isCurrent ? "text-indigo-400" : "text-slate-500"}>#{idx + 1}</span>
                        <span className="capitalize">{q.category}</span>
                      </span>
                      {hasAnswer && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <p className="line-clamp-2 text-[11px] leading-relaxed">{q.question_text}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= CENTER PANEL ================= */}
        <div className="lg:col-span-5 flex flex-col h-full overflow-hidden space-y-2">
          {/* View Mode Toggle: Conversation vs Code Editor */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
              <button suppressHydrationWarning
                type="button"
                onClick={() => setActiveCenterView("transcript")}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  activeCenterView === "transcript"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Conversation</span>
              </button>

              <button suppressHydrationWarning
                type="button"
                onClick={() => setActiveCenterView("coding")}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  activeCenterView === "coding"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Coding Sandbox</span>
              </button>
            </div>

            {/* Prev / Next Question Nav + Skip/Repeat */}
            <div className="flex items-center gap-1.5">
              {/* Skip button */}
              <button suppressHydrationWarning
                type="button"
                onClick={handleSkipQuestion}
                disabled={isLoadingNextQuestion || isSubmittingAnswer}
                title="Skip this question"
                className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-amber-300 hover:border-amber-500/30 disabled:opacity-30 text-xs transition-colors"
              >
                Skip
              </button>

              <button suppressHydrationWarning
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => handleSelectQuestion(currentQuestionIndex - 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono text-slate-400 px-2">
                {currentQuestionIndex + 1} / {session.max_questions || questions.length}
              </span>

              {/* If viewing last question → ask backend for a NEW question.
                  If there are already-generated questions ahead → navigate locally. */}
              {currentQuestionIndex < questions.length - 1 ? (
                <button suppressHydrationWarning
                  type="button"
                  onClick={() => handleSelectQuestion(currentQuestionIndex + 1)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button suppressHydrationWarning
                  type="button"
                  disabled={isLoadingNextQuestion || isSubmittingAnswer}
                  onClick={handleGetNextQuestion}
                  title="Generate next question (AI)"
                  className="p-1.5 rounded-lg bg-indigo-600 border border-indigo-500 text-white hover:bg-indigo-500 disabled:opacity-40 flex items-center gap-1 transition-colors"
                >
                  {isLoadingNextQuestion ? (
                    <span className="w-4 h-4 block rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Center Body */}
          <div className="flex-1 overflow-hidden">
            {activeCenterView === "transcript" ? (
              <TranscriptPanel
                transcripts={transcripts}
                currentQuestion={currentQuestion}
                interimTranscript={interimTranscript}
                isRecording={audio.isRecording}
                onTextAnswerSubmit={(text) => handleAnswerSubmit(text)}
                manualText={manualText}
                setManualText={setManualText}
                isSubmittingAnswer={isSubmittingAnswer}
              />
            ) : (
              <CodingSandbox
                problemStatement={currentQuestion?.question_text || "Implement your code solution."}
                starterCode={currentQuestion?.coding_starter_code}
                testCases={currentQuestion?.coding_test_cases}
                defaultLanguage={currentQuestion?.coding_language || "python"}
                onSolutionSubmitted={(code, review) => {
                  handleAnswerSubmit(`Submitted solution code for problem. AI Code Review Score: ${review.score}/10. Time: ${review.time_complexity}, Space: ${review.space_complexity}`, code);
                }}
              />
            )}
          </div>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
          {isInterviewerModeOpen ? (
            <InterviewerMode
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              onSelectQuestion={handleSelectQuestion}
              onAddCustomQuestion={handleAddCustomQuestion}
              onSaveNotes={handleSaveNotes}
              onEndInterview={handleCompleteInterview}
            />
          ) : (
            <AICoachPanel
              evaluation={currentEvaluation}
              currentQuestion={currentQuestion}
              coachMode={session.coach_mode}
              onGetHint={handleGetHint}
              hintData={hintData}
              isLoadingHint={isLoadingHint}
            />
          )}
        </div>
      </div>
    </div>
  );
}
