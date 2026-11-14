"use client";

import { useState } from "react";
import { FiCompass, FiMapPin, FiNavigation, FiShare2, FiArrowRight, FiCheck } from "react-icons/fi";

interface Destination {
  id: string;
  name: string;
  department: string;
  floor: string;
  walkTime: string;
  liftRecommended: boolean;
  steps: string[];
  spokenGuidance: string;
  qrPayload: string;
  mapCoords: { start: [number, number]; waypoints: [number, number][]; end: [number, number] };
}

const DESTINATIONS: Destination[] = [
  {
    id: "hod-cs",
    name: "Dr. Rajesh Sharma (HOD CS)",
    department: "Computer Science & Engineering",
    floor: "3rd Floor, West Wing, Cabin C-301",
    walkTime: "2 min walk",
    liftRecommended: true,
    steps: [
      "From the Reception Kiosk, walk straight 20 paces toward the West Wing glass doors.",
      "Take Elevator 1 or 2 up to the 3rd Floor.",
      "Turn left exiting the elevator; Cabin C-301 is the second door on your right.",
    ],
    spokenGuidance: "Please take Elevator 2 to the 3rd floor, turn left, and Cabin C-301 will be on your immediate right.",
    qrPayload: "campusai://navigate?to=C-301&floor=3&wing=west",
    mapCoords: {
      start: [40, 260],
      waypoints: [[160, 260], [160, 90], [320, 90]],
      end: [420, 90],
    },
  },
  {
    id: "library",
    name: "Central Library & Reading Hall",
    department: "Academic Facilities",
    floor: "Ground Floor & 2nd Floor Mezzanine",
    walkTime: "1 min walk",
    liftRecommended: false,
    steps: [
      "Turn right from the reception lobby toward the main courtyard corridor.",
      "Walk 40 meters along the shaded walkway past the student notice board.",
      "Enter through the double wooden doors of the Central Library.",
    ],
    spokenGuidance: "Turn right from the reception counter and follow the courtyard corridor straight into the Central Library.",
    qrPayload: "campusai://navigate?to=LIBRARY&floor=0",
    mapCoords: {
      start: [40, 260],
      waypoints: [[40, 180], [120, 180], [120, 110]],
      end: [210, 110],
    },
  },
  {
    id: "admissions-office",
    name: "Admissions Office & Cash Counter",
    department: "Administration Block",
    floor: "Ground Floor, Room A-102",
    walkTime: "30 sec walk",
    liftRecommended: false,
    steps: [
      "Walk directly past the security turnstile behind this kiosk.",
      "Turn right into Hallway A.",
      "Room A-102 is the first counter marked 'Student Admissions & Verification'.",
    ],
    spokenGuidance: "The Admissions Office is just 30 seconds away on the ground floor. Turn right past the turnstile into Room A-102.",
    qrPayload: "campusai://navigate?to=ADMISSIONS&floor=0&room=A-102",
    mapCoords: {
      start: [40, 260],
      waypoints: [[100, 260], [100, 310]],
      end: [220, 310],
    },
  },
  {
    id: "hod-aids",
    name: "Dr. Anand Deshmukh (HOD AI & DS)",
    department: "Artificial Intelligence & Data Science",
    floor: "2nd Floor, East Wing, Cabin A-202",
    walkTime: "2 min walk",
    liftRecommended: true,
    steps: [
      "From the Kiosk, head past the auditorium towards East Wing Staircase B.",
      "Ascend to the 2nd Floor.",
      "Cabin A-202 is situated right beside the Advanced GPU Machine Learning Laboratory.",
    ],
    spokenGuidance: "Take East Staircase B to the 2nd Floor. Dr. Deshmukh's cabin A-202 is adjacent to the GPU Machine Learning Lab.",
    qrPayload: "campusai://navigate?to=A-202&floor=2&wing=east",
    mapCoords: {
      start: [40, 260],
      waypoints: [[180, 260], [280, 260], [280, 180]],
      end: [390, 180],
    },
  },
];

