# INTERVIEW AI — MASTER REPOSITORY ARCHITECTURE & DEVELOPMENT RULES

This document defines the mandatory architecture, engineering standards, and development rules for the Interview AI production codebase.

From this point forward, the repository architecture below is mandatory.
Do NOT create files, folders, services, APIs, components, or duplicated business logic randomly.
Before changing code, inspect the existing repository and understand the current architecture.

==================================================
1. CORE ARCHITECTURE
==================================================

This is a production-grade monorepo.

The repository follows:
- Feature-oriented architecture
- Domain-driven backend modules
- Feature-oriented React frontend
- Shared contracts/packages
- Isolated external open-source integrations
- Centralized AI provider architecture
- Centralized authentication/security
- Centralized observability
- Testable boundaries
- Immutable/versioned important artifacts

Target structure:
```
interview-ai/
│
├── apps/
│   ├── web/
│   └── api/
│
├── services/
│   ├── agent-reach/
│   ├── jobspy-sidecar/
│   ├── linkedin-skills/
│   └── document-intelligence/
│
├── packages/
│   ├── shared-types/
│   ├── validation/
│   ├── ai-contracts/
│   ├── ui/
│   └── utils/
│
├── infrastructure/
│
├── tests/
│   ├── e2e/
│   ├── integration/
│   ├── performance/
│   └── fixtures/
│
├── docs/
│   ├── architecture/
│   ├── features/
│   ├── api/
│   ├── security/
│   ├── testing/
│   ├── performance/
│   ├── deployment/
│   └── roadmap/
│
├── scripts/
│
├── .github/
│   └── workflows/
│
├── .env.example
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── README.md
└── SECURITY.md
```

==================================================
2. FIRST RULE — INSPECT BEFORE MODIFYING
==================================================

Before implementing ANY feature:
1. Inspect the existing repository.
2. Identify the existing implementation.
3. Search for related files/classes/functions/routes/models/components.
4. Determine whether the requested functionality already exists.
5. Reuse existing abstractions whenever possible.
6. Do not create duplicate implementations.
7. Do not replace working production functionality without evidence.
8. Identify dependencies and consumers before moving or deleting anything.
9. Check existing tests before modifying behavior.
10. Produce a short architecture impact assessment before large changes.

Never assume the repository is empty.
Never create a second version of an existing system simply because it is easier.

==================================================
3. BACKEND ARCHITECTURE
==================================================

Backend lives under:
`apps/api/` (or `apps/api-node/`)

Backend business domains live under:
`apps/api/src/modules/`

Use feature/domain modules.

Required pattern:
```
modules/
├── auth/
├── candidate/
├── jobs/
├── matching/
├── resume/
├── ats/
├── tailoring/
├── applications/
├── pipeline/
├── interview/
├── linkedin/
├── outreach/
└── analytics/
```

Each domain owns its business logic.

Example:
```
modules/resume/
├── resume.controller.ts
├── resume.service.ts
├── resume.repository.ts
├── resume.model.ts
├── resume.routes.ts
├── resume.schema.ts
├── resume.types.ts
├── resume.mapper.ts
├── resume.constants.ts
└── index.ts
```

Do not create a global:
`controllers/`
`services/`
`models/`
structure for new business features.

New domain functionality belongs inside the appropriate domain module.

==================================================
4. FRONTEND ARCHITECTURE
==================================================

Frontend lives under:
`apps/web/`

Feature functionality belongs under:
`apps/web/src/features/` (or `apps/web/src/pages/<Feature>/`)

Example:
```
features/
├── jobs/
├── resume/
├── ats/
├── tailoring/
├── applications/
├── pipeline/
├── interview/
├── linkedin/
├── outreach/
└── analytics/
```

A feature may contain:
```
<feature>/
├── components/
├── hooks/
├── api/
├── types/
├── utils/
├── stores/
└── index.ts
```

Shared UI components belong under:
`apps/web/src/components/`

Do NOT put feature-specific business components into global components.
Use global components only when genuinely reusable.

==================================================
5. SHARED PACKAGES
==================================================

Reusable contracts belong under:
`packages/`

Use:
- `packages/shared-types/`
- `packages/validation/`
- `packages/ai-contracts/`
- `packages/ui/`
- `packages/utils/`

Do not duplicate:
- TypeScript types
- Zod schemas
- API contracts
- validation rules
- reusable utilities
across frontend and backend when they should be shared.
If a contract is genuinely shared, place it in the appropriate package.

==================================================
6. AI ARCHITECTURE
==================================================

AI providers MUST NOT be called directly from feature business logic.

Never do:
resume.service.ts → Groq API
linkedin.service.ts → Qwen API
interview.service.ts → provider API

Instead use the centralized AI architecture:
```
apps/api/src/ai/
├── core/
├── providers/
├── reliability/
├── prompts/
└── schemas/
```

All AI calls must go through:
```
AIService
    ↓
AIRouter
    ↓
Provider abstraction
    ↓
Qwen / Groq / FakeAI / future provider
```

