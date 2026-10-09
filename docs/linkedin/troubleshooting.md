# LinkedIn Operational Troubleshooting & Failure Recovery

## 1. Common Operational Scenarios & Diagnostic Actions

### Scenario 1: `AuthWallError` or "LinkedIn Sign-In Wall Detected"
- **Cause**: LinkedIn guest view returned an authentication barrier or CAPTCHA redirect for the requested public URL.
- **Diagnostic Step**: Check `ProviderRegistry.getHealth("public_guest")` latency and failure counters.
- **Resolution**:
  1. Switch to the `manual_input` provider in the top scanner and paste the candidate's profile text or About section.
  2. If using `playwright_browser`, verify that page navigation timeout is set to 15,000ms and that user agent headers are current.

### Scenario 2: Circuit Breaker Open (`CircuitBreakerOpenError`)
- **Cause**: Provider encountered 5 consecutive network or parsing failures within the last 60 seconds.
- **Diagnostic Step**: Review logs in `apps/worker` or Fastify console for rolling error status.
- **Resolution**:
  1. The circuit breaker automatically resets to `HALF_OPEN` after 60 seconds.
  2. In Settings, select `manual_input` to bypass the external network provider entirely while the circuit resets.

### Scenario 3: Missing Metrics in Analytics Tab
- **Cause**: Private post metrics (impressions, private follower demographics) cannot be observed via public guest mode.
- **Resolution**: This is intended behavior. The platform strictly enforces zero fake data. Untracked private fields display `"Data unavailable"` rather than synthetic placeholders.

### Scenario 4: Browser Automation Out of Memory
- **Cause**: Too many parallel page allocations.
- **Resolution**: `BrowserService` bounds concurrency to 2 contexts. If Chromium stalls, invoke `BrowserService.shutdown()` to recycle the browser process.
