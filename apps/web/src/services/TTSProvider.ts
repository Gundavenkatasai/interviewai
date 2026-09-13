
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

  synthesize(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        if (this.onEnd) this.onEnd();
        resolve();
        return;
      }

      this.stop(); // Stop any existing speech

      this.utterance = new SpeechSynthesisUtterance(text);
      this.utterance.rate = 1.0;
      this.utterance.pitch = 1.0;

      // Select a good English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find((v) => v.lang === "en-US" && v.name.includes("Google")) || voices.find((v) => v.lang.startsWith("en"));
      if (preferredVoice) {
        this.utterance.voice = preferredVoice;
      }

      this.utterance.onstart = () => {
        this.isSpeaking = true;
        if (this.onStart) this.onStart();
      };

      this.utterance.onend = () => {
        this.isSpeaking = false;
        this.utterance = null;
        if (this.onEnd) this.onEnd();
        resolve();
      };

      this.utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.utterance = null;
        const err = new Error(event.error);
        if (this.onError) this.onError(err);
        resolve(); // resolve rather than reject to avoid unhandled promise rejection crashing the app
      };

      window.speechSynthesis.speak(this.utterance);
    });
  }

  stop() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.utterance = null;
  }
}

export function createTTSProvider(): TTSProvider {
  return new WebSpeechTTSProvider();
}
