# Interview AI — LinkedIn Architecture & Implementation Rebuild Audit

**Document Date:** October 2026  
**Status:** COMPLETE AUDIT  
**Objective:** Thoroughly audit and document the existing LinkedIn implementation, identify architectural flaws, fake data fallbacks, broken features, duplicate implementations, reusable assets, and database/external dependencies to guide the complete LinkedIn production rebuild.

---

## 1. Executive Summary & Audit Findings

The existing LinkedIn implementation in the repository consists of two disparate, overlapping systems created at different times:
1. **Legacy Page (`apps/web/src/pages/LinkedInPage.tsx`)**: A single monolithic React component attempting public scraping via an ad-hoc Agent Reach / Jina endpoint, with simulated progress animations and basic UI tabs.
2. **Workspace Page (`apps/web/src/pages/LinkedIn/LinkedInWorkspacePage.tsx` + `tabs/*`)**: A multi-tab dashboard loosely connected to backend controllers and `services/linkedin-skills`, but riddled with hardcoded mock fallbacks, static scores (e.g., custom URL 90, photo/banner 85), fake engager mock arrays (hardcoded people from Stripe, Datadog, Netflix), fake calendar fallbacks, and a disconnected analytics experience.
3. **Backend Controller & Model (`apps/api-node/src/modules/linkedin/*`)**: Mixed responsibilities containing scraping with fallback data fabrication (e.g., injecting hardcoded skills `["Technical Architecture", "System Design", "Leadership"]` when scraping fails), direct execution of python bridge commands, and missing dedicated data provider abstraction.
4. **Integration Bridge (`apps/api-node/src/integrations/linkedin/*`)**: Implements dynamic skill discovery and executes a Python CLI bridge against `services/linkedin-skills`, but lacks structured caching, circuit breaking, unified LinkedIn data provider interfaces, Playwright browser lifecycle management, and end-to-end integration with the core Interview AI platform domains (Jobs, Story Bank, Mock Interview).

---

## 2. Inventory of Existing LinkedIn Files

### Frontend (`apps/web`)
| File Path | Description | Status |
|---|---|---|
| `apps/web/src/pages/LinkedInPage.tsx` | Legacy monolithic profile audit page with fake progress timers | **OBSOLETE** — To be removed after migration |
| `apps/web/src/pages/LinkedIn/LinkedInWorkspacePage.tsx` | Active router destination for `/linkedin` | **REPLACE** — Replace with modular production SaaS workspace |
| `apps/web/src/pages/LinkedIn/tabs/OverviewTab.tsx` | Overview dashboard with hardcoded fallback `score || 68` | **REPLACE** — Replace with dynamic real-data overview |
| `apps/web/src/pages/LinkedIn/tabs/ProfileAnalyzerTab.tsx` | Profile analyzer with static scores (90, 85, 70) for sections | **REPLACE** — Replace with real 0-100 deterministic + AI section analyzer |
| `apps/web/src/pages/LinkedIn/tabs/ContentStudioTab.tsx` | Post creation and humanization tab | **REVISE/REPLACE** — Rebuild with verified post types, hooks, Zod validation |
| `apps/web/src/pages/LinkedIn/tabs/ContentCalendarTab.tsx` | Content calendar with hardcoded fallback array | **REPLACE** — Replace with real calendar supporting Day/Week/Month & status workflows |
| `apps/web/src/pages/LinkedIn/tabs/EngagementTab.tsx` | Comment/reply drafter with hardcoded `demo-c1`/`demo-r1` records | **REPLACE** — Connect to real database drafts & verified thread monitoring |
| `apps/web/src/pages/LinkedIn/tabs/AudienceTab.tsx` | Audience intelligence with fake fallback profiles from Stripe/Netflix | **REPLACE** — Eliminate all fake fallbacks; show truthful empty/partial states |
| `apps/web/src/pages/LinkedIn/tabs/StoryBankTab.tsx` | Story bank interview turn tab | **REUSE & ADAPT** — Wire cleanly to core Story Bank & Mock Interview modules |
| `apps/web/src/pages/LinkedIn/tabs/ActivityTab.tsx` | Execution status and logs viewer | **REUSE & ADAPT** — Enhance with real telemetry and provider health |
| `apps/web/src/pages/LinkedIn/tabs/SettingsTab.tsx` | Provider tokens and skill enablement | **REVISE** — Update to reflect new unified provider architecture |
| `apps/web/src/features/linkedin/index.ts` | 2-line re-export file | **REVISE** — Point to authoritative workspace entry point |
| `apps/web/src/lib/api.ts` (lines 452–690) | API client methods for LinkedIn endpoints | **AUDIT & STANDARDIZE** — Normalize types, endpoints, and error handling |

