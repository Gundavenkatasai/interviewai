"""
interview_routes.py
────────────────────
All interview session endpoints.

Key changes from original:
  - POST /api/interviews now generates only the FIRST question via question_engine
    instead of pre-generating the full set.  This is the root-cause fix for
    repeated questions.
  - Idempotency guard: a second POST within 5 seconds returns the existing
    in-progress session (prevents double-click duplicate sessions).
  - NEW: POST /api/interviews/{session_id}/next-question — backend generates
    and returns the next question using the full dedup pipeline.
  - POST /api/interviews/{session_id}/answers now updates UserWeakArea via
    question_engine.update_weak_area().
"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from src.database import get_db
from src.models.models import (
    User, InterviewSession, InterviewQuestion, CandidateAnswer,
    AnswerEvaluation, Transcript, InterviewScore, InterviewFeedback,
    Resume, JobDescription, InterviewEvent
)
from src.schemas.schemas import (
    InterviewCreate, InterviewOut, InterviewDetailOut,
    QuestionCreate, QuestionOut, AnswerSubmit, CandidateAnswerOut,
    TranscriptSubmit, TranscriptOut, InterviewScoreOut,
    InterviewFeedbackSubmit, ElapsedTimeUpdate, NextQuestionResponse
)
from src.auth.auth import get_current_user
from src.services.ai_service import ai_service
from src.services.question_engine import generate_next_question, update_weak_area
from src.services.interview_state_machine import safe_transition
from src.websocket.manager import ws_manager
import logging

logger = logging.getLogger("interviewai.interview_routes")
router = APIRouter(prefix="/interviews", tags=["Interviews"])


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/interviews — Create a new interview session
# ─────────────────────────────────────────────────────────────────────────────

@router.post("", response_model=InterviewDetailOut, status_code=status.HTTP_201_CREATED)
@router.post("/start", response_model=InterviewDetailOut, status_code=status.HTTP_201_CREATED)
async def create_interview(
    data: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new InterviewSession and generates the first question via the
    full question-engine pipeline.

    Idempotency: if the same user has an in-progress session created within
    the last 5 seconds (double-click / race condition), that session is returned
    instead of creating a duplicate.
    """
    # ── Idempotency guard ────────────────────────────────────────────────────
    five_seconds_ago = datetime.utcnow() - timedelta(seconds=5)
    recent_session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.user_id == current_user.id,
            InterviewSession.status == "in_progress",
            InterviewSession.created_at >= five_seconds_ago,
            InterviewSession.role == data.role,
        )
        .first()
    )
    if recent_session:
        logger.info(
            "[INTERVIEW] Idempotency hit — returning existing session %s for user %s",
            recent_session.id, current_user.id
        )
        db.refresh(recent_session)
        return recent_session

    # ── Create session entity ────────────────────────────────────────────────
    session = InterviewSession(
        user_id=current_user.id,
        role=data.role,
        company=data.company,
        experience_level=data.experience_level,
        interview_type=data.interview_type,
        difficulty=data.difficulty,
        technologies=data.technologies,
        coach_mode=data.coach_mode,
        duration_minutes=data.duration_minutes,
        max_questions=data.max_questions,
        resume_id=data.resume_id,
        job_description_id=data.job_description_id,
        status="in_progress",
        started_at=datetime.utcnow(),
        question_count=0,
        current_question_index=0,
    )

    # If JD was pasted as text (not stored), save it first
    if data.job_description_text and not data.job_description_id:
        jd = JobDescription(
            user_id=current_user.id,
            title=f"{data.role} JD",
            company=data.company,
            raw_text=data.job_description_text,
        )
        db.add(jd)
        db.flush()
        session.job_description_id = jd.id

    db.add(session)
    db.commit()
    db.refresh(session)

    logger.info("[INTERVIEW_START] sessionId=%s userId=%s role=%s", session.id, current_user.id, session.role)
    db.add(InterviewEvent(
        session_id=session.id,
        event_type="INTERVIEW_START",
        payload={"role": session.role, "difficulty": session.difficulty, "experience": session.experience_level}
    ))
    db.commit()

    # ── Generate first question via engine ───────────────────────────────────
    try:
        await generate_next_question(session, db)
        db.refresh(session)
    except Exception as e:
        logger.error("[INTERVIEW] First question generation failed: %s", e)
        # Don't abort — session was created; user can request next question

    return session


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/interviews
# ─────────────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[InterviewOut])
def list_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .order_by(desc(InterviewSession.created_at))
        .all()
    )
    return sessions


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/interviews/{session_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/{session_id}", response_model=InterviewDetailOut)
def get_interview(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = (
        db.query(InterviewSession)
        .filter(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/interviews/{session_id}/next-question  ← NEW CORE ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/{session_id}/next-question", response_model=NextQuestionResponse)
async def get_next_question(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates and returns the next question for this session.
    Backend is the authoritative source — frontend never generates questions.

    Full pipeline: category rotation → candidate generation → dedup → bank fallback → persist.
    Auto-completes session when question_count >= max_questions.
    """
    session = (
        db.query(InterviewSession)
        .filter(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Interview session is already completed")

    # ── Check if max questions reached ────────────────────────────────────
    max_q = getattr(session, "max_questions", 10) or 10
    if session.question_count >= max_q:
        raise HTTPException(
            status_code=400,
            detail=f"Interview complete: all {max_q} questions have been answered. Please call /complete to finalize."
        )

    try:
        safe_transition(session, "GENERATING_NEXT", db=db)
        new_question = await generate_next_question(session, db)
        safe_transition(session, "READY", db=db)
    except Exception as e:
        logger.error("[INTERVIEW] next-question generation error: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to generate next question: {str(e)}")

    # Build category distribution for client-side display
    db.refresh(session)
    cat_dist: dict = {}
    for q in session.questions:
        cat_dist[q.category] = cat_dist.get(q.category, 0) + 1

    interview_complete = session.question_count >= max_q

    return NextQuestionResponse(
        question=new_question,
        session_question_count=session.question_count,
        max_questions=max_q,
        category_distribution=cat_dist,
        interview_complete=interview_complete,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/interviews/{session_id}/questions — Add custom question (Interviewer mode)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/{session_id}/questions", response_model=QuestionOut)
def add_question(
    session_id: str,
    q_data: QuestionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    from src.services.question_normalizer import normalize_for_storage
    count = db.query(InterviewQuestion).filter(InterviewQuestion.session_id == session_id).count()
    new_q = InterviewQuestion(
        session_id=session_id,
        question_order=count + 1,
        question_text=q_data.question_text,
        normalized_text=normalize_for_storage(q_data.question_text),
        category=q_data.category,
        source="custom",
        expected_concepts=q_data.expected_concepts,
        coding_starter_code=q_data.coding_starter_code,
        coding_test_cases=q_data.coding_test_cases,
        coding_language=q_data.coding_language
    )
    db.add(new_q)
    session.question_count = count + 1
    db.commit()
    db.refresh(new_q)
    return new_q


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/interviews/{session_id}/answers — Submit answer + evaluate
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/{session_id}/answers", response_model=CandidateAnswerOut)
@router.post("/{session_id}/answer", response_model=CandidateAnswerOut)
async def submit_answer(
    session_id: str,
    ans_data: AnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    question = db.query(InterviewQuestion).filter(
        InterviewQuestion.id == ans_data.question_id,
        InterviewQuestion.session_id == session_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Broadcast AI Analyzing status
    await ws_manager.send_status(session_id, "Analyzing...")

    # Save Candidate Answer
    answer = CandidateAnswer(
        question_id=ans_data.question_id,
        session_id=session_id,
        answer_text=ans_data.answer_text,
        code_submission=ans_data.code_submission,
        duration_seconds=ans_data.duration_seconds
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)

    # Save candidate response to transcript
    cand_transcript = Transcript(
        session_id=session_id,
        speaker="candidate",
        content=ans_data.answer_text
    )
    db.add(cand_transcript)
    db.commit()

    # AI Evaluation
    eval_res = await ai_service.evaluate_answer(
        question_text=question.question_text,
        expected_concepts=question.expected_concepts or [],
        candidate_answer=ans_data.answer_text,
        role=session.role,
        experience_level=session.experience_level,
        coach_mode=session.coach_mode
    )

    # Save Answer Evaluation
    db_eval = AnswerEvaluation(
        answer_id=answer.id,
        score=eval_res.score,
        correct=eval_res.correct,
        technical_depth=eval_res.technical_depth,
        communication=eval_res.communication,
        correctness=eval_res.correctness,
        relevance=eval_res.relevance,
        completeness=eval_res.completeness,
        confidence=eval_res.confidence,
        examples=eval_res.examples,
        problem_solving=eval_res.problem_solving,
        missing_points=eval_res.missing_points,
        feedback=eval_res.feedback,
        recommended_answer=eval_res.recommended_answer,
        suggested_improvements=eval_res.suggested_improvements,
        follow_up_question=eval_res.follow_up_question
    )
    db.add(db_eval)
    db.commit()
    db.refresh(answer)

    # ── Update weak areas for adaptive question generation ────────────────────
    topic = question.topic or question.category or "General"
    category = question.category or "Technical"
    try:
        await update_weak_area(
            user_id=current_user.id,
            topic=topic,
            category=category,
            score=eval_res.score,
            db=db,
        )
    except Exception as e:
        logger.warning("[INTERVIEW] Failed to update weak area: %s", e)

    # Broadcast evaluation & ready state
    await ws_manager.send_evaluation(session_id, {
        "question_id": question.id,
        "score": eval_res.score,
        "feedback": eval_res.feedback,
        "missing_points": eval_res.missing_points,
        "follow_up_question": eval_res.follow_up_question
    })
    await ws_manager.send_status(session_id, "Ready")

    return answer


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/interviews/{session_id}/transcript
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/{session_id}/transcript", response_model=TranscriptOut)
async def add_transcript(
    session_id: str,
    t_data: TranscriptSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    transcript = Transcript(
        session_id=session_id,
        speaker=t_data.speaker,
        content=t_data.content,
        confidence=t_data.confidence
    )
    db.add(transcript)
    db.commit()
    db.refresh(transcript)

    await ws_manager.send_transcript(session_id, t_data.speaker, t_data.content)
    return transcript


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/interviews/{session_id}/elapsed
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/{session_id}/elapsed")
def update_elapsed_time(
    session_id: str,
    time_data: ElapsedTimeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.elapsed_seconds = time_data.elapsed_seconds
    db.commit()
    return {"status": "ok", "elapsed_seconds": session.elapsed_seconds}


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/interviews/{session_id}/feedback
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/{session_id}/feedback")
def update_feedback(
    session_id: str,
    fb_data: InterviewFeedbackSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    fb = db.query(InterviewFeedback).filter(InterviewFeedback.session_id == session_id).first()
    if not fb:
        fb = InterviewFeedback(session_id=session_id)
        db.add(fb)

    if fb_data.interviewer_notes is not None:
        fb.interviewer_notes = fb_data.interviewer_notes
    if fb_data.candidate_notes is not None:
        fb.candidate_notes = fb_data.candidate_notes

    db.commit()
    return {"status": "ok"}


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/interviews/{session_id}/complete
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/{session_id}/complete", response_model=InterviewScoreOut)
async def complete_interview(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "completed"
    session.completed_at = datetime.utcnow()

    # Collate all questions, answers, and evaluations
    questions_data = []
    for q in session.questions:
        for a in q.answers:
            if a.evaluation:
                questions_data.append({
                    "question": q.question_text,
                    "answer": a.answer_text,
                    "score": a.evaluation.score,
                    "correct": a.evaluation.correct,
                    "technical_depth": a.evaluation.technical_depth,
                    "communication": a.evaluation.communication,
                    "missing_points": a.evaluation.missing_points
                })

    # Generate full diagnostic report with AI
    report_ai = await ai_service.generate_interview_report(
        role=session.role,
        experience_level=session.experience_level,
        difficulty=session.difficulty,
        questions_with_answers_and_scores=questions_data
    )

    # Save or update InterviewScore
    score = db.query(InterviewScore).filter(InterviewScore.session_id == session_id).first()
    if not score:
        score = InterviewScore(session_id=session_id)
        db.add(score)

    score.overall_score = report_ai.overall_score
    score.technical_score = report_ai.technical_score
    score.communication_score = report_ai.communication_score
    score.problem_solving_score = report_ai.problem_solving_score
    score.confidence_score = report_ai.confidence_score
    score.strengths = report_ai.strengths
    score.weaknesses = report_ai.weaknesses
    score.questions_answered_well = report_ai.questions_answered_well
    score.questions_answered_poorly = report_ai.questions_answered_poorly
    score.recommended_study_topics = report_ai.recommended_study_topics
    score.final_recommendation = report_ai.final_recommendation

    db.commit()
    db.refresh(score)

    await ws_manager.broadcast(session_id, {"type": "session_completed", "score": score.overall_score})

    db.add(InterviewEvent(
        session_id=session_id,
        event_type="SESSION_COMPLETED",
        payload={"overall_score": score.overall_score, "recommendation": score.final_recommendation}
    ))
    db.commit()

    return score


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/interviews/{session_id}/report — Full diagnostic report (Spec §48, §54)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/{session_id}/report")
async def get_interview_report(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns full post-interview diagnostic evaluation report with overall scores,
    per-dimension analysis, rubric feedback, and question-by-question breakdown.
    """
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    score = db.query(InterviewScore).filter(InterviewScore.session_id == session_id).first()

    questions_breakdown = []
    for q in session.questions:
        ans_data = []
        for a in q.answers:
            ans_data.append({
                "id": a.id,
                "answer_text": a.answer_text,
                "duration_seconds": a.duration_seconds,
                "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
                "evaluation": {
                    "score": a.evaluation.score,
                    "correct": a.evaluation.correct,
                    "technical_depth": a.evaluation.technical_depth,
                    "communication": a.evaluation.communication,
                    "correctness": a.evaluation.correctness,
                    "relevance": a.evaluation.relevance,
                    "completeness": a.evaluation.completeness,
                    "confidence": a.evaluation.confidence,
                    "examples": a.evaluation.examples,
                    "problem_solving": a.evaluation.problem_solving,
                    "missing_points": a.evaluation.missing_points,
                    "feedback": a.evaluation.feedback,
                    "recommended_answer": a.evaluation.recommended_answer,
                    "suggested_improvements": a.evaluation.suggested_improvements,
                    "follow_up_question": a.evaluation.follow_up_question,
                } if a.evaluation else None
            })
        questions_breakdown.append({
            "id": q.id,
            "order": q.question_order,
            "question_text": q.question_text,
            "category": q.category,
            "topic": q.topic,
            "source": q.source,
            "difficulty": q.difficulty,
            "resume_reference": q.resume_reference,
            "expected_concepts": q.expected_concepts,
            "is_follow_up": q.is_follow_up,
            "answers": ans_data
        })

    return {
        "session_id": session.id,
        "role": session.role,
        "company": session.company,
        "experience_level": session.experience_level,
        "interview_type": session.interview_type,
        "difficulty": session.difficulty,
        "status": session.status,
        "started_at": session.started_at.isoformat() if session.started_at else None,
        "completed_at": session.completed_at.isoformat() if session.completed_at else None,
        "duration_minutes": session.duration_minutes,
        "elapsed_seconds": session.elapsed_seconds,
        "question_count": session.question_count,
        "score": {
            "overall_score": score.overall_score if score else 0.0,
            "technical_score": score.technical_score if score else 0.0,
            "communication_score": score.communication_score if score else 0.0,
            "problem_solving_score": score.problem_solving_score if score else 0.0,
            "confidence_score": score.confidence_score if score else 0.0,
            "strengths": score.strengths if score else [],
            "weaknesses": score.weaknesses if score else [],
            "questions_answered_well": score.questions_answered_well if score else [],
            "questions_answered_poorly": score.questions_answered_poorly if score else [],
            "recommended_study_topics": score.recommended_study_topics if score else [],
            "final_recommendation": score.final_recommendation if score else ("Completed" if session.status == "completed" else "In Progress"),
        } if score else None,
        "questions": questions_breakdown
    }


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /api/interviews/{session_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    db.delete(session)
    db.commit()
    return None

