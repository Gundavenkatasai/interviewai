# Mock Interview — Current Lifecycle Audit

## Architecture Overview

### Frontend Files
| File | Role |
|------|------|
| `hooks/useInterviewRoom.ts` | Single authoritative turn controller (state machine, TTS, STT, mic, timer, WS) |
| `pages/InterviewRoomPage.tsx` | UI layer — renders state, dispatches user actions |
| `services/TTSProvider.ts` | WebSpeechTTSProvider with watchdog, keep-alive, GC protection |
| `hooks/useWebSocket.ts` | Stable WS connection with reconnect |
| `hooks/useMediaDevices.ts` | Camera/mic permission management |

### Backend Files
| File | Role |
|------|------|
| `interview.controller.ts` | Question bank + AI generation, answer submission, evaluation |
| `interview.model.ts` | InterviewSession, InterviewQuestion, CandidateAnswer schemas |
| `websocket/handlers.ts` | WS event routing, state sync, duplicate deduplication |

---

## Actual Runtime Lifecycle

```
1. User navigates to /interview/:id
   → InterviewRoomPage mounts
   → ApiClient.getInterview() loads session (includes questions[])
   → MediaSetup shown

2. MediaSetup
   → requestPermissions() → getUserMedia() → videoStream + audioStream
   → User clicks "Start Interview"
   → onPermissionsGranted() → setSetupComplete(true)

3. SETUP → READY
   → useEffect detects setupComplete + session loaded
   → setReady() → state = 'READY'
   → useEffect(session, state) fires → loads currentQuestion from session.questions[0]
   → Stores text in pendingSpeakRef
   → State stays 'READY' — Begin Interview button shown

4. User clicks "Begin Interview" (USER GESTURE — critical for Chrome TTS)
   → beginInterview() → speakQuestion(text, questionId) called DIRECTLY in onClick
   → setState('AI_SPEAKING')
   → setMic(false) — mic OFF immediately
   → STT stopped
   → ttsRef.current.synthesize(text) → window.speechSynthesis.speak()
   → Chrome allows because called from user gesture

5. TTS lifecycle
   → utterance.onstart fires → setIsAiSpeaking(true) [already AI_SPEAKING]
   → Keep-alive interval prevents Chrome 14s pause
   → Watchdog timer prevents infinite hang
   → utterance.onend fires → tts.onEnd callback

6. TTS completion → CANDIDATE_READY
   → tts.onEnd: setState('CANDIDATE_READY'), setIsAiSpeaking(false)
   → sendEvent('CANDIDATE_READY') to backend

7. Auto-start mic (useEffect [state])
   → state === 'CANDIDATE_READY' triggers
   → autoStartGuardRef prevents double-fire
   → setTimeout(100ms) to let TTS stop() complete
   → startAnswer() called:
     - setState('CANDIDATE_SPEAKING')
     - setMic(true) — mic ON
     - recognition.start() — STT ON
     - answerStartedAt = Date.now()
     - setTimeLeft(maxAnswerSeconds)

8. Countdown (useEffect [state], only when CANDIDATE_SPEAKING)
   → rAF tick loop
   → elapsed = (Date.now() - answerStartedAt) / 1000
   → remaining = maxAnswerSeconds - elapsed
   → setTimeLeft(ceil(remaining)) — UI updates
   → On silence (5s no STT) or timeout → stopAnswer()

9. Answer submission
   → stopAnswer() (from user click OR silence/timeout)
   → setState('PROCESSING')
   → setMic(false), STT stopped
   → collectTranscript (finalTranscriptRef + liveTranscriptRef)
   → ApiClient.submitAnswer() → backend evaluates

10. Next question
    → ApiClient.getNextQuestion() → returns next question or {complete: true}
    → If complete: setState('COMPLETED') → navigate to /report
    → If next: setCurrentQuestion(qObj)
    → speakQuestion(text, id) — called from Promise chain (originated from user gesture)
    → Loop back to step 4

11. Interview completion
    → setState('COMPLETED')
    → navigate('/report/${sessionId}')
```

---

## Root Causes Found and Fixed

### Bug 1: AI Not Speaking (Chrome Autoplay Policy)
**Root cause**: `speakQuestion()` was called from `useEffect` — multiple async cycles away from user gesture.
Chrome's autoplay policy silently blocks `speechSynthesis.speak()` when not in user gesture context.

**Fix**: Show "Begin Interview" button in READY state. User click directly calls `speakQuestion()`.
For subsequent questions, called from Promise chain that originates from user gesture (stopAnswer click).

### Bug 2: Infinite Re-render Loop (Maximum update depth exceeded)
**Root cause**: `useEffect([state, startAnswer])` — `startAnswer` was a new function reference on every render (its deps `sendEvent`, `muteMic` changed). Effect re-ran infinitely.

**Fix**: Auto-start effect only has `[state]` in deps. `startAnswer` accessed via `startAnswerRef.current`.
All other callbacks use the ref pattern — no function references in effect deps.

### Bug 3: Timer Not Visible
**Root cause**: `CountdownRing` only rendered in `CANDIDATE_SPEAKING`, but transition goes `CANDIDATE_READY → CANDIDATE_SPEAKING` near-instantly. Timer appeared to never show.

**Fix**: `timerShouldRun` derived from `CANDIDATE_READY || CANDIDATE_SPEAKING`. `CountdownRing` shown in both.

### Bug 4: AI Audio Entering STT
**Root cause**: STT was running during `AI_SPEAKING` state.
**Fix**: STT `onresult` handler checks `stateRef.current === 'AI_SPEAKING'` and returns early.

### Bug 5: Duplicate TTS Completions
**Root cause**: `tts.onEnd` could theoretically fire after state already left `AI_SPEAKING`.
**Fix**: `setState(prev => prev !== 'AI_SPEAKING' ? prev : 'CANDIDATE_READY')` — functional update ignores stale events.

### Bug 6: Stale `sendEvent` in PING handler
**Root cause**: `handleWsEvent` closed over stale `sendEvent` from WebSocket hook.
**Fix**: `sendEventRef.current` — always reads the latest `sendEvent` without deps.

---

## State Machine

```
SETUP ──setReady()──→ READY ──beginInterview()──→ AI_SPEAKING
                                                       │
                                              TTS onEnd/onError
                                                       │
                                              CANDIDATE_READY ──autoStartGuard──→ CANDIDATE_SPEAKING
                                                                                         │
                                                                              stopAnswer() / silence / timeout
                                                                                         │
                                                                                    PROCESSING
                                                                                         │
                                                                              ApiClient.submitAnswer()
                                                                                         │
                                                                                    EVALUATING
                                                                                         │
                                                                              ApiClient.getNextQuestion()
                                                                                         │
                                                                                  GENERATING_NEXT
                                                                                         │
                                                                              speakQuestion() / COMPLETED
                                                                                         │
                                                                                    AI_SPEAKING ──→ (repeat)
```
