"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiMic, FiCompass, FiCpu, FiLayers, FiRadio } from "react-icons/fi";

export type LangCode = "en" | "hi" | "mr";

interface SiteHeaderProps {
  currentLang: LangCode;
  onLangChange: (lang: LangCode) => void;
}

export function SiteHeader({ currentLang, onLangChange }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-200 ${
        scrolled
          ? "bg-surface/95 backdrop-blur-md border-b border-line shadow-xs"
          : "bg-ground/80 backdrop-blur-sm border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 group text-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded-lg"
          aria-label="CampusAI home"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block motion-safe:transition-transform group-hover:scale-125" />
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Campus<span className="text-accent">AI</span>
          </span>
          <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-surface border border-line text-secondary">
            v2.4
          </span>
        </Link>

        {/* Anchor Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-semibold text-secondary" aria-label="Main navigation">
          <a
            href="#simulator"
            className="px-3 py-1.5 rounded-md hover:text-ink hover:bg-surface border border-transparent hover:border-line motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            Voice simulator
          </a>
          <a
            href="#architecture"
            className="px-3 py-1.5 rounded-md hover:text-ink hover:bg-surface border border-transparent hover:border-line motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            Multi-agent RAG
          </a>
          <a
            href="#wayfinder"
            className="px-3 py-1.5 rounded-md hover:text-ink hover:bg-surface border border-transparent hover:border-line motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            Indoor wayfinder
          </a>
          <a
            href="#hardware"
            className="px-3 py-1.5 rounded-md hover:text-ink hover:bg-surface border border-transparent hover:border-line motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            ESP32 BOM
          </a>
        </nav>

        {/* Actions & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector */}
          <fieldset
            className="flex items-center p-0.5 bg-surface rounded-lg border border-line shadow-2xs"
            aria-label="Select interface language"
          >
            <legend className="sr-only">Language</legend>
            {(
              [
                { code: "en", label: "EN" },
                { code: "hi", label: "हिंदी" },
                { code: "mr", label: "मराठी" },
              ] as const
            ).map((item) => {
              const active = currentLang === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => onLangChange(item.code)}
                  aria-pressed={active}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 ${
                    active
                      ? "bg-ink text-surface shadow-2xs"
                      : "text-secondary hover:text-ink hover:bg-surface-muted"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </fieldset>

          {/* Launch Kiosk Button */}
          <Link
            href="/kiosk"
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-accent-hover motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 active:scale-98"
          >
            <FiRadio className="w-3.5 h-3.5 motion-safe:animate-pulse" aria-hidden="true" />
            <span>Launch kiosk</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

