# Interview AI — Final Monorepo Repository Tree & Directory Specification
**Phase 35 Architecture Deliverable**  
*Date: 2026-10-01* | *System: Interview AI Production Architecture*

---

## 1. Final Complete Monorepo Tree

```
interview-ai/
├── apps/
│   ├── web/                          # Deployable React 19 / Vite SPA
│   │   ├── src/
│   │   │   ├── app/                  # App setup, providers, routing
│   │   │   ├── components/           # Common layouts, ProtectedRoute, Sidebar
│   │   │   ├── features/             # Domain-partitioned feature modules
│   │   │   │   ├── analytics/
│   │   │   │   ├── applications/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── debrief/
│   │   │   │   ├── interview/
│   │   │   │   ├── interview-intelligence/
│   │   │   │   ├── jobs/
│   │   │   │   ├── linkedin/
│   │   │   │   ├── outreach/
│   │   │   │   ├── portfolio/
│   │   │   │   ├── profile/
│   │   │   │   ├── resume/
│   │   │   │   └── story-bank/
│   │   │   ├── hooks/                # High-level domain hooks (useInterviewRoom)
│   │   │   ├── lib/                  # Web helpers & API wrappers
│   │   │   ├── pages/                # Page views
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   ├── api-node/                     # Authoritative Fastify 5.x Backend API (alias: api)
│   │   ├── src/
│   │   │   ├── config/               # Env parsing & Fastify server configs
│   │   │   ├── db/                   # MongoDB connection & transaction management
│   │   │   ├── middleware/           # Auth, rate-limiting, CORS, helmet
│   │   │   ├── modules/              # 16 Domain Modules
│   │   │   │   ├── analytics/
│   │   │   │   ├── applications/
│   │   │   │   ├── auth/
│   │   │   │   ├── candidate/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── interview/        # Complete 12-state interview lifecycle
│   │   │   │   ├── interview-debrief/
│   │   │   │   ├── interview-intelligence/
│   │   │   │   ├── jobs/             # Job search, matching, trust scoring
│   │   │   │   ├── linkedin/         # LinkedIn session & outreach manager
│   │   │   │   ├── outreach/
│   │   │   │   ├── pipeline/         # Auto-apply & suppression engine
│   │   │   │   ├── portfolio/
│   │   │   │   ├── profile/
│   │   │   │   ├── resume/           # Resume Studio models & processing
│   │   │   │   ├── story-bank/
│   │   │   │   └── users/
│   │   │   ├── websocket/            # Fastify WebSocket route handler
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   ├── tests/                    # Vitest unit, hardening & boundary tests
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── worker/                       # Isolated BullMQ / Background Worker
│   │   ├── src/
│   │   │   └── main.ts               # Background processor bootstrap
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── realtime/                     # Isolated WebSocket Streaming Gateway
│       ├── src/
│       │   └── main.ts               # Standalone WS server bootstrap
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── ui/                           # Reusable UI component library (Buttons, Badges, Rings, Cards)
│   ├── api-client/                   # Domain-partitioned typed Axios API client
│   ├── contracts/                    # Centralized Zod request/response validation schemas
│   ├── types/                        # Cross-application shared TypeScript interfaces
│   ├── validation/                   # SSRF protection, filename sanitization, password rules
│   ├── config/                       # Centralized environment loader & Zod validation
│   ├── logger/                       # Structured, redaction-safe application logger
│   ├── observability/                # Correlation IDs & metric counters
│   └── testing/                      # Shared test factories and mock generators
│
├── services/
│   ├── ai/                           # Isolated AI routing, Groq/Qwen/Fake providers, reliability
│   ├── job-ingestion/                # Scraper adapters, deduplication hash, normalization
│   ├── document-processing/          # OOXML DOCX parsing, structure preservation, PDF extraction
│   ├── linkedin-skills/              # Autonomous LinkedIn agent skill suite (upstream)
│   └── jobspy-sidecar/               # Python scraper microservice
│
├── infrastructure/
│   ├── docker/                       # Production multi-stage Dockerfiles (api, web, worker, realtime)
│   ├── mongodb/                      # MongoDB initialization scripts and indexes
│   ├── redis/                        # Redis queue configuration
│   ├── nginx/                        # Reverse proxy configuration
│   └── monitoring/                   # Prometheus scrape configurations
│
├── docs/
│   ├── architecture/                 # Complete lifecycle, state machine, audit, dependency rules
│   ├── domains/                      # Domain specifications (jobs, resume, interview, linkedin)
│   ├── api/                          # OpenAPI / Swagger specifications
│   ├── security/                     # Security policies & threat models
│   ├── deployment/                   # Docker & cloud run deployment runbooks
│   ├── testing/                      # Automated test strategies
│   └── roadmap/                      # Product roadmap and completion milestones
│
├── scripts/
│   ├── database/                     # Migration & seeding utilities
│   ├── development/                  # Local orchestration scripts (dev-all.ps1, dev-all.sh)
│   ├── migration/                    # Forensic & architecture migration audit scripts
│   └── release/                      # Release packaging scripts
│
├── tests/
│   ├── e2e/                          # End-to-end user journey tests
│   ├── integration/                  # Cross-service integration tests
│   ├── performance/                  # Load tests & throughput benchmarks
│   └── security/                     # Architectural boundary enforcement tests
│
├── .github/
│   └── workflows/
│       └── ci.yml                    # Automated GitHub Actions CI workflow
│
├── package.json                      # Root workspace package.json
├── pnpm-workspace.yaml               # PNPM workspace definition
├── turbo.json                        # Turborepo task pipeline configuration
├── docker-compose.yml                # Docker Compose orchestration
├── .env.example                      # Root environment example template
├── README.md                         # Project documentation
├── CONTRIBUTING.md                   # Community contribution guide
├── SECURITY.md                       # Vulnerability reporting guidelines
└── LICENSE                           # MIT License
```

