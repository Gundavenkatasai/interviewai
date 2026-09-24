# LinkedIn Skills Upstream Patches Log

## Policy
Interview AI adheres strictly to a **zero-upstream-modification policy**. All adaptation, security sandboxing, provenance validation, and database persistence layers are isolated into:
- `apps/api-node/src/integrations/linkedin/`
- `apps/api-node/src/modules/linkedin/`
- `services/linkedin-skills/scripts/interviewai_bridge.py`

## Patches Applied
**Total Upstream Patches**: 0

| Upstream File | Upstream Behavior | Interview AI Modification | Rationale | Risk | Upgrade Impact |
|---|---|---|---|---|---|
| *None* | Standard upstream | None | Pure adapter wrapping | None | Zero merge conflicts on upstream update |

## Non-Invasive Additions
- `services/linkedin-skills/scripts/interviewai_bridge.py`: Added as a non-invasive CLI JSON bridge to allow Node.js to invoke upstream Python utilities (`url_parser`, `backend_selector`, `quote_card`, `illustrate`) with strict JSON I/O and UTF-8 encoding support.
