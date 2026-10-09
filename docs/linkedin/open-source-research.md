# Open-Source Research & Architectural Assessment

**Document Date:** October 2026  
**Status:** COMPLETE AUDIT & EVALUATION  
**Focus:** In-depth evaluation of open-source LinkedIn marketing, scraping, planning, and optimization projects for integration into Interview AI.

---

## 1. Primary Evaluated Projects

### A. sergebulaev/linkedin-skills
- **Repository:** `sergebulaev/linkedin-skills`
- **Purpose:** 12 production-grade skills for LinkedIn post writing, hook extraction, comment drafting, humanization, profile optimization, employee advocacy, and interviewer turns.
- **License:** MIT License (Copyright 2026 Sergey Bulaev)
- **Architecture:** Markdown-first skill definitions (`skills/*/SKILL.md`) with frontmatter metadata, accompanied by Python utility libraries (`lib/url_parser.py`, `lib/backend_selector.py`, `lib/apify_client.py`, `lib/publora_client.py`, `lib/approval.py`).
- **Useful Components:**
  - 4-pass stylometry humanization pipeline (Scrub, Rhythm, Add, Self-Check).
  - 18 high-performing 2026 hook formulas (F1 to F18) with empirically verified multiplier metrics.
  - Multi-tiered comment and reply angles (Insight, Counterpoint, Question, Experience, Support).
  - Strict approval policy enforcing user consent before publication.
  - Python CLI bridge (`scripts/interviewai_bridge.py`) for clean JSON communication.
- **Code Reused:**
  - Dynamic skill discovery algorithm from markdown frontmatter.
  - Hook formula catalogs and stylometry rules.
  - Python CLI execution bridge with UTF-8 support on Windows.
- **Code Adapted:**
  - Integrated into Interview AI's unified AIService and fastify backend.
  - Humanization schemas adapted to TypeScript Zod validation with structured diffs.
- **Code Rejected:**
  - Unauthenticated auto-posting loops or unsolicited direct messaging.
  - Any heuristic that claims to bypass AI detectors.
- **Known Limitations:**
  - Requires valid Apify token for live post reading if public fallback fails.
  - CLI bridge requires local Python 3.10+ runtime.
- **Integration Decision:** **ACCEPTED (PRIMARY CORE)** — Fully integrated for content creation, humanization, hook extraction, and approval workflows.

---

### B. theonaai/linkedin-content-planner-mcp
- **Repository:** `theonaai/linkedin-content-planner-mcp`
- **Purpose:** Model Context Protocol (MCP) server for scheduling, managing, and planning LinkedIn posts across individual profiles and company pages.
- **License:** MIT
- **Architecture:** Clean REST/MCP tool separation, calendar scheduling state machine, multi-tenant draft workflow.
- **Useful Components:**
  - Post status lifecycle: `DRAFT` → `AI_REVIEW` → `USER_REVIEW` → `APPROVED` → `SCHEDULED` → `PUBLISHING` → `PUBLISHED` (with `PUBLISH_FAILED` retry).
  - Day, week, and month calendar views with pillar balancing.
- **Code Reused / Adapted:**
  - State machine lifecycle transition rules.
  - Strategic content calendar generation logic (balancing technical depth, career journey, learning, and industry insights).
- **Code Rejected:**
  - Standalone MCP server transport (integrated directly into Fastify HTTP REST API for lower latency and unified MongoDB persistence).
- **Integration Decision:** **ADAPTED** — Concepts adapted into Interview AI calendar domain.

---

### C. johnisanerd/Apify-LinkedIn-Posts-API (johnvc)
- **Repository:** `johnisanerd/Apify-LinkedIn-Posts-API` / Apify Actor
- **Purpose:** Extract public LinkedIn posts, reactions, comments, and shares into structured JSON without requiring private user credentials.
- **License:** Apache-2.0 / MIT compatible
- **Architecture:** Cloud actor running browser automation with structured JSON schema output.
- **Useful Components:**
  - Normalized post object structure (id, urn, text, author, engagementMetrics, publishedAt, mediaUrls).
  - Bounded pagination and rate-limit backoff handling.
- **Code Adapted:**
  - Normalized schema mappings in `services/linkedin/normalization/post.normalizer.ts`.
- **Known Limitations:**
  - Rate limits on public Apify runs without private tokens; requires graceful fallback to manual input or direct public extraction.
- **Integration Decision:** **ADAPTED** — Used for structured post schema normalization.

---

### D. Playwright & Puppeteer Headless LinkedIn Scrapers
- **Repositories Analyzed:** `yagyeshVyas/linkedin-scraper`, `pstav90/linkedin-playwright`, `puppeteer-extra-plugin-stealth`.
- **Purpose:** Extract public profile sections (Headline, About, Experience, Education, Skills) and public job postings.
- **License:** MIT
- **Architecture:** Browser instance pool, Chromium page context recycling, schema.org / JSON-LD extraction, DOM parsing with Cheerio.
- **Useful Components:**
  - Dedicated browser singleton service preventing process explosion.
  - Primary extraction from `<script type="application/ld+json">` Person and JobPosting schemas before falling back to DOM selectors.
  - OpenGraph meta tags fallback (`og:title`, `og:description`).
- **Code Adapted:**
  - Implemented in `services/linkedin/providers/playwright/browser.service.ts` with bounded concurrency (max 2 parallel pages) and strict timeouts.
- **Code Rejected:**
  - Stealth fingerprint evasion intended to defeat security controls.
  - CAPTCHA bypass plugins.
  - Session cookie (`li_at`) hijacking.
- **Integration Decision:** **ADAPTED (CORE BROWSER SERVICE)** — Clean, compliant public browser provider.

---

## 2. Reddit & Real-World Failure Mode Synthesis

Analysis of developer discussions (r/webscraping, r/playwright, r/node) reveals key production failure modes:

1. **DOM Class Obfuscation:** LinkedIn updates class names (`.update-components-actor__title`) frequently.
   - *Defense:* Prioritize semantic JSON-LD (`application/ld+json`), OpenGraph metadata, and resilient text matching over obfuscated CSS classes.
2. **Authwalls & Captchas:** Public profile requests from cloud/datacenter IP ranges frequently hit authwalls.
   - *Defense:* Transparent error reporting (`AUTH_WALL_ENCOUNTERED`). Offer instant one-click manual paste or profile JSON upload so the user is never blocked.
3. **Process Leaks:** Launching a new Chromium browser per request causes memory leaks and server crashes.
   - *Defense:* Browser singleton pool with strict page closing in `finally` blocks and process lifecycle cleanup on SIGINT/SIGTERM.
4. **Data Hallucination:** Systems often fallback to placeholder fake data when parsing yields empty fields.
   - *Defense:* Strict prohibition of fake data. If an attribute cannot be found, mark its status as `MISSING` or `UNKNOWN` with zero synthetic scores.

---

## 3. License Compatibility Matrix

| Project | License | Compatible with Interview AI (MIT)? | Attribution Required? |
|---|---|---|---|
| `sergebulaev/linkedin-skills` | MIT | **Yes** | Yes (Preserved in docs & source) |
| `theonaai/linkedin-content-planner-mcp` | MIT | **Yes** | Yes |
| `johnisanerd/Apify-LinkedIn-Posts-API` | MIT / Apache-2.0 | **Yes** | Yes |
| `yagyeshVyas/linkedin-scraper` | MIT | **Yes** | Yes |
| `cheerio` / `puppeteer` | MIT / Apache-2.0 | **Yes** | Yes |

All adopted projects use permissive MIT or Apache-2.0 licenses fully compatible with Interview AI.
