"use client";

import { useState } from "react";
import { FiCpu, FiRadio, FiVolume2, FiMaximize, FiShield, FiDollarSign } from "react-icons/fi";

interface ComponentBOM {
  part: string;
  category: string;
  costInr: number;
  specs: string;
  pinout: string;
}

const BOM_ITEMS: ComponentBOM[] = [
  {
    part: "ESP32-WROOM-32D Dual-Core",
    category: "Microcontroller",
    costInr: 450,
    specs: "240 MHz Tensilica Xtensa, 520 KB SRAM, Wi-Fi 802.11 b/g/n, Bluetooth v4.2 BR/EDR",
    pinout: "I2S0 (Audio In) & I2S1 (Audio Out) hardware buses dedicated for half-duplex voice",
  },
  {
    part: "INMP441 Digital Microphone",
    category: "Audio Input",
    costInr: 220,
    specs: "Bottom-ported omnidirectional I2S digital output, 61 dBA SNR, -26 dBFS sensitivity",
    pinout: "SCK -> GPIO 14, WS -> GPIO 15, SD -> GPIO 32, L/R -> GND (Left Channel)",
  },
  {
    part: "MAX98357A Class D Amplifier",
    category: "Audio Output",
    costInr: 190,
    specs: "3.2W into 4Ω at 5V, 92% efficiency, filterless, integrated I2S DAC",
    pinout: "BCLK -> GPIO 26, LRC -> GPIO 25, DIN -> GPIO 22, GAIN -> GND (12dB)",
  },
  {
    part: "4Ω 3W Shielded Speaker Chamber",
    category: "Acoustics",
    costInr: 140,
    specs: "Acoustically isolated chamber preventing microphonic chassis resonance",
    pinout: "Connected directly to MAX98357A SPK+ / SPK- differential terminals",
  },
  {
    part: "7-inch IPS Touch Display",
    category: "Kiosk Touchscreen",
    costInr: 1500,
    specs: "1024x600 resolution, 5-point capacitive touch, wide 178° viewing angle",
    pinout: "HDMI display driver + USB HID capacitive touch controller",
  },
  {
    part: "Biomorphic Robot Chassis",
    category: "Enclosure",
    costInr: 300,
    specs: "3D-printed PETG head with internal cable channels and dual-bearing pan/tilt joint",
    pinout: "Houses microphone array in forehead and speaker chamber in chest cavity",
  },
];

export function HardwareSection() {
  const [activeTab, setActiveTab] = useState<"bom" | "suppression">("bom");
  const totalCost = BOM_ITEMS.reduce((sum, item) => sum + item.costInr, 0);

  return (
    <section id="hardware" className="w-full py-16 sm:py-24 bg-ground border-b border-line" aria-label="ESP32 hardware bill of materials and edge specifications">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-line text-xs font-semibold text-secondary mb-3">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>zero-cost edge hardware</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            Built for under ₹2,800.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-secondary">
            Rather than requiring expensive proprietary robotics hardware, CampusAI runs on accessible microcontrollers and commercial web tablets deployable in any institution.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mb-8" role="tablist" aria-label="Hardware views">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "bom"}
            onClick={() => setActiveTab("bom")}
            className={`px-4 py-2 rounded-lg text-xs font-bold motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              activeTab === "bom"
                ? "bg-ink text-surface shadow-2xs"
                : "bg-surface text-secondary border border-line hover:text-ink hover:bg-surface-muted"
            }`}
          >
            Bill of materials (BOM)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "suppression"}
            onClick={() => setActiveTab("suppression")}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              activeTab === "suppression"
                ? "bg-ink text-surface shadow-2xs"
                : "bg-surface text-secondary border border-line hover:text-ink hover:bg-surface-muted"
            }`}
          >
            Acoustic suppression
          </button>
        </div>

        {/* BOM Table */}
        {activeTab === "bom" ? (
          <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-ground border-b border-line text-secondary font-semibold">
                    <th className="py-3.5 px-4 sm:px-6">Component part</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">Function</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">Bus / Pinout</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Est. cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {BOM_ITEMS.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface-muted/50 motion-safe:transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-bold text-ink">{item.part}</div>
                        <div className="text-xs text-secondary mt-0.5 sm:hidden">{item.category}</div>
                        <div className="text-xs text-secondary-dark mt-1 font-mono hidden sm:block lg:hidden">
                          {item.specs}
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden sm:table-cell text-secondary font-medium">
                        {item.category}
                      </td>
                      <td className="py-4 px-4 hidden lg:table-cell text-xs font-mono text-secondary">
                        {item.pinout}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right font-mono font-bold text-ink whitespace-nowrap">
                        ₹{item.costInr.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-ground/60 border-t-2 border-line font-bold">
                    <td className="py-4 px-4 sm:px-6 text-ink" colSpan={2}>
                      Total hardware unit cost
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell text-xs text-secondary font-normal">
                      Excludes free cloud AI tiers (Groq & Edge-TTS are zero-cost)
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right font-mono text-base text-accent">
                      ₹{totalCost.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          /* Half Duplex Suppression Explanation */
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 flex flex-col gap-4">
                <h3 className="text-xl font-bold text-ink">
                  Preventing self-echo feedback without expensive DSP chips.
                </h3>
                <p className="text-sm text-secondary leading-relaxed">
                  Traditional college kiosks struggle when the loudspeaker audio feeds back into the microphone, triggering continuous hallucinations. CampusAI solves this with half-duplex hardware state switching:
                </p>
                <ul className="space-y-3 text-xs sm:text-sm text-ink">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span><strong>Audio Mute Guardrail:</strong> When Edge-TTS audio stream begins playing through the MAX98357A amplifier, the I2S microphone input DMA buffer is automatically paused.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span><strong>400ms Post-Speech Lull:</strong> Once playback finishes, the system waits 400 milliseconds to allow room reverberation in large college marble foyers to decay before re-enabling speech detection.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span><strong>WebRTC VAD Filter:</strong> Filters out background cafeteria chatter, engine rumblings, and hallway footsteps, triggering speech capture only on real human voice cadence.</span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-5 p-5 rounded-xl bg-ground border border-line flex flex-col gap-3 font-mono text-xs">
                <div className="text-secondary font-bold">ACOUSTIC CONTROL LOG // ESP32</div>
                <div className="p-3 rounded-lg bg-surface border border-line text-ink leading-relaxed">
                  [TTS] Audio playback started (16kHz PCM)<br/>
                  [I2S] Mic DMA channel paused (echo clamp)<br/>
                  [TTS] Sentence finished (1,240 bytes)<br/>
                  [GATE] 400ms reverberation decay wait<br/>
                  [VAD] WebRTC voice listener re-armed
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold">
                  Zero loopback echo artifacts observed
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
