from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.models import (
    User, InterviewSession, Resume, JobDescription
)
from src.auth.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users & Privacy"])

@router.delete("/me/data", status_code=status.HTTP_200_OK)
def delete_all_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Privacy feature: Permanent deletion of all user interview sessions,
    transcripts, evaluations, resumes, and job descriptions.
    """
    # Cascade delete deletes all associated sessions, questions, answers, evaluations, transcripts, scores
    db.query(InterviewSession).filter(InterviewSession.user_id == current_user.id).delete()
    db.query(Resume).filter(Resume.user_id == current_user.id).delete()
    db.query(JobDescription).filter(JobDescription.user_id == current_user.id).delete()
    db.commit()

    return {
        "status": "success",
        "message": "All interview sessions, transcripts, audio references, and resumes have been permanently deleted."
    }
