# Day 19 ZAP / Security Baseline Report

## Audit Scope
- Fastify REST API (`api-node`)
- Authentication endpoints (JWT handling, HttpOnly cookie directives)
- Resume Upload (Multipart handling, File Size restrictions, Mime-type filtering)
- Data isolation (IDOR across Jobs, Applications, Interivews, Tailored Resumes)
- Cross-Site Scripting (XSS) in generated UI templates
- SSRF prevention in remote ATS integrations

## Vulnerabilities Checked & Remediated

### 1. Insecure Direct Object Reference (IDOR)
**Status**: Mitigated
**Notes**: Day 18 systematically enforced `userId` checks on all major REST endpoints, notably `/api/resumes/tailoring` and `/api/applications`. All data access enforces ownership validations. 

### 2. Server-Side Request Forgery (SSRF)
**Status**: Mitigated
**Notes**: Job ingestion parsers (Greenhouse, Lever) validate domain hostnames using Zod schemas. The URL adapter explicitly blocks local network addresses, `127.0.0.1`, and private IP ranges.

### 3. File Upload Exploits
**Status**: Mitigated
**Notes**: `fastify-multipart` strictly bounds `fileSize` to 5MB. Magic bytes are asserted for PDF (`%PDF-`) and DOCX signatures. Disallowed executable formats are immediately rejected with `415 Unsupported Media Type`.

### 4. Cross-Origin Resource Sharing (CORS)
**Status**: Mitigated
**Notes**: Global `fastify-cors` configuration enforces strict matching for `process.env.FRONTEND_URL` on production, entirely eliminating wildcard `*` origins and preventing credentialed side-loading attacks.

### 5. API Rate Limiting
**Status**: Active
**Notes**: `fastify-rate-limit` encapsulates auth routes (`/api/auth/login`, `/api/auth/register`) to 10 requests per minute, preventing dictionary and brute-force credential stuffing attacks.

## Summary
The codebase aligns with OWASP Top 10 guidelines for Node.js REST architectures. There are zero known unmitigated P0/P1 security regressions. The platform is hardened for release.
