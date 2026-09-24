
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
        console.warn("SpeechSynthesis not supported in this browser.");
        if (this.onEnd) this.onEnd();
        resolve();
        return;
      }

      this.stop(); // Stop and clear any previous utterances

      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        this.utterance = utterance;
        // Protect against Chrome V8 garbage collection bug
        (window as any).__currentTTSUtterance = utterance;

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to select an English voice
        const pickVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            const preferredVoice = 
              voices.find((v) => v.lang === "en-US" && (v.name.includes("Google") || v.name.includes("Natural"))) ||
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
          console.warn("SpeechSynthesis error:", event?.error);
          cleanup();
          if (this.onEnd) this.onEnd();
          resolve();
        };

        // Safety watchdog: Chrome speech synthesis can fail silently or get stuck.
        // Estimate speech duration based on word count (avg 2.5 words/sec + 4s buffer)
        const wordCount = cleanText.split(/\s+/).length;
        const maxExpectedMs = Math.max(5000, Math.ceil((wordCount / 2.5) * 1000) + 4000);

        this.watchdogTimer = setTimeout(() => {
          if (this.isSpeaking || !started) {
            console.warn(`SpeechSynthesis watchdog timed out after ${maxExpectedMs}ms; completing.`);
            this.stop();
            if (this.onEnd) this.onEnd();
            resolve();
          }
        }, maxExpectedMs);

        // Keep-alive interval: Chrome pauses SpeechSynthesis after 14 seconds
        this.keepAliveInterval = setInterval(() => {
          if (typeof window !== "undefined" && window.speechSynthesis) {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          }
        }, 3000);

        // Resume engine in case browser paused it, then speak
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        window.speechSynthesis.speak(utterance);

        // Fallback start trigger if onstart doesn't fire within 800ms
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
