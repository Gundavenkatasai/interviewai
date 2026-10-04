# Mock Interview WebSocket Real-Time Protocol

**Document:** `docs/architecture/mock-interview-websocket-protocol.md`  
**Status:** Production  
**Protocol Version:** v2.0  

---

## 1. Normalized Event Envelopes

All WebSocket client-to-server and server-to-client frames adhere to a standardized normalized envelope:

### Server-to-Client Envelope
```typescript
export interface ServerEvent {
  type: string;             // Event identifier (e.g. "INTERVIEW_STATE")
  sessionId: string;        // UUID of the active interview session
  sequence: number;         // Monotonically increasing sequence number
  stateVersion: number;     // Monotonically increasing state version
  questionId?: string;      // Current question identifier
  timestamp: string;        // ISO 8601 UTC timestamp
  correlationId?: string;   // Optional client correlation ID
  payload?: any;            // Structured event data
}
```

### Client-to-Server Envelope
```typescript
export interface ClientEvent {
  eventId?: string;         // Unique client event ID for deduplication
  type: string;             // Event identifier (e.g. "STATE_SYNC_REQUEST")
  sessionId?: string;       // Active interview session ID
  sequence?: number;        // Client sequence number
  stateVersion?: number;    // Client perceived state version
  questionId?: string;      // Question identifier
  timestamp?: string;       // ISO 8601 UTC timestamp
  payload?: any;            // Event payload
}
```

---

## 2. Event Catalog

| Event Name | Direction | Trigger | Payload Contents |
|---|---|---|---|
| `INTERVIEW_STARTED` | Server → Client | Session transition to active | `{ sessionId, role, difficulty }` |
| `QUESTION_GENERATED` | Server → Client | Question formulated | `{ questionId, questionText, category, difficulty }` |
| `AI_SPEAKING_STARTED` | Client ↔ Server | TTS begins audio playback | `{ questionId }` |
| `AI_SPEAKING_COMPLETED`| Client → Server | TTS audio synthesis ends | `{ questionId }` |
| `CANDIDATE_READY` | Client ↔ Server | Candidate turn begins | `{ questionId }` |
| `CANDIDATE_SPEAKING_STARTED` | Client → Server | Mic & STT activated | `{ questionId, startedAt }` |
| `TRANSCRIPT_UPDATE` | Client → Server | Live transcript chunk | `{ interim, final }` |
| `ANSWER_SUBMITTED` | Client → Server | Answer submission initiated | `{ questionId, answerSubmissionId, durationMs }` |
| `ANSWER_PROCESSING` | Server → Client | Server processing submission | `{ questionId }` |
| `ANSWER_EVALUATION_STARTED` | Server → Client | AI rubric evaluation running | `{ questionId, answerId }` |
| `ANSWER_EVALUATED` | Server → Client | AI rubric evaluation complete | `{ questionId, score }` |
| `NEXT_QUESTION_GENERATING` | Server → Client | Formulation of follow-up | `{}` |
| `NEXT_QUESTION_READY` | Server → Client | Next question available | `{ question: QuestionDto }` |
| `INTERVIEW_COMPLETING` | Server → Client | Final question evaluated | `{}` |
| `REPORT_GENERATING` | Server → Client | Report engine synthesizing | `{}` |
| `REPORT_READY` | Server → Client | Report generated and stored | `{ reportId }` |
| `INTERVIEW_COMPLETED` | Server → Client | Interview fully complete | `{}` |
| `STATE_SYNC_REQUEST` | Client → Server | Client reconnects or refreshes | `{}` |
| `STATE_SYNC_RESPONSE` | Server → Client | Authoritative state sync | `{ state, currentQuestion, elapsedSeconds, score }` |
| `PING` / `PONG` | Bi-directional | Heartbeat verification | `{}` |

---

## 3. Reconnection & Single-Tab Authority

1. **Single Tab Authority:**
   - When a WebSocket connects with `sessionId`, any prior connection for that `sessionId` is closed with code `1008 ("New connection established from another tab")`.
   - Prevents split-brain state updates across tabs.

2. **State Restoration on Reconnect:**
   - When a disconnected client reconnects, it immediately sends `STATE_SYNC_REQUEST`.
   - The server queries MongoDB and responds with `STATE_SYNC_RESPONSE` containing the exact current `state`, `currentQuestion`, `elapsedSeconds`, and `stateVersion`.
   - Client resumes without restarting the interview or regenerating historical questions.
