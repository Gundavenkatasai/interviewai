# Environment Variables Matrix

| Variable | Required in Prod? | Default (Dev) | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Environment mode (`development`, `production`, `test`) |
| `PORT` | No | `3000` | The port the Fastify server binds to |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017` | MongoDB connection string. MUST NOT be empty or default in production. |
| `MONGODB_DB_NAME` | No | `applyhustle` | Database name to use |
| `JWT_SECRET` | Yes | *Insecure Default* | Secret for signing JWTs. MUST be explicitly set to a strong value in production. |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiration time |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Allowed CORS origin. MUST NOT be empty or localhost in production. |
| `QWEN_BASE_URL` | No | None | Base URL for Qwen AI provider |
| `QWEN_API_KEY` | No | None | API Key for Qwen AI provider |
| `GROQ_API_KEY` | No | None | API Key for Groq AI provider |
| `REDIS_URL` | No | None | Optional Redis connection string for distributed queues (planned) |

## Production Constraints
- If `NODE_ENV=production`, startup will **fail** if `MONGODB_URI`, `JWT_SECRET`, or `FRONTEND_URL` are missing or set to insecure defaults.
- Always use a secure secret manager (e.g., AWS Secrets Manager, Doppler, Vault) to inject these values at runtime.
