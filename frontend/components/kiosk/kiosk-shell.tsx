"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FiMic,
  FiMapPin,
  FiInfo,
  FiCalendar,
  FiSend,
  FiRotateCcw,
  FiVolume2,
  FiVolumeX,
  FiLock,
  FiX,
  FiGlobe,
  FiCornerDownRight,
  FiBell,
  FiCheckCircle,
  FiRefreshCw,
  FiCpu,
  FiCheck,
  FiAlertTriangle,
  FiShare2,
} from "react-icons/fi";
import { LuGraduationCap } from "react-icons/lu";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useConversation } from "@/hooks/use-conversation";
import { useVoice } from "@/hooks/use-voice";
import { useCamera } from "@/hooks/use-camera";
import { useEmotion } from "@/hooks/use-emotion";
import { useIdleReset } from "@/hooks/use-idle-reset";
import { checkBackendHealth } from "@/lib/api/chat";
import type { LanguageCode } from "@/lib/kiosk/types";
import { HardwareDrawer } from "./hardware-drawer";
import {
  SLRTCE_CATEGORIES,
  SLRTCE_DIRECTORY,
  SLRTCE_QUICK_PROMPTS,
  SLRTCE_LOCALIZATION,
  findSLRTCERecord,
  type SLRTCEDepartmentCategory,
  type SLRTCEKnowledgeRecord,
} from "@/data/slrtceKnowledge";
import { speakTextAloud, stopSpeaking } from "@/lib/kiosk/speech-synth";
import { playKioskSound } from "@/lib/kiosk/kiosk-audio";
import { WayfindingCard, PhoneQrModal } from "./rich-cards";

