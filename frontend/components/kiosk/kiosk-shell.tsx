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
import { WayfindingCard } from "./rich-cards";

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

  // Real-time live interim STT transcription & mic permission
  const [liveInterim, setLiveInterim] = useState("");
  const [micPermitted, setMicPermitted] = useState<boolean | null>(null);

  // Hidden technician console (5-tap trigger or 2.5s hold)
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [adminError, setAdminError] = useState(false);
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
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

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

  // Synchronized Clock: "Sat, Nov 14 • 08:00 PM"
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const datePart = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const timePart = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      setTimeFormatted(`${datePart} • ${timePart}`);
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
        speakTextAloud(
          responseText,
          lang,
          () => conversation.setListening(false),
          () => conversation.setListening(false)
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

    if (soundEnabled) {
      const loc = SLRTCE_LOCALIZATION[newLang] || SLRTCE_LOCALIZATION.en;
      speakTextAloud(loc.welcomeGreeting, newLang);
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
      speakTextAloud(greeting, lang);
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
    ? { text: t.afterHoursBadge, class: "bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]" }
    : { text: t.openHoursBadge, class: "bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]" };

  const isListening = conversation.state === "listening";
  const isThinking = conversation.state === "thinking";
  const isSpeaking = conversation.state === "speaking";
  const hasActiveConversation = Boolean(conversation.transcript || conversation.reply);

  const speakButtonLabel = micPermitted === false
    ? "Enable Microphone"
    : isListening
    ? t.listening
    : isThinking
    ? t.processing
    : isSpeaking
    ? t.speaking
    : t.tapToSpeak;

  const hasTypedContent = typedMessage.trim().length > 0;

  return (
    <div className="h-screen h-dvh max-h-screen max-h-dvh overflow-hidden bg-[#F6F5F2] text-[#18181B] flex flex-col justify-between select-none">
      
      {/* 1. Top Institutional Header (h-16, border-b border-[#E2DFD9], border-t-4 border-t-[#7A1C24]) */}
      <header className="h-16 px-4 lg:px-6 bg-[#FFFFFF] border-b border-[#E2DFD9] border-t-4 border-t-[#7A1C24] flex items-center justify-between shrink-0 shadow-2xs">
        
        {/* Left: SLRTCE • CampusAI Reception Desk + Time Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLogoTap}
            onPointerDown={handleLogoPointerDown}
            onPointerUp={handleLogoPointerUp}
            onPointerLeave={handleLogoPointerUp}
            className="text-xl font-black tracking-tight text-[#7A1C24] hover:opacity-95 focus-visible:outline-2 focus-visible:outline-[#7A1C24] rounded-md px-1 cursor-pointer"
            title="SLRTCE Reception Terminal (Tap 5x for hardware diagnostics)"
            aria-label="SLRTCE Home"
          >
            SLRTCE
          </button>

          <span className="text-[#E2DFD9] font-light text-lg">|</span>

          <span className="text-sm font-bold text-[#1B365D] hidden sm:inline-block">
            {t.stationSubtitle}
          </span>

          {/* Time-Aware Operational Badge */}
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full hidden md:inline-flex items-center gap-1.5 ${operationalNotice.class}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>{operationalNotice.text}</span>
          </span>
        </div>

        {/* Right: Hardware & System Status Cluster */}
        <div className="flex items-center gap-2">
          
          {/* Honest Microphone Permission Control */}
          {micPermitted === false && (
            <button
              type="button"
              onClick={requestMicPermission}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] text-xs font-bold hover:bg-[#FECACA] motion-safe:transition-colors cursor-pointer"
              title="Microphone access is blocked by your browser. Click to prompt permission."
            >
              <FiMic className="w-3.5 h-3.5" />
              <span>Enable Microphone</span>
            </button>
          )}

          {/* Voice Output Speaker Toggle */}
          <button
            type="button"
            onClick={() => {
              if (soundEnabled) stopSpeaking();
              setSoundEnabled(!soundEnabled);
              playKioskSound("tap");
            }}
            className="min-h-[36px] flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FFFFFF] border border-[#E2DFD9] hover:bg-[#F6F5F2] text-xs font-semibold text-[#18181B] motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-[#7A1C24]"
            aria-label={soundEnabled ? "Voice output enabled. Click to mute." : "Voice output muted. Click to enable."}
          >
            {soundEnabled ? (
              <FiVolume2 className="w-3.5 h-3.5 text-[#7A1C24] shrink-0" aria-hidden="true" />
            ) : (
              <FiVolumeX className="w-3.5 h-3.5 text-[#52525B] shrink-0" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{soundEnabled ? t.voiceOutputOn : t.voiceOutputMuted}</span>
          </button>

          {/* Engine Status Pill */}
          <div className="min-h-[36px] flex items-center gap-1.5 px-3 rounded-md bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#15803D] shrink-0" aria-hidden="true" />
            <span>{demoMode || backendOnline === false ? t.statusLocalActive : t.statusReady}</span>
          </div>

          {/* Precision Clock: "Sat, Nov 14 • 08:00 PM" */}
          <div className="hidden lg:flex items-center text-xs font-bold text-[#18181B] pl-2 border-l border-[#E2DFD9]">
            {timeFormatted}
          </div>
        </div>
      </header>

      {/* 2. Main Kiosk Architectural Grid (grid-cols-12, 100dvh Lock) */}
      <main className="flex-1 p-3.5 lg:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0 overflow-hidden">
        
        {/* Left Sidebar: Campus Directory (col-span-4, flat structured panel) */}
        <aside className="lg:col-span-4 bg-[#FFFFFF] border border-[#E2DFD9] rounded-lg p-3.5 flex flex-col justify-between min-h-0 h-full shadow-2xs">
          
          <div>
            <div className="flex items-center justify-between pb-1 border-b border-[#E2DFD9]">
              <h1 className="text-sm font-bold text-[#1B365D]">
                {t.directoryHeading}
              </h1>
              <span className="text-[11px] font-semibold text-[#52525B]">
                SLRTCE Campus
              </span>
            </div>
            <p className="text-xs text-[#52525B] mt-1 font-medium">
              {t.directorySubtitle}
            </p>

            {/* Filter Tabs: Single horizontal row with zero awkward line breaks */}
            <div className="flex items-center gap-1 mt-2.5 pb-2 border-b border-[#E2DFD9] overflow-x-auto scroll-slim flex-nowrap">
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
                    className={`px-2 py-1 text-xs font-semibold rounded-md whitespace-nowrap motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-[#7A1C24] shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-[#7A1C24] text-[#FFFFFF]"
                        : "bg-[#FFFFFF] text-[#52525B] border border-[#E2DFD9] hover:bg-[#F6F5F2] hover:text-[#18181B]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Directory Items with Structured Metadata Badges */}
          <nav className="flex-1 overflow-y-auto space-y-1.5 scroll-slim my-2 pr-1" aria-label="SLRTCE Directory Inquiries">
            {filteredDirectory.map((item) => {
              const isBusy = conversation.busy || voice.recording;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => !isBusy && executeQuery(item.prompt)}
                  disabled={isBusy}
                  className="w-full p-2.5 rounded-lg border border-[#E2DFD9] bg-[#FFFFFF] hover:bg-[#F6F5F2] hover:border-[#CDC9C0] text-left motion-safe:transition-colors flex items-start gap-2.5 focus-visible:outline-2 focus-visible:outline-[#7A1C24] disabled:opacity-50 cursor-pointer"
                >
                  <span className="w-7 h-7 rounded-md bg-[#7A1C24]/10 text-[#7A1C24] flex items-center justify-center shrink-0 mt-0.5">
                    <FiMapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[#18181B] truncate">{item.title}</span>
                      <span className="text-[10px] font-semibold text-[#D99B26] bg-[#FEF3C7] px-1.5 py-0.5 rounded shrink-0">
                        {item.floorBadge}
                      </span>
                    </div>
                    
                    <div className="text-[11px] text-[#52525B] mt-0.5 truncate">{item.subtitle}</div>
                    
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] font-semibold text-[#1B365D] bg-[#F6F5F2] border border-[#E2DFD9] px-1.5 py-0.2 rounded">
                        {item.deptBadge}
                      </span>
                      <span className="text-[10px] font-medium text-[#52525B]">
                        {item.roomBadge}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Bottom Language Switcher */}
          <fieldset className="pt-2 border-t border-[#E2DFD9]">
            <legend className="text-xs font-bold text-[#1B365D] mb-1.5 flex items-center gap-1.5">
              <FiGlobe className="w-3.5 h-3.5 text-[#7A1C24]" aria-hidden="true" />
              <span>{t.languageLabel}</span>
            </legend>
            
            <div className="flex gap-1 bg-[#F6F5F2] p-1 rounded-md border border-[#E2DFD9]">
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
                  className={`flex-1 min-h-[32px] py-1 text-xs font-bold rounded motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-[#7A1C24] cursor-pointer ${
                    lang === lCode.code
                      ? "bg-[#7A1C24] text-[#FFFFFF] shadow-2xs"
                      : "text-[#52525B] hover:text-[#18181B] hover:bg-[#FFFFFF]"
                  }`}
                >
                  {lCode.label}
                </button>
              ))}
            </div>
          </fieldset>

        </aside>

        {/* Right Main Panel: Interactive Dialogue Stage (col-span-8, flex flex-col) */}
        <section className="lg:col-span-8 bg-[#FFFFFF] border border-[#E2DFD9] rounded-lg p-3.5 flex flex-col justify-between min-h-0 h-full shadow-2xs">
          
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#E2DFD9] shrink-0 min-h-[44px]">
            <div className="flex items-center gap-2.5">
              {/* Embodied Compact Robot Avatar when conversation is active */}
              {hasActiveConversation ? (
                <div
                  onClick={handleRobotClick}
                  tabIndex={0}
                  role="button"
                  aria-label="SLRTCE Assistant. Tap to interact."
                  className="w-9 h-9 rounded-full bg-[#F6F5F2] border border-[#E2DFD9] flex items-center justify-center overflow-hidden shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#7A1C24]"
                  title="Tap robot to interact"
                >
                  <CampusRobot state={conversation.state} distance={7.5} />
                </div>
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-[#7A1C24]" aria-hidden="true" />
              )}
              
              <div>
                <span className="text-sm font-bold text-[#1B365D] block leading-tight">{t.liveAssistant}</span>
                <span className="text-[11px] text-[#52525B] font-medium">SLRTCE Reception Terminal</span>
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
                className="text-xs font-semibold text-[#52525B] hover:text-[#7A1C24] flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#E2DFD9] hover:bg-[#F6F5F2] motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-[#7A1C24] cursor-pointer"
              >
                <FiRotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.resetSession}</span>
              </button>
            )}
          </div>

          {/* Dialogue Area: Seamless Stream (Hero Welcome State OR Active Clean Stream) */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 scroll-slim py-2 pr-1">
            {!hasActiveConversation ? (
              
              /* Hero Welcome State: Clean Horizontal Robot Card + 3 Touch Action Cards */
              <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto py-2">
                
                {/* Horizontal Centered Robot & Welcome Card */}
                <div className="w-full p-4 rounded-lg bg-[#F6F5F2] border border-[#E2DFD9] flex flex-col sm:flex-row items-center gap-4">
                  
                  {/* 3D Robot Avatar with Crest Gold audio ring */}
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
                    aria-label="SLRTCE Reception Robot. Tap to interact."
                    className="relative w-[110px] h-[110px] sm:w-[125px] sm:h-[125px] flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#7A1C24] rounded-full"
                    title="Tap robot to interact"
                  >
                    {/* Crest Gold audio pulse ring */}
                    {conversation.state === "speaking" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                        <div className="motion-safe:animate-sound-ring-1 absolute w-24 h-24 rounded-full border border-[#D99B26]/80" />
                        <div className="motion-safe:animate-sound-ring-2 absolute w-24 h-24 rounded-full border border-[#D99B26]/50" />
                      </div>
                    )}

                    {/* Seamless transparent pedestal without bright white box clash */}
                    <div className="absolute inset-1 rounded-full bg-[#F6F5F2] border border-[#E2DFD9]" aria-hidden="true" />

                    <div className="relative w-full h-full z-10" aria-hidden="true">
                      <CampusRobot state={conversation.state} distance={8.5} />
                    </div>
                  </div>

                  {/* SLRTCE Maroon Welcome Bubble */}
                  <div className="flex-1 min-w-0 p-3.5 rounded-lg bg-[#7A1C24] text-[#FFFFFF] shadow-xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#D99B26] mb-1">
                      SLRTCE Campus Reception
                    </div>
                    <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                      {t.welcomeGreeting}
                    </p>
                  </div>
                </div>

                {/* Honest Microphone Access Notification if blocked */}
                {micPermitted === false && (
                  <div className="w-full mt-3 p-3 rounded-md bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-between gap-2 text-xs font-semibold text-[#B91C1C]">
                    <div className="flex items-center gap-2">
                      <FiAlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Microphone access is blocked by browser — tap Enable Microphone or select any touch inquiry below.</span>
                    </div>
                    <button
                      type="button"
                      onClick={requestMicPermission}
                      className="px-2.5 py-1 rounded bg-[#B91C1C] text-white font-bold text-xs hover:bg-[#991B1B] shrink-0 cursor-pointer"
                    >
                      Enable Mic
                    </button>
                  </div>
                )}

                {/* Lower Half: 3 Large Touch Action Cards with Specific Category Eyebrows */}
                <div className="w-full mt-4 space-y-2">
                  <div className="text-xs font-bold text-[#1B365D] uppercase tracking-wider text-center">
                    {t.suggestedHeading}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {SLRTCE_QUICK_PROMPTS.map((quick) => {
                      const Icon = quick.icon;
                      return (
                        <button
                          key={quick.label}
                          type="button"
                          onClick={() => executeQuery(quick.prompt)}
                          className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E2DFD9] hover:border-[#7A1C24] hover:bg-[#FDF2F3] text-left motion-safe:transition-all focus-visible:outline-2 focus-visible:outline-[#7A1C24] cursor-pointer group flex flex-col justify-between min-h-[90px] shadow-2xs"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A1C24] bg-[#7A1C24]/10 px-1.5 py-0.5 rounded">
                              {quick.eyebrow}
                            </span>
                            <Icon className="w-3.5 h-3.5 text-[#7A1C24]" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#18181B] group-hover:text-[#7A1C24] leading-snug">
                              {quick.label}
                            </div>
                            <div className="text-[11px] font-medium text-[#52525B] mt-1 leading-tight">
                              {quick.subtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

            ) : (

              /* Active Conversation Stream: Pure Crisp White Card (NO Duplicate Top Bubble) */
              <>
                {/* Visitor Speech Bubble */}
                {conversation.transcript && (
                  <div className="self-end ml-auto bg-[#F6F5F2] border border-[#E2DFD9] text-xs sm:text-sm text-[#18181B] p-3 rounded-lg max-w-[85%] sm:max-w-[75%] shadow-2xs">
                    <div className="text-[11px] text-[#52525B] font-bold mb-0.5">Visitor</div>
                    <div className="font-semibold">{conversation.transcript}</div>
                  </div>
                )}

                {/* Live Interim Streaming Indicator */}
                {liveInterim && (
                  <div className="self-end ml-auto bg-[#FDF2F3] border border-[#7A1C24]/30 text-xs sm:text-sm text-[#7A1C24] p-2.5 rounded-lg max-w-[85%] font-medium animate-pulse">
                    <span className="text-[10px] font-bold block text-[#7A1C24]">Transcribing live speech…</span>
                    {liveInterim}
                  </div>
                )}

                {/* Processing Spinner */}
                {conversation.state === "thinking" && (
                  <div className="self-start text-xs font-semibold text-[#52525B] flex items-center gap-2 px-1">
                    <Spinner />
                    <span>{t.processing}</span>
                  </div>
                )}

                {/* Assistant Speech Bubble: Crisp #FFFFFF with Maroon Accent Border (No Pink Tint) */}
                {conversation.reply && (
                  <div className="self-start mr-auto bg-[#FFFFFF] border border-[#E2DFD9] border-l-4 border-l-[#7A1C24] text-[#18181B] text-xs sm:text-sm p-4 rounded-lg max-w-[96%] sm:max-w-[90%] space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-[#E2DFD9] pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#7A1C24]" />
                        <span className="text-xs font-bold text-[#7A1C24]">SLRTCE Assistant</span>
                      </div>
                      <span className="text-[11px] text-[#52525B] font-semibold">Mira Road (E)</span>
                    </div>

                    <div className="leading-relaxed font-medium text-[#18181B]">{conversation.reply}</div>

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
                      <div className="rounded-lg border border-[#E2DFD9] bg-[#F6F5F2] p-2.5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[#1B365D]">
                          <span>{activeRecord.timetableDetails.semester}</span>
                          <span className="text-[10px] bg-[#FEF3C7] text-[#B45309] px-2 py-0.5 rounded font-semibold">
                            {activeRecord.timetableDetails.examCell}
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs bg-[#FFFFFF] rounded border border-[#E2DFD9]">
                            <thead className="bg-[#F6F5F2] text-[11px] text-[#52525B] border-b border-[#E2DFD9]">
                              <tr>
                                <th className="p-2">Date & Time</th>
                                <th className="p-2">Subject</th>
                                <th className="p-2">Room</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2DFD9]">
                              {activeRecord.timetableDetails.scheduleHighlights.map((row) => (
                                <tr key={row.subject}>
                                  <td className="p-2 whitespace-nowrap font-bold text-[#18181B]">{row.date} ({row.time})</td>
                                  <td className="p-2 text-[#7A1C24] font-medium">{row.subject}</td>
                                  <td className="p-2 text-[#52525B] font-semibold">{row.room}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Structured Fee Breakdown */}
                    {activeRecord?.feeBreakdown && (
                      <div className="rounded-lg border border-[#E2DFD9] bg-[#F6F5F2] p-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold text-[#1B365D]">
                          <span>{activeRecord.feeBreakdown.course}</span>
                          <span className="text-[#7A1C24] text-sm">{activeRecord.feeBreakdown.totalAnnual}</span>
                        </div>
                        <div className="text-[11px] text-[#52525B]">
                          <strong>Eligibility:</strong> {activeRecord.feeBreakdown.eligibility}
                        </div>
                        <div className="text-[10px] text-[#D99B26] font-semibold bg-[#FEF3C7] inline-block px-2 py-0.5 rounded">
                          {activeRecord.feeBreakdown.capCode}
                        </div>
                      </div>
                    )}

                    {/* Deduplicated Related Inquiries Chips */}
                    {activeRecord?.followUps && activeRecord.followUps.length > 0 && (
                      <div className="pt-2 border-t border-[#E2DFD9] space-y-1.5">
                        <div className="text-[10px] font-bold text-[#52525B] flex items-center gap-1">
                          <FiCornerDownRight className="w-3.5 h-3.5 text-[#7A1C24]" />
                          <span>Related Inquiries</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {activeRecord.followUps.map((chipText) => (
                            <button
                              key={chipText}
                              type="button"
                              onClick={() => executeQuery(chipText)}
                              className="px-2.5 py-1 rounded-md bg-[#F6F5F2] border border-[#E2DFD9] text-[#18181B] hover:bg-[#FFFFFF] hover:border-[#7A1C24] hover:text-[#7A1C24] text-xs font-semibold motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-[#7A1C24] cursor-pointer"
                            >
                              {chipText}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Human Reception Desk Escalation Bell */}
                    <div className="pt-2 border-t border-[#E2DFD9] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {deskBellNotified ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#15803D] bg-[#DCFCE7] px-2.5 py-1 rounded-md border border-[#BBF7D0]">
                          <FiCheckCircle className="w-4 h-4 text-[#15803D] shrink-0" />
                          <span>{t.humanDeskSent}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRingDeskBell}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F6F5F2] border border-[#E2DFD9] text-[#18181B] hover:bg-[#FFFFFF] hover:border-[#7A1C24] hover:text-[#7A1C24] text-xs font-semibold motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-[#7A1C24] cursor-pointer"
                        >
                          <FiBell className="w-3.5 h-3.5 text-[#7A1C24]" />
                          <span>{t.humanDeskCTA}</span>
                        </button>
                      )}
                      <span className="text-[11px] text-[#52525B] font-medium">Counter 1 • Ext 101</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Bottom Input Dock */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2.5 border-t border-[#E2DFD9] shrink-0">
            
            {/* Primary CTA: Tap to Speak / Enable Mic Button */}
            {micPermitted === false ? (
              <button
                type="button"
                onClick={requestMicPermission}
                className="w-full sm:w-[200px] md:w-[220px] h-11 px-3.5 rounded-md bg-[#B91C1C] text-[#FFFFFF] font-bold flex items-center justify-center gap-2 hover:bg-[#991B1B] motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-[#B91C1C] shrink-0 cursor-pointer shadow-2xs text-xs sm:text-sm"
              >
                <FiMic className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Enable Microphone</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartVoice}
                disabled={conversation.busy}
                className="w-full sm:w-[190px] md:w-[210px] h-11 px-3.5 rounded-md bg-[#7A1C24] text-[#FFFFFF] font-bold flex items-center justify-between hover:bg-[#5C1319] disabled:opacity-50 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-[#7A1C24] shrink-0 cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FiMic className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="text-xs sm:text-sm font-bold truncate">
                    {speakButtonLabel}
                  </span>
                </div>

                {/* Animated Waveform Bars when listening */}
                {conversation.state === "listening" && (
                  <div className="flex items-center gap-0.5 h-3.5 shrink-0" aria-hidden="true">
                    {[30, 80, 50, 95, 60, 40, 85, 45].map((h, i) => (
                      <span
                        key={`bar-${i}`}
                        className="w-0.5 bg-[#FFFFFF] rounded-full motion-safe:animate-wave-bar"
                        style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
                      />
                    ))}
                  </div>
                )}
              </button>
            )}

            {/* Text Input with Distinct 40x40 Square Send Button */}
            <form onSubmit={handleSendTyped} className="flex-1 flex items-center gap-2 min-w-0 w-full">
              <input
                type="text"
                placeholder={t.inputPlaceholder}
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                onFocus={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                disabled={conversation.busy || voice.recording}
                className="flex-1 h-11 rounded-md bg-[#F6F5F2] border border-[#E2DFD9] px-3.5 text-xs sm:text-sm text-[#18181B] placeholder:text-[#52525B] focus-visible:outline-2 focus-visible:outline-[#7A1C24] disabled:opacity-50 font-medium"
              />
              <button
                type="submit"
                disabled={!hasTypedContent || conversation.busy || voice.recording}
                className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-[#7A1C24] ${
                  hasTypedContent
                    ? "bg-[#7A1C24] text-[#FFFFFF] hover:bg-[#5C1319] cursor-pointer shadow-sm"
                    : "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                }`}
                aria-label="Send inquiry"
              >
                <FiSend className={`w-4 h-4 ${hasTypedContent ? "text-white" : "text-zinc-400"}`} aria-hidden="true" />
              </button>
            </form>

          </div>

        </section>

      </main>

      {/* 3. Footer (h-9, minimal, high-contrast status bar) */}
      <footer className="h-9 px-4 lg:px-6 bg-[#FFFFFF] border-t border-[#E2DFD9] flex items-center justify-between text-xs text-[#52525B] font-medium shrink-0">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#12100E]/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-lg bg-[#FFFFFF] border border-[#E2DFD9] p-5 shadow-2xl text-[#18181B] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2DFD9] pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1B365D]">
                <FiLock className="w-4 h-4 text-[#7A1C24]" />
                <span>SLRTCE Kiosk Hardware Diagnostics</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdminModalOpen(false);
                  setAdminPin("");
                  setAdminError(false);
                }}
                className="p-1 rounded hover:bg-[#F6F5F2] text-[#52525B] hover:text-[#18181B] cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-md bg-[#F6F5F2] border border-[#E2DFD9] space-y-1">
                <div className="text-[11px] font-semibold text-[#52525B]">Audio Microphone</div>
                <div className="flex items-center gap-1.5 font-bold text-[#15803D]">
                  <FiCheck className="w-3.5 h-3.5" />
                  <span>{micPermitted ? "Microphone Permitted" : "Microphone Blocked"}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-[#F6F5F2] border border-[#E2DFD9] space-y-1">
                <div className="text-[11px] font-semibold text-[#52525B]">SLRTCE Knowledge Base</div>
                <div className="flex items-center gap-1.5 font-bold text-[#15803D]">
                  <FiCheck className="w-3.5 h-3.5" />
                  <span>6 Grounded Records</span>
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-[#F6F5F2] border border-[#E2DFD9] space-y-1">
                <div className="text-[11px] font-semibold text-[#52525B]">Network Status</div>
                <div className="flex items-center gap-1.5 font-bold text-[#18181B]">
                  <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                  <span>{backendOnline ? "Online (Healthy)" : "Offline (Local Engine Active)"}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-[#F6F5F2] border border-[#E2DFD9] space-y-1">
                <div className="text-[11px] font-semibold text-[#52525B]">Viewport Lock</div>
                <div className="font-bold text-[#18181B]">100dvh Zero-Scroll</div>
              </div>
            </div>

            <div className="flex gap-2 pt-1 border-t border-[#E2DFD9]">
              <button
                type="button"
                onClick={() => {
                  conversation.reset(true);
                  setActiveRecord(null);
                  stopSpeaking();
                  setTypedMessage("");
                  setAdminModalOpen(false);
                  playKioskSound("success");
                }}
                className="flex-1 py-2 px-3 rounded-md bg-[#F6F5F2] border border-[#E2DFD9] hover:bg-[#FFFFFF] text-xs font-semibold text-[#18181B] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FiRefreshCw className="w-3.5 h-3.5 text-[#7A1C24]" />
                <span>Reset Session</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdminModalOpen(false);
                  setHardwareDrawerOpen(true);
                }}
                className="flex-1 py-2 px-3 rounded-md bg-[#7A1C24] text-[#FFFFFF] text-xs font-semibold hover:bg-[#5C1319] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FiCpu className="w-3.5 h-3.5" />
                <span>ESP32 Blueprint</span>
              </button>
            </div>

            <form onSubmit={handleAdminPinSubmit} className="pt-2 border-t border-[#E2DFD9] space-y-2">
              <div className="text-[11px] font-medium text-[#52525B]">Enter Admin PIN (Default: 1234):</div>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={4}
                  value={adminPin}
                  onChange={(e) => {
                    setAdminPin(e.target.value);
                    setAdminError(false);
                  }}
                  placeholder="PIN"
                  className="flex-1 h-9 rounded-md bg-[#F6F5F2] border border-[#E2DFD9] px-3 text-center text-sm tracking-widest font-mono text-[#18181B] focus-visible:outline-2 focus-visible:outline-[#7A1C24]"
                />
                <button
                  type="submit"
                  className="px-4 h-9 rounded-md bg-[#7A1C24] text-[#FFFFFF] text-xs font-semibold hover:bg-[#5C1319] cursor-pointer"
                >
                  Unlock
                </button>
              </div>
              {adminError && (
                <div className="text-xs text-[#B91C1C] font-semibold text-center">
                  Invalid PIN. Default is 1234.
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Slide-over Hardware & Engineering Blueprint Drawer */}
      <HardwareDrawer open={hardwareDrawerOpen} onClose={() => setHardwareDrawerOpen(false)} />

    </div>
  );
}
