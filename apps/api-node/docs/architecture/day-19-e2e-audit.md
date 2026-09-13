# Day 19 E2E Audit

## Subsystem Dependency Map

### 1. Job Ingestion & Discovery
- **Critical Journeys**: User searching and filtering ingested jobs.
- **Backend API**: `GET /api/jobs`, `GET /api/jobs/:id`
- **Database**: `Job` collection (MongoDB)
- **Queue**: N/A (runs via Cron)
- **AI Dependencies**: `TrustScore` engine (FakeAI/Qwen)
- **Frontend**: Jobs Dashboard (`/jobs`), Job Detail (`/jobs/:id`)
- **External Integration**: Greenhouse API, Lever API (Ingestion Adapters)
- **Failure Modes**: Upstream API rate limits, missing job descriptions, IDOR vulnerabilities.
- **Existing Tests**: Unit tests for match scoring and resume parsing.
- **Missing Tests**: Load testing job searches, filtering performance.

### 2. Resume Ingestion & Parsing
- **Critical Journeys**: Uploading a PDF/DOCX, canonicalizing the profile, and scanning against ATS.
- **Backend API**: `POST /api/resume/upload`, `POST /api/resume/ats`
- **Database**: `Resume`, `ResumeVersion` (MongoDB)
- **Queue**: N/A
- **AI Dependencies**: Qwen/Groq for extraction and ATS evaluation.
- **Frontend**: Resume Studio, ATS Scanner UI
- **External Integration**: AWS S3/Local FS for file storage.
- **Failure Modes**: Unrecognized complex PDF layouts, hallucinated parsing facts.
- **Missing Tests**: E2E browser file upload simulation, latency profiling of parsing.

### 3. Application Tailoring & Pipeline
- **Critical Journeys**: Preparing an application, generating a tailored artifact, and transitioning to `READY_TO_APPLY`.
- **Backend API**: `POST /api/tailoring/propose`, `POST /api/pipeline/start`
- **Database**: `PipelineRun`, `ResumeTailoringRun`, `ApplicationPack` (MongoDB)
- **Queue**: N/A (runs inline or planned BullMQ)
- **AI Dependencies**: High AI dependency for rewriting bullets safely without drift.
- **Frontend**: Application Tracker, Tailoring Review
- **External Integration**: None
- **Failure Modes**: AI timeout (60s boundary), hallucinating unearned metrics, queue failures.
- **Missing Tests**: Regression AI latency test (20-run stability), queue duplication check.

### 4. Real-Time Interview & Debrief
- **Critical Journeys**: Engaging in a mock technical interview, generating a debrief and Next Best Action.
- **Backend API**: `WS /api/interview/ws`, `POST /api/debrief/generate`
- **Database**: `InterviewSession`, `Debrief`, `CareerGap` (MongoDB)
- **Queue**: N/A
- **AI Dependencies**: Real-time evaluation of answers, debrief generation.
- **Frontend**: Interview Space (WebRTC/MediaDevices), Debrief Dashboard
- **External Integration**: None
- **Failure Modes**: WebSocket disconnects, state desync, ungranted browser permissions, AI timeout.
- **Missing Tests**: E2E WebSocket reconnect resiliency, concurrency scaling limits.

### 5. Follow-Up & Analytics
- **Critical Journeys**: Viewing performance funnels and generating "Thank You" emails.
- **Backend API**: `GET /api/analytics`, `POST /api/outreach/draft`
- **Database**: `Communication`, `Application`
- **Queue**: `OutreachQueue`
- **AI Dependencies**: No-drift claim validation.
- **Frontend**: Analytics Dashboard, Outreach Center
- **External Integration**: None
- **Failure Modes**: Duplicate follow-up generation, sluggish analytics aggregation.
- **Missing Tests**: Load test Analytics Mongo aggregation pipelines with 10k items.
