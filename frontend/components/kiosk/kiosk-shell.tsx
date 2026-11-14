"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMic,
  FiCamera,
  FiCameraOff,
  FiCpu,
  FiMapPin,
  FiInfo,
  FiCalendar,
  FiSend,
  FiTrash2,
  FiAlertCircle,
  FiChevronRight,
  FiLayers,
  FiVolume2,
  FiVolumeX,
  FiCompass,
} from "react-icons/fi";
import { LuGraduationCap } from "react-icons/lu";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useConversation } from "@/hooks/use-conversation";
import { useVoice } from "@/hooks/use-voice";
import { useCamera } from "@/hooks/use-camera";
import { useEmotion } from "@/hooks/use-emotion";
import { checkBackendHealth } from "@/lib/api/chat";
import type { LanguageCode } from "@/lib/kiosk/types";
import { HardwareDrawer } from "./hardware-drawer";
import { findGroundedRecord, type GroundedCampusRecord } from "@/lib/kiosk/campus-knowledge";
import { speakTextAloud, stopSpeaking } from "@/lib/kiosk/speech-synth";

const CampusRobot = dynamic(
  () => import("@/components/robot/campus-robot"),
  {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-surface-muted rounded-full" />,
  }
);

function Spinner() {
  const reduceMotion = typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <motion.span
      className="w-5 h-5 rounded-full border-2 border-line border-t-accent shrink-0"
      animate={reduceMotion ? {} : { rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      role="status"
      aria-label="Loading"
    />
  );
}

const QUICK_ACTIONS = [
  { label: "Find a Location", icon: FiMapPin, hint: "Try: Where is Dr. Sharma’s cabin?", prompt: "Where is Dr. Rajesh Sharma's cabin?" },
  { label: "Admissions & Fees", icon: LuGraduationCap, hint: "Try: How do I apply for B.Tech AI?", prompt: "What are the fees and eligibility for B.Tech AI & Data Science?" },
  { label: "Exam Schedules", icon: FiCalendar, hint: "Try: When do semester exams start?", prompt: "What is the examination timetable for semester 3?" },
  { label: "Library & Canteen", icon: FiInfo, hint: "Try: What are the library timings?", prompt: "When does the central library and reading hall open?" },
];

const SUGGESTION_CHIPS = [
  "Dr. Rajesh Sharma's cabin",
  "B.Tech AI-DS fees",
  "Central Library timings",
  "Exam Cell Room A-104",
];

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
  const [activeRecord, setActiveRecord] = useState<GroundedCampusRecord | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setDateStr(d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }));
    };
    updateTime();
    const t = setInterval(updateTime, 60000);
    return () => clearInterval(t);
  }, []);

  const camera = useCamera();
  const emotion = useEmotion(demoMode);

  // Intelligent offline or live voice response dispatcher
  const executeQuery = (queryText: string) => {
    const clean = queryText.trim();
    if (!clean) return;

    // Check offline knowledge base
    const matched = findGroundedRecord(clean);
    setActiveRecord(matched);

    if (demoMode || backendOnline === false) {
      let responseText = "I have checked the college directory. Please specify if you need admissions, faculty cabins, or exam schedules.";
      if (matched) {
        if (lang === "hi") responseText = matched.replyHi;
        else if (lang === "mr") responseText = matched.replyMr;
        else responseText = matched.replyEn;
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
  };

  const voice = useVoice({
    demoMode,
    onRecordingComplete: async (audio) => {
      if (demoMode || backendOnline === false) {
        executeQuery("Where is Dr. Rajesh Sharma's cabin?");
        return;
      }
      await conversation.answerVoiceEndToEnd(audio);
    },
    onListeningChange: (listening) => conversation.setListening(listening),
    onError: (msg) => conversation.showError(msg),
  });

  // Browser speech recognition fallback for direct interactive speech
  const handleStartVoice = () => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      try {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const rec = new SpeechRec();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";

        conversation.setListening(true);

        rec.onresult = (event: any) => {
          const spoken = event.results[0][0].transcript;
          conversation.setListening(false);
          executeQuery(spoken);
        };

        rec.onerror = () => {
          conversation.setListening(false);
          voice.startRecording();
        };

        rec.onend = () => {
          conversation.setListening(false);
        };

        rec.start();
        return;
      } catch {
        // Fall back to standard audio recorder
      }
    }
    voice.startRecording();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1") setDemoMode(true);
  }, []);

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

  useEffect(() => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (conversation.state === "idle" && !conversation.reply) return;
    idleTimerRef.current = window.setTimeout(() => {
      void conversation.reset();
      setActiveRecord(null);
      stopSpeaking();
    }, 90_000);
    return () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [conversation.reply, conversation.state, conversation]);

  const handleQuickAction = (prompt: string) => {
    executeQuery(prompt);
  };

  const handleRetry = async () => {
    setBackendOnline(null);
    try {
      const healthy = await checkBackendHealth();
      setBackendOnline(healthy);
    } catch {
      setBackendOnline(false);
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
    const robotGreeting =
      lang === "hi"
        ? "नमस्ते! मैं CampusAI हूँ। आप मुझसे कॉलेज के बारे में कुछ भी पूछ सकते हैं।"
        : lang === "mr"
        ? "नमस्कार! मी CampusAI आहे. आपण मला कॉलेजबद्दल काहीही विचारू शकता."
        : "Hello! I am CampusAI, your receptionist. Feel free to speak or tap any inquiry.";

    conversation.showDemoAnswer("Hello CampusAI!", robotGreeting);
    if (soundEnabled) {
      speakTextAloud(robotGreeting, lang);
    }
  };

  const greeting =
    conversation.state === "idle" && !conversation.reply
      ? lang === "en"
        ? "Hello! Walk up and speak naturally, or touch an option below."
        : lang === "hi"
        ? "नमस्ते! आप सीधे बोलकर या नीचे दिए विकल्पों को छूकर पूछ सकते हैं।"
        : "नमस्कार! थेट बोला किंवा खालील पर्याय निवडून मदत मिळवा."
      : conversation.reply;

  return (
    <div className="min-h-screen bg-ground text-ink flex flex-col justify-between p-4 sm:p-6 lg:p-8 overflow-x-clip select-none">
      
      {/* Top Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-accent rounded-lg"
            aria-label="CampusAI Kiosk home"
          >
            <span className="w-3 h-3 rounded-full bg-accent inline-block" />
            <span>Campus<span className="text-accent">AI</span></span>
          </button>
          <span className="px-2.5 py-1 rounded-md bg-surface border border-line text-xs font-semibold text-secondary">
            Reception Kiosk
          </span>
        </div>

        {/* Status Indicators & Blueprint Drawer Launcher */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Sound Mute / Unmute Toggle */}
          <button
            type="button"
            onClick={() => {
              if (soundEnabled) stopSpeaking();
              setSoundEnabled(!soundEnabled);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-line hover:bg-surface-muted text-xs font-bold text-ink shadow-2xs motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98"
            aria-label={soundEnabled ? "Mute audio" : "Enable voice audio"}
          >
            {soundEnabled ? (
              <FiVolume2 className="w-4 h-4 text-accent" aria-hidden="true" />
            ) : (
              <FiVolumeX className="w-4 h-4 text-secondary" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{soundEnabled ? "Audio on" : "Audio muted"}</span>
          </button>

          {/* Hardware & Engineering Specs Drawer Button */}
          <button
            type="button"
            onClick={() => setHardwareDrawerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-line hover:bg-surface-muted text-xs font-bold text-ink shadow-2xs motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98"
          >
            <FiCpu className="w-4 h-4 text-accent" aria-hidden="true" />
            <span>Hardware specs</span>
          </button>

          {/* Connection Status Pill */}
          <div className="h-9 flex items-center gap-2 px-3 rounded-xl border border-line bg-surface text-xs font-bold">
            <span
              className={`w-2 h-2 rounded-full ${
                demoMode || backendOnline === false ? "bg-warning" : "bg-success"
              }`}
            />
            <span>{demoMode ? "Demo mode" : backendOnline === false ? "Standby ready" : "Online"}</span>
          </div>

          {/* Clock */}
          <div className="hidden sm:flex flex-col items-end justify-center text-right pl-2">
            <span className="text-xs text-secondary font-medium">{dateStr}</span>
            <span className="text-sm font-bold tracking-tight text-ink">{timeStr}</span>
          </div>

          {/* Camera Mood Estimation Toggle */}
          <button
            type="button"
            onClick={() => (camera.state === "active" ? camera.stop() : camera.start())}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-line hover:bg-surface-muted text-xs font-bold text-ink shadow-2xs motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98"
            aria-label="Toggle camera mood estimation"
          >
            {camera.state === "active" ? (
              <span className="w-2 h-2 rounded-full bg-success" />
            ) : (
              <FiCameraOff className="w-4 h-4 text-secondary" />
            )}
            <span className="hidden md:inline">{camera.state === "active" ? "Vision active" : "Enable vision"}</span>
          </button>
        </div>
      </header>

      {/* Backend Offline Info Banner */}
      {backendOnline === false && !demoMode && (
        <div className="mt-4 p-4 rounded-xl bg-surface border border-warning flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-warning">
            <FiAlertCircle className="w-4 h-4 shrink-0" />
            <span>Cloud server is on standby. Local campus knowledge engine and neural voice speech are active.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRetry}
              className="px-3 py-1.5 rounded-lg border border-warning text-warning text-xs font-bold hover:bg-warning/10 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => setDemoMode(true)}
              className="px-3 py-1.5 rounded-lg bg-warning text-surface text-xs font-bold hover:bg-warning/90 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Kiosk Operational Layout */}
      <main className="flex-1 my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Quick Action Touch Buttons (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-secondary">College helpdesk</div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink leading-tight mt-1">
              Ask Campus<span className="text-accent">AI</span>
            </h1>
            <p className="text-sm font-medium text-secondary mt-1">
              Tap any category, suggestion chip, or speak naturally.
            </p>
          </div>

          {/* Quick Buttons Grid */}
          <div className="grid grid-cols-1 gap-2.5 my-auto" role="group" aria-label="Quick inquiry options">
            {QUICK_ACTIONS.map(({ label, icon: Icon, hint, prompt }) => {
              const isBusy = conversation.busy || voice.recording;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => !isBusy && handleQuickAction(prompt)}
                  disabled={isBusy}
                  className="p-3.5 rounded-2xl bg-surface border border-line hover:border-line-strong hover:bg-surface-muted/60 disabled:opacity-50 disabled:cursor-not-allowed motion-safe:transition-colors flex items-center justify-between gap-3 text-left shadow-2xs focus-visible:outline-2 focus-visible:outline-accent active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <div>
                      <div className="text-sm font-bold text-ink">{label}</div>
                      <div className="text-xs text-secondary line-clamp-1">{hint}</div>
                    </div>
                  </div>
                  <FiChevronRight className="w-5 h-5 text-secondary shrink-0" aria-hidden="true" />
                </button>
              );
            })}
          </div>

          {/* Language Switcher Bar */}
          <fieldset
            className="flex items-center p-1 bg-surface rounded-xl border border-line shadow-2xs"
            aria-label="Kiosk voice language"
          >
            <legend className="sr-only">Kiosk voice language</legend>
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
                onClick={() => setLang(lCode.code)}
                aria-pressed={lang === lCode.code}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98 ${
                  lang === lCode.code
                    ? "bg-ink text-surface shadow-2xs"
                    : "text-secondary hover:text-ink hover:bg-surface-muted"
                }`}
              >
                {lCode.label}
              </button>
            ))}
          </fieldset>
        </div>

        {/* Center Column: Interactive 3D Robot Appliance Stage (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center relative min-h-[340px]">
          <div
            onClick={handleRobotClick}
            className="relative w-full max-w-sm aspect-square rounded-3xl bg-surface border border-line p-4 shadow-xs flex flex-col items-center justify-center overflow-hidden cursor-pointer group"
            title="Tap robot to interact"
          >
            {/* Interactive Tap Hint */}
            <div className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded-md bg-ground/90 border border-line text-[10px] font-bold text-secondary group-hover:text-accent motion-safe:transition-colors">
              Tap robot
            </div>

            {/* Architectural backdrop circle */}
            <div className="absolute inset-8 rounded-full border border-line overflow-hidden opacity-40">
              <Image src="/images/campus-bg.jpg" alt="Campus background" fill className="object-cover" priority />
            </div>

            {/* 3D Robot Canvas */}
            <div className="relative w-full h-full z-10" aria-hidden="true">
              <CampusRobot state={conversation.state} distance={10.5} />
            </div>

            {/* Spoken Response Cloud Bubble */}
            {greeting && (
              <div
                className="absolute top-4 left-4 right-4 z-20 p-3 rounded-xl bg-surface/95 backdrop-blur-sm border border-line shadow-xs text-xs font-medium text-ink"
                role="status"
                aria-live="polite"
              >
                <div className="text-[11px] font-bold text-accent mb-0.5">CampusAI Receptionist</div>
                <p className="leading-snug">{greeting}</p>
              </div>
            )}

            {/* Camera Emotion Badge */}
            {emotion.state.emotion && camera.state === "active" && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-surface border border-line text-xs font-bold text-ink shadow-xs capitalize">
                Mood: {emotion.state.emotion}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Conversation & Rich Interactive Feed (4 cols) */}
        <div className="lg:col-span-4 rounded-3xl bg-surface border border-line p-5 flex flex-col justify-between gap-3.5 shadow-xs">
          
          {/* Conversation Feed Header */}
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <span className="text-xs font-bold text-secondary">Live dialogue feed</span>
            <button
              type="button"
              onClick={() => {
                conversation.reset(true);
                setActiveRecord(null);
                stopSpeaking();
              }}
              className="text-xs font-semibold text-secondary hover:text-ink flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-accent rounded px-2 py-1 active:scale-98"
            >
              <FiTrash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear dialogue</span>
            </button>
          </div>

          {/* Conversation Scroll Container */}
          <div className="flex-1 bg-ground border border-line rounded-2xl p-4 overflow-y-auto space-y-3 min-h-[180px] max-h-[280px] scroll-slim">
            {!conversation.transcript && !conversation.reply ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-6 text-secondary text-xs">
                <FiMic className="w-6 h-6 mb-2 text-accent" aria-hidden="true" />
                <div className="font-bold text-ink">Ready for your voice</div>
                <div>Press the microphone button below, tap a chip, or type.</div>
              </div>
            ) : (
              <>
                {conversation.transcript && (
                  <div className="self-end ml-auto bg-surface border border-line text-xs text-ink p-3 rounded-2xl rounded-tr-xs max-w-[85%] shadow-2xs">
                    <div className="text-[10px] text-secondary font-bold mb-0.5">Visitor</div>
                    {conversation.transcript}
                  </div>
                )}
                {conversation.state === "thinking" && (
                  <div className="self-start text-xs text-secondary font-medium flex items-center gap-2">
                    <Spinner />
                    <span>Searching college database…</span>
                  </div>
                )}
                {conversation.reply && (
                  <div className="self-start bg-accent text-accent-foreground text-xs p-3.5 rounded-2xl rounded-tl-xs max-w-[92%] shadow-2xs leading-relaxed space-y-2">
                    <div className="text-[10px] opacity-80 font-bold">CampusAI</div>
                    <div>{conversation.reply}</div>

                    {/* Rich Interactive Location Card */}
                    {activeRecord?.locationDetails && (
                      <div className="p-2.5 rounded-xl bg-surface text-ink border border-line space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px] font-bold text-accent">
                          <span className="flex items-center gap-1">
                            <FiMapPin className="w-3.5 h-3.5" />
                            {activeRecord.locationDetails.room}
                          </span>
                          <span className="text-secondary">{activeRecord.locationDetails.walkTime}</span>
                        </div>
                        <div className="text-[11px] text-secondary">
                          {activeRecord.locationDetails.floor} · {activeRecord.locationDetails.wing}
                        </div>
                        <button
                          type="button"
                          onClick={() => setHardwareDrawerOpen(true)}
                          className="w-full mt-1 py-1 rounded bg-accent/10 hover:bg-accent/20 text-accent font-bold text-[11px] whitespace-nowrap flex items-center justify-center gap-1 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98"
                        >
                          <FiCompass className="w-3 h-3" />
                          <span>View indoor route</span>
                        </button>
                      </div>
                    )}

                    {/* Rich Interactive Course & Fee Card */}
                    {activeRecord?.courseDetails && (
                      <div className="p-2.5 rounded-xl bg-surface text-ink border border-line space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-accent">{activeRecord.courseDetails.code}</span>
                          <span>{activeRecord.courseDetails.fee}</span>
                        </div>
                        <div className="text-[10px] text-secondary">
                          Approved seats: <strong>{activeRecord.courseDetails.seats}</strong>
                        </div>
                        <div className="text-[10px] text-secondary border-t border-line pt-1 mt-1">
                          {activeRecord.courseDetails.eligibility}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Interactive Suggestion Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Suggested inquiries">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => executeQuery(chip)}
                className="px-2.5 py-1 rounded-lg bg-ground border border-line hover:border-line-strong hover:bg-surface-muted text-[11px] font-semibold text-secondary hover:text-ink whitespace-nowrap motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Voice Input Button & Typing Bar */}
          <div className="space-y-2.5 pt-2 border-t border-line">
            
            {/* Primary Large Microphone Button */}
            <button
              type="button"
              onClick={handleStartVoice}
              disabled={conversation.busy}
              className="w-full py-3.5 px-4 rounded-2xl bg-accent text-accent-foreground font-bold flex items-center justify-between shadow-xs hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-accent-foreground/20 flex items-center justify-center shrink-0">
                  <FiMic className="w-5 h-5 text-accent-foreground" aria-hidden="true" />
                </span>
                <span className="text-sm font-extrabold">Tap to speak</span>
              </div>

              {/* Dynamic waveform bars */}
              <div className="flex items-center gap-1 h-5">
                {[30, 70, 45, 90, 60, 40, 85, 50, 75, 35].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-accent-foreground rounded-full motion-safe:transition-opacity"
                    style={{ height: voice.recording ? `${h}%` : "30%" }}
                  />
                ))}
              </div>
            </button>

            {/* Typed Inquiry Form */}
            <form onSubmit={handleSendTyped} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Or type an inquiry…"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                disabled={conversation.busy || voice.recording}
                className="flex-1 h-11 rounded-xl bg-ground border border-line px-3.5 text-xs text-ink placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!typedMessage.trim() || conversation.busy || voice.recording}
                className="w-11 h-11 rounded-xl bg-surface border border-line hover:bg-surface-muted text-ink flex items-center justify-center shrink-0 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98"
                aria-label="Send inquiry"
              >
                <FiSend className="w-4 h-4 text-accent" aria-hidden="true" />
              </button>
            </form>

          </div>

        </div>

      </main>

      {/* Footer Status Bar */}
      <footer className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-4 text-xs text-secondary font-medium">
        <div>
          <span>Autonomous college reception robot</span>
          <span className="mx-2 text-line-strong">/</span>
          <span>Zero audio recordings stored on-device</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setHardwareDrawerOpen(true)}
            className="hover:text-ink motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent rounded active:scale-98"
          >
            ESP32 BOM & schematics
          </button>
          <span className="text-line-strong">/</span>
          <span>MIT License</span>
        </div>
      </footer>

      {/* Slide-over Hardware & Engineering Blueprint Drawer */}
      <HardwareDrawer open={hardwareDrawerOpen} onClose={() => setHardwareDrawerOpen(false)} />

    </div>
  );
}
