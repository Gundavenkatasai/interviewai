# Technical Debt Register

| ID | Area | Problem | Severity | Impact | Fix Day | Status |
|---|---|---|---|---|---|---|
| TD-01 | Architecture | `README.md` references Python/FastAPI but codebase is Node/Fastify. Causes developer confusion. | P1 | High (Onboarding) | Day 18 | Open |
| TD-02 | AI | Direct Groq SDK calls scattered across services instead of a unified `AIProvider` factory. | P1 | High (Maintainability) | Day 3 | **Resolved** |
| TD-03 | Database | Missing `source` and `verificationStatus` on Candidate facts (No Provenance model). | P0 | Critical (Data Integrity) | Day 2 | **Resolved** |
| TD-04 | Security | File uploads lack strict 5MB limits and deep MIME validation. | P1 | High (Security) | Day 18 | Open |
| TD-05 | Testing | No E2E tests for the frontend interview WebSocket flow. | P1 | High (Reliability) | Day 19 | Open |
| TD-06 | Build | `npm run test` uses Windows-incompatible `&&` in package.json scripts. | P2 | Medium (DX) | Day 18 | Open |
| TD-07 | UX | Error states and loading spinners are inconsistent across Job and Application pages. | P2 | Medium (UX) | Day 6 | Open |
| TD-08 | Features | Auto-Apply feature is heavily stubbed and commented out. | P1 | High (Feature Gap) | Day 12 | Open |
