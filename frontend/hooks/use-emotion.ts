"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { localEmotionProvider } from "@/lib/emotion/local-provider";
import { DemoEmotionProvider } from "@/lib/emotion/demo-provider";
import type { EmotionProvider, EmotionState } from "@/lib/emotion/types";

export function useEmotion(demoMode: boolean) {
  const providerRef = useRef<EmotionProvider | null>(null);
  const [state, setState] = useState<EmotionState>({
    emotion: "neutral",
    confidence: 0,
    faceDetected: false,
    source: demoMode ? "demo" : "local",
  });

  useEffect(() => {
    if (demoMode) {
      providerRef.current = new DemoEmotionProvider();
      setState(providerRef.current.getState());
    } else {
      providerRef.current = localEmotionProvider;
      const unsubscribe = localEmotionProvider.subscribe(setState);
      return unsubscribe;
    }
  }, [demoMode]);

  const start = useCallback(async (video: HTMLVideoElement) => {
    if (!demoMode && providerRef.current === localEmotionProvider) {
      await localEmotionProvider.start(video);
    }
  }, [demoMode]);

  const stop = useCallback(() => {
    if (!demoMode && providerRef.current === localEmotionProvider) {
      localEmotionProvider.stop();
    }
  }, [demoMode]);

  return { state, start, stop };
}