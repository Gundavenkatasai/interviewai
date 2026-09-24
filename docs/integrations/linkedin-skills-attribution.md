# Open Source Attribution: sergebulaev/linkedin-skills

## Repository Details
- **Repository**: `sergebulaev/linkedin-skills`
- **Upstream URL**: https://github.com/sergebulaev/linkedin-skills.git
- **License**: MIT License (https://opensource.org/licenses/MIT)
- **Author**: Serge Bulaev
- **Pinned Commit**: `baa9c909916f98764828e15e7cfc9dffa1aaadb1`

## Local Integration Details
- **Local Path**: `services/linkedin-skills/`
- **Integration Adapters**:
  - `apps/api-node/src/integrations/linkedin/linkedin.registry.ts`
  - `apps/api-node/src/integrations/linkedin/linkedin.runner.ts`
  - `apps/api-node/src/integrations/linkedin/linkedin.adapter.ts`
  - `apps/api-node/src/integrations/linkedin/linkedin.policy.ts`
  - `apps/api-node/src/integrations/linkedin/linkedin.mapper.ts`
  - `services/linkedin-skills/scripts/interviewai_bridge.py`
  - `apps/api-node/src/modules/linkedin/linkedin.controller.ts`
  - `apps/api-node/src/modules/linkedin/linkedin.routes.ts`
  - `apps/api-node/src/modules/linkedin/linkedin.model.ts`
  - `apps/web/src/pages/LinkedIn/LinkedInWorkspacePage.tsx`

## File Tracking
- **Unmodified Upstream Files**:
  - All files in `skills/*/SKILL.md` (12 skills)
  - All files in `references/*.md` (Hook formulas, founder topics, voice profile, etc.)
  - All files in `lib/*.py` (`url_parser.py`, `backend_selector.py`, `apify_client.py`, `publora_client.py`, `pixfaro_client.py`)
  - All files in `scripts/*.py` (`selftest.py`, `check_frontmatter.py`, `check_markdown_references.py`, `check_no_secrets.py`)
  - All files in `tests/` (102 offline unit tests)
- **Modified Upstream Files**: None. Zero upstream modifications.
- **Added Integration Files**: `services/linkedin-skills/scripts/interviewai_bridge.py` (CLI JSON bridge).

## Copyright Notice
Copyright (c) 2025-2026 Serge Bulaev.
Licensed under the MIT License.
