# Open-Source Software Attribution Notices

This document details the open-source software libraries, repositories, and architectures reused or adapted within the Interview AI LinkedIn module.

---

## 1. sergebulaev/linkedin-skills

- **Repository:** https://github.com/sergebulaev/linkedin-skills
- **Copyright:** (c) 2026 Sergey Bulaev
- **License:** MIT License
- **Usage:**
  - Dynamic skill discovery algorithms (`SKILL.md` parser).
  - 18 Hook formulas (F1–F18) cataloged in content studio.
  - 4-Pass stylometry humanization pipeline (Scrub, Rhythm, Add, Self-Check).
  - Comment and reply drafting angles.
  - Python CLI execution bridge (`interviewai_bridge.py`).
  - Approval state machine foundations.

```text
MIT License

Copyright (c) 2026 Sergey Bulaev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 2. theonaai/linkedin-content-planner-mcp

- **Repository:** https://github.com/theonaai/linkedin-content-planner-mcp
- **License:** MIT License
- **Usage:**
  - Content calendar state machine: `DRAFT` → `AI_REVIEW` → `USER_REVIEW` → `APPROVED` → `SCHEDULED` → `PUBLISHING` → `PUBLISHED`.
  - Multi-pillar scheduling distribution algorithms.

---

## 3. johnisanerd/Apify-LinkedIn-Posts-API

- **Repository:** https://github.com/johnisanerd/Apify-LinkedIn-Posts-API
- **License:** Apache License 2.0 / MIT
- **Usage:**
  - Normalized structured post and engagement schema design.

---

## 4. Puppeteer and Cheerio

- **Puppeteer:** https://github.com/puppeteer/puppeteer (Apache-2.0 License)
- **Cheerio:** https://github.com/cheeriojs/cheerio (MIT License)
- **Usage:**
  - Headless browser lifecycle and resilient HTML / JSON-LD parsing for public LinkedIn pages.
