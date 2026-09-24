# Architecture: LinkedIn Profile Analysis & Provenance

The Profile Analyzer evaluates LinkedIn profile completeness, keyword visibility, and market gap alignment without ever fabricating candidate achievements.

## Analyzed Sections (9 Areas)
1. **Headline**: Scored against recruiter query patterns and keyword density.
2. **About**: Evaluates narrative clarity, technical focus, and removes cliché buzzwords.
3. **Experience**: Analyzes quantifiable bullets, scope, and metric presence.
4. **Skills**: Compares candidate skills against active market demand for target role.
5. **Featured**: Evaluates GitHub projects, portfolio case studies, and articles.
6. **Custom URL**: Checks for clean, personalized handle.
7. **Photo**: Recommends framing and background contrast.
8. **Banner**: Brand alignment and technical specialty banner.
9. **Recommendations**: Quantifies social proof and peer validation.

## Provenance Model
Recommendations carry strict provenance metadata:
```typescript
interface ILinkedInRecommendation {
  field: string;
  currentValue: string;
  proposedValue: string;
  reason: string;
  evidence: string;
  source: string;
  confidence: number;
  requiresApproval: boolean;
  status: "SUGGESTED" | "USER_EDITED" | "USER_APPROVED" | "USER_REJECTED" | "APPLIED";
}
```
Suggestions are proposals only and never silently overwrite the user's canonical candidate profile.
