# Day 1 Mock Audit

*Search across codebase for dummy, placeholder, fake, mock.*

## Findings
1. **Resume ATS Tests:** Extensive use of `sampleResume`, `sampleProfile`, and hardcoded `sampleJob` strings in `scripts/test-resume-studio.ts` and `tests/resume-ats.test.ts`. This is **intentional test-only fallback** and is safe.
2. **Auto-Apply AI:** `auto-apply.service.ts` contains commented out code `// const tailoredResume = await ResumeService.tailor(userId, jobId);`. This is an **incomplete feature**, marked as placeholder for phase 18/19.
3. **Frontend Placeholders:** Setup forms (e.g. `SetupPage.tsx`) use hardcoded placeholder attributes (e.g. `placeholder="e.g. React Native Developer"`). This is standard UX.
4. **Overall Assessment:** No dangerous fake data or simulated scores are being sent to users in production endpoints. The AI responses are genuine calls to Groq.

## Action Plan
- Remove or complete the commented-out code in `auto-apply.service.ts` on Day 12.
- No immediate critical deletions required for launch.
