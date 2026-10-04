# Interview AI — Forensic Repository Audit & Dependency Graph Analysis
**Phase 1 Migration Deliverable**  
*Date: 2026-10-01* | *System: Interview AI SaaS Platform*

---

## 1. Executive Summary

This forensic audit evaluates the entire Interview AI codebase prior to architectural monorepo migration.
The repository currently operates across two primary application directories (`apps/api-node` and `apps/web`), two sidecar service folders (`services/jobspy-sidecar` and `services/linkedin-skills`), and root-level scripts/documentation.

While functional features (Resume Studio, Mock Interview loop, Job ingestion, ATS scanning, and LinkedIn workspace) have been hardened and verified with 43 passing tests, the code distribution exhibits significant architectural debt:
1. **Monolithic Controllers & Files**: `resume.controller.ts` (3,275 lines), `api.ts` frontend client (1,631 lines), `ResumeStudioPage.tsx` (1,522 lines), `JobsPage.tsx` (1,370 lines), and `jobs.controller.ts` (1,028 lines).
2. **Scattered Services**: Job ingestion adapters, AI providers, and document-processing engines reside inside backend feature modules rather than dedicated, reusable services.
3. **Cross-Domain Coupling**: 76 cross-domain imports exist where higher-level modules (`analytics`, `pipeline`, `applications`) directly import Mongoose models and internal services of other domains (`jobs`, `interview`, `outreach`).
4. **Duplicate Implementations**: Duplicate interface files (`provider.interface.ts`), duplicate LinkedIn adapters, and redundant React editor components in Resume Studio.
5. **Missing Monorepo Orchestration**: Root lacks workspace orchestration (`pnpm-workspace.yaml`, `turbo.json`), requiring individual subfolder dependency management.

---

## 2. Current Repository Tree & File Inventory

### 2.1 File Count by Area (Total Non-Ignored Files: 920)

| Area / Subsystem | Path | File Count | Primary Languages | Primary Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | `apps/api-node/` | **340** | TypeScript | Fastify server, Mongoose models, routes, controllers, WebSocket |
| **Frontend Web** | `apps/web/` | **187** | TSX, TS, CSS | Vite React SPA, Tailwind, Zustand, Monaco/SuperDoc |
| **LinkedIn Skills** | `services/linkedin-skills/` | **235** | Python, Markdown | Upstream autonomous LinkedIn automation skill suite |
| **JobSpy Sidecar** | `services/jobspy-sidecar/` | **39** | Python, Docker | Scraper microservice (Indeed, LinkedIn, Glassdoor, ZipRecruiter) |
| **Documentation** | `docs/` | **59** | Markdown | Architecture specs, runbooks, feature guides, audits |
| **Static Portfolio** | `portfolio/` | **49** | HTML, JS, CSS | Public candidate showcase static assets |
| **Scripts & Root** | `scripts/`, root | **11** | JS, CJS, PS1, YML | Startup scripts, environment configs, docker-compose |

### 2.2 Subdirectory Tree Structure (Current)

