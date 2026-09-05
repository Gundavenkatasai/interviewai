"""
question_engine.py
──────────────────
Resume-First AI Question Generation Pipeline.

Architecture:
  - When a resume exists, the resume is the PRIMARY and AUTHORITATIVE source of questions.
  - Projects have the highest question-generation priority, explored across 17 dynamic dimensions.
  - Context is retrieved dynamically (RAG) per question.
  - Dedicated Resume Interviewer prompt generates 5-10 candidates.
  - Anti-hallucination check validates grounding (rejects questions referencing unlisted technologies).
  - Multi-layer duplicate detection (exact, normalized, TF-IDF cosine similarity).
  - Topic coverage is tracked dynamically across sessions so multiple topics are covered.
  - Generic question bank is strictly a fallback for non-resume sessions or catastrophic failures.
  - The database is the memory and validation layer, NOT the question generator.
"""

import json
import logging
import random
import re
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple, Set

from sqlalchemy.orm import Session as DBSession
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, Field

from src.config import settings
from src.models.models import (
    InterviewSession, InterviewQuestion,
    Resume, JobDescription,
    UserQuestionHistory, UserWeakArea,
    InterviewEvent
)
from src.services.question_normalizer import normalize, normalize_for_storage, are_exact_duplicates
from src.services.question_bank import (
    QUESTION_BANK,
    get_questions_by_category_and_difficulty,
    get_questions_by_category,
)
from src.services.ai_service import ai_service
from src.services.resume_rag import retrieve_relevant_resume_context

logger = logging.getLogger("interviewai.question_engine")

# ─────────────────────────────────────────────────────────────────────────────
# Semantic similarity (TF-IDF + Cosine)
# ─────────────────────────────────────────────────────────────────────────────

_sklearn_available = False
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    _sklearn_available = True
    logger.info("[QUESTION_ENGINE] scikit-learn available — semantic dedup enabled.")
except ImportError:
    logger.warning("[QUESTION_ENGINE] scikit-learn not installed — falling back to exact-match only dedup.")


def _compute_max_cosine_similarity(candidate: str, existing_texts: List[str]) -> float:
    """
    Returns the maximum cosine similarity between candidate and existing_texts.
    Returns 0.0 if sklearn is unavailable or corpus is empty.
    """
    if not _sklearn_available or not existing_texts:
        return 0.0
    corpus = existing_texts + [candidate]
    try:
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, stop_words="english")
        tfidf_matrix = vectorizer.fit_transform(corpus)
        candidate_vec = tfidf_matrix[-1]
        existing_matrix = tfidf_matrix[:-1]
        similarities = cosine_similarity(candidate_vec, existing_matrix).flatten()
        return float(np.max(similarities)) if len(similarities) > 0 else 0.0
    except Exception as e:
        logger.warning("[SIMILARITY] TF-IDF computation error: %s", e)
        return 0.0


# ─────────────────────────────────────────────────────────────────────────────
# Candidate Question Pydantic Schemas
# ─────────────────────────────────────────────────────────────────────────────

class CandidateQuestionSchema(BaseModel):
    question: str = Field(..., min_length=10)
    category: str = "project"
    topic: str = ""
    resume_reference: Optional[str] = None
    difficulty: str = "medium"
    reason: str = ""

class CandidatesResponse(BaseModel):
    candidates: List[CandidateQuestionSchema]


# ─────────────────────────────────────────────────────────────────────────────
# Dynamic Topic Map & Resume Dimensions
# ─────────────────────────────────────────────────────────────────────────────

RESUME_DIMENSIONS = [
    "Project Architecture",
    "Project Implementation",
    "Technology Choice",
    "Database",
    "Authentication",
    "Security",
    "APIs",
    "Performance",
    "Scalability",
    "Deployment",
    "Problem Solving",
    "Technical Decisions",
    "Challenges",
    "Ownership",
    "Skills",
    "Experience",
    "Behavioral (Project-based)"
]


