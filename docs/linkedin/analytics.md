# LinkedIn Analytics & Telemetry Specification

## 1. Zero-Fabrication Mandate
The LinkedIn analytics engine rejects artificial counters, mock percentage dials, and synthetic engagement graphs.
- **Truthful Display**: When metric fields (such as private post impressions or private follower demographics) cannot be observed via public guest protocols, the UI displays `"Data unavailable"`.
- **Zero Display**: The value `0` is shown **only** when an external source explicitly reports zero.

---

## 2. Analytics Snapshot Schema
Historical metrics persist in MongoDB under the `LinkedInAnalyticsSnapshot` model:
```typescript
{
  userId: ObjectId,
  profileId: String,
  date: Date,
  postsCount: Number,
  metrics: {
    reactions?: Number,
    comments?: Number,
    shares?: Number,
    engagementRate?: Number,
  },
  topPosts: [
    {
      postId: String,
      topic: String,
      reactions: Number,
      comments: Number,
      performanceCategory: "high" | "average" | "low"
    }
  ],
  topTopics: [String],
  source: String,
  retrievedAt: Date
}
```

---

## 3. Post Performance Classification
Posts are evaluated using deterministic engagement signals:
- **High-Performing**: Engagement rate exceeding the candidate's 75th percentile or post receiving >3x the account's median comment volume.
- **Average**: Engagement within the 25th–75th percentile range.
- **Low-Performing**: Engagement falling below the 25th percentile.
- **Evidence-Based Rationale**: The inspector attributes performance to specific variables (e.g. "Line 1 metric hook F7 achieved 3.2x higher comment rate than question openers").