```
interview-ai/
├── apps/
│   ├── api-node/                     # Monolithic Fastify backend (340 files)
│   │   ├── src/
│   │   │   ├── ai/                   # AI core, router, providers, prompts
│   │   │   ├── config/               # Environment config
│   │   │   ├── db/                   # MongoDB connection
│   │   │   ├── integrations/         # LinkedIn adapter & external integrations
│   │   │   ├── jobs-engine/          # (Empty directory)
│   │   │   ├── middleware/           # Fastify auth middleware
│   │   │   ├── modules/              # 16 domain feature folders
│   │   │   │   ├── analytics/
│   │   │   │   ├── applications/
│   │   │   │   ├── auth/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── interview/
│   │   │   │   ├── interview-debrief/
│   │   │   │   ├── interview-intelligence/
│   │   │   │   ├── jobs/             # Contains job logic + ingestion adapters
│   │   │   │   ├── linkedin/
│   │   │   │   ├── outreach/
│   │   │   │   ├── pipeline/
│   │   │   │   ├── portfolio/
│   │   │   │   ├── profile/
│   │   │   │   ├── resume/           # Massive: models, docx-engine, pdf-engine
│   │   │   │   ├── story-bank/
│   │   │   │   └── users/
│   │   │   ├── websocket/            # Real-time interview session socket handlers
│   │   │   └── server.ts, app.ts
│   │   └── tests/                    # 8 test suites (Vitest)
│   └── web/                          # React/Vite SPA (187 files)
│       └── src/
│           ├── components/           # Common components + domain components
│           ├── contexts/             # AuthContext
│           ├── hooks/                # useInterviewRoom, useWebSocket, etc.
│           ├── lib/                  # api.ts (Monolithic 1600+ line client)
│           ├── pages/                # 29 page files + subdirectories
│           │   ├── Analytics/
│           │   ├── LinkedIn/
│           │   └── ResumeStudio/     # Sub-app with builder, canvas, engine
│           └── App.tsx, main.tsx
├── services/
│   ├── jobspy-sidecar/               # Python FastAPI scraper
│   └── linkedin-skills/              # Upstream autonomous skill repository
├── docs/                             # Architecture, roadmap, testing docs
├── scripts/                          # Forensic scripts, sidecar update scripts
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## 3. Oversized Files (> 400 Lines of Code)

The codebase contains 30 files exceeding 400 lines of code, with several exceeding 1,000 lines. These represent high-priority targets for domain separation and extraction:

| File Path | Lines | Primary Responsibilities | Target Domain / Architecture Layer |
| :--- | :--- | :--- | :--- |
| `apps/api-node/src/modules/resume/resume.controller.ts` | **3,275** | Upload, parse, export, tailor, ATS scan, AI improve, versioning | Split into `resume/`, `ats/`, `tailoring/` controllers |
| `apps/web/src/lib/api.ts` | **1,631** | Monolithic client with 80+ endpoints across all 16 domains | Migrate to `packages/api-client` with domain modules |
| `apps/web/src/pages/ResumeStudioPage.tsx` | **1,522** | Orchestrates builder, ATS scanner, templates, preview, export | Split into `features/resume/` & `features/ats/` |
| `apps/web/src/pages/JobsPage.tsx` | **1,370** | Search, filter, match display, ingestion trigger, pagination | Split into `features/jobs/` components & hooks |
| `apps/api-node/src/modules/resume/resume.model.ts` | **1,117** | 12 Mongoose schemas: Resume, ATS, tailoring, history, sections | Split per domain entity under `modules/resume/domain` |
| `apps/api-node/src/modules/resume/ats-engine/ats.evaluator.ts` | **1,116** | 10 ATS scoring dimensions, keyword density, section checks | Isolate in `modules/ats/domain/evaluator.ts` |
| `apps/api-node/src/modules/jobs/jobs.controller.ts` | **1,028** | Search, matching, trust scoring, scraping trigger, saved jobs | Split controller from ingestion trigger |
| `apps/web/src/pages/ResumeStudio/components/ExtractionReviewModal.tsx` | **993** | Resume parsing verification & correction modal | Move to `features/resume/components/` |
| `apps/web/src/pages/ResumeStudio/components/AtsTemplateGeneratorWorkspace.tsx` | **985** | ATS preview & template builder UI | Move to `features/ats/components/` |
| `apps/api-node/src/integrations/linkedin/linkedin.adapter.ts` | **853** | Direct LinkedIn scraping / session interaction | Relocate to `services/linkedin-skills/adapter/` |
| `apps/web/src/pages/ProfilePage.tsx` | **835** | User profile, preferences, skills, resumes | Move to `features/profile/` |
| `apps/api-node/src/modules/resume/imported-docx/imported-docx.controller.ts` | **821** | DOCX upload, XML manipulation, visual layout save | Relocate to `services/document-processing/` |
| `apps/web/src/hooks/useInterviewRoom.ts` | **789** | Media streams, STT/TTS coordination, turn-taking | Refactor inside `features/interview/hooks/` |
| `apps/web/src/pages/ResumeStudio/components/DocxXeroxWorkspace.tsx` | **786** | DOCX editor workspace with SuperDoc engine | Relocate inside `features/resume/components/` |
| `apps/api-node/src/modules/interview/interview.controller.ts` | **739** | Session lifecycle, answer submission, state transitions | Keep inside `modules/interview/presentation/` |
| `apps/api-node/src/modules/linkedin/linkedin.model.ts` | **734** | LinkedIn post, outreach, connections schema | Move to `modules/linkedin/domain/` |
| `apps/web/src/pages/ImportedDocxEditorPage.tsx` | **721** | Standalone visual DOCX editor | Relocate to `features/resume/pages/` |
| `apps/web/src/pages/LinkedIn/tabs/ContentStudioTab.tsx` | **635** | LinkedIn content writer tab | Move to `features/linkedin/` |
| `apps/web/src/pages/LinkedInPage.tsx` | **628** | LinkedIn outreach workspace page | Move to `features/linkedin/` |
| `apps/api-node/src/modules/resume/docx-engine/docx.engine.ts` | **623** | OOXML parser, paragraph styling, layout preservation | Move to `services/document-processing/docx/` |
| `apps/api-node/src/modules/resume/resume.parser.ts` | **592** | Multi-format PDF / DOCX text extraction | Move to `services/document-processing/parser/` |
| `apps/web/src/pages/InterviewRoomPage.tsx` | **554** | Live interview room UI | Move to `features/interview/pages/` |
| `apps/web/src/pages/ResumeStudio/components/optimize/ATSScannerWorkspace.tsx` | **549** | Realtime ATS audit dashboard | Move to `features/ats/components/` |
| `apps/api-node/src/modules/resume/resume.generator.ts` | **545** | Deterministic resume rendering engine | Move to `services/document-processing/generator/` |
| `apps/api-node/src/modules/resume/resume.ats.ts` | **524** | ATS score calculation & recommendations | Move to `modules/ats/application/` |

---

## 4. Cross-Domain Dependencies & Coupling

The audit identified **76 cross-domain imports** in the backend API.
Key coupling hubs:

1. **`analytics` Module**:
   - Imports `JobApplication` from `../applications/applications.model`
   - Imports `Job` from `../jobs/jobs.model`
   - Imports `InterviewSession` from `../interview/interview.model`
   - Imports `FollowUpTask` from `../outreach/followup.model`
   - Imports `InterviewWeakness` from `../interview-debrief/debrief.model`
   *Issue*: `analytics` directly queries models of 5 other domains, causing tight schema coupling.
   *Resolution*: Centralize database schemas or define domain-level read contracts / events.

2. **`applications` Module**:
   - Imports `Job` from `../jobs/jobs.model`
   - Imports `IProfile` from `../profile/profile.model`
   - Imports `ResumeTailoringRun` from `../resume/tailoring/tailoring.model`
   *Issue*: Applications domain is coupled to Resume tailoring implementation details.

3. **`pipeline` (Auto Pipeline) Module**:
   - Imports `Job` from `../jobs/jobs.model`
   - Imports `JobApplication` from `../applications/applications.model`
   - Imports `Profile` from `../profile/profile.model`

4. **`jobs` Module**:
   - Ingestion adapters (`greenhouse`, `lever`, `ashby`, `jobspy`, `naukri`, `internshala`) are bundled directly inside `apps/api-node/src/modules/jobs/ingestion/`.
   - Any failure or dependency update in an external scraper touches core job search domain logic.

---

## 5. Duplicate Functionality & Dead Code

1. **Duplicate Interfaces**:
   - `apps/api-node/src/ai/core/provider.interface.ts` vs `apps/api-node/src/ai/providers/provider.interface.ts`.
2. **Duplicate LinkedIn Adapters**:
   - `apps/api-node/src/integrations/linkedin/linkedin.adapter.ts` (853 lines) vs `apps/api-node/src/modules/jobs/ingestion/adapters/linkedin.adapter.ts` (124 lines).
3. **Duplicate Resume Editor Components in Frontend**:
   - `ResumeStudio/Builder/LeftSidebar/EducationEditor.tsx` vs `ResumeStudio/components/editors/EducationEditor.tsx`
   - `ResumeStudio/Builder/LeftSidebar/ExperienceEditor.tsx` vs `ResumeStudio/components/editors/ExperienceEditor.tsx`
   - `ResumeStudio/Builder/LeftSidebar/ProjectsEditor.tsx` vs `ResumeStudio/components/editors/ProjectsEditor.tsx`
   - `ResumeStudio/Builder/LeftSidebar/SkillsEditor.tsx` vs `ResumeStudio/components/editors/SkillsEditor.tsx`
   - `ResumeStudio/Builder/LeftSidebar/SummaryEditor.tsx` vs `ResumeStudio/components/editors/SummaryEditor.tsx`
   - `ResumeStudio/components/TemplateGallery.tsx` vs `ResumeStudio/components/templates/TemplateGallery.tsx`
4. **Empty Directories & Scratch**:
   - `apps/api-node/src/jobs-engine/` (Empty directory)
   - `apps/api-node/scratch/` & root `scratch/` (Temporary scripts)
   - `apps/api-node/cutshort_dom.html`, `debug.docx`, `debug_pdf.ts` (Debug artifacts)

---

## 6. Infrastructure & AI Coupling

1. **AI Provider Coupling**:
   - While `AIRouter` and `AIService` exist in `apps/api-node/src/ai/`, some engines directly import prompt definitions and provider interfaces without uniform dependency injection.
   - Target: Isolate AI into `services/ai` with clean contracts.
2. **Worker & Realtime Logic Coupled to API Process**:
   - BullMQ queue definitions (`resume.queue.ts`) and ingestion schedulers (`scheduler.ts`) run inside the Fastify API process.
   - WebSockets (`fastifyWebsocket`) run in the main API server.
   - High traffic on AI evaluation or DOCX generation competes for event-loop cycles with HTTP traffic.
3. **Database Bootstrap**:
   - `apps/api-node/src/db/mongo.ts` directly binds to Mongoose without connection pooling tuning or isolated migration scripts.

---

## 7. Migration Risks & Mitigation Strategy

| Risk Factor | Impact | Severity | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Broken Relative Imports** | Compilation failure across 527 TypeScript files | **HIGH** | Use workspace package aliases (`@interview-ai/*`) and incremental step validation. |
| **Lost Git History** | Inability to track changes or blame lines | **MEDIUM** | Use `git mv` for file relocation where feasible. |
| **Database Schema Incompatibility** | Production data disruption | **CRITICAL** | Preserve all existing Mongoose schema fields, collections, and indexes with zero schema breaking changes. |
| **API Route Regressions** | Frontend breaks due to altered route paths | **CRITICAL** | Maintain 100% route contract parity: all `/api/*` endpoints retain exact prefixes, parameters, and bodies. |
| **Build & Tooling Breakage** | Inability to run tests or deploy | **HIGH** | Configure root workspaces with non-breaking NPM/Turbo support; run Vitest after every incremental phase. |
| **Frontend State Desynchronization** | Broken Resume Studio or Mock Interview room | **HIGH** | Keep Zustand stores and hook interfaces intact while reorganizing into domain features. |

---

## 8. Migration Phase Roadmap

- **Phase 1**: Forensic Audit *(Complete — this document)*
- **Phase 2**: Target Monorepo Architecture Definition & Root Workspace Initialization
- **Phase 3-4**: Shared Packages (`packages/*`) creation (contracts, types, api-client, ui, logger)
- **Phase 5-6**: Backend Application Migration (`apps/api-node` → `apps/api`) & Domain Isolation
- **Phase 7-10**: Service Extraction (`services/ai`, `services/job-ingestion`, `services/document-processing`, `services/linkedin-skills`)
- **Phase 11-12**: Worker & Realtime Application Isolation (`apps/worker`, `apps/realtime`)
- **Phase 13-14**: Frontend Modularization (`apps/web/src/features/*`)
- **Phase 15-18**: Shared Config, Database, Security & Infrastructure
- **Phase 19-22**: Dependency Rules, Aliases, Build & Test Verification
