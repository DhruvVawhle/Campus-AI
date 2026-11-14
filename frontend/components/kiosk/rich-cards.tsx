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

export function WayfindingCard({ location, title, qrUri, onOpenDrawer }: WayfindingCardProps) {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  const coords = location.mapCoordinates || {
    start: [30, 150],
    elevator: [120, 100],
    destination: [240, 50],
  };

  const handleCopyLink = () => {
    if (qrUri) {
      navigator.clipboard?.writeText(qrUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const subtitleLocation = [location.floor, location.block || location.wing].filter(Boolean).join(", ");

  return (
    <div className="mt-2.5 rounded-lg bg-surface border border-line p-3 text-ink shadow-2xs space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-6 h-6 rounded-md bg-[#7A1C24]/10 text-[#7A1C24] flex items-center justify-center shrink-0">
            <FiMapPin className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-ink truncate">{location.room}</div>
            <div className="text-[11px] font-medium text-secondary truncate">
              {subtitleLocation}
            </div>
          </div>
        </div>
        <span className="text-[11px] font-bold text-[#7A1C24] bg-[#7A1C24]/10 px-2 py-0.5 rounded-md shrink-0">
          {location.walkTime}
        </span>
      </div>

      {location.landmark && (
        <div className="text-[11px] font-semibold text-[#1B365D] bg-[#F6F5F2] px-2.5 py-1 rounded-md border border-line">
          📍 Landmark: {location.landmark}
        </div>
      )}

      {/* Interactive SVG Floor Plan Mini-Map */}
      <div className="relative rounded-lg bg-ground border border-line p-2 overflow-hidden">
        <div className="flex items-center justify-between text-[10px] font-bold text-secondary mb-1">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span>Interactive Campus Route</span>
          </span>
          <span>Level {location.floor}</span>
        </div>

        <svg viewBox="0 0 300 180" className="w-full h-28 select-none" role="img" aria-label="Campus floor plan route">
          <title>Campus Floor Plan Route Map</title>
          {/* Architectural Floor Grid Background */}
          <defs>
            <pattern id="floorGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-line/60" />
            </pattern>
          </defs>
          <rect width="300" height="180" fill="url(#floorGrid)" rx="6" />

          {/* Building corridors */}
          <rect x="20" y="130" width="120" height="35" rx="4" fill="currentColor" className="text-surface border" stroke="currentColor" strokeWidth="1" />
          <rect x="110" y="30" width="35" height="110" rx="4" fill="currentColor" className="text-surface" stroke="currentColor" strokeWidth="1" />
          <rect x="110" y="30" width="160" height="35" rx="4" fill="currentColor" className="text-surface" stroke="currentColor" strokeWidth="1" />

          {/* Corridor labels */}
          <text x="35" y="152" fontSize="9" fontWeight="bold" fill="currentColor" className="text-secondary/70">Main Lobby</text>
          <text x="115" y="90" fontSize="8" fontWeight="bold" fill="currentColor" className="text-secondary/70" transform="rotate(-90 120 90)">West Corridor</text>
          <text x="170" y="52" fontSize="9" fontWeight="bold" fill="currentColor" className="text-secondary/70">Faculty Wing</text>

          {/* Walking Path with Animated Dash */}
          <path
            d={`M ${coords.start[0]} ${coords.start[1]} L ${coords.elevator[0]} ${coords.start[1]} L ${coords.elevator[0]} ${coords.elevator[1]} L ${coords.destination[0]} ${coords.destination[1]}`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeDasharray="6 4"
            className="motion-safe:animate-[dash_1s_linear_infinite]"
          />

          {/* Kiosk / Start Node */}
          <circle cx={coords.start[0]} cy={coords.start[1]} r="6" fill="#15803D" />
          <circle cx={coords.start[0]} cy={coords.start[1]} r="10" fill="#15803D" opacity="0.25" className="animate-ping" />
          <text x={coords.start[0] - 10} y={coords.start[1] + 16} fontSize="8" fontWeight="bold" fill="#15803D">You</text>

          {/* Elevator / Midpoint Node */}
          <rect x={coords.elevator[0] - 7} y={coords.elevator[1] - 7} width="14" height="14" rx="2" fill="currentColor" className="text-surface-muted" stroke="currentColor" strokeWidth="1.5" />
          <text x={coords.elevator[0] - 5} y={coords.elevator[1] + 3} fontSize="7" fontWeight="bold" fill="currentColor" className="text-secondary">EL</text>

          {/* Destination Node */}
          <circle cx={coords.destination[0]} cy={coords.destination[1]} r="7" fill="var(--accent)" />
          <circle cx={coords.destination[0]} cy={coords.destination[1]} r="12" fill="var(--accent)" opacity="0.2" className="animate-pulse" />
          <text x={coords.destination[0] - 25} y={coords.destination[1] - 10} fontSize="8" fontWeight="extrabold" fill="var(--accent)">
            {location.room.split(" ")[0]}
          </text>
        </svg>
      </div>

      {/* Step-by-Step Directions */}
      {location.waypointSteps && location.waypointSteps.length > 0 && (
        <div className="space-y-1 text-xs">
          {location.waypointSteps.map((step, idx) => (
            <div key={`step-${step.slice(0, 15)}`} className="flex items-start gap-1.5 text-secondary">
              <span className="w-4 h-4 rounded-full bg-ground border border-line text-[10px] font-bold text-ink flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="font-medium text-ink/90 leading-tight">{step}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions: QR Handoff & Full Blueprint */}
      <div className="flex items-center gap-2 pt-1 border-t border-line">
        <button
          type="button"
          onClick={() => setShowQr(!showQr)}
          className="flex-1 min-h-[36px] px-2.5 py-1 rounded-lg bg-ground border border-line hover:bg-surface-muted text-xs font-bold text-ink flex items-center justify-center gap-1.5 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent"
        >
          <FiShare2 className="w-3.5 h-3.5 text-accent" />
          <span>{showQr ? "Hide QR" : "Take to Phone (QR)"}</span>
        </button>

        {onOpenDrawer && (
          <button
            type="button"
            onClick={onOpenDrawer}
            className="min-h-[36px] px-3 py-1 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:bg-accent-hover flex items-center justify-center gap-1.5 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <FiCompass className="w-3.5 h-3.5" />
            <span>Full Route</span>
          </button>
        )}
      </div>

      {/* QR Code Handoff Card */}
      {showQr && (
        <div className="p-3 rounded-lg bg-ground border border-line flex items-center gap-3 motion-safe:transition-all">
          <div className="w-16 h-16 bg-surface p-1 rounded-lg border border-line flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-full h-full text-ink" role="img" aria-label="QR code for phone directions">
              <title>Phone Directions QR Code</title>
              <rect x="2" y="2" width="6" height="6" fill="currentColor" />
              <rect x="3.5" y="3.5" width="3" height="3" fill="var(--surface)" />
              <rect x="16" y="2" width="6" height="6" fill="currentColor" />
              <rect x="17.5" y="3.5" width="3" height="3" fill="var(--surface)" />
              <rect x="2" y="16" width="6" height="6" fill="currentColor" />
              <rect x="3.5" y="17.5" width="3" height="3" fill="var(--surface)" />
              <rect x="10" y="4" width="3" height="2" fill="currentColor" />
              <rect x="10" y="8" width="4" height="2" fill="currentColor" />
              <rect x="4" y="10" width="4" height="2" fill="currentColor" />
              <rect x="14" y="11" width="3" height="4" fill="currentColor" />
              <rect x="10" y="14" width="2" height="4" fill="currentColor" />
              <rect x="16" y="16" width="2" height="4" fill="currentColor" />
              <rect x="19" y="19" width="3" height="3" fill="currentColor" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-ink">Scan with Phone Camera</div>
            <div className="text-[11px] text-secondary mt-0.5 leading-tight">
              Opens offline indoor turn-by-turn map directly on your device.
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="mt-1 text-[11px] font-bold text-accent hover:underline flex items-center gap-1"
            >
              {copied ? <><FiCheck className="w-3 h-3 text-success" /> Copied link</> : "Copy direct map link"}
            </button>
          </div>
        </div>
      )}
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
    <div className="mt-2.5 rounded-xl bg-surface border border-line p-3 text-ink shadow-xs space-y-2">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <FiCalendar className="w-4 h-4 text-accent shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-ink truncate">{timetable.semester}</div>
            <div className="text-[11px] font-medium text-secondary truncate">{timetable.examType}</div>
          </div>
        </div>
        {onReadAloud && (
          <button
            type="button"
            onClick={handleReadHighlights}
            className="px-2 py-1 rounded-lg bg-ground border border-line hover:bg-surface-muted text-[11px] font-bold text-ink flex items-center gap-1 shrink-0 motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent"
            title="Read timetable highlights aloud"
          >
            <FiVolume2 className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">Read highlights</span>
          </button>
        )}
      </div>

      {/* Highlights Pill */}
      <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 text-xs font-bold text-ink flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
        <span>{timetable.highlight}</span>
      </div>

      {/* Structured Table */}
      {expanded && (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-xs">
            <thead className="bg-ground border-b border-line text-[11px] font-bold text-secondary">
              <tr>
                <th className="py-1.5 px-2.5">Date & Time</th>
                <th className="py-1.5 px-2.5">Code</th>
                <th className="py-1.5 px-2.5">Subject</th>
                <th className="py-1.5 px-2.5">Hall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-medium text-ink">
              {timetable.rows.map((row) => (
                <tr key={row.code} className="hover:bg-ground/50">
                  <td className="py-1.5 px-2.5 whitespace-nowrap text-secondary font-bold text-[11px]">
                    {row.date} <span className="font-normal text-secondary/80">({row.time})</span>
                  </td>
                  <td className="py-1.5 px-2.5 font-bold text-accent whitespace-nowrap">{row.code}</td>
                  <td className="py-1.5 px-2.5">{row.subject}</td>
                  <td className="py-1.5 px-2.5 whitespace-nowrap text-secondary font-semibold">{row.venue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-center text-[11px] font-bold text-secondary hover:text-ink flex items-center justify-center gap-1 py-1"
      >
        <span>{expanded ? "Collapse schedule" : "Expand full schedule"}</span>
        {expanded ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
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
    <div className="mt-2.5 rounded-xl bg-surface border border-line p-3 text-ink shadow-xs space-y-2">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <div>
          <div className="text-xs font-extrabold text-ink">{course.code} Annual Fee</div>
          <div className="text-[11px] font-bold text-secondary">Approved Seats: {course.seats}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-extrabold text-accent">{course.fee}</div>
          <div className="text-[10px] text-secondary font-medium">Govt. Approved</div>
        </div>
      </div>

      <div className="text-xs font-medium text-secondary">
        <strong>Eligibility:</strong> {course.eligibility}
      </div>

      {course.feeBreakdown && (
        <>
          <button
            type="button"
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full py-1.5 px-2.5 rounded-lg bg-ground border border-line hover:bg-surface-muted text-xs font-bold text-ink flex items-center justify-between motion-safe:transition-colors"
          >
            <span>Detailed Cost Breakdown</span>
            {showBreakdown ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showBreakdown && (
            <div className="divide-y divide-line rounded-lg border border-line bg-ground p-1 text-xs">
              {course.feeBreakdown.map((item) => (
                <div key={item.head} className="flex items-center justify-between py-1.5 px-2">
                  <span className="font-medium text-secondary">{item.head}</span>
                  <div className="text-right font-bold text-ink">
                    <span>{item.amount}</span>
                    <span className="text-[10px] font-normal text-secondary ml-1">({item.frequency})</span>
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
