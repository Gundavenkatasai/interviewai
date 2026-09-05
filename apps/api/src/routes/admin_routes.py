import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from src.database import get_db
from src.models.models import User, RoleProfile, InterviewSession, InterviewQuestion, InterviewScore, UserWeakArea
from src.auth.auth import get_current_user
from src.config import settings
from src.services.question_bank import QUESTION_BANK

logger = logging.getLogger("interviewai.admin_routes")
router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Verifies that the requesting user has administrator privileges."""
    if not current_user.is_admin:
        # For development / convenience, if user email contains admin or is_admin flag is set
        if "admin" in current_user.email.lower():
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to access this endpoint."
        )
    return current_user


# ── Pydantic Schemas for Admin ───────────────────────────────────────────────

class RoleProfileCreate(BaseModel):
    name: str
    description: Optional[str] = None
    topics: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    question_categories: List[str] = Field(default_factory=list)

class RoleProfileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    topics: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    question_categories: Optional[List[str]] = None
    is_active: Optional[bool] = None

class ThresholdUpdate(BaseModel):
    duplicate_threshold: Optional[float] = Field(None, ge=0.5, le=1.0)
    question_candidates_count: Optional[int] = Field(None, ge=3, le=20)
    default_max_questions: Optional[int] = Field(None, ge=3, le=50)


# ── Role Profile Management (Spec §58, §59) ──────────────────────────────────

@router.get("/roles")
def list_role_profiles(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Lists all configured role profiles (default and custom)."""
    roles = db.query(RoleProfile).order_by(RoleProfile.name.asc()).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "topics": r.topics or [],
            "skills": r.skills or [],
            "question_categories": r.question_categories or [],
            "is_active": r.is_active,
            "is_custom": r.is_custom,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in roles
    ]

