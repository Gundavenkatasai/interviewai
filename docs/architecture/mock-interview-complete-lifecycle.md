# Mock Interview Complete Lifecycle Architecture

**Document:** `docs/architecture/mock-interview-complete-lifecycle.md`  
**Status:** Production  
**Scope:** Complete End-to-End Interview Journey  

---

## 1. Architectural Overview

The Interview AI Mock Interview platform delivers an authoritative, state-synchronized, real-time interview experience designed for high-concurrency production deployments. The architecture guarantees:
- **Server Authoritative State Machine:** All stage transitions are validated and guarded on the backend.
- **Hardware-Synchronized Turn-Taking:** Microphone active capture and speech-to-text (STT) listeners are enabled strictly when the candidate is speaking.
- **TTS Completion as Turn Signal:** The transition from interviewer turn to candidate turn is triggered strictly by browser/server audio synthesis completion, eliminating arbitrary `setTimeout` races.
- **Timestamp-Based Duration Truth:** Timing is computed deterministically via UTC milliseconds (`durationMs = submittedAt - startedAt`).
- **Idempotent Data Submission:** Every answer submission and report generation carries unique deduplication keys preventing accidental duplicate database entries.
- **Unknown vs Missing Scoring Semantics:** Competencies not evaluated are recorded as `UNKNOWN`, preventing artificial candidate penalization.

---

## 2. End-to-End Lifecycle Phases

```
[ Setup & Role Selection ]
         │
         ▼
[ Session Creation & Context Snapshot ]
         │
         ▼
[ Media Device Verification ]
         │
         ▼
[ AI Opening Question & TTS Speech ]
         │ (tts.onEnd)
         ▼
[ Candidate Turn & Live STT ]
         │ (Submit Answer / Timer Expire)
         ▼
[ Processing & 8-Dimension Evaluation ]
         │
         ▼
[ Dynamic Follow-Up Question Generation ]
         │
         ▼ (Loop Q1 → Q5)
[ Final Question Evaluated ]
         │
         ▼
[ Atomic Completion Lock & Report Synthesis ]
         │
         ▼
[ Immutable Report Persistence & Visualizer ]
```

### Phase 1: Setup & Session Creation
- User configures target role, experience level, interview type, difficulty, technologies, and optional resume/job snapshot.
- Server invokes `POST /api/interviews` which constructs an immutable snapshot:
  - `candidateProfileVersion`, `resumeVersion`, `jobSnapshotVersion`, `contextVersion`.
  - Initial question generation via `PromptRegistry.INTERVIEW_QUESTION_GENERATION_v1`.
  - Sets state to `SETUP`.

### Phase 2: Media Verification & User Gesture Anchor
- User verifies webcam video feed and microphone responsiveness in `MediaSetup.tsx`.
- Audio streams are bound to `MicrophoneManager`.
- Once verified, state advances to `PERMISSION_GRANTED`.
- Candidate clicks "🎙️ Start Interview Now" which serves as the trusted user-gesture anchor required by modern browser autoplay policies for `SpeechSynthesis`.

### Phase 3: AI Speech Turn
- Server transitions session state to `AI_SPEAKING`.
- `MicrophoneManager.disable()` and `STTManager.stop()` ensure microphone capture is completely muted and cannot capture AI speaker audio.
- The UI renders the AI interviewer avatar with audio waveform animation.
- Answer submission buttons and microphone toggles are disabled.

### Phase 4: Authoritative Turn Handoff
- When TTS audio finishes playing, `tts.onEnd` fires.
- State transitions: `AI_SPEAKING` → `CANDIDATE_READY` → `CANDIDATE_SPEAKING`.
- `MicrophoneManager.enable()` and `STTManager.start()` activate the microphone and speech recognition engine.
- Accurate timestamp `answerStartedAt = Date.now()` is recorded.

### Phase 5: Candidate Speech & Live STT
- STT manager captures live interim transcript and committed final transcript.
- Candidate observes their verbal response appearing in real time.
- RequestAnimationFrame timer counts down against `maxAnswerDuration` (default 60s).

### Phase 6: Idempotent Answer Submission
- Triggered by candidate clicking "Submit Answer" or timer expiration.
- Microphone is immediately muted; STT is stopped.
- Generates `answerSubmissionId = crypto.randomUUID()`.
- Dispatches payload:
  ```json
  {
    "question_id": "q-123",
    "answer_submission_id": "sub-456",
    "transcript": "...",
    "duration_seconds": 35,
    "durationMs": 35000,
    "startedAt": 1727770000000,
    "submittedAt": 1727770035000
  }
  ```
- Backend enforces uniqueness on `{ sessionId, questionId }` and `{ sessionId, questionId, answerSubmissionId }`.

### Phase 7: AI Answer Evaluation
- Server enters `EVALUATING`.
- `EvaluationEngine` invokes `PromptRegistry.INTERVIEW_ANSWER_EVALUATION_v1` using Zod schema `AnswerEvaluationResponseSchema`.
- Evaluates 8 dimensions (0.0 to 10.0):
  1. Technical Accuracy
  2. Relevance
  3. Completeness
  4. Depth
  5. Problem Solving
  6. Communication
  7. Structure
  8. Confidence & Clarity
- Evaluates `evidenceState` (`SUPPORTED`, `WEAK`, `MISSING`, `UNKNOWN`).
- Computes deterministic weighted score aggregation and creates `AnswerEvaluation` document.

### Phase 8: Dynamic Follow-Up Question Loop
- Session transitions to `GENERATING_NEXT`.
- `QuestionEngine` analyzes weak and strong areas identified in prior answers.
- Generates targeted follow-up question or advances topic coverage without repeating previously asked questions.
- Transitions to `AI_SPEAKING` and loops for $N$ questions.

### Phase 9: Atomic Completion & Report Generation
- When `questions.length >= maxQuestions`, session enters `COMPLETING`.
- An atomic completion lock (`completionLock: randomUUID()`) prevents race conditions from concurrent completion requests.
- Session enters `REPORT_GENERATING`.
- `ReportEngine` deterministically aggregates all questions, answers, and evaluations.
- Synthesizes an immutable `InterviewReport` document with idempotency key (`sessionId + "_v1"`).
- State transitions to `COMPLETED`.

### Phase 10: Report UI & History
- Client transitions to `/report/:id`.
- Renders 8-dimension scorecards, competency radar chart, strengths, weaknesses, technical gaps, expandable question-by-question breakdown, evidence, and model answers.
- Reopening the interview from History loads the persisted report with zero regeneration overhead.