def _build_resume_topic_map(resume: Resume) -> Dict[str, Any]:
    """
    Extracts all concrete topics, projects, databases, and technologies from the resume.
    """
    projects = resume.parsed_projects or []
    skills = resume.parsed_skills or []
    profile = resume.parsed_profile or {}

    if not projects and isinstance(profile, dict) and "projects" in profile:
        projects = profile["projects"]
    if not skills and isinstance(profile, dict) and "candidate" in profile:
        skills = profile["candidate"].get("skills", [])

    all_topics: List[Dict[str, Any]] = []

    # 1. Topics from projects (highest priority)
    for p in projects:
        if not isinstance(p, dict):
            continue
        p_name = p.get("name", "Project")
        techs = p.get("technologies", [])
        db = p.get("database")
        auth = p.get("authentication")
        apis = p.get("apis", [])
        features = p.get("features", [])

        # Project overall
        all_topics.append({
            "topic": p_name,
            "project_name": p_name,
            "category": "Project Architecture",
            "type": "project_core"
        })

        # Project database
        if db:
            all_topics.append({
                "topic": str(db),
                "project_name": p_name,
                "category": "Database",
                "type": "database"
            })

        # Project authentication
        if auth:
            all_topics.append({
                "topic": str(auth),
                "project_name": p_name,
                "category": "Authentication",
                "type": "authentication"
            })

        # Project technologies
        for t in techs:
            all_topics.append({
                "topic": str(t),
                "project_name": p_name,
                "category": "Technology Choice",
                "type": "technology"
            })

        # Project features / APIs
        for feat in features:
            all_topics.append({
                "topic": str(feat),
                "project_name": p_name,
                "category": "Project Implementation",
                "type": "feature"
            })

    # 2. General skills
    for s in skills:
        if not any(t["topic"].lower() == str(s).lower() for t in all_topics):
            all_topics.append({
                "topic": str(s),
                "project_name": projects[0].get("name") if projects else None,
                "category": "Skills",
                "type": "skill"
            })

    return {
        "projects": projects,
        "skills": skills,
        "topics": all_topics
    }


def _select_resume_target_topic(
    topic_map: Dict[str, Any],
    session_questions: List[InterviewQuestion],
    history_records: List[UserQuestionHistory]
) -> Dict[str, Any]:
    """
    Selects the next target topic from the resume topic map.
    Tracks topics already covered to ensure diversity across 10+ questions.
    """
    all_topics = topic_map.get("topics", [])
    if not all_topics:
        return {"topic": "System Architecture", "project_name": "Project", "category": "Project Architecture"}

    # Extract all topics covered in this session and cross-session history
    covered_topic_names: Set[str] = set()
    for q in session_questions:
        if q.topic:
            covered_topic_names.add(q.topic.lower())
    for h in history_records:
        if h.topic:
            covered_topic_names.add(h.topic.lower())

    # Find uncovered topics
    uncovered = [t for t in all_topics if t["topic"].lower() not in covered_topic_names]
    if uncovered:
        # Prefer project-related topics first
        project_uncovered = [t for t in uncovered if t.get("project_name")]
        if project_uncovered:
            selected = project_uncovered[0]
        else:
            selected = uncovered[0]
    else:
        # If all topics have been covered once, pick the least recently used
        selected = random.choice(all_topics)

    logger.info(
        "[TOPIC_SELECTION] Selected topic='%s' project='%s' category='%s' remaining=%d",
        selected["topic"], selected.get("project_name"), selected.get("category"), len(uncovered)
    )
    return selected


# ─────────────────────────────────────────────────────────────────────────────
# Anti-Hallucination Grounding Validator
# ─────────────────────────────────────────────────────────────────────────────