### Backend (`apps/api-node`)
| File Path | Description | Status |
|---|---|---|
| `apps/api-node/src/modules/linkedin/linkedin.controller.ts` | Controller handling profile analysis, content, comments, calendar | **REPLACE** — Migrate to clean domain architecture with Zod schemas |
| `apps/api-node/src/modules/linkedin/linkedin.routes.ts` | Fastify route definitions under `/api/linkedin` | **REVISE/EXPAND** — Expand with complete research, analytics, and optimization endpoints |
| `apps/api-node/src/modules/linkedin/linkedin.model.ts` | Mongoose schemas for profiles, drafts, engagers, executions | **REVISE/EXPAND** — Add snapshots, provenance, bounded schemas, indexes |
| `apps/api-node/src/modules/linkedin/linkedin.provider.ts` | Scraping classes (`AgentReachLinkedInProvider`, `DirectPublicLinkedInProvider`) | **REPLACE** — Contains data fabrication (fallback skills); replace with strict `LinkedInDataProvider` |
| `apps/api-node/src/modules/linkedin/linkedin.scorer.ts` | Profile scoring engine (deterministic weights 0-100) | **REUSE & ADAPT** — Expand to all 14 required sections, confidence ratings, and strict checks |
| `apps/api-node/src/integrations/linkedin/linkedin.adapter.ts` | Facade adapter wrapping registry, runner, policy | **REUSE & ADAPT** — Align with clean domain services |
| `apps/api-node/src/integrations/linkedin/linkedin.registry.ts` | Dynamic scanner for `services/linkedin-skills/skills/*/SKILL.md` | **REUSE** — Solid implementation of dynamic markdown parsing |
| `apps/api-node/src/integrations/linkedin/linkedin.runner.ts` | Python child_process bridge executor | **REUSE & HARDEN** — Add timeout, sanitization, bounded memory, process cleanup |
| `apps/api-node/src/integrations/linkedin/linkedin.policy.ts` | Publishing approval state verification | **REUSE & EXPAND** — Form full state machine (DRAFT -> AI_REVIEW -> USER_REVIEW -> APPROVED -> etc.) |
| `apps/api-node/src/integrations/linkedin/linkedin.schemas.ts` | Zod validation schemas for inputs | **REUSE & EXPAND** — Add complete task schemas |

### Open Source Reference (`services/linkedin-skills`)
| File Path | Description | Status |
|---|---|---|
| `services/linkedin-skills/skills/*` | 12 reference skills (post-writer, humanizer, hook-extractor, etc.) | **PRIMARY ASSET** — Reused/adapted for AI prompting & stylometry rules |
| `services/linkedin-skills/scripts/interviewai_bridge.py` | Python JSON bridge interfacing with `lib/` | **REUSE & EXPAND** — Validated operational on Python 3.13 |
| `services/linkedin-skills/lib/*` | URL parser, backend selector, Apify client, Publora client | **REUSE & ADAPT** |

---

## 3. Broken Features and Anti-Patterns Documented

1. **Data Fabrication on Scrape Failure:**
   - In `linkedin.provider.ts` (line 214): `skills: skills.length > 0 ? skills : ["Technical Architecture", "System Design", "Leadership"]`. If skills could not be parsed, hardcoded skills were injected into user data.
2. **Fake Static Scores in UI:**
   - In `ProfileAnalyzerTab.tsx` (lines 82–84): `custom_url: 90`, `photo_banner: 85`, `recommendations: 70`. These sections are not evaluated from evidence; arbitrary numbers are displayed.
3. **Mock Data Fallbacks in Workspace Tabs:**
   - In `AudienceTab.tsx`: Hardcoded fallback engagers from Stripe, Datadog, Netflix displayed when no data exists.
   - In `ContentCalendarTab.tsx`: Hardcoded 7-day sprint fallback items shown when user has no planned calendar.
   - In `EngagementTab.tsx`: Hardcoded `demo-c1` and `demo-r1` displayed in draft lists.
   - In `OverviewTab.tsx`: Default score `68` displayed when user has never run an analysis.
