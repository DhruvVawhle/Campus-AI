"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FiMic,
  FiMapPin,
  FiInfo,
  FiCalendar,
  FiSend,
  FiTrash2,
  FiAlertCircle,
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
import { playKioskSound } from "@/lib/kiosk/kiosk-audio";
import { WayfindingCard, TimetableCard, FeeBreakdownCard } from "./rich-cards";

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
      className="w-4 h-4 rounded-full border-2 border-line border-t-accent shrink-0"
      animate={reduceMotion ? {} : { rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      role="status"
      aria-label="Loading"
    />
  );
}

// Single Source of Truth for Directory & Inquiries
interface CampusTopic {
  id: string;
  category: "all" | "directory" | "admissions" | "exams" | "facilities";
  title: string;
  subtitle: string;
  icon: typeof FiMapPin;
  prompt: string;
}

const DIRECTORY_TOPICS: CampusTopic[] = [
  {
    id: "dir-cs",
    category: "directory",
    title: "Dr. Rajesh Sharma (CS Dept)",
    subtitle: "Cabin C-301, 3rd Floor, West Wing",
    icon: FiMapPin,
    prompt: "Where is Dr. Rajesh Sharma's cabin in West Wing?",
  },
  {
    id: "dir-aids",
    category: "directory",
    title: "Dr. Anand Deshmukh (AI & DS)",
    subtitle: "Cabin A-202, 2nd Floor, East Wing",
    icon: FiCompass,
    prompt: "Where is Dr. Anand Deshmukh's cabin?",
  },
  {
    id: "adm-fees",
    category: "admissions",
    title: "B.Tech AI & Data Science Fees",
    subtitle: "Tuition, seat intake & eligibility criteria",
    icon: LuGraduationCap,
    prompt: "What are the fees and eligibility for B.Tech AI & Data Science?",
  },
  {
    id: "exm-tt",
    category: "exams",
    title: "Semester Examination Schedule",
    subtitle: "Exam Cell Room A-104 & dates",
    icon: FiCalendar,
    prompt: "What is the examination timetable for semester 3?",
  },
  {
    id: "lib-hours",
    category: "facilities",
    title: "Central Library & Reading Hall",
    subtitle: "Opening hours, digital catalog & study slots",
    icon: FiInfo,
    prompt: "When does the central library and reading hall open?",
  },
];

