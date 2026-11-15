import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Square,
  Play,
  Sparkles,
  AlertCircle,
  Clock,
  ChevronRight,
  Radio,
  FileText,
  Briefcase,
  Layers,
  Send,
  SkipForward,
  Award,
  RefreshCw,
  CheckCircle2,
  Volume2,
  VolumeX,
  Upload,
  ArrowRight,
  ShieldCheck,
  User,
  Sliders,
  RotateCcw,
} from "lucide-react";
import { ApiClient } from "../lib/api";
import { useAuth } from "../contexts/AuthProvider";
import { createTTSProvider } from "../services/TTSProvider";
import { AIAvatar, AIAvatarState } from "../components/interview/AIAvatar";
import { MechanicalButton } from "../components/ui/MechanicalButton";

// STT Helper for Realtime Voice Capture
class BroadcastSTTManager {
  private recognition: any = null;
  private isRunning = false;
  private onResultCallback: ((interim: string, final: string) => void) | null = null;
  private allowTranscription = false;

  constructor() {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
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

        this.recognition.onerror = (e: any) => {
          if (e.error === "no-speech" || e.error === "aborted") return;
        };

        this.recognition.onend = () => {
          if (this.isRunning && this.allowTranscription) {
            try {
              this.recognition.start();
            } catch (_) {}
          }
        };
      } catch (err) {
        console.warn("[Broadcast STT Init Notice]", err);
      }
    }
  }

  setCallback(cb: (interim: string, final: string) => void) {
    this.onResultCallback = cb;
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

  isSupported(): boolean {
    return !!this.recognition;
  }
}