def _validate_resume_grounding(
    candidate_q: CandidateQuestionSchema,
    resume: Resume
) -> Tuple[bool, str]:
    """
    Verifies that candidate question is grounded in the resume and does NOT invent
    technologies, projects, or credentials not in the candidate's resume.
    """
    raw_text_lower = (resume.raw_text or "").lower()

    # Collect known entities
    known_entities: Set[str] = set()
    for s in (resume.parsed_skills or []):
        known_entities.add(str(s).lower())

    for p in (resume.parsed_projects or []):
        if isinstance(p, dict):
            if p.get("name"):
                name_clean = p["name"].lower()
                known_entities.add(name_clean)
                for part in name_clean.split():
                    if len(part) > 3:
                        known_entities.add(part)
            for t in p.get("technologies", []):
                known_entities.add(str(t).lower())
            if p.get("database"):
                known_entities.add(str(p["database"]).lower())
            if p.get("authentication"):
                known_entities.add(str(p["authentication"]).lower())
            for f in p.get("features", []):
                known_entities.add(str(f).lower())

    ref = (candidate_q.resume_reference or "").strip().lower()
    topic = (candidate_q.topic or "").strip().lower()

    # 1. Grounding reference must be specified
    if not ref:
        return False, "Candidate missing resume_reference"

    # 2. Reference must match resume entities or raw text
    ref_matches = (
        ref in raw_text_lower
        or any(ref in k or k in ref for k in known_entities if k)
    )
    topic_matches = (
        topic in raw_text_lower
        or any(topic in k or k in topic for k in known_entities if k)
    )

    if not (ref_matches or topic_matches):
        logger.info(
            "[ANTI_HALLUCINATION] REJECTED — reference='%s' or topic='%s' not in resume.",
            candidate_q.resume_reference, candidate_q.topic
        )
        return False, f"Reference '{ref}' not found in resume"

    # 3. Check for specific unlisted tech keywords hallucinated into question
    hallucination_catalogue = [
        "aws", "gcp", "azure", "docker", "kubernetes", "graphql", "redis",
        "kafka", "rabbitmq", "terraform", "django", "spring boot", "fastapi",
        "react", "angular", "vue", "mongodb", "postgresql", "stripe", "razorpay"
    ]
    q_lower = candidate_q.question.lower()
    for kw in hallucination_catalogue:
        # If keyword is explicitly mentioned as a required technology in the question
        if re.search(r'\b' + re.escape(kw) + r'\b', q_lower):
            if kw not in raw_text_lower and not any(kw in e for e in known_entities):
                logger.info(
                    "[ANTI_HALLUCINATION] REJECTED — hallucinated tech '%s' not in resume.", kw
                )
                return False, f"Hallucinated tech '{kw}' not in resume"

    return True, "Valid"


# ─────────────────────────────────────────────────────────────────────────────
# Heuristic Fallback Generator (Ensures Resume-Specificity Without LLM)
# ─────────────────────────────────────────────────────────────────────────────

