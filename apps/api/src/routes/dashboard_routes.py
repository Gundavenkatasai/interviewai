from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from src.database import get_db
from src.models.models import User, InterviewSession, InterviewScore
from src.auth.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .order_by(desc(InterviewSession.created_at))
        .all()
    )

    total_interviews = len(sessions)
    completed_sessions = [s for s in sessions if s.status == "completed" and s.score]

    if not completed_sessions:
        return {
            "total_interviews": total_interviews,
            "completed_interviews": 0,
            "average_score": 0.0,
            "technical_score": 0.0,
            "communication_score": 0.0,
            "problem_solving_score": 0.0,
            "confidence_score": 0.0,
            "strongest_skills": ["System Design", "JavaScript", "Problem Solving"],
            "weakest_skills": ["Concurrency", "Database Indexing"],
            "recent_interviews": [
                {
                    "id": s.id,
                    "role": s.role,
                    "difficulty": s.difficulty,
                    "interview_type": s.interview_type,
                    "status": s.status,
                    "created_at": s.created_at.isoformat(),
                    "score": s.score.overall_score if s.score else None
                } for s in sessions[:5]
            ],
            "score_over_time": [],
            "performance_radar": [
                {"subject": "Technical", "score": 75, "fullMark": 100},
                {"subject": "Communication", "score": 80, "fullMark": 100},
                {"subject": "Problem Solving", "score": 70, "fullMark": 100},
                {"subject": "Confidence", "score": 85, "fullMark": 100},
                {"subject": "Relevance", "score": 80, "fullMark": 100}
            ],
            "topic_performance": [
                {"topic": "Frontend Architecture", "score": 82},
                {"topic": "Backend APIs", "score": 78},
                {"topic": "Database Systems", "score": 70},
                {"topic": "Data Structures", "score": 75}
            ]
        }

    # Aggregate actual stats
    scores = [s.score.overall_score for s in completed_sessions]
    tech_scores = [s.score.technical_score for s in completed_sessions]
    comm_scores = [s.score.communication_score for s in completed_sessions]
    prob_scores = [s.score.problem_solving_score for s in completed_sessions]
    conf_scores = [s.score.confidence_score for s in completed_sessions]

    avg_overall = round(sum(scores) / len(scores), 1)
    avg_tech = round(sum(tech_scores) / len(tech_scores), 1)
    avg_comm = round(sum(comm_scores) / len(comm_scores), 1)
    avg_prob = round(sum(prob_scores) / len(prob_scores), 1)
    avg_conf = round(sum(conf_scores) / len(conf_scores), 1)

    all_strengths = []
    all_weaknesses = []
    for s in completed_sessions:
        if s.score.strengths:
            all_strengths.extend(s.score.strengths)
        if s.score.weaknesses:
            all_weaknesses.extend(s.score.weaknesses)

    score_over_time = [
        {
            "date": s.created_at.strftime("%b %d"),
            "score": s.score.overall_score,
            "technical": s.score.technical_score,
            "communication": s.score.communication_score,
            "role": s.role
        } for s in reversed(completed_sessions[-10:])
    ]

    return {
        "total_interviews": total_interviews,
        "completed_interviews": len(completed_sessions),
        "average_score": avg_overall,
        "technical_score": avg_tech,
        "communication_score": avg_comm,
        "problem_solving_score": avg_prob,
        "confidence_score": avg_conf,
        "strongest_skills": list(set(all_strengths))[:4] or ["Clean Code", "Clear Communication"],
        "weakest_skills": list(set(all_weaknesses))[:4] or ["Edge Case Handling", "System Scaling"],
        "recent_interviews": [
            {
                "id": s.id,
                "role": s.role,
                "difficulty": s.difficulty,
                "interview_type": s.interview_type,
                "status": s.status,
                "created_at": s.created_at.isoformat(),
                "score": s.score.overall_score if s.score else None
            } for s in sessions[:5]
        ],
        "score_over_time": score_over_time,
        "performance_radar": [
            {"subject": "Technical", "score": int(avg_tech * 10), "fullMark": 100},
            {"subject": "Communication", "score": int(avg_comm * 10), "fullMark": 100},
            {"subject": "Problem Solving", "score": int(avg_prob * 10), "fullMark": 100},
            {"subject": "Confidence", "score": int(avg_conf * 10), "fullMark": 100},
            {"subject": "Relevance", "score": int(avg_overall * 10), "fullMark": 100}
        ],
        "topic_performance": [
            {"topic": "System Architecture", "score": int(avg_tech * 10)},
            {"topic": "Communication Style", "score": int(avg_comm * 10)},
            {"topic": "Algorithmic Thinking", "score": int(avg_prob * 10)},
            {"topic": "Execution Confidence", "score": int(avg_conf * 10)}
        ]
    }
