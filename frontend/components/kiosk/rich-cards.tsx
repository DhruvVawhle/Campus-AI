"use client";

import { useState } from "react";
import {
  FiMapPin,
  FiCompass,
  FiShare2,
  FiVolume2,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiSmartphone,
  FiCopy,
} from "react-icons/fi";
import type { GroundedCampusRecord } from "@/lib/kiosk/campus-knowledge";

interface WayfindingLocation {
  room: string;
  floor: string;
  wing?: string;
  block?: string;
  landmark?: string;
  walkTime: string;
  waypointSteps?: string[];
  mapCoordinates?: {
    start: [number, number];
    elevator: [number, number];
    destination: [number, number];
  };
}

interface WayfindingCardProps {
  location: WayfindingLocation;
  title?: string;
  qrUri?: string;
  onOpenDrawer?: () => void;
}

export interface PhoneQrModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  qrUri: string;
}

export function PhoneQrModal({ open, onClose, title, description, qrUri }: PhoneQrModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(qrUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface border border-line rounded-xl shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
      >
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-accent-surface text-slrtce-maroon flex items-center justify-center">
              <FiSmartphone className="w-4 h-4" />
            </span>
            <h3 id="qr-modal-title" className="text-base font-bold text-slrtce-navy">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-ground text-secondary hover:text-ink cursor-pointer"
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center space-y-3">
          {/* High-Contrast Crisp SVG QR Code */}
          <div className="p-3 rounded-xl bg-white border border-line shadow-xs">
            <svg viewBox="0 0 100 100" className="w-44 h-44" role="img" aria-label="QR Code">
              <rect width="100" height="100" fill="#FFFFFF" />
              {/* Corner 1: Top-Left */}
              <rect x="10" y="10" width="24" height="24" fill="#18181B" rx="2" />
              <rect x="14" y="14" width="16" height="16" fill="#FFFFFF" rx="1" />
              <rect x="18" y="18" width="8" height="8" fill="#7A1C24" rx="1" />
              {/* Corner 2: Top-Right */}
              <rect x="66" y="10" width="24" height="24" fill="#18181B" rx="2" />
              <rect x="70" y="14" width="16" height="16" fill="#FFFFFF" rx="1" />
              <rect x="74" y="18" width="8" height="8" fill="#7A1C24" rx="1" />
              {/* Corner 3: Bottom-Left */}
              <rect x="10" y="66" width="24" height="24" fill="#18181B" rx="2" />
              <rect x="14" y="70" width="16" height="16" fill="#FFFFFF" rx="1" />
              <rect x="18" y="74" width="8" height="8" fill="#7A1C24" rx="1" />
              {/* Pattern Blocks */}
              <rect x="40" y="12" width="6" height="6" fill="#18181B" />
              <rect x="52" y="12" width="6" height="6" fill="#18181B" />
              <rect x="40" y="24" width="12" height="6" fill="#18181B" />
              <rect x="12" y="42" width="6" height="12" fill="#18181B" />
              <rect x="24" y="42" width="6" height="6" fill="#18181B" />
              <rect x="36" y="38" width="8" height="8" fill="#7A1C24" />
              <rect x="48" y="38" width="8" height="8" fill="#1B365D" />
              <rect x="60" y="38" width="6" height="8" fill="#18181B" />
              <rect x="72" y="42" width="8" height="6" fill="#18181B" />
              <rect x="84" y="42" width="6" height="12" fill="#18181B" />
              <rect x="38" y="52" width="10" height="8" fill="#18181B" />
              <rect x="54" y="52" width="10" height="8" fill="#18181B" />
              <rect x="42" y="66" width="6" height="12" fill="#18181B" />
              <rect x="54" y="66" width="12" height="6" fill="#18181B" />
              <rect x="72" y="66" width="6" height="8" fill="#7A1C24" />
              <rect x="82" y="66" width="8" height="8" fill="#18181B" />
              <rect x="42" y="82" width="18" height="6" fill="#18181B" />
              <rect x="66" y="80" width="8" height="8" fill="#18181B" />
              <rect x="80" y="80" width="10" height="8" fill="#7A1C24" />
            </svg>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">
              Scan with your phone&apos;s camera
            </p>
            <p className="text-xs text-secondary leading-relaxed">
              {description}
            </p>
          </div>

          {/* URL & Copy Link Bar */}
          <div className="w-full flex items-center gap-2 p-2 rounded-lg bg-ground border border-line">
            <span className="flex-1 text-xs font-mono text-secondary truncate text-left">
              {qrUri}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 rounded bg-surface border border-line hover:border-slrtce-maroon hover:text-slrtce-maroon text-xs font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <FiCheck className="w-3.5 h-3.5 text-success" />
                  <span className="text-success">Copied!</span>
                </>
              ) : (
                <>
                  <FiCopy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-slrtce-maroon text-white font-bold text-sm hover:bg-slrtce-maroon-hover transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export function WayfindingCard({ location, title, qrUri, onOpenDrawer }: WayfindingCardProps) {
  const [activeStep, setActiveStep] = useState<number | "all">("all");
  const [showQrModal, setShowQrModal] = useState(false);

  const fallbackUri = qrUri || `https://slrtce.in/campus-nav?room=${encodeURIComponent(location.room)}&floor=${encodeURIComponent(location.floor)}`;

  const subtitleLocation = [location.floor, location.block || location.wing].filter(Boolean).join(", ");

  return (
    <div className="mt-2.5 rounded-lg bg-surface border border-line p-3 text-ink shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-md bg-accent-surface text-slrtce-maroon flex items-center justify-center shrink-0">
            <FiMapPin className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-ink truncate">{location.room}</div>
            <div className="text-xs font-medium text-secondary truncate mt-0.5">
              {subtitleLocation}
            </div>
          </div>
        </div>
        <span className="text-xs font-semibold text-slrtce-maroon bg-accent-surface px-2.5 py-1 rounded-md shrink-0">
          {location.walkTime}
        </span>
      </div>

      {location.landmark && (
        <div className="text-xs font-semibold text-slrtce-navy bg-ground px-3 py-1.5 rounded-md border border-line">
          Landmark: {location.landmark}
        </div>
      )}

      {/* Interactive 3-Step Route Segment Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-secondary">
          <span>Route Segments</span>
          <span className="text-xs font-normal text-secondary">Tap any step to highlight route</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveStep("all")}
            className={`py-1.5 px-2 rounded-md text-xs font-bold border transition-colors cursor-pointer truncate ${
              activeStep === "all"
                ? "bg-slrtce-navy text-white border-slrtce-navy shadow-2xs"
                : "bg-ground text-secondary border-line hover:text-ink hover:bg-surface"
            }`}
          >
            All Steps
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(0)}
            className={`py-1.5 px-2 rounded-md text-xs font-bold border transition-colors cursor-pointer truncate ${
              activeStep === 0
                ? "bg-slrtce-maroon text-white border-slrtce-maroon shadow-2xs"
                : "bg-ground text-secondary border-line hover:text-ink hover:bg-surface"
            }`}
          >
            1. Lobby
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`py-1.5 px-2 rounded-md text-xs font-bold border transition-colors cursor-pointer truncate ${
              activeStep === 1
                ? "bg-slrtce-maroon text-white border-slrtce-maroon shadow-2xs"
                : "bg-ground text-secondary border-line hover:text-ink hover:bg-surface"
            }`}
          >
            2. Elevator
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`py-1.5 px-2 rounded-md text-xs font-bold border transition-colors cursor-pointer truncate ${
              activeStep === 2
                ? "bg-slrtce-maroon text-white border-slrtce-maroon shadow-2xs"
                : "bg-ground text-secondary border-line hover:text-ink hover:bg-surface"
            }`}
          >
            3. {location.room.split(" ")[0]}
          </button>
        </div>
      </div>

      {/* Interactive SVG Floor Plan Mini-Map */}
      <div className="relative rounded-lg bg-ground border border-line p-3 overflow-hidden">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slrtce-navy mb-1.5">
          <span className="flex items-center gap-1.5">
            <span>SLRTCE Interactive Indoor Route</span>
            {activeStep !== "all" && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-accent-surface text-slrtce-maroon border border-slrtce-maroon/20">
                Step {activeStep + 1} Highlighted
              </span>
            )}
          </span>
          <span className="text-xs font-semibold text-secondary">{location.floor}</span>
        </div>

        <svg viewBox="0 0 420 180" className="w-full h-32 sm:h-36 max-h-[140px] select-none" role="img" aria-label="Campus floor plan route">
          <title>Campus Floor Plan Route Map</title>
          <defs>
            <pattern id="floorGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[#E2DFD9]" />
            </pattern>
          </defs>
          <rect width="420" height="180" fill="url(#floorGrid)" rx="6" />

          {/* Architectural corridors with state-aware reactive shading */}
          {/* Corridor 1: Main Lobby */}
          <rect
            x="25"
            y="125"
            width="160"
            height="42"
            rx="4"
            fill={activeStep === 0 ? "#DCFCE7" : "#FFFFFF"}
            stroke={activeStep === 0 ? "#15803D" : "#CDC9C0"}
            strokeWidth={activeStep === 0 ? 2 : 1.5}
            className="transition-colors duration-200"
          />
          {/* Corridor 2: West/Central Corridor */}
          <rect
            x="145"
            y="25"
            width="46"
            height="110"
            rx="4"
            fill={activeStep === 1 ? "#EFF6FF" : "#FFFFFF"}
            stroke={activeStep === 1 ? "#1B365D" : "#CDC9C0"}
            strokeWidth={activeStep === 1 ? 2 : 1.5}
            className="transition-colors duration-200"
          />
          {/* Corridor 3: Target Department Wing */}
          <rect
            x="145"
            y="25"
            width="240"
            height="42"
            rx="4"
            fill={activeStep === 2 ? "#FDF2F3" : "#FFFFFF"}
            stroke={activeStep === 2 ? "#7A1C24" : "#CDC9C0"}
            strokeWidth={activeStep === 2 ? 2 : 1.5}
            className="transition-colors duration-200"
          />

          {/* Architectural zone labels */}
          <text x="35" y="150" fontSize="13" fontWeight="bold" fill={activeStep === 0 ? "#15803D" : "#52525B"}>
            Main Lobby
          </text>
          <text
            x="150"
            y="85"
            fontSize="12"
            fontWeight="bold"
            fill={activeStep === 1 ? "#1B365D" : "#52525B"}
            transform="rotate(-90 156 85)"
          >
            Corridor
          </text>
          <text x="215" y="50" fontSize="13" fontWeight="bold" fill={activeStep === 2 ? "#7A1C24" : "#52525B"}>
            {location.block || "Faculty Wing"}
          </text>

          {/* Step 1 Segment: Lobby to Corridor (M 50 146 L 168 146) */}
          <path
            d="M 50 146 L 168 146"
            fill="none"
            stroke={activeStep === 0 ? "#15803D" : activeStep === "all" ? "#7A1C24" : "#A1A1AA"}
            strokeWidth={activeStep === 0 ? 5 : activeStep === "all" ? 3.5 : 2}
            strokeDasharray={activeStep === "all" ? "8 5" : "none"}
            opacity={activeStep === "all" || activeStep === 0 ? 1 : 0.3}
            className={activeStep === "all" ? "motion-safe:animate-[dash_1s_linear_infinite]" : ""}
          />

          {/* Step 2 Segment: Vertical Elevator / Stairs Corridor (M 168 146 L 168 46) */}
          <path
            d="M 168 146 L 168 46"
            fill="none"
            stroke={activeStep === 1 ? "#1B365D" : activeStep === "all" ? "#7A1C24" : "#A1A1AA"}
            strokeWidth={activeStep === 1 ? 5 : activeStep === "all" ? 3.5 : 2}
            strokeDasharray={activeStep === "all" ? "8 5" : "none"}
            opacity={activeStep === "all" || activeStep === 1 ? 1 : 0.3}
            className={activeStep === "all" ? "motion-safe:animate-[dash_1s_linear_infinite]" : ""}
          />

          {/* Step 3 Segment: Target Floor Corridor to Room (M 168 46 L 330 46) */}
          <path
            d="M 168 46 L 330 46"
            fill="none"
            stroke={activeStep === 2 ? "#7A1C24" : activeStep === "all" ? "#7A1C24" : "#A1A1AA"}
            strokeWidth={activeStep === 2 ? 5 : activeStep === "all" ? 3.5 : 2}
            strokeDasharray={activeStep === "all" ? "8 5" : "none"}
            opacity={activeStep === "all" || activeStep === 2 ? 1 : 0.3}
            className={activeStep === "all" ? "motion-safe:animate-[dash_1s_linear_infinite]" : ""}
          />

          {/* You (Kiosk Start Node) */}
          <circle cx="50" cy="146" r="7" fill="#15803D" />
          <circle cx="50" cy="146" r="13" fill="#15803D" opacity={activeStep === 0 ? 0.4 : 0.2} className="animate-ping" />
          <text x="35" y="132" fontSize="12" fontWeight="bold" fill="#15803D">You (Kiosk)</text>

          {/* Elevator Midpoint Node */}
          <rect
            x="158"
            y="88"
            width="20"
            height="20"
            rx="3"
            fill={activeStep === 1 ? "#1B365D" : "#1B365D"}
            stroke={activeStep === 1 ? "#D99B26" : "none"}
            strokeWidth={activeStep === 1 ? 2 : 0}
          />
          <text x="162" y="103" fontSize="11" fontWeight="bold" fill="#FFFFFF">EL2</text>
          <text x="183" y="102" fontSize="11" fontWeight="bold" fill="#1B365D">Elevator 2</text>

          {/* Destination Node */}
          <circle cx="330" cy="46" r="8" fill="#7A1C24" />
          <circle cx="330" cy="46" r="15" fill="#7A1C24" opacity={activeStep === 2 ? 0.4 : 0.25} className="animate-pulse" />
          <rect
            x="270"
            y="15"
            width="115"
            height="20"
            rx="4"
            fill="#7A1C24"
            stroke={activeStep === 2 ? "#D99B26" : "none"}
            strokeWidth={activeStep === 2 ? 2 : 0}
          />
          <text x="278" y="29" fontSize="11" fontWeight="bold" fill="#FFFFFF">
            {location.room}
          </text>
        </svg>
      </div>

      {/* Clickable 3-Step Detailed Stepper */}
      {location.waypointSteps && location.waypointSteps.length > 0 && (
        <div className="space-y-1.5 text-xs sm:text-sm">
          {location.waypointSteps.map((step, idx) => {
            const isHighlighted = activeStep === idx || activeStep === "all";
            return (
              <button
                key={`step-${step.slice(0, 15)}`}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`w-full flex items-start gap-2.5 text-left p-2 rounded-md transition-colors cursor-pointer border ${
                  activeStep === idx
                    ? "bg-accent-surface border-slrtce-maroon/30 text-ink"
                    : "bg-surface border-transparent hover:bg-ground text-secondary"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                    activeStep === idx
                      ? "bg-slrtce-maroon text-white"
                      : "bg-ground border border-line text-ink"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className={`leading-normal ${isHighlighted ? "text-ink font-semibold" : "text-secondary font-medium"}`}>
                  {step}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Action Buttons: Phone QR Modal & Blueprint Drawer */}
      <div className="flex items-center gap-2 pt-1 border-t border-line">
        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="flex-1 min-h-[38px] px-3 py-1.5 rounded-md bg-ground border border-line hover:border-slrtce-maroon hover:text-slrtce-maroon hover:bg-surface text-xs sm:text-sm font-bold text-ink flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-slrtce-maroon cursor-pointer"
        >
          <FiShare2 className="w-4 h-4 text-slrtce-maroon" />
          <span>Take Directions on Phone (QR)</span>
        </button>

        {onOpenDrawer && (
          <button
            type="button"
            onClick={onOpenDrawer}
            className="min-h-[38px] px-3.5 py-1.5 rounded-md bg-slrtce-navy text-white text-xs sm:text-sm font-bold hover:bg-slrtce-navy/90 flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-slrtce-navy cursor-pointer"
          >
            <FiCompass className="w-4 h-4" />
            <span>Campus Blueprint</span>
          </button>
        )}
      </div>

      {/* Dedicated Clean Phone QR Modal */}
      <PhoneQrModal
        open={showQrModal}
        onClose={() => setShowQrModal(false)}
        title="Offline Walking Directions"
        description={`Open turn-by-turn route to ${location.room} (${location.floor}) directly on your smartphone.`}
        qrUri={fallbackUri}
      />
    </div>
  );
}

interface TimetableCardProps {
  timetable: NonNullable<GroundedCampusRecord["timetableDetails"]>;
  onReadAloud?: (text: string) => void;
}

export function TimetableCard({ timetable, onReadAloud }: TimetableCardProps) {
  const [expanded, setExpanded] = useState(true);

  const handleReadHighlights = () => {
    if (onReadAloud) {
      onReadAloud(timetable.highlight);
    }
  };

  return (
    <div className="mt-2.5 rounded-xl bg-surface border border-line p-3.5 text-ink shadow-xs space-y-2">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <FiCalendar className="w-4 h-4 text-accent shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-bold text-ink truncate">{timetable.semester}</div>
            <div className="text-xs font-medium text-secondary truncate">{timetable.examType}</div>
          </div>
        </div>
        {onReadAloud && (
          <button
            type="button"
            onClick={handleReadHighlights}
            className="px-2.5 py-1.5 rounded-lg bg-ground border border-line hover:bg-surface-muted text-xs font-bold text-ink flex items-center gap-1.5 shrink-0 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent"
            title="Read timetable highlights aloud"
          >
            <FiVolume2 className="w-4 h-4 text-accent" />
            <span className="hidden sm:inline">Read highlights</span>
          </button>
        )}
      </div>

      {/* Highlights Pill */}
      <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/20 text-xs sm:text-sm font-bold text-ink flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
        <span>{timetable.highlight}</span>
      </div>

      {/* Structured Table */}
      {expanded && (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-ground border-b border-line text-xs font-bold text-secondary">
              <tr>
                <th className="py-2 px-3">Date & Time</th>
                <th className="py-2 px-3">Code</th>
                <th className="py-2 px-3">Subject</th>
                <th className="py-2 px-3">Hall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-medium text-ink tabular-nums">
              {timetable.rows.map((row) => (
                <tr key={row.code} className="hover:bg-ground/50">
                  <td className="py-2 px-3 whitespace-nowrap text-secondary font-bold text-xs">
                    {row.date} <span className="font-normal text-secondary/80">({row.time})</span>
                  </td>
                  <td className="py-2 px-3 font-bold text-accent whitespace-nowrap">{row.code}</td>
                  <td className="py-2 px-3">{row.subject}</td>
                  <td className="py-2 px-3 whitespace-nowrap text-secondary font-semibold">{row.venue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-center text-xs font-bold text-secondary hover:text-ink flex items-center justify-center gap-1 py-1.5"
      >
        <span>{expanded ? "Collapse schedule" : "Expand full schedule"}</span>
        {expanded ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

interface FeeBreakdownCardProps {
  course: NonNullable<GroundedCampusRecord["courseDetails"]>;
  qrUri?: string;
}

export function FeeBreakdownCard({ course, qrUri }: FeeBreakdownCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div className="mt-2.5 rounded-xl bg-surface border border-line p-3.5 text-ink shadow-xs space-y-2">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <div>
          <div className="text-sm font-bold text-ink">{course.code} Annual Fee</div>
          <div className="text-xs font-bold text-secondary">Approved Seats: {course.seats}</div>
        </div>
        <div className="text-right">
          <div className="text-sm sm:text-base font-extrabold text-accent tabular-nums">{course.fee}</div>
          <div className="text-xs text-secondary font-medium">Govt. Approved</div>
        </div>
      </div>

      <div className="text-xs sm:text-sm font-medium text-secondary">
        <strong>Eligibility:</strong> {course.eligibility}
      </div>

      {course.feeBreakdown && (
        <>
          <button
            type="button"
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full py-2 px-3 rounded-lg bg-ground border border-line hover:bg-surface-muted text-xs sm:text-sm font-bold text-ink flex items-center justify-between motion-safe:transition-colors"
          >
            <span>Detailed Cost Breakdown</span>
            {showBreakdown ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
          </button>

          {showBreakdown && (
            <div className="divide-y divide-line rounded-lg border border-line bg-ground p-2 text-xs sm:text-sm">
              {course.feeBreakdown.map((item) => (
                <div key={item.head} className="flex items-center justify-between py-2 px-2.5">
                  <span className="font-medium text-secondary">{item.head}</span>
                  <div className="text-right font-bold text-ink tabular-nums">
                    <span>{item.amount}</span>
                    <span className="text-xs font-normal text-secondary ml-1">({item.frequency})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
