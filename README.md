# Interview AI — Career Acceleration & Mock Interview Platform

Interview AI is an enterprise-grade career preparation and interview intelligence platform engineered with a high-performance **React 19 + Vite** frontend, a scalable **Fastify + Node.js + TypeScript** backend, and **MongoDB Atlas**. It integrates multi-source job ingestion, resume parsing, ATS compatibility analysis, and real-time AI mock technical/behavioral interviews.

---

## 🌟 Production Architecture Overview

```
                                    CLIENT LAYER
                             React 19 + Vite (apps/web)
          ┌──────────────────────────────────────────────────────────────┐
          │  Route-Level Lazy Loading (React.lazy + Suspense)            │
          │  Tailwind CSS Dark Theme + Glassmorphic UI                   │
          │  Code-Split Vendor Chunks (Monaco, PDFjs, Recharts, Superdoc) │
          │  SEO Metadata, Sitemap, Robots, Canonical URLs               │
          └──────────────────────────────┬───────────────────────────────┘
                                         │ HTTPS / wss:// (Strict CORS)
                                         ▼
                                   API GATEWAY
                         Fastify + Node.js (apps/api-node)
          ┌──────────────────────────────────────────────────────────────┐
          │  Fastify Helmet (CSP, X-Frame-Options: DENY, nosniff, HSTS)  │
          │  Multi-Tenant Object Ownership Authorization (Anti-IDOR)     │
          │  Centralized Zod Schema Validation & Sanitized Error Handler │
          │  Rate Limiting (100 req/min on Auth) & Request Correlation   │
          │  Health Probes: /health/live, /health/ready                  │
          └───────────────┬──────────────────────────────┬───────────────┘
                          │ Mongoose Connection Pool     │ Streaming AI
                          ▼                              ▼
                 DATA PERSISTENCE                 AI PROVIDERS
               MongoDB Atlas Cluster          Groq / OpenAI / Gemini
               (Compound Indexed Schemas)     (Whisper STT + LLM Rubrics)
```

---

## 🛠️ Tech Stack & Key Highlights

| Component | Technology | Description |
|---|---|---|
| **Frontend** | React 19, Vite 6, Tailwind CSS | Code-split SPA with sub-second page transitions, dark-mode glassmorphic design system |
| **Backend** | Fastify 5, Node.js 22, TypeScript | Ultra-low latency asynchronous API gateway with schema validation and correlation IDs |
| **Database** | MongoDB Atlas (Mongoose 8) | Multi-replica cluster with compound indexing, connection pooling, and automated point-in-time recovery |
| **Security** | Fastify Helmet, CORS, bcrypt, JWT | HSTS preload, clickjacking prevention, fail-fast secrets validation, anti-IDOR guards |
| **AI Integrations** | Groq, OpenAI, Gemini | High-speed LLM reasoning, multi-dimensional rubric scoring, and Whisper transcription |
| **Legal & Trust** | Statutory Privacy & Terms | Terms acceptance tracking (`termsAcceptedVersion: "v2.0"`), user export/delete rights |
| **Testing** | Vitest, Playwright | 23 backend test suites (118 tests passed), multi-user authorization regression tests |

---

## 🚀 Quickstart & Local Development

### Prerequisites
- **Node.js**: v20 or v22 (LTS recommended)
- **npm**: v10+
- **MongoDB**: Local MongoDB instance or MongoDB Atlas connection string

### 1. Installation
Clone the repository and install dependencies using the committed lockfile:
```bash
git clone https://github.com/Gundavenkatasai/interviewai.git
cd interviewai
npm install --legacy-peer-deps
```

### 2. Environment Configuration
Copy sample environment templates:
```bash
cp apps/api-node/.env.example apps/api-node/.env
cp apps/web/.env.example apps/web/.env
```

Key environment variables:
- `MONGODB_URI`: MongoDB connection string (e.g. `mongodb://localhost:27017/interviewai`)
- `JWT_SECRET`: Minimum 32-character high-entropy secret
- `NODE_ENV`: Set to `development` locally (`production` enforces strict security constraints)
- `GROQ_API_KEY`: API key for Groq Cloud LLM and Whisper transcription

*(Refer to [`docs/deployment/environment-matrix.md`](docs/deployment/environment-matrix.md) for full variable reference)*

### 3. Running Locally
Run both frontend and backend concurrently:
```bash
# Start backend API (port 8001 / 5000)
npm run dev --prefix apps/api-node

# Start frontend development server (port 5173)
npm run dev --prefix apps/web
```

Access the application in your browser:
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **API Health Check**: [http://localhost:8001/health/ready](http://localhost:8001/health/ready)

---

## 🧪 Testing & Verification

### Unit & Integration Tests (Backend)
Run Vitest across all 23 backend test suites (118 passing tests):
```bash
npm test --prefix apps/api-node
```

Run specific cross-user security and health tests:
```bash
npx vitest run tests/cross-user-authorization.test.ts --prefix apps/api-node
npx vitest run tests/health.test.ts --prefix apps/api-node
```

### End-to-End Tests (Frontend)
Run Playwright end-to-end user journeys (Auth, Jobs, Resumes, Interviews):
```bash
npx playwright test --prefix apps/web
```

### Monorepo Production Build Verification
Verify TypeScript compilation and Rollup vendor chunking:
```bash
npm run build
```

---

## 🚢 Production Deployment & Health Probes

### Container Health Probes
The API exposes standardized Kubernetes/Docker liveness and readiness probes:
- `GET /health/live`: Lightweight process liveness probe (returns HTTP 200 `{"status":"ok"}`).
- `GET /health/ready`: Deep dependency readiness probe verifying active MongoDB connection ping (returns HTTP 200 or 503).

### Deployment Runbooks
- [**Production Readiness Audit**](docs/production/production-readiness-audit.md): Phase 1–26 audit matrix and verification evidence.
- [**Final Production Audit**](docs/production/final-production-audit.md): Comprehensive pre-launch verification sign-off.
- [**Release Checklist**](docs/production/release-checklist.md): Step-by-step launch checklist.
- [**Production Security Review**](docs/security/production-security-review.md): Threat modeling, anti-IDOR, Helmet CSP, and rate limiting.
- [**Performance Report**](docs/performance/production-performance-report.md): Code splitting, bundle sizes, and Core Web Vitals targets.
- [**Environment Matrix**](docs/deployment/environment-matrix.md): Exhaustive environment variable scopes and classifications.
- [**Backup & Disaster Recovery**](docs/deployment/backup-and-recovery.md): MongoDB Atlas point-in-time recovery runbooks (RPO $\le 15\text{min}$, RTO $\le 30\text{min}$).
- [**Rollback Plan**](docs/deployment/rollback-plan.md): Zero-downtime rollback procedures for container images, CDNs, and database migrations.

---

## 📄 License & Attribution

Interview AI is licensed under the MIT License. See [LICENSE](LICENSE) for details. Third-party library attributions and open-source licenses are detailed in [docs/legal/attribution.md](docs/legal/attribution.md).
