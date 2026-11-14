export type Emotion =
  | "neutral"
  | "happy"
  | "sad"
  | "angry"
  | "surprised"
  | "fearful"
  | "confused"
  | "unknown";

export type EmotionState = {
  emotion: Emotion;
  confidence: number;
  faceDetected: boolean;
  source: "demo" | "backend" | "local";
};

export interface EmotionProvider {
  getState(): EmotionState;
  subscribe?(callback: (state: EmotionState) => void): () => void;
}