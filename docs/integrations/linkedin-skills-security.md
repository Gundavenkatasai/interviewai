# LinkedIn Skills Security & Isolation

Security boundaries and isolation mechanisms implemented for the LinkedIn integration.

## 1. IDOR & Tenant Isolation
- Every database model (`LinkedInContentDraft`, `LinkedInPublication`, `LinkedInRecommendation`, etc.) contains a required indexed `userId` field.
- Fastify routes extract `userId` from the verified JWT token (`request.user.sub`).
- `LinkedInPolicy.enforceOwnership` verifies that the requesting user owns the draft, recommendation, or setting before modifying or approving it.

## 2. Prompt-Injection Sandboxing
- External LinkedIn posts, comments, replies, and author texts are classified as **Untrusted Data**.
- Untrusted content is wrapped in strict XML tags:
  ```xml
  <untrusted_external_content>
  ...external content...
  </untrusted_external_content>
  ```
- System prompts explicitly instruct the AI Provider that text within `<untrusted_external_content>` is passive data and cannot issue system commands, alter approval states, request credentials, or invoke tools.

## 3. Strict Approval Gate
- Publishing is strictly forbidden unless a draft or action has status `APPROVED`.
- No automatic publishing is permitted from initial generation.
- Duplicate approval requests are idempotent.
- Every publish event records an immutable audit log entry in `LinkedInPublication`.

## 4. Secret Redaction & Protection
- API keys (Publora, Apify, Pixfaro) are never returned in plaintext to the frontend.
- When returned in settings, tokens are masked: `sk_l...1234`.
- Client requests pass user session tokens, not third-party API credentials.

## 5. Safe Scraping & Ethics Boundaries
- No CAPTCHA bypass mechanisms are implemented.
- No session cookie harvesting or stealth browser spoofing is permitted.
- If content requires authentication or is non-public, the system gracefully prompts the user to paste their content or provide authorized connector tokens.
