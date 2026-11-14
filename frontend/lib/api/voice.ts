import { requestBlob, requestJson } from "./client";
import type { TranscriptionResponse, VoiceChatResponse } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

export async function transcribeAudio(audio: Blob): Promise<TranscriptionResponse> {
  const formData = new FormData();
  formData.append("file", audio, `visitor-audio.${extensionForMimeType(audio.type)}`);
  const value = await requestJson("/voice/stt", { method: "POST", body: formData });

  if (!isRecord(value) || typeof value.text !== "string") {
    throw new Error("The backend returned an unexpected transcription response.");
  }

  return {
    text: value.text,
    language: typeof value.language === "string" ? value.language as TranscriptionResponse["language"] : "en",
    ...(typeof value.error === "string" ? { error: value.error } : {}),
  };
}

export async function synthesizeSpeech(text: string, language: string): Promise<Blob> {
  return requestBlob("/voice/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
}

export async function voiceChat(audio: Blob): Promise<VoiceChatResponse> {
  const formData = new FormData();
  formData.append("file", audio, `voice-chat.${extensionForMimeType(audio.type)}`);
  const value = await requestJson("/voice/chat", { method: "POST", body: formData });

  if (!isRecord(value) || typeof value.reply !== "string" || typeof value.transcript !== "string") {
    throw new Error("The backend returned an unexpected voice chat response.");
  }

  return {
    transcript: value.transcript,
    reply: value.reply,
    language_detected: typeof value.language_detected === "string" ? value.language_detected as VoiceChatResponse["language_detected"] : "en",
    sources: Array.isArray(value.sources) ? value.sources.filter((s): s is string => typeof s === "string") : [],
    confident: typeof value.confident === "boolean" ? value.confident : true,
    needs_human: typeof value.needs_human === "boolean" ? value.needs_human : false,
    audio_base64: typeof value.audio_base64 === "string" ? value.audio_base64 : "",
  };
}