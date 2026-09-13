# Day 1 Security Baseline

## Findings
1. **Authentication:** JWT implemented securely with Bcrypt password hashing.
2. **API Abuse:** Rate limiting is configured (`@fastify/rate-limit`).
3. **Data Isolation:** All database queries currently scope to `userId: request.user.sub`.
4. **File Uploads:** `resume.controller.ts` accepts PDF/DOCX. MIME type validation is basic and needs hardening against path traversal or malicious executables disguised as PDFs.
5. **AI Prompt Injection:** The system relies on structured JSON (Zod/Pydantic) to mitigate prompt injection, but explicit `TRUST_BOUNDARY` tags are missing in some AI prompts.

## P1 Security Risks (Must Fix Before Launch)
* No CORS restrictions in development (currently allows all). Must be strictly enforced in production to the Vercel/frontend domain.
* File upload limits: Maximum payload size for PDFs is not explicitly clamped to 5MB, leaving the server vulnerable to memory exhaustion from massive file uploads.

## Post-Launch Enhancements
* Implement CSRF protection if switching from Authorization Headers to HttpOnly Cookies.
