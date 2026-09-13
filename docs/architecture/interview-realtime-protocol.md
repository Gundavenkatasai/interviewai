# Interview Realtime Protocol

This document outlines the strict schema and event types for the real-time WebSocket protocol used in the Interview AI platform.

## Client -> Server Envelope
Every message sent from the client must adhere to this structure:
```ts
{
  eventId: string; // Unique ID for this specific event to allow server deduplication
  type: string; // The specific event type (e.g., 'CANDIDATE_READY')
  interviewId: string; // The session ID
  timestamp: string; // ISO 8601
  payload: any;
}
```

## Server -> Client Envelope
Every message sent from the server must adhere to this structure:
```ts
{
  sequence: number; // Monotonically increasing sequence number for this interview connection
  type: string; 
  timestamp: string;
  correlationId?: string; // Links this server response to a specific client eventId or operation
  payload: any;
}
```

## Core Events

### Connection & Synchronization
- **`CONNECT` (C->S)**: Initial handshake validation.
- **`STATE_SYNC_REQUEST` (C->S)**: Sent upon connection or reconnect to get authoritative state.
- **`STATE_SYNC_RESPONSE` (S->C)**: Contains `currentState`, `currentQuestion`, `stateVersion`, and `lastSequence`.
- **`PING` (C->S) / `PONG` (S->C)**: Heartbeat mechanism.

### Interview Flow
- **`INTERVIEW_STATE` (S->C)**: Broadcasts state transitions (e.g., `SETUP` -> `READY`). Includes `stateVersion`.
- **`CANDIDATE_READY` (C->S)**: Candidate signals they are ready for the AI to speak.
- **`AI_SPEAKING_STARTED` (S->C)**: Server signals TTS is active.
- **`CANDIDATE_SPEAKING_STARTED` (C->S)**: Client signals microphone activity.
- **`TRANSCRIPT_PARTIAL` (C->S)**: Interim speech text.
- **`TRANSCRIPT_FINAL` (C->S)**: Final chunk of speech text.

### Errors
- **`ERROR` (S->C)**: Protocol errors (e.g., `INVALID_EVENT`, `UNAUTHORIZED`, `RATE_LIMITED`).
