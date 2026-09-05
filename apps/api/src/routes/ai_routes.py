from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from src.services.ai_service import ai_service
from src.schemas.schemas import AnswerEvaluationAIResponse
from src.models.models import User
from src.auth.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Engine"])

class EvaluateAnswerRequest(BaseModel):
    question_text: str
    expected_concepts: List[str] = []
    candidate_answer: str
    role: str = "Software Engineer"
    experience_level: str = "Mid-level"
    coach_mode: str = "interview"

class FollowUpRequest(BaseModel):
    question_text: str
    candidate_answer: str
    role: str = "Software Engineer"
    difficulty: str = "Medium"

class HintRequest(BaseModel):
    question_text: str
    expected_concepts: List[str] = []
    role: str = "Software Engineer"

@router.post("/evaluate-answer", response_model=AnswerEvaluationAIResponse)
async def evaluate_answer_direct(
    req: EvaluateAnswerRequest,
    current_user: User = Depends(get_current_user)
):
    return await ai_service.evaluate_answer(
        question_text=req.question_text,
        expected_concepts=req.expected_concepts,
        candidate_answer=req.candidate_answer,
        role=req.role,
        experience_level=req.experience_level,
        coach_mode=req.coach_mode
    )

@router.post("/follow-up")
async def generate_follow_up_direct(
    req: FollowUpRequest,
    current_user: User = Depends(get_current_user)
):
    follow_up = await ai_service.generate_follow_up(
        question_text=req.question_text,
        candidate_answer=req.candidate_answer,
        role=req.role,
        difficulty=req.difficulty
    )
    return {"follow_up_question": follow_up}

@router.post("/hint")
async def get_practice_hint(
    req: HintRequest,
    current_user: User = Depends(get_current_user)
):
    messages = [
        {"role": "system", "content": "You are a supportive AI coach in Practice Mode. Provide a helpful hint without giving away the complete answer. Return JSON: {\"hint\": \"...\", \"key_concepts_to_mention\": [\"...\"]}"},
        {"role": "user", "content": f"Question: {req.question_text}\nExpected concepts: {req.expected_concepts}\nRole: {req.role}"}
    ]
    try:
        res = await ai_service._call_llm_json(messages)
        return res
    except Exception:
        return {
            "hint": "Consider the architectural trade-offs, state management lifecycle, and concrete performance impacts.",
            "key_concepts_to_mention": req.expected_concepts or ["Modularity", "Scalability", "Error Handling"]
        }
