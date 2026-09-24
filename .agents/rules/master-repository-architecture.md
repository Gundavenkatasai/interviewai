# INTERVIEW AI — MASTER REPOSITORY ARCHITECTURE & DEVELOPMENT RULES

This rule is mandatory for all development across this repository.

1. Inspect existing architecture before creating or modifying code.
2. Monorepo Structure:
   - `apps/api-node` (or `apps/api`): Domain-driven backend modules under `src/modules/`
   - `apps/web`: Feature-oriented frontend under `src/pages/` and `src/features/`
   - `services/`: Isolated external services (`agent-reach`, `jobspy-sidecar`, `linkedin-skills`, `document-intelligence`)
   - `packages/`: Shared packages (`shared-types`, `validation`, `ai-contracts`, `ui`, `utils`)
   - `docs/`: Architecture, feature specs, legal, roadmap
3. AI Architecture: Centralized in `apps/api-node/src/ai/`. Never invoke LLMs directly from feature business logic.
4. Adapter Pattern: Isolate all third-party and open-source integrations behind interfaces/adapters.
5. No Code Duplication: Always search first. Reuse -> Extend -> Refactor.
6. Real Data Only: No fake/mock data in production functionality.
7. Security: Zero secret leaks. No `.env` commits. Proper authentication, input validation, and IDOR protection on every route.
8. Git Standards: Meaningful conventional commits.
9. Pre-Feature Protocol: When given a new feature, always perform the 11-point inspection report before writing code.
10. Final Verification Checklist: Typecheck, tests, production build, security check before marking complete.
