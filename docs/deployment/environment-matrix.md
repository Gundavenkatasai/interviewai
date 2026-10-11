# Interview AI — Comprehensive Environment Matrix

## Overview
This document classifies all environment variables across Interview AI services, defining scope (Server-only vs. Public/Client), confidentiality level, startup validation requirements, fail-fast behavior, and safe reference examples.

---

## 1. Master Variable Classification Table

| Variable Name | Scope | Required in Prod | Secret? | Default (Dev) | Validation Rule | Purpose & Notes |
|---|---|---|---|---|---|---|
| `NODE_ENV` | Backend / All | Yes | No | `development` | `enum("development", "test", "production")` | Controls error detail exposure, logging verbosity, HSTS enforcement, and security constraints. |
| `PORT` | Backend | No | No | `8001` | Integer (1 - 65535) | HTTP listening port for Fastify API process. Defaults to 8001. |
| `FRONTEND_URL` | Backend | Yes | No | `http://localhost:5173` | Comma-separated list of valid URL origins | CORS allowlist for client origins and secure redirect validation. Rejects wildcard in prod. |
| `MONGODB_URI` | Backend | Yes | **YES** | `mongodb://localhost:27017` | Valid MongoDB connection URI | Main database connection string. Server-only. Must use TLS/SRV replica set in prod. |
| `MONGODB_DB_NAME` | Backend | Yes | No | `applyhustle` / `interviewai_production` | Non-empty string | Target MongoDB database name. |
| `JWT_SECRET` | Backend | Yes | **YES** | *None in prod* | String, min 32 chars, cannot be default | High-entropy cryptographic key for signing JWT bearer tokens. Server-only. |
| `JWT_EXPIRES_IN` | Backend | No | No | `7d` | String duration (e.g. `7d`, `24h`) | Token lifespan before re-authentication or refresh. |
| `GROQ_API_KEY` | Backend | Optional* | **YES** | None | Starts with `gsk_` | Groq Cloud speech transcription (Whisper) and fast inference. Server-only. |
| `OPENAI_API_KEY` | Backend | Optional* | **YES** | None | Starts with `sk-` | OpenAI LLM models (GPT-4o) and text embeddings. Server-only. |
| `ANTHROPIC_API_KEY` | Backend | Optional* | **YES** | None | Starts with `sk-ant-` | Anthropic Claude API for advanced reasoning and interview debriefs. Server-only. |
| `GEMINI_API_KEY` | Backend | Optional* | **YES** | None | String | Google Gemini API integration for career analysis. Server-only. |
| `APIFY_TOKEN` | Backend | Optional* | **YES** | None | Starts with `apify_api_` | Apify Actor token for background job ingestion scrapers. Server-only. |
| `REDIS_URL` | Backend | Optional | **YES** | None | Valid Redis URI (`redis://...`) | BullMQ queue worker and session caching backend. Server-only. |
| `VITE_API_URL` | Frontend (Client) | Yes | **NO (Public)** | `http://localhost:8001` | Valid HTTP/HTTPS URL | Public REST API base URL accessed by browser client. Exposed in client bundle. |
| `VITE_WS_URL` | Frontend (Client) | Yes | **NO (Public)** | `ws://localhost:8001` | Valid WS/WSS URL | Public WebSocket endpoint for real-time interview rooms. Must use `wss://` in prod. |

*\*At least one LLM API key (`GROQ_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `QWEN_API_KEY`) is required for AI mock interviews and ATS tailoring.*

---

## 2. Environment Isolation & Separation

### Development (`NODE_ENV=development`)
- Uses local MongoDB (`mongodb://127.0.0.1:27017/applyhustle`).
- Relaxed rate limiting (10,000 requests/minute).
- Full stack traces included in API error responses for debugging.
- CORS reflects localhost origins (`http://localhost:5173`, `http://127.0.0.1:5173`).

### Testing (`NODE_ENV=test`)
- In-memory or isolated test database (`applyhustle_test`).
- Mock adapters used where external network access is undesirable.
- Test suites clean up created fixtures in `beforeAll` / `afterAll`.
- Deterministic mock timestamps and isolated ports.

### Staging (`NODE_ENV=production`)
- Mirrors production infrastructure exactly.
- Dedicated staging MongoDB cluster with automated snapshots.
- Public URL: `https://staging.interviewai.app`.
- Valid TLS certificates and strict security headers enforced.

### Production (`NODE_ENV=production`)
- Fail-fast startup: Node process immediately terminates if `MONGODB_URI`, `JWT_SECRET`, or `FRONTEND_URL` is missing or insecure.
- Default `super_secret_jwt_key_change_in_production` string is strictly rejected.
- Stack traces stripped from all error responses; returns sanitized `{ success: false, error: { code, message, requestId } }`.
- HSTS enforced (`max-age=31536000; includeSubDomains; preload`).
- CSP enforced (`frame-ancestors 'none'`, secure origins only).

---

## 3. Secret Leakage Safeguards
1. **Never commit `.env` or `.env.local`**: Root `.gitignore` explicitly excludes all `.env` files except `.env.example`.
2. **Never prefix server secrets with `VITE_`**: Vite embeds all `VITE_*` variables directly into public JavaScript bundles. Only public API base URLs are permitted to have the `VITE_` prefix.
3. **Redaction in Structured Logs**: Fastify and Pino loggers must redact `authorization` headers, passwords, and full token bodies.
