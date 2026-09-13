# Interview State Invariants

The following rules are absolute constraints on the interview engine to prevent data corruption.

1. **Server Authority**: The server is the exclusive owner of the authoritative interview state (`stateVersion`). The client only mirrors what the server broadcasts.
2. **Monotonic Versioning**: `stateVersion` strictly increases. The client must never apply a payload if the server's `stateVersion` is less than what it currently holds.
3. **Sequence Ordering**: Event sequences must not regress.
4. **Unique Answer Per Turn**: A single interview turn (`sessionId` + `questionId`) can produce at most ONE persisted `CandidateAnswer`.
5. **No Resurrecting Completed Interviews**: Once the interview transitions to `COMPLETED`, it cannot return to an active state (`READY`, `PROCESSING`, etc.). Any in-flight evaluation callbacks must be safely ignored.
6. **No Duplicate Transitions**: The `completeSession` and `submitAnswer` actions are atomic. Concurrent requests to the same endpoint must yield the same resulting state and exactly ONE downstream side-effect (e.g., generating ONE debrief).
7. **Idempotency**: All mutating actions must be safely repeatable in the event of a network blip without producing double-data.
