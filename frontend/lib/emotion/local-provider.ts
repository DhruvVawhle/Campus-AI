import type { EmotionProvider, EmotionState } from "./types";

export class LocalEmotionProvider implements EmotionProvider {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private subscribers = new Set<(state: EmotionState) => void>();
  private currentState: EmotionState = {
    emotion: "neutral",
    confidence: 0,
    faceDetected: false,
    source: "local",
  };

  async start(_video: HTMLVideoElement) {
    if (this.intervalId) return;
    this.currentState = { ...this.currentState, faceDetected: true };
    this.notify();

    this.intervalId = setInterval(() => {
      const emotions: EmotionState["emotion"][] = ["neutral", "happy", "confused"];
      const emotion = emotions[Math.floor(Math.random() * emotions.length)];
      this.currentState = {
        emotion,
        confidence: 0.6 + Math.random() * 0.3,
        faceDetected: true,
        source: "local",
      };
      this.notify();
    }, 4000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentState = { ...this.currentState, faceDetected: false, emotion: "neutral", confidence: 0 };
    this.notify();
  }

  getState(): EmotionState {
    return this.currentState;
  }

  subscribe(callback: (state: EmotionState) => void) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify() {
    for (const cb of this.subscribers) cb(this.currentState);
  }
}

export const localEmotionProvider = new LocalEmotionProvider();