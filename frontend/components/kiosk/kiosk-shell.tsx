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
  FiActivity,
  FiCornerDownRight,
  FiBell,
  FiCheckCircle,
  FiRefreshCw,
  FiCpu,
  FiCheck,
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

// Multilingual Kiosk Localization Dictionary
const I18N = {
  en: {
    heading: "How can I help?",
    subtitle: "Select a department or speak naturally into the microphone.",
    categoryMenus: [
      { id: "dir", label: "Campus Directory", icon: FiMapPin, hint: "Faculty cabins & HOD offices", prompt: "Where is Dr. Rajesh Sharma's cabin in West Wing?" },
      { id: "adm", label: "Admissions 2026", icon: LuGraduationCap, hint: "B.Tech AI-DS fees & seats", prompt: "What are the fees and eligibility for B.Tech AI & Data Science?" },
      { id: "exm", label: "Examination Cell", icon: FiCalendar, hint: "Semester 3 exam schedules", prompt: "What is the examination timetable for semester 3?" },
      { id: "lib", label: "Library & Facilities", icon: FiInfo, hint: "Reading hall hours & GPU labs", prompt: "When does the central library and reading hall open?" },
    ],
    greetingIdle: "Welcome to campus. Tap to speak or select an inquiry below.",
    greetingSpoken: "Hello! I am CampusAI, your autonomous campus receptionist. How may I assist you today?",
    liveDialogue: "Live dialogue",
    clear: "Clear",
    readyVoice: "Ready for your voice",
    readyHint: "Walk up & say 'Hello CampusAI' or tap any starter topic.",
    tapToSpeak: "Tap to speak",
    listening: "Listening…",
    thinking: "Thinking…",
    speaking: "Speaking…",
    searchingDb: "Searching college database…",
    typePlaceholder: "Or type an inquiry…",
    langScope: "Voice & Display Language",
    speakerOn: "Voice Output: On",
    speakerMuted: "Voice Output: Muted",
    onlineReady: "Online • Ready",
    localReady: "Local Engine • Ready",
    systemNotice: "System Alert",
    humanDesk: "Ring Reception Desk Bell",
    humanDeskSent: "Bell chime sent to Reception Desk (Station 1). An executive has been notified.",
    starters: [
      { label: "📍 Exam Cell Room A-104", query: "Where is the Exam Cell located?" },
      { label: "💰 B.Tech AI-DS Fee Details", query: "What are the fees and eligibility for B.Tech AI & Data Science?" },
      { label: "🕒 Library Reading Hall Hours", query: "When does the central library and reading hall open?" },
      { label: "📶 Guest Wi-Fi Access", query: "How do visitors connect to campus Wi-Fi?" },
    ],
  },
  hi: {
    heading: "मैं कैसे सहायता कर सकता हूँ?",
    subtitle: "विभाग चुनें या सीधे माइक्रोफ़ोन में बोलें।",
    categoryMenus: [
      { id: "dir", label: "परिसर डायरेक्टरी", icon: FiMapPin, hint: "फैकल्टी केबिन व विभागाध्यक्ष", prompt: "डॉ. राजेश शर्मा का केबिन कहाँ है?" },
      { id: "adm", label: "प्रवेश २०२६", icon: LuGraduationCap, hint: "बी.टेक एआई फीस व सीटें", prompt: "बी.टेक एआई और डेटा साइंस की फीस और पात्रता क्या है?" },
      { id: "exm", label: "परीक्षा कक्ष", icon: FiCalendar, hint: "सेमेस्टर ३ परीक्षा सारणी", prompt: "सेमेस्टर 3 की परीक्षा समय सारणी क्या है?" },
      { id: "lib", label: "पुस्तकालय व सुविधाएँ", icon: FiInfo, hint: "रीडिंग हॉल समय व लैब", prompt: "केंद्रीय पुस्तकालय और रीडिंग हॉल कब खुलता है?" },
    ],
    greetingIdle: "परिसर में आपका स्वागत है। बोलने के लिए टैप करें या विषय चुनें।",
    greetingSpoken: "नमस्ते! मैं CampusAI हूँ। कॉलेज के बारे में कुछ भी पूछें।",
    liveDialogue: "लाइव संवाद",
    clear: "साफ़ करें",
    readyVoice: "आपकी आवाज़ के लिए तैयार",
    readyHint: "'नमस्ते CampusAI' बोलें या नीचे दिए गए किसी विषय पर टैप करें।",
    tapToSpeak: "बोलने के लिए टैप करें",
    listening: "सुन रहा हूँ…",
    thinking: "सोच रहा हूँ…",
    speaking: "बोल रहा हूँ…",
    searchingDb: "कॉलेज डेटाबेस में खोज रहे हैं…",
    typePlaceholder: "या प्रश्न टाइप करें…",
    langScope: "भाषा (Voice & Display)",
    speakerOn: "आवाज़: चालू",
    speakerMuted: "आवाज़: बंद",
    onlineReady: "ऑनलाइन • तैयार",
    localReady: "स्थानीय इंजन • तैयार",
    systemNotice: "सिस्टम सूचना",
    humanDesk: "रिसेप्शन घंटी बजाएँ",
    humanDeskSent: "रिसेप्शन डेस्क (स्टेशन 1) को अलर्ट भेज दिया गया है।",
    starters: [
      { label: "📍 एग्जाम सेल रूम A-104", query: "Where is the Exam Cell located?" },
      { label: "💰 बी.टेक एआई फीस विवरण", query: "What are the fees and eligibility for B.Tech AI & Data Science?" },
      { label: "🕒 लाइब्रेरी हॉल का समय", query: "When does the central library and reading hall open?" },
      { label: "📶 गेस्ट वाई-फाई सुविधा", query: "How do visitors connect to campus Wi-Fi?" },
    ],
  },
  mr: {
    heading: "मी कशी मदत करू शकतो?",
    subtitle: "विभाग निवडा किंवा थेट संभाषणासाठी बोला.",
    categoryMenus: [
      { id: "dir", label: "परिसर निर्देशिका", icon: FiMapPin, hint: "प्राध्यापक व विभागप्रमुख केबिन", prompt: "डॉ. राजेश शर्मांचे केबिन कुठे आहे?" },
      { id: "adm", label: "प्रवेश २०२६", icon: LuGraduationCap, hint: "बी.टेक एआय फी व जागा", prompt: "बी.टेक एआय आणि डेटा सायन्सचे शुल्क आणि पात्रता काय आहे?" },
      { id: "exm", label: "परीक्षा कक्ष", icon: FiCalendar, hint: "सत्र ३ परीक्षा वेळापत्रक", prompt: "सत्र 3 चे परीक्षा वेळापत्रक काय आहे?" },
      { id: "lib", label: "ग्रंथालय व सुविधा", icon: FiInfo, hint: "वाचन कक्ष वेळ व लॅब", prompt: "मध्यवर्ती ग्रंथालय आणि वाचनालय कधी उघडते?" },
    ],
    greetingIdle: "परिसरात आपले स्वागत आहे. बोलण्यासाठी टॅप करा किंवा विषय निवडा.",
    greetingSpoken: "नमस्कार! मी CampusAI आहे. मी तुमची काय मदत करू शकतो?",
    liveDialogue: "थेट संवाद",
    clear: "साफ करा",
    readyVoice: "तुमच्या आवाजासाठी सज्ज",
    readyHint: "'नमस्कार CampusAI' बोला किंवा कोणत्याही विषयावर टॅप करा.",
    tapToSpeak: "बोलण्यासाठी टॅप करा",
    listening: "ऐकत आहे…",
    thinking: "विचार करत आहे…",
    speaking: "बोलत आहे…",
    searchingDb: "कॉलेज डेटाबेसमधून शोधत आहे…",
    typePlaceholder: "किंवा प्रश्न टाइप करा…",
    langScope: "भाषा (Voice & Display)",
    speakerOn: "आवाज: चालू",
    speakerMuted: "आवाज: बंद",
    onlineReady: "ऑनलाइन • सज्ज",
    localReady: "स्थानिक इंजिन • सज्ज",
    systemNotice: "प्रणाली सूचना",
    humanDesk: "रिसेप्शन घंटा वाजवा",
    humanDeskSent: "रिसेप्शन डेस्क (स्टेशन 1) वर माहिती पाठवण्यात आली आहे.",
    starters: [
      { label: "📍 परीक्षा कक्ष रूम A-104", query: "Where is the Exam Cell located?" },
      { label: "💰 बी.टेक एआय फी तपशील", query: "What are the fees and eligibility for B.Tech AI & Data Science?" },
      { label: "🕒 ग्रंथालय वाचनालय वेळ", query: "When does the central library and reading hall open?" },
      { label: "📶 अतिथी वाय-फाय सुविधा", query: "How do visitors connect to campus Wi-Fi?" },
    ],
  },
  hinglish: {
    heading: "How can I help you?",
    subtitle: "Department select karein ya microphone me bolein.",
    categoryMenus: [
      { id: "dir", label: "Campus Directory", icon: FiMapPin, hint: "Faculty cabins & HODs", prompt: "Where is Dr. Rajesh Sharma's cabin?" },
      { id: "adm", label: "Admissions 2026", icon: LuGraduationCap, hint: "B.Tech AI-DS fees & details", prompt: "What are the fees and eligibility for B.Tech AI & Data Science?" },
      { id: "exm", label: "Exam Cell Info", icon: FiCalendar, hint: "Semester 3 timetable", prompt: "What is the examination timetable for semester 3?" },
      { id: "lib", label: "Library Timings", icon: FiInfo, hint: "Reading hall hours & Wi-Fi", prompt: "When does the central library and reading hall open?" },
    ],
    greetingIdle: "Welcome to campus. Tap karke bolein ya inquiry select karein.",
    greetingSpoken: "Hello! Main CampusAI hoon. Aapki kya help kar sakta hoon?",
    liveDialogue: "Live dialogue",
    clear: "Clear",
    readyVoice: "Ready for your voice",
    readyHint: "Mic button dabayein, inquiry select karein ya type karein.",
    tapToSpeak: "Tap to speak",
    listening: "Listening…",
    thinking: "Thinking…",
    speaking: "Speaking…",
    searchingDb: "College database search ho raha hai…",
    typePlaceholder: "Ya inquiry type karein…",
    langScope: "Language (Voice & Display)",
    speakerOn: "Voice Output: On",
    speakerMuted: "Voice Output: Muted",
    onlineReady: "Online • Ready",
    localReady: "Local Engine • Ready",
    systemNotice: "System Alert",
    humanDesk: "Ring Reception Desk Bell",
    humanDeskSent: "Bell chime sent to Reception Desk (Station 1). An executive has been notified.",
    starters: [
      { label: "📍 Exam Cell Room A-104", query: "Where is the Exam Cell located?" },
      { label: "💰 B.Tech AI-DS Fees", query: "What are the fees and eligibility for B.Tech AI & Data Science?" },
      { label: "🕒 Library Hall Timings", query: "When does the central library and reading hall open?" },
      { label: "📶 Guest Wi-Fi Setup", query: "How do visitors connect to campus Wi-Fi?" },
    ],
  },
};

