# Candidate Intelligence & Provenance Model

## Overview
Interview AI uses a **Canonical Candidate Profile** as the single source of truth for all downstream systems (ATS optimization, matching, resume generation, and interviews). 
This prevents the common problem of fragmented profiles across different features.

## Provenance
Every significant candidate fact (Skill, Experience, Education) is tracked with a **Provenance** schema:
```json
{
  "sourceType": "USER_ENTERED | RESUME | AI_SUGGESTED",
  "sourceId": "resume-123",
  "confidence": 1.0,
  "status": "VERIFIED | UNVERIFIED | REJECTED | CONFLICT",
  "extractedAt": "2026-09-12T00:00:00Z",
  "verifiedAt": "2026-09-12T00:00:00Z"
}
```

### Fact Transition Rules
1. **USER_ENTERED** facts are immediately `VERIFIED`.
2. **AI_SUGGESTED** and **IMPORTED** facts begin as `UNVERIFIED`.
3. An `UNVERIFIED` fact cannot be used by the Matching Engine or ATS generation until the user approves it via the `/facts/verify` endpoint.
4. **REJECTED** facts are kept in the database but ignored by downstream features. This prevents AI from continuously re-suggesting the same incorrect information.

## Conflict Resolution
When importing external sources (e.g., LinkedIn vs. Uploaded Resume), discrepancies in overlapping fields (like dates or titles) are stored in the `conflicts` array.
Users must manually resolve these in the Intelligence Dashboard.

## AI Layer Boundary
The `CandidateIntelligenceService` uses `AIService.generateStructured` strictly to:
- Generate high-level summaries (`getIntelligenceSummary`).
- Propose missing skills.
- Normalize skill names (e.g. mapping "React.js" -> "React").

**The AI NEVER mutates verified facts directly.** All AI inferences are written with `sourceType: "AI_SUGGESTED"` and `status: "UNVERIFIED"`.
