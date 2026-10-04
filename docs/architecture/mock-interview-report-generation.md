# Mock Interview Report Generation & Scoring Architecture

**Document:** `docs/architecture/mock-interview-report-generation.md`  
**Status:** Production  
**Scope:** Evaluation Rubric, Aggregation Engine, & Persistence  

---

## 1. 8-Dimension Evaluation Rubric

Every candidate answer is evaluated across 8 dimensions scored from $0.0$ to $10.0$:

1. **Technical Accuracy:** Factual correctness of engineering concepts, architecture, and syntax.
2. **Relevance:** Direct adherence to the specific constraints and problem presented.
3. **Completeness:** Coverage of core concepts, system boundaries, and deliverables.
4. **Depth:** Advanced trade-offs, internal mechanics, performance considerations, and low-level understanding.
5. **Problem Solving:** Structured decomposition, analytical approach, and reasoning from first principles.
6. **Communication:** Articulation clarity, pacing, terminology usage, and structured explanation.
7. **Structure:** Logical progression (e.g. STAR method for behavioral, modular layering for technical).
8. **Confidence & Clarity:** Decisiveness, tone firmness, and fluency without hesitations.

---

## 2. Deterministic Aggregation Formula

To prevent arbitrary LLM scoring swings, final interview scores are aggregated deterministically from persisted question evaluations:

$$\text{Overall Score} = \frac{1}{N} \sum_{i=1}^{N} \text{AnswerScore}_i$$

Where each question's $\text{AnswerScore}_i$ is computed from weighted dimension weights:

$$\text{AnswerScore} = 0.25 \times \text{Tech} + 0.15 \times \text{Rel} + 0.15 \times \text{Comp} + 0.15 \times \text{Depth} + 0.10 \times \text{Prob} + 0.10 \times \text{Comm} + 0.05 \times \text{Struct} + 0.05 \times \text{Conf}$$

### UNKNOWN vs MISSING Semantics
- **UNKNOWN:** When a skill or concept was not probed in the given question or interview, its status is recorded as `UNKNOWN`. It does NOT decrease the score.
- **MISSING:** When a concept was explicitly asked for and the candidate omitted it, its status is marked as `MISSING` and impacts completeness/depth.

---

## 3. Idempotent Report Generation

Report generation uses an atomic lock and deterministic idempotency key:

```typescript
const idempotencyKey = `${sessionId}_v${reportVersion}`;
```

1. If an `InterviewReport` already exists with this key, it is returned immediately without invoking AI services.
2. If interrupted or reconnected, the server checks for an existing report before executing the synthesis prompt.
3. Concurrent completion requests are locked via `findOneAndUpdate({ _id: sessionId, state: { $ne: 'COMPLETED' }, completionLock: { $exists: false } })`.
4. Once written, reports are immutable. Reopening a historical interview from `/history` or refreshing `/report/:id` returns the persisted report in sub-50ms with zero AI overhead.
