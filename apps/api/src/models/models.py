import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean,
    DateTime, ForeignKey, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship
from src.database import Base

def generate_uuid():
    return str(uuid.uuid4())

# ── Interview session state machine states ─────────────────────────────────────
# CREATED      → session row exists, no questions yet
# READY        → first question generated, waiting for candidate
# ASKING       → question is being presented / read aloud
# LISTENING    → recording candidate's answer
# PROCESSING   → transcribing audio
# EVALUATING   → AI scoring the answer
# GENERATING_NEXT → AI generating the next question
# COMPLETED    → all questions answered, report generated
# FAILED       → irrecoverable error
INTERVIEW_STATES = [
    "CREATED", "READY", "ASKING", "LISTENING",
    "PROCESSING", "EVALUATING", "GENERATING_NEXT",
    "COMPLETED", "FAILED"
]

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)  # Admin flag for admin routes
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sessions = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    job_descriptions = relationship("JobDescription", back_populates="user", cascade="all, delete-orphan")
    question_history = relationship("UserQuestionHistory", back_populates="user", cascade="all, delete-orphan")
    weak_areas = relationship("UserWeakArea", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, docx
    raw_text = Column(Text, nullable=True)
    parsed_skills = Column(JSON, default=list)
    parsed_projects = Column(JSON, default=list)
    parsed_experience = Column(JSON, default=list)
    parsed_education = Column(JSON, default=list)
    parsed_certifications = Column(JSON, default=list)
    parsed_profile = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resumes")
    sessions = relationship("InterviewSession", back_populates="resume")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String, nullable=False)
    company = Column(String, nullable=True)
    raw_text = Column(Text, nullable=False)
    required_skills = Column(JSON, default=list)
    preferred_skills = Column(JSON, default=list)
    responsibilities = Column(JSON, default=list)
    experience_requirements = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="job_descriptions")
    sessions = relationship("InterviewSession", back_populates="job_description")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    resume_id = Column(String, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    job_description_id = Column(String, ForeignKey("job_descriptions.id", ondelete="SET NULL"), nullable=True)

    role = Column(String, nullable=False)
    company = Column(String, nullable=True)
    experience_level = Column(String, nullable=False)  # Fresher, 0-2 years, 2-5 years, 5+
    interview_type = Column(String, nullable=False)    # Technical, HR, Behavioral, Coding, System Design, Project, Mixed
    difficulty = Column(String, nullable=False)        # Easy, Medium, Hard, Adaptive
    technologies = Column(JSON, default=list)          # e.g. ["React", "Node.js"]
    coach_mode = Column(String, default="interview")   # practice, interview, review
    status = Column(String, default="setup")           # setup, in_progress, paused, completed
    state = Column(String, default="CREATED")          # State machine: CREATED|READY|ASKING|LISTENING|PROCESSING|EVALUATING|GENERATING_NEXT|COMPLETED|FAILED
    duration_minutes = Column(Integer, default=30)
    elapsed_seconds = Column(Integer, default=0)

    # Track how many questions have been generated and the maximum requested
    question_count = Column(Integer, default=0)
    max_questions = Column(Integer, default=10)        # User-selected: 5 | 10 | 15 | 20
    current_question_index = Column(Integer, default=0)

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="sessions")
    resume = relationship("Resume", back_populates="sessions")
    job_description = relationship("JobDescription", back_populates="sessions")
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan", order_by="InterviewQuestion.question_order")
    transcripts = relationship("Transcript", back_populates="session", cascade="all, delete-orphan", order_by="Transcript.timestamp")
    score = relationship("InterviewScore", back_populates="session", uselist=False, cascade="all, delete-orphan")
    feedback = relationship("InterviewFeedback", back_populates="session", uselist=False, cascade="all, delete-orphan")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    session_id = Column(String, ForeignKey("interview_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    question_order = Column(Integer, nullable=False, default=1)
    question_text = Column(Text, nullable=False)

    # Dedup & categorization fields
    normalized_text = Column(Text, nullable=True, index=True)   # Lowercased, stripped, used for dedup
    category = Column(String, default="technical")              # Technical, Behavioral, Resume, DSA, etc.
    topic = Column(String, nullable=True)                       # e.g. "REST API", "MongoDB Aggregation"
    source = Column(String, default="ai")                       # ai | resume_ai | jd_ai | role_ai | bank | custom
    difficulty = Column(String, nullable=True)                  # easy | medium | hard
    resume_reference = Column(String, nullable=True)            # Grounding reference in resume
    similarity_score = Column(Float, nullable=True)             # Cosine similarity score for debug
    embedding_json = Column(JSON, nullable=True)                # Embedding vector stored as JSON list for pgvector compat

    expected_concepts = Column(JSON, default=list)
    coding_starter_code = Column(Text, nullable=True)
    coding_test_cases = Column(JSON, default=list)
    coding_language = Column(String, nullable=True)
    is_follow_up = Column(Boolean, default=False)
    parent_question_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("InterviewSession", back_populates="questions")
    answers = relationship("CandidateAnswer", back_populates="question", cascade="all, delete-orphan")


class CandidateAnswer(Base):
    __tablename__ = "candidate_answers"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    question_id = Column(String, ForeignKey("interview_questions.id", ondelete="CASCADE"), index=True, nullable=False)
    session_id = Column(String, ForeignKey("interview_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    answer_text = Column(Text, nullable=False)
    code_submission = Column(Text, nullable=True)
    duration_seconds = Column(Float, default=0.0)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    question = relationship("InterviewQuestion", back_populates="answers")
    evaluation = relationship("AnswerEvaluation", back_populates="answer", uselist=False, cascade="all, delete-orphan")


class AnswerEvaluation(Base):
    __tablename__ = "answer_evaluations"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    answer_id = Column(String, ForeignKey("candidate_answers.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)

    # 8 Criteria (0-10 each)
    score = Column(Float, nullable=False, default=0.0)  # Overall calculated score
    correct = Column(Boolean, default=True)
    technical_depth = Column(Float, default=0.0)
    communication = Column(Float, default=0.0)
    correctness = Column(Float, default=0.0)
    relevance = Column(Float, default=0.0)
    completeness = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    examples = Column(Float, default=0.0)
    problem_solving = Column(Float, default=0.0)

    # Feedback and guidance
    missing_points = Column(JSON, default=list)
    feedback = Column(Text, nullable=False)
    recommended_answer = Column(Text, nullable=True)
    suggested_improvements = Column(JSON, default=list)
    follow_up_question = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    answer = relationship("CandidateAnswer", back_populates="evaluation")


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    session_id = Column(String, ForeignKey("interview_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    speaker = Column(String, nullable=False)  # interviewer, candidate, ai_coach
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    confidence = Column(Float, default=1.0)

    # Relationships
    session = relationship("InterviewSession", back_populates="transcripts")


class InterviewScore(Base):
    __tablename__ = "interview_scores"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    session_id = Column(String, ForeignKey("interview_sessions.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)

    overall_score = Column(Float, nullable=False, default=0.0)
    technical_score = Column(Float, nullable=False, default=0.0)
    communication_score = Column(Float, nullable=False, default=0.0)
    problem_solving_score = Column(Float, nullable=False, default=0.0)
    confidence_score = Column(Float, nullable=False, default=0.0)

    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    questions_answered_well = Column(JSON, default=list)
    questions_answered_poorly = Column(JSON, default=list)
    recommended_study_topics = Column(JSON, default=list)
    final_recommendation = Column(String, default="Needs Practice")  # Ready, Needs Practice, Needs Significant Improvement
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("InterviewSession", back_populates="score")


class InterviewFeedback(Base):
    __tablename__ = "interview_feedbacks"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    session_id = Column(String, ForeignKey("interview_sessions.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    interviewer_notes = Column(Text, nullable=True)
    candidate_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("InterviewSession", back_populates="feedback")


# ─────────────────────────────────────────────────────────────────────────────
# Cross-session duplicate prevention models
# ─────────────────────────────────────────────────────────────────────────────

class UserQuestionHistory(Base):
    """
    Persists every question ever asked to a user (normalized form), so the
    question engine can avoid repeating questions across multiple interview
    sessions.
    """
    __tablename__ = "user_question_history"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    session_id = Column(String, ForeignKey("interview_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    question_text = Column(Text, nullable=False)
    normalized_text = Column(Text, nullable=False, index=True)
    category = Column(String, nullable=True)
    topic = Column(String, nullable=True)
    resume_reference = Column(String, nullable=True)
    asked_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="question_history")

    __table_args__ = (
        UniqueConstraint("user_id", "normalized_text", name="uq_user_normalized_question"),
    )


class UserWeakArea(Base):
    """
    Tracks per-user weak topics/categories so adaptive difficulty can increase
    coverage of areas where the candidate is struggling.
    """
    __tablename__ = "user_weak_areas"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    topic = Column(String, nullable=False)
    category = Column(String, nullable=True)
    total_score = Column(Float, default=0.0)
    attempts = Column(Integer, default=0)
    avg_score = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="weak_areas")

    __table_args__ = (
        UniqueConstraint("user_id", "topic", name="uq_user_topic"),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Resume chunks for pgvector-based semantic RAG
# ─────────────────────────────────────────────────────────────────────────────

class ResumeChunk(Base):
    """
    Stores individual chunks of a parsed resume alongside their embedding vectors.
    Used by the resume RAG pipeline to retrieve the most relevant resume context
    for a given question topic via vector similarity search (pgvector) or
    TF-IDF cosine similarity (SQLite fallback).
    """
    __tablename__ = "resume_chunks"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    resume_id = Column(String, ForeignKey("resumes.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    section = Column(String, nullable=True)       # "project" | "skills" | "experience" | "text"
    chunk_title = Column(String, nullable=True)   # e.g. project name
    chunk_text = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict)    # raw_data from chunk_resume()
    embedding_json = Column(JSON, nullable=True)  # Embedding vector as JSON list
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    resume = relationship("Resume", backref="chunks")


# ─────────────────────────────────────────────────────────────────────────────
# Role Profiles (Admin & Dynamic Role Configuration - Spec §58)
# ─────────────────────────────────────────────────────────────────────────────

class RoleProfile(Base):
    """
    Stores configurable role definitions, default topics, expected skills,
    and question categories. Admins can create and edit roles dynamically.
    """
    __tablename__ = "role_profiles"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    topics = Column(JSON, default=list)              # e.g. ["React", "Node.js", "System Design"]
    skills = Column(JSON, default=list)              # e.g. ["JavaScript", "TypeScript", "SQL"]
    question_categories = Column(JSON, default=list) # e.g. ["Frontend", "Backend", "Architecture"]
    is_active = Column(Boolean, default=True)
    is_custom = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────────────────────────
# Interview Events (Observability & Audit Trail - Spec §33, §60)
# ─────────────────────────────────────────────────────────────────────────────

class InterviewEvent(Base):
    """
    Records fine-grained interview lifecycle events for observability, audit,
    and performance tracking.
    """
    __tablename__ = "interview_events"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    session_id = Column(String, ForeignKey("interview_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    event_type = Column(String, nullable=False, index=True)
    payload = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

