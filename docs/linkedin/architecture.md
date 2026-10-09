# LinkedIn Career Intelligence & Content Workspace: Architecture

## 1. System Overview
The rebuilt LinkedIn Workspace within Interview AI (`interview-ai-monorepo`) provides an open-source-first, scraping-first, verified career and content intelligence platform. The architecture eliminates fragile legacy screens, mock arrays, and fabricated statistics in favor of:

1. **Clean Provider Layer**: Strict separation between data acquisition, normalization, and analytical/AI layers.
2. **Deterministic 14-Section Profile Rubric**: Evaluates public/pasted candidate profiles without hallucinating metrics or fabricating experience.
3. **Natural Humanizer & Content Studio**: 4-pass stylometry engine adapted from `sergebulaev/linkedin-skills` and 2026 algorithmic reach patterns.
4. **Verified Career Integration**: Direct coupling with core `Job` and `Resume` models in MongoDB, allowing candidate profile alignment, interview practice turn generation, and 1-click job pipeline ingestion.
5. **Strict Safety Protocol**: Never executes automated publishing or updates profile records without explicit user confirmation.

---

## 2. Directory & Component Structure

### Core Domain & Infrastructure (`apps/api-node/src/modules/linkedin/` & `services/linkedin/`)
```
modules/linkedin/
├── domain/
│   ├── provider.interface.ts   # Normalized data contracts, provenance & capability registry types
│   ├── errors.ts               # AuthWallError, RateLimitError, InvalidUrlError, CircuitBreakerOpenError
│   ├── profile.scorer.ts       # 14-section rubric with deterministic scoring and evidence extraction
│   ├── hook.generator.ts       # 9 distinct hook formula styles (curiosity, contrarian, story, etc.)
│   ├── humanizer.ts            # 4-pass stylometry humanizer (scrub, rhythm, add, self-check)
│   └── post.analyzer.ts        # Algorithmic readability, hook score, and technical depth engine
├── infrastructure/
│   ├── capability.registry.ts  # Capability discovery & assertion
│   ├── provider.registry.ts    # Circuit breaker (5 failure threshold), rolling latency, registry
│   ├── snapshot.cache.ts       # LRU store with in-flight request deduplication
│   ├── url.normalizer.ts       # SSRF protection, blocked host filter, canonical URL builder
│   ├── content.hasher.ts       # SHA-256 content fingerprinting
│   ├── profile.normalizer.ts   # HTML stripping, prompt-injection redaction, experience sanitizer
│   ├── post.normalizer.ts      # Structured post parser
│   ├── job.normalizer.ts       # Maps 1-to-1 to core platform Job model
│   └── providers/
│       ├── public/             # Cheerio HTTP guest scraper (fast, zero credentials)
│       ├── playwright/         # Resource-bounded browser automation (max 2 concurrency)
│       ├── manual/             # Air-gapped paste provider
│       └── imported/           # Archive JSON data importer
├── application/
│   └── linkedin.service.ts     # Orchestration of profile, content, calendar, and analytics
├── linkedin.controller.ts      # Fastify request validation & response handling
├── linkedin.routes.ts          # Registered endpoints under /api/linkedin/*
└── linkedin.model.ts           # Mongoose schemas with indexes and unique constraints
```

### Frontend Workspace (`apps/web/src/pages/LinkedIn/`)
```
pages/LinkedIn/
├── LinkedInWorkspacePage.tsx   # SaaS workspace shell with provenance headers
└── tabs/
    ├── OverviewTab.tsx         # Real profile health, issues list, and content metrics
    ├── ProfileAnalyzerTab.tsx  # Full 14-section inspector with evidence, issues & recommendations
    ├── ProfileOptimizerTab.tsx # Headline options, About before/after diffs, and skill taxonomy
    ├── ContentStudioTab.tsx    # Hook generator, formula selector, 4-pass humanizer, and draft auditor
    ├── ContentCalendarTab.tsx  # Strategic sprint scheduler (Day/Week/Month) with zero mock arrays
    ├── PostsTab.tsx            # Live/queued posts repository with algorithmic quality scores
    ├── EngagementTab.tsx       # Value-add comment & reply drafter (no generic platitudes)
    ├── AudienceTab.tsx         # Strictly observed public commenters & engagers
    ├── AnalyticsTab.tsx        # Snapshot metrics (reactions, comments, shares, frequency)
    ├── ResearchTab.tsx         # Public job & company search with 1-click platform Job save
    ├── StoryBankTab.tsx        # Turn-based conversational interviewer for uninvented story extraction
    ├── ActivityTab.tsx         # Diagnostic audit log and installed skills validation
    └── SettingsTab.tsx         # Unified provider selector & candidate voice profile editor
```

### Background Worker (`apps/worker/src/jobs/linkedin/`)
```
jobs/linkedin/
├── profile/scrape-profile.job.ts
├── posts/extract-posts.job.ts
├── jobs/search-jobs.job.ts
├── analytics/refresh-analytics.job.ts
├── content/publish-content.job.ts
└── index.ts
```

---

## 3. Data Flow & Provenance Lifecycle
Every record originating from an external source enforces the following pipeline:
```
[External URL / HTML / JSON]
         │
         ▼
[1. URL Normalizer & SSRF Check]  ── (Reject private IPs, localhost, metadata IP)
         │
         ▼
[2. Raw Extraction via Provider]  ── (Guest HTTP / Playwright / Manual)
         │
         ▼
[3. Sanitization & Redaction]     ── (Strip HTML tags, redact prompt injection phrases)
         │
         ▼
[4. Deduplication & Hashing]      ── (SHA-256 contentHash, LRU cache check)
         │
         ▼
[5. Normalization]                ── (Map to strict domain interfaces)
         │
         ▼
[6. Provenance Tagging]           ── (provider, retrievedAt, contentHash, providerVersion)
         │
         ▼
[7. Persistence in MongoDB]       ── (LinkedInProfileSnapshot, LinkedInPostSnapshot)
         │
         ▼
[8. Deterministic Scoring / AI]   ── (14 sections, evidence, confidence, recommendations)
```
