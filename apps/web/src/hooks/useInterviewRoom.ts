import { useState, useEffect, useRef, useCallback } from "react";
import { createTTSProvider } from "@/services/TTSProvider";
import { useWebSocket, WebSocketEvent } from "@/hooks/useWebSocket";
import { ApiClient } from "@/lib/api";

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

export function useInterviewRoom({
  sessionId,
  session,
  audioStream,
  onAnswerSubmitted,
  onNextQuestion,
  onInterviewComplete
}: UseInterviewRoomProps) {
  const [state, setState] = useState<InterviewRoomState>('SETUP');
  const [serverStateVersion, setServerStateVersion] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
  
  // Real transcript vs final
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(60); 
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ttsRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const stateRef = useRef<InterviewRoomState>(state);
  stateRef.current = state;
  const isListeningRef = useRef<boolean>(false);

  const lastActiveTime = useRef<number>(Date.now());
  const speakingStartTime = useRef<number>(0);
  const silenceDetectorRef = useRef<number | null>(null);

  const SILENCE_THRESHOLD_MS = 5000;
  const MIN_SPEAKING_MS = 3000;
  
  const muteMic = useCallback((muted: boolean) => {
    if (audioStream) {
      audioStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }, [audioStream]);

  // WebSocket
  const handleWsEvent = useCallback((event: WebSocketEvent) => {
    switch (event.type) {
      case "STATE_SYNC_RESPONSE":
        if (event.payload?.stateVersion > serverStateVersion) {
          setServerStateVersion(event.payload.stateVersion);
          setState(event.payload.state as InterviewRoomState);
          if (event.payload.currentQuestion) {
            setCurrentQuestion(event.payload.currentQuestion);
          }
          if (event.payload.elapsedSeconds) {
            setElapsedSeconds(event.payload.elapsedSeconds);
          }
        }
        break;
      case "INTERVIEW_STATE":
        if (event.payload?.stateVersion >= serverStateVersion) {
          setServerStateVersion(event.payload.stateVersion);
          setState(event.payload.state as InterviewRoomState);
        }
        break;
      case "ERROR":
        setError(event.payload?.message || "Protocol error");
        break;
      case "PING":
        sendEvent("PONG", {});
        break;
    }
  }, [serverStateVersion]);

  const { connectionState, sendEvent } = useWebSocket(sessionId, handleWsEvent);

  // Initialize TTS
  useEffect(() => {
    ttsRef.current = createTTSProvider();
    
    ttsRef.current.onStart = () => {
      setIsAiSpeaking(true);
      // Let backend control state, but update local mic safely
      muteMic(true);
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
    
    ttsRef.current.onEnd = () => {
      setIsAiSpeaking(false);
      muteMic(false);
      sendEvent("CANDIDATE_READY", {});
    };

    ttsRef.current.onError = () => {
      // Degrade gracefully
      setIsAiSpeaking(false);
      muteMic(false);
      sendEvent("CANDIDATE_READY", {});
    }
    
    return () => {
      if (ttsRef.current) ttsRef.current.stop();
    };
  }, [muteMic, sendEvent]);

  // Initialize Speech Recognition ONCE on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          let interim = "";
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (final) {
            setFinalTranscript(prev => (prev ? prev + " " + final : final).trim());
          }
          setTranscript(interim);
          
          lastActiveTime.current = Date.now();
          if (stateRef.current === 'CANDIDATE_READY' || stateRef.current === 'READY') {
            sendEvent("CANDIDATE_SPEAKING_STARTED", {});
            speakingStartTime.current = Date.now();
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error === 'no-speech' || event.error === 'aborted') return;
        };

        recognition.onend = () => {
          // Re-listen if candidate is still actively answering
          if (isListeningRef.current && (stateRef.current === 'CANDIDATE_READY' || stateRef.current === 'CANDIDATE_SPEAKING')) {
            try {
              recognition.start();
            } catch (e) {}
          }
        };
        
        recognitionRef.current = recognition;

        return () => {
          try {
            recognition.stop();
          } catch (e) {}
        };
      }
    }
  }, [sendEvent]);

  const speakQuestion = useCallback((text: string) => {
    if (ttsRef.current) {
      ttsRef.current.synthesize(text);
    }
  }, []);

  const submitAnswer = useCallback(async (text: string) => {
    if (!currentQuestion) return;
    
    setState('EVALUATING');
    try {
      const result = await ApiClient.submitAnswer(sessionId, {
        question_id: currentQuestion.id || currentQuestion._id,
        answer_text: text || "No answer provided",
        duration_seconds: Math.round((Date.now() - speakingStartTime.current) / 1000)
      });
      
      onAnswerSubmitted(result);
      
      setState('GENERATING_NEXT');
      const nextQuestion = await ApiClient.getNextQuestion(sessionId);
      
      if (nextQuestion.complete === true || nextQuestion.status === 'completed' || nextQuestion.interview_complete) {
        setState('COMPLETED');
        onInterviewComplete();
      } else {
        const qObj = nextQuestion.question || nextQuestion;
        setCurrentQuestion(qObj);
        onNextQuestion(qObj);
        speakQuestion(qObj.question_text || qObj.text || qObj.questionText);
      }
    } catch (err: any) {
      // Idempotency: HTTP 409 means double submission but processed fine on other thread
      if (err.response?.status === 409) {
        console.warn("Idempotency blocked duplicate submit, advancing gracefully.");
        // Treat as success to keep UI fluid if needed, or rely on state sync
      } else {
        console.error(err);
        setError(err.message || "Failed to submit answer");
        setState('ERROR');
      }
    }
  }, [currentQuestion, sessionId, onAnswerSubmitted, onNextQuestion, onInterviewComplete, speakQuestion]);

  const stopAnswer = useCallback(async () => {
    if (stateRef.current === 'CANDIDATE_SPEAKING' || stateRef.current === 'CANDIDATE_READY') {
      setState('PROCESSING');
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      
      const fullAnswer = (finalTranscript + " " + transcript).trim();
      await submitAnswer(fullAnswer || "No verbal answer provided.");
    }
  }, [finalTranscript, transcript, submitAnswer]);

  // Silence Detection
  useEffect(() => {
    if (state === 'CANDIDATE_SPEAKING') {
      const checkSilence = () => {
        const now = Date.now();
        const duration = now - speakingStartTime.current;
        const idleTime = now - lastActiveTime.current;
        
        if (duration > MIN_SPEAKING_MS && idleTime > SILENCE_THRESHOLD_MS) {
          stopAnswer();
        } else {
          silenceDetectorRef.current = requestAnimationFrame(checkSilence);
        }
      };
      
      silenceDetectorRef.current = requestAnimationFrame(checkSilence);
    }
    
    return () => {
      if (silenceDetectorRef.current) cancelAnimationFrame(silenceDetectorRef.current);
    };
  }, [state, stopAnswer]);

  // Session timer
  useEffect(() => {
    if (state !== 'SETUP' && state !== 'COMPLETED' && state !== 'ERROR') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  // Per-question timer
  useEffect(() => {
    if (state === 'CANDIDATE_READY' || state === 'CANDIDATE_SPEAKING') {
      if (state === 'CANDIDATE_READY') setQuestionTimeLeft(60);
      
      questionTimerRef.current = setInterval(() => {
        setQuestionTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(questionTimerRef.current!);
            setTimeout(() => stopAnswer(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    }
    
    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [state, stopAnswer]);

  // Sync elapsed timer
  useEffect(() => {
    if (elapsedSeconds > 0 && elapsedSeconds % 30 === 0) {
      ApiClient.updateElapsed(sessionId, elapsedSeconds).catch(() => {});
    }
  }, [elapsedSeconds, sessionId]);

  const startAnswer = useCallback(() => {
    if (stateRef.current === 'CANDIDATE_READY' || stateRef.current === 'READY') {
      try {
        setFinalTranscript("");
        setTranscript("");
        isListeningRef.current = true;
        if (recognitionRef.current) {
          try { recognitionRef.current.start(); } catch(e){}
        }
        sendEvent("CANDIDATE_SPEAKING_STARTED", {});
        speakingStartTime.current = Date.now();
        lastActiveTime.current = Date.now();
      } catch (err) {}
    }
  }, [sendEvent]);

  const skipQuestion = useCallback(async () => {
    if (!currentQuestion || stateRef.current === 'EVALUATING' || stateRef.current === 'GENERATING_NEXT') return;
    
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
    }
    if (ttsRef.current) ttsRef.current.stop();

    setState('EVALUATING');
    try {
      const result = await ApiClient.submitAnswer(sessionId, {
        question_id: currentQuestion.id || currentQuestion._id,
        answer_text: "Skipped",
        duration_seconds: 0
      });
      onAnswerSubmitted(result);

      setState('GENERATING_NEXT');
      const nextQuestion = await ApiClient.getNextQuestion(sessionId);
      if (nextQuestion.complete === true || nextQuestion.status === 'completed' || nextQuestion.interview_complete) {
        setState('COMPLETED');
        onInterviewComplete();
      } else {
        const qObj = nextQuestion.question || nextQuestion;
        setCurrentQuestion(qObj);
        onNextQuestion(qObj);
        speakQuestion(qObj.question_text || qObj.text || qObj.questionText);
      }
    } catch (err: any) {
      setError(err.message || "Failed to skip question");
      setState('ERROR');
    }
  }, [currentQuestion, sessionId, onAnswerSubmitted, onNextQuestion, onInterviewComplete, speakQuestion]);

  const endInterview = async () => {
    try {
      if (ttsRef.current) ttsRef.current.stop();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e){}
      }
      
      await ApiClient.completeInterview(sessionId);
      setState('COMPLETED');
      onInterviewComplete();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!session || state !== 'READY') return;

    const questions: any[] = session.questions || [];
    const sessionData = session.session || session;
    const currentIdx: number = sessionData.currentQuestionIndex ?? 0;

    if (questions.length === 0) {
      setState('GENERATING_NEXT');
      ApiClient.getNextQuestion(sessionId).then(next => {
        if (next.complete === true) {
          setState('COMPLETED');
          onInterviewComplete();
        } else {
          const qObj = next.question || next;
          setCurrentQuestion(qObj);
          onNextQuestion(qObj);
          speakQuestion(qObj.question_text || qObj.questionText || qObj.text);
        }
      }).catch(() => {
        setError("Failed to load first question. Please refresh.");
        setState('ERROR');
      });
      return;
    }

    if (currentIdx >= questions.length) {
      setState('COMPLETED');
      onInterviewComplete();
      return;
    }

    const q = questions[currentIdx];
    setCurrentQuestion(q);
    speakQuestion(q.question_text || q.questionText || q.text);
  }, [session, state, sessionId, speakQuestion, onInterviewComplete, onNextQuestion]);

  const setReady = useCallback(() => {
    setState('READY');
  }, []);

  return {
    state,
    connectionState,
    setReady,
    currentQuestion,
    transcript: (finalTranscript + " " + transcript).trim(),
    elapsedSeconds,
    questionTimeLeft,
    isAiSpeaking,
    error,
    speakQuestion,
    startAnswer,
    stopAnswer,
    skipQuestion,
    endInterview
  };
}