def _generate_heuristic_resume_candidates(
    resume: Resume,
    target_info: Dict[str, Any],
    difficulty: str
) -> List[CandidateQuestionSchema]:
    """
    Generates high-quality, resume-grounded candidate questions strictly from
    the candidate's parsed projects and technologies if LLM is unavailable.
    """
    candidates: List[CandidateQuestionSchema] = []
    projects = resume.parsed_projects or []
    skills = resume.parsed_skills or []

    target_topic = target_info.get("topic") or "System Architecture"
    p_name = target_info.get("project_name") or (projects[0].get("name") if projects else "your key project")

    # Find project object
    project_obj = next((p for p in projects if isinstance(p, dict) and p.get("name") == p_name), None)
    if not project_obj and projects and isinstance(projects[0], dict):
        project_obj = projects[0]
        p_name = project_obj.get("name", "Project")

    techs = project_obj.get("technologies", []) if project_obj else skills[:4]
    database = project_obj.get("database") if project_obj else None
    auth = project_obj.get("authentication") if project_obj else None

    # Project Understanding
    candidates.append(CandidateQuestionSchema(
        question=f"Can you explain the system architecture and core data flow of your {p_name}?",
        category="Project Architecture",
        topic=p_name,
        resume_reference=p_name,
        difficulty=difficulty,
        reason=f"Challenges the high-level architecture of the candidate's {p_name}."
    ))

    # Technology Choice
    if techs:
        primary_tech = techs[0]
        candidates.append(CandidateQuestionSchema(
            question=f"What led you to choose {primary_tech} for {p_name}, and what alternatives did you evaluate?",
            category="Technology Choice",
            topic=primary_tech,
            resume_reference=p_name,
            difficulty=difficulty,
            reason=f"Examines architectural trade-offs in selecting {primary_tech}."
        ))

    # Database
    if database:
        candidates.append(CandidateQuestionSchema(
            question=f"Why did you choose {database} for {p_name}, and how did you structure your collections or schema?",
            category="Database",
            topic=database,
            resume_reference=p_name,
            difficulty=difficulty,
            reason=f"Tests data modeling and query optimization in {database} for {p_name}."
        ))
    elif any("mongo" in str(t).lower() for t in techs):
        candidates.append(CandidateQuestionSchema(
            question=f"Why did you choose MongoDB instead of a relational database for your {p_name}?",
            category="Database",
            topic="MongoDB",
            resume_reference=p_name,
            difficulty=difficulty,
            reason="Investigates database choice and indexing strategy."
        ))

    # Authentication
    if auth or any("jwt" in str(t).lower() for t in techs):
        auth_tech = auth or "JWT"
        candidates.append(CandidateQuestionSchema(
            question=f"How did you implement {auth_tech} authentication in {p_name}, and how did you prevent token theft or CSRF?",
            category="Authentication",
            topic=auth_tech,
            resume_reference=p_name,
            difficulty=difficulty,
            reason=f"Tests authentication security mechanisms in {p_name}."
        ))

    # Problem Solving
    candidates.append(CandidateQuestionSchema(
        question=f"What was the most difficult technical bottleneck you encountered while building {p_name}, and how did you resolve it?",
        category="Problem Solving",
        topic="Problem Solving",
        resume_reference=p_name,
        difficulty=difficulty,
        reason=f"Probes real problem-solving experience in {p_name}."
    ))

    # Scalability
    candidates.append(CandidateQuestionSchema(
        question=f"If traffic to your {p_name} increased by a factor of 50, what components would break first and how would you scale them?",
        category="Scalability",
        topic="Scalability",
        resume_reference=p_name,
        difficulty="hard" if difficulty == "hard" else "medium",
        reason=f"Tests scalability foresight for {p_name}."
    ))

    # Payment / APIs
    if any(p in str(techs).lower() or p in (resume.raw_text or "").lower() for p in ["stripe", "razorpay", "paypal"]):
        pay_gw = "Stripe" if "stripe" in (resume.raw_text or "").lower() else "Razorpay"
        candidates.append(CandidateQuestionSchema(
            question=f"How did you handle idempotent requests and payment failure recovery when integrating {pay_gw} in {p_name}?",
            category="APIs",
            topic=pay_gw,
            resume_reference=p_name,
            difficulty=difficulty,
            reason=f"Validates API resilience and webhook handling with {pay_gw}."
        ))

    return candidates


# ─────────────────────────────────────────────────────────────────────────────
# Resume-First Prompt Builder
# ─────────────────────────────────────────────────────────────────────────────

def _build_resume_interviewer_prompt(
    session: InterviewSession,
    resume: Resume,
    target_info: Dict[str, Any],
    context_snippet: str,
    difficulty: str,
    candidates_count: int,
    session_questions: List[InterviewQuestion],
    history_texts: List[str]
) -> List[Dict[str, str]]:
    """
    Constructs the dedicated Resume Interviewer prompt conforming strictly to
    Section 12 of the specification.
    """
    system_prompt = (
        "You are an expert technical interviewer.\n"
        "Your job is to interview the candidate based primarily on their resume.\n"
        "You MUST use concrete information from the candidate's resume.\n"
        "Questions should reference the candidate's actual:\n"
        "* projects\n"
        "* technologies\n"
        "* responsibilities\n"
        "* experience\n"
        "* technical decisions\n"
        "* achievements\n"
        "Do not generate generic textbook questions when resume-specific questions can be generated.\n"
        "Do not invent technologies, projects, responsibilities or experience that are not present in the resume.\n"
        "If information is missing from the resume, ask a general role-relevant question only when necessary.\n"
        "Generate a NEW question that is substantially different from all excluded questions."
    )

    # Excluded questions block
    all_excluded = [q.question_text for q in session_questions] + history_texts
    excluded_block = ""
    if all_excluded:
        excluded_lines = "\n".join(f"  - {t}" for t in all_excluded[:35])
        excluded_block = f"\nPREVIOUS_QUESTIONS (do NOT repeat or rephrase):\n{excluded_lines}\n"

    projects_repr = json.dumps(resume.parsed_projects[:3] if resume.parsed_projects else [], default=str)
    skills_repr = ", ".join(str(s) for s in (resume.parsed_skills or [])[:12])
    entropy = str(uuid.uuid4())[:8]

    user_content = f"""Generate {candidates_count} diverse candidate interview questions based strictly on the candidate's resume.

ROLE: {session.role}
EXPERIENCE: {session.experience_level}
PROJECTS: {projects_repr}
SKILLS: {skills_repr}
CURRENT_TOPIC: {target_info.get('topic')}
TARGET_PROJECT: {target_info.get('project_name') or 'Primary Project'}
CURRENT_DIFFICULTY: {difficulty}
SESSION_ENTROPY: {entropy}

RELEVANT_RESUME_CONTEXT:
\"\"\"
{context_snippet}
\"\"\"
{excluded_block}
REQUIREMENTS:
1. Every question MUST reference concrete details from the candidate's resume (e.g. their specific project, tech stack, or implementation).
2. Connect technologies to the candidate's actual project: do NOT ask generic questions like 'What is React?'. Ask questions like 'Why did you choose React for your {target_info.get('project_name')}?'.
3. Every question must include a valid 'resume_reference' matching a project or technology that explicitly appears in the resume.
4. Do NOT invent technologies (e.g., AWS, Docker, Kubernetes) if they are not in the resume context.

Return ONLY valid JSON matching this exact structure:
{{
  "candidates": [
    {{
      "question": "Why did you choose MongoDB for your food delivery application?",
      "category": "project",
      "topic": "{target_info.get('topic')}",
      "resume_reference": "{target_info.get('project_name') or target_info.get('topic')}",
      "difficulty": "{difficulty}",
      "reason": "The resume explicitly mentions MongoDB in this project."
    }}
  ]
}}
"""
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content}
    ]


