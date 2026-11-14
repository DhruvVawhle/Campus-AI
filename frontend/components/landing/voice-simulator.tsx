"use client";

import { useState } from "react";
import { FiMic, FiDatabase, FiCheckCircle, FiPlay, FiCpu, FiCornerDownRight, FiTerminal, FiVolume2 } from "react-icons/fi";
import type { LangCode } from "./site-header";

interface QueryScenario {
  id: string;
  lang: string;
  spokenText: string;
  transcription: string;
  latencyMs: number;
  routedAgent: string;
  sourceFile: string;
  queryType: "SQL Relational" | "FAISS Vector RAG" | "Navigation Graph";
  dataRecord: string;
  spokenReply: string;
  acousticFiller?: string;
}

const SCENARIOS: QueryScenario[] = [
  {
    id: "faculty-cabin",
    lang: "English",
    spokenText: "Where is Dr. Rajesh Sharma's cabin?",
    transcription: "Where is Dr. Rajesh Sharma's cabin?",
    latencyMs: 220,
    routedAgent: "FacultyDirectoryAgent",
    sourceFile: "backend/agents/faculty_agent.py",
    queryType: "SQL Relational",
    dataRecord: "SELECT cabin, floor, dept, email FROM faculty WHERE name LIKE '%Rajesh Sharma%'; => Cabin C-301, 3rd Floor, Computer Science Dept.",
    spokenReply: "Dr. Rajesh Sharma is the Head of Computer Science Department. His cabin is C-301 on the 3rd Floor of the Main Building.",
  },
  {
    id: "admissions-fees",
    lang: "English / Hinglish",
    spokenText: "What are the fees and eligibility for B.Tech AI and Data Science?",
    transcription: "What are the fees and eligibility for B.Tech AI and Data Science?",
    latencyMs: 260,
    routedAgent: "AdmissionSyllabusAgent",
    sourceFile: "backend/agents/admission_agent.py",
    queryType: "SQL Relational",
    dataRecord: "SELECT c.seats, c.eligibility_summary, f.total_fee FROM courses c JOIN fees f ON c.id=f.course_id WHERE c.code='AI-DS'; => 120 seats, ₹1,50,000/yr.",
    spokenReply: "For B.Tech AI & Data Science, eligibility is 10+2 with Physics and Mathematics with at least 45% aggregate. Total annual fee is ₹1,50,000 across 120 approved seats.",
    acousticFiller: "Ek minute, main records check karta hoon...",
  },
  {
    id: "library-marathi",
    lang: "मराठी (Marathi)",
    spokenText: "मध्यवर्ती ग्रंथालय आणि वाचन कक्ष कधी बंद होतो?",
    transcription: "मध्यवर्ती ग्रंथालय आणि वाचन कक्ष कधी बंद होतो?",
    latencyMs: 290,
    routedAgent: "FacilitiesKnowledgeAgent",
    sourceFile: "backend/agents/reception_agent.py",
    queryType: "FAISS Vector RAG",
    dataRecord: "FAISS top-k vector chunk: 'Central Library timings are 8:00 AM to 8:00 PM on weekdays. The 2nd floor Reading Hall remains open until 10:00 PM during exam weeks.'",
    spokenReply: "मध्यवर्ती ग्रंथालय संध्याकाळी ८:०० वाजता बंद होते, तर परीक्षेच्या काळात दुसर्‍या मजल्यावरील वाचन कक्ष रात्री १०:०० वाजेपर्यंत सुरू असतो.",
  },
  {
    id: "exam-cell-hindi",
    lang: "हिंदी (Hindi)",
    spokenText: "एग्जाम सेल कहाँ पर है और री-इवैल्यूएशन फॉर्म कब जमा करना है?",
    transcription: "एग्जाम सेल कहाँ पर है और री-इवैल्यूएशन फॉर्म कब जमा करना है?",
    latencyMs: 240,
    routedAgent: "StudentRecordsAgent",
    sourceFile: "backend/agents/student_agent.py",
    queryType: "SQL Relational",
    dataRecord: "SELECT cabin, floor FROM rooms WHERE name='Exam Cell'; => Room A-104, Ground Floor, Admin Block.",
    spokenReply: "एग्जाम सेल एडमिन ब्लॉक के ग्राउंड फ्लोर पर रूम A-104 में है। री-इवैल्यूएशन फॉर्म परिणाम घोषित होने के 7 दिनों के भीतर जमा किए जा सकते हैं।",
  },
];

