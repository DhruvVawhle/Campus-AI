export type LanguageCode = "en" | "hi" | "mr" | "hinglish";

export type ChatResponse = {
  reply: string;
  session_id: string;
  agent: string;
  language_detected: LanguageCode;
  timestamp: string;
  sources: string[];
  tools_used: string[];
  confident: boolean;
  needs_human: boolean;
  needs_clarification: boolean;
  ui_action: string;
  data: Record<string, unknown>;
};

export type ChatRequest = {
  session_id: string;
  message: string;
  user_type: "visitor";
  language?: LanguageCode;
};

export type ResetResponse = {
  status: string;
  session_id: string;
};

export type TranscriptionResponse = {
  text: string;
  language: LanguageCode;
  error?: string;
};

export type TTSRequest = {
  text: string;
  language: LanguageCode;
};

export type VoiceChatResponse = {
  transcript: string;
  reply: string;
  language_detected: LanguageCode;
  sources: string[];
  confident: boolean;
  needs_human: boolean;
  audio_base64: string;
};

export type HealthResponse = {
  status: string;
  college: string;
  model: string;
  uptime_seconds: number;
  timestamp: string;
};