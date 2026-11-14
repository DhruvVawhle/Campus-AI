"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type CameraState = "idle" | "requesting" | "active" | "error";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    if (state === "active" || state === "requesting") return;
    setError(null);
    setState("requesting");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported in this browser.");
      setState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("active");
    } catch (err) {
      const denied = err instanceof DOMException && err.name === "NotAllowedError";
      setError(denied ? "Camera access was denied. Voice still works normally." : "Camera is unavailable.");
      setState("error");
    }
  }, [state]);

  const stop = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
    }
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState("idle");
    setError(null);
  }, []);

  const toggle = useCallback(() => {
    if (state === "active") stop();
    else start();
  }, [state, start, stop]);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, stream: streamRef.current, state, error, start, stop, toggle };
}