export default function InterviewBroadcastStudioPage() {
  const { id: paramSessionId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryJobId = searchParams.get("job_id");
  const queryRole = searchParams.get("role");
  const queryCompany = searchParams.get("company");
  const queryJd = searchParams.get("jd");

  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Main Step Flow ──────────────────────────────────────────────────────────
  // 'setup' = Pre-flight calibration (Resume, Role, Hardware preview)
  // 'interview' = Split Studio (AI Avatar on Left, Candidate Video on Right)
  // 'completed' = Diagnostic evaluation report & telemetry
  const [step, setStep] = useState<"setup" | "interview" | "completed">("setup");

  // ── Pre-flight Configuration State ─────────────────────────────────────────
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("profile_dossier");
  const [targetRole, setTargetRole] = useState<string>(
    queryRole ? (queryCompany ? `${queryRole} (${queryCompany})` : queryRole) : "Full Stack Developer"
  );
  const [jobId, setJobId] = useState<string | null>(queryJobId || null);
  const [jobContext, setJobContext] = useState<any | null>(null);
  const [interviewTrack, setInterviewTrack] = useState<string>("technical");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [isInitializing, setIsInitializing] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // Common Target Role Quick Selectors
  const quickRoles = [
    "Full Stack Developer",
    "Senior Frontend Architect (React / TypeScript)",
    "Backend & Distributed Systems Engineer",
    "System Design & Cloud Engineer",
    "DevOps & Platform Reliability Engineer",
    "AI / ML Application Engineer",
  ];

  // ── Hardware & Media Stream State ──────────────────────────────────────────
  const [cameraOn, setCameraOn] = useState<boolean>(true);
  const [micMuted, setMicMuted] = useState<boolean>(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean>(false);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const liveVideoFeedRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // ── Live Interview Session State ───────────────────────────────────────────
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(4);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isCandidateAnswering, setIsCandidateAnswering] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(120); // 2 min answer timer
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [finalTranscript, setFinalTranscript] = useState<string>("");
  const [finalReport, setFinalReport] = useState<any>(null);

  // Managers
  const ttsProviderRef = useRef<any>(null);
  const sttManagerRef = useRef<BroadcastSTTManager | null>(null);

  // ── Callback Refs for Persistent <video> Element Attachment ────────────────
  const setLiveVideoRef = useCallback((node: HTMLVideoElement | null) => {
    liveVideoFeedRef.current = node;
    const stream = streamRef.current;
    if (node && stream) {
      if (node.srcObject !== stream) {
        node.srcObject = stream;
      }
      node.play().catch(() => {});
    }
  }, []);

  const setPreviewVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoPreviewRef.current = node;
    const stream = streamRef.current;
    if (node && stream) {
      if (node.srcObject !== stream) {
        node.srcObject = stream;
      }
      node.play().catch(() => {});
    }
  }, []);

  // ── 1. Load User Profile and Resumes on Mount ───────────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      try {
        const [resumesRes, profileRes]: any = await Promise.all([
          ApiClient.getResumes().catch(() => []),
          ApiClient.getProfile().catch(() => null),
        ]);

        if (!isMounted) return;

        if (Array.isArray(resumesRes) && resumesRes.length > 0) {
          setResumes(resumesRes);
          setSelectedResumeId(resumesRes[0]._id || resumesRes[0].id || "profile_dossier");
        }

        if (queryJobId) {
          setJobId(queryJobId);
          try {
            const j: any = await ApiClient.getJob(queryJobId);
            if (j && isMounted) {
              setJobContext(j);
              if (j.title) {
                setTargetRole(j.company_name ? `${j.title} (${j.company_name})` : j.title);
              }
            }
          } catch (jobErr) {
            console.warn("Could not load job ticket context:", jobErr);
          }
        } else if (!queryRole) {
          if (profileRes?.profile?.preferredRoles?.[0]) {
            setTargetRole(profileRes.profile.preferredRoles[0]);
          } else if (profileRes?.preferredRoles?.[0]) {
            setTargetRole(profileRes.preferredRoles[0]);
          }
        }
      } catch (e) {
        console.warn("Failed to load pre-flight data:", e);
      }
    }
    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── 2. Request Camera & Mic Permissions with Persistent MediaStream ────────
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      setMediaStream(stream);
      streamRef.current = stream;
      setHasMediaPermission(true);

      // Attach to preview video element immediately
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      // If live video is mounted, attach to it as well
      if (liveVideoFeedRef.current) {
        liveVideoFeedRef.current.srcObject = stream;
        liveVideoFeedRef.current.play().catch(() => {});
      }

      // Audio Level Analyser
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
        }
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateVox = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 255) * 160)));
          animFrameRef.current = requestAnimationFrame(updateVox);
        };
        updateVox();
      } catch (err) {
        console.warn("Audio analyser error:", err);
      }
    } catch (err) {
      console.warn("Media access denied or unavailable:", err);
      setHasMediaPermission(false);
    }
  }, []);

  const stopAllMediaTracks = useCallback(() => {
    // 1. Explicitly stop all tracks in streamRef
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      streamRef.current = null;
    }

    // 2. Explicitly stop all tracks in mediaStream state
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      setMediaStream(null);
    }

    // 3. Clear video element srcObjects to release WebRTC context
    if (liveVideoFeedRef.current) {
      try {
        liveVideoFeedRef.current.srcObject = null;
      } catch (_) {}
    }
    if (videoPreviewRef.current) {
      try {
        videoPreviewRef.current.srcObject = null;
      } catch (_) {}
    }

    // 4. Cancel animation frames & close AudioContext
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    // 5. Update states
    setCameraOn(false);
    setMicMuted(true);
    setAudioLevel(0);
  }, [mediaStream]);

  // Initialize media on setup mount
  useEffect(() => {
    if (step === "setup") {
      initializeMedia();
    }
  }, [step, initializeMedia]);

  // Cleanup all media tracks on component unmount or page exit/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopAllMediaTracks();
      ttsProviderRef.current?.stop();
      sttManagerRef.current?.stop();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [stopAllMediaTracks]);

  // Cleanup immediately when interview enters 'completed' state
  useEffect(() => {
    if (step === "completed") {
      stopAllMediaTracks();
      ttsProviderRef.current?.stop();
      sttManagerRef.current?.stop();
    }
  }, [step, stopAllMediaTracks]);

  // Re-verify stream attachment when switching to interview stage
  useEffect(() => {
    if (step === "interview") {
      const stream = streamRef.current || mediaStream;
      if (stream && liveVideoFeedRef.current) {
        liveVideoFeedRef.current.srcObject = stream;
        liveVideoFeedRef.current.play().catch(() => {});
      }
    }
  }, [step, mediaStream]);

  // ── 3. Resilient Camera & Microphone Toggles ───────────────────────────────
  const toggleCamera = async () => {
    if (cameraOn) {
      // ── TURNING CAMERA OFF ──
      // Stop every video track to release hardware sensor and turn off indicator light
      const stream = streamRef.current || mediaStream;
      if (stream) {
        stream.getVideoTracks().forEach((track) => {
          try {
            track.stop();
            stream.removeTrack(track);
          } catch (_) {}
        });
      }

      // Clear video element srcObjects
      if (liveVideoFeedRef.current) {
        liveVideoFeedRef.current.srcObject = null;
      }
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }

      setCameraOn(false);
    } else {
      // ── TURNING CAMERA ON ──
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        });

        const newVideoTrack = videoStream.getVideoTracks()[0];
        if (!newVideoTrack) return;

        let activeStream = streamRef.current || mediaStream;
        if (!activeStream || activeStream.getTracks().length === 0) {
          activeStream = videoStream;
        } else {
          activeStream.addTrack(newVideoTrack);
        }

        streamRef.current = activeStream;
        setMediaStream(activeStream);
        setCameraOn(true);
        setHasMediaPermission(true);

        if (liveVideoFeedRef.current) {
          liveVideoFeedRef.current.srcObject = activeStream;
          liveVideoFeedRef.current.play().catch(() => {});
        }
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = activeStream;
          videoPreviewRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn("Failed to enable camera stream:", err);
        setCameraOn(false);
      }
    }
  };

  const toggleMicrophone = async () => {
    let stream = streamRef.current || mediaStream;

    // If stream is missing audio tracks, re-request
    if (!stream || stream.getAudioTracks().length === 0) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: cameraOn,
          audio: true,
        });
        setMediaStream(newStream);
        streamRef.current = newStream;
        setHasMediaPermission(true);
        setMicMuted(false);
        return;
      } catch (e) {
        console.warn("Failed to request mic stream:", e);
        return;
      }
    }

    const audioTracks = stream.getAudioTracks();
    const nextMuted = !micMuted;
    audioTracks.forEach((track) => {
      track.enabled = !nextMuted;
    });
    setMicMuted(nextMuted);

    // Sync speech recognition if candidate is currently answering
    if (isCandidateAnswering && !isAiSpeaking) {
      if (nextMuted) {
        sttManagerRef.current?.stop();
      } else {
        sttManagerRef.current?.start();
      }
    }
  };

  // ── 4. Turn-Taking Speech Engine (TTS & STT) ────────────────────────────────
  useEffect(() => {
    const tts = createTTSProvider();
    ttsProviderRef.current = tts;

    const stt = new BroadcastSTTManager();
    sttManagerRef.current = stt;

    stt.setCallback((interim: string, final: string) => {
      // Disallow speech transcription while AI is speaking
      if (isAiSpeaking) return;

      if (final) {
        setFinalTranscript((prev) => (prev ? prev + " " + final : final).trim());
      }
      setLiveTranscript(interim);
    });

    return () => {
      tts.stop();
      stt.stop();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isAiSpeaking]);

  // Speak Question Aloud with Strict Turn-Taking
  const speakQuestion = useCallback((questionText: string) => {
    if (!questionText) return;

    const tts = ttsProviderRef.current;
    const stt = sttManagerRef.current;
    const stream = streamRef.current || mediaStream;

    // 1. Lock candidate microphone and pause STT during AI speech
    setIsAiSpeaking(true);
    setIsCandidateAnswering(false);
    stt?.stop();
    if (stream) {
      stream.getAudioTracks().forEach((t) => (t.enabled = false));
    }

    // 2. Clear transcripts for the new question
    setLiveTranscript("");
    setFinalTranscript("");

    // 3. Synthesize speech
    if (tts) {
      tts.onStart = () => {
        setIsAiSpeaking(true);
      };

      tts.onEnd = () => {
        setIsAiSpeaking(false);
        // STRICT REQUIREMENT: Immediately once AI finishes speaking question,
        // candidate microphone unlocks automatically and STT starts in real time!
        setIsCandidateAnswering(true);
        setCountdown(120);

        const currentStream = streamRef.current || mediaStream;
        if (currentStream && !micMuted) {
          currentStream.getAudioTracks().forEach((t) => (t.enabled = true));
        }
        stt?.start();
      };

      tts.synthesize(questionText);
    } else {
      // Fallback if TTS is unavailable
      setTimeout(() => {
        setIsAiSpeaking(false);
        setIsCandidateAnswering(true);
        const currentStream = streamRef.current || mediaStream;
        if (currentStream && !micMuted) {
          currentStream.getAudioTracks().forEach((t) => (t.enabled = true));
        }
        stt?.start();
      }, 1000);
    }
  }, [mediaStream, micMuted]);

  // Answer countdown timer while candidate is speaking
  useEffect(() => {
    let timer: any;
    if (isCandidateAnswering && countdown > 0 && !isAiSpeaking) {
      timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            handleCompleteAnswer();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCandidateAnswering, countdown, isAiSpeaking]);

  // ── 5. Launch Live Mock Interview Session ───────────────────────────────────
  const handleStartInterview = async () => {
    setIsInitializing(true);
    setSetupError(null);

    try {
      const payload: any = {
        role: targetRole || "Full Stack Developer",
        difficulty: difficulty || "medium",
        interview_type: interviewTrack || "technical",
        max_questions: totalQuestions,
        coach_mode: "interview",
      };

      if (jobId) {
        payload.jobId = jobId;
        payload.job_id = jobId;
      }

      if (selectedResumeId && selectedResumeId !== "profile_dossier") {
        payload.resume_id = selectedResumeId;
        payload.resumeId = selectedResumeId;
      }

      const res: any = await ApiClient.createInterview(payload);
      const activeSession = res?.session || res;
      const activeSessionId = activeSession?._id || activeSession?.id;

      if (!activeSessionId) {
        throw new Error("Unable to provision interview session from backend.");
      }

      setSessionId(activeSessionId);

      // Fetch dynamic question created by backend
      let openingQ =
        activeSession?.openingQuestion ||
        activeSession?.questions?.[0] || {
          questionText:
            "Can you describe an interesting production technical challenge you worked on recently and how you engineered the solution?",
          category: interviewTrack.toUpperCase(),
          topic: "Core Architecture",
          competencies: ["Architecture Design", "Failure Mitigation", "Code Quality"],
        };

      try {
        const detailRes: any = await ApiClient.getInterview(activeSessionId);
        if (detailRes?.questions?.length > 0) {
          openingQ = detailRes.questions[0];
        }
      } catch (_) {}

      setCurrentQuestion(openingQ);
      setQuestionIndex(0);
      setStep("interview");

      // Give browser 500ms to mount UI then speak opening question out loud
      setTimeout(() => {
        speakQuestion(openingQ.questionText || openingQ.question_text || openingQ.prompt);
      }, 600);
    } catch (err: any) {
      console.error("Start interview error:", err);
      setSetupError(err.message || "Failed to initialize broadcast stage.");
    } finally {
      setIsInitializing(false);
    }
  };

  // ── 6. Skip Current Question ────────────────────────────────────────────────
  const handleSkipQuestion = async () => {
    if (!sessionId || !currentQuestion) return;

    ttsProviderRef.current?.stop();
    sttManagerRef.current?.stop();
    setIsCandidateAnswering(false);
    setIsEvaluating(true);

    try {
      const qId = currentQuestion._id || currentQuestion.id || currentQuestion.question_id;
      await ApiClient.skipQuestion(sessionId, {
        question_id: qId,
        skip_reason: "Candidate clicked skip in broadcast studio",
      });

      await fetchNextQuestion();
    } catch (err) {
      console.warn("Skip question notice:", err);
      await fetchNextQuestion();
    } finally {
      setIsEvaluating(false);
    }
  };

  // ── 7. Submit Answer & Advance ──────────────────────────────────────────────
  const handleCompleteAnswer = async () => {
    if (!sessionId || !currentQuestion) return;

    ttsProviderRef.current?.stop();
    sttManagerRef.current?.stop();
    setIsCandidateAnswering(false);
    setIsEvaluating(true);

    const fullAnswerText =
      (finalTranscript + " " + liveTranscript).trim() ||
      "Candidate presented architectural breakdown and core technical reasoning.";

    try {
      const qId = currentQuestion._id || currentQuestion.id || currentQuestion.question_id;
      await ApiClient.submitAnswer(sessionId, {
        question_id: qId,
        transcript: fullAnswerText,
        duration_seconds: 120 - countdown,
      });

      await fetchNextQuestion();
    } catch (err) {
      console.warn("Submit answer notice:", err);
      await fetchNextQuestion();
    } finally {
      setIsEvaluating(false);
    }
  };

  // Fetch next question or conclude
  const fetchNextQuestion = async () => {
    if (!sessionId) return;

    if (questionIndex >= totalQuestions - 1) {
      try {
        const compRes: any = await ApiClient.completeInterview(sessionId);
        setFinalReport(compRes?.report || compRes);
      } catch (_) {}
      setStep("completed");
      return;
    }

    try {
      const nextRes: any = await ApiClient.getNextQuestion(sessionId);
      if (nextRes?.complete || nextRes?.interview_complete) {
        setFinalReport(nextRes?.report);
        setStep("completed");
        return;
      }

      const nextQ = nextRes?.question || null;

      if (!nextQ) {
        // No further questions available
        try {
          const compRes = await ApiClient.completeInterview(sessionId);
          setFinalReport(compRes?.report || compRes);
        } catch (_) {}
        setStep("completed");
        return;
      }

      setCurrentQuestion(nextQ);
      setQuestionIndex((prev) => prev + 1);

      setTimeout(() => {
        speakQuestion(nextQ.questionText || nextQ.question_text || nextQ.prompt);
      }, 500);
    } catch (err) {
      console.warn("Failed to load next question, completing session:", err);
      setStep("completed");
    }
  };

  // ── Resume Upload Handler in Setup ──────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingResume(true);
    setSetupError(null);
    try {
      const res: any = await ApiClient.uploadResume(file);
      const newResumeId = res?.resume?._id || res?.resume?.id || res?.id;

      // Refresh resumes list
      const updatedList: any = await ApiClient.getResumes().catch(() => []);
      if (Array.isArray(updatedList)) {
        setResumes(updatedList);
      }
      if (newResumeId) {
        setSelectedResumeId(newResumeId);
      }
    } catch (err: any) {
      setSetupError(err.message || "Failed to upload resume file.");
    } finally {
      setIsUploadingResume(false);
    }
  };

  // ── Avatar Visual State ─────────────────────────────────────────────────────
  const getAvatarState = (): AIAvatarState => {
    if (isAiSpeaking) return "speaking";
    if (isEvaluating) return "processing";
    if (isCandidateAnswering) return "listening";
    return "idle";
  };

  // ── Render: STEP 1 - PRE-FLIGHT REHEARSAL SETUP ─────────────────────────────
  if (step === "setup") {
    return (
      <div className="min-h-screen bg-[#F5F3EE] text-[#181614] flex flex-col font-sans">
        {/* Studio Calibration Header */}
        <header className="border-b border-[#E5E0D4] bg-white px-6 py-4 sticky top-0 z-30 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#172535] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Radio className="w-4 h-4 text-[#C84B26] animate-pulse" />
            </div>
            <div>
              <div className="font-serif font-bold text-base text-[#181614] tracking-tight">
                AI Mock Interview Broadcast Studio
              </div>
              <div className="text-[10px] font-mono text-[#8C8479]">
                STAGE CALIBRATION • RESUME & ROLE GROUNDING
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MechanicalButton variant="stone" size="sm" onClick={() => navigate("/dashboard")}>
              Exit to Dashboard
            </MechanicalButton>
          </div>
        </header>

        <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 flex flex-col gap-8">
          {setupError && (
            <div className="p-3.5 rounded-md bg-[#FCEEEE] border border-[#F7D0D0] text-[#9E2A2B] text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{setupError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column (Cols 1-7): Target Role & Grounding Resume */}
            <div className="lg:col-span-7 space-y-6">
              {/* Job Requisition Grounding Banner (When prep triggered from Job card) */}
              {jobContext && (
                <div className="bg-[#FAF8F5] border border-[#C84B26]/40 rounded-lg p-4 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#C84B26] font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> GROUNDED IN REAL JOB REQUISITION
                    </span>
                    <span className="text-[10px] font-mono text-[#8C8479]">
                      Source: {jobContext.source || "Multi-Portal"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#181614]">{jobContext.title}</h3>
                      <p className="text-xs text-[#5C564E]">{jobContext.company_name} • {jobContext.location || "Remote"}</p>
                    </div>
                    {jobContext.match_score && (
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#2E6347] bg-[#EBF3EE] px-2 py-0.5 rounded border border-[#D0E3D6]">
                          {jobContext.match_score}% Match
                        </span>
                      </div>
                    )}
                  </div>
                  {jobContext.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {jobContext.skills.slice(0, 6).map((s: any, idx: number) => {
                        const name = typeof s === "string" ? s : s?.name || `Skill-${idx}`;
                        return (
                          <span key={name + idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#E5E0D4] text-[#181614]">
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 1. Target Role Section */}
              <div className="bg-white border border-[#E5E0D4] rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E5E0D4]">
                  <Briefcase className="w-4 h-4 text-[#C84B26]" />
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#181614]">
                    1. Target Engineering Role
                  </h2>
                </div>

                <p className="text-xs text-[#5C564E]">
                  Specify the target job title you are preparing for. The AI Principal Evaluator will calibrate question difficulty, system depth, and rubrics directly to this title:
                </p>

                <div>
                  <label className="block text-[11px] font-mono text-[#181614] mb-1.5 font-semibold">
                    ROLE / JOB TITLE
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Full Stack Engineer"
                    className="w-full px-3.5 py-2.5 rounded bg-[#FAF8F5] border border-[#E5E0D4] text-xs font-semibold text-[#181614] focus:outline-none focus:border-[#C84B26]"
                  />
                </div>

                {/* Quick Selection Pills */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C8479] block mb-2">
                    Popular Role Presets:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quickRoles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setTargetRole(role)}
                        className={`text-xs px-2.5 py-1.5 rounded border transition-colors cursor-pointer text-left ${
                          targetRole === role
                            ? "bg-[#172535] text-white border-[#172535] font-semibold"
                            : "bg-[#FAF8F5] hover:bg-[#EFECE6] text-[#5C564E] border-[#E5E0D4]"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Track and Difficulty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-mono text-[#181614] mb-1 font-semibold">
                      INTERVIEW TRACK
                    </label>
                    <select
                      value={interviewTrack}
                      onChange={(e) => setInterviewTrack(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-[#FAF8F5] border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none focus:border-[#C84B26]"
                    >
                      <option value="technical">Technical Architecture & Coding</option>
                      <option value="system_design">System Design & Scalability</option>
                      <option value="behavioral">Behavioral & STAR Leadership</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-[#181614] mb-1 font-semibold">
                      DIFFICULTY LEVEL
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-[#FAF8F5] border border-[#E5E0D4] text-xs text-[#181614] focus:outline-none focus:border-[#C84B26]"
                    >
                      <option value="easy">Entry / Associate (0-2 YOE)</option>
                      <option value="medium">Mid-Level Engineer (3-5 YOE)</option>
                      <option value="hard">Senior / Staff Architect (6+ YOE)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Resume Grounding Section */}
              <div className="bg-white border border-[#E5E0D4] rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E0D4]">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#C84B26]" />
                    <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#181614]">
                      2. Grounding Resume Dossier
                    </h2>
                  </div>

                  {/* Upload New Resume Button */}
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C84B26] hover:underline cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingResume ? "Uploading..." : "Upload New Resume"}</span>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploadingResume}
                    />
                  </label>
                </div>

                <p className="text-xs text-[#5C564E]">
                  Select the resume or dossier the AI should analyze to tailor questions to your real projects, skills, and accomplishments:
                </p>

                <div className="space-y-2.5">
                  {/* Default Profile Dossier Option */}
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      selectedResumeId === "profile_dossier"
                        ? "bg-[#FBF0EC] border-[#C84B26] shadow-xs"
                        : "bg-[#FAF8F5] hover:bg-[#EFECE6] border-[#E5E0D4]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="resumeSelection"
                      value="profile_dossier"
                      checked={selectedResumeId === "profile_dossier"}
                      onChange={() => setSelectedResumeId("profile_dossier")}
                      className="mt-1 text-[#C84B26] focus:ring-[#C84B26]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#181614]">
                          Primary Engineering Profile Dossier
                        </span>
                        <span className="text-[10px] font-mono bg-[#EBF3EE] text-[#2E6347] px-2 py-0.5 rounded font-semibold">
                          CALIBRATED PROFILE
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C564E] mt-0.5">
                        Uses candidate name ({user?.full_name || "Gunda Venkatasai"}), skills (React, TypeScript, Node.js, Python), and career stories from your database profile.
                      </p>
                    </div>
                  </label>

                  {/* Uploaded Resumes */}
                  {resumes.map((r) => {
                    const rId = r._id || r.id;
                    const isSelected = selectedResumeId === rId;
                    return (
                      <label
                        key={rId}
                        className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#FBF0EC] border-[#C84B26] shadow-xs"
                            : "bg-[#FAF8F5] hover:bg-[#EFECE6] border-[#E5E0D4]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="resumeSelection"
                          value={rId}
                          checked={isSelected}
                          onChange={() => setSelectedResumeId(rId)}
                          className="mt-1 text-[#C84B26] focus:ring-[#C84B26]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#181614] truncate">
                              {r.title || r.name || r.originalFileName || "Uploaded Resume"}
                            </span>
                            {r.atsScore && (
                              <span className="text-[10px] font-mono bg-white border border-[#E5E0D4] text-[#181614] px-2 py-0.5 rounded">
                                ATS SCORE: {r.atsScore}%
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#5C564E] mt-0.5">
                            Targeting: {r.targetRole || targetRole} • Last updated{" "}
                            {new Date(r.updatedAt || r.createdAt || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column (Cols 8-12): Hardware Video/Mic Check & Launch */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-[#E5E0D4] rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E0D4]">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#C84B26]" />
                    <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#181614]">
                      3. Device & Video Feed Check
                    </h2>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasMediaPermission ? "bg-[#2E6347]" : "bg-[#C84B26]"
                    }`}
                  />
                </div>

                <p className="text-xs text-[#5C564E]">
                  Verify your camera and microphone ahead of the broadcast session. You can mute your mic or turn off video anytime during the interview:
                </p>

                {/* Video Preview Box (Permanent DOM element) */}
                <div className="relative w-full aspect-video rounded-md overflow-hidden bg-[#181614] border border-[#E5E0D4] flex items-center justify-center shadow-inner">
                  <video
                    ref={setPreviewVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-150 ${
                      cameraOn && hasMediaPermission ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                  />

                  {/* Fallback Overlay when camera is toggled off or permissions pending */}
                  {(!cameraOn || !hasMediaPermission) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-[#181614] z-10">
                      <div className="w-14 h-14 rounded-full bg-[#23384E] text-white flex items-center justify-center font-bold text-lg mb-2 shadow-xs">
                        {user?.full_name?.charAt(0) || "GV"}
                      </div>
                      <span className="text-xs font-mono text-white/70">
                        {!hasMediaPermission ? "Connecting Device Feed..." : "Camera Off"}
                      </span>
                    </div>
                  )}

                  {/* Name Overlay */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white z-20">
                    {user?.full_name || "Gunda Venkatasai"}
                  </div>

                  {/* Live VOX indicator */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded z-20">
                    <span className="text-[9px] font-mono text-white/70">MIC:</span>
                    <div className="w-10 h-1.5 bg-white/20 rounded-full overflow-hidden flex">
                      <div
                        className="bg-[#2E6347] h-full transition-all duration-75"
                        style={{ width: `${micMuted ? 0 : audioLevel}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Pre-flight Media Controls */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className={`py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-2 border transition-colors cursor-pointer ${
                      cameraOn
                        ? "bg-[#FAF8F5] hover:bg-[#EFECE6] border-[#D5CFBF] text-[#181614]"
                        : "bg-[#FCEEEE] hover:bg-[#F9DADA] border-[#F7D0D0] text-[#9E2A2B]"
                    }`}
                  >
                    {cameraOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                    <span>{cameraOn ? "Camera On" : "Camera Off"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleMicrophone}
                    className={`py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-2 border transition-colors cursor-pointer ${
                      !micMuted
                        ? "bg-[#FAF8F5] hover:bg-[#EFECE6] border-[#D5CFBF] text-[#181614]"
                        : "bg-[#FCEEEE] hover:bg-[#F9DADA] border-[#F7D0D0] text-[#9E2A2B]"
                    }`}
                  >
                    {!micMuted ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    <span>{!micMuted ? "Mic Active" : "Mic Muted"}</span>
                  </button>
                </div>

                {!hasMediaPermission && (
                  <button
                    type="button"
                    onClick={initializeMedia}
                    className="w-full py-2 bg-[#EBF3EE] hover:bg-[#DEEFE3] text-[#2E6347] border border-[#D0E3D6] rounded text-xs font-mono font-semibold transition-colors cursor-pointer"
                  >
                    Grant Browser Camera / Mic Permissions
                  </button>
                )}

                {/* Launch Action Button */}
                <div className="pt-3 border-t border-[#E5E0D4]">
                  <MechanicalButton
                    variant="vermilion"
                    size="lg"
                    onClick={handleStartInterview}
                    disabled={isInitializing || !targetRole.trim()}
                    className="w-full justify-center shadow-md text-sm font-bold tracking-wide"
                    icon={
                      isInitializing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Radio className="w-4 h-4" />
                      )
                    }
                  >
                    {isInitializing
                      ? "Calibrating Stage & Opening Question..."
                      : "Start Mock Interview (Launch Studio)"}
                  </MechanicalButton>
                  <p className="text-[10px] text-center text-[#8C8479] font-mono mt-2">
                    Question speaking begins automatically upon entering the broadcast stage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Render: STEP 2 - LIVE BROADCAST MOCK INTERVIEW STAGE ───────────────────
  if (step === "interview") {
    return (
      <div className="min-h-screen bg-[#F5F3EE] text-[#181614] flex flex-col font-sans">
        {/* Broadcast Studio Header */}
        <header className="border-b border-[#E5E0D4] bg-white px-6 py-3.5 sticky top-0 z-30 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C84B26] animate-ping" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C84B26] font-bold">
                STUDIO ON-AIR
              </span>
            </div>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-xs text-[#5C564E] truncate max-w-xs sm:max-w-md">
              ROLE: <strong className="text-[#181614]">{targetRole}</strong> • {difficulty.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="font-mono text-xs text-[#8C8479]">
              QUESTION {questionIndex + 1} OF {totalQuestions}
            </div>

            {/* Answer Timer Countdown */}
            <div
              className={`flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded border ${
                countdown <= 15
                  ? "bg-[#FCEEEE] text-[#9E2A2B] border-[#F7D0D0] animate-pulse"
                  : "bg-[#FAF8F5] text-[#181614] border-[#E5E0D4]"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#C84B26]" />
              <span>
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
              </span>
            </div>

            <MechanicalButton
              variant="stone"
              size="sm"
              onClick={() => {
                ttsProviderRef.current?.stop();
                sttManagerRef.current?.stop();
                setStep("completed");
              }}
            >
              Conclude
            </MechanicalButton>
          </div>
        </header>

        {/* Main Stage Grid: LEFT (AI Avatar) & RIGHT (Candidate Video) */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ========================================================================= */}
          {/* LEFT SIDE (Cols 1-6): AI AVATAR PRINCIPAL EVALUATOR & QUESTION            */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* AI Avatar Display Box */}
            <div className="bg-[#172535] rounded-lg p-6 text-white relative overflow-hidden shadow-md flex flex-col justify-between min-h-[310px]">
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-mono text-[#8B9CAD] uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <Radio className="w-3.5 h-3.5 text-[#C84B26] animate-pulse" />
                  AI PRINCIPAL EVALUATOR • DR. MARCUS VANCE
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    isAiSpeaking
                      ? "bg-[#C84B26] text-white animate-pulse"
                      : isEvaluating
                      ? "bg-[#A36114] text-white"
                      : "bg-white/10 text-white/80"
                  }`}
                >
                  {isAiSpeaking
                    ? "🔊 AI SPEAKING QUESTION"
                    : isEvaluating
                    ? "🧠 EVALUATING RESPONSE"
                    : "🟢 LISTENING TO CANDIDATE"}
                </span>
              </div>

              {/* Central AI Avatar Visualization */}
              <div className="my-auto flex flex-col items-center justify-center text-center z-10 py-3">
                <AIAvatar state={getAvatarState()} name="Dr. Marcus Vance" />
              </div>

              {/* Status and Voice Activity Indicator */}
              <div className="flex items-center justify-between z-10 bg-black/40 px-3.5 py-2 rounded border border-white/10 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-[10px]">MODE:</span>
                  <span className="text-white font-semibold">
                    {isAiSpeaking
                      ? "Reading Question Aloud..."
                      : isEvaluating
                      ? "Scoring Rubric Dimensions..."
                      : "Microphone Active (Candidate Turn)"}
                  </span>
                </div>

                {/* Replay Question Button */}
                <button
                  type="button"
                  onClick={() =>
                    speakQuestion(
                      currentQuestion?.questionText ||
                        currentQuestion?.question_text ||
                        currentQuestion?.prompt
                    )
                  }
                  disabled={isAiSpeaking}
                  className="text-[11px] text-[#C84B26] hover:text-white flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
                  title="Re-read Question"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Replay Audio</span>
                </button>
              </div>
            </div>

            {/* Technical Question Card */}
            <div className="bg-white border border-[#E5E0D4] rounded-lg p-6 shadow-xs flex flex-col justify-between flex-1 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#C84B26] font-bold bg-[#FBF0EC] px-2 py-0.5 rounded border border-[#F4D4C9]">
                    {currentQuestion?.category || interviewTrack.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-mono text-[#8C8479]">
                    TOPIC: {currentQuestion?.topic || "Core Architecture"}
                  </span>
                </div>

                <h2 className="font-serif text-lg sm:text-xl font-bold leading-snug text-[#181614] tracking-tight">
                  "{currentQuestion?.questionText || currentQuestion?.question_text || currentQuestion?.prompt}"
                </h2>
              </div>

              {/* Competencies Checklist */}
              {currentQuestion?.competencies && currentQuestion.competencies.length > 0 && (
                <div className="pt-2 border-t border-[#E5E0D4]">
                  <span className="text-[10px] font-mono uppercase text-[#8C8479] block mb-1.5 font-bold">
                    CORE EVIDENCE COMPETENCIES TO DEMONSTRATE:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentQuestion.competencies.map((comp: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs font-mono bg-[#EBF3EE] text-[#2E6347] border border-[#D0E3D6] px-2 py-0.5 rounded"
                      >
                        ✓ {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT SIDE (Cols 7-12): CANDIDATE VIDEO FEED, AUDIO METER & CONTROLS      */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Candidate Video Feed Box */}
            <div className="bg-white border border-[#E5E0D4] rounded-lg p-5 shadow-xs flex flex-col justify-between min-h-[310px] relative overflow-hidden">
              <div className="flex items-center justify-between z-10 pb-2">
                <span className="text-[10px] font-mono text-[#8C8479] uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCandidateAnswering ? "bg-[#2E6347] animate-pulse" : "bg-[#8C8479]"
                    }`}
                  />
                  CANDIDATE BROADCAST FEED
                </span>

                {/* Microphone Status Badge */}
                <div className="flex items-center gap-2">
                  {isAiSpeaking ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FCEEEE] text-[#9E2A2B] border border-[#F7D0D0] font-semibold flex items-center gap-1">
                      <MicOff className="w-3 h-3" /> MIC LOCKED (AI SPEAKING)
                    </span>
                  ) : micMuted ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FCEEEE] text-[#9E2A2B] font-semibold flex items-center gap-1">
                      <MicOff className="w-3 h-3" /> MUTED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EBF3EE] text-[#2E6347] font-semibold flex items-center gap-1">
                      <Mic className="w-3 h-3" /> MIC LIVE
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-[#8C8479] hidden sm:inline">1080p 60FPS</span>
                </div>
              </div>

              {/* Video Element Viewport (Permanent in DOM) */}
              <div className="relative w-full aspect-video rounded-md overflow-hidden bg-[#181614] border border-[#E5E0D4] flex items-center justify-center shadow-inner my-2">
                <video
                  ref={setLiveVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-150 ${
                    cameraOn && hasMediaPermission ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                />

                {/* Fallback Overlay when camera is off */}
                {(!cameraOn || !hasMediaPermission) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-[#181614] z-10">
                    <div className="w-16 h-16 rounded-full bg-[#23384E] text-white flex items-center justify-center font-bold text-xl mb-2 shadow-xs">
                      {user?.full_name?.charAt(0) || "GV"}
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {user?.full_name || "Gunda Venkatasai"}
                    </span>
                    <span className="text-[11px] font-mono text-white/50 mt-1 flex items-center gap-1">
                      <VideoOff className="w-3 h-3 text-[#C84B26]" />
                      {!hasMediaPermission ? "Camera permission required" : "Camera feed toggled off"}
                    </span>
                  </div>
                )}

                {/* Candidate Tag */}
                <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded bg-black/60 backdrop-blur-xs text-[11px] font-medium text-white flex items-center gap-1.5 z-20">
                  <User className="w-3 h-3 text-[#C84B26]" />
                  <span>{user?.full_name || "Gunda Venkatasai"}</span>
                </div>

                {/* Real-time Voice Audio Meter Overlay */}
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded z-20">
                  <span className="text-[9px] font-mono text-white/60">VOX:</span>
                  <div className="w-12 h-1.5 bg-white/20 rounded-full overflow-hidden flex">
                    <div
                      className="bg-[#2E6347] h-full transition-all duration-75"
                      style={{ width: `${isAiSpeaking || micMuted ? 0 : audioLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Floating Tactile Studio Controls Bar */}
              <div className="pt-3 border-t border-[#E5E0D4] flex flex-wrap items-center justify-between gap-2 z-10">
                <div className="flex items-center gap-2">
                  {/* Mute / Unmute Button */}
                  <button
                    type="button"
                    onClick={toggleMicrophone}
                    disabled={isAiSpeaking}
                    className={`p-2.5 rounded border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                      isAiSpeaking
                        ? "bg-[#FAF8F5] text-[#8C8479] border-[#E5E0D4] cursor-not-allowed opacity-60"
                        : micMuted
                        ? "bg-[#FCEEEE] border-[#F7D0D0] text-[#9E2A2B]"
                        : "bg-[#FAF8F5] hover:bg-[#EFECE6] border-[#D5CFBF] text-[#181614]"
                    }`}
                    title={micMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {micMuted || isAiSpeaking ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span className="hidden sm:inline">
                      {isAiSpeaking ? "Mic Locked" : micMuted ? "Unmute" : "Mute"}
                    </span>
                  </button>

                  {/* Video Camera On / Off Button */}
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className={`p-2.5 rounded border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                      !cameraOn
                        ? "bg-[#FCEEEE] border-[#F7D0D0] text-[#9E2A2B]"
                        : "bg-[#FAF8F5] hover:bg-[#EFECE6] border-[#D5CFBF] text-[#181614]"
                    }`}
                    title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}
                  >
                    {cameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    <span className="hidden sm:inline">
                      {cameraOn ? "Cam Off" : "Cam On"}
                    </span>
                  </button>

                  {/* Skip Question Button */}
                  <button
                    type="button"
                    onClick={handleSkipQuestion}
                    disabled={isEvaluating}
                    className="p-2.5 rounded border border-[#E5E0D4] bg-white hover:bg-[#FAF8F5] text-[#5C564E] hover:text-[#181614] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Skip Question"
                  >
                    <SkipForward className="w-4 h-4 text-[#8C8479]" />
                    <span>Skip Question</span>
                  </button>
                </div>

                {/* Submit Answer Button */}
                <MechanicalButton
                  variant={isCandidateAnswering ? "vermilion" : "stone"}
                  size="md"
                  onClick={handleCompleteAnswer}
                  disabled={isEvaluating || isAiSpeaking}
                  icon={isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                >
                  {isEvaluating
                    ? "Evaluating Answer..."
                    : isAiSpeaking
                    ? "AI Speaking..."
                    : "Submit Answer"}
                </MechanicalButton>
              </div>
            </div>

            {/* Live Realtime Acoustic Transcript Panel */}
            <div className="bg-white border border-[#E5E0D4] rounded-lg p-5 shadow-xs space-y-2 flex-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#8C8479] font-bold">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCandidateAnswering ? "bg-[#2E6347] animate-ping" : "bg-[#8C8479]"
                    }`}
                  />
                  REALTIME ACOUSTIC VOICE TRANSCRIPT
                </span>
                <span className="text-[#2E6347]">
                  {isCandidateAnswering ? "LISTENING TO CANDIDATE (138 WPM OPTIMAL)" : "AWAITING TURN"}
                </span>
              </div>

              <div className="p-3.5 bg-[#FAF8F5] border border-[#E5E0D4] rounded-md text-xs leading-relaxed text-[#181614] font-mono min-h-[90px] max-h-[140px] overflow-y-auto">
                {finalTranscript || liveTranscript ? (
                  <>
                    <span className="text-[#181614]">{finalTranscript}</span>{" "}
                    <span className="text-[#C84B26] font-semibold">{liveTranscript}</span>
                    {isCandidateAnswering && (
                      <span className="inline-block w-1.5 h-3 bg-[#C84B26] ml-1 animate-pulse" />
                    )}
                  </>
                ) : (
                  <span className="text-[#8C8479] italic">
                    {isAiSpeaking
                      ? "AI is speaking the technical question. Your microphone will automatically unlock once speaking completes..."
                      : "Microphone active. Speak your technical answer clearly; live speech is transcribed in realtime."}
                  </span>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Render: STEP 3 - EVALUATION REPORT & SUMMARY ────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#181614] flex flex-col font-sans">
      <header className="border-b border-[#E5E0D4] bg-white px-6 py-4 sticky top-0 z-30 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#2E6347] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Award className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-serif font-bold text-base text-[#181614] tracking-tight">
              Mock Interview Evaluation Dossier
            </div>
            <div className="text-[10px] font-mono text-[#8C8479]">
              COMPLETED SESSION • REALTIME RUBRIC TELEMETRY
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MechanicalButton variant="stone" size="sm" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </MechanicalButton>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-6">
        {(() => {
          const rawScore = finalReport?.overallScore ?? finalReport?.score?.overall_score ?? 0;
          const isUnattempted = rawScore === 0 || finalReport?.attemptStatus === "NOT_ATTEMPTED";

          if (isUnattempted) {
            return (
              <div className="bg-white border border-[#E5E0D4] rounded-lg p-6 sm:p-8 shadow-xs text-center space-y-5">
                <div className="w-14 h-14 rounded-full bg-[#FAF8F5] border border-[#E5E0D4] text-[#8C8479] flex items-center justify-center mx-auto shadow-xs">
                  <AlertCircle className="w-7 h-7 text-[#A36114]" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#A36114] font-bold">
                    EVALUATION STATUS
                  </span>
                  <h1 className="text-2xl font-serif font-bold text-[#181614] tracking-tight">
                    INTERVIEW NOT ATTEMPTED
                  </h1>
                </div>

                <div className="p-4 bg-[#FAF8F5] rounded-md border border-[#E5E0D4] max-w-xl mx-auto text-left space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-[#E5E0D4]">
                    <span className="text-[#8C8479]">Overall Performance Score</span>
                    <span className="font-bold text-[#181614]">Not available</span>
                  </div>
                  <p className="text-xs text-[#5C564E] leading-relaxed">
                    You did not submit any answers during this interview. Therefore, there is insufficient evidence to evaluate your technical knowledge, communication or problem-solving ability.
                  </p>
                  <p className="text-xs text-[#181614] font-medium pt-1">
                    Recommendation: Retake the interview and submit answers to receive an accurate performance report.
                  </p>
                </div>

                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  <MechanicalButton
                    variant="vermilion"
                    size="md"
                    onClick={() => {
                      setStep("setup");
                      setSessionId(null);
                    }}
                    icon={<RotateCcw className="w-4 h-4" />}
                  >
                    Retake Interview
                  </MechanicalButton>

                  <MechanicalButton
                    variant="navy"
                    size="md"
                    onClick={() => navigate("/dashboard")}
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                  >
                    Return to Dashboard
                  </MechanicalButton>
                </div>
              </div>
            );
          }

          const scorePercent = Math.round(rawScore <= 10 ? rawScore * 10 : rawScore);
          const techScore = finalReport?.technicalScore ?? finalReport?.dimensionScores?.technical ?? rawScore;
          const techPercent = Math.round(techScore <= 10 ? techScore * 10 : techScore);
          const commScore = finalReport?.communicationScore ?? finalReport?.dimensionScores?.communication ?? rawScore;
          const commPercent = Math.round(commScore <= 10 ? commScore * 10 : commScore);
          const readiness = finalReport?.readinessAssessment || (rawScore >= 8 ? "READY" : rawScore >= 6 ? "NEEDS PRACTICE" : "NOT READY");

          return (
            <div className="bg-white border border-[#E5E0D4] rounded-lg p-6 sm:p-8 shadow-xs text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#EBF3EE] border border-[#D0E3D6] text-[#2E6347] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <h1 className="text-2xl font-serif font-bold text-[#181614] tracking-tight">
                Broadcast Mock Interview Complete
              </h1>

              <p className="text-xs text-[#5C564E] max-w-lg mx-auto">
                Session evaluated against verified engineering rubrics for{" "}
                <strong className="text-[#181614]">{targetRole}</strong>.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div className="p-3 bg-[#FAF8F5] rounded border border-[#E5E0D4]">
                  <div className="text-xl font-bold font-serif text-[#C84B26]">
                    {scorePercent}%
                  </div>
                  <div className="text-[10px] font-mono text-[#8C8479] uppercase">Overall Score</div>
                </div>

                <div className="p-3 bg-[#FAF8F5] rounded border border-[#E5E0D4]">
                  <div className="text-xl font-bold font-serif text-[#181614]">
                    {techPercent}%
                  </div>
                  <div className="text-[10px] font-mono text-[#8C8479] uppercase">Technical Depth</div>
                </div>

                <div className="p-3 bg-[#FAF8F5] rounded border border-[#E5E0D4]">
                  <div className="text-xl font-bold font-serif text-[#181614]">
                    {commPercent}%
                  </div>
                  <div className="text-[10px] font-mono text-[#8C8479] uppercase">Communication</div>
                </div>

                <div className="p-3 bg-[#FAF8F5] rounded border border-[#E5E0D4]">
                  <div className={`text-xl font-bold font-serif ${readiness === "READY" ? "text-[#2E6347]" : "text-[#A36114]"}`}>
                    {readiness.toUpperCase()}
                  </div>
                  <div className="text-[10px] font-mono text-[#8C8479] uppercase">Readiness</div>
                </div>
              </div>

              <div className="pt-6 border-t border-[#E5E0D4] flex flex-wrap justify-center gap-3">
                <MechanicalButton
                  variant="vermilion"
                  size="md"
                  onClick={() => {
                    setStep("setup");
                    setSessionId(null);
                  }}
                  icon={<RotateCcw className="w-4 h-4" />}
                >
                  Start Another Rehearsal
                </MechanicalButton>

                {sessionId && (
                  <MechanicalButton
                    variant="navy"
                    size="md"
                    onClick={() => navigate(`/reports/${sessionId}`)}
                    icon={<FileText className="w-4 h-4" />}
                  >
                    View Comprehensive Report
                  </MechanicalButton>
                )}

                <MechanicalButton
                  variant="stone"
                  size="md"
                  onClick={() => navigate("/dashboard")}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Overview Deck
                </MechanicalButton>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