# ─────────────────────────────────────────────────────────────────────────────
# Non-Resume Prompt Builder (Role / JD Fallback)
# ─────────────────────────────────────────────────────────────────────────────

def _build_non_resume_prompt(
    session: InterviewSession,
    jd: Optional[JobDescription],
    category: str,
    difficulty: str,
    candidates_count: int,
    session_questions: List[InterviewQuestion],
    history_texts: List[str]
) -> List[Dict[str, str]]:
    """Builds prompt for interview sessions that do not have a resume."""
    system_prompt = (
        "You are an expert technical interviewer at a top-tier tech company. "
        "Generate diverse, rigorous interview question candidates based on role, technologies, and job description. "
        "Each question must be substantially different from excluded questions. "
        "Return valid JSON only."
    )

    all_excluded = [q.question_text for q in session_questions] + history_texts
    excluded_block = ""
    if all_excluded:
        excluded_lines = "\n".join(f"  - {t}" for t in all_excluded[:35])
        excluded_block = f"\nEXCLUDED QUESTIONS:\n{excluded_lines}\n"

    jd_block = ""
    if jd:
        jd_block = f"""
JOB DESCRIPTION:
  Required: {', '.join(jd.required_skills[:6]) if jd.required_skills else 'N/A'}
  Responsibilities: {', '.join(jd.responsibilities[:3]) if jd.responsibilities else 'N/A'}
"""

    entropy = str(uuid.uuid4())[:8]

    user_content = f"""Generate {candidates_count} diverse interview questions.

ROLE: {session.role}
EXPERIENCE LEVEL: {session.experience_level}
INTERVIEW TYPE: {session.interview_type}
DIFFICULTY: {difficulty}
TECHNOLOGIES: {', '.join(session.technologies or []) or 'General Software Engineering'}
TARGET CATEGORY: {category}
ENTROPY: {entropy}
{jd_block}{excluded_block}
Return JSON strictly:
{{
  "candidates": [
    {{
      "question": "Full question text here",
      "category": "{category}",
      "topic": "Specific sub-topic",
      "resume_reference": null,
      "difficulty": "{difficulty}",
      "reason": "Why this question tests candidate competency"
    }}
  ]
}}
"""
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content}
    ]


# ─────────────────────────────────────────────────────────────────────────────
# Candidate Dedup & Ranking Filter
# ─────────────────────────────────────────────────────────────────────────────

