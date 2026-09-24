# LinkedIn Skills Architecture

## System Overview
Interview AI integrates `sergebulaev/linkedin-skills` using a clean, layered architecture that preserves the upstream repository as the authoritative source of truth for LinkedIn skill instructions and runtime behavior while integrating cleanly with Interview AI's AI Service, MongoDB models, and React UI.

```
┌────────────────────────────────────────────────────────┐
│               React UI (apps/web)                      │
│     LinkedIn Workspace (8 Tabs, SaaS Design System)    │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON
┌───────────────────────────▼────────────────────────────┐
│          Fastify Node.js API (apps/api-node)           │
│  Controllers, Zod Schemas, Auth & IDOR Middleware      │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│      LinkedIn Integration Service (src/integrations)   │
│  - LinkedInRegistry: Dynamic discovery of 12 skills   │
│  - LinkedInRunner: Python bridge & AI orchestrator     │
│  - LinkedInPolicy: Approval gates & security checks    │
│  - LinkedInMapper: STAR model & provenance mapping     │
│  - Providers: Apify, Publora, Pixfaro, Manual          │
└─────────────────┬────────────────────┬─────────────────┘
                  │                    │
┌─────────────────▼─────────┐   ┌──────▼─────────────────┐
│ Interview AI Central AI   │   │ Upstream Runtime       │
│ - AIService               │   │ (services/linkedin)    │
│ - AIRouter                │   │ - skills/*/SKILL.md    │
│ - Reliability Manager     │   │ - references/*.md      │
│ - Prompt Registry         │   │ - lib/ Python modules  │
└───────────────────────────┘   │ - CLI Bridge Script    │
                                └────────────────────────┘
```

## Architectural Layers Preserved
1. **Instruction Layer (`skills/*/SKILL.md`)**: The prompt instructions, hook formulas (F1–F20), 2026 reach dynamics, and tone guidelines remain in their original markdown format.
2. **References Knowledge Layer (`references/*.md`)**: Upstream reference assets (hook formulas, founder angles, voice profiles) are dynamically read and passed as context to the AI Router.
3. **Python Shared Library Layer (`lib/`)**: The upstream Python modules (`url_parser`, `backend_selector`, `apify_client`, `publora_client`, `pixfaro_client`) handle URL normalization and vendor communication.
4. **Read Layer**: Apify Actor client or zero-dependency manual paste mode.
5. **Write Layer**: Publora REST API client or copy-ready manual publishing mode.
6. **Image Layer**: Pixfaro AI illustration client or manual image prompt suggestion.
7. **Approval Machine**: Enforces that no post, comment, or reply is published without explicit user review and approval.
