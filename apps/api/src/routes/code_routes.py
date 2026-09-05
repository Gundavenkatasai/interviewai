from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from src.services.code_executor_service import code_executor_service
from src.schemas.schemas import CodeExecutionRequest, CodeExecutionResponse, CodeReviewAIResponse
from src.models.models import User
from src.auth.auth import get_current_user

router = APIRouter(prefix="/code", tags=["Coding Sandbox"])

class CodeReviewRequest(BaseModel):
    problem_statement: str
    code: str
    language: str
    output: Optional[str] = ""

@router.post("/execute", response_model=CodeExecutionResponse)
async def execute_code(
    req: CodeExecutionRequest,
    current_user: User = Depends(get_current_user)
):
    return await code_executor_service.execute_code(
        language=req.language,
        code=req.code,
        stdin=req.stdin or ""
    )

@router.post("/review", response_model=CodeReviewAIResponse)
async def review_code(
    req: CodeReviewRequest,
    current_user: User = Depends(get_current_user)
):
    return await code_executor_service.review_solution(
        problem=req.problem_statement,
        code=req.code,
        language=req.language,
        output=req.output or ""
    )
