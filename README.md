# InterviewAI — Production-Ready AI Mock Interview Platform

InterviewAI is a personal AI mock interview practice platform engineered to simulate realistic, high-bar technical, HR, and coding interviews with live speech transcription, dynamic follow-up questioning, real-time 8-dimensional rubric evaluation, and post-interview diagnostic reports.

---

## 🚀 Key Highlights & Philosophy

* **100% Selective Input & Privacy First**: Zero desktop scraping, zero hidden overlays, no Google Meet injection, and no surveillance evasion techniques. Explicit microphone permissions via standard browser APIs with visible indicators.
* **Single Free Groq Cloud Key**: Powered completely by Groq's high-speed free tier for both **LLM reasoning** (`openai/gpt-oss-120b`) and **Whisper transcription** (`whisper-large-v3-turbo`).
* **Modular Speech Transcription**: Pluggable `SpeechProvider` abstraction combining Web Speech API (zero-latency local interim) with cloud Whisper (high-accuracy audio chunking).
* **Live Coding Interview Sandbox**: Interactive Monaco Editor supporting Python, JavaScript, Java, and C++ with test cases, execution output, and AI algorithmic code review.
* **8-Dimensional Evaluator**: Graded from 0 to 10 on correctness, relevance, technical depth, completeness, communication, confidence, examples, and problem-solving.

---

## 🏛️ System Architecture

