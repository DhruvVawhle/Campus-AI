"use client";

import { useState } from "react";
import {
  FiX,
  FiCpu,
  FiLayers,
  FiCompass,
  FiShield,
  FiDatabase,
  FiRadio,
  FiCheck,
  FiShare2,
  FiVolume2,
  FiPlay,
  FiActivity,
  FiMapPin,
} from "react-icons/fi";
import { speakTextAloud } from "@/lib/kiosk/speech-synth";

interface HardwareDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface DestinationRoute {
  id: string;
  name: string;
  floor: string;
  walkTime: string;
  steps: string[];
  qrUri: string;
  coords: { start: [number, number]; waypoints: [number, number][]; end: [number, number] };
}

const DESTINATIONS: DestinationRoute[] = [
  {
    id: "hod-cs",
    name: "Dr. Rajesh Sharma (HOD CS)",
    floor: "3rd Floor, West Wing, Cabin C-301",
    walkTime: "2 min walk",
    steps: [
      "Walk straight 20 paces toward West Wing glass doors.",
      "Take Elevator 2 to 3rd Floor.",
      "Turn left exiting elevator; Cabin C-301 is second door on right.",
    ],
    qrUri: "campusai://navigate?to=C-301&floor=3",
    coords: { start: [40, 260], waypoints: [[160, 260], [160, 90], [320, 90]], end: [420, 90] },
  },
  {
    id: "library",
    name: "Central Library",
    floor: "Ground Floor, Courtyard Block",
    walkTime: "1 min walk",
    steps: [
      "Turn right from reception lobby toward main courtyard corridor.",
      "Walk 40 meters along the shaded walkway.",
      "Enter through double wooden doors.",
    ],
    qrUri: "campusai://navigate?to=LIBRARY&floor=0",
    coords: { start: [40, 260], waypoints: [[40, 180], [120, 180], [120, 110]], end: [210, 110] },
  },
  {
    id: "admissions",
    name: "Admissions Office (Room A-102)",
    floor: "Ground Floor, Admin Block",
    walkTime: "30 sec walk",
    steps: [
      "Walk past the security turnstile behind this kiosk.",
      "Turn right into Hallway A.",
      "Room A-102 is counter 1 for student verification.",
    ],
    qrUri: "campusai://navigate?to=ADMISSIONS&room=A-102",
    coords: { start: [40, 260], waypoints: [[100, 260], [100, 310]], end: [220, 310] },
  },
];