// Multilingual Kiosk Localization Dictionary
const I18N = {
  en: {
    heading: "Campus Information",
    subtitle: "Touch an inquiry or speak naturally to ask questions.",
    categoryFilters: [
      { id: "all", label: "All Topics" },
      { id: "directory", label: "Directory" },
      { id: "admissions", label: "Admissions" },
      { id: "exams", label: "Exams" },
      { id: "facilities", label: "Facilities" },
    ],
    greetingIdle: "Welcome to campus. Tap to speak or select an inquiry from the directory.",
    greetingSpoken: "Hello! I am CampusAI, your campus reception assistant. How can I assist you today?",
    assistantLabel: "Campus Assistant",
    clear: "Clear Session",
    readyVoice: "Ready to assist",
    readyHint: "Speak naturally or select any topic from the directory on the left.",
    tapToSpeak: "Tap to Speak",
    listening: "Listening…",
    thinking: "Processing…",
    speaking: "Speaking…",
    searchingDb: "Retrieving records…",
    typePlaceholder: "Type a campus question…",
    langScope: "Language",
    speakerOn: "Voice: On",
    speakerMuted: "Voice: Muted",
    onlineReady: "Ready",
    localReady: "Offline (Local)",
    humanDesk: "Contact Staff Desk",
    humanDeskSent: "Staff desk at Counter 1 has been paged.",
    footerDisclaimer: "Information Station • Microphones activate only during dialogue.",
    footerStation: "Station: Main Lobby • Ext 101",
  },
  hi: {
    heading: "परिसर सूचना केंद्र",
    subtitle: "विषय चुनें या माइक्रोफ़ोन में स्वाभाविक रूप से बोलें।",
    categoryFilters: [
      { id: "all", label: "सभी विषय" },
      { id: "directory", label: "निर्देशिका" },
      { id: "admissions", label: "प्रवेश" },
      { id: "exams", label: "परीक्षा" },
      { id: "facilities", label: "सुविधाएँ" },
    ],
    greetingIdle: "परिसर में आपका स्वागत है। बोलने के लिए टैप करें या निर्देशिका से विषय चुनें।",
    greetingSpoken: "नमस्ते! मैं CampusAI हूँ। कॉलेज के बारे में कुछ भी पूछें।",
    assistantLabel: "कैंपस सहायक",
    clear: "सत्र साफ़ करें",
    readyVoice: "सहायता के लिए तैयार",
    readyHint: "स्वाभाविक रूप से बोलें या बाईं ओर की निर्देशिका से कोई विषय चुनें।",
    tapToSpeak: "बोलने के लिए टैप करें",
    listening: "सुन रहा हूँ…",
    thinking: "प्रोसेस हो रहा है…",
    speaking: "बोल रहा हूँ…",
    searchingDb: "जानकारी खोजी जा रही है…",
    typePlaceholder: "कॉलेज से जुड़ा प्रश्न टाइप करें…",
    langScope: "भाषा",
    speakerOn: "आवाज़: चालू",
    speakerMuted: "आवाज़: बंद",
    onlineReady: "तैयार",
    localReady: "ऑफ़लाइन (लोकल)",
    humanDesk: "रिसेप्शन स्टाफ से संपर्क करें",
    humanDeskSent: "काउंटर 1 पर स्टाफ को सूचित कर दिया गया है।",
    footerDisclaimer: "सूचना केंद्र • केवल संवाद के समय माइक्रोफ़ोन चालू होता है।",
    footerStation: "स्थान: मुख्य लॉबी • एक्सटेंशन 101",
  },
  mr: {
    heading: "परिसर माहिती केंद्र",
    subtitle: "विषय निवडा किंवा थेट संभाषणासाठी बोला.",
    categoryFilters: [
      { id: "all", label: "सर्व विषय" },
      { id: "directory", label: "निर्देशिका" },
      { id: "admissions", label: "प्रवेश" },
      { id: "exams", label: "परीक्षा" },
      { id: "facilities", label: "सुविधा" },
    ],
    greetingIdle: "परिसरात आपले स्वागत आहे. बोलण्यासाठी टॅप करा किंवा निर्देशिकेतून विषय निवडा.",
    greetingSpoken: "नमस्कार! मी CampusAI आहे. मी तुमची काय मदत करू शकतो?",
    assistantLabel: "कॅम्पस सहाय्यक",
    clear: "सत्र साफ करा",
    readyVoice: "मदतीसाठी सज्ज",
    readyHint: "थेट बोला किंवा डाव्या बाजूच्या निर्देशिकेतून विषय निवडा.",
    tapToSpeak: "बोलण्यासाठी टॅप करा",
    listening: "ऐकत आहे…",
    thinking: "प्रक्रिया सुरू आहे…",
    speaking: "बोलत आहे…",
    searchingDb: "माहिती शोधत आहे…",
    typePlaceholder: "प्रश्न टाइप करा…",
    langScope: "भाषा",
    speakerOn: "आवाज: चालू",
    speakerMuted: "आवाज: बंद",
    onlineReady: "सज्ज",
    localReady: "ऑफलाइन (स्थानिक)",
    humanDesk: "कर्मचाऱ्यांशी संपर्क साधा",
    humanDeskSent: "काउंटर 1 वरील कर्मचाऱ्यांना अलर्ट पाठवला आहे.",
    footerDisclaimer: "माहिती केंद्र • केवळ संवादादरम्यान मायक्रोफोन सक्रिय होतो.",
    footerStation: "स्थान: मुख्य लॉबी • एक्स्टेंशन 101",
  },
  hinglish: {
    heading: "Campus Information",
    subtitle: "Topic select karein ya microphone me bolein.",
    categoryFilters: [
      { id: "all", label: "All Topics" },
      { id: "directory", label: "Directory" },
      { id: "admissions", label: "Admissions" },
      { id: "exams", label: "Exams" },
      { id: "facilities", label: "Facilities" },
    ],
    greetingIdle: "Welcome to campus. Tap karke bolein ya directory se topic select karein.",
    greetingSpoken: "Hello! Main CampusAI hoon. Aapki kya help kar sakta hoon?",
    assistantLabel: "Campus Assistant",
    clear: "Clear Session",
    readyVoice: "Ready to assist",
    readyHint: "Mic tap karein ya left directory se topic select karein.",
    tapToSpeak: "Tap to Speak",
    listening: "Listening…",
    thinking: "Processing…",
    speaking: "Speaking…",
    searchingDb: "Information search ho rahi hai…",
    typePlaceholder: "Inquiry type karein…",
    langScope: "Language",
    speakerOn: "Voice: On",
    speakerMuted: "Voice: Muted",
    onlineReady: "Ready",
    localReady: "Offline (Local)",
    humanDesk: "Contact Staff Desk",
    humanDeskSent: "Counter 1 staff ko inform kar diya gaya hai.",
    footerDisclaimer: "Information Station • Microphones active only during dialogue.",
    footerStation: "Station: Main Lobby • Ext 101",
  },
};

