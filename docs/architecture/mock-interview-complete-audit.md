# Mock Interview Complete System Audit

**Document:** `docs/architecture/mock-interview-complete-audit.md`  
**Date:** October 2026  
**Status:** Complete Audit & Production Migration Blueprint  

---

## Executive Summary

This document performs an exhaustive audit of the existing Mock Interview system in the Interview AI platform, spanning frontend components (`useInterviewRoom`, `InterviewRoomPage`, `AIAvatar`, `MediaSetup`, `ReportPage`), backend controllers (`InterviewController`), persistence models (`InterviewSession`, `InterviewQuestion`, `CandidateAnswer`, `AnswerEvaluation`), WebSocket communication (`WebSocketManager`, `handlers.ts`), AI engines (`AIService`, `EvaluationEngine`, `QuestionEngine`), and integrations with Candidate Profile, Resume, Jobs, Story Bank, Debrief, and Intelligence systems.

---

## 1. Current Lifecycle

The current user and system flow:
1. **Setup (`SetupPage.tsx`)**:
   - User selects role, experience level, interview type, difficulty, question count, coach mode, and optionally uploads a resume or selects a job via `job_id`.
   - Sends `POST /api/interviews` to create an `InterviewSession` document.
   - Server parses profile/job context and calls `AIService.generate` to create questions (falling back to a static `QUESTION_BANK`).
   - Inserts questions into `InterviewQuestion` collection and returns session DTO.
   - Frontend navigates to `/interview/:id`.
2. **Media Permissions (`MediaSetup.tsx`)**:
   - `MediaSetup` prompts the user for camera and microphone access.
   - Tests mic levels with AudioContext analyser.
   - When verified, user clicks "Join Interview Room" which sets `setupComplete = true`.
3. **Turn Controller Initiation (`useInterviewRoom.ts`)**:
   - The room mounts in `SETUP`, transitioning to `READY` once setup and session load.
   - Displays "Begin Interview" button as a user-gesture anchor for Web Speech / SpeechSynthesis.
   - User clicks "Begin Interview" -> calls `speakQuestion(firstQuestion)` -> transitions to `AI_SPEAKING`.
4. **AI Speaking & Speech Synthesis**:
   - Browser TTS (`createTTSProvider()`) speaks the question text.
   - `tts.onEnd` signals completion and transitions room state to `CANDIDATE_READY`.
5. **Candidate Turn & Speech-to-Text**:
   - `CANDIDATE_READY` auto-starts microphone and Web Speech API (`SpeechRecognition`).
   - State becomes `CANDIDATE_SPEAKING`.
   - Timer counts down from `maxAnswerDuration` (default 60s).
   - STT captures interim and final transcripts.
6. **Answer Submission**:
   - Candidate clicks "Finish Answer" or timer expires -> calls `stopAnswer()`.
   - Transitions to `PROCESSING` then `EVALUATING`.
   - `POST /api/interviews/:id/answers` persists answer.
   - `POST /api/interviews/:id/next-question` loads the next question.
   - If next question exists, loops back to AI speaking; if complete, transitions to `COMPLETED`.
7. **Session Completion & Report**:
   - `POST /api/interviews/:id/complete` generates session-level score object via `AIService.generateStructured`.
   - Client navigates to `/report/:id` which reads `session.score` and question list from `GET /api/interviews/:id`.

---

## 2. Current State Machine

### Existing States in `useInterviewRoom.ts`:
- `SETUP`
- `READY`
- `AI_SPEAKING`
- `CANDIDATE_READY`
- `CANDIDATE_SPEAKING`
- `PROCESSING`
- `EVALUATING`
- `GENERATING_NEXT`
- `COMPLETED`
- `ERROR`

### Existing States in Backend (`InterviewSession.state`):
- `CREATED`
- `SETUP`
- `IN_PROGRESS`
- `EVALUATING`
- `PROCESSING_COMPLETION`
- `COMPLETED`

### Discrepancy & Violations:
- Client and server state namespaces diverge (`READY` vs `CREATED`, `CANDIDATE_READY` vs `IN_PROGRESS`).
- Missing required authoritative states:
  - `PERMISSION_GRANTED`
  - `COMPLETING`
  - `REPORT_GENERATING`
  - `FAILED`
  - `RECONNECTING`
- State transition authority was split: frontend was triggering state updates optimistically and making chained HTTP calls (`submitAnswer` immediately followed by `getNextQuestion`), rather than letting the backend authoritative state machine drive the transition sequence.

