export function speakTextAloud(
  text: string,
  lang: string = "en",
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Map language
    if (lang === "hi") utterance.lang = "hi-IN";
    else if (lang === "mr") utterance.lang = "mr-IN";
    else utterance.lang = "en-IN";

    // Try finding an Indian accented voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(
      (v) =>
        (lang === "hi" && v.lang.startsWith("hi")) ||
        (lang === "mr" && v.lang.startsWith("mr")) ||
        v.lang === "en-IN" ||
        v.name.includes("India")
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      onStart?.();
    };
    utterance.onend = () => {
      onEnd?.();
    };
    utterance.onerror = () => {
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    onEnd?.();
    return false;
  }
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

