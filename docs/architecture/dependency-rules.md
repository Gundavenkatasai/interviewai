# Interview AI — Architecture Dependency Rules & Boundaries
**Mandatory Monorepo Architectural Boundary Specification**  
*Date: 2026-10-01* | *System: Interview AI Production Architecture*

---

## 1. Principles of Architecture

To ensure Interview AI scales cleanly to 1,000+ concurrent users, background worker pipelines, real-time interviews, and multi-tenant integrations, strict directional dependency rules are enforced across the workspace.

```
+-----------------------------------------------------------+
|                        apps/web                           |
+-----------------------------------------------------------+
          |                             |
          v                             v
+-----------------------+     +-----------------------+
|  packages/api-client  |     |      packages/ui      |
+-----------------------+     +-----------------------+
          |
          v
+-----------------------+     +-----------------------+
|   packages/contracts  | <---|      packages/types   |
+-----------------------+     +-----------------------+
          ^
          |
+-----------------------------------------------------------+
|                        apps/api                           |
|   (Presentation -> Application -> Domain -> Infra)       |
+-----------------------------------------------------------+
          |               |                 |
          v               v                 v
+----------------+  +--------------+  +---------------------+
|  services/ai   |  | services/    |  | services/document-  |
|                |  | job-ingestion|  | processing          |
+----------------+  +--------------+  +---------------------+
          ^               ^                 ^
          |               |                 |
+-----------------------------------------------------------+
|                       apps/worker                         |
+-----------------------------------------------------------+
```

---

## 2. Allowed Dependency Matrix

| From (Caller) | Allowed Dependencies (Callee) |
| :--- | :--- |
| **`apps/web`** | `packages/ui`, `packages/api-client`, `packages/contracts`, `packages/types` |
| **`apps/api`** | `packages/contracts`, `packages/types`, `packages/validation`, `packages/logger`, `packages/config`, `services/*` |
| **`apps/worker`** | `apps/api` (Domain/Application services only), `packages/contracts`, `packages/logger`, `services/*` |
| **`apps/realtime`** | `packages/contracts`, `packages/types`, `packages/logger`, `apps/api` (Domain session validator) |
| **`services/ai`** | `packages/types`, `packages/logger`, external AI SDKs (Groq, OpenAI, Ollama) |
| **`services/job-ingestion`**| `packages/types`, `packages/logger`, `packages/validation`, external job boards |
| **`services/document-processing`** | `packages/types`, `packages/logger`, OOXML/PDF engines (`docx`, `pdf-lib`, `mammoth`) |
| **`packages/api-client`** | `packages/contracts`, `packages/types`, `axios` or standard `fetch` |
| **`packages/contracts`** | `packages/types`, `zod` |
| **`packages/ui`** | `packages/types`, `react`, `lucide-react`, `tailwind` utilities |

---

## 3. Strictly Forbidden Dependencies

Violations of these rules represent architectural regressions and will fail automated CI checks:

1. **`apps/web` -> Database / Server Internals**:
   - `apps/web` MUST NOT import `mongoose`, `mongodb`, Fastify plugins, or server database models.
   - `apps/web` MUST communicate exclusively through `packages/api-client` and standard HTTP / WebSocket endpoints.
2. **`apps/web` -> Direct AI Provider Calls**:
   - `apps/web` MUST NOT import Groq, OpenAI, or LLM SDKs. No API keys or server secrets in client bundles.
3. **Domain Layer -> Presentation / HTTP Controllers**:
   - Domain entities, value objects, and application use-cases MUST NOT import Fastify, express, or HTTP request/reply objects.
4. **Domain Layer -> Database Implementation Details**:
   - Core domain algorithms (e.g. ATS scoring rules, interview turn state transitions) MUST NOT be coupled directly to Mongoose queries; they operate on plain domain entities.
5. **AI Providers -> HTTP Controllers**:
   - AI routing and prompt formatting must never depend on HTTP controllers.
6. **External Scrapers -> Frontend / Core Domain**:
   - Job scrapers and sidecar processes MUST NOT leak scraper details (DOM selectors, Puppeteer handles) into search and matching domain logic.
7. **`apps/worker` -> `apps/web`**:
   - Background workers must never depend on UI code.
8. **Circular Dependencies**:
   - No circular imports across domains (`domain A -> domain B -> domain A`). Cross-domain communication must occur through shared contracts, read models, or event dispatchers.

---

## 4. Internal Domain Layering (Clean Domain-Driven Boundaries)

Inside `apps/api/src/modules/<domain>`:

```
domain-name/
├── domain/            # Entities, Enums, Value Objects, Domain Policies (NO external dependencies)
├── application/       # Use-cases, Orchestration Services, Command/Query handlers
├── infrastructure/    # Mongoose Models, Database Repositories, External Adapters
├── presentation/      # Fastify Routes, HTTP Controllers, DTO Serialization
├── schemas/           # Strict Zod Validation Schemas
└── tests/             # Domain Unit & Integration Tests
```

---

## 5. Shared Package Isolation Rules

1. `packages/ui` contains purely presentation components (Buttons, Modals, Cards, Badges, Tables, Score Rings). It contains ZERO business logic or domain data models.
2. `packages/contracts` contains authoritative Zod schemas for all network requests, responses, and events.
3. `packages/types` contains shared TypeScript interfaces that cross application boundaries.
4. `packages/logger` contains structured, redaction-safe logging.
5. `packages/validation` contains reusable sanitization and validation utilities.
