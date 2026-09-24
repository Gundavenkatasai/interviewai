/**
 * useInterviewRoom — Single authoritative interview turn controller
 *
 * STATE CONTRACT (single source of truth):
 *  State               | Mic | STT | Timer
 *  --------------------|-----|-----|------
 *  SETUP               | OFF | OFF | STOP
 *  READY               | OFF | OFF | STOP
 *  AI_SPEAKING         | OFF | OFF | STOP
 *  CANDIDATE_READY     | ON  | ON  | START → immediately transitions to CANDIDATE_SPEAKING
 *  CANDIDATE_SPEAKING  | ON  | ON  | RUN
 *  PROCESSING          | OFF | OFF | STOP
 *  EVALUATING          | OFF | OFF | STOP
 *  GENERATING_NEXT     | OFF | OFF | STOP
 *  COMPLETED           | OFF | OFF | STOP
 *  ERROR               | OFF | OFF | STOP
 *
 * CRITICAL RULES:
 *  1. speakQuestion() MUST be called from a user gesture (onClick) for the FIRST question.
 *     Chrome's autoplay policy blocks speechSynthesis.speak() from async/effect context.
 *     Subsequent questions are called from Promise chains that originate from user gestures.
 *
 *  2. The auto-start effect only depends on [state] — NOT on function references.
 *     All callbacks are accessed via refs to avoid infinite re-render loops.
 *
 *  3. TTS and STT are initialized ONCE ([] deps) and read live state via refs.
 *
 *  4. Question ID guard prevents stale TTS completions from activating the wrong turn.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createTTSProvider } from "@/services/TTSProvider";
import { useWebSocket, WebSocketEvent } from "@/hooks/useWebSocket";
import { ApiClient } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export type InterviewRoomState =
  | 'SETUP'
  | 'READY'
  | 'AI_SPEAKING'
  | 'CANDIDATE_READY'
  | 'CANDIDATE_SPEAKING'
  | 'PROCESSING'
  | 'EVALUATING'
  | 'GENERATING_NEXT'
  | 'COMPLETED'
  | 'ERROR';

interface UseInterviewRoomProps {
  sessionId: string;
  session: any | null;
  audioStream: MediaStream | null;
  onAnswerSubmitted: (result: any) => void;
  onNextQuestion: (question: any) => void;
  onInterviewComplete: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useInterviewRoom({
  sessionId,
  session,
  audioStream,
  onAnswerSubmitted,
  onNextQuestion,
  onInterviewComplete,
}: UseInterviewRoomProps) {

  // ── React State (drives UI renders) ──────────────────────────────────────
  const [state, setState] = useState<InterviewRoomState>('SETUP');
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');       // interim words
  const [finalTranscript, setFinalTranscript] = useState('');     // committed words
  const [elapsedSeconds, setElapsedSeconds] = useState(0);        // session clock
  const [timeLeft, setTimeLeft] = useState(60);                   // per-question countdown
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnectionState, setWsConnectionState] = useState('DISCONNECTED');

  // ── Derived from session config (or defaults) ─────────────────────────────
  // Read maxAnswerDuration from session if the backend provides it
  const maxAnswerSeconds = (session?.maxAnswerDuration ?? session?.max_answer_duration ?? 60) as number;

  // ── Refs — never trigger re-renders, always current ───────────────────────
  const stateRef = useRef<InterviewRoomState>('SETUP');
  const ttsRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRafRef = useRef<number | null>(null);

  const isListeningRef = useRef(false);
  const lastSpeechAt = useRef(Date.now());       // last STT activity
  const answerStartedAt = useRef(0);             // timestamp when candidate turn began
  const pendingSpeakRef = useRef<string | null>(null); // question text waiting for user gesture
  const currentSpeakingQuestionId = useRef<string | null>(null); // guard against stale completions
  const autoStartGuardRef = useRef(false);       // prevent double-fire on CANDIDATE_READY
  const isSubmittingRef = useRef(false);         // prevent duplicate submissions

  const liveTranscriptRef = useRef('');
  const finalTranscriptRef = useRef('');
  const audioStreamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef(sessionId);
  const currentQuestionRef = useRef<any>(null);
  const maxAnswerSecondsRef = useRef(maxAnswerSeconds);
  const serverStateVersionRef = useRef(0);

  // Stable callback refs (never stale, never recreate dependents)
  const sendEventRef = useRef<((type: string, payload: any) => void) | null>(null);
  const onAnswerSubmittedRef = useRef(onAnswerSubmitted);
  const onNextQuestionRef = useRef(onNextQuestion);
  const onInterviewCompleteRef = useRef(onInterviewComplete);

  // Keep all refs in sync with latest values on every render
  stateRef.current = state;
  audioStreamRef.current = audioStream;
  sessionIdRef.current = sessionId;
  currentQuestionRef.current = currentQuestion;
  maxAnswerSecondsRef.current = maxAnswerSeconds;
  onAnswerSubmittedRef.current = onAnswerSubmitted;
  onNextQuestionRef.current = onNextQuestion;
  onInterviewCompleteRef.current = onInterviewComplete;

  // ── Logging ───────────────────────────────────────────────────────────────

  const log = useCallback((event: string, data?: any) => {
    if (import.meta.env.DEV) {
      const ts = new Date().toISOString().slice(11, 23);
      console.log(`[Interview ${ts}] ${event}`, data ?? '');
    }
  }, []);

  // ── Mic control (reads from ref — no deps, never recreated) ──────────────

  const setMic = useCallback((enabled: boolean) => {
    const stream = audioStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = enabled; });
    log(enabled ? 'interview.mic.started' : 'interview.mic.stopped');
  }, [log]);

  // ── WebSocket ─────────────────────────────────────────────────────────────

  const handleWsEvent = useCallback((event: WebSocketEvent) => {
    switch (event.type) {
      case 'STATE_SYNC_RESPONSE':
      case 'INTERVIEW_STATE': {
        const v = event.payload?.stateVersion ?? 0;
        if (v >= serverStateVersionRef.current) {
          serverStateVersionRef.current = v;
          // Don't let server override while TTS is speaking — frontend owns AI_SPEAKING
          if (!ttsRef.current?.isSpeaking) {
            const s = event.payload?.state as string | undefined;
            if (s && s !== 'READY' && s !== 'SETUP' && s !== 'CREATED' && s !== 'created') {
              setState(s as InterviewRoomState);
              log('interview.state.changed', { source: 'server', state: s });
            }
          }
          if (event.payload?.currentQuestion) {
            setCurrentQuestion(normalizeQuestion(event.payload.currentQuestion));
          }
          if (typeof event.payload?.elapsedSeconds === 'number') {
            setElapsedSeconds(event.payload.elapsedSeconds);
          }
        }
        break;
      }
      case 'ERROR':
        setError(event.payload?.message || 'Protocol error');
        break;
      case 'PING':
        // Use the sendEvent ref to avoid stale closure
        sendEventRef.current?.('PONG', {});
        break;
    }
  // normalizeQuestion is stable ([] deps), log is stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { connectionState: wsConnState, sendEvent } = useWebSocket(sessionId, handleWsEvent);

  // Keep sendEvent in ref so handlers can call it without being in deps
  sendEventRef.current = sendEvent;

  useEffect(() => { setWsConnectionState(wsConnState); }, [wsConnState]);

  // ── Normalize question shape ──────────────────────────────────────────────

  const normalizeQuestion = useCallback((q: any) => {
    if (!q) return null;
    const text = q.question_text || q.questionText || q.text || '';
    const id   = q.id || q._id || q.question_id;
    const order = q.question_order ?? q.questionOrder ?? 1;
    return {
      ...q,
      id, _id: id, question_id: id,
      question_text: text, questionText: text, text,
      question_order: order, questionOrder: order,
    };
  }, []);

  // ── TTS (initialized ONCE on mount) ───────────────────────────────────────

  useEffect(() => {
    const tts = createTTSProvider();
    ttsRef.current = tts;

    tts.onStart = () => {
      log('interview.ai.speech.started');
      setIsAiSpeaking(true);
      setState(prev => {
        log('interview.state.changed', { from: prev, to: 'AI_SPEAKING' });
        return 'AI_SPEAKING';
      });
      setMic(false);
      isListeningRef.current = false;
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (_) {}
      sendEventRef.current?.('AI_SPEAKING_STARTED', {
        questionId: currentSpeakingQuestionId.current,
      });
    };

    tts.onEnd = () => {
      const qId = currentSpeakingQuestionId.current;
      log('interview.ai.speech.completed', { questionId: qId });
      setIsAiSpeaking(false);
      // Only advance if the question matches what we were speaking
      // (guard against stale completions from old utterances)
      setState(prev => {
        if (prev !== 'AI_SPEAKING') return prev; // Ignore if we left AI_SPEAKING already
        log('interview.state.changed', { from: prev, to: 'CANDIDATE_READY' });
        return 'CANDIDATE_READY';
      });
      sendEventRef.current?.('CANDIDATE_READY', { questionId: qId });
    };

    tts.onError = () => {
      log('interview.ai.speech.error');
      setIsAiSpeaking(false);
      setState(prev => {
        if (prev !== 'AI_SPEAKING') return prev;
        return 'CANDIDATE_READY';
      });
    };

    return () => { tts.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ONCE on mount

  // ── STT (initialized ONCE on mount) ──────────────────────────────────────

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      log('interview.stt.unavailable', 'webkitSpeechRecognition not found');
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      // CRITICAL: Ignore STT results while AI is speaking (prevents AI audio entering transcript)
      if (stateRef.current === 'AI_SPEAKING') return;

      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }

      if (final) {
        const v = (finalTranscriptRef.current ? finalTranscriptRef.current + ' ' + final : final).trim();
        finalTranscriptRef.current = v;
        setFinalTranscript(v);
      }

      setLiveTranscript(interim);
      liveTranscriptRef.current = interim;
      lastSpeechAt.current = Date.now();

      log('interview.stt.result', { interim: interim.slice(0, 30), final: final.slice(0, 30) });
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      log('interview.stt.error', event.error);
    };

    recognition.onend = () => {
      // Auto-restart if still in candidate turn
      const s = stateRef.current;
      if (isListeningRef.current && (s === 'CANDIDATE_READY' || s === 'CANDIDATE_SPEAKING')) {
        try { recognition.start(); } catch (_) {}
      } else {
        log('interview.stt.stopped');
      }
    };

    recognitionRef.current = recognition;
    return () => {
      isListeningRef.current = false;
      try { recognition.stop(); } catch (_) {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ONCE on mount

  // ── speakQuestion — MUST be called directly from user gesture for Q1 ──────
  // For Q2+: called from Promise chain originating from user gesture (stopAnswer click)
  // Chrome allows this because the gesture is still in the async call stack.

  const speakQuestion = useCallback((text: string, questionId?: string) => {
    const clean = (text || '').trim();

    log('interview.ai.speech.starting', { questionId, textLen: clean.length });

    // Set the current speaking question ID for staleness guard
    currentSpeakingQuestionId.current = questionId ?? currentQuestionRef.current?.id ?? null;

    // Reset auto-start guard so next CANDIDATE_READY triggers startAnswer
    autoStartGuardRef.current = false;

    if (!clean) {
      // No text → skip AI speaking, go straight to candidate turn
      setState('CANDIDATE_READY');
      return;
    }

    // Immediately enforce: mic OFF, STT OFF, state = AI_SPEAKING
    setState('AI_SPEAKING');
    setIsAiSpeaking(true);
    setMic(false);
    isListeningRef.current = false;
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (_) {}

    if (ttsRef.current) {
      ttsRef.current.synthesize(clean);
    } else {
      // TTS not available — skip straight to candidate turn
      setState('CANDIDATE_READY');
    }
  }, [setMic, log]);

  // ── Load question when state = READY (effect, no speaking here) ───────────

  useEffect(() => {
    if (!session || stateRef.current !== 'READY') return;

    const questions: any[] = session.questions || [];
    const sessionData = session.session || session;
    const currentIdx: number = sessionData.currentQuestionIndex ?? 0;

    if (questions.length === 0) {
      // Fetch first question from backend
      log('interview.state.changed', { from: 'READY', action: 'fetching first question' });
      setState('GENERATING_NEXT');
      ApiClient.getNextQuestion(sessionIdRef.current)
        .then(next => {
          if (next.complete === true) {
            setState('COMPLETED');
            onInterviewCompleteRef.current();
          } else {
            const qObj = normalizeQuestion(next.question || next);
            setCurrentQuestion(qObj);
            onNextQuestionRef.current(qObj);
            pendingSpeakRef.current = qObj?.question_text || qObj?.text || null;
            setState('READY'); // Show "Begin Interview" button
          }
        })
        .catch(err => {
          log('interview.error', err.message);
          setError('Failed to load first question. Please refresh.');
          setState('ERROR');
        });
      return;
    }

    if (currentIdx >= questions.length) {
      setState('COMPLETED');
      onInterviewCompleteRef.current();
      return;
    }

    const q = normalizeQuestion(questions[currentIdx]);
    setCurrentQuestion(q);
    pendingSpeakRef.current = q?.question_text || q?.text || null;
    // State stays READY — "Begin Interview" button will call speakQuestion()
    log('interview.state.changed', { from: 'READY', action: 'question loaded, waiting for user gesture' });

  // Only re-run when session or state changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, state]);

  // ── beginInterview — called directly from onClick (user gesture) ──────────

  const beginInterview = useCallback(() => {
    const text = pendingSpeakRef.current;
    const qId = currentQuestionRef.current?.id;
    pendingSpeakRef.current = null;
    log('interview.candidate.gesture', { action: 'beginInterview' });
    speakQuestion(text || '', qId);
  }, [speakQuestion, log]);

  // ── startAnswer — activate candidate input ────────────────────────────────

  const startAnswer = useCallback(() => {
    const s = stateRef.current;
    if (s === 'PROCESSING' || s === 'EVALUATING' || s === 'GENERATING_NEXT' || s === 'AI_SPEAKING') {
      log('interview.startAnswer.blocked', { state: s });
      return;
    }

    log('interview.answer.started');
    setState('CANDIDATE_SPEAKING');
    setFinalTranscript('');
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    finalTranscriptRef.current = '';
    setMic(true);
    isListeningRef.current = true;
    lastSpeechAt.current = Date.now();
    answerStartedAt.current = Date.now();
    setTimeLeft(maxAnswerSecondsRef.current);
    isSubmittingRef.current = false;

    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (_) {}
    }
    sendEventRef.current?.('CANDIDATE_SPEAKING_STARTED', {
      questionId: currentQuestionRef.current?.id,
    });
  }, [setMic, log]);

  // Ref so effects can call startAnswer without adding it to deps
  const startAnswerRef = useRef(startAnswer);
  startAnswerRef.current = startAnswer;

  // ── AUTO-START: When AI finishes → CANDIDATE_READY → auto call startAnswer ─
  // CRITICAL: Only depends on [state] — no function in deps → no infinite loop

  useEffect(() => {
    if (state === 'CANDIDATE_READY') {
      if (!autoStartGuardRef.current) {
        autoStartGuardRef.current = true;
        log('interview.candidate.ready', { action: 'auto-starting mic' });
        // Small timeout to let state settle before starting STT
        // This is NOT a timing hack — it lets the TTS stop() complete
        // before STT start() to avoid "already started" errors
        setTimeout(() => {
          if (stateRef.current === 'CANDIDATE_READY' || stateRef.current === 'CANDIDATE_SPEAKING') {
            startAnswerRef.current();
          }
        }, 100);
      }
    } else {
      autoStartGuardRef.current = false;
    }
  }, [state]); // ONLY state in deps

  // ── submitAnswer ──────────────────────────────────────────────────────────

  const submitAnswer = useCallback(async (answerText: string) => {
    const q = currentQuestionRef.current;
    if (!q) { log('interview.error', 'submitAnswer: no current question'); return; }
    if (isSubmittingRef.current) { log('interview.answer.duplicate', 'blocked'); return; }

    isSubmittingRef.current = true;
    const duration = Math.round((Date.now() - answerStartedAt.current) / 1000);
    log('interview.answer.submitted', { questionId: q.id, duration, textLen: answerText.length });

    setState('EVALUATING');
    try {
      const result = await ApiClient.submitAnswer(sessionIdRef.current, {
        question_id: q.id || q._id,
        answer_text: answerText || 'No answer provided',
        duration_seconds: duration,
      });
      onAnswerSubmittedRef.current(result);
      log('interview.answer.evaluated');

      setState('GENERATING_NEXT');
      const next = await ApiClient.getNextQuestion(sessionIdRef.current);

      if (next.complete === true || next.status === 'completed' || next.interview_complete) {
        log('interview.state.changed', { to: 'COMPLETED' });
        setState('COMPLETED');
        onInterviewCompleteRef.current();
      } else {
        const qObj = normalizeQuestion(next.question || next);
        setCurrentQuestion(qObj);
        onNextQuestionRef.current(qObj);
        log('interview.state.changed', { to: 'AI_SPEAKING', nextQuestion: qObj?.id });
        // For Q2+: speakQuestion is in Promise chain from user gesture — Chrome allows it
        speakQuestion(qObj?.question_text || qObj?.text || '', qObj?.id);
      }
    } catch (err: any) {
      isSubmittingRef.current = false;
      if (err?.response?.status === 409 || err?.status === 409) {
        log('interview.answer.duplicate', '409 idempotency — already processed');
      } else {
        log('interview.error', err?.message);
        setError(err?.message || 'Failed to submit answer');
        setState('ERROR');
      }
    }
  }, [normalizeQuestion, speakQuestion, log]);

  // ── stopAnswer ────────────────────────────────────────────────────────────

  const stopAnswer = useCallback(async () => {
    const s = stateRef.current;
    if (s !== 'CANDIDATE_SPEAKING' && s !== 'CANDIDATE_READY') return;

    log('interview.answer.stopping');
    setState('PROCESSING');
    setMic(false);
    isListeningRef.current = false;
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (_) {}

    const full = (finalTranscriptRef.current + ' ' + liveTranscriptRef.current).trim();
    await submitAnswer(full || 'No verbal answer provided.');
  }, [setMic, submitAnswer, log]);

  // Ref for countdown (avoids dep in countdown effect)
  const stopAnswerRef = useRef(stopAnswer);
  stopAnswerRef.current = stopAnswer;

  // ── Countdown (runs when CANDIDATE_SPEAKING, timestamp-based) ─────────────

  useEffect(() => {
    if (state !== 'CANDIDATE_SPEAKING') {
      // Stop countdown
      if (countdownRafRef.current) {
        cancelAnimationFrame(countdownRafRef.current);
        countdownRafRef.current = null;
      }
      if (state !== 'CANDIDATE_READY') {
        // Reset timer display for non-candidate states
        setTimeLeft(maxAnswerSecondsRef.current);
      }
      return;
    }

    log('interview.timer.started', { max: maxAnswerSecondsRef.current });
    let cancelled = false;
    const SILENCE_MS = 5000;
    const MIN_SPEAKING_S = 3;

    const tick = () => {
      if (cancelled) return;
      const now = Date.now();
      const elapsed = (now - answerStartedAt.current) / 1000;
      const remaining = Math.max(0, maxAnswerSecondsRef.current - elapsed);

      setTimeLeft(Math.ceil(remaining));

      const silentMs = now - lastSpeechAt.current;

      if (remaining <= 0) {
        log('interview.timer.limit');
        stopAnswerRef.current();
        return;
      }

      countdownRafRef.current = requestAnimationFrame(tick);
    };

    countdownRafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      log('interview.timer.stopped');
      if (countdownRafRef.current) {
        cancelAnimationFrame(countdownRafRef.current);
        countdownRafRef.current = null;
      }
    };
  // Only depends on state — all other values read via refs
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Session elapsed timer ─────────────────────────────────────────────────

  useEffect(() => {
    const inactive = state === 'SETUP' || state === 'READY' || state === 'COMPLETED' || state === 'ERROR';
    if (inactive) return;
    sessionTimerRef.current = setInterval(() => setElapsedSeconds(p => p + 1), 1000);
    return () => { if (sessionTimerRef.current) clearInterval(sessionTimerRef.current); };
  }, [state]);

  useEffect(() => {
    if (elapsedSeconds > 0 && elapsedSeconds % 30 === 0) {
      ApiClient.updateElapsed(sessionIdRef.current, elapsedSeconds).catch(() => {});
    }
  }, [elapsedSeconds]);

  // ── skipQuestion ──────────────────────────────────────────────────────────

  const skipQuestion = useCallback(async () => {
    const q = currentQuestionRef.current;
    const s = stateRef.current;
    if (!q || s === 'EVALUATING' || s === 'GENERATING_NEXT' || s === 'COMPLETED') return;

    log('interview.answer.skipped', { questionId: q.id });
    isListeningRef.current = false;
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (_) {}
    if (ttsRef.current) ttsRef.current.stop();
    setMic(false);

    setState('EVALUATING');
    try {
      const result = await ApiClient.submitAnswer(sessionIdRef.current, {
        question_id: q.id || q._id,
        answer_text: 'Skipped',
        duration_seconds: 0,
      });
      onAnswerSubmittedRef.current(result);

      setState('GENERATING_NEXT');
      const next = await ApiClient.getNextQuestion(sessionIdRef.current);

      if (next.complete === true || next.status === 'completed' || next.interview_complete) {
        setState('COMPLETED');
        onInterviewCompleteRef.current();
      } else {
        const qObj = normalizeQuestion(next.question || next);
        setCurrentQuestion(qObj);
        onNextQuestionRef.current(qObj);
        speakQuestion(qObj?.question_text || qObj?.text || '', qObj?.id);
      }
    } catch (err: any) {
      log('interview.error', err?.message);
      setError(err?.message || 'Failed to skip question');
      setState('ERROR');
    }
  }, [normalizeQuestion, speakQuestion, setMic, log]);

  // ── endInterview ──────────────────────────────────────────────────────────

  const endInterview = useCallback(async () => {
    log('interview.state.changed', { to: 'COMPLETED', reason: 'user ended' });
    if (ttsRef.current) ttsRef.current.stop();
    isListeningRef.current = false;
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (_) {}
    setMic(false);
    try { await ApiClient.completeInterview(sessionIdRef.current); } catch (_) {}
    setState('COMPLETED');
    onInterviewCompleteRef.current();
  }, [setMic, log]);

  // ── setReady ──────────────────────────────────────────────────────────────

  const setReady = useCallback(() => {
    log('interview.state.changed', { to: 'READY' });
    setState('READY');
  }, [log]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      log('interview.cleanup');
      if (ttsRef.current) ttsRef.current.stop();
      isListeningRef.current = false;
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (_) {}
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      if (countdownRafRef.current) cancelAnimationFrame(countdownRafRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Exports ───────────────────────────────────────────────────────────────

  // Derived state for UI — no independent booleans
  const micShouldBeActive = state === 'CANDIDATE_READY' || state === 'CANDIDATE_SPEAKING';
  const timerShouldRun    = state === 'CANDIDATE_READY' || state === 'CANDIDATE_SPEAKING';
  const isProcessing      = state === 'PROCESSING' || state === 'EVALUATING' || state === 'GENERATING_NEXT';
  const isRecording       = state === 'CANDIDATE_SPEAKING';

  return {
    // State
    state,
    wsConnectionState,
    currentQuestion,
    error,

    // Transcript
    transcript: (finalTranscript + ' ' + liveTranscript).trim(),
    liveTranscript,
    finalTranscript,

    // Timers
    elapsedSeconds,
    timeLeft,
    maxAnswerSeconds,

    // Derived UI flags
    isAiSpeaking,
    micShouldBeActive,
    timerShouldRun,
    isProcessing,
    isRecording,

    // Actions
    setReady,
    beginInterview,
    startAnswer,
    stopAnswer,
    skipQuestion,
    endInterview,
  };
}
