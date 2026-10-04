# Contributing to Interview AI

Thank you for contributing to Interview AI! We welcome community contributions, bug reports, and enhancements.

## Monorepo Architecture

The repository follows a clean, modular monorepo structure:

- `apps/`
  - `web`: React/Vite Frontend Application.
  - `api-node` (alias `api`): Fastify Backend API with domain-driven modules.
  - `worker`: Background job processors (BullMQ).
  - `realtime`: WebSocket streaming gateway.
- `packages/`
  - `contracts`: Shared network schemas (Zod).
  - `types`: Cross-boundary TypeScript definitions.
  - `ui`: Presentation design system components.
  - `api-client`: Typed frontend client.
  - `validation`: Sanitization and security helpers.
  - `logger`: Structured logging.
  - `observability`: Metrics and correlation tracking.
  - `config`: Environment loader.
  - `testing`: Shared test fixtures and mocks.
- `services/`
  - `ai`: Multi-provider AI abstraction, prompts, and circuit breakers.
  - `job-ingestion`: Job adapters, normalizer, and deduplication.
  - `document-processing`: DOCX OOXML and PDF parsing/rendering engines.
  - `linkedin-skills`: Autonomous LinkedIn agent integration.
  - `jobspy-sidecar`: Python scraper microservice.

## Development Workflow

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development servers:
   ```bash
   npm run dev:api  # Backend on port 8001
   npm run dev:web  # Frontend on port 5173
   ```
3. Run tests before submitting a Pull Request:
   ```bash
   npm test
   ```

## Architectural Guidelines
- Respect dependency boundaries documented in `docs/architecture/dependency-rules.md`.
- Never import backend database models directly in `apps/web`.
- Never commit secrets or credentials.
