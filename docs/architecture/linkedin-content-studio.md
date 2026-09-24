# Architecture: LinkedIn Content Studio

The LinkedIn Content Studio brings long-form thought-leadership writing, hook optimization, humanization, and audited publishing into Interview AI.

## Pipeline Architecture
```
User Inputs (Topic, Audience, Goal, Formula F1–F20)
  ↓
Candidate Facts (Candidate Profile + Story Bank STAR evidence)
  ↓
Draft Generation (linkedin-post-writer instructions)
  ↓
Humanizer Pass (linkedin-humanizer AI-tell scrub & rhythm tuning)
  ↓
Quality Audit (2026 reach checks, em-dash caps, opener verification)
  ↓
Candidate Review & User Edits
  ↓
Explicit Approval Gate (APPROVED status required)
  ↓
Publishing / Scheduling (Publora API or Copy-Ready Manual Mode)
```

## Hook Formulas (F1 to F20)
Supports the full 2026 hook formula matrix from `references/hook-formulas.md`:
- `F1`: Platform Risk Anaphora
- `F2`: R.I.P. Obituary
- `F3`: Year-over-Year Pivot
- `F4`: Time-Anchor Confession
- `F7`: Odd-Precision Money Ledger (+34% median likes)
- `F10`: Contrarian + Historical Receipts
- `F17`: Controlled A/B Anecdote
- `F18`: False-Binary Dissolve

## 2026 Feed Dynamics Guardrails
- **Never open with a question**: First line question yields -34% reach penalty; inverted to statement or number-first opener.
- **Number-first line**: Odd-precision number in opening line yields +34% reach lift.
- **Single contrast and triple**: Strict density limits prevent repetitive reveal structures.
