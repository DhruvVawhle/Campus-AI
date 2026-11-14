# CampusAI 🤖🏫

> **Autonomous Multilingual AI Campus Terminal & Reception Robot powered by Multi-Agent RAG, Real-Time Voice Synthesis, and Interactive Next.js Kiosk UI.**  
> Built for **Shree L. R. Tiwari College of Engineering (SLRTCE)**, Mumbai.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.6-black.svg?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-blue.svg?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109%2B-green.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Groq Cloud](https://img.shields.io/badge/Groq-Cloud-orange.svg)](https://groq.com/)

---

## 💡 Overview & Problem Statement

College receptions and administrative helpdesks encounter high volumes of repetitive visitor queries daily regarding admissions, fee breakdowns, faculty cabin locations, examination timetables, and campus directions. Human administrative staff are often overloaded, resulting in long queues and delayed responses, while static physical noticeboards fail to provide interactive guidance.

**CampusAI** solves this by providing a zero-latency, intelligent multilingual kiosk and physical reception terminal. It listens to spoken queries in **English, Hindi, Marathi, and Hinglish**, retrieves verified ground-truth data from official college documents using RAG, queries structured SQLite databases for real-time exam schedules, displays interactive SVG indoor floor plans with mobile QR handoffs, and responds out loud with natural neural voices.

---

## ✨ Key Features

### 🏛️ SLRTCE Institutional Design System
- Hand-crafted institutional aesthetic matching Shree L. R. Tiwari College of Engineering identity: Deep Maroon (`#7A1C24`) and Institutional Navy (`#1B365D`).
- Strict design polish (anti-slop, clean single-system hierarchy, no unnecessary card-in-card nesting, high contrast text).
- Time-aware college hours display (`College Hours • 9:00 AM – 5:00 PM` vs. `After Hours`).

### 🤖 Reactive 3D Robot Avatar
- State-aware reactive animations:
  - **Idle**: Gentle vertical floating motion (`translateY(-4px)`).
  - **Listening**: Pulsing maroon halo ring around the avatar frame with live interim speech transcription.
  - **Speaking**: Subtle bounce and gold radiance synchronized with neural Text-to-Speech output.
  - **Interactive**: Direct tap interaction to trigger voice input or stop audio playback.

### 🗺️ Interactive Indoor Wayfinding & Floor Plans
- Step-by-step interactive SVG indoor floor plans for faculty cabins, examination cell, and library.
- Highlights corridor route steps from Main Lobby to Elevators to Destination Cabins.
- **Mobile QR Handoff**: Visitors can tap "Take Directions on Phone" or "Take Checklist on Phone" to instantly scan a QR code and carry directions on their mobile devices.

### 🗣️ Multilingual Voice Loop (EN, HI, MR, Hinglish)
- Real-time speech recognition via Groq Whisper (`whisper-large-v3-turbo`) and Web Speech API.
- Live interim speech streaming directly into the dialogue bubble.
- Natural neural Indian accent voices via Edge-TTS and browser SpeechSynthesis (`en-IN`, `hi-IN`, `mr-IN`).
- Instant UI localization: Switching between English, हिंदी, मराठी, and Hinglish immediately updates all directory categories, badges, and voice locale.

### 🎯 Zero-Hallucination Verified Answers (Confidence-Gated RAG)
- Ingested official college documents indexed via FAISS vector search.
- Relational SQLite schema for structured data: Courses, CAP admission cutoffs, fee structures, faculty cabins, exam timetables, and library timings.
- Out-of-scope protection: Refuses to hallucinate on non-college queries.

### ⚡ Kiosk Automation & Diagnostics
- **45-Second Inactivity Auto-Reset**: Automatically clears dialogue history and resets language to default after 45 seconds of idle time for the next visitor.
- **Honest Hardware State**: Real-time microphone permission checking (`Mic Ready` vs. `Mic Blocked`) with direct browser permission prompts.
- **Hidden Technician Diagnostics**: 5-tap gesture on the CampusAI header logo unlocks a technician diagnostic modal with mic level meters and local knowledge status.
- **Responsive Mobile/Tablet Support**: Adaptive segmented navigation (`Directory` / `Live Assistant`) for touchscreens and mobile viewports.

---

## 🏗️ System Architecture

```
                                  +---------------------------------------+
                                  |     Touchscreen Kiosk / Browser UI    |
                                  |  (Next.js 16 • React 19 • Tailwind 4)  |
                                  +-------------------+-------------------+
                                                      |
                         +----------------------------+---------------------------+
                         | Spoken Audio / Touch Event                             | Reactive UI State
                         v                                                        v
+------------------------------------+                               +------------------------------------+
|       Audio Input Processing       |                               |      Interactive Kiosk View        |
| - Web Speech API / Groq Whisper    |                               | - 3D Reactive Robot Avatar         |
| - Live Interim Speech Stream       |                               | - Interactive SVG Floor Map        |
| - Noise Filtering & Silence VAD    |                               | - Scannable Mobile QR Modal        |
+-----------------+------------------+                               | - Timetable & Fee Data Tables      |
                  |                                                  | - Segmented Mobile/Tablet Drawer   |
                  v                                                  +-----------------+------------------+
+------------------------------------+                                                 ^
|  FastAPI Multi-Agent Orchestrator  |                                                 |
|  - Language & Intent Router        |                                                 |
|  - Admission & Eligibility Agent   |                                                 |
|  - Faculty Cabin & Location Agent  |                                                 |
|  - Exam Schedule & Timetable Agent |                                                 |
+--------+------------------+--------+                                                 |
         |                  |                                                          |
         v                  v                                                          |
+----------------+  +----------------+                                                 |
|  FAISS Vector  |  |  SQLite RDBMS  |                                                 |
|  RAG Engine    |  |  (Rooms, Fees, |                                                 |
|  (Documents)   |  |   Schedules)   |                                                 |
+--------+-------+  +-------+--------+                                                 |
         |                  |                                                          |
         +--------+---------+                                                          |
                  |                                                                    |
                  v                                                                    |
+------------------------------------+                                                 |
|      Verified Answer Synthesis     |-------------------------------------------------+
|  - Grounded Knowledge Matcher      |
|  - Sentence-Pipelined Edge-TTS     |
|  - One-Tap Follow-Up Chip Suggester|
+------------------------------------+
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | Next.js 16.4.6 (App Router), React 19 | Production kiosk web application |
| **Styling & Design** | Tailwind CSS v4, Lucide & Feather Icons | Institutional SLRTCE theme, responsive layouts |
| **Interactive Map** | Vector SVG + Floor Coordinate Engine | Real-time multi-step indoor navigation routes |
| **Backend Framework** | Python 3.11+, FastAPI, Uvicorn | High-performance REST & WebSocket API |
| **LLM Inference** | Groq Cloud (`llama-3.3-70b-versatile`) | Fast, grounded response generation |
| **Speech-to-Text** | Groq Whisper API (`whisper-large-v3-turbo`) | Multilingual speech transcription |
| **Text-to-Speech** | `edge-tts`, Web Speech API | Neural natural Indian accent voices (`en-IN`, `hi-IN`, `mr-IN`) |
| **Vector Database** | FAISS (`faiss-cpu`) | Local vector similarity search |
| **Embeddings** | `intfloat/multilingual-e5-small` | Multilingual document embeddings |
| **Relational Database** | SQLite3 | Structured faculty cabins, timetables, fee tables |
| **Mobile Integration** | QR Code Generator | Instant smartphone handoff for directions & checklists |

---

## 📁 Repository Structure

```
CampusAI/
├── frontend/                      # Next.js 16 Web Kiosk Application
│   ├── app/
│   │   ├── kiosk/page.tsx         # Main interactive kiosk page
│   │   ├── layout.tsx             # Root layout with SLRTCE metadata
│   │   └── page.tsx               # Welcome landing page
│   ├── components/
│   │   ├── kiosk/
│   │   │   ├── kiosk-shell.tsx    # Kiosk shell, state machine, mic/audio loop
│   │   │   ├── rich-cards.tsx     # Interactive SVG floor plan, QR modal, cards
│   │   │   └── campus-robot.tsx   # 3D robot avatar with reactive micro-animations
│   │   └── ui/                    # Base UI components
│   ├── lib/
│   │   └── kiosk/
│   │       ├── campus-knowledge.ts# Grounded SLRTCE directory, routes & timetables
│   │       └── translations.ts    # Multilingual translation dictionary (EN/HI/MR/Hinglish)
│   ├── package.json
│   └── tsconfig.json
├── backend/                       # FastAPI AI Core & Multi-Agent Backend
│   ├── agents/                    # Specialized agents (Router, Admission, Student, Faculty, Nav)
│   ├── api/                       # API route endpoints (/chat, /voice, /kiosk)
│   ├── database/                  # SQLite database schema, helpers, and seed data
│   ├── llm/                       # Groq LLM client wrapper & system prompts
│   ├── rag/                       # Document loaders, FAISS vector store, & Retriever
│   ├── speech/                    # Whisper STT, Edge-TTS, VAD, & audio pipelining
│   ├── utils/                     # Config loader, logger, language detector
│   ├── config.py                  # Centralized configuration
│   └── main.py                    # FastAPI application entrypoint
├── knowledge_base/                # Official college documents (.txt, .pdf, .docx)
│   ├── academics/
│   ├── admission/
│   ├── departments/
│   ├── facilities/
│   └── notices/
├── tests/                         # Test suites (RAG accuracy, agent routing, voice loop)
├── .env.example                   # Environment configuration template
├── README.md                      # Project documentation
└── requirements.txt               # Backend Python dependencies
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js 18+** & **npm**
- **Python 3.11+**
- **Groq API Key**: Obtain a free API key from [console.groq.com](https://console.groq.com)
- **ffmpeg** (Optional, recommended for local audio processing)

---

### 2. Frontend Setup (Next.js Kiosk)

```powershell
# Navigate to the frontend directory
cd CampusAI/frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```

The kiosk will be live at:
- Kiosk Terminal: [http://localhost:3000/kiosk](http://localhost:3000/kiosk)
- Demo Mode: [http://localhost:3000/kiosk?demo=1](http://localhost:3000/kiosk?demo=1) (runs with full interactive knowledge without needing backend running)

To build for production:
```powershell
npm run build
npm run start
```

---

### 3. Backend Setup (FastAPI & RAG Engine)

```powershell
# Navigate to repository root
cd CampusAI

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows PowerShell
# source venv/bin/activate    # macOS / Linux

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env
```

Open `.env` and configure your credentials:
```ini
GROQ_API_KEY=gsk_your_groq_api_key_here
```

Initialize knowledge base and database:
```powershell
# Ingest official college documents into vector store
python -m backend.rag.ingest --rebuild

# Seed structured SQLite database (faculty, rooms, timetables)
python -m backend.database.seed
```

Run the FastAPI server:
```powershell
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```
- Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 4. Standalone Terminal Voice Loop

You can also run CampusAI directly in your terminal as a voice-driven robot:
```powershell
python tests/voice_loop.py
```

---

## 💬 Sample Inquiries Supported

| Category | Example Visitor Question | CampusAI Response & Rich Action |
|---|---|---|
| **Wayfinding** | *"Where is Dr. Rajesh Sharma's cabin?"* | Identifies Room B-305 (3rd Floor), displays 3-step interactive indoor route on SVG floor map, and offers smartphone QR code. |
| **Admissions** | *"What are the documents needed for B.Tech admission?"* | Provides 2026 CAP admission checklist, CAP code (`3182`), annual fees, and QR code to take checklist on mobile. |
| **Timetables** | *"Show me the Exam Cell and university timetable."* | Displays Room A-104 (Ground Floor) location and active Semester III & V exam schedule table. |
| **Facilities** | *"What are the Central Library hours?"* | Reports 2nd Floor Main Block location and operating hours (8:00 AM – 9:00 PM). |
| **Multilingual** | *"कॉलेजमध्ये कॉम्प्युटर इंजिनीअरिंग विभाग कुठे आहे?"* | Responds in Marathi with exact building and floor details, with spoken Marathi neural voice. |

---

## 🗓️ Project Roadmap

- [x] **Phase 1: Software Brain Core** (FastAPI backend, Groq LLM client, prompt templates)
- [x] **Phase 2: RAG & Confidence Gating** (FAISS vector store, multilingual embeddings, confidence evaluator)
- [x] **Phase 3: Multilingual Voice Pipeline** (Groq Whisper STT, Edge-TTS, VAD recording, sentence streaming)
- [x] **Phase 3.5: Talking Robot Upgrades** (Sentence pipelining, non-repeating fillers, half-duplex mic timing)
- [x] **Phase 4: SQLite Database & Multi-Agent Architecture** (Router, Admission, Student, Faculty, Nav agents)
- [x] **Phase 5: Production Kiosk Interface** (Next.js 16, SLRTCE institutional theme, anti-slop design system)
- [x] **Phase 6: Interactive Wayfinding & Rich Cards** (Step-by-step SVG floor plans, phone QR modals, exam timetables)
- [x] **Phase 7: Hardware & Audio Polish** (Honest mic status, 45s idle reset, 5-tap technician diagnostic drawer)
- [ ] **Phase 8: Physical ESP32 Hardware Integration** (ESP32-S3 microcontroller bridge, I2S microphone, cavity speaker)
- [ ] **Phase 9: Physical Robot Chassis** (3D printed desktop body, pan/tilt servo head)

---

## 🔒 Privacy & Security

- **Zero Data Harvesting**: Spoken audio and video camera previews remain strictly local to the kiosk browser. No audio recordings or camera frames are retained or uploaded.
- **Local Relational & Vector Storage**: SQLite databases and vector indices are created locally and automatically excluded from Git commits via `.gitignore`.
- **Zero Client-Side Secrets**: All Groq and cloud credentials remain securely on the server side.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

---

## 👥 Authors & Acknowledgments

- **Dhruv Vawhle** ([@DhruvVawhle](https://github.com/DhruvVawhle))  
- **Shree L. R. Tiwari College of Engineering (SLRTCE)**, Mira Road, Mumbai.  
- Project Repository: [https://github.com/DhruvVawhle/Campus-AI](https://github.com/DhruvVawhle/Campus-AI)
