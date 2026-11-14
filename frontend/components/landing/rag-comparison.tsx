"use client";

import { FiCheck, FiX, FiShield, FiAlertTriangle } from "react-icons/fi";

interface ComparisonRow {
  dimension: string;
  genericWrapper: string;
  campusAi: string;
  advantage: string;
}

const COMPARISONS: ComparisonRow[] = [
  {
    dimension: "Information Accuracy",
    genericWrapper: "Hallucinates fee amounts, fabricates nonexistent faculty cabin numbers, and guesses dates.",
    campusAi: "Ground-truth SQLite database and FAISS vector retriever with strict 0.65 confidence rejection threshold.",
    advantage: "Zero-hallucination verification",
  },
  {
    dimension: "Language Fluency",
    genericWrapper: "Translates robotically word-for-word, failing with colloquial Marathi, Hindi dialects, and Hinglish.",
    campusAi: "Trained Groq Whisper Large v3 Indian acoustic models and native Edge-TTS neural speech (Neerja, Swara, Aarohi).",
    advantage: "Native Indian speech cadence",
  },
  {
    dimension: "Voice Response Latency",
    genericWrapper: "Blocks for 3 to 5 seconds waiting to generate full paragraphs before speaking anything.",
    campusAi: "Sentence-pipelined streaming plays the 1st sentence in ~140ms while sentence 2 synthesizes in background.",
    advantage: "Instant conversational rhythm",
  },
  {
    dimension: "Self-Echo Suppression",
    genericWrapper: "Speaker output feeds back into the microphone, triggering endless self-prompt loops.",
    campusAi: "Hardware half-duplex mic suppression with 400ms reverberation decay gate on ESP32.",
    advantage: "Clean acoustic isolation",
  },
  {
    dimension: "Escalation to Humans",
    genericWrapper: "Never admits ignorance; insists on giving speculative answers to admissions disputes.",
    campusAi: "Automatically transfers complex or personal disputes to Counter #2 staff at the reception desk.",
    advantage: "Institutional safety guardrail",
  },
];

export function RagComparison() {
  return (
    <section className="w-full py-16 sm:py-24 bg-surface border-b border-line" aria-label="Comparison with generic chatbot wrappers">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ground border border-line text-xs font-semibold text-secondary mb-3">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>reliability benchmarks</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            Designed for institutional trust.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-secondary">
            College administration demands 100% verified correctness. A student asking for fee concession deadlines cannot be given speculative information.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-ground border-b border-line text-secondary font-semibold">
                  <th className="py-3.5 px-4 sm:px-6 w-1/4">Evaluation dimension</th>
                  <th className="py-3.5 px-4 w-1/3">Standard LLM Wrapper</th>
                  <th className="py-3.5 px-4 sm:px-6 w-5/12 bg-accent/5 text-ink font-bold">
                    CampusAI Receptionist
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {COMPARISONS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-muted/30 motion-safe:transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-bold text-ink">
                      <div>{row.dimension}</div>
                      <div className="text-[11px] font-mono text-accent mt-0.5">{row.advantage}</div>
                    </td>
                    <td className="py-4 px-4 text-secondary leading-relaxed">
                      <div className="flex items-start gap-2">
                        <FiX className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{row.genericWrapper}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 bg-accent/5 text-ink font-medium leading-relaxed">
                      <div className="flex items-start gap-2">
                        <FiCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{row.campusAi}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}

