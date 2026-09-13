
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ISpeechProvider,
  WebSpeechApiProvider,
  GroqWhisperSpeechProvider,
} from "@/services/speechProvider";

export type PermissionStatus = "prompt" | "granted" | "denied";

export function useAudio(onTranscriptReceived: (text: string, isFinal: boolean) => void) {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("prompt");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [aiStatus, setAiStatus] = useState<"idle" | "listening" | "transcribing" | "analyzing" | "ready">("ready");
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const speechProviderRef = useRef<ISpeechProvider | null>(null);
  const whisperProviderRef = useRef<GroqWhisperSpeechProvider | null>(null);

  // Check initial microphone permission status if supported
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((permission) => {
          setPermissionStatus(permission.state as PermissionStatus);
          permission.onchange = () => {
            setPermissionStatus(permission.state as PermissionStatus);
          };
        })
        .catch(() => {});
    }
  }, []);

  // Initialize MediaDevices & Audio Visualizer
  const requestMicrophone = useCallback(async (): Promise<MediaStream | null> => {
    try {
      setErrorMessage(null);
      // Explicit standard getUserMedia per specification
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermissionStatus("granted");

      // Set up AudioContext for real-time visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          if (analyserRef.current && isRecording && !isPaused && !isMuted) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 255) * 100)));
          } else {
            setAudioLevel(0);
          }
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      }

      return stream;
    } catch (err: any) {
      setPermissionStatus("denied");
      setErrorMessage("Microphone permission denied. Please allow microphone access in your browser.");
      return null;
    }
  }, [isRecording, isPaused, isMuted]);

  // Start recording
  const startRecording = useCallback(async () => {
    let stream = streamRef.current;
    if (!stream || !stream.active) {
      stream = await requestMicrophone();
      if (!stream) return;
    }

    setIsRecording(true);
    setIsPaused(false);
    setAiStatus("listening");

    // Initialize speech provider: Hybrid Web Speech API with Groq Whisper fallback
    const hasWebSpeech = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

    if (hasWebSpeech) {
      const provider = new WebSpeechApiProvider({
        onTranscript: (text, isFinal) => {
          onTranscriptReceived(text, isFinal);
        },
        onError: (err) => {
          setErrorMessage(err);
        },
        onStatusChange: (s) => {
          if (s === "listening") setAiStatus("listening");
          else if (s === "transcribing") setAiStatus("transcribing");
        },
      });
      speechProviderRef.current = provider;
      await provider.start();
    } else {
      // Fallback directly to Whisper
      const whisper = new GroqWhisperSpeechProvider(
        {
          onTranscript: (text, isFinal) => {
            onTranscriptReceived(text, isFinal);
          },
          onError: (err) => {
            setErrorMessage(err);
          },
          onStatusChange: (s) => {
            if (s === "listening") setAiStatus("listening");
            else if (s === "transcribing") setAiStatus("transcribing");
          },
        },
        stream
      );
      whisperProviderRef.current = whisper;
      await whisper.start();
    }
  }, [requestMicrophone, onTranscriptReceived]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (speechProviderRef.current) {
      speechProviderRef.current.pause();
    }
    if (whisperProviderRef.current) {
      whisperProviderRef.current.pause();
    }
    setIsPaused(true);
    setAudioLevel(0);
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (speechProviderRef.current) {
      speechProviderRef.current.resume();
    }
    if (whisperProviderRef.current) {
      whisperProviderRef.current.resume();
    }
    setIsPaused(false);
    setAiStatus("listening");
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (speechProviderRef.current) {
      speechProviderRef.current.stop();
      speechProviderRef.current = null;
    }
    if (whisperProviderRef.current) {
      whisperProviderRef.current.stop();
      whisperProviderRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setAudioLevel(0);
    setAiStatus("ready");
  }, []);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    permissionStatus,
    isRecording,
    isPaused,
    isMuted,
    aiStatus,
    audioLevel,
    errorMessage,
    requestMicrophone,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    toggleMute,
    setAiStatus,
  };
}
