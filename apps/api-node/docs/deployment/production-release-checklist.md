# Production Release Checklist (Release Candidate)

Before deploying this Release Candidate to production, ensure the following checks are complete:

## Infrastructure Setup
- [ ] Database (MongoDB) is provisioned with replica sets for high availability.
- [ ] Redis instance is provisioned (required for upcoming BullMQ migration and rate limiting).
- [ ] Node.js environment is configured (`NODE_ENV=production`).
- [ ] Secrets Manager is configured to securely inject environment variables.

## Security Validations
- [ ] All `JWT_SECRET` keys are rotated and strong.
- [ ] `FRONTEND_URL` is configured to the exact origin (e.g., `https://app.interviewai.com`).
- [ ] `MONGODB_URI` points to the production cluster, not localhost.
- [ ] WAF (Web Application Firewall) is enabled at the ingress level.

## Application Hardening (Day 18 Verification)
- [ ] Verified `OutreachQueue` stops processing when SIGTERM is sent.
- [ ] Verified Fastify rejects cross-origin requests from unauthorized domains.
- [ ] Verified IDOR mitigations: tested endpoints using two separate test users to ensure isolation.
- [ ] Verified Greenhouse SSRF mitigations: tested URL parameter injection (e.g., `../`).

## Observability
- [ ] Centralized logging (e.g., Datadog, ELK, CloudWatch) is attached.
- [ ] Application Performance Monitoring (APM) is running.
- [ ] Alerts are configured for:
  - 5xx Error Spikes
  - High Latency (> 500ms)
  - Queue depth > 100 on `OutreachQueue`
  - Unhandled Rejections / Crashes
