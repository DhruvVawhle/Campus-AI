"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseVoiceOptions = {
  demoMode: boolean;
  onRecordingComplete: (audio: Blob) => Promise<void>;
  onListeningChange: (listening: boolean) => void;
  onError: (message: string) => void;
  onAmplitudeChange?: (amplitude: number) => void;
};

const SILENCE_THRESHOLD = 0.015;
const SILENCE_DURATION_MS = 1200;
const MIN_RECORDING_MS = 800;
const MAX_RECORDING_MS = 15000;

export function useVoice({
  demoMode,
  onRecordingComplete,
  onListeningChange,
  onError,
  onAmplitudeChange,
}: UseVoiceOptions) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const callbackRef = useRef(onRecordingComplete);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<number>(0);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    callbackRef.current = onRecordingComplete;
  }, [onRecordingComplete]);

  const stopAmplitudeDetection = useCallback(() => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    onAmplitudeChange?.(0);
  }, [onAmplitudeChange]);

  const runAmplitudeDetection = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const v = (dataArrayRef.current[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / dataArrayRef.current.length);
    onAmplitudeChange?.(rms);

    if (recorderRef.current?.state === "recording") {
      animationIdRef.current = requestAnimationFrame(runAmplitudeDetection);
    }
  }, [onAmplitudeChange]);

  const startAmplitudeDetection = useCallback((stream: MediaStream) => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.3;
      dataArrayRef.current = new Uint8Array(new ArrayBuffer(analyserRef.current.frequencyBinCount));
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      runAmplitudeDetection();
    } catch {
      // ignore
    }
  }, [runAmplitudeDetection]);

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    clearTimers();
    if (demoMode) {
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
      setRecording(false);
      onListeningChange(false);
      void callbackRef.current(new Blob(["demo audio"], { type: "audio/webm" }));
      return;
    }
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    } else if (recording) {
      setRecording(false);
      onListeningChange(false);
    }
    stopAmplitudeDetection();
  }, [clearTimers, demoMode, onListeningChange, recording, stopAmplitudeDetection]);

  const checkSilence = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || recorderRef.current?.state !== "recording") return;
    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const v = (dataArrayRef.current[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / dataArrayRef.current.length);
    onAmplitudeChange?.(rms);

    const now = Date.now();
    if (rms < SILENCE_THRESHOLD && now - startedAtRef.current > MIN_RECORDING_MS) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          stopRecording();
        }, SILENCE_DURATION_MS);
      }
    } else {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }

    if (recorderRef.current?.state === "recording") {
      requestAnimationFrame(checkSilence);
    }
  }, [onAmplitudeChange, stopRecording]);

  const startRecording = useCallback(async () => {
    if (recording) {
      stopRecording();
      return;
    }

    onError("");
    onListeningChange(true);
    setRecording(true);
    startedAtRef.current = Date.now();

    if (demoMode) {
      maxTimerRef.current = setTimeout(() => {
        setRecording(false);
        onListeningChange(false);
        void callbackRef.current(new Blob(["demo audio"], { type: "audio/webm" }));
      }, 2000);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecording(false);
      onListeningChange(false);
      onError("This browser does not support microphone recording. You can still type your question.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const supportedMimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ].find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
      const recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setRecording(false);
        onListeningChange(false);
        onError("The microphone recording stopped unexpectedly. Please try again.");
      };
      recorder.onstop = () => {
        const audio = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        for (const track of stream.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        onListeningChange(false);
        stopAmplitudeDetection();
        if (audio.size < 100) {
          onError("I couldn't hear any speech. Please try speaking again.");
          return;
        }
        void callbackRef.current(audio);
      };
      recorder.start();
      startAmplitudeDetection(stream);
      requestAnimationFrame(checkSilence);
      maxTimerRef.current = setTimeout(() => stopRecording(), MAX_RECORDING_MS);
    } catch (error) {
      setRecording(false);
      onListeningChange(false);
      const denied = error instanceof DOMException && error.name === "NotAllowedError";
      onError(
        denied
          ? "Microphone access was blocked. Allow microphone access or type your question instead."
          : "The microphone is unavailable right now. Please try again or type your question.",
      );
    }
  }, [
    demoMode,
    onError,
    onListeningChange,
    recording,
    stopRecording,
    startAmplitudeDetection,
    checkSilence,
    stopAmplitudeDetection,
  ]);

  useEffect(
    () => () => {
      clearTimers();
      stopAmplitudeDetection();
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    },
    [clearTimers, stopAmplitudeDetection],
  );

  return { recording, startRecording, stopRecording };
}