def _filter_and_rank_candidates(
    candidates: List[CandidateQuestionSchema],
    existing_texts: List[str],
    threshold: float,
    resume: Optional[Resume] = None
) -> Tuple[Optional[CandidateQuestionSchema], float]:
    """
    Evaluates, grounds, dedupes, and ranks candidates.
    Returns (selected_candidate, similarity_score).
    """
    existing_normalized = [normalize(t) for t in existing_texts]
    storage_normalized = [normalize_for_storage(t) for t in existing_texts]

    for cand in candidates:
        # 1. Anti-hallucination validation if resume exists
        if resume:
            is_grounded, ground_reason = _validate_resume_grounding(cand, resume)
            if not is_grounded:
                logger.info("[FILTER] REJECTED (ungrounded: %s) cand='%.60s'", ground_reason, cand.question)
                continue

        # 2. Exact normalized check
        cand_norm = normalize(cand.question)
        if cand_norm in existing_normalized:
            logger.info("[FILTER] REJECTED (exact duplicate) cand='%.60s'", cand.question)
            continue

        # 3. Semantic similarity check
        sim_score = _compute_max_cosine_similarity(
            normalize_for_storage(cand.question),
            storage_normalized
        )
        logger.info(
            "[DUPLICATE_CHECK] candidate='%.50s...' score=%.3f threshold=%.2f",
            cand.question, sim_score, threshold
        )

        if sim_score >= threshold:
            logger.info(
                "[FILTER] REJECTED (semantic similarity=%.3f >= %.2f) cand='%.60s'",
                sim_score, threshold, cand.question
            )
            continue

        # Passed all checks!
        logger.info(
            "[FILTER] ACCEPTED candidate='%.80s...' sim_score=%.3f ref='%s'",
            cand.question, sim_score, cand.resume_reference
        )
        return cand, sim_score

    return None, 0.0


# ─────────────────────────────────────────────────────────────────────────────
# Fallback Bank Selection (Used ONLY when no resume exists or emergency fallback)
# ─────────────────────────────────────────────────────────────────────────────

def _pick_from_bank(
    category: str,
    difficulty: str,
    existing_texts: List[str],
    threshold: float
) -> Optional[Dict[str, Any]]:
    candidates = get_questions_by_category_and_difficulty(category, difficulty)
    if not candidates:
        candidates = get_questions_by_category(category)
    if not candidates:
        candidates = list(QUESTION_BANK)

    random.shuffle(candidates)
    existing_normalized = [normalize(t) for t in existing_texts]
    storage_normalized = [normalize_for_storage(t) for t in existing_texts]

    for q in candidates:
        norm = normalize(q["question_text"])
        if norm in existing_normalized:
            continue
        sim = _compute_max_cosine_similarity(
            normalize_for_storage(q["question_text"]),
            storage_normalized
        )
        if sim < threshold:
            logger.info("[SELECTED] source=bank question='%.80s...'", q["question_text"])
            return q

    return candidates[0] if candidates else None


# ─────────────────────────────────────────────────────────────────────────────
# Primary Public API: generate_next_question
# ─────────────────────────────────────────────────────────────────────────────