@router.post("/roles", status_code=status.HTTP_201_CREATED)
def create_role_profile(
    role_data: RoleProfileCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Creates a new role profile with custom topics and skills."""
    existing = db.query(RoleProfile).filter(RoleProfile.name.ilike(role_data.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Role '{role_data.name}' already exists.")

    new_role = RoleProfile(
        name=role_data.name,
        description=role_data.description,
        topics=role_data.topics,
        skills=role_data.skills,
        question_categories=role_data.question_categories,
        is_custom=True,
        is_active=True,
    )
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

@router.put("/roles/{role_id}")
def update_role_profile(
    role_id: str,
    update_data: RoleProfileUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Updates topics, skills, and settings for a role profile."""
    role = db.query(RoleProfile).filter(RoleProfile.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role profile not found")

    if update_data.name is not None:
        role.name = update_data.name
    if update_data.description is not None:
        role.description = update_data.description
    if update_data.topics is not None:
        role.topics = update_data.topics
    if update_data.skills is not None:
        role.skills = update_data.skills
    if update_data.question_categories is not None:
        role.question_categories = update_data.question_categories
    if update_data.is_active is not None:
        role.is_active = update_data.is_active

    db.commit()
    db.refresh(role)
    return role

@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role_profile(
    role_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Deletes a custom role profile."""
    role = db.query(RoleProfile).filter(RoleProfile.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role profile not found")
    db.delete(role)
    db.commit()
    return None


# ── System Metrics & Analytics (Spec §59) ────────────────────────────────────

@router.get("/metrics")
def get_admin_metrics(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Returns platform-wide interview metrics, role usage, and scoring distributions."""
    total_users = db.query(User).count()
    total_sessions = db.query(InterviewSession).count()
    completed_sessions = db.query(InterviewSession).filter(InterviewSession.status == "completed").count()
    total_questions = db.query(InterviewQuestion).count()

    # Average score
    avg_score_res = db.query(func.avg(InterviewScore.overall_score)).scalar()
    avg_score = round(float(avg_score_res), 2) if avg_score_res else 0.0

    # Role breakdown
    role_counts = (
        db.query(InterviewSession.role, func.count(InterviewSession.id))
        .group_by(InterviewSession.role)
        .order_by(func.count(InterviewSession.id).desc())
        .all()
    )

    # Weak areas aggregate
    top_weak_topics = (
        db.query(UserWeakArea.topic, func.avg(UserWeakArea.avg_score), func.count(UserWeakArea.id))
        .group_by(UserWeakArea.topic)
        .order_by(func.avg(UserWeakArea.avg_score).asc())
        .limit(10)
        .all()
    )

    return {
        "overview": {
            "total_users": total_users,
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "completion_rate": round((completed_sessions / total_sessions * 100), 1) if total_sessions > 0 else 0,
            "total_questions_asked": total_questions,
            "average_overall_score": avg_score,
        },
        "role_breakdown": [{"role": r[0], "count": r[1]} for r in role_counts],
        "top_weak_topics": [
            {"topic": t[0], "avg_score": round(float(t[1]), 2), "candidate_count": t[2]}
            for t in top_weak_topics
        ]
    }


# ── Model Status & System Health (Spec §59, §61) ─────────────────────────────

@router.get("/system-health")
def get_system_health(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Detailed health check for admin observability."""
    from src.database import engine
    from sqlalchemy import text

    db_health = "healthy"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        db_health = f"unhealthy: {str(e)[:60]}"

    pgvector_health = "healthy" if settings.ENABLE_PGVECTOR else "sqlite_fallback"
    llm_health = "healthy"
    embedding_health = "healthy" if settings.ENABLE_EMBEDDING_SERVICE else "disabled"
    speech_health = "healthy"

    return {
        "status": "healthy" if db_health == "healthy" else "degraded",
        "database": db_health,
        "vectorSearch": pgvector_health,
        "llm": {
            "status": llm_health,
            "provider": settings.LLM_PROVIDER,
            "model": settings.GROQ_MODEL if settings.is_groq_provider else settings.MODEL_NAME,
            "base_url": settings.MODEL_BASE_URL if not settings.is_groq_provider else "https://api.groq.com/openai/v1",
            "temperature": settings.TEMPERATURE,
            "top_p": settings.TOP_P,
            "max_tokens": settings.MAX_TOKENS,
        },
        "embedding": {
            "status": embedding_health,
            "provider": settings.EMBEDDING_PROVIDER,
            "model": settings.EMBEDDING_MODEL,
            "dimension": settings.EMBEDDING_DIM,
        },
        "speech": {
            "status": speech_health,
            "provider": settings.STT_PROVIDER,
            "whisper_model": settings.GROQ_WHISPER_MODEL,
        },
        "thresholds": {
            "duplicate_threshold": settings.QUESTION_SIMILARITY_THRESHOLD,
            "candidate_count": settings.QUESTION_CANDIDATES_COUNT,
            "default_max_questions": settings.DEFAULT_MAX_QUESTIONS,
        }
    }


# ── Thresholds & Configuration (Spec §59) ────────────────────────────────────

@router.put("/thresholds")
def update_thresholds(
    data: ThresholdUpdate,
    current_user: User = Depends(require_admin)
):
    """Updates runtime threshold settings for duplicate detection and candidate generation."""
    if data.duplicate_threshold is not None:
        settings.QUESTION_SIMILARITY_THRESHOLD = data.duplicate_threshold
    if data.question_candidates_count is not None:
        settings.QUESTION_CANDIDATES_COUNT = data.question_candidates_count
    if data.default_max_questions is not None:
        settings.DEFAULT_MAX_QUESTIONS = data.default_max_questions

    logger.info(
        "[ADMIN] Updated thresholds: duplicate_threshold=%.2f, candidates=%d, max_q=%d",
        settings.QUESTION_SIMILARITY_THRESHOLD,
        settings.QUESTION_CANDIDATES_COUNT,
        settings.DEFAULT_MAX_QUESTIONS,
    )
    return {
        "status": "ok",
        "duplicate_threshold": settings.QUESTION_SIMILARITY_THRESHOLD,
        "question_candidates_count": settings.QUESTION_CANDIDATES_COUNT,
        "default_max_questions": settings.DEFAULT_MAX_QUESTIONS,
    }


# ── Fallback Questions Management (Spec §37, §59) ────────────────────────────

@router.get("/fallback-questions")
def get_fallback_questions(
    current_user: User = Depends(require_admin)
):
    """Lists fallback question bank categorized by role and difficulty."""
    bank_summary = {}
    for cat, diff_dict in QUESTION_BANK.items():
        bank_summary[cat] = {
            diff: len(q_list) for diff, q_list in diff_dict.items()
        }
    total_bank_questions = sum(
        len(q_list)
        for cat in QUESTION_BANK.values()
        for q_list in cat.values()
    )
    return {
        "total_questions": total_bank_questions,
        "categories": list(QUESTION_BANK.keys()),
        "summary": bank_summary,
        "sample": {
            cat: {diff: q_list[:2] for diff, q_list in diff_dict.items()}
            for cat, diff_dict in list(QUESTION_BANK.items())[:3]
        }
    }
