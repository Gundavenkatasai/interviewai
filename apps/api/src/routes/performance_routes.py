"""
performance_routes.py
─────────────────────
User performance analytics endpoints.
Reads from UserWeakArea to provide per-topic performance data.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from src.database import get_db
from src.models.models import User, UserWeakArea, InterviewSession, InterviewScore
from src.auth.auth import get_current_user

router = APIRouter(prefix="/performance", tags=["Performance"])


@router.get("")
def get_performance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns detailed per-topic performance analytics for the current user,
    computed from UserWeakArea records updated after each answer evaluation.
    """
    weak_areas = (
        db.query(UserWeakArea)
        .filter(UserWeakArea.user_id == current_user.id)
        .order_by(UserWeakArea.avg_score.asc())
        .all()
    )

    topics_data = []
    for wa in weak_areas:
        topics_data.append({
            "topic": wa.topic,
            "category": wa.category,
            "avg_score": round(wa.avg_score, 2),
            "attempts": wa.attempts,
            "total_score": round(wa.total_score, 2),
            "status": (
                "Strong" if wa.avg_score >= 7.5
                else "Needs Work" if wa.avg_score >= 5.0
                else "Weak Area"
            ),
            "last_updated": wa.last_updated.isoformat() if wa.last_updated else None,
        })

    # Classify
    strong = [t for t in topics_data if t["avg_score"] >= 7.5]
    needs_work = [t for t in topics_data if 5.0 <= t["avg_score"] < 7.5]
    weak = [t for t in topics_data if t["avg_score"] < 5.0]

    # Recommended topics to study
    recommendations = []
    for t in sorted(weak_areas, key=lambda x: x.avg_score)[:5]:
        if t.avg_score < 6.0 and t.attempts >= 1:
            recommendations.append({
                "topic": t.topic,
                "category": t.category,
                "avg_score": round(t.avg_score, 2),
                "reason": f"Your average score is {round(t.avg_score, 1)}/10 across {t.attempts} attempt(s)."
            })

    # Category aggregates
    cat_scores: dict = {}
    cat_counts: dict = {}
    for wa in weak_areas:
        cat = wa.category or "General"
        if cat not in cat_scores:
            cat_scores[cat] = 0
            cat_counts[cat] = 0
        cat_scores[cat] += wa.avg_score
        cat_counts[cat] += 1

    category_performance = [
        {
            "category": cat,
            "avg_score": round(cat_scores[cat] / cat_counts[cat], 2),
            "topic_count": cat_counts[cat]
        }
        for cat in cat_scores
    ]

    return {
        "all_topics": topics_data,
        "strong_areas": strong,
        "needs_work_areas": needs_work,
        "weak_areas": weak,
        "recommendations": recommendations,
        "category_performance": sorted(category_performance, key=lambda x: x["avg_score"], reverse=True),
        "total_topics_tracked": len(topics_data),
    }


@router.get("/summary")
def get_performance_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Quick summary stats for the dashboard header."""
    weak_areas = (
        db.query(UserWeakArea)
        .filter(UserWeakArea.user_id == current_user.id)
        .all()
    )

    if not weak_areas:
        return {"overall_avg": 0.0, "topics_tracked": 0, "strong_count": 0, "weak_count": 0}

    scores = [wa.avg_score for wa in weak_areas]
    return {
        "overall_avg": round(sum(scores) / len(scores), 2),
        "topics_tracked": len(weak_areas),
        "strong_count": sum(1 for s in scores if s >= 7.5),
        "needs_work_count": sum(1 for s in scores if 5.0 <= s < 7.5),
        "weak_count": sum(1 for s in scores if s < 5.0),
    }