```
                                  BROWSER (Next.js 15)
     ┌──────────────────────────────────────┬──────────────────────────────────┐
     │  Landing → Setup → Session Dashboard │  Live Monaco Editor + Tests     │
     │  Mic (getUserMedia) + Audio Visual   │  WebSocket Client (ws://:8001)   │
     └──────────────────┬───────────────────┴──────────────────┬───────────────┘
                        │ HTTP / Audio Blobs                   │ WebSockets
                        ▼                                      ▼
     ┌─────────────────────────────────────────────────────────────────────────┐
     │                         FastAPI Backend (Port 8001)                     │
     │  - REST APIs: /api/auth, /api/interviews, /api/ai, /api/code, etc.      │
     │  - Real-Time WebSocket Manager: /ws/interview/{session_id}              │
     │                                                                         │
     │  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────┐  │
     │  │  AI Service (Groq)    │  │  Whisper STT (Groq)   │  │ Code Runner │  │
     │  │  openai/gpt-oss-120b  │  │  whisper-large-v3-turb│  │ Piston /    │  │
     │  │  Strict Pydantic JSON │  │  Audio Chunk Pipeline │  │ Sandbox     │  │
     │  └───────────────────────┘  └───────────────────────┘  └─────────────┘  │
     └────────────────────────────────────┬────────────────────────────────────┘
                                          │
                                          ▼
     ┌─────────────────────────────────────────────────────────────────────────┐
     │                   PostgreSQL 15 Container (Port 5433)                   │
     │  Users, Sessions, Questions, Answers, Evaluations, Transcripts, Scores   │
     └─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, Monaco Editor, Recharts, Lucide Icons |
| **Backend** | FastAPI (Python 3.13), Uvicorn, Pydantic v2, SQLAlchemy, SlowAPI, PyPDF |
| **AI LLM** | Groq Cloud API (`openai/gpt-oss-120b` / `qwen/qwen3.8-27b`) |
| **Speech-to-Text** | Groq Whisper (`whisper-large-v3-turbo`) + Browser Web Speech API fallback |
| **Database** | PostgreSQL 15 (Docker port 5433) with SQLite fallback |
| **Code Sandbox** | Piston (Docker port 2000) with local safe subprocess runner fallback |
| **PDF Generation**| jsPDF + html2canvas |

---

## 📁 Project Directory Tree

```
c:\Users\venka\OneDrive\Desktop\interview\
├── docker-compose.yml              # PostgreSQL + Piston containers
├── .env.example                    # Environment variables template
├── .env                            # Active environment configuration
├── README.md                       # Master documentation
│
├── apps/
│   ├── api/                        # FastAPI Backend
│   │   ├── main.py                 # FastAPI application entrypoint & WebSockets
│   │   ├── requirements.txt        # Python dependencies
│   │   ├── src/
│   │   │   ├── config.py           # Settings & .env loading
│   │   │   ├── database.py         # SQLAlchemy engine & sessionmaker
│   │   │   ├── models/             # 10 Database models
│   │   │   │   └── models.py
│   │   │   ├── schemas/            # Pydantic schemas & AI JSON specs
│   │   │   │   └── schemas.py
│   │   │   ├── auth/               # Bcrypt password hashing & JWT tokens
│   │   │   │   └── auth.py
│   │   │   ├── services/           # Core domain logic
│   │   │   │   ├── ai_service.py   # Groq LLM & structured JSON prompts
│   │   │   │   ├── transcription_service.py # Groq Whisper SpeechProvider
│   │   │   │   ├── resume_service.py # PDF/DOCX parser
│   │   │   │   └── code_executor_service.py # Sandbox runner
│   │   │   ├── routes/             # REST endpoints
│   │   │   │   ├── auth_routes.py
│   │   │   │   ├── interview_routes.py
│   │   │   │   ├── dashboard_routes.py
│   │   │   │   ├── ai_routes.py
│   │   │   │   ├── transcription_routes.py
│   │   │   │   ├── resume_routes.py
│   │   │   │   ├── code_routes.py
│   │   │   │   └── user_routes.py
│   │   │   └── websocket/
│   │   │       └── manager.py      # Real-time WebSocket connection manager
│   │   └── tests/                  # Automated pytest suite
│   │       ├── conftest.py
│   │       ├── test_auth.py
│   │       ├── test_code_executor.py
│   │       └── test_interviews.py
│   │
│   └── web/                        # Next.js 15 Frontend
│       ├── package.json
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       ├── next.config.mjs
│       └── src/
│           ├── app/
│           │   ├── layout.tsx      # Global layout & ambient styling
│           │   ├── globals.css     # Glassmorphic utilities
│           │   ├── page.tsx        # Modern Landing Page
│           │   ├── setup/page.tsx  # Interview setup & resume upload
│           │   ├── interview/[id]/page.tsx # Core 3-Panel Dashboard
│           │   ├── dashboard/page.tsx # Performance charts & statistics
│           │   ├── history/page.tsx # Interview archives & deletion
│           │   ├── report/[id]/page.tsx # Post-interview report & PDF export
│           │   ├── privacy/page.tsx # Privacy guarantees & data purge
│           │   └── auth/           # Login & Registration pages
│           ├── components/
│           │   ├── common/Navbar.tsx
│           │   └── interview/
│           │       ├── AudioControls.tsx
│           │       ├── TranscriptPanel.tsx
│           │       ├── AICoachPanel.tsx
│           │       ├── CodingSandbox.tsx
│           │       └── InterviewerMode.tsx
│           ├── hooks/
│           │   ├── useAudio.ts
│           │   └── useWebSocket.ts
│           ├── lib/
│           │   ├── api.ts
│           │   └── utils.ts
│           ├── services/
│           │   └── speechProvider.ts
│           └── types/
│               └── index.ts
```

---

## ⚙️ Environment Variables

Located at `.env` in the workspace root:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5433/interviewai
SQLITE_FALLBACK=true

# Security
JWT_SECRET=interviewai-secret-jwt-token-production-quality-98234791
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI Provider (Groq Cloud)
GROQ_API_KEY=gsk_your_groq_key_here
GROQ_MODEL=openai/gpt-oss-120b
GROQ_WHISPER_MODEL=whisper-large-v3-turbo

# Code Sandbox
PISTON_API_URL=http://localhost:2000

# Service URLs
PORT=8001
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_WS_URL=ws://localhost:8001
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## 🏃 Setup & Execution Commands

### 1. Start Docker Containers
Starts all services including PostgreSQL (port 5433), Piston code execution sandbox (port 2000), backend API (port 8001), and Next.js frontend (port 3000):
```powershell
# From project root
$env:PATH = "C:\Users\venka\AppData\Local\Programs\DockerDesktop\resources\bin;$env:PATH"
docker compose up -d
```

### 2. Run Backend Tests
Run automated test suite verifying auth, code execution, and AI lifecycle:
```powershell
$env:PYTHONPATH = "apps/api"
apps/api/.venv/Scripts/pytest.exe apps/api/tests -v
```

### 3. Start Backend Server
```powershell
$env:PYTHONPATH = "apps/api"
apps/api/.venv/Scripts/python.exe -m uvicorn main:app --app-dir apps/api --host 0.0.0.0 --port 8001 --reload
```
Health check: `http://localhost:8001/health`
Interactive Swagger Docs: `http://localhost:8001/docs`