---

## 2. Directory Responsibilities, Dependencies & Ownership Matrix

| Major Directory | Primary Responsibility | Allowed Dependencies | Forbidden Dependencies | Architecture Owner |
| :--- | :--- | :--- | :--- | :--- |
| **`apps/web`** | User-facing React SPA presentation & UX | `packages/ui`, `packages/api-client`, `packages/contracts`, `packages/types` | `mongoose`, Fastify, direct AI calls, worker internals | Frontend Lead |
| **`apps/api-node`** | Authoritative HTTP & WebSocket API, authentication, domain orchestration | `packages/*`, `services/*`, MongoDB / Redis | `apps/web`, UI components, DOM objects | Backend Lead |
| **`apps/worker`** | Asynchronous batch processing (ATS scoring, PDF parsing, bulk ingestion) | `packages/contracts`, `packages/logger`, `packages/types`, `services/*` | `apps/web`, UI components, React hooks | Infra / Data Lead |
| **`apps/realtime`** | Low-latency audio & state streaming WebSocket gateway | `packages/contracts`, `packages/types`, `packages/logger` | Business domain mutation, UI components | Streaming Lead |
| **`packages/ui`** | Headless & styled reusable presentation widgets (Buttons, Badges, Rings) | `react`, `lucide-react`, Tailwind classes | Business models, MongoDB, backend APIs | Design System Team |
| **`packages/contracts`** | Authoritative Zod schemas for all network requests, responses, and events | `zod`, `packages/types` | App code, HTTP servers, UI components | Core Platform Team |
| **`packages/api-client`** | Type-safe HTTP client consuming network contracts | `axios`, `packages/contracts`, `packages/types` | React components, database drivers | Core Platform Team |
| **`services/ai`** | Multi-provider LLM routing, token budgeting, prompt registry, circuit breaking | `packages/types`, `packages/logger`, LLM provider SDKs | HTTP controllers, UI components, Fastify | AI Platform Team |
| **`services/job-ingestion`** | Multi-source scraping, parsing, deduplication identity generation | `packages/types`, `packages/logger`, `packages/validation` | Frontend code, core business controllers | Data Ingestion Team |
| **`services/document-processing`**| OOXML byte-level preservation, Mammoth AST, PDF-Lib rendering | `packages/types`, `packages/logger`, `docx`, `pdf-lib` | Frontend components, HTTP routing | Document Engine Team |
| **`infrastructure/`** | Dockerfiles, Nginx configs, DB indexes, Prometheus monitoring | Docker daemon, Nginx, Linux runtime | Application source files | DevOps / SRE |
