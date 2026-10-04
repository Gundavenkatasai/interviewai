/**
 * useInterviewRoom — Production Authoritative Interview Turn Controller
 *
 * Implements:
 * - Authoritative State Machine (Phase 1)
 * - MicrophoneManager (Phase 4)
 * - STTManager (Phase 4, 9)
 * - InterviewTurnController (Phase 4, 5, 8, 10, 15, 16)
 * - TTS Completion turn-taking (Phase 5, 7)
 * - Timestamp-based duration tracking (Phase 8)
 * - Idempotent answer submission with answerSubmissionId (Phase 10)
 * - Safe skip question handling (Phase 16)
 * - Atomic completion & report transition (Phase 17, 21)
 * - WebSocket normalized events (Phase 22)
 * - Reconnect & state restoration (Phase 23)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createTTSProvider } from "@/services/TTSProvider";
import { useWebSocket, WebSocketEvent } from "@/hooks/useWebSocket";
import { ApiClient } from "@/lib/api";

// ─── Authoritative States ───────────────────────────────────────────────────

export type InterviewRoomState =
  | "SETUP"
  | "PERMISSION_GRANTED"
  | "AI_SPEAKING"
  | "CANDIDATE_READY"
  | "CANDIDATE_SPEAKING"
  | "PROCESSING"
  | "EVALUATING"
  | "GENERATING_NEXT"
  | "COMPLETING"
  | "REPORT_GENERATING"
  | "COMPLETED"
  | "FAILED"
  | "RECONNECTING";

// ─── Centralized MicrophoneManager ──────────────────────────────────────────

export class MicrophoneManager {
  private static instance: MicrophoneManager | null = null;
  private stream: MediaStream | null = null;

  static getInstance(): MicrophoneManager {
    if (!MicrophoneManager.instance) {
      MicrophoneManager.instance = new MicrophoneManager();
    }
    return MicrophoneManager.instance;
  }

  setStream(stream: MediaStream | null) {
    this.stream = stream;
  }

  enable() {
    if (!this.stream) return;
    this.stream.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
  }

  disable() {
    if (!this.stream) return;
    this.stream.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
  }

  isActive(): boolean {
    if (!this.stream) return false;
    return this.stream.getAudioTracks().some((t) => t.enabled);
  }
}

// ─── Centralized STTManager ─────────────────────────────────────────────────

export class STTManager {
  private static instance: STTManager | null = null;
  private recognition: any = null;
  private isRunning = false;
  private onResultCallback: ((interim: string, final: string) => void) | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;
  private allowTranscription = false;

  static getInstance(): STTManager {
    if (!STTManager.instance) {
      STTManager.instance = new STTManager();
    }
    return STTManager.instance;
  }

  constructor() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      try {
        this.recognition = new SR();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";

        this.recognition.onresult = (event: any) => {
          if (!this.allowTranscription) return;

          let interim = "";
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          if (this.onResultCallback) {
            this.onResultCallback(interim, final);
          }
        };

        this.recognition.onerror = (event: any) => {
          if (event.error === "no-speech" || event.error === "aborted") return;
          if (this.onErrorCallback) this.onErrorCallback(event.error);
        };

        this.recognition.onend = () => {
          if (this.isRunning && this.allowTranscription) {
            try {
              this.recognition.start();
            } catch (_) {}
          }
        };
      } catch (e) {
        console.warn("STT initialization failed", e);
      }
    }
  }

  setCallbacks(
    onResult: (interim: string, final: string) => void,
    onError?: (err: any) => void
  ) {
    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
  }

  start() {
    this.allowTranscription = true;
    this.isRunning = true;
    if (!this.recognition) return;
    try {
      this.recognition.start();
    } catch (_) {}
  }

  stop() {
    this.allowTranscription = false;
    this.isRunning = false;
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (_) {}
  }

  isAvailable(): boolean {
    return !!this.recognition;
  }
}

// ─── Hook Props ─────────────────────────────────────────────────────────────

interface UseInterviewRoomProps {
  sessionId: string;
  session: any | null;
  audioStream: MediaStream | null;
  onAnswerSubmitted?: (result: any) => void;
  onNextQuestion?: (question: any) => void;
  onInterviewComplete: () => void;
}

// ─── Main Hook ──────────────────────────────────────────────────────────────

export function useInterviewRoom({
  sessionId,
  session,
  audioStream,
  onAnswerSubmitted,
  onNextQuestion,
  onInterviewComplete,
}: UseInterviewRoomProps) {
  // ── React State ───────────────────────────────────────────────────────────
  const [state, setState] = useState<InterviewRoomState>("SETUP");
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnectionState, setWsConnectionState] = useState("DISCONNECTED");

  // ── Derived Config ────────────────────────────────────────────────────────
  const maxAnswerSeconds = Number(session?.maxAnswerDuration || session?.max_answer_duration || 60);

  // ── Managers & Refs ───────────────────────────────────────────────────────
  const micManager = useRef(MicrophoneManager.getInstance()).current;
  const sttManager = useRef(STTManager.getInstance()).current;

  const stateRef = useRef<InterviewRoomState>("SETUP");
  stateRef.current = state;

  const ttsRef = useRef<any>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRafRef = useRef<number | null>(null);

  const answerStartedAt = useRef<number>(0);
  const currentSpeakingQuestionId = useRef<string | null>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const pendingSpeakRef = useRef<string | null>(null);
  const autoTurnTriggeredRef = useRef<boolean>(false);

  const liveTranscriptRef = useRef("");
  const finalTranscriptRef = useRef("");
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const currentQuestionRef = useRef<any>(null);
  currentQuestionRef.current = currentQuestion;
  const serverStateVersionRef = useRef<number>(0);

  const onAnswerSubmittedRef = useRef(onAnswerSubmitted);
  onAnswerSubmittedRef.current = onAnswerSubmitted;
  const onNextQuestionRef = useRef(onNextQuestion);
  onNextQuestionRef.current = onNextQuestion;
  const onInterviewCompleteRef = useRef(onInterviewComplete);
  onInterviewCompleteRef.current = onInterviewComplete;

  const sendEventRef = useRef<((type: string, payload: any) => void) | null>(null);

  // Sync audioStream with MicrophoneManager
  useEffect(() => {
    micManager.setStream(audioStream);
  }, [audioStream, micManager]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const log = useCallback((event: string, data?: any) => {
    if (import.meta.env.DEV) {
      const ts = new Date().toISOString().slice(11, 23);
      console.log(`[InterviewTurnController ${ts}] ${event}`, data ?? "");
    }
  }, []);

  const normalizeQuestion = useCallback((q: any) => {
    if (!q) return null;
    const text = q.question_text || q.questionText || q.text || "";
    const id = q.id || q._id || q.question_id;
    const order = q.question_order ?? q.sequenceNumber ?? q.questionOrder ?? 1;
    return {
      ...q,
      id,
      _id: id,
      question_id: id,
      question_text: text,
      questionText: text,
      text,
      question_order: order,
      sequenceNumber: order,
      category: q.category || "technical",
      difficulty: q.difficulty || "medium",
    };
  }, []);

  // ── Turn-Taking: Audio State Synchronization ──────────────────────────────
  // Enforces Phase 4 strict matrix:
  // SETUP, PERMISSION_GRANTED, AI_SPEAKING, PROCESSING, EVALUATING, GENERATING_NEXT, COMPLETING, REPORT_GENERATING, COMPLETED, FAILED: Mic OFF, STT OFF
  // CANDIDATE_READY, CANDIDATE_SPEAKING: Mic ON, STT ON

  const syncHardwareTurnState = useCallback(
    (targetState: InterviewRoomState) => {
      const isCandidateTurn = targetState === "CANDIDATE_READY" || targetState === "CANDIDATE_SPEAKING";
      if (isCandidateTurn) {
        micManager.enable();
        sttManager.start();
        log("turn.hardware.activated", { mic: true, stt: true, state: targetState });
      } else {
        micManager.disable();
        sttManager.stop();
        log("turn.hardware.muted", { mic: false, stt: false, state: targetState });
      }
    },
    [micManager, sttManager, log]
  );

  // ── WebSocket Handler ─────────────────────────────────────────────────────

  const handleWsEvent = useCallback(
    (event: WebSocketEvent) => {
      switch (event.type) {
        case "STATE_SYNC_RESPONSE":
        case "INTERVIEW_STATE": {
          const v = event.payload?.stateVersion ?? event.stateVersion ?? 0;
          if (v >= serverStateVersionRef.current) {
            serverStateVersionRef.current = v;
            const serverState = event.payload?.state as InterviewRoomState | undefined;

            if (serverState && !ttsRef.current?.isSpeaking) {
              setState(serverState);
              syncHardwareTurnState(serverState);
              log("interview.state.synced", { state: serverState, version: v });
            }

            if (event.payload?.currentQuestion) {
              const q = normalizeQuestion(event.payload.currentQuestion);
              setCurrentQuestion(q);
            }

            if (typeof event.payload?.elapsedSeconds === "number") {
              setElapsedSeconds(event.payload.elapsedSeconds);
            }
          }
          break;
        }

        case "REPORT_READY":
        case "INTERVIEW_COMPLETED": {
          setState("COMPLETED");
          syncHardwareTurnState("COMPLETED");
          onInterviewCompleteRef.current?.();
          break;
        }

        case "ERROR": {
          setError(event.payload?.message || "Protocol error");
          break;
        }

        case "PING": {
          sendEventRef.current?.("PONG", {});
          break;
        }
      }
    },
    [normalizeQuestion, syncHardwareTurnState, log]
  );

  const { connectionState: wsConnState, sendEvent } = useWebSocket(sessionId, handleWsEvent);
  sendEventRef.current = sendEvent;

  useEffect(() => {
    setWsConnectionState(wsConnState);
  }, [wsConnState]);

  // ── STT Listener Setup ────────────────────────────────────────────────────

  useEffect(() => {
    sttManager.setCallbacks(
      (interim: string, final: string) => {
        // Protect against audio bleeding while AI is speaking
        if (stateRef.current === "AI_SPEAKING" || isAiSpeaking) return;

        if (final) {
          const combined = (finalTranscriptRef.current ? finalTranscriptRef.current + " " + final : final).trim();
          finalTranscriptRef.current = combined;
          setFinalTranscript(combined);
        }

        setLiveTranscript(interim);
        liveTranscriptRef.current = interim;
      },
      (err: any) => {
        log("stt.error", err);
      }
    );
  }, [sttManager, isAiSpeaking, log]);

  // ── TTS Synthesis Lifecycle (Authoritative Turn-Taking Signal) ─────────────

  useEffect(() => {
    const tts = createTTSProvider();
    ttsRef.current = tts;

    tts.onStart = () => {
      log("turn.ai.speech.started");
      setIsAiSpeaking(true);
      setState("AI_SPEAKING");
      syncHardwareTurnState("AI_SPEAKING");

      sendEventRef.current?.("AI_SPEAKING_STARTED", {
        questionId: currentSpeakingQuestionId.current,
      });
    };

    tts.onEnd = () => {
      const qId = currentSpeakingQuestionId.current;
      log("turn.ai.speech.completed — Authoritative turn trigger", { questionId: qId });
      setIsAiSpeaking(false);

      // CRITICAL (Phase 5): TTS completion is the ONLY authoritative turn signal!
      // AI_SPEAKING -> CANDIDATE_READY -> activates candidate microphone/STT
      setState("CANDIDATE_READY");
      syncHardwareTurnState("CANDIDATE_READY");

      sendEventRef.current?.("AI_SPEAKING_COMPLETED", { questionId: qId });
      sendEventRef.current?.("CANDIDATE_READY", { questionId: qId });

      // Automatically transition to CANDIDATE_SPEAKING
      setState("CANDIDATE_SPEAKING");
      syncHardwareTurnState("CANDIDATE_SPEAKING");

      // Start answer duration timer from accurate timestamp (Phase 8)
      answerStartedAt.current = Date.now();
      setTimeLeft(maxAnswerSeconds);
      isSubmittingRef.current = false;
      finalTranscriptRef.current = "";
      liveTranscriptRef.current = "";
      setFinalTranscript("");
      setLiveTranscript("");

      sendEventRef.current?.("CANDIDATE_SPEAKING_STARTED", { questionId: qId });
    };

    tts.onError = (err: any) => {
      log("turn.ai.speech.error, fallback to candidate turn", err);
      setIsAiSpeaking(false);
      setState("CANDIDATE_READY");
      syncHardwareTurnState("CANDIDATE_READY");

      setState("CANDIDATE_SPEAKING");
      syncHardwareTurnState("CANDIDATE_SPEAKING");
      answerStartedAt.current = Date.now();
      setTimeLeft(maxAnswerSeconds);
      isSubmittingRef.current = false;
    };

    return () => {
      tts.stop();
      micManager.disable();
      sttManager.stop();
    };
  }, [micManager, sttManager, syncHardwareTurnState, maxAnswerSeconds, log]);

  // ── Speak Question ────────────────────────────────────────────────────────

  const speakQuestion = useCallback(
    (text: string, questionId?: string) => {
      const clean = (text || "").trim();
      currentSpeakingQuestionId.current = questionId ?? currentQuestionRef.current?.id ?? null;

      log("turn.ai.speakQuestion.requested", { questionId, textLen: clean.length });

      if (!clean) {
        setState("CANDIDATE_READY");
        syncHardwareTurnState("CANDIDATE_READY");
        return;
      }

      setState("AI_SPEAKING");
      setIsAiSpeaking(true);
      syncHardwareTurnState("AI_SPEAKING");

      if (ttsRef.current) {
        ttsRef.current.synthesize(clean);
      } else {
        setState("CANDIDATE_READY");
        syncHardwareTurnState("CANDIDATE_READY");
      }
    },
    [syncHardwareTurnState, log]
  );

  // ── Load Question when entering PERMISSION_GRANTED ─────────────────────────

  useEffect(() => {
    if (!session) return;
    if (stateRef.current !== "SETUP" && stateRef.current !== "PERMISSION_GRANTED") return;

    const questions: any[] = session.questions || [];
    const sessionData = session.session || session;
    const currentIdx: number = sessionData.currentQuestionIndex ?? 0;

    if (questions.length > 0 && currentIdx < questions.length) {
      const q = normalizeQuestion(questions[currentIdx]);
      setCurrentQuestion(q);
      pendingSpeakRef.current = q?.question_text || null;
    } else if (questions.length === 0) {
      ApiClient.getNextQuestion(sessionIdRef.current)
        .then((next) => {
          if (next.complete === true) {
            setState("COMPLETED");
            onInterviewCompleteRef.current?.();
          } else {
            const qObj = normalizeQuestion(next.question || next);
            setCurrentQuestion(qObj);
            onNextQuestionRef.current?.(qObj);
            pendingSpeakRef.current = qObj?.question_text || null;
          }
        })
        .catch((err) => {
          log("interview.error.loadingFirstQuestion", err.message);
          setError("Failed to load first question. Please refresh.");
        });
    }
  }, [session, state, normalizeQuestion, log]);

  // ── beginInterview (User Gesture Anchor for Q1 Speech) ─────────────────────

  const beginInterview = useCallback(() => {
    const text = pendingSpeakRef.current;
    const qId = currentQuestionRef.current?.id;
    pendingSpeakRef.current = null;
    log("turn.candidate.beginInterview.clicked");
    speakQuestion(text || "", qId);
  }, [speakQuestion, log]);

  // ── submitAnswer (Idempotent, Timestamp-Based) ─────────────────────────────

  const submitAnswer = useCallback(
    async (answerText: string) => {
      const q = currentQuestionRef.current;
      if (!q) {
        log("turn.submitAnswer.rejected.noQuestion");
        return;
      }
      if (isSubmittingRef.current) {
        log("turn.submitAnswer.rejected.duplicateBlocked");
        return;
      }

      isSubmittingRef.current = true;
      const submittedAt = Date.now();
      const startedAt = answerStartedAt.current || submittedAt;
      const durationMs = Math.max(0, submittedAt - startedAt);
      const durationSeconds = Math.round(durationMs / 1000);
      const answerSubmissionId = crypto.randomUUID();

      log("turn.answer.submitting", {
        questionId: q.id,
        answerSubmissionId,
        durationMs,
        textLen: answerText.length,
      });

      // Strict hardware muting during answer processing & evaluation
      setState("PROCESSING");
      syncHardwareTurnState("PROCESSING");

      try {
        setState("EVALUATING");
        syncHardwareTurnState("EVALUATING");

        const result = await ApiClient.submitAnswer(sessionIdRef.current, {
          question_id: q.id || q._id,
          answer_submission_id: answerSubmissionId,
          answer_text: answerText || "No verbal answer provided",
          transcript: answerText,
          duration_seconds: durationSeconds,
          durationMs,
          startedAt,
          submittedAt,
        });

        onAnswerSubmittedRef.current?.(result);
        log("turn.answer.evaluated.success");

        // Next Question Generation
        setState("GENERATING_NEXT");
        syncHardwareTurnState("GENERATING_NEXT");

        const next = await ApiClient.getNextQuestion(sessionIdRef.current);

        if (next.complete === true || next.interview_complete === true) {
          log("turn.interview.completed");
          setState("COMPLETING");
          syncHardwareTurnState("COMPLETING");

          // Trigger report generation
          setState("REPORT_GENERATING");
          syncHardwareTurnState("REPORT_GENERATING");
          await ApiClient.generateInterviewReport(sessionIdRef.current).catch(() => {});

          setState("COMPLETED");
          syncHardwareTurnState("COMPLETED");
          onInterviewCompleteRef.current?.();
        } else {
          const nextQ = normalizeQuestion(next.question || next);
          setCurrentQuestion(nextQ);
          onNextQuestionRef.current?.(nextQ);
          log("turn.nextQuestion.ready", { questionId: nextQ?.id });

          // Speak next question (continues gesture chain in modern browsers)
          speakQuestion(nextQ?.question_text || "", nextQ?.id);
        }
      } catch (err: any) {
        isSubmittingRef.current = false;
        if (err?.response?.status === 409 || err?.status === 409) {
          log("turn.answer.idempotency.alreadyProcessed");
        } else {
          log("turn.answer.error", err?.message);
          setError(err?.message || "Failed to submit answer");
          setState("FAILED");
          syncHardwareTurnState("FAILED");
        }
      }
    },
    [normalizeQuestion, speakQuestion, syncHardwareTurnState, log]
  );

  // ── stopAnswer ────────────────────────────────────────────────────────────

  const stopAnswer = useCallback(async () => {
    const s = stateRef.current;
    if (s !== "CANDIDATE_SPEAKING" && s !== "CANDIDATE_READY") return;

    log("turn.answer.stoppingCandidateTurn");
    const full = (finalTranscriptRef.current + " " + liveTranscriptRef.current).trim();
    await submitAnswer(full || "No verbal answer provided.");
  }, [submitAnswer, log]);

  const stopAnswerRef = useRef(stopAnswer);
  stopAnswerRef.current = stopAnswer;

  // ── skipQuestion (Phase 16) ───────────────────────────────────────────────

  const skipQuestion = useCallback(async () => {
    const q = currentQuestionRef.current;
    const s = stateRef.current;
    if (!q || s === "PROCESSING" || s === "EVALUATING" || s === "GENERATING_NEXT" || s === "COMPLETED") return;

    log("turn.question.skipping", { questionId: q.id });
    if (ttsRef.current) ttsRef.current.stop();
    syncHardwareTurnState("PROCESSING");
    setState("PROCESSING");

    try {
      await ApiClient.skipQuestion(sessionIdRef.current, {
        question_id: q.id || q._id,
        skip_reason: "Candidate skipped question",
      });

      setState("GENERATING_NEXT");
      syncHardwareTurnState("GENERATING_NEXT");

      const next = await ApiClient.getNextQuestion(sessionIdRef.current);
      if (next.complete === true || next.interview_complete === true) {
        setState("COMPLETED");
        syncHardwareTurnState("COMPLETED");
        onInterviewCompleteRef.current?.();
      } else {
        const nextQ = normalizeQuestion(next.question || next);
        setCurrentQuestion(nextQ);
        onNextQuestionRef.current?.(nextQ);
        speakQuestion(nextQ?.question_text || "", nextQ?.id);
      }
    } catch (err: any) {
      log("turn.skip.error", err?.message);
      setError(err?.message || "Failed to skip question");
    }
  }, [normalizeQuestion, speakQuestion, syncHardwareTurnState, log]);

  // ── endInterview ──────────────────────────────────────────────────────────

  const endInterview = useCallback(async () => {
    log("turn.interview.endingByUser");
    if (ttsRef.current) ttsRef.current.stop();
    syncHardwareTurnState("COMPLETING");
    setState("COMPLETING");

    try {
      await ApiClient.completeInterview(sessionIdRef.current);
    } catch (_) {}

    setState("COMPLETED");
    syncHardwareTurnState("COMPLETED");
    onInterviewCompleteRef.current?.();
  }, [syncHardwareTurnState, log]);

  // ── Per-Question Answer Countdown (RAF-based) ─────────────────────────────

  useEffect(() => {
    if (state !== "CANDIDATE_SPEAKING") {
      if (countdownRafRef.current) {
        cancelAnimationFrame(countdownRafRef.current);
        countdownRafRef.current = null;
      }
      if (state !== "CANDIDATE_READY") {
        setTimeLeft(maxAnswerSeconds);
      }
      return;
    }

    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const now = Date.now();
      const elapsed = (now - answerStartedAt.current) / 1000;
      const remaining = Math.max(0, maxAnswerSeconds - elapsed);

      setTimeLeft(Math.ceil(remaining));

      if (remaining <= 0) {
        log("turn.timer.expired");
        stopAnswerRef.current();
        return;
      }

      countdownRafRef.current = requestAnimationFrame(tick);
    };

    countdownRafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (countdownRafRef.current) {
        cancelAnimationFrame(countdownRafRef.current);
        countdownRafRef.current = null;
      }
    };
  }, [state, maxAnswerSeconds, log]);

  // ── Session Elapsed Clock ─────────────────────────────────────────────────

  useEffect(() => {
    const inactive =
      state === "SETUP" ||
      state === "PERMISSION_GRANTED" ||
      state === "COMPLETED" ||
      state === "FAILED";
    if (inactive) return;

    sessionTimerRef.current = setInterval(() => setElapsedSeconds((p) => p + 1), 1000);
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [state]);

  useEffect(() => {
    if (elapsedSeconds > 0 && elapsedSeconds % 30 === 0) {
      ApiClient.updateElapsed(sessionIdRef.current, elapsedSeconds).catch(() => {});
    }
  }, [elapsedSeconds]);

  // ── Permission Granted Transition ─────────────────────────────────────────

  const setPermissionGranted = useCallback(() => {
    log("interview.permissions.granted");
    setState("PERMISSION_GRANTED");
    syncHardwareTurnState("PERMISSION_GRANTED");
  }, [syncHardwareTurnState, log]);

  // ── Exports ───────────────────────────────────────────────────────────────

  const micShouldBeActive = state === "CANDIDATE_READY" || state === "CANDIDATE_SPEAKING";
  const timerShouldRun = state === "CANDIDATE_READY" || state === "CANDIDATE_SPEAKING";
  const isProcessing =
    state === "PROCESSING" ||
    state === "EVALUATING" ||
    state === "GENERATING_NEXT" ||
    state === "COMPLETING" ||
    state === "REPORT_GENERATING";
  const isRecording = state === "CANDIDATE_SPEAKING";

  return {
    state,
    wsConnectionState,
    currentQuestion,
    error,

    transcript: (finalTranscript + " " + liveTranscript).trim(),
    liveTranscript,
    finalTranscript,

    elapsedSeconds,
    timeLeft,
    maxAnswerSeconds,

    isAiSpeaking,
    micShouldBeActive,
    timerShouldRun,
    isProcessing,
    isRecording,

    setPermissionGranted,
    setReady: setPermissionGranted, // Backward-compat alias
    beginInterview,
    stopAnswer,
    skipQuestion,
    endInterview,
  };
}
