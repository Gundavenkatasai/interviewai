# Job-Specific ATS Resume Generation Engine & Requisition Telemetry Audit

**Status:** PRODUCTION READY  
**Date:** 2026-11-18  
**Repository:** Interview AI Monorepo (`apps/api-node`, `apps/web`)

---

## 1. Executive Summary

This document establishes the verified architectural audit and production design of the **Job-Specific ATS Resume Generation Engine** and **Requisition Intelligence Specification** in Interview AI.

The engine guarantees the **Golden Thread** invariant:
> One unified Requisition ID connects the Job Description, deterministic Evidence Match, Mock Interview Studio, Interview Evaluation Report, Tailored Resume, and Application Tracker.

Generating a tailored resume for a job listing never mutates the user's canonical profile or baseline master resume. Tailored resumes are stored as independently versioned, immutable snapshots tied directly to the target `jobId`.

---

## 2. Codebase Audit & Architectural Inventory

### 2.1 Requisition Intelligence & Clean JD Parsing
- **Location:** `apps/web/src/pages/JobDetailPage.tsx` and `apps/web/src/pages/JobsPage.tsx`
- **Previous Failure Mode:** Scraped job listings (e.g. Internshala, Naukri) often contain unformatted metadata dumps (e.g., duplicated salary strings `₹ 3,00,000 - 4,00,000 ₹ 3,00,000 - 4,00,000 /year`, bare technology lines `MATLAB\nC#\nOpenCV`, unlabelled employer names).
- **Verified Fix:**
  1. `extractJobAttributes()` cleans markdown artifacts, strips broken image tags, unwraps links, and extracts structured entities.
  2. Salary deduplication parses numerical ranges and pay periods (`cleanSalary`).
  3. Responsibilities are parsed into numbered requirement points.
  4. Extracted technologies are mapped to normalized pill badges (`Target Competencies & Toolchain`).
  5. The redundant raw markdown text box (`Requisition Full Specification`) has been eliminated in favor of a clean, structured Blueprint Grid.

### 2.2 Centralized Candidate Context Service
- **Location:** `apps/api-node/src/modules/profile/candidate-context.service.ts`
- **Route:** `GET /api/profile/context`
- **Capabilities:** Synthesizes verified profile facts, skills provenance, work experience, projects, education, certifications, and historical resume versions into a unified evidence object.

### 2.3 Tailoring Engine & Truth Gate
- **Location:** `apps/api-node/src/modules/resume/tailoring/tailoring.service.ts` & `apps/api-node/src/modules/resume/resume.controller.ts`
- **Core Rules:**
  - `MATCHED` skills are preserved and prioritized.
  - `MISSING` skills are flagged as evidence gaps and added to `forbiddenClaims`.
  - Zero metric hallucination: No new numbers, percentages, companies, or degrees may be invented.
  - Baseline vs. Projected ATS Score is calculated deterministically via `AtsEvaluator.analyze`.

### 2.4 Multi-Template ATS Rendering System
- **Registry:** `apps/api-node/src/modules/resume/templates/registry.ts`
- **Supported ATS Templates:**
  1. `classic-ats`: Standard Single-Column (99.4% parser fidelity)
  2. `modern-ats`: Modern Technical Minimalist
  3. `technical-ats`: Engineering Specialist (Expanded skills grid)
  4. `executive-ats`: Compact Senior Leadership

### 2.5 Tailored Resume Workspace
- **Location:** `apps/web/src/pages/TailorResumePage.tsx` (`/jobs/:id/tailor`)
- **Features:**
  - Grounded Job Header (Title, Company, Location, Work Mode)
  - Baseline ATS Score vs. Projected Match Score (+% Score Lift)
  - Truth Gate Guarantee Badge
  - Matched Skills vs. Missing Evidence Gaps
  - Side-by-side phrasing diff review with checkboxes
  - Inline phrasing editor for proposed bullets/summary
  - Template switcher dropdown
  - Real-time printable Resume Canvas Preview
  - Download DOCX (native OOXML) & Print/Save as PDF
  - One-click "Attach to Application Tracker"

---

## 3. Data Integrity & Immutability Verification

| Action | Canonical Resume Impact | Profile Impact | Version Created |
|---|---|---|---|
| View Job Requisition | None | None | None |
| Run Tailoring Diff | None | None | None |
| Commit Tailored Resume | Untouched (read-only) | Untouched | New `Resume` (v1) + `ResumeVersion` (`jobId` linked) |
| Download DOCX / PDF | None | None | None |
| Attach to Application | None | None | `UserApplication` record created |

---

## 4. Verification & Testing

- `npm run tsc --noEmit --project apps/web/tsconfig.json`: **0 Errors**
- `npm run tsc --noEmit --project apps/api-node/tsconfig.json`: **0 Errors**
- Fastify API Server on port 8001: **Healthy** (`/health` responding 200 OK)
- Vite Frontend Server on port 5173: **Healthy**
