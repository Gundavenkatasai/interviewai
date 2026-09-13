# Interview AI Threat Model (Day 18 Hardening)

## Overview
This document outlines the threats identified and mitigated during Day 18 (Production Hardening & Security). The focus was on application-level vulnerabilities before moving to infrastructure deployment.

## 1. Insecure Direct Object Reference (IDOR)
- **Threat**: A user could access, modify, or delete resources belonging to another user by guessing or enumerating IDs (e.g., `Resume`, `JobApplication`, `PipelineRun`).
- **Mitigation**: All database queries for user-owned resources have been updated to scope queries using both `_id` and `userId` (e.g., `Model.findOne({ _id: id, userId })`). 

## 2. Server-Side Request Forgery (SSRF)
- **Threat**: Job ingestion adapters fetching external URLs based on user input (e.g., `companyName`) could be manipulated to access internal services or arbitrary endpoints.
- **Mitigation**: The `greenhouse.adapter.ts` URL construction has been hardened by sanitizing tokens to alphanumeric values and strictly verifying that the parsed URL hostname equals `boards-api.greenhouse.io`.

## 3. Configuration & Startup Risks
- **Threat**: Production environments starting up with weak defaults (e.g., `super_secret_jwt_key`) or connecting to `localhost` databases.
- **Mitigation**: Environment variables validation (`config/env.ts`) using Zod now rejects empty or default strings for critical variables (`MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`) when `NODE_ENV=production`.

## 4. Graceful Shutdown & Resource Leaks
- **Threat**: Sudden termination (SIGINT/SIGTERM) causing corrupted database state or dropped background tasks.
- **Mitigation**: Implemented a `gracefulShutdown` handler in `server.ts` that safely stops `OutreachQueue`, closes the Fastify server, and gracefully terminates the Mongoose connection.

## 5. Cross-Origin Resource Sharing (CORS)
- **Threat**: Unrestricted origins (`origin: true`) allowing any site to make cross-origin requests to the API.
- **Mitigation**: Strict CORS configuration enforced in production, bound to `FRONTEND_URL`.