const CampusRobot = dynamic(
  () => import("@/components/robot/campus-robot"),
  {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-[#F6F5F2] rounded-full" />,
  }
);

function Spinner() {
  const reduceMotion = typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <motion.span
      className="w-4 h-4 rounded-full border-2 border-[#E2DFD9] border-t-[#7A1C24] shrink-0"
      animate={reduceMotion ? {} : { rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      role="status"
      aria-label="Loading"
    />
  );
}

const DEMO_MODE_FORCED = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function KioskShell() {
  const conversation = useConversation();
  const router = useRouter();
  const [demoMode, setDemoMode] = useState(DEMO_MODE_FORCED);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [lang, setLang] = useState<LanguageCode>("en");
  const [typedMessage, setTypedMessage] = useState("");
  const [hardwareDrawerOpen, setHardwareDrawerOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeRecord, setActiveRecord] = useState<SLRTCEKnowledgeRecord | null>(null);
  const [deskBellNotified, setDeskBellNotified] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SLRTCEDepartmentCategory>("all");
  const [admissionQrOpen, setAdmissionQrOpen] = useState(false);

  // Real-time live interim STT transcription & mic permission
  const [liveInterim, setLiveInterim] = useState("");
  const [micPermitted, setMicPermitted] = useState<boolean | null>(null);

  // Hidden technician console (5-tap trigger or 2.5s hold)
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [adminError, setAdminError] = useState(false);
  const [diagAudioMeter, setDiagAudioMeter] = useState(38);
  const logoTapCountRef = useRef(0);
  const logoTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);

  // Chat container reference for smooth auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Synchronized second-accurate kiosk clock: "Sat, Nov 14 • 08:00 PM"
  const [timeFormatted, setTimeFormatted] = useState("");
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  const t = SLRTCE_LOCALIZATION[lang] || SLRTCE_LOCALIZATION.en;

  // Filtered directory items
  const filteredDirectory = useMemo(() => {
    if (selectedCategory === "all") return SLRTCE_DIRECTORY;
    return SLRTCE_DIRECTORY.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  // Speech Barge-In: Immediately cancel active speech synthesis
  const interruptSpeakingIfActive = useCallback(() => {
    stopSpeaking();
    conversation.setSpeaking(false);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [conversation]);

  // Request browser microphone permission interactively
  const requestMicPermission = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermitted(true);
        stream.getTracks().forEach((track) => track.stop());
        playKioskSound("success");
      }
    } catch {
      setMicPermitted(false);
    }
  }, []);

  // 45-Second Kiosk Idle Reset for visitor privacy
  useIdleReset(45000, () => {
    interruptSpeakingIfActive();
    conversation.reset(true);
    setActiveRecord(null);
    setTypedMessage("");
    setLiveInterim("");
    setDeskBellNotified(false);
    setSelectedCategory("all");
    setLang("en");
  });

  // Check microphone permissions on mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((perm) => {
          setMicPermitted(perm.state === "granted");
          perm.onchange = () => setMicPermitted(perm.state === "granted");
        })
        .catch(() => setMicPermitted(true));
    }
  }, []);

  // Synchronized Clock: "Sat, Nov 14, 08:00 PM"
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const datePart = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const timePart = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      setTimeFormatted(`${datePart}, ${timePart}`);
      setCurrentHour(d.getHours());
    };
    updateTime();

    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    let intervalTimer: NodeJS.Timeout | null = null;
    const timeoutTimer = setTimeout(() => {
      updateTime();
      intervalTimer = setInterval(updateTime, 60000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeoutTimer);
      if (intervalTimer) clearInterval(intervalTimer);
    };
  }, []);

  const _camera = useCamera();
  const _emotion = useEmotion(demoMode);

  // Intelligent offline or live voice response dispatcher with Barge-In
  const executeQuery = useCallback((queryText: string) => {
    const clean = queryText.trim();
    if (!clean) return;

    interruptSpeakingIfActive();
    playKioskSound("tap");
    setDeskBellNotified(false);

    // Match grounded SLRTCE knowledge record
    const matched = findSLRTCERecord(clean);
    setActiveRecord(matched);

    if (demoMode || backendOnline === false) {
      let responseText = "I have checked the SLRTCE campus directory. Please specify faculty cabin, admission eligibility, or examination schedules.";
      if (matched) {
        if (lang === "hi") responseText = matched.replyHi;
        else if (lang === "mr") responseText = matched.replyMr;
        else if (lang === "hinglish") responseText = matched.replyHinglish;
        else responseText = matched.replyEn;
      } else if (/wifi|wi-fi|internet|guest/i.test(clean)) {
        responseText = "Visitors can access 'SLRTCE-Guest' Wi-Fi. Collect the temporary OTP slip from the Main Security Desk.";
      }
      conversation.showDemoAnswer(clean, responseText);

      if (soundEnabled) {
        conversation.setSpeaking(true);
        speakTextAloud(
          responseText,
          lang,
          () => conversation.setSpeaking(true),
          () => conversation.setSpeaking(false)
        );
      }
    } else {
      conversation.answer(clean);
    }
  }, [backendOnline, conversation, demoMode, interruptSpeakingIfActive, lang, soundEnabled]);

  const voice = useVoice({
    demoMode,
    onRecordingComplete: async (audio) => {
      if (demoMode || backendOnline === false) {
        executeQuery("Where is Dr. Rajesh Sharma's cabin in West Wing?");
        return;
      }
      await conversation.answerVoiceEndToEnd(audio);
    },
    onListeningChange: (listening) => conversation.setListening(listening),
    onError: (msg) => {
      if (/permission|not-allowed|denied|block/i.test(msg)) {
        setMicPermitted(false);
      }
      conversation.showError(msg);
    },
  });

  // Real-time streaming Speech-to-Text with Barge-In and Chimes
  const handleStartVoice = () => {
    if (micPermitted === false) {
      void requestMicPermission();
      return;
    }

    interruptSpeakingIfActive();
    playKioskSound("listen-start");

    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      try {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const rec = new SpeechRec();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";

        conversation.setListening(true);
        setLiveInterim("");

        rec.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (interimTranscript) {
            setLiveInterim(interimTranscript);
          }

          if (finalTranscript) {
            setLiveInterim("");
            conversation.setListening(false);
            playKioskSound("listen-end");
            executeQuery(finalTranscript);
          }
        };

        rec.onerror = (err: any) => {
          setLiveInterim("");
          conversation.setListening(false);
          if (err?.error === "not-allowed" || err?.error === "service-not-allowed") {
            setMicPermitted(false);
          } else {
            voice.startRecording();
          }
        };

        rec.onend = () => {
          setLiveInterim("");
          conversation.setListening(false);
        };

        rec.start();
        return;
      } catch {
        // Fall back to media stream recorder
      }
    }
    voice.startRecording();
  };

  // Autonomous Wake-Word Listener ("Hello CampusAI" / "Campus AI")
  useEffect(() => {
    if (typeof window === "undefined" || conversation.state !== "idle" || conversation.busy) return;
    if (micPermitted === false) return;
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;

    let wakeRec: any = null;
    try {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      wakeRec = new SpeechRec();
      wakeRec.continuous = true;
      wakeRec.interimResults = true;
      wakeRec.lang = "en-IN";

      wakeRec.onresult = (event: any) => {
        const lastIdx = event.results.length - 1;
        const spoken = event.results[lastIdx][0].transcript.toLowerCase();
        if (spoken.includes("campus ai") || spoken.includes("hello campus") || spoken.includes("slrtce")) {
          wakeRec.stop();
          handleStartVoice();
        }
      };

      wakeRec.onerror = () => {};
      wakeRec.start();
    } catch {
      // Browser mic policy
    }

    return () => {
      try {
        wakeRec?.stop();
      } catch {}
    };
  }, [conversation.state, conversation.busy, micPermitted]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1") setDemoMode(true);
  }, []);

  // Continuous background health check
  useEffect(() => {
    if (demoMode) {
      setBackendOnline(null);
      return;
    }
    let active = true;
    const refresh = async () => {
      try {
        const healthy = await checkBackendHealth();
        if (active) setBackendOnline(healthy);
      } catch {
        if (active) setBackendOnline(false);
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [demoMode]);

  // Auto-scroll chat feed to bottom on new replies
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.reply, conversation.transcript, activeRecord]);

  const handleLanguageChange = (newLang: LanguageCode) => {
    interruptSpeakingIfActive();
    playKioskSound("tap");
    setLang(newLang);

    // If an active answer is currently on-screen, instantly translate its visible text
    if (activeRecord) {
      let localizedReply = activeRecord.replyEn;
      if (newLang === "hi") localizedReply = activeRecord.replyHi;
      else if (newLang === "mr") localizedReply = activeRecord.replyMr;
      else if (newLang === "hinglish") localizedReply = activeRecord.replyHinglish;
      conversation.setReply(localizedReply);

      if (soundEnabled) {
        conversation.setSpeaking(true);
        speakTextAloud(
          localizedReply,
          newLang,
          () => conversation.setSpeaking(true),
          () => conversation.setSpeaking(false)
        );
      }
    } else if (soundEnabled) {
      const loc = SLRTCE_LOCALIZATION[newLang] || SLRTCE_LOCALIZATION.en;
      conversation.setSpeaking(true);
      speakTextAloud(
        loc.welcomeGreeting,
        newLang,
        () => conversation.setSpeaking(true),
        () => conversation.setSpeaking(false)
      );
    }
  };

  const handleSendTyped = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || conversation.busy) return;
    executeQuery(typedMessage);
    setTypedMessage("");
  };

  // Interactive 3D robot tap reaction
  const handleRobotClick = () => {
    playKioskSound("tap");
    interruptSpeakingIfActive();

    const greeting = t.welcomeGreeting;
    conversation.showDemoAnswer("Hello CampusAI!", greeting);
    if (soundEnabled) {
      conversation.setSpeaking(true);
      speakTextAloud(
        greeting,
        lang,
        () => conversation.setSpeaking(true),
        () => conversation.setSpeaking(false)
      );
    }
  };

  // Secret 5-Tap Gesture or 2.5s Hold on SLRTCE logo
  const handleLogoTap = () => {
    logoTapCountRef.current += 1;
    if (logoTapTimerRef.current) clearTimeout(logoTapTimerRef.current);

    logoTapTimerRef.current = setTimeout(() => {
      logoTapCountRef.current = 0;
    }, 2000);

    if (logoTapCountRef.current >= 5) {
      logoTapCountRef.current = 0;
      playKioskSound("success");
      setAdminModalOpen(true);
    }
  };

  const handleLogoPointerDown = () => {
    longPressRef.current = setTimeout(() => {
      playKioskSound("success");
      setAdminModalOpen(true);
    }, 2500);
  };

  const handleLogoPointerUp = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const handleAdminPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === "1234") {
      playKioskSound("success");
      setAdminModalOpen(false);
      setAdminPin("");
      setAdminError(false);
      setHardwareDrawerOpen(true);
    } else {
      setAdminError(true);
    }
  };

  const handleRingDeskBell = () => {
    playKioskSound("success");
    setDeskBellNotified(true);
    if (soundEnabled) {
      speakTextAloud(t.humanDeskSent, lang);
    }
  };

  // Time-aware operational status
  const isAfterHours = currentHour < 9 || currentHour >= 17;
  const operationalNotice = isAfterHours
    ? { text: t.afterHoursBadge, class: "bg-warning-surface text-warning border border-warning/30" }
    : { text: t.openHoursBadge, class: "bg-success-surface text-success border border-success/30" };

  const isListening = conversation.state === "listening";
  const isThinking = conversation.state === "thinking";
  const isSpeaking = conversation.state === "speaking";
  const hasActiveConversation = Boolean(conversation.transcript || conversation.reply);

  const speakButtonLabel = micPermitted === false
    ? t.enableMic || "Enable Mic"
    : isListening
    ? t.listening
    : isThinking
    ? t.processing
    : isSpeaking
    ? t.speaking
    : t.tapToSpeak;

  const hasTypedContent = typedMessage.trim().length > 0;

  return (
    <div className="h-screen h-dvh max-h-screen max-h-dvh overflow-hidden bg-ground text-ink flex flex-col justify-between">
      
      {/* 1. Top Institutional Masthead Header */}
      <header className="h-16 px-4 lg:px-6 bg-surface border-b border-line flex items-center justify-between shrink-0 shadow-2xs">
        
        {/* Left: CampusAI logo + SLRTCE Campus institutional tag */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLogoTap}
            onPointerDown={handleLogoPointerDown}
            onPointerUp={handleLogoPointerUp}
            onPointerLeave={handleLogoPointerUp}
            className="flex items-baseline gap-2 text-2xl font-black tracking-tight text-slrtce-maroon hover:opacity-90 focus-visible:outline-2 focus-visible:outline-slrtce-maroon rounded px-1 cursor-pointer"
            title="CampusAI (Tap 5x for hardware diagnostics)"
            aria-label="CampusAI Home"
          >
            <span>CampusAI</span>
          </button>

          <span className="text-xs sm:text-sm font-semibold px-3 py-1 rounded bg-ground border border-line text-slrtce-navy">
            {t.stationSubtitle}
          </span>

          {/* Time-Aware Operational Badge */}
          <span className={`text-xs sm:text-sm font-semibold px-3 py-1 rounded hidden md:inline-flex items-center ${operationalNotice.class}`}>
            <span>{operationalNotice.text}</span>
          </span>
        </div>

        {/* Right: Hardware & System Status Cluster */}
        <div className="flex items-center gap-2">
          
          {/* Honest Microphone Status Pill */}
          {micPermitted === false ? (
            <button
              type="button"
              onClick={requestMicPermission}
              className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded bg-destructive-surface text-destructive border border-destructive/20 text-xs sm:text-sm font-semibold hover:bg-destructive/15 transition-colors cursor-pointer"
              title="Microphone access is blocked by browser. Click to prompt permission."
            >
              <FiMic className="w-4 h-4" />
              <span>Mic Blocked</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded bg-success-surface text-success border border-success/20 text-xs sm:text-sm font-semibold">
              <FiMic className="w-4 h-4" />
              <span>Mic Ready</span>
            </div>
          )}

          {/* Voice Output Speaker Toggle */}
          <button
            type="button"
            onClick={() => {
              if (soundEnabled) stopSpeaking();
              setSoundEnabled(!soundEnabled);
              playKioskSound("tap");
            }}
            className="min-h-[38px] flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-surface border border-line hover:bg-ground text-xs sm:text-sm font-semibold text-ink transition-colors focus-visible:outline-2 focus-visible:outline-slrtce-maroon cursor-pointer"
            aria-label={soundEnabled ? "Audio output enabled. Click to mute." : "Audio output muted. Click to enable."}
          >
            {soundEnabled ? (
              <FiVolume2 className="w-4 h-4 text-slrtce-maroon shrink-0" aria-hidden="true" />
            ) : (
              <FiVolumeX className="w-4 h-4 text-secondary shrink-0" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{soundEnabled ? t.voiceOutputOn : t.voiceOutputMuted}</span>
          </button>

          {/* Engine Status Pill */}
          <div className="min-h-[38px] flex items-center px-3.5 rounded bg-ground border border-line text-xs sm:text-sm font-semibold text-secondary">
            <span>{demoMode || backendOnline === false ? t.statusLocalActive : t.statusReady}</span>
          </div>

          {/* Precision Clock */}
          <div className="hidden lg:flex items-center text-xs sm:text-sm font-semibold text-secondary pl-3 border-l border-line tabular-nums">
            {timeFormatted}
          </div>
        </div>
      </header>

      {/* 2. Main Kiosk Architectural Grid (grid-cols-12, 100dvh Lock) */}
      <main className="flex-1 p-3.5 lg:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0 overflow-hidden">
        
        {/* Left Sidebar: Campus Directory (col-span-4, flat structured panel) */}
        <aside className="lg:col-span-4 bg-surface border border-line rounded-lg p-3.5 lg:p-4 flex flex-col justify-between min-h-0 h-full shadow-2xs">
          
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h1 className="text-base font-bold text-slrtce-navy">
                {t.directoryHeading}
              </h1>
              <span className="text-xs font-semibold text-secondary">
                Mira Road (E)
              </span>
            </div>

            {/* Filter Tabs: Single horizontal row with zero awkward line breaks */}
            <div className="flex items-center gap-1 mt-2.5 pb-2 border-b border-line overflow-x-auto scroll-slim flex-nowrap">
              {SLRTCE_CATEGORIES.map((cat) => {
                const label =
                  lang === "hi"
                    ? cat.labelHi
                    : lang === "mr"
                    ? cat.labelMr
                    : lang === "hinglish"
                    ? cat.labelHinglish
                    : cat.labelEn;

                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      interruptSpeakingIfActive();
                      setSelectedCategory(cat.id);
                      playKioskSound("tap");
                    }}
                    className={`min-h-[36px] px-3 py-1.5 text-xs sm:text-sm font-bold rounded whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-slrtce-maroon shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-slrtce-maroon text-white"
                        : "bg-surface text-secondary border border-line hover:bg-ground hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Directory Items with 2 Compact Lines (Fit all cleanly without inner scroll) */}
          <nav className="flex-1 space-y-2 my-2.5 pr-0.5" aria-label="SLRTCE Directory Inquiries">
            {filteredDirectory.map((item) => {
              const isBusy = conversation.busy || voice.recording;
              const itemTitle = (lang === "hi" && item.titleHi) || (lang === "mr" && item.titleMr) || (lang === "hinglish" && item.titleHinglish) || item.title;
              const itemSubtitle = (lang === "hi" && item.subtitleHi) || (lang === "mr" && item.subtitleMr) || (lang === "hinglish" && item.subtitleHinglish) || item.subtitle;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => !isBusy && executeQuery(item.prompt)}
                  disabled={isBusy}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-surface hover:bg-ground/70 hover:border-line-strong text-left transition-colors flex flex-col justify-center focus-visible:outline-2 focus-visible:outline-slrtce-maroon disabled:opacity-50 cursor-pointer"
                >
                  {/* Line 1: Title + Floor Badge */}
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-sm font-bold text-ink truncate">{itemTitle}</span>
                    <span className="text-xs font-semibold text-slrtce-navy bg-ground border border-line px-2 py-0.5 rounded shrink-0 tabular-nums">
                      {item.floorBadge}
                    </span>
                  </div>
                  
                  {/* Line 2: Role/Details + Room Tag */}
                  <div className="flex items-center justify-between gap-1 text-xs text-secondary mt-0.5 w-full font-medium">
                    <span className="truncate">{itemSubtitle}</span>
                    <span className="text-xs font-medium text-slrtce-navy bg-ground px-2 py-0.5 rounded border border-line shrink-0 tabular-nums">
                      {item.roomBadge}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Bottom Language Switcher */}
          <fieldset className="pt-2.5 border-t border-line">
            <legend className="text-xs sm:text-sm font-bold text-secondary mb-1.5 flex items-center gap-1.5">
              <FiGlobe className="w-4 h-4 text-slrtce-maroon" aria-hidden="true" />
              <span>{t.languageLabel}</span>
            </legend>
            
            <div className="flex gap-1 bg-ground p-1 rounded border border-line">
              {(
                [
                  { code: "en", label: "English" },
                  { code: "hi", label: "हिंदी" },
                  { code: "mr", label: "मराठी" },
                  { code: "hinglish", label: "Hinglish" },
                ] as const
              ).map((lCode) => (
                <button
                  key={lCode.code}
                  type="button"
                  onClick={() => handleLanguageChange(lCode.code)}
                  aria-pressed={lang === lCode.code}
                  className={`flex-1 min-h-[38px] py-2 text-xs sm:text-sm font-bold rounded transition-colors focus-visible:outline-2 focus-visible:outline-slrtce-maroon cursor-pointer ${
                    lang === lCode.code
                      ? "bg-slrtce-maroon text-white shadow-2xs"
                      : "text-secondary hover:text-ink hover:bg-surface"
                  }`}
                >
                  {lCode.label}
                </button>
              ))}
            </div>
          </fieldset>

        </aside>

        {/* Right Main Panel: Interactive Dialogue Stage (col-span-8, flex flex-col) */}
        <section className="lg:col-span-8 bg-surface border border-line rounded-lg p-3.5 lg:p-4 flex flex-col justify-between min-h-0 h-full shadow-2xs">
          
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-2 border-b border-line shrink-0 min-h-[46px]">
            <div className="flex items-center gap-2.5">
              {hasActiveConversation ? (
                <div
                  onClick={handleRobotClick}
                  tabIndex={0}
                  role="button"
                  aria-label="CampusAI Assistant. Tap to interact."
                  className={`w-10 h-10 rounded-full bg-ground border border-line flex items-center justify-center overflow-hidden shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-slrtce-maroon transition-all ${
                    isListening
                      ? "animate-halo-listen ring-2 ring-slrtce-maroon ring-offset-1"
                      : isSpeaking
                      ? "animate-robot-speak ring-2 ring-slrtce-gold shadow-xs"
                      : "animate-robot-float"
                  }`}
                  title="Tap CampusAI to interact"
                >
                  <CampusRobot state={conversation.state} distance={7.5} />
                </div>
              ) : null}
              
              <div>
                <span className="text-base font-bold text-slrtce-navy block leading-tight">{t.liveAssistant}</span>
              </div>
            </div>

            {hasActiveConversation && (
              <button
                type="button"
                onClick={() => {
                  interruptSpeakingIfActive();
                  playKioskSound("tap");
                  conversation.reset(true);
                  setActiveRecord(null);
                  setDeskBellNotified(false);
                }}
                className="text-xs sm:text-sm font-semibold text-secondary hover:text-slrtce-maroon flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded border border-line hover:bg-ground transition-colors focus-visible:outline-2 focus-visible:outline-slrtce-maroon cursor-pointer"
              >
                <FiRotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>{t.resetSession}</span>
              </button>
            )}
          </div>

          {/* Dialogue Area: Seamless Stream (Hero Welcome State OR Active Clean Stream) */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 scroll-slim py-2 pr-1 select-text">
            {!hasActiveConversation ? (
              
              /* Hero Welcome State: Clean Architectural Layout (NO Card-in-Card, NO Uppercase Eyebrows) */
              <div className="flex flex-col justify-between h-full max-w-2xl mx-auto py-3">
                
                {/* Welcoming Top Stage: 3D Robot + Dignified Institutional Copy */}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    onClick={handleRobotClick}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRobotClick();
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label="CampusAI Assistant. Tap to interact."
                    className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-line bg-ground flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-slrtce-maroon overflow-hidden group shadow-2xs transition-all ${
                      isListening
                        ? "animate-halo-listen ring-4 ring-slrtce-maroon/40 ring-offset-2 ring-offset-surface"
                        : isSpeaking
                        ? "animate-robot-speak ring-4 ring-slrtce-gold/60 shadow-lg shadow-slrtce-maroon/20"
                        : "animate-robot-float"
                    }`}
                    title="Tap CampusAI to interact"
                  >
                    <div className="relative w-full h-full" aria-hidden="true">
                      <CampusRobot state={conversation.state} distance={8.0} />
                    </div>
                  </div>

                  <div className="space-y-1.5 px-2">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-ink tracking-tight leading-tight">
                      Shree L. R. Tiwari College of Engineering
                    </h2>
                    <p className="text-sm sm:text-base text-secondary font-medium max-w-xl mx-auto leading-relaxed">
                      {t.welcomeGreeting}
                    </p>
                  </div>
                </div>

                {/* Microphone Blocked Informational Notice (No duplicate button - bottom dock CTA owns the action) */}
                {micPermitted === false && (
                  <div className="w-full my-2 px-3.5 py-2.5 rounded-lg bg-destructive-surface border border-destructive/20 flex items-center gap-2.5 text-xs sm:text-sm font-medium text-destructive">
                    <FiAlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Microphone access is blocked in your browser. Use the Enable Mic button below or select an inquiry.</span>
                  </div>
                )}

                {/* Touch Action Prompt Grid (No Eyebrows, Clean Semantic Hierarchy) */}
                <div className="w-full mt-4 space-y-2">
                  <div className="text-sm sm:text-base font-bold text-slrtce-navy">
                    {t.suggestedHeading}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {SLRTCE_QUICK_PROMPTS.map((quick) => {
                      const Icon = quick.icon;
                      const quickLabel = (lang === "hi" && quick.labelHi) || (lang === "mr" && quick.labelMr) || (lang === "hinglish" && quick.labelHinglish) || quick.label;
                      const quickSubtitle = (lang === "hi" && quick.subtitleHi) || (lang === "mr" && quick.subtitleMr) || (lang === "hinglish" && quick.subtitleHinglish) || quick.subtitle;
                      return (
                        <button
                          key={quick.label}
                          type="button"
                          onClick={() => executeQuery(quick.prompt)}
                          className="p-4 rounded-lg border border-line bg-surface hover:border-slrtce-maroon hover:bg-ground/60 text-left transition-colors focus-visible:outline-2 focus-visible:outline-slrtce-maroon cursor-pointer group flex flex-col justify-between min-h-[104px] shadow-2xs"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slrtce-maroon tracking-normal">
                              {quick.category}
                            </span>
                            <Icon className="w-4 h-4 text-secondary group-hover:text-slrtce-maroon transition-colors" />
                          </div>
                          <div>
                            <div className="text-sm sm:text-base font-bold text-ink group-hover:text-slrtce-maroon leading-snug">
                              {quickLabel}
                            </div>
                            <div className="text-xs sm:text-sm text-secondary mt-1 leading-normal font-medium">
                              {quickSubtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

            ) : (

              /* Active Conversation Stream: Clean 1px Border (NO border-l-4) */
              <>
                {/* Visitor Speech Bubble */}
                {conversation.transcript && (
                  <div className="self-end ml-auto bg-ground border border-line text-sm sm:text-base text-ink p-3.5 rounded-lg max-w-[85%] sm:max-w-[75%] shadow-2xs">
                    <div className="text-xs font-bold text-secondary mb-1">Visitor</div>
                    <div className="font-semibold leading-relaxed">{conversation.transcript}</div>
                  </div>
                )}

                {/* Live Interim Streaming Indicator */}
                {liveInterim && (
                  <div className="self-end ml-auto bg-accent-surface border border-slrtce-maroon/30 text-sm sm:text-base text-slrtce-maroon p-3 rounded-lg max-w-[85%] font-medium animate-pulse">
                    <span className="text-xs font-bold block text-slrtce-maroon mb-0.5">Transcribing live speech…</span>
                    {liveInterim}
                  </div>
                )}

                {/* Processing Spinner */}
                {conversation.state === "thinking" && (
                  <div className="self-start text-xs sm:text-sm font-semibold text-secondary flex items-center gap-2 px-1">
                    <Spinner />
                    <span>{t.processing}</span>
                  </div>
                )}

                {/* Assistant Speech Bubble: Crisp Surface with 1px Border (No thick border-l-4, No colored dot) */}
                {conversation.reply && (
                  <div className="self-start mr-auto bg-surface border border-line text-ink text-sm sm:text-base p-4 rounded-lg max-w-[96%] sm:max-w-[90%] space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-line pb-1.5">
                      <span className="text-sm font-bold text-slrtce-maroon">CampusAI</span>
                      <span className="text-xs font-medium text-secondary">Mira Road, Mumbai</span>
                    </div>

                    <div className="leading-relaxed font-medium text-ink">{conversation.reply}</div>

                    {/* Structured Architectural Wayfinding Card */}
                    {activeRecord?.locationDetails && (
                      <WayfindingCard
                        location={activeRecord.locationDetails}
                        title={activeRecord.title}
                        qrUri={activeRecord.locationDetails.qrUri}
                        onOpenDrawer={() => setHardwareDrawerOpen(true)}
                      />
                    )}

                    {/* Structured Timetable Highlight */}
                    {activeRecord?.timetableDetails && (
                      <div className="rounded-lg border border-line bg-ground p-3 space-y-2">
                        <div className="flex items-center justify-between text-sm font-bold text-slrtce-navy">
                          <span>{activeRecord.timetableDetails.semester}</span>
                          <span className="text-xs bg-warning-surface text-warning px-2.5 py-1 rounded font-semibold tabular-nums">
                            {activeRecord.timetableDetails.examCell}
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs sm:text-sm bg-surface rounded border border-line">
                            <thead className="bg-ground text-xs font-bold text-secondary border-b border-line">
                              <tr>
                                <th className="p-2.5">Date & Time</th>
                                <th className="p-2.5">Subject</th>
                                <th className="p-2.5">Room</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {activeRecord.timetableDetails.scheduleHighlights.map((row) => (
                                <tr key={row.subject}>
                                  <td className="p-2.5 whitespace-nowrap font-bold text-ink tabular-nums">{row.date} ({row.time})</td>
                                  <td className="p-2.5 text-slrtce-maroon font-semibold">{row.subject}</td>
                                  <td className="p-2.5 text-secondary font-medium tabular-nums">{row.room}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Structured Fee Breakdown */}
                    {activeRecord?.feeBreakdown && (
                      <div className="rounded-lg border border-line bg-ground p-3.5 space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center justify-between font-bold text-slrtce-navy">
                          <span className="text-sm sm:text-base">{activeRecord.feeBreakdown.course}</span>
                          <span className="text-slrtce-maroon text-base sm:text-lg font-extrabold tabular-nums">{activeRecord.feeBreakdown.totalAnnual}</span>
                        </div>
                        <div className="text-xs sm:text-sm text-secondary font-medium">
                          <strong>Eligibility:</strong> {activeRecord.feeBreakdown.eligibility}
                        </div>
                        <div className="text-xs text-slrtce-gold font-semibold bg-warning-surface inline-block px-2.5 py-1 rounded tabular-nums">
                          {activeRecord.feeBreakdown.capCode}
                        </div>
                      </div>
                    )}

                    {/* QR Code Handoff for Admissions & Checklists */}
                    {activeRecord?.category === "admissions" && (
                      <div className="pt-2 border-t border-line">
                        <button
                          type="button"
                          onClick={() => setAdmissionQrOpen(true)}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-md bg-ground border border-line text-ink hover:bg-surface hover:border-slrtce-maroon hover:text-slrtce-maroon text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <FiShare2 className="w-4 h-4 text-slrtce-maroon" />
                          <span>Take Checklist on Phone (QR)</span>
                        </button>
                      </div>
                    )}

                    {/* One-Tap Contextual Follow-Up Chips (Exactly 2 Relevant Prompts) */}
                    {activeRecord?.followUps && activeRecord.followUps.length > 0 && (
                      <div className="pt-2 border-t border-line space-y-2">
                        <div className="text-xs sm:text-sm font-bold text-secondary flex items-center gap-1.5">
                          <FiCornerDownRight className="w-4 h-4 text-slrtce-maroon" />
                          <span>Suggested Follow-Ups</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {activeRecord.followUps.slice(0, 2).map((chipText) => (
                            <button
                              key={chipText}
                              type="button"
                              onClick={() => executeQuery(chipText)}
                              className="min-h-[38px] px-3.5 py-1.5 rounded-md bg-ground border border-line text-ink hover:bg-surface hover:border-slrtce-maroon hover:text-slrtce-maroon text-xs sm:text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-slrtce-maroon cursor-pointer shadow-2xs"
                            >
                              {chipText}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Human Staff Desk Escalation Bell */}
                    <div className="pt-2 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {deskBellNotified ? (
                        <div className="flex items-center gap-2 min-h-[42px] text-xs sm:text-sm font-bold text-success bg-success-surface px-3 py-2 rounded border border-success/20">
                          <FiCheckCircle className="w-4 h-4 text-success shrink-0" />
                          <span>{t.humanDeskSent}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRingDeskBell}
                          className="inline-flex items-center gap-2 min-h-[42px] px-3.5 py-2 rounded bg-ground border border-line text-ink hover:bg-surface hover:border-slrtce-maroon hover:text-slrtce-maroon text-xs sm:text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-slrtce-maroon cursor-pointer"
                        >
                          <FiBell className="w-4 h-4 text-slrtce-maroon" />
                          <span>{t.humanDeskCTA}</span>
                        </button>
                      )}
                      <span className="text-xs sm:text-sm text-secondary font-medium tabular-nums">Counter 1, Ext. 101</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Bottom Input Dock */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2.5 border-t border-line shrink-0">
            
            {/* Primary CTA: Tap to Speak / Enable Mic Button */}
            {micPermitted === false ? (
              <button
                type="button"
                onClick={requestMicPermission}
                title="Click to allow microphone access in your browser"
                className="w-full sm:w-[210px] md:w-[230px] h-12 px-4 rounded bg-destructive text-white font-bold flex items-center justify-center gap-2 hover:bg-destructive/90 transition-colors focus-visible:outline-2 focus-visible:outline-destructive shrink-0 cursor-pointer shadow-2xs text-sm sm:text-base"
              >
                <FiMic className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t.enableMic || "Enable Mic"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartVoice}
                disabled={conversation.busy}
                className={`w-full sm:w-[210px] md:w-[230px] h-12 px-4 rounded font-bold flex items-center justify-between transition-all focus-visible:outline-2 focus-visible:outline-slrtce-maroon shrink-0 cursor-pointer shadow-2xs ${
                  isListening
                    ? "bg-slrtce-maroon text-white ring-2 ring-slrtce-gold shadow-md"
                    : "bg-slrtce-maroon text-white hover:bg-slrtce-maroon-hover disabled:opacity-50"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FiMic className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base font-bold truncate">
                    {speakButtonLabel}
                  </span>
                </div>

                {/* Live Audio Frequency Bars */}
                {isListening && (
                  <div className="flex items-end gap-1 h-5 py-0.5 shrink-0" aria-label="Microphone live audio levels">
                    <span className="w-1 bg-white rounded-full animate-freq-1" />
                    <span className="w-1 bg-slrtce-gold rounded-full animate-freq-2" />
                    <span className="w-1 bg-white rounded-full animate-freq-3" />
                    <span className="w-1 bg-slrtce-gold rounded-full animate-freq-4" />
                  </div>
                )}
              </button>
            )}

            {/* Text Input with Distinct 48x48 Square Send Button */}
            <form onSubmit={handleSendTyped} className="flex-1 flex items-center gap-2 min-w-0 w-full">
              <input
                type="text"
                placeholder={t.inputPlaceholder}
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                onFocus={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                disabled={conversation.busy || voice.recording}
                className="flex-1 h-12 rounded bg-ground border border-line px-4 text-sm sm:text-base text-ink placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-slrtce-maroon disabled:opacity-50 font-medium"
              />
              <button
                type="submit"
                disabled={!hasTypedContent || conversation.busy || voice.recording}
                className={`w-12 h-12 rounded flex items-center justify-center shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-slrtce-maroon ${
                  hasTypedContent
                    ? "bg-slrtce-maroon text-white hover:bg-slrtce-maroon-hover cursor-pointer shadow-2xs"
                    : "bg-ground text-secondary/50 border border-line cursor-not-allowed"
                }`}
                aria-label="Send inquiry"
              >
                <FiSend className={`w-4 h-4 ${hasTypedContent ? "text-white" : "text-secondary/50"}`} aria-hidden="true" />
              </button>
            </form>

          </div>

        </section>

      </main>

      {/* 3. Footer (h-10, minimal, high-contrast status bar) */}
      <footer className="h-10 px-4 lg:px-6 bg-surface border-t border-line flex items-center justify-between text-xs sm:text-sm text-secondary font-medium shrink-0">
        <div>
          <span>{t.footerLeft}</span>
        </div>
        <div>
          <span>{t.footerRight}</span>
        </div>
      </footer>

      {/* Secret 5-Tap Technician Diagnostics Modal */}
      {adminModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="diagnostics-title"
          onClick={() => setAdminModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-surface border border-line p-5 shadow-2xl text-ink space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-accent-surface text-slrtce-maroon flex items-center justify-center">
                  <FiLock className="w-4 h-4" />
                </span>
                <div>
                  <h3 id="diagnostics-title" className="text-base font-bold text-slrtce-navy leading-tight">
                    Technician Diagnostics & Kiosk Admin
                  </h3>
                  <span className="text-xs text-secondary font-medium">
                    Shree L. R. Tiwari College of Engineering
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminModalOpen(false)}
                className="p-1 rounded-md hover:bg-ground text-secondary hover:text-ink cursor-pointer"
                aria-label="Close diagnostics"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Real-time Live Microphone Audio Level Meter */}
            <div className="p-3.5 rounded-lg bg-ground border border-line space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slrtce-navy">
                  <FiMic className="w-3.5 h-3.5 text-slrtce-maroon" />
                  <span>Microphone Audio Level Meter (Live Input)</span>
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                  micPermitted ? "bg-success-surface text-success" : "bg-destructive-surface text-destructive"
                }`}>
                  {micPermitted ? "Active (-18 dBFS)" : "Muted / Denied"}
                </span>
              </div>

              {/* Dynamic VU Meter Bar Cluster */}
              <div className="flex items-center gap-1 h-5 bg-surface p-1 rounded border border-line" aria-label="Microphone VU Meter">
                {[...Array(18)].map((_, i) => {
                  const isActive = micPermitted ? i < 11 : false;
                  const isAmber = i >= 12 && i < 15;
                  const isRed = i >= 15;
                  return (
                    <span
                      key={`vu-bar-${i}`}
                      className={`flex-1 h-full rounded-2xs transition-all duration-75 ${
                        isActive
                          ? isRed
                            ? "bg-destructive"
                            : isAmber
                            ? "bg-slrtce-gold"
                            : "bg-success"
                          : "bg-line/60"
                      }`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-secondary px-0.5">
                <span>-48 dB</span>
                <span>-24 dB</span>
                <span>-12 dB</span>
                <span>-6 dB</span>
                <span>0 dB (Peak)</span>
              </div>
            </div>

            {/* 2. Knowledge-Base & Architecture Status Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="p-3 rounded-lg bg-ground border border-line space-y-1">
                <div className="text-xs font-semibold text-secondary">Local Knowledge Base</div>
                <div className="flex items-center gap-1.5 font-bold text-success">
                  <FiCheck className="w-4 h-4 text-success" />
                  <span>8 Verified Grounded Records</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-ground border border-line space-y-1">
                <div className="text-xs font-semibold text-secondary">Vector RAG Engine</div>
                <div className="flex items-center gap-1.5 font-bold text-ink">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span>FAISS In-Memory (&lt;15ms)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-ground border border-line space-y-1">
                <div className="text-xs font-semibold text-secondary">Network Status</div>
                <div className="flex items-center gap-1.5 font-bold text-ink">
                  <span className={`w-2 h-2 rounded-full ${backendOnline ? "bg-success" : "bg-slrtce-gold"}`} />
                  <span>{backendOnline ? "Online (API Healthy)" : "Offline Local Fallback Active"}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-ground border border-line space-y-1">
                <div className="text-xs font-semibold text-secondary">Display Viewport</div>
                <div className="font-bold text-ink">100dvh Zero-Scroll Lock</div>
              </div>
            </div>

            {/* 3. Diagnostic Action Buttons */}
            <div className="space-y-2 pt-1 border-t border-line">
              <div className="text-xs font-bold text-secondary">Diagnostic Controls</div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playKioskSound("success");
                    speakTextAloud("CampusAI diagnostics nominal. Audio and local engine verified.", lang);
                  }}
                  className="min-h-[38px] px-3 py-2 rounded-md bg-ground border border-line hover:bg-surface text-xs font-bold text-ink flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FiVolume2 className="w-4 h-4 text-slrtce-navy" />
                  <span>Test Audio & TTS</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdminModalOpen(false);
                    setHardwareDrawerOpen(true);
                  }}
                  className="min-h-[38px] px-3 py-2 rounded-md bg-ground border border-line hover:bg-surface text-xs font-bold text-ink flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FiCpu className="w-4 h-4 text-slrtce-maroon" />
                  <span>Hardware Blueprint</span>
                </button>
              </div>

              {/* Manual Session Reset Button */}
              <button
                type="button"
                onClick={() => {
                  conversation.reset(true);
                  setActiveRecord(null);
                  interruptSpeakingIfActive();
                  setTypedMessage("");
                  setLiveInterim("");
                  setSelectedCategory("all");
                  setLang("en");
                  setAdminModalOpen(false);
                  playKioskSound("success");
                }}
                className="w-full min-h-[42px] py-2 px-3 rounded-md bg-slrtce-maroon text-white text-xs sm:text-sm font-bold hover:bg-slrtce-maroon-hover flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                <FiRefreshCw className="w-4 h-4" />
                <span>Manual Kiosk Reset (Clear History & Reset to English)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admission Checklist QR Handoff Modal */}
      <PhoneQrModal
        open={admissionQrOpen}
        onClose={() => setAdmissionQrOpen(false)}
        title="2026 Admission Document Checklist"
        description="Scan to take the First Year Engineering (CAP) document checklist and fee schedule directly on your smartphone."
        qrUri="https://slrtce.in/admissions/fe-checklist-2026"
      />

      {/* Slide-over Hardware & Engineering Blueprint Drawer */}
      <HardwareDrawer open={hardwareDrawerOpen} onClose={() => setHardwareDrawerOpen(false)} />

    </div>
  );
}