---

## 3. Current Frontend State

- **`useInterviewRoom.ts`**:
  - Encapsulates room state, timers, TTS synthesis, STT speech recognition, audio stream muting, and WebSocket events.
  - Strengths: Uses stable refs (`ttsRef`, `recognitionRef`, `stateRef`, `audioStreamRef`) to prevent stale closures. Correctly blocks STT events while AI is speaking.
  - Weaknesses:
    - Does not isolate `MicrophoneManager`, `STTManager`, and `InterviewTurnController` into dedicated modular classes.
    - Relies on browser-only STT; if `webkitSpeechRecognition` fails or is unsupported, no transparent fallback to server-side audio transcription is provided.
    - Skip action submits a fake answer text `'Skipped'` rather than a dedicated skip event/endpoint.
- **`InterviewRoomPage.tsx`**:
  - Clean video layout with `AIAvatar`, `CandidateVideo`, controls bar, countdown ring, and debug inspector.
  - Controls correctly disable microphone during `AI_SPEAKING`.
  - Missing proper state visualizer for `COMPLETING` and `REPORT_GENERATING`.
- **`ReportPage.tsx`**:
  - Displays high-level radar chart and cards based on `session.score`.
  - Weakness: Lacks dedicated `InterviewReport` model backing; does not evaluate all 8 required score dimensions (Technical, Communication, Problem Solving, Relevance, Completeness, Depth, Structure, Confidence); lacks structured topic coverage matrix, actionable technical gaps, and deep provenance tracking.

---

## 4. Current Backend State

- **`InterviewSession`**:
  - Persists role, company, difficulty, interviewType, elapsedSeconds, maxQuestions, stateVersion, lastSequence, and untyped `score` and `evaluations` objects.
  - Lacks:
    - Immutable context snapshot versions (`candidateProfileVersion`, `resumeVersion`, `jobSnapshotVersion`, `contextVersion`).
    - Standardized state enum matching authoritative state machine.
    - Dedicated atomic completion lock.
- **`InterviewQuestion`**:
  - Persists `questionOrder`, `questionText`, `category`, `difficulty`, `source`.
  - Lacks: `status` enum (`GENERATED`, `ASKED`, `ANSWERING`, `SUBMITTED`, `EVALUATED`, `SKIPPED`), `answeredAt`, `sourceContext`.
- **`CandidateAnswer`**:
  - Indexed on `{ sessionId: 1, questionId: 1 }` unique.
  - Lacks: `answerSubmissionId` for explicit client-side idempotency, `startedAt`, `submittedAt`, `durationMs`.
- **`AnswerEvaluation`**:
  - Lacks: `rubricVersion`, `dimensionScores` breakdown (1-8), `confidence`, `provider`, `model`, `promptVersion`.

---

## 5. WebSocket Events

### Current Implementation:
- Handled via `Fastify` websocket route `/ws/interview/:sessionId` in `apps/api-node/src/websocket/handlers.ts`.
- Validates JWT and session ownership on handshake.
- Event envelope in `types.ts`:
  - Client: `{ eventId, type, interviewId, timestamp, payload }`
  - Server: `{ sequence, type, timestamp, correlationId, payload }`
- Supported message types:
  - `STATE_SYNC_REQUEST` -> `STATE_SYNC_RESPONSE`
  - `AI_SPEAKING_STARTED` -> `INTERVIEW_STATE`
  - `CANDIDATE_READY` -> `INTERVIEW_STATE`
  - `CANDIDATE_SPEAKING_STARTED` -> `INTERVIEW_STATE`

### Gaps against Specification:
- Server and client event envelopes must be normalized to:
  `{ type, sessionId, sequence, stateVersion, questionId, timestamp, payload }`
- Missing normalized event handling for:
  - `INTERVIEW_STARTED`
  - `QUESTION_GENERATED`
  - `AI_SPEAKING_COMPLETED`
  - `ANSWER_PROCESSING`
  - `ANSWER_EVALUATION_STARTED`
  - `ANSWER_EVALUATED`
  - `NEXT_QUESTION_GENERATING`
  - `NEXT_QUESTION_READY`
  - `INTERVIEW_COMPLETING`
  - `REPORT_GENERATING`
  - `REPORT_READY`
  - `INTERVIEW_FAILED`
  - `STATE_SYNC_REQUIRED`

