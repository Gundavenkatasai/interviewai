# Authoritative Mock Interview State Machine

**Document:** `docs/architecture/mock-interview-state-machine.md`  
**Status:** Authoritative  

---

## 1. Authoritative States

The interview lifecycle is governed by an authoritative 12-state state machine enforced by backend validator (`VALID_STATE_TRANSITIONS`) and tracked via monotonic `stateVersion`.

| State | Description | Mic State | STT State | Timer |
|---|---|---|---|---|
| `SETUP` | Initial session creation and configuration | OFF | OFF | STOP |
| `PERMISSION_GRANTED` | Video/audio permissions verified; waiting for candidate gesture | OFF | OFF | STOP |
| `AI_SPEAKING` | AI interviewer synthesized speech playing | OFF | OFF | STOP |
| `CANDIDATE_READY` | Turn transition initiated; mic & STT activating | ON | ON | START |
| `CANDIDATE_SPEAKING` | Candidate answering question; live STT active | ON | ON | RUN |
| `PROCESSING` | Candidate submitted answer; hardware muted | OFF | OFF | STOP |
| `EVALUATING` | AI evaluation engine assessing 8 dimensions | OFF | OFF | STOP |
| `GENERATING_NEXT` | Question engine formulating next dynamic follow-up | OFF | OFF | STOP |
| `COMPLETING` | Final question reached; atomic completion lock acquired | OFF | OFF | STOP |
| `REPORT_GENERATING` | Report engine synthesizing diagnostic report | OFF | OFF | STOP |
| `COMPLETED` | Report finalized and immutable; interview done | OFF | OFF | STOP |
| `FAILED` | Recoverable failure state | OFF | OFF | STOP |
| `RECONNECTING` | WebSocket or network recovery state | OFF | OFF | PAUSE |

---

## 2. Valid Transition Table

```typescript
export const VALID_STATE_TRANSITIONS: Record<InterviewState, InterviewState[]> = {
  SETUP: ["PERMISSION_GRANTED", "FAILED"],
  PERMISSION_GRANTED: ["AI_SPEAKING", "CANDIDATE_READY", "FAILED"],
  AI_SPEAKING: ["CANDIDATE_READY", "FAILED", "RECONNECTING"],
  CANDIDATE_READY: ["CANDIDATE_SPEAKING", "AI_SPEAKING", "PROCESSING", "EVALUATING", "COMPLETING", "FAILED", "RECONNECTING"],
  CANDIDATE_SPEAKING: ["PROCESSING", "EVALUATING", "FAILED", "RECONNECTING"],
  PROCESSING: ["EVALUATING", "GENERATING_NEXT", "COMPLETING", "FAILED"],
  EVALUATING: ["GENERATING_NEXT", "COMPLETING", "REPORT_GENERATING", "FAILED"],
  GENERATING_NEXT: ["AI_SPEAKING", "CANDIDATE_READY", "COMPLETING", "FAILED"],
  COMPLETING: ["REPORT_GENERATING", "COMPLETED", "FAILED"],
  REPORT_GENERATING: ["COMPLETED", "FAILED"],
  COMPLETED: [],
  FAILED: ["SETUP", "RECONNECTING"],
  RECONNECTING: [
    "AI_SPEAKING",
    "CANDIDATE_READY",
    "CANDIDATE_SPEAKING",
    "PROCESSING",
    "EVALUATING",
    "GENERATING_NEXT",
    "COMPLETING",
    "REPORT_GENERATING",
    "COMPLETED",
    "FAILED",
  ],
};
```

---

## 3. Transition Rules & Enforcements

1. **Backend Authority:**
   - The frontend never unilaterally advances the interview state.
   - Any state update request sent via HTTP or WebSocket is validated against `VALID_STATE_TRANSITIONS[currentState]`.
   - Invalid transitions return HTTP `400 Bad Request` and are rejected.

2. **TTS Completion as Only Turn-Taking Trigger:**
   - Turning the microphone ON during `AI_SPEAKING` is strictly prohibited.
   - Turning `AI_SPEAKING` into `CANDIDATE_READY` requires the `tts.onEnd` event.
   - If TTS encounters an error (`tts.onError`), an immediate safe fallback advances the state to `CANDIDATE_READY` and displays the written question card.

3. **Concurrency & Replay Rejection:**
   - Every state transition increments `stateVersion`.
   - If a client sends an event with `stateVersion < current`, it is dropped as stale.
