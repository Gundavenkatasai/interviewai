# Mock Interview Timer and Microphone Lifecycle

This document describes the strict state machine and lifecycle for the candidate microphone and answer timer during the AI Mock Interview.

## Core Principles

1. **Backend Authority**: The frontend microphone and timer strictly follow the backend state transitions (`AI_SPEAKING` -> `CANDIDATE_READY`).
2. **No Mic Leaks**: The candidate microphone is explicitly stopped when the AI is speaking.
3. **Accurate Timing**: The answer timer is built on absolute timestamps (`Date.now() - answerStartedAt`) to prevent browser throttling drift and accurately measure how long the candidate spoke.

## Lifecycle Diagram

```text
AI_SPEAKING
    ↓ (Mic: OFF, STT: OFF, Timer: STOPPED)
AI_AUDIO_COMPLETED (TTS onEnd)
    ↓ (Trigger CANDIDATE_READY event to backend)
CANDIDATE_READY
    ↓ (Mic: ON, STT: ON, Timer: START from 00:00)
    ↓ (Auto-transition to CANDIDATE_SPEAKING)
CANDIDATE_SPEAKING
    ↓ (Candidate answers, Timer: RUNNING)
ANSWER SUBMITTED
    ↓
PROCESSING
    ↓ (Mic: OFF, STT: OFF, Timer: STOPPED)
    ↓ (Capture duration)
EVALUATING
    ↓
GENERATING_NEXT
    ↓
AI_SPEAKING (Loop repeats)
```

## State Transitions

### `AI_SPEAKING`
- **Trigger**: New question generated and AI TTS begins.
- **Microphone**: Disabled/Muted.
- **Timer**: Stopped. UI displays `--:--`.
- **STT**: Recognition stopped.

### `CANDIDATE_READY`
- **Trigger**: AI TTS `onEnd` callback fires.
- **Action**: Frontend emits `CANDIDATE_READY` to the backend. Backend confirms and broadcasts state.
- **Microphone**: Enabled automatically.
- **Timer**: Timestamp `answerStartedAt` is captured. Timer UI begins counting up from `00:00`.
- **STT**: `recognition.start()` is called exactly once.

### `CANDIDATE_SPEAKING`
- **Trigger**: Candidate begins speaking (or auto-transitions from ready).
- **Microphone**: Remains enabled.
- **Timer**: Continues counting up based on `requestAnimationFrame` and `answerStartedAt`.

### `PROCESSING` (Answer Submission)
- **Trigger**: Silence detected or candidate manually submits.
- **Action**: `stopAnswer()` is called.
- **Microphone**: Stopped.
- **Timer**: Stopped.
- **Duration Capture**: The exact duration `(Date.now() - answerStartedAt) / 1000` is computed and sent to the backend as `duration_seconds`.

## Protection Mechanisms

- **Strict Mode Safe**: Handlers ensure idempotent transitions. 
- **Drift Protection**: `requestAnimationFrame` is used only for UI updates. The actual duration payload is computed using precise JS timestamps.
- **Audio Overlap**: Mic is strictly turned off during `AI_SPEAKING` to prevent the AI's own TTS output from feeding into the candidate's speech-to-text transcript.