async def generate_next_question(
    session: InterviewSession,
    db: DBSession
) -> InterviewQuestion:
    """
    Generates the next interview question adhering strictly to the Resume-First priority:

    IF resume exists:
      Resume -> Parse resume -> Extract projects & skills -> Dynamic Topic Map ->
      Retrieve relevant context (RAG) -> AI generates candidates -> Anti-hallucination ->
      Duplicate detection -> Save generated question -> Show question

    ELSE:
      Role -> JD -> Technologies -> AI generates questions -> Question bank fallback -> Dedup
    """
    logger.info("[QUESTION_GENERATION] sessionId=%s role=%s resumeId=%s", session.id, session.role, session.resume_id)
    db.add(InterviewEvent(
        session_id=session.id,
        event_type="QUESTION_GENERATION",
        payload={"role": session.role, "resume_id": session.resume_id}
    ))
    db.commit()

    # 1. Load Resume & JD
    resume: Optional[Resume] = None
    if session.resume_id:
        resume = db.query(Resume).filter(Resume.id == session.resume_id).first()

    jd: Optional[JobDescription] = None
    if session.job_description_id:
        jd = db.query(JobDescription).filter(JobDescription.id == session.job_description_id).first()

    # 2. Load History (Current session + Cross-session for this user)
    session_questions = list(session.questions)
    history_records = (
        db.query(UserQuestionHistory)
        .filter(
            UserQuestionHistory.user_id == session.user_id,
            UserQuestionHistory.session_id != session.id
        )
        .order_by(UserQuestionHistory.asked_at.desc())
        .limit(100)
        .all()
    )
    all_existing_texts = [q.question_text for q in session_questions] + [h.question_text for h in history_records]

    # 3. Determine difficulty
    difficulty = session.difficulty.lower() if session.difficulty else "medium"
    threshold = settings.QUESTION_SIMILARITY_THRESHOLD
    candidates_count = settings.QUESTION_CANDIDATES_COUNT

    selected_candidate: Optional[CandidateQuestionSchema] = None
    similarity_score: float = 0.0
    source: str = "ai"

    # =========================================================================
    # BRANCH A: RESUME-FIRST PIPELINE (Primary source)
    # =========================================================================
    if resume is not None and (resume.parsed_projects or resume.parsed_skills or (resume.raw_text and len(resume.raw_text.strip()) > 20)):
        logger.info("[QUESTION_PIPELINE] BRANCH=RESUME_FIRST resumeId=%s", resume.id)

        # Build topic map & track covered topics
        topic_map = _build_resume_topic_map(resume)
        target_info = _select_resume_target_topic(topic_map, session_questions, history_records)
        target_topic = target_info.get("topic", "System Architecture")

        # Retrieve relevant resume context via RAG
        context_result = retrieve_relevant_resume_context(resume.id, resume, target_topic)
        context_snippet = context_result.get("context_text") or (resume.raw_text[:2000] if resume.raw_text else "")

        # Call AI with dedicated Resume Interviewer prompt
        messages = _build_resume_interviewer_prompt(
            session, resume, target_info, context_snippet, difficulty, candidates_count,
            session_questions, [h.question_text for h in history_records]
        )

        raw_validated: Optional[CandidatesResponse] = None
        for attempt in range(2):
            try:
                raw_json = await ai_service._call_llm_json(messages)
                raw_validated = CandidatesResponse.model_validate(raw_json)
                logger.info("[QUESTION_CANDIDATES] count=%d attempt=%d source=resume_ai", len(raw_validated.candidates), attempt + 1)
                db.add(InterviewEvent(
                    session_id=session.id,
                    event_type="QUESTION_CANDIDATES",
                    payload={"count": len(raw_validated.candidates), "source": "resume_ai", "attempt": attempt + 1}
                ))
                db.commit()
                break
            except Exception as e:
                logger.warning("[RESUME_AI] LLM generation error on attempt %d: %s", attempt + 1, e)

        # If LLM returned valid candidates, filter and rank them
        if raw_validated and raw_validated.candidates:
            selected_candidate, similarity_score = _filter_and_rank_candidates(
                raw_validated.candidates, all_existing_texts, threshold, resume=resume
            )

        # If LLM failed, was offline, or all LLM candidates were rejected, use heuristic resume candidates
        if selected_candidate is None:
            logger.info("[RESUME_PIPELINE] LLM candidates unavailable or ungrounded. Generating heuristic resume candidates.")
            heuristic_candidates = _generate_heuristic_resume_candidates(resume, target_info, difficulty)
            selected_candidate, similarity_score = _filter_and_rank_candidates(
                heuristic_candidates, all_existing_texts, threshold, resume=resume
            )

        if selected_candidate is not None:
            source = "resume_ai"

    # =========================================================================
    # BRANCH B: NON-RESUME PIPELINE (Role / JD AI -> Question bank fallback)
    # =========================================================================
    if selected_candidate is None and resume is None:
        logger.info("[QUESTION_PIPELINE] BRANCH=NON_RESUME role=%s", session.role)
        category = random.choice(["System Design", "Backend", "Frontend", "Database", "Problem Solving"])

        messages = _build_non_resume_prompt(
            session, jd, category, difficulty, candidates_count,
            session_questions, [h.question_text for h in history_records]
        )

        raw_validated: Optional[CandidatesResponse] = None
        try:
            raw_json = await ai_service._call_llm_json(messages)
            raw_validated = CandidatesResponse.model_validate(raw_json)
            logger.info("[QUESTION_CANDIDATES] count=%d source=role_ai", len(raw_validated.candidates))
            db.add(InterviewEvent(
                session_id=session.id,
                event_type="QUESTION_CANDIDATES",
                payload={"count": len(raw_validated.candidates), "source": "role_ai"}
            ))
            db.commit()
        except Exception as e:
            logger.warning("[ROLE_AI] LLM error: %s", e)

        if raw_validated and raw_validated.candidates:
            selected_candidate, similarity_score = _filter_and_rank_candidates(
                raw_validated.candidates, all_existing_texts, threshold, resume=None
            )
            if selected_candidate:
                source = "jd_ai" if jd else "role_ai"

    # =========================================================================
    # LAST RESORT FALLBACK (Question Bank)
    # =========================================================================
    bank_pick: Optional[Dict[str, Any]] = None
    if selected_candidate is None:
        logger.warning("[QUESTION_PIPELINE] Falling back to static question bank.")
        category = "Technical"
        bank_pick = _pick_from_bank(category, difficulty, all_existing_texts, threshold)
        source = "bank"

    # 4. Construct Question Values
    if selected_candidate is not None:
        question_text = selected_candidate.question
        q_category = selected_candidate.category or "Project"
        q_topic = selected_candidate.topic or target_info.get("topic") if 'target_info' in locals() else session.role
        q_difficulty = selected_candidate.difficulty or difficulty
        resume_ref = selected_candidate.resume_reference or (target_info.get("project_name") if 'target_info' in locals() else None)
    elif bank_pick is not None:
        question_text = bank_pick["question_text"]
        q_category = bank_pick.get("category", "Technical")
        q_topic = bank_pick.get("topic", "General")
        q_difficulty = bank_pick.get("difficulty", difficulty)
        resume_ref = None
    else:
        question_text = f"Can you describe the system architecture of a complex {session.role} application you built?"
        q_category = "Architecture"
        q_topic = session.role
        q_difficulty = difficulty
        resume_ref = None
        source = "fallback"

    norm_text = normalize_for_storage(question_text)
    question_order = len(session_questions) + 1

    # 5. Persist to interview_questions
    db_question = InterviewQuestion(
        session_id=session.id,
        question_order=question_order,
        question_text=question_text,
        normalized_text=norm_text,
        category=q_category,
        topic=q_topic,
        difficulty=q_difficulty,
        source=source,
        resume_reference=resume_ref,
        similarity_score=round(similarity_score, 3),
        expected_concepts=[],
    )
    db.add(db_question)

    # 6. Update session progress counters
    session.question_count = question_order
    session.current_question_index = question_order - 1

    # 7. Persist to cross-session history
    try:
        history_entry = UserQuestionHistory(
            user_id=session.user_id,
            session_id=session.id,
            question_text=question_text,
            normalized_text=norm_text,
            category=q_category,
            topic=q_topic,
            resume_reference=resume_ref,
            asked_at=datetime.utcnow(),
        )
        db.add(history_entry)
        db.flush()
    except IntegrityError:
        db.rollback()
        logger.info("[HISTORY] Question already recorded in history, skipping duplicate insertion.")
    else:
        db.commit()

    db.refresh(db_question)
    logger.info(
        "[QUESTION_SELECTED] source=%s ref='%s' topic='%s' sim=%.3f text='%.100s'",
        source, resume_ref, q_topic, similarity_score, question_text
    )
    db.add(InterviewEvent(
        session_id=session.id,
        event_type="QUESTION_SELECTED",
        payload={"source": source, "topic": q_topic, "similarity_score": similarity_score, "question_text": question_text}
    ))
    db.commit()
    return db_question


async def update_weak_area(
    user_id: str,
    topic: str,
    category: str,
    score: float,
    db: DBSession,
) -> None:
    """Upserts UserWeakArea record for adaptive tracking."""
    existing = (
        db.query(UserWeakArea)
        .filter(UserWeakArea.user_id == user_id, UserWeakArea.topic == topic)
        .first()
    )
    if existing:
        existing.attempts += 1
        existing.total_score += score
        existing.avg_score = existing.total_score / existing.attempts
        existing.last_updated = datetime.utcnow()
    else:
        wa = UserWeakArea(
            user_id=user_id,
            topic=topic,
            category=category,
            total_score=score,
            attempts=1,
            avg_score=score,
        )
        db.add(wa)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
