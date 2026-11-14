"use client";

import { useCallback, useEffect, useState } from "react";
import { resetChatSession, sendChatMessage } from "@/lib/api/chat";
import { transcribeAudio, synthesizeSpeech, voiceChat } from "@/lib/api/voice";
import type { KioskState, MessageOrigin, LanguageCode } from "@/lib/kiosk/types";

export function useConversation() {
  const [sessionId, setSessionId] = useState("");
  const [state, setState] = useState<KioskState>("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [replyLanguage, setReplyLanguage] = useState<LanguageCode>("en");
  const [origin, setOrigin] = useState<MessageOrigin>("backend");
  const [error, setError] = useState("");
  const [speechNotice, setSpeechNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const storageKey = "campusai-kiosk-session";
    const existingId = window.sessionStorage.getItem(storageKey);
    const id = existingId || window.crypto.randomUUID();
    if (!existingId) window.sessionStorage.setItem(storageKey, id);
    setSessionId(id);
  }, []);

  const playAudio = useCallback(async (text: string, language: string) => {
    try {
      const audio = await synthesizeSpeech(text, language);
      if (!audio.size) throw new Error("Speech synthesis returned no audio.");
      const url = URL.createObjectURL(audio);
      const player = new Audio(url);
      await player.play();
      URL.revokeObjectURL(url);
    } catch {
      // fail silently, UI shows speech notice
    }
  }, []);

  const handleResponse = useCallback(
    async (response: Awaited<ReturnType<typeof sendChatMessage>>, isVoice = false) => {
      setSessionId(response.session_id);
      window.sessionStorage.setItem("campusai-kiosk-session", response.session_id);
      setReply(response.reply);
      setReplyLanguage(response.language_detected);
      setState("speaking");
      if (!isVoice) {
        void playAudio(response.reply, response.language_detected);
      }
      return response;
    },
    [playAudio],
  );

  const answer = useCallback(
    async (message: string, language?: LanguageCode) => {
      const cleanMessage = message.trim();
      if (!cleanMessage || busy) return;

      setTranscript(cleanMessage);
      setError("");
      setSpeechNotice("");
      setOrigin("backend");
      setState("thinking");
      setBusy(true);

      try {
        const response = await sendChatMessage({
          session_id: sessionId || window.crypto.randomUUID(),
          message: cleanMessage,
          user_type: "visitor",
          ...(language ? { language } : {}),
        });
        return handleResponse(response);
      } catch (requestError) {
        const messageText =
          requestError instanceof Error
            ? requestError.message
            : "Something went wrong while I was checking that. Please try again.";
        setError(messageText);
        setState("error");
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [busy, sessionId, handleResponse],
  );

  const answerFromAudio = useCallback(
    async (audio: Blob) => {
      if (busy) return;

      setError("");
      setSpeechNotice("");
      setOrigin("backend");
      setState("listening");

      try {
        setState("thinking");
        const stt = await transcribeAudio(audio);
        if (!stt.text.trim()) {
          setError("I couldn't hear any speech. Please try speaking again.");
          setState("error");
          return;
        }
        setTranscript(stt.text);
        const response = await sendChatMessage({
          session_id: sessionId || window.crypto.randomUUID(),
          message: stt.text,
          user_type: "visitor",
          language: stt.language,
        });
        return handleResponse(response);
      } catch (requestError) {
        const messageText =
          requestError instanceof Error
            ? requestError.message
            : "Something went wrong while I was checking that. Please try again.";
        setError(messageText);
        setState("error");
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [busy, sessionId, handleResponse],
  );

  const answerVoiceEndToEnd = useCallback(
    async (audio: Blob) => {
      if (busy) return;

      setError("");
      setSpeechNotice("");
      setOrigin("backend");
      setState("listening");

      try {
        setState("thinking");
        const response = await voiceChat(audio);
        if (!response.transcript.trim()) {
          setError("I couldn't hear any speech. Please try speaking again.");
          setState("error");
          return;
        }
        setTranscript(response.transcript);
        setReply(response.reply);
        setReplyLanguage(response.language_detected);
        setState("speaking");

        if (response.audio_base64) {
          const binary = atob(response.audio_base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: "audio/mpeg" });
          const url = URL.createObjectURL(blob);
          const player = new Audio(url);
          await player.play();
          URL.revokeObjectURL(url);
        } else {
          await playAudio(response.reply, response.language_detected);
        }
        return response;
      } catch (requestError) {
        const messageText =
          requestError instanceof Error
            ? requestError.message
            : "Something went wrong while I was checking that. Please try again.";
        setError(messageText);
        setState("error");
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [busy, playAudio],
  );

  const showDemoAnswer = useCallback((question: string, response: string) => {
    setTranscript(question);
    setReply(response);
    setReplyLanguage("en");
    setOrigin("demo");
    setError("");
    setSpeechNotice("");
    setBusy(false);
    setState("speaking");
  }, []);

  const showError = useCallback((message: string) => {
    setError(message);
    setState("error");
  }, []);

  const setListening = useCallback((listening: boolean) => {
    setState(listening ? "listening" : "idle");
    if (listening) {
      setError("");
      setSpeechNotice("");
    }
  }, []);

  const setSpeaking = useCallback((speaking: boolean) => {
    setState(speaking ? "speaking" : "idle");
  }, []);

  const setThinking = useCallback(() => setState("thinking"), []);

  const clearSpeechNotice = useCallback(() => setSpeechNotice(""), []);

  const reset = useCallback(async (resetBackend = true) => {
    setError("");
    setSpeechNotice("");
    setTranscript("");
    setReply("");
    setReplyLanguage("en");
    setOrigin("backend");
    setState("idle");
    if (!resetBackend || !sessionId) return;

    try {
      await resetChatSession(sessionId);
    } catch (requestError) {
      setSpeechNotice(
        requestError instanceof Error
          ? `The local conversation was cleared, but the backend could not reset its session: ${requestError.message}`
          : "The local conversation was cleared, but the backend session could not be reset.",
      );
    }
  }, [sessionId]);

  return {
    answer,
    answerFromAudio,
    answerVoiceEndToEnd,
    busy,
    clearSpeechNotice,
    error,
    origin,
    reply,
    setReply,
    replyLanguage,
    reset,
    setListening,
    setSpeaking,
    setThinking,
    setSpeechNotice,
    sessionId,
    showDemoAnswer,
    showError,
    speechNotice,
    state,
    transcript,
  };
}