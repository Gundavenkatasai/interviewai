# Day 17: Repository Audit - Analytics & Gap Intelligence

## 1. Existing Data Sources
The Interview AI platform has a mature intelligence schema that must act as the primary, authoritative ground truth for all analytics. No secondary or derivative collections should be created if data can be aggregated deterministically from these sources.

| Domain | Authoritative Collections | Key Signals |
| :--- | :--- | :--- |
| **Candidate Intelligence** | `CandidateProfile`, `CareerIntelligence` | Baseline skills, health score, verified facts |
| **Job Intelligence** | `Job`, `JobSnapshot` | Job family/role, requirements, source, match score, trust score, discovery source |
| **Resume Intelligence** | `ResumeDocument`, `ResumeVersion`, `TailoringRun` | Application specific ATS scores, formatting quality, structural gaps |
| **Application Intelligence** | `Application`, `ApplicationTimeline` | Status (Saved -> Submitted -> Interviewed), timestamps, applied role |
| **Interview Intelligence** | `InterviewSession`, `InterviewDebrief`, `InterviewWeakness` | Real-time performance, technical scores, recurring weaknesses, transcripts |
| **Communication** | `CareerContact`, `FollowUpTask`, `CommunicationActivity` | Outreach cadences, responses, channel efficiency |

## 2. Existing Reusable Infrastructure
- **MongoDB Aggregations:** Mongoose is used extensively. We will rely heavily on `$lookup`, `$match`, and `$group` pipelines to calculate deterministic metrics dynamically.
- **BullMQ / Redis:** Background task processing is available. Can be used for expensive, long-running analytics recalculations (e.g., `ANALYTICS_SNAPSHOT`).
- **AI Service Abstraction (`ai.service.ts` / `ai.registry.ts`):** Provides a resilient way to ask AI for explanations using Groq/Qwen.
- **Zod:** Strict type definition for APIs and AI structured outputs.

## 3. Analytics Dependency Graph & Flow
`Raw Source Data (Jobs, Apps, Resumes)` 
-> `Deterministic Aggregations (Rates, Averages)` 
-> `Evidence Pointers (Array of IDs)`
-> `Confidence Scoring (Sample Size checks)`
-> `Career Gap Identification (Rule-based detection)` 
-> `AI Explanatory Layer (Read-only interpretation)` 
-> `Next Best Action Engine (Actionable UI routes)`

## 4. Implementation Decisions & Constraints
- **Missing Data:** Must be explicitly classified as `MISSING` or `INSUFFICIENT_DATA` rather than zero. 
- **Sample Size Protection:** 
  - `< 3`: INSUFFICIENT_DATA
  - `3-5`: LOW_CONFIDENCE
  - `6-14`: MEDIUM_CONFIDENCE
  - `15+`: HIGHER_CONFIDENCE
- **Idempotency & Versioning:** Analytics snapshots will be tagged with a `calculationVersion` (e.g. `v1.0.0`) to ensure old snapshots remain traceable when formulas evolve.
- **No Parallel Architectures:** We will NOT duplicate Match, Trust, ATS, or Interview evaluation logic. We rely on the output scores that are already persisted.
- **Evidence Drawer:** Every calculated gap or metric will export an array of `evidenceIds` so the frontend can link back directly to the source documents.

## 5. Missing Fields / Additions
- We will likely need a `CareerAnalyticsSnapshot` collection to cache expensive operations to avoid doing heavy lifting synchronously in the API.
- The `Application` model might need slight adjustments to explicitly track the `ResumeVersion` used, if not already captured in the `ApplicationPack`.

## 6. Migration Requirements
- No silent data repair on historical records.
- If existing applications lack a "source", they will fall into an "Unknown" bucket in the source analytics.
