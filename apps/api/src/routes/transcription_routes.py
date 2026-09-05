import logging
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from typing import Optional

from src.services.transcription_service import get_speech_provider
from src.models.models import User
from src.auth.auth import get_current_user

logger = logging.getLogger("interviewai.transcription_routes")
router = APIRouter(prefix="/transcription", tags=["Transcription"])

@router.post("")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = Form("en"),
    current_user: User = Depends(get_current_user)
):
    try:
        audio_bytes = await file.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Audio file is empty")

        provider = get_speech_provider()
        transcript = await provider.transcribe(
            audio_bytes=audio_bytes,
            filename=file.filename or "audio.webm",
            language=language
        )
        return {
            "transcript": transcript,
            "provider": provider.__class__.__name__
        }
    except Exception as e:
        logger.error("Audio transcription failure: %s", e)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
