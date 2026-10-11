# Interview AI — Database Backup, Disaster Recovery & Production Configuration

**Document Version:** 2.0.0  
**Target Systems:** MongoDB Atlas / Production Database Cluster, Redis Cache  
**Status:** Approved for Production Deployment  

---

## 1. Overview & Recovery Objectives

Interview AI stores user credentials, profiles, ATS resumes, interview recordings, scores, and job aggregation metadata in MongoDB. High availability and automated recovery are critical to ensure zero unrecoverable data loss in production.

### Recovery Objectives
- **Recovery Point Objective (RPO):**
  - **Continuous Backups (PITR):** $\le 1\text{ hour}$ (Point-In-Time Recovery via oplog).
  - **Scheduled Snapshots:** $\le 24\text{ hours}$ (Automated daily snapshots).
- **Recovery Time Objective (RTO):**
  - **Cluster Snapshot Restoration:** $\le 30\text{ minutes}$ to an active hot-standby or restored cluster.
  - **Automated Replica Set Failover:** $\le 10\text{ seconds}$ (Automated primary election across 3-node replica set).

---

## 2. Backup Strategy & Schedules

### 2.1 Continuous Cloud Backups (MongoDB Atlas)
- **Oplog Streaming:** Real-time oplog replication provides continuous backup with second-by-second point-in-time recovery.
- **Snapshot Retention Policy:**
  - **Daily Snapshots:** Taken at 02:00 UTC every 24 hours. Retained for **30 days**.
  - **Weekly Snapshots:** Taken every Sunday at 02:00 UTC. Retained for **90 days**.
  - **Monthly Snapshots:** Taken on the 1st of each month. Retained for **365 days**.
- **Storage Encryption:** All backup snapshots are encrypted with AES-256 both in transit and at rest.

### 2.2 Pre-Migration & On-Demand Snapshots
Before applying any destructive database migration or schema refactoring, a manual snapshot must be triggered:
```bash
# Example: Triggering on-demand snapshot via Atlas CLI
atlas backups snapshots create cluster-production --desc "Pre-migration-v2.0"
```

---

## 3. Step-by-Step Restoration Procedures

### Scenario A: Accidental Data Corruption or Drop (Point-In-Time Recovery)
1. Identify the exact UTC timestamp ($T$) immediately prior to the corrupting event.
2. In MongoDB Atlas Console (or via CLI), navigate to **Backup > Point in Time Restore**.
3. Select **Restore to a New Cluster** (e.g. `cluster-recovery-temp`) to avoid overwriting ongoing healthy operations during verification.
4. Specify the point-in-time timestamp: $T - 2\text{ minutes}$.
5. Once provisioned ($\approx 15\text{ minutes}$), verify data integrity on the recovery cluster:
   ```bash
   node scripts/database/verify-restore.cjs --uri="mongodb+srv://.../interviewai_production"
   ```
6. Update application connection string (`MONGODB_URI`) or sync recovered collections via `mongodump` / `mongorestore`.

### Scenario B: Offline CLI Dump & Restore (Cold Backup)
For local development backups or offline compliance archives:
```bash
# 1. Export database with TLS
mongodump --uri="mongodb+srv://<USER>:<PASS>@<HOST>/interviewai_production" \
  --gzip --archive="backup-interviewai-$(date +%Y%m%d).gz"

# 2. Restore to isolated target
mongorestore --uri="mongodb+srv://<USER>:<PASS>@<HOST>/interviewai_restored" \
  --gzip --archive="backup-interviewai-$(date +%Y%m%d).gz" --drop
```

---

## 4. Production Database Configuration & Connection Optimization

In `apps/api-node/src/db/mongo.ts`, the production MongoDB client must enforce optimal connection pool parameters and resilience:

| Setting | Value | Rationale |
|---|---|---|
| `maxPoolSize` | `50` | Supports up to 1,000 concurrent HTTP requests with connection multiplexing. |
| `minPoolSize` | `10` | Keeps pre-warmed connections ready to eliminate connection handshake latency. |
| `maxIdleTimeMS` | `30000` (30s) | Reaps stale connections to prevent firewall drops. |
| `serverSelectionTimeoutMS` | `5000` (5s) | Fails fast during network partition instead of hanging HTTP requests. |
| `socketTimeoutMS` | `45000` (45s) | Prevents socket hangs on long-running aggregation pipelines. |
| `retryWrites` | `true` | Transparently retries transient write network errors. |
| `w` (Write Concern) | `"majority"` | Guarantees writes are committed to a majority of replica set nodes before acknowledging. |

---

## 5. Production Indexes Audit

All high-traffic queries are covered by compound indexes to guarantee sub-50ms execution times:

```javascript
// Jobs Collection
db.jobs.createIndex({ source: 1, sourceJobId: 1 }, { unique: true });
db.jobs.createIndex({ isActive: 1, isIndiaJob: 1, sourcePostedAt: -1, createdAt: -1 });
db.jobs.createIndex({ isActive: 1, isIndiaJob: 1, workMode: 1, createdAt: -1 });

// Resumes Collection
db.resumes.createIndex({ userId: 1, updatedAt: -1 });
db.resumes.createIndex({ userId: 1, targetRole: 1 });

// Interview Sessions Collection
db.interviewsessions.createIndex({ userId: 1, createdAt: -1 });
db.interviewsessions.createIndex({ userId: 1, state: 1 });

// User Collection
db.users.createIndex({ email: 1 }, { unique: true });
```

---

## 6. User Deletion & Retention Schedules (GDPR / CCPA)

Under our Privacy Policy:
- When a user selects **Delete Account** in Settings > Danger Zone, all associated documents across `User`, `Resume`, `ResumeVersion`, `InterviewSession`, `CandidateAnswer`, `InterviewReport`, and `Transcript` are deleted permanently from the primary database within the same database transaction/operation.
- Secondary backup snapshots expire and purge automatically within 30 days under the snapshot retention policy.
