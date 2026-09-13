# Day 17: Open-Source Research

Before implementing Career Analytics & Gap Intelligence, we evaluated architectural patterns from several strong open-source career/job analytics projects to extract useful paradigms for Interview AI.

## 1. JobSync
**Primary Focus:** Application Analytics & Funnel Tracking
**Extracted Patterns:**
- **Application Funnel Concepts:** Viewing the job search as a deterministic funnel (Saved -> Prepared -> Submitted -> Responded -> Interviewed -> Offered).
- **Task/Activity History:** Tying all follow-ups, outreach, and tasks directly to the application entity, providing a holistic "timeline" view of effort vs. outcome.

## 2. Job Tracker
**Primary Focus:** Source Performance & Velocity
**Extracted Patterns:**
- **Source Performance Analytics:** Aggregating outcomes by source (LinkedIn, Referrals, Company Site) to identify the highest ROI channels. Crucially, enforcing minimum sample sizes before rendering conversion rates to avoid misleading conclusions.
- **Application Velocity:** Tracking the cadence of applications (per week/month) and analyzing wait times (time-to-response, time-to-interview) to set candidate expectations.
- **Trend Analysis:** Comparing current period performance vs. previous period (e.g., +12% interviews this month).

## 3. CareerTrack
**Primary Focus:** Application History & Status Tracking
**Extracted Patterns:**
- **Status State Machines:** Ensuring that an application transitions through logical states, providing a clear history of when each state change occurred.
- **Follow-up Context:** Tying communication activities to status transitions (e.g., following up after 5 days in "Submitted" state).

## 4. SkillBridge
**Primary Focus:** Skill-Gap Prioritization & Readiness
**Extracted Patterns:**
- **Explainable Skill-Gap Analysis:** Not just saying "You need Python", but backing it up with "Python is missing in your resume, but appeared in 12 of your targeted backend roles."
- **Actionable Prioritization:** Ranking gaps not just by frequency, but by a deterministic formula considering Market Demand × Resume Recurrence × Candidate Evidence × Target Role Importance.
- **Transferable Skills:** Identifying and highlighting strong candidate skills to avoid a negative-only gap report.

## Adaptation for Interview AI
These patterns will not be copied blindly. They will be integrated directly into our existing infrastructure (MongoDB aggregations, BullMQ background processing, AI Provider abstraction). The primary adaptation is the **Evidence / Attribution Layer**: every derived metric (like a skill gap or conversion rate) must maintain a clear pointer to the underlying source records (Resume Versions, Job Snapshots, Interview Transcripts) to ensure deterministic ground truth and explainability.
