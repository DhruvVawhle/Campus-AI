"use client";

import Link from "next/link";
import { FiRadio, FiMic, FiCamera, FiLayers, FiCheck } from "react-icons/fi";

export function KioskLaunchpad() {
  return (
    <section className="w-full py-16 sm:py-24 bg-ground border-b border-line" aria-label="Launch kiosk section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="rounded-3xl border border-line bg-surface p-8 sm:p-12 lg:p-16 shadow-xs relative overflow-hidden">
          
          {/* Subtle architectural grid pattern */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, var(--color-line-strong) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ground border border-line text-xs font-semibold text-secondary mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ready for production deployment</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight leading-tight">
              Experience the college receptionist live.
            </h2>

            <p className="mt-4 text-base sm:text-lg text-secondary leading-relaxed">
              Launch the complete touch-and-voice kiosk interface in your browser. Compatible with standard touch displays, desktop browsers, and tablets.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/kiosk"
                className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-4 rounded-xl bg-accent text-accent-foreground font-bold text-base shadow-sm hover:bg-accent-hover motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 active:scale-98"
              >
                <FiRadio className="w-5 h-5 motion-safe:animate-pulse" aria-hidden="true" />
                <span>Launch kiosk mode</span>
              </Link>

              <Link
                href="/kiosk?demo=1"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-ground text-ink font-bold text-base border border-line hover:bg-surface-muted motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 active:scale-98"
              >
                <span>Try demo mode</span>
              </Link>
            </div>

            {/* Checklist of ready capabilities */}
            <div className="mt-10 pt-6 border-t border-line grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-secondary">
              <div className="flex items-center gap-1.5">
                <FiCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>Voice input ready</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>3D Robot canvas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>Multilingual TTS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>On-device mood vision</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

