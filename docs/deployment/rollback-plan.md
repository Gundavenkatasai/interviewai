# Interview AI — Production Rollback Plan

**Document Version:** 2.0.0  
**Date:** October 11, 2026  
**Audience:** Site Reliability Engineering, DevOps, Release Managers  
**Objective:** Rapid, safe, zero-data-loss rollback procedure in the event of an unhealthy production deployment.

---

## 1. Rollback Trigger Criteria

An automated or manual rollback MUST be initiated immediately if any of the following conditions occur within 30 minutes following a release:

1. **Health Check Failure:**
   - `/health/ready` or `/health/live` returns HTTP non-200 for 3 consecutive 10-second intervals.
2. **Elevated Error Rate:**
   - Overall HTTP 5xx error rate exceeds **1.0%** across a 5-minute rolling window.
3. **Database Saturation / Crash Loop:**
   - Database connection failure errors or unhandled promise rejections exceed 5 events/minute.
4. **Critical Workflow Regression:**
   - Failure of critical user paths (User registration, user login, mock interview audio/transcript stream, or resume download).
5. **Security / Vulnerability Incident:**
   - Detection of active data leakage, authentication bypass, or unverified secrets exposure.

---

## 2. Architecture & Deployment Model

Interview AI uses containerized microservices and decoupled static frontend hosting:
- **Frontend (`apps/web`):** Static assets served via CDN / reverse proxy (Vercel, Cloudflare, or NGINX).
- **Backend API (`apps/api-node`):** Node.js / Fastify container running behind an ingress reverse proxy or load balancer.
- **Database (MongoDB Atlas):** Multi-replica cluster with automated continuous point-in-time snapshots.

---

## 3. Step-by-Step Rollback Procedures

### Procedure A: Docker / Containerized Deployment Rollback (Kubernetes / ECS / Docker Swarm)

#### 1. Revert Container Image Tag
If using Kubernetes or Docker Compose, redeploy the previous immutable image tag:
```bash
# Kubernetes example
kubectl rollout undo deployment/interviewai-api -n production

# Verify deployment status
kubectl rollout status deployment/interviewai-api -n production
```

If using Docker Compose:
```bash
# 1. Edit docker-compose.prod.yml to point to the PREVIOUS_TAG
sed -i 's/:v2.0.0/:v1.9.9/' docker-compose.prod.yml

# 2. Re-create containers with zero downtime
docker compose -f docker-compose.prod.yml up -d --no-deps api-node

# 3. Verify container health
docker compose -f docker-compose.prod.yml ps
curl -f http://localhost:5000/health/ready
```

---

### Procedure B: Static Frontend (CDN / Vercel / Netlify / S3) Rollback

1. **Instant CDN Rollback:**
   - In Vercel / Netlify: Promote the previous deployment to Production via the dashboard or CLI:
     ```bash
     vercel rollback [PREVIOUS_DEPLOYMENT_URL]
     ```
   - In S3 / CloudFront: Sync the previous build artifact from the release archive:
     ```bash
     aws s3 sync s3://interviewai-releases/v1.9.9/dist s3://interviewai-web-production/ --delete
     aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
     ```

---

### Procedure C: Database Migration Rollback (Zero Data Loss)

> [!IMPORTANT]
> All schema modifications in Interview AI follow the **Expand/Contract** pattern. New fields are additive (`termsAcceptedVersion`, optional indexes) and do not break older application versions reading from the database.

1. **Additive Changes (No Database Rollback Needed):**
   - If the new version added fields or optional indexes, rolling back the application code is safe without modifying MongoDB data.
2. **Reverting Faulty Indexes:**
   - If an index degrades write performance, drop the specific index via mongosh without disturbing data:
     ```javascript
     use interviewai_production;
     db.jobs.dropIndex("problematic_index_name");
     ```
3. **Emergency Point-in-Time Recovery (PITR):**
   - If data corruption occurred due to a faulty worker:
     - Follow the standard restore protocol documented in [docs/deployment/backup-and-recovery.md](file:///c:/Users/venka/OneDrive/Desktop/interview/docs/deployment/backup-and-recovery.md).
     - Restore to a staging cluster first to verify integrity before cutting over.

---

## 4. Post-Rollback Verification Checklist

Immediately upon completing the rollback:

- [ ] Execute probe test: `curl -f https://api.interviewai.com/health/ready` (Returns HTTP 200 `{"status":"ok"}`).
- [ ] Confirm HTTP status for `/health/live`.
- [ ] Verify frontend assets load without cached 404s or stale chunk hashes.
- [ ] Perform smoke login using test credentials.
- [ ] Monitor error reporting logs (Sentry / structured stdout) to verify 5xx errors return to <0.01%.
- [ ] Notify release engineering and stakeholders on incident communication channels.
- [ ] File a post-mortem incident report within 24 hours.