export function HardwareDrawer({ open, onClose }: HardwareDrawerProps) {
  const [tab, setTab] = useState<"bom" | "suppression" | "rag" | "wayfinder">("bom");
  const [highlightedBus, setHighlightedBus] = useState<string | null>(null);
  const [decayActive, setDecayActive] = useState(false);
  const [decayProgress, setDecayProgress] = useState(0);
  const [selectedRoute, setSelectedRoute] = useState<DestinationRoute>(DESTINATIONS[0]);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleTestAcousticDecay = () => {
    if (decayActive) return;
    setDecayActive(true);
    setDecayProgress(100);

    const interval = setInterval(() => {
      setDecayProgress((prev) => {
        if (prev <= 10) {
          clearInterval(interval);
          setDecayActive(false);
          return 0;
        }
        return prev - 10;
      });
    }, 40); // 10 steps of 40ms = 400ms decay
  };

  const handlePlayVoiceSample = (lang: "en" | "hi" | "mr") => {
    setPlayingVoice(lang);
    const sampleText =
      lang === "en"
        ? "Dr. Rajesh Sharma is in Cabin C-301 on the 3rd floor."
        : lang === "hi"
        ? "डॉ. राजेश शर्मा का केबिन वेस्ट विंग की तीसरी मंजिल पर C-301 है।"
        : "डॉ. राजेश शर्मा यांचे केबिन तिसऱ्या मजल्यावर C-301 येथे आहे.";

    speakTextAloud(
      sampleText,
      lang,
      () => setPlayingVoice(lang),
      () => setPlayingVoice(null)
    );
  };

  const handleCopyUri = () => {
    navigator.clipboard?.writeText(selectedRoute.qrUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-surface-dark/70 backdrop-blur-xs motion-safe:transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} aria-hidden="true" />

      {/* Drawer Surface */}
      <div className="w-full max-w-2xl h-full bg-ground border-l border-line shadow-2xl flex flex-col overflow-hidden text-ink">
        
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-line bg-surface flex items-center justify-between">
          <div>
            <h2 id="drawer-title" className="text-xl font-extrabold text-ink tracking-tight">
              Robot & Architecture Blueprint
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Hardware bill of materials, echo suppression, and agent architecture.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-ground border border-line flex items-center justify-center text-secondary hover:text-ink hover:bg-surface-muted motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent"
            aria-label="Close drawer"
          >
            <FiX className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2 border-b border-line bg-surface/60 flex items-center gap-2 overflow-x-auto" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "bom"}
            onClick={() => setTab("bom")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98 ${
              tab === "bom" ? "bg-ink text-surface shadow-2xs" : "text-secondary hover:text-ink hover:bg-surface-muted"
            }`}
          >
            ESP32 BOM (~₹2,800)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "suppression"}
            onClick={() => setTab("suppression")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98 ${
              tab === "suppression" ? "bg-ink text-surface shadow-2xs" : "text-secondary hover:text-ink hover:bg-surface-muted"
            }`}
          >
            Acoustic suppression
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "rag"}
            onClick={() => setTab("rag")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98 ${
              tab === "rag" ? "bg-ink text-surface shadow-2xs" : "text-secondary hover:text-ink hover:bg-surface-muted"
            }`}
          >
            Multi-agent RAG
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "wayfinder"}
            onClick={() => setTab("wayfinder")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98 ${
              tab === "wayfinder" ? "bg-ink text-surface shadow-2xs" : "text-secondary hover:text-ink hover:bg-surface-muted"
            }`}
          >
            Indoor wayfinding & QR
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6 scroll-slim">
          
          {tab === "bom" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface border border-line">
                <div className="text-xs font-bold text-secondary mb-1">Interactive Pinout & Bus Inspector</div>
                <p className="text-xs text-secondary leading-relaxed">
                  Hover or tap any hardware module below to trace its physical GPIO connections on the ESP32 microcontroller.
                </p>

                {/* Interactive Pinout Visualizer */}
                <div className="mt-3 p-3 rounded-lg bg-ground border border-line grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div
                    onMouseEnter={() => setHighlightedBus("i2s-mic")}
                    className={`p-2 rounded-md border motion-safe:transition-colors cursor-pointer ${
                      highlightedBus === "i2s-mic" ? "bg-accent text-accent-foreground border-accent" : "bg-surface border-line"
                    }`}
                  >
                    <div className="font-bold">INMP441 Mic</div>
                    <div className="text-[10px] opacity-80">GPIO 14, 15, 32</div>
                  </div>

                  <div
                    onMouseEnter={() => setHighlightedBus("i2s-amp")}
                    className={`p-2 rounded-md border motion-safe:transition-colors cursor-pointer ${
                      highlightedBus === "i2s-amp" ? "bg-accent text-accent-foreground border-accent" : "bg-surface border-line"
                    }`}
                  >
                    <div className="font-bold">MAX98357A Amp</div>
                    <div className="text-[10px] opacity-80">GPIO 22, 25, 26</div>
                  </div>

                  <div
                    onMouseEnter={() => setHighlightedBus("display")}
                    className={`p-2 rounded-md border motion-safe:transition-colors cursor-pointer ${
                      highlightedBus === "display" ? "bg-accent text-accent-foreground border-accent" : "bg-surface border-line"
                    }`}
                  >
                    <div className="font-bold">7-in IPS Touch</div>
                    <div className="text-[10px] opacity-80">HDMI + USB HID</div>
                  </div>

                  <div
                    onMouseEnter={() => setHighlightedBus("servo")}
                    className={`p-2 rounded-md border motion-safe:transition-colors cursor-pointer ${
                      highlightedBus === "servo" ? "bg-accent text-accent-foreground border-accent" : "bg-surface border-line"
                    }`}
                  >
                    <div className="font-bold">Head Pan/Tilt</div>
                    <div className="text-[10px] opacity-80">PWM GPIO 18, 19</div>
                  </div>
                </div>
              </div>

              {/* BOM Table */}
              <div className="rounded-xl border border-line bg-surface overflow-hidden text-xs shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-ground border-b border-line font-semibold text-secondary">
                      <th className="py-2.5 px-4">Component</th>
                      <th className="py-2.5 px-4">Specs & Wiring</th>
                      <th className="py-2.5 px-4 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    <tr className={highlightedBus === "esp32" ? "bg-accent/10" : ""}>
                      <td className="py-3 px-4 font-bold text-ink">ESP32-WROOM-32D</td>
                      <td className="py-3 px-4 text-secondary">240 MHz dual-core, dedicated I2S buses</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-ink">₹450</td>
                    </tr>
                    <tr className={highlightedBus === "i2s-mic" ? "bg-accent/10" : ""}>
                      <td className="py-3 px-4 font-bold text-ink">INMP441 Digital Mic</td>
                      <td className="py-3 px-4 text-secondary">I2S digital input (SCK: 14, WS: 15, SD: 32)</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-ink">₹220</td>
                    </tr>
                    <tr className={highlightedBus === "i2s-amp" ? "bg-accent/10" : ""}>
                      <td className="py-3 px-4 font-bold text-ink">MAX98357A 3W Amp</td>
                      <td className="py-3 px-4 text-secondary">I2S DAC + Class D (BCLK: 26, LRC: 25, DIN: 22)</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-ink">₹190</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-ink">4Ω 3W Speaker Chamber</td>
                      <td className="py-3 px-4 text-secondary">Acoustically isolated chamber in chest</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-ink">₹140</td>
                    </tr>
                    <tr className={highlightedBus === "display" ? "bg-accent/10" : ""}>
                      <td className="py-3 px-4 font-bold text-ink">7-inch IPS Display</td>
                      <td className="py-3 px-4 text-secondary">Capacitive 5-point touch kiosk screen</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-ink">₹1,500</td>
                    </tr>
                    <tr className={highlightedBus === "servo" ? "bg-accent/10" : ""}>
                      <td className="py-3 px-4 font-bold text-ink">3D PETG Chassis</td>
                      <td className="py-3 px-4 text-secondary">Head enclosure with pan/tilt servo mount</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-ink">₹300</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-ground border-t-2 border-line font-bold">
                      <td className="py-3 px-4 text-ink" colSpan={2}>Total unit hardware cost</td>
                      <td className="py-3 px-4 text-right font-mono text-accent">₹2,800</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {tab === "suppression" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface border border-line">
                <div className="text-xs font-bold text-secondary mb-1">Acoustic Loopback Prevention</div>
                <p className="text-xs text-secondary leading-relaxed">
                  Loudspeakers in college marble lobbies easily feedback into the microphone. CampusAI eliminates self-echo loops through hardware half-duplex state switching:
                </p>
              </div>

              {/* Live Interactive Acoustic Gate Simulator */}
              <div className="p-4 rounded-xl bg-surface border border-line space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">Live Acoustic Gate Simulator</span>
                  <button
                    type="button"
                    onClick={handleTestAcousticDecay}
                    disabled={decayActive}
                    className="px-3 py-1 rounded-lg bg-accent text-accent-foreground font-bold hover:bg-accent-hover disabled:opacity-50 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98"
                  >
                    {decayActive ? "Decay in progress…" : "Test 400ms decay gate"}
                  </button>
                </div>

                {/* State Progress Bar */}
                <div className="p-3 rounded-lg bg-ground border border-line space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span>
                      Gate State:{" "}
                      <strong className={decayActive ? "text-accent" : "text-success"}>
                        {decayActive ? "MIC CLAMPED (Echo Protection Active)" : "LISTENER ARMED (WebRTC VAD)"}
                      </strong>
                    </span>
                    <span>{decayActive ? `${decayProgress * 4}ms remaining` : "Idle"}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-muted overflow-hidden">
                    <div
                      className="h-full bg-accent motion-safe:transition-opacity"
                      style={{ width: `${decayProgress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 text-secondary">
                  <div>1. When TTS speaker audio triggers, the I2S microphone DMA buffer is instantly muted.</div>
                  <div>2. After audio concludes, a 400ms reverberation timer allows echoes in stone foyers to decay.</div>
                  <div>3. WebRTC VAD re-arms without any acoustic loopback or self-prompt hallucinations.</div>
                </div>
              </div>
            </div>
          )}

          {tab === "rag" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface border border-line">
                <div className="text-xs font-bold text-secondary mb-1">Zero-Hallucination Multi-Agent RAG</div>
                <p className="text-xs text-secondary leading-relaxed">
                  Campus inquiries route to specialized deterministic agents rather than ungrounded generative predictions. Test the neural voice audio samples below:
                </p>

                {/* Neural Voice Synthesizer Tester */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayVoiceSample("en")}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98 ${
                      playingVoice === "en" ? "bg-accent text-accent-foreground border-accent" : "bg-surface border-line text-ink hover:bg-surface-muted"
                    }`}
                  >
                    <FiVolume2 className="w-3.5 h-3.5" />
                    <span>English audio sample</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlayVoiceSample("hi")}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98 ${
                      playingVoice === "hi" ? "bg-accent text-accent-foreground border-accent" : "bg-surface border-line text-ink hover:bg-surface-muted"
                    }`}
                  >
                    <FiVolume2 className="w-3.5 h-3.5" />
                    <span>हिंदी ऑडियो सैंपल</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlayVoiceSample("mr")}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98 ${
                      playingVoice === "mr" ? "bg-accent text-accent-foreground border-accent" : "bg-surface border-line text-ink hover:bg-surface-muted"
                    }`}
                  >
                    <FiVolume2 className="w-3.5 h-3.5" />
                    <span>मराठी ऑडिओ नमुना</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-surface border border-line text-xs">
                  <div className="font-bold text-ink">Faculty & Cabins Agent (SQLite)</div>
                  <div className="text-secondary mt-1">Queries verified room and cabin records from <code>data/campusai.db</code> (e.g. Dr. Rajesh Sharma, HOD CS, Cabin C-301).</div>
                </div>
                <div className="p-3.5 rounded-xl bg-surface border border-line text-xs">
                  <div className="font-bold text-ink">Admissions & Syllabus Agent (FAISS RAG)</div>
                  <div className="text-secondary mt-1">Embeds official college brochures via <code>multilingual-e5-small</code>. Rejects any retrieval below confidence 0.65.</div>
                </div>
                <div className="p-3.5 rounded-xl bg-surface border border-line text-xs">
                  <div className="font-bold text-ink">Human Escalation Guardrail</div>
                  <div className="text-secondary mt-1">Automatically directs disputed or undocumented questions to Counter 2 at the reception desk.</div>
                </div>
              </div>
            </div>
          )}

          {tab === "wayfinder" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface border border-line">
                <div className="text-xs font-bold text-secondary mb-2">Interactive Floor Path & Mobile QR Transfer</div>
                
                {/* Destination Selector */}
                <div className="flex flex-wrap gap-1.5 mb-3" role="tablist">
                  {DESTINATIONS.map((dest) => (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => setSelectedRoute(dest)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98 ${
                        selectedRoute.id === dest.id
                          ? "bg-ink text-surface shadow-2xs"
                          : "bg-surface border border-line text-secondary hover:text-ink"
                      }`}
                    >
                      {dest.name}
                    </button>
                  ))}
                </div>

                {/* SVG Route Map */}
                <div className="w-full h-48 bg-surface-dark rounded-xl border border-line p-3 relative overflow-hidden flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 480 340" fill="none">
                    <rect x="20" y="20" width="440" height="300" rx="12" stroke="var(--color-surface-dark-line)" strokeWidth="2" strokeDasharray="6 6" />
                    
                    <rect x="30" y="30" width="120" height="100" rx="6" fill="var(--color-surface-dark)" stroke="var(--color-surface-dark-line)" strokeWidth="1.5" />
                    <text x="45" y="85" fill="var(--color-secondary-dark)" fontSize="11" fontFamily="sans-serif">Admin Block</text>

                    <rect x="180" y="30" width="130" height="100" rx="6" fill="var(--color-surface-dark)" stroke="var(--color-surface-dark-line)" strokeWidth="1.5" />
                    <text x="195" y="85" fill="var(--color-secondary-dark)" fontSize="11" fontFamily="sans-serif">Central Library</text>

                    <rect x="330" y="30" width="120" height="100" rx="6" fill="var(--color-surface-dark)" stroke="var(--color-surface-dark-line)" strokeWidth="1.5" />
                    <text x="345" y="85" fill="var(--color-secondary-dark)" fontSize="11" fontFamily="sans-serif">CS Cabins (C-301)</text>

                    <rect x="30" y="200" width="120" height="110" rx="6" fill="var(--color-surface-dark)" stroke="var(--color-surface-dark-line)" strokeWidth="1.5" />
                    <text x="45" y="255" fill="var(--color-accent)" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Kiosk Reception</text>

                    {/* Route Polyline */}
                    <path
                      d={`M ${selectedRoute.coords.start[0]} ${selectedRoute.coords.start[1]} ${selectedRoute.coords.waypoints.map(p => `L ${p[0]} ${p[1]}`).join(' ')} L ${selectedRoute.coords.end[0]} ${selectedRoute.coords.end[1]}`}
                      stroke="var(--color-accent)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="8 6"
                      className="motion-safe:animate-pulse"
                    />

                    <circle cx={selectedRoute.coords.start[0]} cy={selectedRoute.coords.start[1]} r="6" fill="var(--color-accent)" />
                    <circle cx={selectedRoute.coords.end[0]} cy={selectedRoute.coords.end[1]} r="7" fill="#10b981" />
                  </svg>
                </div>

                {/* QR and Transfer Action */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-line text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink">{selectedRoute.floor}</span>
                    <span className="text-accent">({selectedRoute.walkTime})</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyUri}
                    className="px-2.5 py-1 rounded bg-ground border border-line text-xs font-semibold flex items-center gap-1 hover:bg-surface-muted motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98"
                  >
                    {copied ? <FiCheck className="text-success" /> : <FiShare2 />}
                    <span>{copied ? "URI copied" : "Copy route URI"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-line bg-surface flex items-center justify-between text-xs text-secondary">
          <span>CampusAI Reception Kiosk</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-ink text-surface font-bold hover:bg-ink/90 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent active:scale-98"
          >
            Return to kiosk
          </button>
        </div>

      </div>
    </div>
  );
}