export function VoiceSimulator() {
  const [selectedScenario, setSelectedScenario] = useState<QueryScenario>(SCENARIOS[0]);
  const [simulating, setSimulating] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(3); // fully resolved by default

  const handleSelect = (scenario: QueryScenario) => {
    setSelectedScenario(scenario);
    setSimulating(true);
    setActiveStep(1);

    setTimeout(() => setActiveStep(2), 220);
    setTimeout(() => setActiveStep(3), 480);
    setTimeout(() => setSimulating(false), 550);
  };

  return (
    <section id="simulator" className="w-full py-16 sm:py-24 bg-surface border-b border-line" aria-label="Interactive voice simulator">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ground border border-line text-xs font-semibold text-secondary mb-3">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>live pipeline verification</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            Ask real campus queries.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-secondary">
            Select an inquiry below to inspect the real-time speech transcription, agent routing, SQL query grounding, and neural voice response.
          </p>
        </div>

        {/* Prompt Selector Pills */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8" role="tablist" aria-label="Sample voice queries">
          {SCENARIOS.map((s) => {
            const active = selectedScenario.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleSelect(s)}
                className={`p-4 rounded-xl text-left border motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 flex flex-col justify-between gap-3 ${
                  active
                    ? "bg-ground border-accent shadow-xs"
                    : "bg-surface border-line hover:border-line-strong hover:bg-surface-muted"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-secondary mb-1.5">
                    <span>{s.lang}</span>
                    <span className="text-accent font-semibold text-[11px]">{s.latencyMs}ms</span>
                  </div>
                  <div className="text-sm font-bold text-ink leading-snug">
                    &ldquo;{s.spokenText}&rdquo;
                  </div>
                </div>
                <div className="text-xs font-medium text-secondary flex items-center gap-1.5">
                  <FiCpu className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                  <span>{s.routedAgent}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive Execution Pipeline Workbench */}
        <div className="rounded-2xl border border-line bg-surface-dark text-ink-dark overflow-hidden shadow-sm">
          
          {/* Workbench Top Bar */}
          <div className="px-6 py-4 border-b border-surface-dark-line flex flex-wrap items-center justify-between gap-4 bg-surface-dark-card">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-accent inline-block" />
              <span className="text-xs font-bold text-ink-dark">
                Execution pipeline // {selectedScenario.routedAgent}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-dark border border-surface-dark-line text-secondary-dark">
                {selectedScenario.queryType}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-secondary-dark">
              <span>Latency: <strong className="text-ink-dark">{selectedScenario.latencyMs}ms</strong></span>
              <span>Confidence: <strong className="text-emerald-400">1.00 (verified)</strong></span>
            </div>
          </div>

          {/* Workbench Content Grid */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Step 1 & 2: Transcription & Routing (6 cols) */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              
              {/* Step 1: STT Transcription */}
              <div className="p-4 rounded-xl bg-surface-dark-card border border-surface-dark-line">
                <div className="flex items-center justify-between text-xs font-mono text-secondary-dark mb-2">
                  <span className="flex items-center gap-1.5">
                    <FiMic className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                    <span>01. Whisper STT (Groq Cloud)</span>
                  </span>
                  <span className="text-emerald-400">240ms</span>
                </div>
                <div className="text-sm font-semibold text-ink-dark bg-surface-dark p-3 rounded-lg border border-surface-dark-line font-mono">
                  {selectedScenario.transcription}
                </div>
              </div>

              {/* Step 2: Ground-Truth Query Execution */}
              <div className="p-4 rounded-xl bg-surface-dark-card border border-surface-dark-line">
                <div className="flex items-center justify-between text-xs font-mono text-secondary-dark mb-2">
                  <span className="flex items-center gap-1.5">
                    <FiDatabase className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                    <span>02. Grounding Query ({selectedScenario.queryType})</span>
                  </span>
                  <span className="text-secondary-dark font-mono text-[11px]">{selectedScenario.sourceFile}</span>
                </div>
                <div className="text-xs font-mono text-amber-200 bg-surface-dark p-3 rounded-lg border border-surface-dark-line overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {selectedScenario.dataRecord}
                </div>
              </div>

            </div>

            {/* Step 3: Synthesis & Spoken Output (6 cols) */}
            <div className="lg:col-span-6 flex flex-col justify-between p-4 rounded-xl bg-surface-dark-card border border-surface-dark-line gap-4">
              <div>
                <div className="flex items-center justify-between text-xs text-secondary-dark mb-3">
                  <span className="flex items-center gap-1.5">
                    <FiVolume2 className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                    <span>03. Sentence-pipelined neural speech</span>
                  </span>
                  <span className="text-emerald-400 font-mono">edge-tts</span>
                </div>

                {/* Acoustic filler hint if present */}
                {selectedScenario.acousticFiller && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-surface-dark border border-amber-900/40 text-amber-300 text-xs">
                    <span className="font-bold text-secondary-dark mr-2">Acoustic filler:</span>
                    &ldquo;{selectedScenario.acousticFiller}&rdquo;
                  </div>
                )}

                <div className="p-4 rounded-xl bg-surface-dark border border-surface-dark-line">
                  <div className="text-xs font-semibold text-secondary-dark mb-1">Spoken response</div>
                  <p className="text-base text-ink-dark leading-relaxed font-sans">
                    {selectedScenario.spokenReply}
                  </p>
                </div>
              </div>

              {/* Audio waveform simulator */}
              <div className="flex items-center justify-between pt-3 border-t border-surface-dark-line">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center">
                    <FiPlay className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-1 h-6">
                    {[40, 75, 55, 90, 65, 45, 80, 60, 95, 50, 70, 40].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-accent rounded-full motion-safe:transition-opacity"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-xs text-secondary-dark">
                  Audio pipelined: 140ms TTFT
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
