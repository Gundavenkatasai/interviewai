# Mock Interview — State Transition Table

> Single source of truth for the Mock Interview state machine.
> All state transitions MUST go through `useInterviewRoom.ts`.

## State Contract

| State | Mic | STT | Timer | AI Audio | Description |
|-------|-----|-----|-------|----------|-------------|
| SETUP | OFF | OFF | STOP | OFF | Before permissions granted |
| READY | OFF | OFF | STOP | OFF | Question loaded, waiting for user to click Begin |
| AI_SPEAKING | OFF | OFF | STOP | ON | TTS playing question |
| CANDIDATE_READY | ON | ON | START | OFF | AI finished, auto-starting candidate turn |
| CANDIDATE_SPEAKING | ON | ON | RUN | OFF | Candidate answering (timer running) |
| PROCESSING | OFF | OFF | STOP | OFF | Submitting answer to backend |
| EVALUATING | OFF | OFF | STOP | OFF | Backend evaluating answer |
| GENERATING_NEXT | OFF | OFF | STOP | OFF | Fetching next question from AI |
| COMPLETED | OFF | OFF | STOP | OFF | Interview finished |
| ERROR | OFF | OFF | STOP | OFF | Unrecoverable error |

## Transition Table

| Current State | Event | Next State | Mic | STT | Timer |
|---------------|-------|------------|-----|-----|-------|
| SETUP | `setReady()` called | READY | OFF | OFF | STOP |
| READY | `beginInterview()` click | AI_SPEAKING | OFF | OFF | STOP |
| READY | No questions, fetching | GENERATING_NEXT | OFF | OFF | STOP |
| GENERATING_NEXT | Question fetched | READY | OFF | OFF | STOP |
| AI_SPEAKING | `tts.onEnd` fires | CANDIDATE_READY | ON→ | ON→ | START→ |
| AI_SPEAKING | `tts.onError` fires | CANDIDATE_READY | ON→ | ON→ | START→ |
| AI_SPEAKING | `skipQuestion()` | EVALUATING | OFF | OFF | STOP |
| CANDIDATE_READY | `startAnswer()` auto-called | CANDIDATE_SPEAKING | ON | ON | RUN |
| CANDIDATE_SPEAKING | `stopAnswer()` (user click) | PROCESSING | OFF | OFF | STOP |
| CANDIDATE_SPEAKING | Silence timeout (5s) | PROCESSING | OFF | OFF | STOP |
| CANDIDATE_SPEAKING | Answer time limit | PROCESSING | OFF | OFF | STOP |
| CANDIDATE_SPEAKING | `skipQuestion()` | EVALUATING | OFF | OFF | STOP |
| PROCESSING | `submitAnswer()` API success | EVALUATING | OFF | OFF | STOP |
| EVALUATING | `getNextQuestion()` → next | GENERATING_NEXT | OFF | OFF | STOP |
| EVALUATING | `getNextQuestion()` → complete | COMPLETED | OFF | OFF | STOP |
| GENERATING_NEXT | `speakQuestion()` | AI_SPEAKING | OFF | OFF | STOP |
| GENERATING_NEXT | Interview complete | COMPLETED | OFF | OFF | STOP |
| ANY | `endInterview()` | COMPLETED | OFF | OFF | STOP |
| PROCESSING | HTTP 409 (duplicate) | (stays, advances) | OFF | OFF | STOP |

## Guard Conditions

| Guard | Description |
|-------|-------------|
| `autoStartGuardRef` | Prevents `startAnswer()` from firing twice on `CANDIDATE_READY` |
| `isSubmittingRef` | Prevents duplicate `submitAnswer()` calls |
| `currentSpeakingQuestionId` | Validates TTS completion belongs to current question |
| `stateRef.current !== 'AI_SPEAKING'` | Functional setState update — ignores stale TTS completions |
| STT `onresult` guard | Drops STT results when `stateRef.current === 'AI_SPEAKING'` |
| HTTP 409 handling | Treats duplicate submission as success (idempotent) |

## Timer Specification

- **Source of truth**: `answerStartedAt` timestamp (`Date.now()`)
- **Display**: `timeLeft = maxAnswerSeconds - (Date.now() - answerStartedAt) / 1000`
- **Update**: `requestAnimationFrame` loop (browser-accurate, tab-aware)
- **Auto-submit triggers**:
  - `timeLeft <= 0` (hard limit)
  - Silence for `>= 5000ms` after `>= 3s` of speaking

## Microphone Specification

- Controlled via `audioStream.getAudioTracks().forEach(t => t.enabled = bool)`
- Browser permission is NOT revoked — only track.enabled toggled
- `setMic(true)` → track.enabled = true
- `setMic(false)` → track.enabled = false
- Idempotent: calling multiple times is safe

## WebSocket Events

| Direction | Event | When |
|-----------|-------|------|
| Client → Server | `AI_SPEAKING_STARTED` | TTS onStart |
| Client → Server | `CANDIDATE_READY` | TTS onEnd |
| Client → Server | `CANDIDATE_SPEAKING_STARTED` | startAnswer() |
| Client → Server | `STATE_SYNC_REQUEST` | WS connected |
| Client → Server | `PONG` | On PING |
| Server → Client | `STATE_SYNC_RESPONSE` | On sync request |
| Server → Client | `INTERVIEW_STATE` | On state change |
| Server → Client | `PING` | Keepalive |
| Server → Client | `ERROR` | On protocol error |
