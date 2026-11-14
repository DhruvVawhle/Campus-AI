"use client";

import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
import { FiMic, FiCompass, FiCpu, FiCheck, FiPlay, FiVolume2 } from "react-icons/fi";
import type { LangCode } from "./site-header";
import type { RobotState } from "@/components/robot/campus-robot";

const CampusRobot = dynamic(
  () => import("@/components/robot/campus-robot"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-48 h-48 rounded-full border-2 border-line bg-surface-muted motion-safe:animate-pulse" />
      </div>
    ),
  }
);

interface HeroStageProps {
  currentLang: LangCode;
  onLangChange: (lang: LangCode) => void;
}

const GREETINGS: Record<LangCode, { title: string; subtitle: string; speech: string }> = {
  en: {
    title: "Welcome to campus",
    subtitle: "Ask about admissions, fee structures, faculty cabins, or exam schedules.",
    speech: "Hello! I am CampusAI. Walk up and speak naturally, or touch the screen to begin.",
  },
  hi: {
    title: "कैंपस में आपका स्वागत है",
    subtitle: "प्रवेश प्रक्रिया, फीस संरचना, फैकल्टी केबिन या परीक्षा समय सारिणी पूछें।",
    speech: "नमस्ते! मैं CampusAI हूँ। आप सीधे बोलकर या स्क्रीन छूकर पूछ सकते हैं।",
  },
  mr: {
    title: "कॅम्पसमध्ये आपले स्वागत आहे",
    subtitle: "प्रवेश प्रक्रिया, फी रचना, प्राध्यापकांची केबिन किंवा परीक्षा वेळापत्रक विचारा.",
    speech: "नमस्कार! मी CampusAI आहे. थेट बोला किंवा स्क्रीनवर स्पर्श करून मदत मिळवा.",
  },
};

const ROBOT_STATES: { state: RobotState; label: string }[] = [
  { state: "idle", label: "Idle" },
  { state: "listening", label: "Listening" },
  { state: "thinking", label: "Thinking" },
  { state: "speaking", label: "Speaking" },
];

export function HeroStage({ currentLang, onLangChange }: HeroStageProps) {
  const [robotState, setRobotState] = useState<RobotState>("idle");
  const greeting = GREETINGS[currentLang];

  return (
    <section className="relative w-full border-b border-line bg-ground py-10 sm:py-16 lg:py-20" aria-label="Hero introduction">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Messaging & Controls (7 columns) */}
          <div className="lg:col-span-7 flex flex-col justify-center gap-6">
            
            {/* Category Marker */}
            <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-surface border border-line text-xs font-semibold text-secondary">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span>autonomous college receptionist</span>
            </div>

            {/* Headline: <= 7 words, Roman, no italics */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink leading-tight">
              The autonomous college receptionist.
            </h1>

            {/* Sentence: <= 12 words */}
            <p className="text-lg sm:text-xl font-medium text-secondary max-w-xl leading-relaxed">
              Voice-first guidance in English, Hindi, and Marathi.
            </p>

            {/* Primary Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/kiosk"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent text-accent-foreground font-bold text-base shadow-sm hover:bg-accent-hover motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 active:scale-98"
              >
                <FiMic className="w-5 h-5" aria-hidden="true" />
                <span>Launch kiosk</span>
              </Link>

              <a
                href="#simulator"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-surface text-ink font-bold text-base border border-line hover:bg-surface-muted motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 active:scale-98"
              >
                <FiPlay className="w-4 h-4 text-accent" aria-hidden="true" />
                <span>Test live query</span>
              </a>
            </div>

            {/* Real Hardware & Latency Specifications */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-line max-w-lg">
              <div>
                <div className="text-xs font-medium text-secondary">STT response</div>
                <div className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">240 ms</div>
                <div className="text-xs text-secondary">Groq Whisper v3</div>
              </div>
              <div>
                <div className="text-xs font-medium text-secondary">Hardware cost</div>
                <div className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">₹2,800</div>
                <div className="text-xs text-secondary">ESP32 + I2S mic</div>
              </div>
              <div>
                <div className="text-xs font-medium text-secondary">Hallucination rate</div>
                <div className="text-xl sm:text-2xl font-extrabold text-accent tracking-tight">0.0%</div>
                <div className="text-xs text-secondary">Gated SQL + RAG</div>
              </div>
            </div>

            {/* Interactive Robot State Tester */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-secondary mb-2">Simulate robot state</div>
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Simulate robot state">
                {ROBOT_STATES.map((s) => {
                  const active = robotState === s.state;
                  return (
                    <button
                      key={s.state}
                      type="button"
                      onClick={() => setRobotState(s.state)}
                      aria-pressed={active}
                      className={`px-3 py-1 rounded-md text-xs font-bold motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 ${
                        active
                          ? "bg-ink text-surface shadow-2xs"
                          : "bg-surface text-secondary border border-line hover:text-ink hover:bg-surface-muted"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: 3D Robot & Interactive Speech Viewport (5 columns) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl bg-surface border border-line p-4 shadow-sm flex flex-col items-center justify-center overflow-hidden">
              
              {/* Subtle architectural backdrop grid */}
              <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle at 1px 1px, var(--color-line-strong) 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
                aria-hidden="true"
              />

              {/* State Indicator Header */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-xs font-semibold text-secondary">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ground border border-line">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      robotState === "listening"
                        ? "bg-accent motion-safe:animate-ping"
                        : robotState === "thinking"
                        ? "bg-amber-500 motion-safe:animate-pulse"
                        : robotState === "speaking"
                        ? "bg-emerald-500 motion-safe:animate-pulse"
                        : "bg-secondary"
                    }`}
                  />
                  <span className="capitalize">{robotState} state</span>
                </span>

                <span className="px-2.5 py-1 rounded-full bg-ground border border-line text-ink font-bold">
                  Three.js 3D Viewport
                </span>
              </div>

              {/* 3D Robot Canvas */}
              <div className="relative w-full h-full pt-6 pb-2" aria-hidden="true">
                <CampusRobot state={robotState} distance={11} />
              </div>

              {/* Live Speech Bubble */}
              <div
                className="absolute bottom-4 left-4 right-4 z-20 p-3 rounded-xl bg-surface/95 backdrop-blur-sm border border-line shadow-xs text-xs font-medium text-ink"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center justify-between text-secondary mb-1">
                  <span className="font-bold text-accent flex items-center gap-1">
                    <FiVolume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Reception Speech
                  </span>
                  <span>{currentLang.toUpperCase()}</span>
                </div>
                <p className="leading-snug">{greeting.speech}</p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
