# LinkedIn Skills Integration Guide

Comprehensive integration of the open-source [`sergebulaev/linkedin-skills`](https://github.com/sergebulaev/linkedin-skills.git) repository into Interview AI.

## 1. Upstream Repository & Pinned Commit
- **Source Repository**: `https://github.com/sergebulaev/linkedin-skills.git`
- **Pinned Commit SHA**: `baa9c909916f98764828e15e7cfc9dffa1aaadb1`
- **Vendor Location**: `services/linkedin-skills/`
- **Attribution & License**: MIT License (Preserved in `services/linkedin-skills/LICENSE`)

## 2. Preserved Upstream Architecture
The upstream architecture is preserved intact across all core layers:
1. **Instruction Layer (`skills/*/SKILL.md`)**: Dynamically scanned and loaded by `LinkedInRegistry`.
2. **References Knowledge Layer (`references/*.md`)**: 20 hook formulas (F1–F20), founder angles (A1–A10), voice profiles, and 2026 reach dynamics notes.
3. **Python Library Layer (`lib/`)**:
   - `lib.url_parser`: High-fidelity LinkedIn URL & 2-level comment thread URN parser.
   - `lib.backend_selector`: Active backend detector (`manual`, `publora`, `diy`) and copy-paste fallback formatter.
   - `lib.apify_client`: Apify actor interface for reading posts, comments, and engagers.
   - `lib.publora_client`: Publora REST API client for 1-click scheduling and publishing.
   - `lib.pixfaro_client`: Pixfaro client for AI illustrations and typeset quote-cards.
4. **Validation Layer (`scripts/`)**:
   - `scripts/selftest.py --offline`: 102 offline unit tests validating instruction integrity, frontmatter, and response shapes.
   - `scripts/check_frontmatter.py`: Strict YAML validation across all 12 skills.
   - `scripts/check_markdown_references.py`: Reference link validation.
   - `scripts/check_no_secrets.py`: Credential leak prevention.

## 3. Thin Adapter Pattern
Interview AI interacts with the upstream runtime via:
```
React UI (apps/web)
  ↓
Interview AI Fastify API (apps/api-node)
  ↓
LinkedIn Integration Service (src/integrations/linkedin)
  ↓
LinkedIn Runner & Adapter (spawns Python bridge & executes AIService)
  ↓
Upstream Runtime (services/linkedin-skills)
```

## 4. Installed Skills (12 Dynamic Skills)
1. `linkedin-post-writer`: Hook formulas F1–F20, tone, length, humanizer pass.
2. `linkedin-comment-drafter`: Additive perspectives on external posts.
3. `linkedin-reply-handler`: Two-level thread resolution and comment replies.
4. `linkedin-humanizer`: 2026 AI-tell scrub, anti-synthetic cadence.
5. `linkedin-hook-extractor`: Reusable formula and template classification.
6. `linkedin-content-planner`: 7-day strategic calendars and pillar mapping.
7. `linkedin-thread-monitor`: Follow-up tracking and background sync.
8. `linkedin-engager-analytics`: Recruiter, Hiring Manager, and Peer ICP segmentation.
9. `linkedin-profile-optimizer`: 9-section profile audit with candidate provenance.
10. `linkedin-employee-advocacy`: Team governance and advocacy campaigns (feature-flagged).
11. `linkedin-repurposer`: Transforms resume stories, projects, and blogs into posts.
12. `linkedin-interviewer`: Conversational STAR evidence extractor writing to Story Bank.

## 5. Security & Isolation
- **Prompt Injection Isolation**: External LinkedIn text is wrapped in `<untrusted_external_content>` tags with explicit guardrails prohibiting instruction execution.
- **Approval Policy**: Publishing is strictly restricted to `APPROVED` drafts.
- **Manual Fallback**: Zero external API dependencies required for full functionality.