---

## 6. AI Calls & Prompt Management

- **Current AI Calls**:
  1. `InterviewController.createSession`: Uses inline prompt string to generate initial question array.
  2. `QuestionEngine.generateNextQuestion`: Uses raw string prompt inside `question.engine.ts`.
  3. `EvaluationEngine.evaluateAnswer`: Evaluates single answer using inline schema.
  4. `InterviewController.completeSession`: Uses inline schema to generate final session score.
- **Critical Gaps**:
  - Prompts were hardcoded in controller and engines rather than registered in `PromptRegistry`.
  - Prompts must be centralized into `PromptRegistry`:
    - `INTERVIEW_QUESTION_GENERATION`
    - `INTERVIEW_ANSWER_EVALUATION`
    - `INTERVIEW_FOLLOWUP_GENERATION`
    - `INTERVIEW_FINAL_REPORT`
    - `INTERVIEW_RECOMMENDATIONS`
  - Prompts must use strict Zod output schemas with robust deterministic fallbacks.
  - Candidate context was only partially drawn; needs full integration with Candidate Profile, Resume version, Job snapshot, Story Bank, and prior Debrief weaknesses.

---

## 7. Database Models

Currently in `interview.model.ts`:
- `InterviewSession`
- `InterviewQuestion`
- `CandidateAnswer`
- `AnswerEvaluation`
- `Transcript`
- `InterviewEvent`

### Missing Model:
- **`InterviewReport`**:
  - `reportId`
  - `sessionId`
  - `userId`
  - `candidateSnapshotVersion`
  - `resumeVersion`
  - `jobSnapshotVersion`
  - `totalQuestions`
  - `answeredQuestions`
  - `skippedQuestions`
  - `overallScore`
  - `dimensionScores` (Technical, Communication, Problem Solving, Relevance, Completeness, Depth, Structure, Confidence)
  - `strengths`
  - `weaknesses`
  - `technicalGaps`
  - `communicationFeedback`
  - `topicCoverage` (coveredTopics, weakTopics, strongTopics, remainingTopics)
  - `questionResults` (question, answer, evaluation, score, evidence, whatWentWell, whatCouldImprove, recommendedAnswer)
  - `recommendedTopics`
  - `recommendedQuestions`
  - `nextBestActions`
  - `confidence`
  - `reportVersion`
  - `scoringVersion`
  - `rubricVersion`
  - `idempotencyKey` (`sessionId + "_" + reportVersion`)

---

## 8. Report Generation & Scoring

- **Existing Logic**:
  - `completeSession` creates a summary JSON with `overall_score`, `technical_score`, etc., stored directly in `InterviewSession.score`.
  - If AI call fails, uses arbitrary hardcoded calculation `7.8 + count * 0.1`.
- **Requirements**:
  - Deterministic aggregation based purely on persisted question evaluations.
  - Evaluation of 8 distinct dimensions with evidence and justification.
  - Clear distinction between `UNKNOWN` (untested) vs `MISSING` (tested and absent/failed).
  - Explicit idempotency key (`reportGenerationKey = sessionId + "_" + reportVersion`).
  - Dedicated endpoint `GET /api/interviews/:id/report` and `POST /api/interviews/:id/report/generate`.

---

## 9. Broken / Duplicate Implementations

1. **Dual Question Generation**:
   - `createSession` generated all questions up front and stored them in `InterviewQuestion`, while `question.engine.ts` generated questions dynamically one-by-one.
   - *Fix*: Pre-generate initial question pool if desired, but dynamic follow-up generation must update based on prior answer evaluation.
2. **Answer Submission & Skip Question**:
   - Skipping a question stored an answer with `'Skipped'`, polluting the answers collection and artificially lowering scores or treating it as an answered question.
   - *Fix*: Store `status = 'SKIPPED'` on `InterviewQuestion`, record skip timestamp and reason, and bypass answer evaluation.
3. **Turn-Taking Sync**:
   - While `tts.onEnd` exists in `useInterviewRoom`, there was an arbitrary `setTimeout(..., 100)` before calling `startAnswer`.
   - *Fix*: Centralized `InterviewTurnController` handles authoritative turn transition cleanly.

---

## 10. Race Conditions Identified

1. **Concurrent Answer Submissions**:
   - If user double-clicks "Finish Answer" or if network latency induces retries, multiple `submitAnswer` calls could race.
   - *Fix*: Frontend `isSubmittingRef` guard + backend unique index on `{ sessionId, questionId }` + `answerSubmissionId` idempotency.
