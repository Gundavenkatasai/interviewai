from abc import ABC, abstractmethod
import logging
from typing import Optional
import httpx

from src.config import settings

logger = logging.getLogger("interviewai.transcription")

class SpeechProvider(ABC):
    """Abstract Base Class for modular Speech-to-Text providers."""

    @abstractmethod
    async def transcribe(self, audio_bytes: bytes, filename: str = "audio.wav", language: Optional[str] = "en") -> str:
        """Transcribe audio bytes to plain text."""
        pass


class GroqWhisperSpeechProvider(SpeechProvider):
    """Transcription provider using Groq Cloud Whisper API (OpenAI-compatible)."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or settings.GROQ_WHISPER_MODEL
        self.url = "https://api.groq.com/openai/v1/audio/transcriptions"

    async def transcribe(self, audio_bytes: bytes, filename: str = "audio.wav", language: Optional[str] = "en") -> str:
        if not self.api_key:
            raise ValueError("Groq API Key is not configured for Whisper transcription.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "User-Agent": "InterviewAI/1.0"
        }

        # Determine MIME type
        content_type = "audio/wav"
        if filename.endswith(".webm"):
            content_type = "audio/webm"
        elif filename.endswith(".mp3"):
            content_type = "audio/mp3"
        elif filename.endswith(".ogg"):
            content_type = "audio/ogg"
        elif filename.endswith(".m4a"):
            content_type = "audio/m4a"

        files = {
            "file": (filename, audio_bytes, content_type)
        }
        data = {
            "model": self.model,
            "response_format": "json"
        }
        if language:
            data["language"] = language

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self.url,
                headers=headers,
                files=files,
                data=data
            )
            if response.status_code != 200:
                logger.error("Groq Whisper error %s: %s", response.status_code, response.text)
                response.raise_for_status()

            result = response.json()
            return result.get("text", "").strip()


class LocalOrFallbackSpeechProvider(SpeechProvider):
    """Fallback provider when cloud transcription is unavailable or for testing."""

    async def transcribe(self, audio_bytes: bytes, filename: str = "audio.wav", language: Optional[str] = "en") -> str:
        logger.info("Local/fallback speech provider invoked (%d bytes)", len(audio_bytes))
        return "Transcribed response placeholder via local speech provider fallback."


def get_speech_provider() -> SpeechProvider:
    if settings.GROQ_API_KEY:
        return GroqWhisperSpeechProvider()
    return LocalOrFallbackSpeechProvider()
