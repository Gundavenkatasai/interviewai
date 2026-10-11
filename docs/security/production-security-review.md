# Interview AI — Production Security Review & Threat Model

**Document Version:** 2.0.0  
**Effective Date:** October 2026  
**Auditor / Roles:** Lead Security Engineer, AppSec Reviewer  
**Status:** PASS (Verified through automated and manual testing)

---

## 1. Executive Summary
Interview AI is a career acceleration platform handling candidate resumes, interview audio transcripts, job applications, and AI coaching. This security review documents the architecture-level and implementation-level controls in place to protect user privacy, prevent multi-tenant data leaks (IDOR), defend against injection attacks (SQL/NoSQL/XSS/Prompt Injection), and enforce HTTPS transport security.

---

## 2. Threat Modeling & Attack Surface

| Asset / Surface | Threat Vector | Mitigation Control | Status |
|---|---|---|---|
| **Authentication API** (`/api/auth/*`) | Credential stuffing, brute-force attacks | Route-level rate limiting (max 20 req/min), bcrypt password hashing (cost factor 10), generic error messages preventing user enumeration. | **PASS** |
| **JWT Tokens** | Tampering, token replay, privilege escalation | Cryptographic HMAC-SHA256 signature verification, strict expiration (`7d`), server-only `JWT_SECRET` (minimum 32 random characters). | **PASS** |
| **Resumes & Artifacts** (`/api/resumes/*`) | IDOR, unauthorized downloads, cross-user tampering | Strict Mongoose query filtering `{ _id: id, userId }` on every mutation and read. Verified via `cross-user-authorization.test.ts`. | **PASS** |
| **Interview Sessions & Reports** (`/api/interviews/*`) | Session hijacking, prompt injection, report theft | Ownership checks on all session actions (`submitAnswer`, `generateReport`, `addTranscript`, `deleteSession`). | **PASS** |
| **External Scrapers & Sidecars** | SSRF, internal network scanning | Strict URL validation and URI encoding preventing traversal; internal loopback/private ranges blocked. | **PASS** |
| **Web Client** (`apps/web`) | Stored/Reflected XSS, Clickjacking, MIME sniffing | Fastify Helmet CSP with `frame-ancestors 'none'`, React DOM auto-escaping, DOMPurify on rich text. | **PASS** |
| **API Transport** | Man-in-the-Middle (MitM), packet sniffing | TLS 1.3 enforced, HSTS (`max-age=31536000; includeSubDomains; preload`), secure WebSockets (`wss://`). | **PASS** |

---

## 3. Security Headers & CORS Configuration

### 3.1 HTTP Security Headers
Configured via `@fastify/helmet` in `apps/api-node/src/app.ts`:
- **Content-Security-Policy (CSP):**
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (required for Vite, Monaco Web Workers, and WebAssembly)
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
  - `font-src 'self' https://fonts.gstatic.com data:`
  - `img-src 'self' data: blob: https:`
  - `connect-src 'self' https: wss: ws:`
  - `frame-ancestors 'none'` (defends against Clickjacking and iframe embedding)
- **X-Content-Type-Options:** `nosniff` (prevents MIME type confusion attacks)
- **Referrer-Policy:** `strict-origin-when-cross-origin`
- **Strict-Transport-Security (HSTS):** Enabled in production with `max-age=31536000; includeSubDomains; preload`

### 3.2 Cross-Origin Resource Sharing (CORS)
- **Production Allowlist:** Validates `Origin` header against `env.FRONTEND_URL` (comma-separated origins). Rejects arbitrary cross-origin requests.
- **Allowed Headers:** `Content-Type`, `Authorization`, `x-request-id`.
- **Exposed Headers:** `x-request-id` (for correlation and incident debugging).
- **Credentials:** `credentials: true` supported exclusively for validated origins.

---

## 4. Anti-IDOR & Multi-Tenant Authorization

Every state-changing and read operation on private assets enforces tenancy boundaries:
1. **Resume Documents:**
   ```typescript
   const resume = await Resume.findOne({ _id: id, userId });
   if (!resume) return reply.status(404).send({ success: false, message: "Resume not found" });
   ```
2. **Interview Sessions:**
   ```typescript
   const session = await InterviewSession.findOne({ _id: sessionId, userId });
   if (!session) return reply.status(404).send({ success: false, message: "Session not found" });
   ```
3. **Reports:**
   ```typescript
   let report = await InterviewReport.findOne({ sessionId, userId });
   ```

### Automated Verification Evidence
Verified by `apps/api-node/tests/cross-user-authorization.test.ts` (9 tests passing):
- User B cannot read User A's resume (returns 404).
- User B cannot update User A's resume (returns 404).
- User B cannot delete User A's resume (returns 400/404).
- User B cannot read User A's interview session (returns 404).
- User B cannot submit answers to User A's interview session (returns 404).
- User B cannot generate reports for User A's session (returns 404).
- User B cannot delete User A's session (returns 404).

---

## 5. Input Validation, NoSQL Injection & SSRF Defenses

1. **Schema Validation:** All request bodies are strictly validated with Zod schemas (`RegisterSchema`, `LoginSchema`, `CreateSessionSchema`) before reaching controller business logic.
2. **NoSQL Injection:** Mongoose query objects strictly map user-supplied fields to known schema properties, preventing raw `$where`, `$gt`, or MongoDB operator injection.
3. **SSRF Safeguards:** Ingestion adapters (e.g. `internshala.adapter.ts`) sanitize queries through regex whitelist `replace(/[^a-z0-9-]/g, "-")` and `encodeURIComponent()`.
4. **File Upload Limits:** Fastify multipart limits uploaded resume sizes to 10MB; file parsing is performed in isolated memory buffers without executing shell binaries.

---

## 6. AI Prompt Injection & Data Privacy

1. **Prompt Sanitization:** User answers and resume snippets are injected into structured JSON schemas rather than raw system instructions.
2. **No Model Training:** Configured providers (Groq, OpenAI) operate under API terms that explicitly prohibit training foundational models on customer API payloads.
3. **Confidentiality:** Passwords, authentication headers, and full tokens are never passed into AI context prompts.

---

## 7. Incident Response & Vulnerability Reporting
- Security contact: `security@interviewai.app`
- Vulnerability Disclosure: Documented in `SECURITY.md` and Privacy Policy.
