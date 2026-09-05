import { ApiClient } from "@/lib/api";

export interface SpeechRecognitionCallbacks {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onStatusChange?: (status: "listening" | "transcribing" | "idle") => void;
}

export interface ISpeechProvider {
  start(): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  isListening(): boolean;
}

/**
 * 1. Browser Web Speech API Provider (Fallback & Real-time zero latency)
 */
export class WebSpeechApiProvider implements ISpeechProvider {
  private recognition: any = null;
  private callbacks: SpeechRecognitionCallbacks;
  private running = false;
  private paused = false;

  constructor(callbacks: SpeechRecognitionCallbacks) {
    this.callbacks = callbacks;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";

      this.recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          this.callbacks.onTranscript(finalTranscript.trim(), true);
        } else if (interimTranscript) {
          this.callbacks.onTranscript(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== "no-speech") {
          this.callbacks.onError(`Speech recognition error: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        if (this.running && !this.paused) {
          try {
            this.recognition.start();
          } catch {}
        }
      };
    }
  }

  async start(): Promise<void> {
    if (!this.recognition) {
      this.callbacks.onError("Web Speech API is not supported in this browser. Switching to Groq Whisper.");
      return;
    }
    this.running = true;
    this.paused = false;
    try {
      this.recognition.start();
      this.callbacks.onStatusChange?.("listening");
    } catch (e: any) {
      this.callbacks.onError(e.message);
    }
  }

  stop(): void {
    this.running = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
    this.callbacks.onStatusChange?.("idle");
  }

  pause(): void {
    this.paused = true;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }

  resume(): void {
    if (this.paused && this.running && this.recognition) {
      this.paused = false;
      try {
        this.recognition.start();
        this.callbacks.onStatusChange?.("listening");
      } catch {}
    }
  }

  isListening(): boolean {
    return this.running && !this.paused;
  }
}

/**
 * 2. MediaRecorder + Groq Whisper Provider (High fidelity audio chunks)
 */
export class GroqWhisperSpeechProvider implements ISpeechProvider {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private callbacks: SpeechRecognitionCallbacks;
  private audioChunks: Blob[] = [];
  private active = false;

  constructor(callbacks: SpeechRecognitionCallbacks, stream?: MediaStream) {
    this.callbacks = callbacks;
    this.audioStream = stream || null;
  }

  async start(): Promise<void> {
    try {
      if (!this.audioStream) {
        this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg",
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        if (this.audioChunks.length === 0) return;
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || "audio/webm" });
        this.callbacks.onStatusChange?.("transcribing");
        try {
          const res = await ApiClient.transcribeAudio(audioBlob);
          if (res.transcript) {
            this.callbacks.onTranscript(res.transcript, true);
          }
        } catch (err: any) {
          this.callbacks.onError(err.message || "Whisper transcription failed");
        } finally {
          this.callbacks.onStatusChange?.("idle");
        }
      };

      this.mediaRecorder.start(1000); // 1-second chunks
      this.active = true;
      this.callbacks.onStatusChange?.("listening");
    } catch (err: any) {
      this.callbacks.onError(err.message || "Microphone access denied");
    }
  }

  stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    this.active = false;
  }

  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.pause();
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === "paused") {
      this.mediaRecorder.resume();
    }
  }

  isListening(): boolean {
    return this.active;
  }
}
