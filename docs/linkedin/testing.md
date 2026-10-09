# LinkedIn Testing Strategy & Verification Report

## 1. Test Architecture
The test suite covers unit, integration, and E2E boundaries:

1. **Unit Tests (`apps/api-node/tests/linkedin-service.test.ts`)**:
   - `UrlNormalizer` SSRF defense, blocked hosts, and canonical URL extraction.
   - `ContentHasher` SHA-256 fingerprinting.
   - `ProfileNormalizer` HTML tag stripping and prompt-injection neutralization.
   - `ProfileScorer` deterministic 14-section rubric evaluation, evidence attribution, and zero fabrication.
   - `HumanizerEngine` 4-pass stylometry transformation, tell-density reduction, and tell vocabulary replacement.
   - `PostAnalyzer` hook scoring, readability, and technical depth calculations.
   - `HookGenerator` 9 distinct formula styles.
   - `ProviderRegistry` registration, capability discovery, and circuit breaker trip/reset logic.

2. **Integration Tests (`apps/api-node/tests/linkedin-integration.test.ts`)**:
   - Upstream Python runtime and provider bridge diagnostics.
   - Fastify controller endpoints and Zod schema validations.
   - Recommendation approval/rejection lifecycle.
   - Draft creation, humanization, auditing, and publishing state machines.

3. **Production Build Validation**:
   - `apps/api-node`: `npm run typecheck` (TypeScript strict mode, 0 errors).
   - `apps/web`: `npm run build` (`tsc -b && vite build`, 0 errors, all 2674 modules transformed).
   - `apps/worker`: `npm run build` (`tsc`, 0 errors).

---

## 2. Test Execution Commands
```bash
# Run LinkedIn Unit Tests
cd apps/api-node && npx vitest run tests/linkedin-service.test.ts

# Run LinkedIn Integration Tests
cd apps/api-node && npx vitest run tests/linkedin-integration.test.ts

# Run Typecheck
cd apps/api-node && npm run typecheck

# Run Web Production Build
cd apps/web && npm run build
```
