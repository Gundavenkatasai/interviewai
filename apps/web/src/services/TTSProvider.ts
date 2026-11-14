export interface TTSProvider {
  synthesize(text: string): Promise<void>;
  stop(): void;
  isSpeaking: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: Error) => void;
}

export class WebSpeechTTSProvider implements TTSProvider {
  isSpeaking = false;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: Error) => void;

  private utterance: SpeechSynthesisUtterance | null = null;
  private watchdogTimer: any = null;
  private keepAliveInterval: any = null;

  synthesize(text: string): Promise<void> {
    return new Promise((resolve) => {
      const cleanText = (text || "").trim();
      if (!cleanText) {
        if (this.onEnd) this.onEnd();
        resolve();
        return;
      }

      if (typeof window === "undefined" || !window.speechSynthesis) {
        if (this.onEnd) this.onEnd();
        resolve();
        return;
      }

      // 1. Cleanly stop any existing speech without triggering spurious interrupted errors
      this.stop();

      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        this.utterance = utterance;
        // Protect against Chromium V8 garbage collection bug
        (window as any).__currentTTSUtterance = utterance;

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to select natural English voice
        const pickVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            const preferredVoice =
              voices.find(
                (v) =>
                  v.lang === "en-US" &&
                  (v.name.includes("Google") || v.name.includes("Natural"))
              ) ||
              voices.find((v) => v.lang === "en-US") ||
              voices.find((v) => v.lang.startsWith("en"));
            if (preferredVoice) {
              utterance.voice = preferredVoice;
            }
          }
        };

        pickVoice();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = pickVoice;
        }

        let started = false;

        const cleanup = () => {
          this.isSpeaking = false;
          this.utterance = null;
          (window as any).__currentTTSUtterance = null;
          if (this.watchdogTimer) {
            clearTimeout(this.watchdogTimer);
            this.watchdogTimer = null;
          }
          if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
          }
        };

        utterance.onstart = () => {
          started = true;
          this.isSpeaking = true;
          if (this.onStart) this.onStart();
        };

        utterance.onend = () => {
          cleanup();
          if (this.onEnd) this.onEnd();
          resolve();
        };

        utterance.onerror = (event: any) => {
          // 'interrupted' and 'canceled' are expected when user skips, pauses, or changes question
          if (event?.error !== "interrupted" && event?.error !== "canceled") {
            console.warn("[TTS Notice] SpeechSynthesis event:", event?.error);
          }
          cleanup();
          if (this.onEnd) this.onEnd();
          resolve();
        };

        // Safety watchdog based on estimated duration
        const wordCount = cleanText.split(/\s+/).length;
        const maxExpectedMs = Math.max(5000, Math.ceil((wordCount / 2.5) * 1000) + 4000);

        this.watchdogTimer = setTimeout(() => {
          if (this.isSpeaking || !started) {
            this.stop();
            if (this.onEnd) this.onEnd();
            resolve();
          }
        }, maxExpectedMs);

        // Keep-alive interval for Chromium 14-second pause bug
        this.keepAliveInterval = setInterval(() => {
          if (typeof window !== "undefined" && window.speechSynthesis) {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          }
        }, 3000);

        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        window.speechSynthesis.speak(utterance);

        // Fallback trigger if onstart doesn't fire within 800ms
        setTimeout(() => {
          if (!started && this.utterance === utterance) {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
            if (this.onStart) this.onStart();
          }
        }, 800);
      } catch (err: any) {
        console.error("Failed to start SpeechSynthesis:", err);
        this.stop();
        if (this.onEnd) this.onEnd();
        resolve();
      }
    });
  }

  stop() {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    if (this.utterance) {
      // Detach handlers so cancel() doesn't fire interrupted error
      this.utterance.onstart = null;
      this.utterance.onend = null;
      this.utterance.onerror = null;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {}
    }

    this.isSpeaking = false;
    this.utterance = null;
    if (typeof window !== "undefined") {
      (window as any).__currentTTSUtterance = null;
    }
  }
}

export function createTTSProvider(): TTSProvider {
  return new WebSpeechTTSProvider();
}