### 4. Start Frontend Web Server
```powershell
cd apps/web
npm run dev
```
Open in browser: **`http://localhost:3000`**

---

## 🎙️ How Audio Flows Through The System

1. **User Action**: The candidate clicks "Start Speaking" on the audio controls bar.
2. **Explicit Consent**: Browser triggers standard `navigator.mediaDevices.getUserMedia({ audio: true })`.
3. **Audio Capture**: A live `AudioContext` and `AnalyserNode` analyze frequency bins to animate real-time volume meters on the UI.
4. **Speech-to-Text Pipeline**:
   * *Local Interim Stream*: If supported by browser, the `WebSpeechApiProvider` displays real-time interim transcription bubbles instantly as the user speaks.
   * *Cloud Whisper Transcription*: Audio chunks recorded via `MediaRecorder` are dispatched to `POST /api/transcription`. The backend `GroqWhisperSpeechProvider` transcribes the audio using Groq's high-performance `whisper-large-v3-turbo` model.
5. **Real-Time Display**: Transcripts are broadcast over WebSockets (`/ws/interview/{session_id}`) and displayed in the central conversation panel.

---

## 🧠 How AI Evaluation Works

1. **Answer Submission**: When the candidate finishes speaking or typing, their answer is posted to `POST /api/interviews/{session_id}/answers`.
2. **WebSocket Status Signal**: The backend immediately broadcasts status `"Analyzing..."` to the UI.
3. **Structured Prompts with JSON Enforcement**: The backend packages the question, expected concepts, and candidate's answer into a calibrated prompt sent to Groq (`openai/gpt-oss-120b`).
4. **8-Dimension Scoring**:
   * **Correctness (0-10)**: Factual accuracy against standard principles.
   * **Relevance (0-10)**: Directly addressing the specific question asked.
   * **Technical Depth (0-10)**: Deep architectural understanding and awareness of internals.
   * **Completeness (0-10)**: Coverage of edge-cases and critical trade-offs.
   * **Communication (0-10)**: Clarity, structure, and professional phrasing.
   * **Confidence (0-10)**: Certainty and conviction in technical decisions.
   * **Concrete Examples (0-10)**: Real-world analogies, code, or production metrics.
   * **Problem Solving (0-10)**: Systematic decomposition and analytical approach.
5. **Schema Validation**: The AI response is parsed and validated using Pydantic's `AnswerEvaluationAIResponse`.
6. **Dynamic Follow-Up**: If the answer warrants deeper probing, the AI dynamically inserts a follow-up question into the interview queue.
7. **Broadcast**: The evaluation score, feedback, missing points, and follow-up are broadcast live to the candidate's right AI Coach panel.

---

## 🔒 Security & Privacy Considerations

* **No Secret Recording**: The platform explicitly prohibits and excludes screen scraping, hidden video streams, and browser injection.
* **Passwords**: Never stored in plaintext; salted and hashed using `bcrypt`.
* **API Keys**: Stored strictly server-side in `.env`; never leaked into frontend client bundles.
* **Code Execution**: Run within the isolated Piston Docker sandbox with resource quotas, or an isolated temporary sandbox with strict 5.0-second CPU timeouts.
* **Data Sovereignty**: Complete "Delete Interview" and "Delete All Data" features empower users to permanently purge their transcripts, audio files, and resumes.