Use task-based routing:
- `RESUME_ANALYSIS`
- `RESUME_TAILORING`
- `LINKEDIN_PROFILE_ANALYSIS`
- `INTERVIEW_QUESTION_GENERATION`
- `INTERVIEW_EVALUATION`
- `APPLICATION_ANSWER_GENERATION`

Do not introduce a new direct LLM client inside a feature module.

==================================================
7. EXTERNAL OPEN-SOURCE PROJECTS
==================================================

External repositories MUST remain isolated:
- `services/agent-reach/`
- `services/jobspy-sidecar/`
- `services/linkedin-skills/`
- `services/document-intelligence/`

Do NOT dump third-party source code into:
- `apps/api/src/`
- `apps/web/src/`

Use an adapter boundary:
```
Application
    ↓
Internal Adapter
    ↓
External Service
    ↓
Third-party project
```

Example:
```
JobService → JobSourceRegistry → JobSpyAdapter → JobSpy sidecar
LinkedInService → LinkedInProvider → AgentReachAdapter → Agent-Reach
```

==================================================
8. ADAPTER RULE
==================================================

External providers must be hidden behind interfaces/adapters.
Never couple core business logic directly to one external provider.

Example:
```
JobSourceAdapter
├── GreenhouseAdapter
├── LeverAdapter
├── AshbyAdapter
├── JobSpyAdapter
└── AgentReachAdapter

LinkedInProvider
├── OfficialLinkedInProvider
├── ApifyProvider
├── PubloraProvider
└── ManualProvider
```
The application should depend on the interface, not the provider implementation.

==================================================
9. DATABASE ARCHITECTURE
==================================================

MongoDB collections represent durable business entities:
- `users`
- `candidate_profiles`
- `resume_documents`
- `resume_versions`
- `resume_artifacts`
- `resume_imports`
- `jobs`
- `job_snapshots`
- `job_sources`
- `job_ingestion_runs`
- `match_results`
- `trust_results`
- `tailoring_runs`
- `applications`
- `application_events`
- `application_answers`
- `pipeline_runs`
- `interviews`
- `interview_questions`
- `interview_answers`
- `interview_debriefs`
- `interview_intelligence`
- `stories`
- `story_matches`
- `interview_weaknesses`
- `linkedin_profiles`
- `linkedin_profile_versions`
- `linkedin_analysis`
- `linkedin_content`
- `linkedin_activities`
- `career_contacts`
- `follow_up_tasks`
- `communication_activities`
- `analytics_snapshots`
- `career_gaps`
- `ai_runs`
- `audit_logs`

Do not create a database collection for every UI component.
Prefer durable domain entities.

==================================================
10. DATA OWNERSHIP
==================================================

Every important entity must have a clear owner:
- Resume → Resume module
- Job → Jobs module
- Match → Matching module
- Interview → Interview module
- LinkedIn profile → LinkedIn module
- Analytics → Analytics module

Do not allow unrelated modules to directly mutate another module's database state.
Use services/repositories/events/contracts where appropriate.

==================================================
11. VERSIONING & IMMUTABILITY
==================================================

Important user artifacts must be versioned:
- Resume versions
- Tailoring runs
- Job snapshots
- Interview results
- LinkedIn analysis snapshots
- Application events

Never silently overwrite important historical data.
When generating a new artifact:
```
Original → Immutable → New version/artifact
```
Maintain provenance wherever the system transforms user data.

==================================================
12. SECURITY
==================================================

Every new endpoint must consider:
- authentication
- authorization
- IDOR protection
- input validation
- Zod validation
- rate limiting where appropriate
- SSRF protection
- file validation
- path traversal
- secret handling
- prompt injection
- external-content trust boundaries
- sensitive-data exposure
- audit logging

Never expose secrets to the frontend.
Never put server secrets in `VITE_*` variables.
Never store credentials/cookies/session tokens from third-party platforms unless explicitly required and legally supported.
Never bypass:
- CAPTCHA
- authentication walls
- access controls
- security controls
- platform restrictions

==================================================
13. TESTING
==================================================

Every feature must include appropriate tests.
Use:
- Unit tests
- Integration tests
- API tests
- E2E tests
- Performance tests when relevant

Tests should live in appropriate locations:
```
tests/
├── e2e/
├── integration/
├── performance/
└── fixtures/
```
Feature-specific tests may also live beside the implementation where appropriate.
Do not consider a feature complete merely because TypeScript compiles.

Minimum completion requirements:
- typecheck
- unit tests
- integration tests where applicable
- E2E for critical user flows
- production build
- security checks
- regression checks

==================================================
14. DOCUMENTATION
==================================================

Every major feature must have documentation under `docs/features/<feature>/` (e.g. `architecture.md`, `data-model.md`, `api.md`, `providers.md`, `security.md`, `testing.md`, `completion-report.md`).
Also update `docs/architecture/` when the change affects system architecture.

==================================================
15. FEATURE IMPLEMENTATION FLOW
==================================================

