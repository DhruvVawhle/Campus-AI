import { requestJson } from "./client";
import type { ChatRequest, ChatResponse } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseChatResponse(value: unknown): ChatResponse {
  if (!isRecord(value) || typeof value.reply !== "string" || typeof value.session_id !== "string") {
    throw new Error("The backend returned an unexpected chat response.");
  }

  return {
    reply: value.reply,
    session_id: value.session_id,
    agent: typeof value.agent === "string" ? value.agent : "reception",
    language_detected: typeof value.language_detected === "string" ? value.language_detected as ChatResponse["language_detected"] : "en",
    timestamp: typeof value.timestamp === "string" ? value.timestamp : "",
    sources: stringList(value.sources),
    tools_used: stringList(value.tools_used),
    confident: typeof value.confident === "boolean" ? value.confident : true,
    needs_human: typeof value.needs_human === "boolean" ? value.needs_human : false,
    needs_clarification: typeof value.needs_clarification === "boolean" ? value.needs_clarification : false,
    ui_action: typeof value.ui_action === "string" ? value.ui_action : "none",
    data: isRecord(value.data) ? value.data : {},
  };
}

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  const value = await requestJson("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseChatResponse(value);
}

export async function resetChatSession(sessionId: string): Promise<void> {
  await requestJson("/chat/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
}

export async function checkBackendHealth(): Promise<boolean> {
  const value = await requestJson("/health");
  return isRecord(value) && value.status === "ok";
}