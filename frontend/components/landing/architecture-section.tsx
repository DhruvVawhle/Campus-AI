"use client";

import { useState } from "react";
import { FiLayers, FiCpu, FiDatabase, FiShield, FiSend, FiGitCommit, FiCode } from "react-icons/fi";

interface AgentNode {
  id: string;
  name: string;
  role: string;
  tech: string;
  filePath: string;
  description: string;
  codeSnippet: string;
}

const AGENT_NODES: AgentNode[] = [
  {
    id: "router",
    name: "Intent & Language Router",
    role: "Multi-Agent Orchestrator",
    tech: "Groq Llama 3.3 70B Versatile",
    filePath: "backend/agents/router_agent.py",
    description: "Analyzes spoken transcripts across English, Hindi, Marathi, and Hinglish. Detects intent and selects the exact specialist agent or human escalation pathway.",
    codeSnippet: `class RouterAgent:
    def classify_intent(self, text: str, lang: str) -> IntentResult:
        # Zero-shot intent classification via Groq Cloud
        response = self.llm.invoke(ROUTER_PROMPT.format(query=text, lang=lang))
        return self.parse_router_decision(response)`,
  },
  {
    id: "admission",
    name: "Admission & Syllabus Agent",
    role: "Vector Search Specialist",
    tech: "FAISS + intfloat/multilingual-e5-small",
    filePath: "backend/agents/admission_agent.py",
    description: "Performs semantic vector search over ingested college prospectuses, fee charts, and course brochures. Validates every retrieved chunk with a confidence threshold.",
    codeSnippet: `class AdmissionAgent:
    def retrieve_verified(self, query: str) -> GroundedContext:
        emb = self.embedding_model.encode(query)
        docs, scores = self.vector_index.search(emb, top_k=3)
        if scores[0] < CONFIDENCE_THRESHOLD:
            return self.escalate_to_human(query)
        return self.synthesize_grounded_answer(docs)`,
  },
  {
    id: "faculty",
    name: "Faculty & Cabins Agent",
    role: "Relational SQL Specialist",
    tech: "SQLite Relational Database",
    filePath: "backend/agents/faculty_agent.py",
    description: "Queries the verified SQLite faculty table for department designations, cabin numbers, visiting hours, and official college emails with zero hallucination.",
    codeSnippet: `class FacultyAgent:
    def find_faculty_cabin(self, faculty_name: str) -> dict:
        cursor = self.db.cursor()
        cursor.execute(
            "SELECT name, department, designation, cabin, email FROM faculty WHERE name LIKE ?",
            (f"%{faculty_name}%",)
        )
        return cursor.fetchone()`,
  },
  {
    id: "wayfinder",
    name: "Indoor Navigation & QR Agent",
    role: "Indoor Campus Route Guide",
    tech: "A* Graph Search + QR Code Generator",
    filePath: "backend/agents/navigation_agent.py",
    description: "Generates step-by-step turn directions from the reception kiosk to any room or lab, and encodes the exact route into a scannable mobile QR code.",
    codeSnippet: `class NavigationAgent:
    def get_route_and_qr(self, start: str, destination: str):
        steps = self.campus_graph.shortest_path(start, destination)
        qr_bytes = self.qr_generator.encode(steps.to_mobile_url())
        return {"instructions": steps.text_summary, "qr_payload": qr_bytes}`,
  },
  {
    id: "guardrail",
    name: "Confidence Guardrail & Escalation",
    role: "Anti-Hallucination Barrier",
    tech: "Threshold Gate (< 0.65)",
    filePath: "backend/agents/escalation.py",
    description: "If an incoming query lacks documented campus backing or falls below the 0.65 confidence threshold, the robot politely transfers the query to the human helpdesk.",
    codeSnippet: `def evaluate_guardrail(confidence_score: float, query: str):
    if confidence_score < 0.65:
        # Refuse to guess college policies
        return EscalationResult(
            transfer_to_staff=True,
            spoken_reason="I want to ensure 100% accuracy. Please visit Counter 2 at the reception desk."
        )`,
  },
];

export function ArchitectureSection() {
  const [selectedAgent, setSelectedAgent] = useState<AgentNode>(AGENT_NODES[0]);

  return (
    <section id="architecture" className="w-full py-16 sm:py-24 bg-ground border-b border-line" aria-label="Architecture and multi-agent system">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-line text-xs font-semibold text-secondary mb-3">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>multi-agent architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            Specialized agents. Ground-truth verified.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-secondary">
            Unlike generic LLM wrappers that hallucinate facts, CampusAI orchestrates deterministic domain tools across SQLite, FAISS vectors, and strict confidence barriers.
          </p>
        </div>

        {/* Interactive Architecture Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Agent Selection List (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-2.5" role="tablist" aria-label="System agents">
            {AGENT_NODES.map((agent) => {
              const active = selectedAgent.id === agent.id;
              return (
                <button
                  key={agent.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-4 rounded-xl text-left border motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-start justify-between gap-3 ${
                    active
                      ? "bg-surface border-accent shadow-xs"
                      : "bg-surface/60 border-line hover:border-line-strong hover:bg-surface"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-bold text-ink">{agent.name}</div>
                    <div className="text-xs text-secondary font-medium">{agent.role}</div>
                    <div className="text-[11px] font-mono text-accent pt-1">{agent.tech}</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0 opacity-80" />
                </button>
              );
            })}
          </div>

          {/* Agent Deep-Dive Code Inspector (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-line bg-surface-dark text-ink-dark overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-surface-dark-line flex items-center justify-between bg-surface-dark-card">
              <div className="flex items-center gap-2">
                <FiCode className="w-4 h-4 text-accent" aria-hidden="true" />
                <span className="font-mono text-xs font-bold text-ink-dark">{selectedAgent.filePath}</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-dark border border-surface-dark-line text-secondary-dark">
                Python 3.11
              </span>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-ink-dark mb-1">{selectedAgent.name}</h3>
                <p className="text-xs sm:text-sm text-secondary-dark leading-relaxed font-sans">
                  {selectedAgent.description}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-dark border border-surface-dark-line overflow-x-auto">
                <pre className="font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre">
                  <code>{selectedAgent.codeSnippet}</code>
                </pre>
              </div>

              <div className="mt-4 pt-4 border-t border-surface-dark-line flex flex-wrap items-center justify-between gap-3 text-xs text-secondary-dark">
                <span>Infrastructure: <strong className="text-ink-dark">{selectedAgent.tech}</strong></span>
                <span>Grounding: <strong className="text-emerald-400">Zero-Hallucination</strong></span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
