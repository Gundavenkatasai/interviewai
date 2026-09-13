# Day 1 System Audit

## 1. Frontend
* **Framework:** React 19 / Vite (Next.js 15 claimed in README, but Vite is actual).
* **Routing:** React Router v6.
* **Styling:** Tailwind CSS + Glassmorphic custom utilities.
* **State Management:** React Context (`hooks` and `contexts` folders).
* **API Client:** React Query + Fetch API wrapper (`lib/api.ts`).
* **WebSocket Client:** Custom `useWebSocket` hook in `hooks/useWebSocket.ts`.
* **Component Organization:** Segregated by domain (`interview`, `common`, etc.).
* **Forms/Validation:** Standard controlled components (needs standardization to react-hook-form + Zod for production).

## 2. Backend
* **Runtime:** Node.js v22+.
* **Framework:** Fastify v5 (Python/FastAPI claimed in README, but Fastify is actual).
* **Module Structure:** Domain-driven (`src/modules/*`).
* **Controllers & Services:** Clear separation, but heavily controller-heavy in `resume.controller.ts` (97KB).
* **Middleware:** Fastify authentication hooks (`middleware/auth.ts`).
* **WebSockets:** `@fastify/websocket` used in `websocket/manager.ts`.
* **Background Jobs:** BullMQ + Redis configured in package.json but usage is minimal.
* **External Integrations:** Groq (LLM & STT), LinkedIn.

## 3. Database
* **Technology:** MongoDB via Mongoose (PostgreSQL claimed in README, but Mongoose is actual).
* **Models:** 13 collections spanning profiles, jobs, applications, interviews, resumes.
* **Timestamps:** Standard Mongoose timestamps used.
* **Soft Delete:** Missing on most models.
* **Versioning:** Present explicitly on Resume versions.
* **Dependencies Map:**
  * `Application` depends on `Job` and `User`.
  * `Interview` depends on `User`.
  * `Resume` depends on `User`.