For EVERY new feature, follow this exact order:
- STEP 1: Understand the requirement.
- STEP 2: Audit the existing repository.
- STEP 3: Search for existing implementations.
- STEP 4: Identify reusable code.
- STEP 5: Research relevant open-source implementations when useful.
- STEP 6: Design the architecture.
- STEP 7: Define/modify data models.
- STEP 8: Define API contracts and validation.
- STEP 9: Implement backend domain logic.
- STEP 10: Implement external adapters/providers if required.
- STEP 11: Implement frontend feature.
- STEP 12: Connect frontend → API → domain → provider.
- STEP 13: Add error/loading/empty/retry states.
- STEP 14: Add security protections.
- STEP 15: Add tests.
- STEP 16: Run typecheck/build/tests.
- STEP 17: Run E2E for critical flows.
- STEP 18: Update documentation.
- STEP 19: Review architecture for duplication/debt.
- STEP 20: Provide a completion report.

==================================================
16. NO DUPLICATION RULE
==================================================

Before creating any new service, controller, hook, component, model, schema, provider, utility, API route, or state machine:
Search the repository first.
If an existing implementation exists:
REUSE → EXTEND → REFACTOR
Do not:
DUPLICATE → PATCH → CREATE ANOTHER VERSION

==================================================
17. UI ARCHITECTURE
==================================================

The UI must follow the existing Interview AI design system:
- Clean SaaS layout
- Generous whitespace
- Responsive design
- Accessible components
- Reusable UI primitives
- Progressive disclosure
- Clear loading states, empty states, error states, and success states
Do not create giant monolithic pages. If a page becomes too large, split it into feature components. Avoid putting hundreds of lines of business logic directly inside page components.

==================================================
18. API ARCHITECTURE
==================================================

API flow:
Route → Authentication → Validation → Controller → Domain Service → Repository / Provider → Database / External Service.
Do not put large business logic inside route definitions.
Do not allow controllers to become giant business-logic files.

==================================================
19. BACKGROUND JOBS
==================================================

Long-running operations must not block HTTP requests:
- Job ingestion
- AI batch processing
- Resume parsing
- Document processing
- Analytics
- Follow-up scheduling
- Pipeline execution
Use the existing queue/scheduler architecture.

==================================================
20. REAL DATA ONLY
==================================================

Do not use fake/mock/demo data in production functionality.
Mocks are allowed ONLY for:
- tests
- local development
- isolated provider testing
Do not make the UI appear functional using hardcoded data. Every production feature must connect to the real backend/data source.

==================================================
21. EXTERNAL SOURCE RULE
==================================================

For job boards, LinkedIn, ATS systems, APIs, and external services:
- Use supported/public/authorized interfaces
- Respect platform restrictions
- Use adapters
- Track source, freshness, and failures
- Never silently replace one source with another
- Never label one source as another
- Never fabricate external data
If a provider is unavailable: mark it unavailable/restricted. Do NOT silently return data from another provider and claim it came from the requested provider.

==================================================
22. GIT RULES
==================================================

Use meaningful commits (conventional commits format):
- `feat(resume): ...`
- `feat(linkedin): ...`
- `feat(jobs): ...`
- `fix(interview): ...`
- `docs(architecture): ...`

Do NOT commit:
- `.env`
- API keys, passwords, tokens, cookies
- Generated secrets
- Temporary files
- Build artifacts

==================================================
23. BEFORE COMPLETING ANY TASK CHECKLIST
==================================================

[ ] Existing architecture inspected
[ ] Existing implementation searched
[ ] No duplicate implementation created
[ ] Correct domain module used
[ ] Correct frontend feature folder used
[ ] External repositories isolated
[ ] Provider abstraction respected
[ ] Shared contracts reused
[ ] Database ownership respected
[ ] Authentication/authorization checked
[ ] Validation added
[ ] Security checked
[ ] Tests added/updated
[ ] Typecheck passes
[ ] Build passes
[ ] Relevant E2E passes
[ ] Documentation updated
[ ] No secrets committed
[ ] No fake production data
[ ] No undocumented architectural shortcut

==================================================
24. WHEN I GIVE YOU A NEW FEATURE
==================================================

Respond with:
1. EXISTING IMPLEMENTATION FOUND
2. FILES THAT WILL BE REUSED
3. FILES THAT MUST CHANGE
4. NEW FILES REQUIRED
5. DATA MODEL IMPACT
6. API IMPACT
7. FRONTEND IMPACT
8. EXTERNAL INTEGRATION IMPACT
9. TEST IMPACT
10. SECURITY IMPACT
11. DOCUMENTATION IMPACT

Then implement the feature.

==================================================
25. MOST IMPORTANT PRINCIPLE
==================================================

The repository must remain understandable to another senior engineer.
Every architectural decision should answer:
"Where would another developer naturally expect this code to live?"
If the answer is unclear, stop and inspect the architecture before creating the file.
Optimize for:
CORRECTNESS, MAINTAINABILITY, REUSABILITY, TESTABILITY, SECURITY, OBSERVABILITY, PRODUCTION RELIABILITY.
The architecture is a constraint, not a suggestion.
