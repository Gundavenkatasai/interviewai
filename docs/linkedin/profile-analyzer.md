# LinkedIn Profile Analyzer: 14-Section Rubric Specification

## 1. Overview
The Profile Analyzer evaluates public profiles or pasted data across 14 deterministic sections. It rejects static mock numbers and subjective ratings in favor of evidence-based scoring against 2026 technical recruitment benchmarks.

---

## 2. The 14 Scored Sections
| # | Section Key | Status Values | Scoring Weight | Evaluation Rubric |
| :--- | :--- | :--- | :---: | :--- |
| 1 | `PHOTO` | `STRONG` \| `MISSING` \| `UNKNOWN` | 5% | Headshot discoverability and professional visibility. |
| 2 | `BANNER` | `GOOD` \| `MISSING` \| `UNKNOWN` | 5% | Custom banner presence indicating professional specialization. |
| 3 | `HEADLINE` | `STRONG` \| `GOOD` \| `NEEDS_WORK` \| `MISSING` | 15% | Evaluates target role keywords, skills, and value proposition. |
| 4 | `ABOUT` | `STRONG` \| `GOOD` \| `NEEDS_WORK` \| `MISSING` | 15% | Structured overview, core achievements, technical competencies. |
| 5 | `FEATURED` | `GOOD` \| `NEEDS_WORK` \| `MISSING` \| `UNKNOWN` | 5% | Artifacts, open-source repositories, system architecture links. |
| 6 | `EXPERIENCE` | `STRONG` \| `GOOD` \| `NEEDS_WORK` \| `MISSING` | 20% | Action verbs, quantifiable metrics, and team/scale context. |
| 7 | `EDUCATION` | `STRONG` \| `NEEDS_WORK` \| `MISSING` | 5% | Academic degrees, institution credentials, graduation dates. |
| 8 | `SKILLS` | `STRONG` \| `GOOD` \| `NEEDS_WORK` \| `MISSING` | 10% | Skill count, high-demand technical keywords, taxonomy depth. |
| 9 | `CERTIFICATIONS` | `GOOD` \| `NEEDS_WORK` \| `MISSING` \| `UNKNOWN` | 5% | Accredited cloud (AWS/GCP), security, and framework licenses. |
| 10 | `PROJECTS` | `GOOD` \| `NEEDS_WORK` \| `MISSING` \| `UNKNOWN` | 5% | Shipped production systems, open-source contributions. |
| 11 | `CUSTOM_URL` | `STRONG` \| `NEEDS_WORK` \| `MISSING` | 2% | Clean identifier without auto-generated alphanumeric suffix. |
| 12 | `RECOMMENDATIONS`| `GOOD` \| `NEEDS_WORK` \| `MISSING` \| `UNKNOWN` | 3% | Social proof from managers and peers. |
| 13 | `ACTIVITY` | `GOOD` \| `NEEDS_WORK` \| `MISSING` \| `UNKNOWN` | 2% | Public posts, technical discourse, community engagement. |
| 14 | `KEYWORDS` | `STRONG` \| `GOOD` \| `NEEDS_WORK` | 3% | ATS keyword density aligned with target job titles. |

---

## 3. Strict Rules
- **Never Treat `UNKNOWN` as `MISSING`**: Sections that cannot be observed due to public guest limitations are tagged with `UNKNOWN` status and `low` confidence, avoiding unfair score penalization.
- **Evidence Requirement**: Every scored section provides observed textual snippets or rationale explaining why issues were flagged.
- **Zero Hallucinated Metrics**: When optimizing experience bullet points, the optimizer never fabricates percentages (e.g. "improved latency by 47%"). It explicitly prompts the candidate to add verified numbers if available.
