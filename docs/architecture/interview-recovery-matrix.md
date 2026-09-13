# Interview Recovery Matrix

Defines exactly how the real-time engine recovers from various failure modes.

| State | Failure | Recovery |
| --- | --- | --- |
| **Any Active** | WebSocket disconnect | Client retries with exponential backoff. Sends `STATE_SYNC_REQUEST`. Re-renders UI based on server's `stateVersion`. |
| **Any Active** | Browser Refresh | Client mounts, fetches session ID, connects to WebSocket, sends `STATE_SYNC_REQUEST`, restores state exactly. |
| **AI_SPEAKING** | TTS provider timeout/error | Fallback to UI text rendering. Do NOT permanently lock the microphone. Automatically transition to `CANDIDATE_READY`. |
| **CANDIDATE_SPEAKING** | STT failure | Use existing Whisper fallback. If both fail, gracefully notify candidate they must use text fallback or pause. |
| **PROCESSING** (submitting) | Worker crash / Timeout | Evaluation retry if safe. If duplicate submission occurs, server uses `(sessionId, questionId)` to idempotently return existing answer. |
| **EVALUATING** | API provider timeout | AIService retries automatically with backoff. If max retries hit, return safe default evaluation and advance. |
| **COMPLETED** | User hits "End" twice | Backend uses atomic `$set` and verifies state. Second request returns `Session already completed`. |
