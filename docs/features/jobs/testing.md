# Testing Specification & Verification Report

## Test Suites Overview
The Jobs discovery system is verified by a multi-tier test matrix:

1. **Production Hardening Vitest Suite** (`apps/api-node/tests/jobs-production-hardening.test.ts`):
   - Canonical source invariants (no `MockSource`, strict source isolation).
   - Critical regression test matrix (8 sources selected).
   - Geographic India-only filters and remote work mode verification.
   - Deterministic pagination (zero duplicate jobs between page 1 and page 2).
   - Idempotent save, unsave, and view tracking.
   - Source capabilities registry validation.

2. **Load & Concurrency Benchmark**:
   - 1,000 concurrent requests across diverse search and filter dimensions.
   - 100% success rate with 117.8 req/sec throughput and p95 under 1s.

3. **Frontend Compilation & Typecheck**:
   - `npm run build` (`tsc -b && vite build`) passing with zero errors.