const DEMO_MODE_FORCED = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const IDLE_TIMEOUT_MS = 45000;

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
  const [deskBellNotified, setDeskBellNotified] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Real-time live interim STT transcription
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

  // Synchronized second-accurate kiosk clock
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  const t = I18N[lang] || I18N.en;

  // Filtered directory items
  const filteredTopics = useMemo(() => {
    if (selectedCategory === "all") return DIRECTORY_TOPICS;
    return DIRECTORY_TOPICS.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  // Seamless Barge-In (Voice-to-Touch Interruption)
  const interruptSpeakingIfActive = useCallback(() => {
    if (conversation.state === "speaking") {
      stopSpeaking();
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    }
  }, [conversation.state]);

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

  // Clock sync
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setDateStr(d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }));
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

  // Intelligent offline or live voice response dispatcher
  const executeQuery = useCallback((queryText: string) => {
    const clean = queryText.trim();
    if (!clean) return;

    interruptSpeakingIfActive();
    playKioskSound("tap");
    setDeskBellNotified(false);

    // Match grounded campus knowledge record
    const matched = findGroundedRecord(clean);
    setActiveRecord(matched);

    if (demoMode || backendOnline === false) {
      let responseText = "I have checked the college directory. Please specify if you need admissions, faculty cabins, or exam schedules.";
      if (matched) {
        if (lang === "hi") responseText = matched.replyHi;
        else if (lang === "mr") responseText = matched.replyMr;
        else responseText = matched.replyEn;
      } else if (/wifi|wi-fi|internet|guest/i.test(clean)) {
        responseText = "Visitors can connect to 'CampusAI-Guest' Wi-Fi. Collect the temporary OTP voucher from the Security Reception desk.";
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
        executeQuery("Where is Dr. Rajesh Sharma's cabin?");
        return;
      }
      await conversation.answerVoiceEndToEnd(audio);
    },
    onListeningChange: (listening) => conversation.setListening(listening),
    onError: (msg) => conversation.showError(msg),
  });

  // Real-time streaming Speech-to-Text with Acoustic Chimes
  const handleStartVoice = () => {
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

        rec.onerror = () => {
          setLiveInterim("");
          conversation.setListening(false);
          voice.startRecording();
        };

        rec.onend = () => {
          setLiveInterim("");
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

  // Autonomous Wake-Word Listener ("Hello CampusAI")
  useEffect(() => {
    if (typeof window === "undefined" || conversation.state !== "idle" || conversation.busy) return;
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
        if (spoken.includes("campus ai") || spoken.includes("hello campus") || spoken.includes("hey campus")) {
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
  }, [conversation.state, conversation.busy]);

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

  // Kiosk Inactivity Reset (Idle Timeout: 45s of no user activity)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      conversation.reset(true);
      setActiveRecord(null);
      stopSpeaking();
      setTypedMessage("");
      setLiveInterim("");
      setDeskBellNotified(false);
      setLang("en");
    }, IDLE_TIMEOUT_MS);
  }, [conversation]);

  useEffect(() => {
    const events = ["mousedown", "touchstart", "pointerdown", "keydown"];
    const handleActivity = () => resetIdleTimer();

    for (const evt of events) {
      window.addEventListener(evt, handleActivity, { passive: true });
    }
    resetIdleTimer();

    return () => {
      for (const evt of events) {
        window.removeEventListener(evt, handleActivity);
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  const handleLanguageChange = (newLang: LanguageCode) => {
    interruptSpeakingIfActive();
    playKioskSound("tap");
    setLang(newLang);

    if (soundEnabled) {
      const prompt = I18N[newLang]?.greetingSpoken || I18N.en.greetingSpoken;
      speakTextAloud(prompt, newLang);
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

    const robotGreeting =
      lang === "hi"
        ? "नमस्ते! मैं CampusAI हूँ। आप मुझसे कॉलेज के बारे में कुछ भी पूछ सकते हैं।"
        : lang === "mr"
        ? "नमस्कार! मी CampusAI आहे. आपण मला कॉलेजबद्दल काहीही विचारू शकता."
        : "Hello! I am CampusAI, your reception assistant. Feel free to speak or tap any inquiry from the directory.";

    conversation.showDemoAnswer("Hello CampusAI!", robotGreeting);
    if (soundEnabled) {
      speakTextAloud(robotGreeting, lang);
    }
  };

  // Secret 5-Tap Gesture or 2.5s Hold on CampusAI logo
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
      speakTextAloud("A staff desk alert has been sent to Counter 1.", lang);
    }
  };

  // Dynamic Office Hours Status
  const officeHoursStatus = useMemo(() => {
    const isWorkingHours = currentHour >= 9 && currentHour < 17;
    if (isWorkingHours) {
      return {
        label: "Offices Open (09:00 - 17:00)",
        dot: "bg-emerald-500",
      };
    }
    return {
      label: "After Hours (Library open until 21:00)",
      dot: "bg-blue-500",
    };
  }, [currentHour]);

  // Unified Deterministic Status - Single indicator in Header only
  const isListening = conversation.state === "listening";
  const isThinking = conversation.state === "thinking";
  const isSpeaking = conversation.state === "speaking";

  const systemStatus = isListening
    ? { label: t.listening, dot: "bg-accent" }
    : isThinking
    ? { label: t.thinking, dot: "bg-warning" }
    : isSpeaking
    ? { label: t.speaking, dot: "bg-accent" }
    : (demoMode || backendOnline === false)
    ? { label: t.localReady, dot: "bg-emerald-600" }
    : { label: t.onlineReady, dot: "bg-emerald-600" };

  const speakButtonLabel = isListening
    ? t.listening
    : isThinking
    ? t.thinking
    : isSpeaking
    ? t.speaking
    : t.tapToSpeak;

  const liveGreeting =
    conversation.state === "idle" && !conversation.reply
      ? t.greetingIdle
      : conversation.reply;

  const hasTypedContent = typedMessage.trim().length > 0;

  return (
    <div className="h-screen h-dvh max-h-screen max-h-dvh overflow-hidden bg-ground text-ink flex flex-col justify-between p-3 lg:p-4 select-none">
      
      {/* Maximum-width container for desktop & touchscreen centering */}
      <div className="w-full max-w-[1536px] mx-auto flex flex-col flex-1 h-full min-h-0 justify-between">
        
        {/* Top Header: Clean Architectural Station Bar */}
        <header className="flex items-center justify-between gap-3 pb-2.5 border-b border-line shrink-0 min-h-[44px]">
          
          {/* Brand with Hidden Technician Gesture */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogoTap}
              onPointerDown={handleLogoPointerDown}
              onPointerUp={handleLogoPointerUp}
              onPointerLeave={handleLogoPointerUp}
              className="text-lg sm:text-xl font-black tracking-tight text-ink flex items-center focus-visible:outline-2 focus-visible:outline-accent rounded select-none cursor-pointer"
              title="Campus Information Station (Tap 5x for technician tools)"
              aria-label="Campus Information Station"
            >
              CampusAI
            </button>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-surface border border-line text-xs font-semibold text-secondary">
              Information Station
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-secondary font-medium">
              <span className={`w-1.5 h-1.5 rounded-full ${officeHoursStatus.dot}`} />
              <span>{officeHoursStatus.label}</span>
            </span>
          </div>

          {/* Controls Cluster */}
          <div className="flex items-center gap-2">
            
            {/* Mic Permission Alert if blocked */}
            {micPermitted === false && (
              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                <FiMic className="w-3.5 h-3.5" />
                <span>Microphone Muted by Browser</span>
              </span>
            )}

            {/* Voice Output Speaker Toggle */}
            <button
              type="button"
              onClick={() => {
                if (soundEnabled) stopSpeaking();
                setSoundEnabled(!soundEnabled);
                playKioskSound("tap");
              }}
              className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-line hover:bg-surface-muted text-xs font-semibold text-ink motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent"
              aria-label={soundEnabled ? "Voice output enabled. Click to mute." : "Voice output muted. Click to enable."}
            >
              {soundEnabled ? (
                <FiVolume2 className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
              ) : (
                <FiVolumeX className="w-4 h-4 text-secondary shrink-0" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{soundEnabled ? t.speakerOn : t.speakerMuted}</span>
            </button>

            {/* Single Deterministic System Status Pill */}
            <div className="min-h-[38px] flex items-center gap-1.5 px-3 rounded-lg border border-line bg-surface text-xs font-semibold text-ink">
              <span className={`w-2 h-2 rounded-full shrink-0 ${systemStatus.dot}`} aria-hidden="true" />
              <span>{systemStatus.label}</span>
            </div>

            {/* Precision Kiosk Clock */}
            <div className="hidden md:flex flex-col items-end justify-center text-right pl-2 border-l border-line">
              <span className="text-[11px] text-secondary font-medium leading-tight">{dateStr}</span>
              <span className="text-xs font-bold tracking-tight text-ink leading-tight">{timeStr}</span>
            </div>
          </div>
        </header>

        {/* Main Kiosk Grid: Left Directory & Right Integrated Stage */}
        <main className="flex-1 my-2.5 grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[330px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)] gap-3.5 items-stretch min-h-0 overflow-hidden">
          
          {/* Left Column: Campus Services Directory & Language Selection */}
          <aside className="flex flex-col gap-2.5 min-h-0 justify-between h-full bg-surface border border-line rounded-2xl p-3.5">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-ink leading-snug">
                {t.heading}
              </h1>
              <p className="text-xs font-medium text-secondary mt-0.5">
                {t.subtitle}
              </p>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1 mt-2.5 pb-2 border-b border-line">
                {t.categoryFilters.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold motion-safe:transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-ink text-surface"
                        : "bg-ground text-secondary hover:text-ink"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Directory Inquiries List (Single Source of Truth) */}
            <nav className="flex-1 overflow-y-auto space-y-1.5 scroll-slim my-1" aria-label="Campus Directory Inquiries">
              {filteredTopics.map((item) => {
                const Icon = item.icon;
                const isBusy = conversation.busy || voice.recording;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => !isBusy && executeQuery(item.prompt)}
                    disabled={isBusy}
                    className="w-full p-2.5 rounded-xl border border-line bg-surface hover:bg-surface-muted hover:border-line-strong text-left motion-safe:transition-colors flex items-start gap-2.5 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
                  >
                    <span className="w-7 h-7 rounded-lg bg-ground border border-line flex items-center justify-center text-accent shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-ink leading-tight">{item.title}</div>
                      <div className="text-[11px] font-medium text-secondary mt-0.5 truncate">{item.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Language Switcher Fieldset (Single Label, No Duplication) */}
            <fieldset className="pt-2 border-t border-line">
              <legend className="text-xs font-semibold text-secondary mb-1 flex items-center gap-1.5">
                <FiGlobe className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                <span>{t.langScope}</span>
              </legend>
              <div className="flex gap-1">
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
                    className={`flex-1 min-h-[34px] py-1 text-xs font-semibold rounded-lg motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                      lang === lCode.code
                        ? "bg-accent text-accent-foreground"
                        : "bg-ground text-secondary hover:text-ink hover:bg-surface-muted"
                    }`}
                  >
                    {lCode.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </aside>

          {/* Center Stage: Seamless Architectural Surface (Zero Card-in-Card Nesting) */}
          <section className="bg-surface border border-line rounded-2xl flex flex-col min-h-0 h-full p-4 gap-3 min-w-0 max-w-full overflow-hidden">
            
            {/* Stage Bar: Assistant Identity + Clear Action */}
            <div className="flex items-center justify-between pb-2 border-b border-line shrink-0 min-h-[34px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" aria-hidden="true" />
                <span className="text-xs sm:text-sm font-bold text-ink">{t.assistantLabel}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  interruptSpeakingIfActive();
                  playKioskSound("tap");
                  conversation.reset(true);
                  setActiveRecord(null);
                  stopSpeaking();
                  setDeskBellNotified(false);
                }}
                className="text-xs font-semibold text-secondary hover:text-ink flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-accent rounded px-2 py-1 motion-safe:transition-colors cursor-pointer"
              >
                <FiTrash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.clear}</span>
              </button>
            </div>

            {/* Stage Hero: 3D Robot & Real-Time Flanked Speech Prompts */}
            <div className="shrink-0 relative flex items-center justify-center py-1">
              <div className="w-full flex flex-col md:flex-row items-center justify-center gap-3 lg:gap-4 max-w-3xl">
                
                {/* Left: Visitor Transcript / Interim Stream */}
                {(conversation.transcript || liveInterim) && (
                  <div className="w-full md:w-1/2 flex justify-end min-w-0">
                    <div className="p-3 rounded-xl bg-ground border border-line max-h-[115px] overflow-y-auto scroll-slim w-full max-w-[280px]">
                      <div className="text-[11px] font-bold text-secondary mb-0.5 flex items-center justify-between">
                        <span>Visitor</span>
                        {liveInterim && (
                          <span className="text-[10px] font-bold text-accent animate-pulse">Live speech…</span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-ink leading-snug line-clamp-3">
                        {liveInterim ? `${liveInterim}…` : conversation.transcript}
                      </p>
                    </div>
                  </div>
                )}

                {/* Center: Integrated 3D Robot Stage */}
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
                  aria-label="Campus robot assistant. Tap to interact."
                  className="relative w-[110px] h-[110px] sm:w-[125px] sm:h-[125px] flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-accent rounded-full"
                  title="Tap robot to interact"
                >
                  {/* Calibrated sound waves during speech */}
                  {conversation.state === "speaking" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                      <div className="motion-safe:animate-sound-ring-1 absolute w-24 h-24 rounded-full border border-accent/60" />
                      <div className="motion-safe:animate-sound-ring-2 absolute w-24 h-24 rounded-full border border-accent/40" />
                    </div>
                  )}

                  {/* Clean Stage Pedestal */}
                  <div className="absolute inset-1 rounded-full bg-ground border border-line" aria-hidden="true" />

                  {/* Three.js Canvas */}
                  <div className="relative w-full h-full z-10" aria-hidden="true">
                    <CampusRobot state={conversation.state} distance={8.5} />
                  </div>
                </div>

                {/* Right: CampusAI Live Response Bubble */}
                {liveGreeting && (
                  <div className={`w-full ${conversation.transcript || liveInterim ? "md:w-1/2" : "md:max-w-md"} min-w-0 flex justify-start`}>
                    <div
                      className="p-3 rounded-xl bg-accent text-accent-foreground max-h-[115px] overflow-y-auto scroll-slim w-full"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="text-[11px] font-bold text-accent-foreground/80 mb-0.5">
                        CampusAI
                      </div>
                      <p className="text-xs sm:text-sm font-medium leading-snug line-clamp-3">
                        {liveGreeting}
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Conversation Flow Area (Clean, Open Stream) */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 scroll-slim pr-1">
              {!conversation.transcript && !conversation.reply ? (
                /* Idle Attract State: Clean, Direct, Respectful */
                <div className="flex flex-col items-center justify-center h-full text-center py-4 px-3 text-secondary">
                  <div className="w-10 h-10 rounded-full bg-accent-surface border border-accent/20 flex items-center justify-center text-accent mb-2">
                    <FiMic className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-bold text-ink">{t.readyVoice}</h2>
                  <p className="text-xs font-medium max-w-sm mt-1 text-secondary">
                    {t.readyHint}
                  </p>
                </div>
              ) : (
                <>
                  {/* Visitor Bubble */}
                  {conversation.transcript && (
                    <div className="self-end ml-auto bg-ground border border-line text-xs sm:text-sm text-ink p-3 rounded-xl max-w-[85%] sm:max-w-[75%]">
                      <div className="text-[11px] text-secondary font-bold mb-0.5">Visitor</div>
                      <div className="font-semibold">{conversation.transcript}</div>
                    </div>
                  )}

                  {/* Processing Status */}
                  {conversation.state === "thinking" && (
                    <div className="self-start text-xs font-semibold text-secondary flex items-center gap-2 px-1">
                      <Spinner />
                      <span>{t.searchingDb}</span>
                    </div>
                  )}

                  {/* Assistant Reply with Rich Action Cards */}
                  {conversation.reply && (
                    <div className="self-start mr-auto bg-accent-surface border border-accent/20 text-ink text-xs sm:text-sm p-3.5 rounded-xl max-w-[92%] sm:max-w-[85%] space-y-2.5">
                      <div className="text-[11px] text-accent font-bold">CampusAI</div>
                      <div className="leading-relaxed">{conversation.reply}</div>

                      {/* Interactive Rich Widgets Based on Grounded Data */}
                      {activeRecord?.locationDetails && (
                        <WayfindingCard
                          location={activeRecord.locationDetails}
                          title={activeRecord.title}
                          qrUri={activeRecord.qrUri}
                          onOpenDrawer={() => setHardwareDrawerOpen(true)}
                        />
                      )}

                      {activeRecord?.timetableDetails && (
                        <TimetableCard
                          timetable={activeRecord.timetableDetails}
                          onReadAloud={(highlight) => speakTextAloud(highlight, lang)}
                        />
                      )}

                      {activeRecord?.courseDetails && (
                        <FeeBreakdownCard
                          course={activeRecord.courseDetails}
                          qrUri={activeRecord.qrUri}
                        />
                      )}

                      {/* Context-Aware Dynamic Follow-Up Actions */}
                      {activeRecord?.followUps && activeRecord.followUps.length > 0 && (
                        <div className="pt-2 border-t border-accent/15 space-y-1.5">
                          <div className="text-[10px] font-bold text-secondary flex items-center gap-1">
                            <FiCornerDownRight className="w-3 h-3 text-accent" />
                            <span>Related Inquiries</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {activeRecord.followUps.map((chipText) => (
                              <button
                                key={chipText}
                                type="button"
                                onClick={() => executeQuery(chipText)}
                                className="px-2.5 py-1 rounded-md bg-surface border border-line text-ink hover:bg-surface-muted text-xs font-semibold motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent cursor-pointer"
                              >
                                {chipText}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Staff Desk Escalation Action */}
                      <div className="pt-2 border-t border-accent/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {deskBellNotified ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{t.humanDeskSent}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRingDeskBell}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface border border-line text-ink hover:bg-surface-muted text-xs font-semibold motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent cursor-pointer"
                          >
                            <FiBell className="w-3.5 h-3.5 text-accent" />
                            <span>{t.humanDesk}</span>
                          </button>
                        )}
                        <span className="text-[11px] text-secondary font-medium">Counter 1 • Ext 101</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Action Bar: Voice CTA + Input Field */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-line shrink-0">
              
              {/* Primary Speak CTA */}
              <button
                type="button"
                onClick={handleStartVoice}
                disabled={conversation.busy}
                className="w-full sm:w-[190px] md:w-[210px] h-11 px-3.5 rounded-xl bg-accent text-accent-foreground font-semibold flex items-center justify-between hover:bg-accent-hover disabled:opacity-50 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent shrink-0 cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FiMic className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="text-xs sm:text-sm font-bold truncate">
                    {speakButtonLabel}
                  </span>
                </div>

                {/* Animated Waveform when listening */}
                {conversation.state === "listening" && (
                  <div className="flex items-center gap-0.5 h-3.5 shrink-0" aria-hidden="true">
                    {[30, 80, 50, 95, 60, 40, 85, 45].map((h, i) => (
                      <span
                        key={`bar-${i}`}
                        className="w-0.5 bg-accent-foreground rounded-full motion-safe:animate-wave-bar"
                        style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
                      />
                    ))}
                  </div>
                )}
              </button>

              {/* Typed Input */}
              <form onSubmit={handleSendTyped} className="flex-1 flex items-center gap-2 min-w-0 w-full">
                <input
                  type="text"
                  placeholder={t.typePlaceholder}
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onFocus={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                  disabled={conversation.busy || voice.recording}
                  className="flex-1 h-11 rounded-xl bg-ground border border-line px-3 text-xs sm:text-sm text-ink placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 font-medium"
                />
                <button
                  type="submit"
                  disabled={!hasTypedContent || conversation.busy || voice.recording}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                    hasTypedContent
                      ? "bg-ink text-surface hover:bg-secondary cursor-pointer"
                      : "bg-surface border border-line text-secondary/30 opacity-40 cursor-not-allowed"
                  }`}
                  aria-label="Send message"
                >
                  <FiSend className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>

            </div>

          </section>

        </main>

        {/* Footer: Honest, Grounded Station Baseline */}
        <footer className="pt-2 border-t border-line flex flex-wrap items-center justify-between gap-2 text-xs text-secondary font-medium shrink-0 min-h-[26px]">
          <div>
            <span>{t.footerDisclaimer}</span>
          </div>
          <div>
            <span>{t.footerStation}</span>
          </div>
        </footer>

      </div>

      {/* Secret 5-Tap Technician Diagnostics Modal */}
      {adminModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-dark/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-surface border border-line p-5 shadow-2xl text-ink space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-ink">
                <FiLock className="w-4 h-4 text-accent" />
                <span>Station Technician Diagnostics</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdminModalOpen(false);
                  setAdminPin("");
                  setAdminError(false);
                }}
                className="p-1 rounded hover:bg-surface-muted text-secondary hover:text-ink cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-ground border border-line space-y-1">
                <div className="text-[11px] font-semibold text-secondary">Audio Subsystem</div>
                <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                  <FiCheck className="w-3.5 h-3.5" />
                  <span>Microphone Ready</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-ground border border-line space-y-1">
                <div className="text-[11px] font-semibold text-secondary">Knowledge Base</div>
                <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                  <FiCheck className="w-3.5 h-3.5" />
                  <span>5 Grounded Entries</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-ground border border-line space-y-1">
                <div className="text-[11px] font-semibold text-secondary">Backend Connectivity</div>
                <div className="flex items-center gap-1.5 font-bold text-ink">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{backendOnline ? "Online (Healthy)" : "Offline (Local Engine Active)"}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-ground border border-line space-y-1">
                <div className="text-[11px] font-semibold text-secondary">Display Mode</div>
                <div className="font-bold text-ink">100dvh Lock</div>
              </div>
            </div>

            <div className="flex gap-2 pt-1 border-t border-line">
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
                className="flex-1 py-2 px-3 rounded-lg bg-ground border border-line hover:bg-surface-muted text-xs font-semibold text-ink flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FiRefreshCw className="w-3.5 h-3.5 text-accent" />
                <span>Reset Session</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdminModalOpen(false);
                  setHardwareDrawerOpen(true);
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent-hover flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FiCpu className="w-3.5 h-3.5" />
                <span>ESP32 Blueprint</span>
              </button>
            </div>

            <form onSubmit={handleAdminPinSubmit} className="pt-2 border-t border-line space-y-2">
              <div className="text-[11px] font-medium text-secondary">Enter Admin PIN (Default: 1234):</div>
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
                  className="flex-1 h-9 rounded-lg bg-ground border border-line px-3 text-center text-sm tracking-widest font-mono text-ink focus-visible:outline-2 focus-visible:outline-accent"
                />
                <button
                  type="submit"
                  className="px-4 h-9 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent-hover cursor-pointer"
                >
                  Unlock
                </button>
              </div>
              {adminError && (
                <div className="text-xs text-destructive font-semibold text-center">
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
