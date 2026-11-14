"use client";

import Link from "next/link";
import { FiGithub, FiRadio, FiTerminal } from "react-icons/fi";

export function SiteFooter() {
  return (
    <footer className="w-full bg-ground border-t border-line py-12 text-xs text-secondary" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-line">
          
          {/* Brand & Mission (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group text-ink focus-visible:outline-2 focus-visible:outline-accent rounded-md self-start"
              aria-label="CampusAI home"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block motion-safe:transition-transform group-hover:scale-125" />
              <span className="text-xl font-extrabold tracking-tight">
                Campus<span className="text-accent">AI</span>
              </span>
            </Link>
            <p className="max-w-sm text-secondary leading-relaxed">
              Autonomous, multilingual college receptionist robot powered by free cloud AI and multi-agent RAG architecture.
            </p>
            <div className="text-[11px] text-secondary">
              Open-source under MIT License. Designed for colleges and universities.
            </div>
          </div>

          {/* System Links (3 cols) */}
          <div className="md:col-span-3 flex flex-col gap-2">
            <div className="font-bold text-ink mb-1">Architecture and tools</div>
            <a href="#simulator" className="hover:text-ink motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent rounded">
              Voice query simulator
            </a>
            <a href="#architecture" className="hover:text-ink motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent rounded">
              Multi-agent router
            </a>
            <a href="#wayfinder" className="hover:text-ink motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent rounded">
              Indoor wayfinder and QR
            </a>
            <a href="#hardware" className="hover:text-ink motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent rounded">
              ESP32 bill of materials
            </a>
          </div>

          {/* Reception Kiosk Links (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-2">
            <div className="font-bold text-ink mb-1">Interactive interfaces</div>
            <Link href="/kiosk" className="hover:text-ink motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent rounded">
              Launch full kiosk screen
            </Link>
            <Link href="/kiosk?demo=1" className="hover:text-ink motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent rounded">
              Kiosk standby demo mode
            </Link>
            <div className="pt-2 text-[11px] text-secondary">
              Multilingual speech synthesis powered by edge-tts with Indian accents (Neerja, Swara, Aarohi).
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-wrap items-center justify-between gap-4 text-secondary text-[11px]">
          <div>
            <span>CampusAI College Reception Kiosk</span>
            <span className="mx-2 text-line-strong">/</span>
            <span>Camera estimates mood on-device; zero voice recordings stored</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/jayeshtiwari-ai/CampusAI"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-ink motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent rounded"
            >
              <FiGithub className="w-3.5 h-3.5" aria-hidden="true" />
              <span>GitHub repository</span>
            </a>
            <span className="text-line-strong">/</span>
            <span>MIT License</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

