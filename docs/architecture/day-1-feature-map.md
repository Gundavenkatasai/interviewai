# Day 1 Feature Map

## A. Authentication (MOSTLY_PRODUCTION)
- Login / Registration (JWT based).
- Password hashing (Bcrypt).
- *Missing:* Advanced Account Recovery / OAuth.

## B. Career Profile (BETA)
- Candidate skills and education.
- Missing explicit truth boundaries (Provenance).

## C. Jobs (PRODUCTION)
- Ingestion, deduplication, search.
- Filtering and basic match scoring.

## D. Resume (PRODUCTION)
- Parsing (pdf-parse, mammoth).
- Templates, versioning, ATS analysis.
- Docx export.

## E. Applications (MOSTLY_PRODUCTION)
- Creation, timeline tracking, notes.
- *Missing:* Cover letter version binding.

## F. Interview (PRODUCTION)
- Real-time setup, STT streaming, evaluation grading.
- WebSockets handling 8-dimension scoring.

## G. LinkedIn / Outreach (ALPHA)
- LinkedIn profile scoring exists.
- Outreach tracking is a basic CRUD module.

## H. Auto Apply (INCOMPLETE)
- Service generates match scores but AI generation is commented out.
- Operates strictly as a "Draft" generator rather than full autonomous submission.

## I. Analytics (BETA)
- Found in dashboard endpoints.
- Response rate and performance metrics exist but need hardening.