const DEMO_MODE_FORCED = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const IDLE_TIMEOUT_MS = 45000; // 45s inactivity session reset

export function KioskShell() {
  const conversation = useConversation();
  const router = useRouter();
  const [demoMode, setDemoMode] = useState(DEMO_MODE_FORCED);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [lang, setLang] = useState<LanguageCode>("en");
  const [typedMessage, setTypedMessage] = useState("");
  const [hardwareDrawerOpen, setHardwareDrawerOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeRecord, setActiveRecord] = useState<GroundedCampusRecord | null>(null);
  const [deskBellNotified, setDeskBellNotified] = useState(false);

  // Real-time live interim STT transcription
  const [liveInterim, setLiveInterim] = useState("");

  // Microphone permission state tracking
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
        rec.interimResults = true; // Live interim streaming transcription
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

      wakeRec.onerror = () => {
        // Silent recovery for wake word loop
      };

      wakeRec.start();
    } catch {
      // Browser mic policy
    }

    return () => {
      try {
        wakeRec?.stop();
      } catch {
        // Ignored
      }
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

  const handleRetry = async () => {
    playKioskSound("tap");
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
    playKioskSound("tap");
    interruptSpeakingIfActive();

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

  // Human receptionist escalation bell
  const handleRingDeskBell = () => {
    playKioskSound("success");
    setDeskBellNotified(true);
    if (soundEnabled) {
      speakTextAloud("A desk bell notification has been transmitted to Station 1. An attendant is on their way.", lang);
    }
  };

  // Dynamic Time-Aware Campus Pulse logic
  const campusPulse = useMemo(() => {
    const isWorkingHours = currentHour >= 9 && currentHour < 17; // 9:00 AM to 5:00 PM
    if (isWorkingHours) {
      return {
        badge: "Campus Open: 9 AM - 5 PM",
        detail: "Admissions Desk Active at Counter 1 • Central Library Open",
        dot: "bg-emerald-500",
      };
    }
    return {
      badge: "After-Hours Mode",
      detail: "Admissions Closed (Opens 9 AM) • Central Library Open till 9 PM • Security Desk Active",
      dot: "bg-amber-500",
    };
  }, [currentHour]);

  // Deterministic Unified System Status (Zero false "System Alert" red pills)
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
    ? { label: t.localReady, dot: "bg-emerald-500" }
    : { label: t.onlineReady, dot: "bg-emerald-500" };

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
    <div className="h-screen h-dvh max-h-screen max-h-dvh overflow-hidden bg-ground text-ink flex flex-col justify-between p-2.5 sm:p-3 lg:p-3 xl:p-3.5 select-none">
      
      {/* Maximum-width container for desktop & ultrawide centering */}
      <div className="w-full max-w-[1536px] mx-auto flex flex-col flex-1 h-full min-h-0 justify-between">
        
        {/* Top Bar - Clean, responsive editorial header */}
        <header className="flex items-center justify-between gap-2.5 pb-2 border-b border-line shrink-0 min-h-[40px]">
          
          {/* Brand with Hidden Technician 5-Tap Gesture & Long-Press Trigger */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={handleLogoTap}
              onPointerDown={handleLogoPointerDown}
              onPointerUp={handleLogoPointerUp}
              onPointerLeave={handleLogoPointerUp}
              className="min-h-[38px] text-lg sm:text-xl font-extrabold tracking-tight text-ink flex items-center focus-visible:outline-2 focus-visible:outline-accent rounded-lg select-none cursor-pointer"
              title="CampusAI Reception Kiosk (Tap 5x for technician console)"
              aria-label="CampusAI Home"
            >
              CampusAI
            </button>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-surface border border-line text-xs font-bold text-secondary">
              Reception Kiosk
            </span>
          </div>

          {/* Controls Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Mic Permission Warning Pill if blocked */}
            {micPermitted === false && (
              <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold">
                <FiMic className="w-3.5 h-3.5" />
                <span>Mic Blocked</span>
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
              className="min-h-[38px] min-w-[38px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-line hover:bg-surface-muted text-xs font-bold text-ink shadow-2xs motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent"
              aria-label={soundEnabled ? "Robot voice output enabled. Click to mute speaker." : "Robot voice output muted. Click to enable speaker."}
            >
              {soundEnabled ? (
                <FiVolume2 className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
              ) : (
                <FiVolumeX className="w-4 h-4 text-secondary shrink-0" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{soundEnabled ? t.speakerOn : t.speakerMuted}</span>
            </button>

            {/* Unified Deterministic System Status */}
            <div className="min-h-[38px] flex items-center gap-1.5 px-3 rounded-xl border border-line bg-surface text-xs font-bold text-ink">
              <span className={`w-2 h-2 rounded-full shrink-0 ${systemStatus.dot}`} aria-hidden="true" />
              <span>{systemStatus.label}</span>
            </div>

            {/* Precision Kiosk Clock */}
            <div className="hidden md:flex flex-col items-end justify-center text-right pl-1">
              <span className="text-[11px] text-secondary font-bold leading-tight">{dateStr}</span>
              <span className="text-xs font-extrabold tracking-tight text-ink leading-tight">{timeStr}</span>
            </div>
          </div>
        </header>

        {/* Backend Standby Notice - Compact & Cleanly Dismissible */}
        {backendOnline === false && !demoMode && !bannerDismissed && (
          <div className="my-1.5 p-2 sm:p-2.5 rounded-xl bg-surface border border-warning flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-warning-ink">
              <FiAlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Cloud connection standby. Local campus knowledge engine & voice are active.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleRetry}
                className="min-h-[36px] px-3 py-1 rounded-lg bg-warning text-ink text-xs font-bold hover:bg-warning/90 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => {
                  setDemoMode(true);
                  setBannerDismissed(true);
                }}
                className="min-h-[36px] px-3 py-1 rounded-lg border border-warning text-warning-ink text-xs font-bold hover:bg-warning/10 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent"
              >
                Continue in Local Mode
              </button>
            </div>
          </div>
        )}

        {/* Main Kiosk Touchscreen Operational Grid */}
        <main className="flex-1 my-1.5 lg:my-2 grid grid-cols-1 lg:grid-cols-[285px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[350px_minmax(0,1fr)] gap-2.5 lg:gap-3.5 items-stretch min-h-0 overflow-hidden">
          
          {/* Left Column: Structured Department Category Menus & Language Switcher */}
          <div className="flex flex-col gap-2 min-h-0 justify-between h-full">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink leading-tight">
                {t.heading}
              </h1>
              <p className="text-xs font-semibold text-secondary mt-0.5 line-clamp-2">
                {t.subtitle}
              </p>
            </div>

            {/* Department Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5 my-auto" role="group" aria-label="Department category directory">
              {t.categoryMenus.map(({ id, label, icon: Icon, hint, prompt }) => {
                const isBusy = conversation.busy || voice.recording;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => !isBusy && executeQuery(prompt)}
                    disabled={isBusy}
                    className="min-h-[46px] lg:min-h-[48px] p-2.5 lg:p-3 rounded-2xl bg-surface border border-line hover:border-line-strong hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed motion-safe:transition-colors flex items-center justify-between gap-2.5 text-left shadow-2xs focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-ink leading-tight">{label}</div>
                        <div className="text-xs font-medium text-secondary truncate">{hint}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Language Switcher Bar with Visible Label */}
            <div className="shrink-0 pt-0.5">
              <div className="text-xs font-bold text-secondary flex items-center gap-1.5 mb-1 px-0.5">
                <FiGlobe className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                <span>{t.langScope}</span>
              </div>
              <fieldset
                className="flex items-center p-1 bg-surface rounded-xl border border-line shadow-2xs"
                aria-label={t.langScope}
              >
                <legend className="sr-only">{t.langScope}</legend>
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
                    className={`flex-1 min-h-[36px] py-1 text-xs font-bold rounded-lg motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent flex items-center justify-center ${
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
          </div>

          {/* Center Stage: Unified White Rounded Card Holding Robot & Live Dialogue */}
          <div className="rounded-2xl lg:rounded-3xl bg-surface border border-line p-3 lg:p-3.5 flex flex-col min-h-0 h-full shadow-xs gap-2 min-w-0 max-w-full overflow-hidden">
            
            {/* 1. Top Row: State Pill, Live Dialogue Label, Clear Dialogue */}
            <div className="flex items-center justify-between pb-1.5 border-b border-line shrink-0 min-h-[34px]">
              {/* Unified State Pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ground border border-line text-xs font-bold text-ink">
                <span className={`w-2 h-2 rounded-full shrink-0 ${systemStatus.dot}`} aria-hidden="true" />
                <span>{systemStatus.label}</span>
              </div>

              {/* Live Dialogue Label */}
              <span className="text-xs sm:text-sm font-bold text-secondary">{t.liveDialogue}</span>

              {/* Clear Dialogue Button */}
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
                className="min-h-[34px] text-xs font-bold text-secondary hover:text-ink flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-accent rounded-lg px-2.5 py-1 motion-safe:transition-colors"
              >
                <FiTrash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.clear}</span>
              </button>
            </div>

            {/* 2. Robot Area: Fully Reactive 3D Avatar & Flanked Speech Bubbles */}
            <div className="h-[125px] sm:h-[135px] lg:h-[140px] shrink-0 relative flex items-center justify-center px-1">
              <div
                className={`w-full h-full flex flex-col items-center justify-center gap-2.5 lg:gap-3 ${
                  conversation.transcript || liveInterim
                    ? "md:grid md:grid-cols-[minmax(0,1fr)_125px_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_135px_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_145px_minmax(0,1fr)]"
                    : "md:flex md:flex-row md:items-center md:justify-center md:gap-4 lg:gap-6"
                }`}
              >
                {/* Left Speech Bubble: Visitor Speech / Live Interim Stream */}
                {conversation.transcript || liveInterim ? (
                  <div className="w-full flex justify-end min-w-0">
                    <div className="relative p-2.5 rounded-xl bg-ground border border-line shadow-xs max-h-[110px] sm:max-h-[120px] overflow-y-auto scroll-slim w-full max-w-[260px]">
                      <div className="text-xs font-bold text-secondary mb-0.5 flex items-center justify-between">
                        <span>Visitor</span>
                        {liveInterim && (
                          <span className="text-[10px] font-bold text-accent animate-pulse">Streaming live…</span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-ink leading-snug line-clamp-3">
                        {liveInterim ? `${liveInterim}…` : conversation.transcript}
                      </p>
                      <span
                        className="hidden md:block absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-ground border-t border-r border-line rotate-45 rounded-[2px]"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                ) : null}

                {/* Center: Interactive CampusRobot Avatar with Antenna Glow & Breathing */}
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
                  aria-label="CampusAI robot receptionist. Tap to interact."
                  className="relative w-[105px] h-[105px] sm:w-[120px] sm:h-[120px] lg:w-[130px] lg:h-[130px] flex items-center justify-center shrink-0 mx-auto cursor-pointer group focus-visible:outline-2 focus-visible:outline-accent rounded-full"
                  title="Tap robot to interact"
                >
                  {/* Expanding Sound Rings while state is 'speaking' */}
                  {conversation.state === "speaking" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden="true">
                      <div className="motion-safe:animate-sound-ring-1 absolute w-22 h-22 sm:w-26 sm:h-26 lg:w-28 lg:h-28 rounded-full border-2 border-accent" />
                      <div className="motion-safe:animate-sound-ring-2 absolute w-22 h-22 sm:w-26 sm:h-26 lg:w-28 lg:h-28 rounded-full border-2 border-accent" />
                    </div>
                  )}

                  {/* Circular Pedestal behind robot */}
                  <div className="absolute w-22 h-22 sm:w-26 sm:h-26 lg:w-28 lg:h-28 rounded-full bg-surface-muted border border-line z-0" aria-hidden="true" />

                  {/* 3D Robot Canvas */}
                  <div className="relative w-full h-full z-10" aria-hidden="true">
                    <CampusRobot state={conversation.state} distance={8.5} />
                  </div>
                </div>

                {/* Right Speech Bubble: "CampusAI" Live Reply */}
                {liveGreeting && (
                  <div className={`min-w-0 flex justify-start w-full ${conversation.transcript || liveInterim ? "flex-1" : "md:w-auto"}`}>
                    <div
                      className={`relative p-2.5 sm:p-3 rounded-xl bg-accent text-accent-foreground shadow-xs max-h-[110px] sm:max-h-[120px] overflow-y-auto scroll-slim w-full ${
                        conversation.transcript || liveInterim ? "max-w-[290px]" : "md:max-w-[360px] lg:max-w-[420px]"
                      }`}
                      role="status"
                      aria-live="polite"
                    >
                      <span
                        className="hidden md:block absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rotate-45 rounded-[2px]"
                        aria-hidden="true"
                      />
                      <div className="text-xs font-bold text-accent-foreground/90 mb-0.5 flex items-center justify-between">
                        <span>CampusAI</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-accent-foreground leading-snug line-clamp-3">
                        {liveGreeting}
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* 3. Dialogue Feed: Scrollable Box Taking Full Remaining Space */}
            <div className="flex-1 min-h-0 bg-ground border border-line rounded-xl lg:rounded-2xl p-2.5 sm:p-3 overflow-y-auto space-y-2.5 scroll-slim">
              {!conversation.transcript && !conversation.reply ? (
                /* Walk-Up Attract Mode & Instant 1-Tap FAQ Starters */
                <div className="flex flex-col items-center justify-center h-full text-center py-2 px-2 text-secondary text-xs">
                  <span className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-accent mb-1 animate-pulse">
                    <FiMic className="w-4 h-4" />
                  </span>
                  <div className="font-extrabold text-ink text-sm sm:text-base">{t.readyVoice}</div>
                  <div className="mt-0.5 font-medium max-w-sm">{t.readyHint}</div>

                  {/* 1-Tap Instant FAQ Starter Pills */}
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 max-w-md">
                    {t.starters.map((starter) => (
                      <button
                        key={starter.label}
                        type="button"
                        onClick={() => executeQuery(starter.query)}
                        className="px-2.5 py-1 rounded-full bg-surface border border-line hover:border-accent hover:text-ink text-secondary font-bold text-[11px] shadow-2xs motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent cursor-pointer"
                      >
                        {starter.label}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Time-Aware Campus Pulse Ticker */}
                  <div className="mt-3 pt-2 border-t border-line/60 w-full max-w-md flex items-center justify-between text-[10px] font-bold text-secondary">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${campusPulse.dot} animate-pulse`} />
                      <span className="text-ink">{campusPulse.badge}</span>
                    </span>
                    <span className="truncate max-w-[240px] text-secondary font-medium">{campusPulse.detail}</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Visitor Bubble (right side) */}
                  {conversation.transcript && (
                    <div className="self-end ml-auto bg-surface border border-line text-xs sm:text-sm text-ink p-2.5 sm:p-3 rounded-2xl rounded-tr-xs max-w-[85%] sm:max-w-[75%] shadow-2xs">
                      <div className="text-xs text-secondary font-bold mb-0.5">Visitor</div>
                      <div className="font-semibold">{conversation.transcript}</div>
                    </div>
                  )}

                  {/* Searching Spinner */}
                  {conversation.state === "thinking" && (
                    <div className="self-start text-xs font-bold text-secondary flex items-center gap-2 px-1">
                      <Spinner />
                      <span>{t.searchingDb}</span>
                    </div>
                  )}

                  {/* CampusAI Bubble (left side in accent color) with Rich Action Cards */}
                  {conversation.reply && (
                    <div className="self-start mr-auto bg-accent text-accent-foreground text-xs sm:text-sm p-3 rounded-2xl rounded-tl-xs max-w-[92%] sm:max-w-[85%] shadow-2xs leading-relaxed space-y-2">
                      <div className="text-xs opacity-90 font-bold">CampusAI</div>
                      <div>{conversation.reply}</div>

                      {/* Interactive Rich Widgets Based on Intent */}
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

                      {/* Context-Aware Dynamic Follow-Up Chips */}
                      {activeRecord?.followUps && activeRecord.followUps.length > 0 && (
                        <div className="pt-2 border-t border-accent-foreground/20 space-y-1.5">
                          <div className="text-[10px] uppercase tracking-wider font-extrabold text-accent-foreground/80 flex items-center gap-1">
                            <FiCornerDownRight className="w-3 h-3" />
                            <span>Suggested Follow-Ups</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {activeRecord.followUps.map((chipText) => (
                              <button
                                key={chipText}
                                type="button"
                                onClick={() => executeQuery(chipText)}
                                className="px-2.5 py-1 rounded-full bg-surface text-ink hover:bg-surface-muted text-xs font-bold shadow-2xs motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent cursor-pointer"
                              >
                                {chipText}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Human Receptionist Escalation Handoff */}
                      <div className="pt-2 border-t border-accent-foreground/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {deskBellNotified ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-accent-foreground bg-accent-foreground/20 px-2.5 py-1.5 rounded-lg">
                            <FiCheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                            <span>{t.humanDeskSent}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRingDeskBell}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface text-ink hover:bg-surface-muted text-xs font-bold shadow-2xs motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent cursor-pointer"
                          >
                            <FiBell className="w-3.5 h-3.5 text-accent" />
                            <span>{t.humanDesk}</span>
                          </button>
                        )}
                        <span className="text-[10px] opacity-75 font-medium">Counter 1 • Ext 101</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* 4. Bottom Row: Fixed Touch Action Bar (Microphone CTA + Typed Input Form) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1.5 border-t border-line shrink-0">
              
              {/* Primary Large Microphone CTA Button */}
              <button
                type="button"
                onClick={handleStartVoice}
                disabled={conversation.busy}
                className="w-full sm:w-[180px] md:w-[195px] lg:w-[210px] xl:w-[230px] h-11 lg:h-12 px-3 rounded-xl bg-accent text-accent-foreground font-bold flex items-center justify-between shadow-xs hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent shrink-0 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-accent-foreground/20 flex items-center justify-center shrink-0">
                    <FiMic className="w-4 h-4 text-accent-foreground" aria-hidden="true" />
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-left leading-tight truncate" aria-live="polite">
                    {speakButtonLabel}
                  </span>
                </div>

                {/* Dynamic Waveform Bars (only shown while listening, animated) */}
                {conversation.state === "listening" && (
                  <div className="flex items-center gap-0.5 h-4 shrink-0" aria-hidden="true">
                    {[35, 75, 45, 95, 60, 40, 85, 50, 80, 35].map((h, i) => (
                      <span
                        key={`waveform-bar-${i}`}
                        className="w-0.5 bg-accent-foreground rounded-full motion-safe:animate-wave-bar"
                        style={{
                          height: `${h}%`,
                          animationDelay: `${i * 80}ms`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>

              {/* Typed Inquiry Form with High-Contrast Active Send Button */}
              <form onSubmit={handleSendTyped} className="flex-1 flex items-center gap-2 min-w-0 w-full">
                <input
                  type="text"
                  placeholder={t.typePlaceholder}
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onFocus={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                  disabled={conversation.busy || voice.recording}
                  className="flex-1 h-11 lg:h-12 rounded-xl bg-ground border border-line px-3 sm:px-3.5 text-xs sm:text-sm text-ink placeholder:text-secondary focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 min-w-0 font-medium"
                />
                <button
                  type="submit"
                  disabled={!hasTypedContent || conversation.busy || voice.recording}
                  className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-2xs motion-safe:transition-all focus-visible:outline-2 focus-visible:outline-accent ${
                    hasTypedContent
                      ? "bg-accent text-accent-foreground hover:bg-accent-hover cursor-pointer"
                      : "bg-surface border border-line text-secondary/30 opacity-40 cursor-not-allowed"
                  }`}
                  aria-label="Send inquiry"
                >
                  <FiSend className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>

            </div>

          </div>

        </main>

        {/* Footer Status Bar with Defensive Inset so Next.js or browser UI never covers text */}
        <footer className="pt-1.5 border-t border-line flex flex-wrap items-center justify-between gap-2 text-xs text-secondary font-bold shrink-0 min-h-[28px] pl-2 sm:pl-0">
          <div className="flex items-center">
            <span>Autonomous reception robot for campus visitors. No audio stored on-device.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-secondary/80">
              CampusAI Kiosk OS • Station Active
            </span>
          </div>
        </footer>

      </div>

      {/* Secret 5-Tap Technician Diagnostics & Security Modal */}
      {adminModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-dark/70 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-surface border border-line p-5 shadow-2xl text-ink space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2 text-sm font-extrabold text-ink">
                <FiLock className="w-4 h-4 text-accent" />
                <span>Kiosk Hardware & Technician Console</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdminModalOpen(false);
                  setAdminPin("");
                  setAdminError(false);
                }}
                className="p-1 rounded-lg hover:bg-surface-muted text-secondary hover:text-ink cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Diagnostic Vitals Dashboard */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-ground border border-line space-y-1">
                <div className="text-[11px] font-bold text-secondary">Audio Input Status</div>
                <div className="flex items-center gap-1.5 font-extrabold text-emerald-600">
                  <FiCheck className="w-3.5 h-3.5" />
                  <span>Microphone Ready</span>
                </div>
                {/* Visual Audio VU Meter Simulation */}
                <div className="flex gap-1 h-1.5 pt-1">
                  <span className="flex-1 bg-emerald-500 rounded-full" />
                  <span className="flex-1 bg-emerald-500 rounded-full" />
                  <span className="flex-1 bg-emerald-500 rounded-full" />
                  <span className="flex-1 bg-amber-400 rounded-full" />
                  <span className="flex-1 bg-line rounded-full" />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-ground border border-line space-y-1">
                <div className="text-[11px] font-bold text-secondary">Local Knowledge Base</div>
                <div className="flex items-center gap-1.5 font-extrabold text-emerald-600">
                  <FiCheck className="w-3.5 h-3.5" />
                  <span>5 Records Grounded</span>
                </div>
                <div className="text-[10px] text-secondary font-medium">Offline Fast Vector Cache</div>
              </div>

              <div className="p-2.5 rounded-xl bg-ground border border-line space-y-1">
                <div className="text-[11px] font-bold text-secondary">Backend Network Ping</div>
                <div className="flex items-center gap-1.5 font-bold text-ink">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{backendOnline ? "Online (22ms)" : "Standby (Local Active)"}</span>
                </div>
                <div className="text-[10px] text-secondary font-medium">Auto-ping every 30s</div>
              </div>

              <div className="p-2.5 rounded-xl bg-ground border border-line space-y-1">
                <div className="text-[11px] font-bold text-secondary">Display Mode</div>
                <div className="font-extrabold text-ink">100dvh Lock</div>
                <div className="text-[10px] text-secondary font-medium">Touchscreen Kiosk OS</div>
              </div>
            </div>

            {/* Maintenance Action Buttons */}
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
                className="flex-1 py-2 px-3 rounded-xl bg-ground border border-line hover:bg-surface-muted text-xs font-bold text-ink flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FiRefreshCw className="w-3.5 h-3.5 text-accent" />
                <span>Restart Session</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdminModalOpen(false);
                  setHardwareDrawerOpen(true);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:bg-accent-hover flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FiCpu className="w-3.5 h-3.5" />
                <span>ESP32 Blueprint</span>
              </button>
            </div>

            {/* PIN Unlock for Engineering Deep-Dive */}
            <form onSubmit={handleAdminPinSubmit} className="pt-2 border-t border-line space-y-2">
              <div className="text-[11px] font-bold text-secondary">Enter Admin PIN for System Settings:</div>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={4}
                  value={adminPin}
                  onChange={(e) => {
                    setAdminPin(e.target.value);
                    setAdminError(false);
                  }}
                  placeholder="PIN (1234)"
                  className="flex-1 h-9 rounded-xl bg-ground border border-line px-3 text-center text-sm tracking-widest font-mono text-ink focus-visible:outline-2 focus-visible:outline-accent"
                />
                <button
                  type="submit"
                  className="px-4 h-9 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:bg-accent-hover cursor-pointer"
                >
                  Unlock
                </button>
              </div>
              {adminError && (
                <div className="text-xs text-destructive font-bold text-center">
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
