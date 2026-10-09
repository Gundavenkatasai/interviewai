# LinkedIn Content Studio: Formulas, Stylometry & Humanizer

## 1. Overview
The Content Studio enables candidates to create defensible, technical, and high-reach LinkedIn content derived from their real experiences and Story Bank. It incorporates proven formulas from `sergebulaev/linkedin-skills` and 2026 feed dynamics.

---

## 2. Supported Hook Formulas & Styles
| Formula | Style | Pattern & Mechanism | 2026 Feed Impact |
| :--- | :--- | :--- | :---: |
| **F7** | *Odd-Precision Ledger* | Opens with specific, unrounded metrics (e.g. "We cut P99 latency by 34.2%..."). | +34% comments |
| **F1** | *Platform Risk Anaphora* | Repetitive structural clauses highlighting ecosystem shifts. | 4,240 reach |
| **F2** | *R.I.P. Obituary* | Era-ending technical claims and deprecated paradigms. | 3,822 reach |
| **F3** | *Year-over-Year Pivot* | Retrospective comparison of architecture or career growth. | 3.74x multiplier |
| **F4** | *Time-Anchor Confession* | Dated, uncomfortable realization or engineering failure. | 1,519+ reach |
| **F10** | *Contrarian + Receipts* | Challenges common industry dogma with production data. | High repost rate |
| **F17** | *Controlled A/B Anecdote*| Isolates one engineering variable and compares before/after. | High technical depth |
| **F18** | *False-Binary Dissolve* | Rejects the common false dichotomy between two solutions. | Strong senior dialogue |

---

## 3. The 4-Pass Natural Humanizer Engine
To eliminate synthetic AI hallmarks and corporate fluff, the `HumanizerEngine` executes a deterministic 4-pass transformation:
1. **Pass 1: Scrub**:
   - Neutralizes 2026 AI tell vocabulary (`delve`, `tapestry`, `beacon`, `revolutionize`, `testament`, `game-changer`, `moreover`, `furthermore`).
   - Replaces overly academic transitions with direct, pragmatic alternatives.
2. **Pass 2: Rhythm & Cadence**:
   - Breaks monotonous stacked triads ("X, Y, and Z" patterns).
   - Introduces natural variation in sentence length (short punchy clauses alternating with explanatory lines).
3. **Pass 3: Add Anchors**:
   - Injects personal perspective and candidate voice anchors (`"In production,"`, `"The tradeoff was,"`, `"We observed"`).
4. **Pass 4: Self-Check & Tell Density Score**:
   - Calculates residual tell density (0–100) and assigns a confidence classification (`reads_human`, `mixed`, `reads_ai`).

---

## 4. Approval & Publishing Workflow
The publishing lifecycle enforces strict safety constraints:
```
DRAFT ──► AI_REVIEW ──► USER_REVIEW ──► APPROVED ──► SCHEDULED ──► PUBLISHING ──► PUBLISHED
                                                                          │
                                                                   PUBLISH_FAILED
```
Content is never published automatically without explicit user confirmation.
