import type { EmotionProvider, EmotionState } from "./types";

export class DemoEmotionProvider implements EmotionProvider {
  getState(): EmotionState {
    return {
      emotion: "neutral",
      confidence: 0,
      faceDetected: false,
      source: "demo",
    };
  }
}