import os
import json
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Search for .env at project root or api directory
root_env = Path(__file__).resolve().parent.parent.parent.parent / ".env"
api_env = Path(__file__).resolve().parent.parent / ".env"

if root_env.exists():
    load_dotenv(dotenv_path=root_env)
elif api_env.exists():
    load_dotenv(dotenv_path=api_env)
else:
    load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "InterviewAI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Server
    PORT: int = int(os.getenv("PORT", "8001"))
    HOST: str = "0.0.0.0"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgrespassword@localhost:5433/interviewai"
    )
    SQLITE_FALLBACK: bool = os.getenv("SQLITE_FALLBACK", "true").lower() == "true"
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "interviewai-secret-jwt-token-production-quality-98234791")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # ── LLM Provider ───────────────────────────────────────────────────────────
    # LLM_PROVIDER: "groq" (default) | "openai-compatible" (for vLLM/Qwen3)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq")
    
    # For openai-compatible provider (vLLM + Qwen3-30B-A3B-Instruct-2507)
    MODEL_BASE_URL: str = os.getenv("MODEL_BASE_URL", "http://localhost:8000/v1")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "Qwen/Qwen3-30B-A3B-Instruct-2507")
    MODEL_API_KEY: str = os.getenv("MODEL_API_KEY", "EMPTY")  # vLLM accepts any key
    
    # Generation parameters (spec §41)
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.7"))
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "4096"))
    TOP_P: float = float(os.getenv("TOP_P", "0.9"))
    LLM_TIMEOUT_SECONDS: float = float(os.getenv("LLM_TIMEOUT_SECONDS", "60.0"))
    LLM_MAX_RETRIES: int = int(os.getenv("LLM_MAX_RETRIES", "2"))
    
    # AI - Groq Cloud (used when LLM_PROVIDER=groq)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    GROQ_FALLBACK_MODEL: str = os.getenv("GROQ_FALLBACK_MODEL", "qwen/qwen3.8-27b")
    GROQ_WHISPER_MODEL: str = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3-turbo")
    
    # ── Embedding Provider ─────────────────────────────────────────────────────
    # EMBEDDING_PROVIDER: "sentence-transformers" (default) | "openai-compatible"
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "sentence-transformers")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    EMBEDDING_BASE_URL: str = os.getenv("EMBEDDING_BASE_URL", "http://localhost:8000/v1")
    EMBEDDING_DIM: int = int(os.getenv("EMBEDDING_DIM", "384"))  # all-MiniLM-L6-v2=384; Qwen3-Embedding-8B=3584
    
    # ── Speech-to-Text ──────────────────────────────────────────────────────────
    STT_PROVIDER: str = os.getenv("STT_PROVIDER", "groq")  # groq | openai-compatible
    
    # Code Execution Sandbox
    PISTON_API_URL: str = os.getenv("PISTON_API_URL", "http://localhost:2000")
    
    # CORS
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")

    # ── Question Generation Engine ──────────────────────────────────────────────
    # Semantic cosine similarity threshold for duplicate detection (spec §18: start at 0.85)
    QUESTION_SIMILARITY_THRESHOLD: float = float(os.getenv("DUPLICATE_THRESHOLD", os.getenv("QUESTION_SIMILARITY_THRESHOLD", "0.85")))
    # How many AI candidate questions to generate per round before dedup filtering (spec §16: 5-10)
    QUESTION_CANDIDATES_COUNT: int = int(os.getenv("QUESTION_CANDIDATES_COUNT", "7"))
    # Default number of questions per interview
    DEFAULT_MAX_QUESTIONS: int = int(os.getenv("DEFAULT_MAX_QUESTIONS", "10"))
    # Category rotation weights
    CATEGORY_WEIGHTS_JSON: str = os.getenv(
        "CATEGORY_WEIGHTS_JSON",
        '{"Resume":10,"Project":15,"Frontend":12,"Backend":15,"Database":10,"System Design":10,"Security":5,"DSA":10,"Behavioral":8,"Problem Solving":5}'
    )

    # ── Feature Flags ───────────────────────────────────────────────────────────
    ENABLE_PGVECTOR: bool = os.getenv("ENABLE_PGVECTOR", "true").lower() == "true"
    ENABLE_EMBEDDING_SERVICE: bool = os.getenv("ENABLE_EMBEDDING_SERVICE", "true").lower() == "true"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def category_weights(self) -> dict:
        try:
            return json.loads(self.CATEGORY_WEIGHTS_JSON)
        except Exception:
            return {
                "Resume": 10, "Project": 15, "Frontend": 12, "Backend": 15,
                "Database": 10, "System Design": 10, "Security": 5,
                "DSA": 10, "Behavioral": 8, "Problem Solving": 5
            }

    @property
    def is_groq_provider(self) -> bool:
        return self.LLM_PROVIDER.lower() == "groq"

settings = Settings()
