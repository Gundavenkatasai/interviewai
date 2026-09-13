# Environment Matrix

| Variable | Target | Required | Secret | Description |
|---|---|---|---|---|
| `DATABASE_URL` | Backend | Yes | Yes | MongoDB Connection string. Must never be exposed to client. |
| `JWT_SECRET` | Backend | Yes | Yes | Used for signing auth tokens. |
| `GROQ_API_KEY` | Backend | Yes | Yes | AI Provider Key. Keep strictly on backend. |
| `PORT` | Backend | No | No | Defaults to 8001. |
| `NEXT_PUBLIC_API_URL` | Frontend | Yes | No | URL of the backend API (e.g., http://localhost:8001). |
| `NEXT_PUBLIC_WS_URL` | Frontend | Yes | No | WebSocket URL for interview streaming. |
| `CORS_ORIGINS` | Backend | Yes | No | Allowed frontend domains for CORS policy. |