export function CampusWayfinder() {
  const [selectedDest, setSelectedDest] = useState<Destination>(DESTINATIONS[0]);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(selectedDest.qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="wayfinder" className="w-full py-16 sm:py-24 bg-surface border-b border-line" aria-label="Campus indoor wayfinder and route navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ground border border-line text-xs font-semibold text-secondary mb-3">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>indoor wayfinder and qr transfer</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            Directions you can take with you.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-secondary">
            CampusAI gives verbal turn-by-turn guidance and instantly generates a mobile route QR code so visitors never get lost on campus.
          </p>
        </div>

        {/* Wayfinder Interactive Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Destination Selector & Route Details (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="text-xs font-bold text-secondary">Select a campus destination</div>
            
            <div className="flex flex-col gap-2" role="tablist" aria-label="Campus destinations">
              {DESTINATIONS.map((d) => {
                const active = selectedDest.id === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedDest(d)}
                    className={`p-3.5 rounded-xl text-left border motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 flex items-center justify-between gap-3 ${
                      active
                        ? "bg-ground border-accent shadow-xs"
                        : "bg-surface border-line hover:border-line-strong hover:bg-surface-muted"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-ink">{d.name}</div>
                      <div className="text-xs text-secondary">{d.floor}</div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface border border-line text-secondary shrink-0">
                      {d.walkTime}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Turn by turn step card */}
            <div className="p-5 rounded-2xl bg-ground border border-line mt-2">
              <div className="text-xs font-bold text-secondary mb-3 flex items-center justify-between">
                <span>Turn-by-turn guidance</span>
                <span className="text-accent">{selectedDest.walkTime}</span>
              </div>
              <ol className="space-y-2.5 text-xs text-ink">
                {selectedDest.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-surface border border-line flex items-center justify-center font-bold text-[11px] text-accent shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

          </div>

          {/* Interactive Map Visualizer & Scannable QR Code (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Architectural SVG Campus Floor Plan */}
            <div className="relative rounded-2xl bg-surface-dark border border-line p-6 text-ink-dark overflow-hidden shadow-sm">
              <div className="flex items-center justify-between text-xs text-secondary-dark mb-4">
                <span>Indoor path graph // {selectedDest.floor}</span>
                <span className="text-emerald-400">A* optimal path found</span>
              </div>

              {/* Floor Plan Canvas */}
              <div className="w-full h-64 bg-surface-dark-card rounded-xl border border-surface-dark-line relative flex items-center justify-center overflow-hidden p-4">
                <svg className="w-full h-full" viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Building layout walls */}
                  <rect x="20" y="20" width="440" height="300" rx="12" stroke="var(--color-surface-dark-line)" strokeWidth="2" strokeDasharray="6 6" />
                  
                  {/* Corridors & Rooms */}
                  <rect x="30" y="30" width="120" height="100" rx="6" fill="var(--color-surface-dark)" stroke="var(--color-surface-dark-line)" strokeWidth="1.5" />
                  <text x="45" y="85" fill="var(--color-secondary-dark)" fontSize="11" fontFamily="sans-serif">Admin Block</text>

                  <rect x="180" y="30" width="130" height="100" rx="6" fill="var(--color-surface-dark)" stroke="var(--color-surface-dark-line)" strokeWidth="1.5" />
                  <text x="195" y="85" fill="var(--color-secondary-dark)" fontSize="11" fontFamily="sans-serif">Central Library</text>

                  <rect x="330" y="30" width="120" height="100" rx="6" fill="var(--color-surface-dark)" stroke="var(--color-surface-dark-line)" strokeWidth="1.5" />
                  <text x="345" y="85" fill="var(--color-secondary-dark)" fontSize="11" fontFamily="sans-serif">CS Cabins (C-301)</text>

                  <rect x="30" y="200" width="120" height="110" rx="6" fill="var(--color-surface-dark)" stroke="var(--color-surface-dark-line)" strokeWidth="1.5" />
                  <text x="45" y="255" fill="var(--color-accent)" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Kiosk Reception</text>

                  <rect x="330" y="200" width="120" height="110" rx="6" fill="var(--color-surface-dark)" stroke="var(--color-surface-dark-line)" strokeWidth="1.5" />
                  <text x="345" y="255" fill="var(--color-secondary-dark)" fontSize="11" fontFamily="sans-serif">Auditorium Hall</text>

                  {/* Route Polyline */}
                  <path
                    d={`M ${selectedDest.mapCoords.start[0]} ${selectedDest.mapCoords.start[1]} ${selectedDest.mapCoords.waypoints.map(p => `L ${p[0]} ${p[1]}`).join(' ')} L ${selectedDest.mapCoords.end[0]} ${selectedDest.mapCoords.end[1]}`}
                    stroke="var(--color-accent)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="8 6"
                    className="motion-safe:animate-pulse"
                  />

                  {/* Start Point Marker (Kiosk) */}
                  <circle cx={selectedDest.mapCoords.start[0]} cy={selectedDest.mapCoords.start[1]} r="7" fill="var(--color-accent)" />
                  <circle cx={selectedDest.mapCoords.start[0]} cy={selectedDest.mapCoords.start[1]} r="12" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.6" />

                  {/* Destination Marker */}
                  <circle cx={selectedDest.mapCoords.end[0]} cy={selectedDest.mapCoords.end[1]} r="8" fill="#10b981" />
                  <circle cx={selectedDest.mapCoords.end[0]} cy={selectedDest.mapCoords.end[1]} r="14" stroke="#10b981" strokeWidth="1.5" opacity="0.6" />
                </svg>
              </div>

              {/* Wayfinder Bottom Info */}
              <div className="mt-4 pt-4 border-t border-surface-dark-line flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-surface p-1.5 rounded-lg shrink-0 flex items-center justify-center">
                    {/* Embedded SVG QR code simulation */}
                    <svg viewBox="0 0 24 24" className="w-full h-full text-ink" fill="currentColor">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h4v4h-4v-4zm-4 4h4v4h-4v-4zm0-8h4v4h-4v-4zm4 0h4v4h-4v-4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink-dark">Scan to transfer to phone</div>
                    <div className="text-[11px] text-secondary-dark">Works offline on Android & iOS camera</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-surface-dark-card border border-surface-dark-line text-xs font-mono text-ink-dark hover:bg-surface-dark motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent flex items-center gap-1.5"
                >
                  {copied ? <FiCheck className="text-emerald-400" /> : <FiShare2 />}
                  <span>{copied ? "URI copied" : "Copy route URI"}</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
