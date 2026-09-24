# LinkedIn Skills Upgrade Procedure

Standard operating procedure for upgrading the upstream `linkedin-skills` integration.

## 1. Upgrade Pre-requisites
- Clean working directory with no uncommitted changes in `services/linkedin-skills/`.
- Python 3.10+ installed and available (`py` or `python3`).
- Verified dependencies: `requests`, `python-dotenv`, `pyyaml`.

## 2. Upgrade Workflow
1. Fetch latest upstream changes:
   ```bash
   cd services/linkedin-skills
   git fetch origin
   ```
2. Inspect upstream commit log:
   ```bash
   git log --oneline HEAD..origin/main
   ```
3. Merge or checkout target release commit:
   ```bash
   git merge origin/main
   ```
4. Run self-tests and validation scripts:
   ```bash
   py scripts/check_frontmatter.py
   py scripts/check_markdown_references.py
   py scripts/check_no_secrets.py
   py scripts/selftest.py --offline
   ```
5. Run Interview AI integration test suite:
   ```bash
   cd ../../apps/api-node
   npx vitest run tests/linkedin-integration.test.ts
   ```
6. Update pinned commit SHA in documentation:
   - `docs/integrations/linkedin-skills-integration.md`
   - `docs/integrations/linkedin-skills-attribution.md`
   - `docs/roadmap/linkedin-skills-integration-completion.md`
