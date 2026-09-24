# Architecture: LinkedIn Story Bank Integration

Connects upstream `skills/linkedin-interviewer/` with Interview AI's central Story Bank.

## Unified Candidate Evidence Layer
Instead of creating duplicate story models, the LinkedIn Interviewer skill writes directly into Interview AI's canonical `InterviewStory` database model.

## STAR Model Mapping
- **Situation**: Context and challenge faced.
- **Task**: Goal, constraints, and scope.
- **Action**: Engineering decisions, technologies used, architectures implemented.
- **Result**: Quantifiable outcomes, latency reductions, cost savings, throughput gains.
- **Reflection**: Lessons learned and architectural tradeoffs.

## Shared Across Features
Stories captured via the LinkedIn Interviewer become instantly usable across:
- **Resume Tailoring**: Injected into relevant experience bullets.
- **Mock Interviews**: Used as behavioral question reference answers.
- **LinkedIn Content Studio**: Selected as verified factual foundation for post generation.
- **Cover Letters**: Auto-matched to job description competencies.
