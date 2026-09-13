# 19-Day Dependency Graph & Roadmap

| Day | Focus | Prerequisites | Risks |
|---|---|---|---|
| **2** | Career Intelligence + Canonical Candidate Profile | Day 1 Audit Approval | Migrating existing resume data to Canonical Profile without data loss. |
| **3** | Shared AI Context + Provider Layer | Day 2 Profile | Abstraction must support streaming and structured JSON identically. |
| **4** | Job Ingestion + Data Quality | None | Preventing stale/duplicate jobs from cluttering the feed. |
| **5** | Match Score + Trust Engine | Day 2 Profile, Day 4 Jobs | Balancing AI latency vs accurate matching. |
| **6** | Job Discovery UX | Day 4 Jobs | State management for infinite scrolling and filters. |
| **7** | Resume Canonicalization | Day 2 Profile | Ensuring ATS parsers correctly map to the new schema. |
| **8** | ATS Hardening | Day 7 Canonicalization | Strict enforcement against AI hallucinated metrics. |
| **9** | ATS Template Generator | Day 8 ATS Hardening | Complex PDF/DOCX rendering consistency. |
| **10** | Resume Tailoring | Day 5 Match Score, Day 9 Templates | Hallucinations during tailoring. |
| **11** | Application Engine | Day 4 Jobs, Day 2 Profile | Managing complex timeline state mutations. |
| **12** | Auto-Pipeline (Human-in-loop) | Day 10 Tailoring, Day 11 App Engine | Clearly separating "Draft" from "Submitted" states. |
| **13** | Interview Intelligence | Day 11 App Engine | Generating relevant context from the job description. |
| **14** | Story Bank + Interview Debrief | Day 13 Interview Intel | Linking candidate profile experiences to STAR method answers. |
| **15** | Real-Time Interview Hardening | Day 14 Story Bank | WebSocket reconnection instability under load. |
| **16** | Follow-up + Outreach + LinkedIn | Day 11 App Engine | Provider rate limits. |
| **17** | Analytics + Career Gaps | All core modules | Heavy aggregation queries slowing down MongoDB. |
| **18** | Production Hardening | All modules | Security audits, CORS, rate limiting validation. |
| **19** | Full E2E + Performance | Testing infrastructure | Uncovering hidden race conditions in the UI. |
| **20** | Launch Freeze + Deployment | Day 19 E2E | Infrastructure scaling (DB size, AI rate limits). |
| **21** | PUBLIC LAUNCH | Day 20 Freeze | 🚀 |
