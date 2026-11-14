"use client";

import { useEffect, useRef, useCallback } from "react";

export function useIdleReset(timeoutMs = 45000, onIdle: () => void) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onIdleRef = useRef(onIdle);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onIdleRef.current();
    }, timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const events = ["mousedown", "mousemove", "touchstart", "pointerdown", "keydown", "wheel"];
    const handleActivity = () => resetTimer();

    for (const evt of events) {
      window.addEventListener(evt, handleActivity, { passive: true });
    }

    resetTimer();

    return () => {
      for (const evt of events) {
        window.removeEventListener(evt, handleActivity);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resetTimer]);

  return { resetTimer };
}