4. **Duplicate Frontend Implementations:**
   - `apps/web/src/pages/LinkedInPage.tsx` and `apps/web/src/pages/LinkedIn/LinkedInWorkspacePage.tsx` are two separate LinkedIn pages in the same repository.
5. **Missing Unified Data Provider Architecture:**
   - No standardized `LinkedInDataProvider` interface with declared capabilities (`supportsProfile`, `supportsPosts`, `supportsJobs`, `supportsCompanies`, `supportsEngagement`, `supportsSearch`).
   - No Playwright browser lifecycle manager with bounded concurrency, context isolation, and page cleanup.
6. **Untrusted External Content Vulnerabilities:**
   - Scraped HTML/text could be passed directly into LLM prompts without explicit delimiter boundaries or instruction injection defense.
7. **Lack of Provenance and Snapshot Tracking:**
   - Records lack immutable source provenance (`sourceProvider`, `retrievedAt`, `contentHash`, `providerVersion`).
8. **Disconnected LinkedIn Analytics:**
   - No dedicated Analytics workspace aggregating actual stored post snapshots, engagement rates, hook performance, or historical growth curves.
9. **Missing Post Analyzer & Research Workspace:**
   - No dedicated tool to evaluate existing user posts for hook strength, readability, and CTA quality.
   - No public company or job research workspace tied to the existing Jobs domain.

---

## 4. Reusable Code & Preservation Strategy

The following components are architecturally sound and will be preserved and adapted:
1. **Dynamic Skill Registry (`linkedin.registry.ts`)**: Accurately parses markdown frontmatter, categories, and reference guides from `services/linkedin-skills`.
2. **Deterministic Market Scorer (`linkedin.scorer.ts`)**: Connects directly to live MongoDB `Job` documents to compute real market demand percentages for technical skills.
3. **SSRF Validator (`LinkedInSecurityValidator.validateUrl`)**: Strictly enforces HTTPS, validates LinkedIn domain, blocks loopback/private IPs, and standardizes `/in/username` paths.
4. **Python Bridge Script (`interviewai_bridge.py` & `linkedin.runner.ts`)**: Operational, robust JSON CLI bridge with UTF-8 encoding handling on Windows.
5. **Stylometry Rules & Formulas**: Proven 2026 hook formulas (F1–F18), 4-pass humanization logic (Scrub, Rhythm, Add, Self-Check), and comment/reply angles from `linkedin-skills`.
6. **Core Platform Integrity**: Core domains (`Jobs`, `Resume`, `ATS`, `Applications`, `Auto Pipeline`, `Mock Interview`, `Story Bank`, `Analytics`, `Auth`) will remain strictly untouched and integrated via reference IDs.

---

## 5. Obsolete Code Scheduled for Deletion Post-Migration

1. `apps/web/src/pages/LinkedInPage.tsx` — Replaced entirely by the new modular SaaS workspace.
2. `apps/api-node/src/modules/linkedin/linkedin.provider.ts` — Replaced by `services/linkedin/providers/` and unified provider registry.
3. Hardcoded mock arrays in all tab components.

---

## 6. Database Schema Dependencies & Enhancements

Existing collections in MongoDB:
- `linkedinprofiles`
- `linkedinanalyses`
- `linkedinanalysisversions`
- `linkedinrecommendations`
- `linkedincontentdrafts`
- `linkedincontentplans`
- `linkedinpublications`
- `linkedincommentdrafts`
- `linkedinreplydrafts`
- `linkedinthreads`
- `linkedinengagers`
- `linkedinexecutions`
- `linkedinintegrationsettings`

New collections and enhancements required:
- `linkedinpostsnapshots`: Historical snapshots of public posts with observed metrics.
- `linkedinanalyticssnapshots`: Daily/weekly persisted analytics snapshots with zero-fabrication guarantees.
- `linkedinvoiceprofiles`: Reusable voice profile capturing tone, sentence length, vocabulary, and preferred expressions.
- Indexes: `userId: 1, profileId: 1, sourceUrl: 1, contentHash: 1, scheduledAt: 1, status: 1, retrievedAt: -1`.