2. **Duplicate Completion & Report Generation**:
   - Multiple rapid clicks on "End Interview" or concurrent completion calls could trigger parallel AI report generation jobs.
   - *Fix*: Atomic state transition lock (`findOneAndUpdate` with `{ state: { $nin: ['COMPLETING', 'REPORT_GENERATING', 'COMPLETED'] } }`) setting state to `COMPLETING` -> `REPORT_GENERATING`.
3. **Stale WebSocket Sequence Ingestion**:
   - Reconnected or out-of-order WebSocket packets could revert state.
   - *Fix*: Monotonic `sequenceNumber` and `stateVersion` checks; drop events where `stateVersion < current`.

---

## 11. Missing Functionality

1. Authoritative 12-state state machine enforced by backend validator.
2. Immutable context snapshotting (candidate profile version, resume version, job snapshot version).
3. Centralized `MicrophoneManager`, `STTManager`, and `InterviewTurnController` on the frontend.
4. Formal `InterviewReport` schema, generator, and endpoints (`GET /api/interviews/:id/report`).
5. Strict `UNKNOWN` vs `MISSING` scoring classification.
6. Topic coverage tracking (`coveredTopics`, `weakTopics`, `strongTopics`, `remainingTopics`).
7. Full Prompt Registry entries for interview generation, evaluation, follow-up, and reporting with Zod structured output.
8. Automated 5-question E2E regression test verifying complete lifecycle.

---

## 12. Migration & Hardening Plan

- **Step 1: Backend Data Models & Enums**:
  - Update `InterviewSession` with authoritative 12 states, context versioning, stateVersion, and sessionVersion.
  - Update `InterviewQuestion` with `status` enum (`GENERATED`, `ASKED`, `ANSWERING`, `SUBMITTED`, `EVALUATED`, `SKIPPED`).
  - Update `CandidateAnswer` with `answerSubmissionId`, `startedAt`, `submittedAt`, `durationMs`.
  - Add `InterviewReport` model with complete rubric, dimension scores, question breakdown, and idempotency key.
- **Step 2: Prompt Registry & Structured AI Engines**:
  - Add `INTERVIEW_QUESTION_GENERATION`, `INTERVIEW_ANSWER_EVALUATION`, `INTERVIEW_FOLLOWUP_GENERATION`, `INTERVIEW_FINAL_REPORT`, `INTERVIEW_RECOMMENDATIONS` to `PromptRegistry`.
  - Harden `EvaluationEngine` and `QuestionEngine` with strict schemas and deterministic fallbacks.
- **Step 3: Backend State Machine & Controllers**:
  - Implement authoritative state machine transition table in `interview.controller.ts`.
  - Implement idempotent answer submission (`sessionId + questionId + answerSubmissionId`).
  - Implement atomic completion lock and idempotent report generation (`generateReport`).
  - Expose `GET /api/interviews/:id/report` and `POST /api/interviews/:id/report/generate`.
  - Expose `POST /api/interviews/:id/skip`.
- **Step 4: WebSocket Protocol Hardening**:
  - Standardize event envelopes: `{ type, sessionId, sequence, stateVersion, questionId, timestamp, payload }`.
  - Implement monotonic sequence & stateVersion verification.
- **Step 5: Frontend Managers & Room Controller**:
  - Implement centralized `MicrophoneManager`, `STTManager`, and `InterviewTurnController` in `apps/web/src/hooks/useInterviewRoom.ts`.
  - Strictly enforce mic/STT OFF during `AI_SPEAKING`, `PROCESSING`, `EVALUATING`, `GENERATING_NEXT`, `COMPLETING`, `REPORT_GENERATING`, `COMPLETED`.
  - Drive turn-taking strictly via TTS completion event.
- **Step 6: Frontend UI & Report Page**:
  - Update `InterviewRoomPage.tsx` controls and state indicators for all authoritative states.
  - Update `ReportPage.tsx` to display full 8-dimension scores, radar chart, question-by-question breakdown, evidence, technical gaps, learning recommendations, and next best actions.
- **Step 7: Verification & E2E Testing**:
  - Implement unit and integration tests in `apps/api-node/tests/mock-interview-hardening.test.ts`.
  - Execute 5-question automated E2E test verifying all 15 points.
  - Generate architectural documentation.
