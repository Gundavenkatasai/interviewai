# Search, Matching & Trust Engine Specifications

## Search & Query Security
1. **Server-Side Safe Search**:
   - User search inputs are sanitized with `escapeRegex` to prevent ReDoS (Regular Expression Denial of Service) and regex injection.
   - Input lengths are bounded to 100 characters.
2. **Pre-Pagination Intersecting Filters**:
   - Queries are constructed using MongoDB `$and` arrays combining search, role category, work mode, employment type, seniority, location, and source filters.
   - All filtering occurs in MongoDB before pagination and counting.

## Match Engine (`MatchEngine`)
1. **Deterministic Alignment**:
   - Skill overlap calculation (Required vs Candidate skills).
   - Experience alignment (Junior/Mid/Senior ranges).
   - Work mode alignment (Remote vs On-site).
2. **Hard Blockers**:
   - Flags non-negotiable gaps (e.g. required specific authorization or geographical presence).
3. **Unknown vs Missing**:
   - If a skill is omitted from a candidate's resume, it is flagged as `UNKNOWN` rather than penalized as confirmed missing.

## Trust Engine (`TrustEngine`)
- Evaluates provenance authenticity:
  - Official employer domain verification (`isOfficialDomain`).
  - Suspicious scam/pay-to-work detection (`suspiciousPayment`).
  - Freshness confidence score.
  - Generates transparent evidence reasons and cautionary flags.
