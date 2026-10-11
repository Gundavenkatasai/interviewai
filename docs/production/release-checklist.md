# Interview AI — Production Release Checklist

**Version:** 2.0.0  
**Target Date:** October 11, 2026  
**Release Lead:** Release Engineering & QA  
**Target Environment:** Staging & Production (`interviewai.com`)  

---

## 1. Legal, Compliance & User Trust

- [x] **Privacy Policy Live:** Fully articulated Privacy Policy available at `/privacy` covering account data, resume processing, AI providers, data retention, user deletion rights, and contact details.
- [x] **Terms of Service Live:** Comprehensive Terms of Service available at `/terms` covering acceptable use, AI-generated content disclaimers, IP rights, and limitation of liability.
- [x] **User Consent Enforced:** Registration page enforces mandatory checkbox acknowledgement for Terms and Privacy Policy before account creation.
- [x] **Consent Version Tracked:** Backend stores `termsAcceptedVersion: "v2.0"` and `termsAcceptedAt` timestamp on user record.
- [x] **Footer Navigation Links:** Permanent, accessible footer links to `/privacy` and `/terms` rendered on public, auth, and dashboard pages.

---

## 2. Security, Authentication & Data Protection

- [x] **Multi-Tenant Authorization (Anti-IDOR):** Verified via `cross-user-authorization.test.ts` that User A cannot read, modify, or generate reports for User B's resources (returns HTTP 403 Forbidden).
- [x] **Fastify Helmet Configured:** Strict Content Security Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and Referrer Policy enabled.
- [x] **Production HSTS:** `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` configured in `app.ts`.
- [x] **Fail-Fast Secrets Validation:** Server halts startup in `NODE_ENV=production` if default secrets or weak credentials are detected.
- [x] **CORS Allowlist:** Origin reflection disabled; only explicitly configured production domains allowed.
- [x] **Rate Limiting:** IP and user-level throttling enabled on authentication endpoints (100 requests/minute).
- [x] **SSRF Sanitization:** External scraper and job query inputs validated against private IP and internal hostname traversal.
- [x] **Correlation IDs:** Fastify assigns unique `x-request-id` to every request for tracing.

---

## 3. SEO, Assets & Public Metadata

- [x] **Robots Configuration:** `robots.txt` placed in `public/` allowing landing page and public routes while disallowing private dashboards (`/dashboard`, `/resumes`, `/interviews`).
- [x] **Sitemap:** Clean `sitemap.xml` placed in `public/` referencing canonical indexable routes.
- [x] **Metadata & Open Graph:** `index.html` configured with descriptive titles, meta descriptions, canonical URLs, and Open Graph/Twitter card tags.
- [x] **Branding Assets:** Custom SVG favicon and 1200x630 Open Graph preview images (`og-image.png`, `og-image.jpg`) generated and linked.
- [x] **Custom 404 Routing:** Professional, glassmorphic 404 page (`NotFoundPage.tsx`) implemented with direct navigation back to Home and Dashboard.

---

## 4. Performance & Frontend Optimization

- [x] **Route-Level Code Splitting:** `App.tsx` routes converted to `React.lazy()` with `Suspense` loading fallbacks.
- [x] **Rollup Vendor Splitting:** Heavy libraries (Monaco editor, PDF.js, Superdoc, Recharts) separated into asynchronous chunks via `manualChunks`.
- [x] **Initial Bundle Reduction:** Initial JS payload reduced from ~2.45MB to ~198KB (gzip).
- [x] **Database Compound Indexes:** Mongoose schemas hardened with compound indexes for fast sorting and deduplication.
- [x] **Zero White-Screens:** Animated skeleton and spinner loaders implemented across all async data fetching views.

---

## 5. Operations, Probes & Disaster Recovery

- [x] **Liveness Probe:** `/health/live` returns HTTP 200 OK.
- [x] **Readiness Probe:** `/health/ready` validates live MongoDB connection ping before accepting traffic.
- [x] **Disaster Recovery Plan:** RPO (15 min) and RTO (30 min) documented with point-in-time snapshot procedures in `docs/deployment/backup-and-recovery.md`.
- [x] **Rollback Plan:** Step-by-step procedures documented for container image revert, CDN rollbacks, and schema safety in `docs/deployment/rollback-plan.md`.
- [x] **CI/CD Pipeline:** GitHub Actions workflow (`ci.yml`) validates TypeScript typecheck, Vitest unit tests, and production builds.

---

## 6. Pre-Launch Operational Checklist (External Blocker Verification)

- [ ] **DNS & TLS Certificate:** Verify production domain DNS points to production ingress with valid Let's Encrypt / Cloudflare SSL certificate.
- [ ] **Production Environment Secrets:** Populate live production `.env` using values defined in `docs/deployment/environment-matrix.md` (e.g. real MongoDB Atlas connection string, production JWT secret, and live AI provider keys).
- [ ] **External AI Provider Quotas:** Confirm Groq, OpenAI, and Gemini API keys have sufficient credit balance and rate limits for expected user concurrency.
- [ ] **Staging Smoke Drill:** Run final staging smoke tests using isolated test credentials prior to DNS cutover.
