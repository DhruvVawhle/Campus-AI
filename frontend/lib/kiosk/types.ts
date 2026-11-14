export type KioskState = "idle" | "listening" | "thinking" | "speaking" | "error";

export type MessageOrigin = "backend" | "demo";

export type LanguageCode = "en" | "hi" | "mr" | "hinglish";

export type ConversationMessage = {
  id: string;
  role: "visitor" | "campusai";
  text: string;
  origin: MessageOrigin;
};