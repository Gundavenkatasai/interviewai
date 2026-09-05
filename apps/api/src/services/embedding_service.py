"""
embedding_service.py
────────────────────
EmbeddingProvider abstraction for InterviewAI.

Architecture:
  EmbeddingProvider (abstract)
    └── SentenceTransformerProvider  — all-MiniLM-L6-v2 (default, CPU-friendly)
    └── OpenAICompatibleProvider     — for Qwen3-Embedding-8B via vLLM
    └── TFIDFFallbackProvider        — in-memory sklearn (no model download needed)

Used for:
  - Semantic duplicate detection (spec §18, §43)
  - pgvector embedding storage for resume chunks
  - Cross-session novelty scoring (spec §19)

Selection: EMBEDDING_PROVIDER env var ('sentence-transformers' | 'openai-compatible')
"""

import logging
from abc import ABC, abstractmethod
from typing import List, Optional

import numpy as np

from src.config import settings

logger = logging.getLogger("interviewai.embedding_service")

_EMBEDDING_DIM = settings.EMBEDDING_DIM


class EmbeddingProvider(ABC):
    """Abstract base class for embedding providers."""

    @abstractmethod
    def embed(self, texts: List[str]) -> List[List[float]]:
        """Returns a list of embedding vectors for the given texts."""
        ...

    def embed_one(self, text: str) -> List[float]:
        return self.embed([text])[0]

    @staticmethod
    def cosine_similarity(a: List[float], b: List[float]) -> float:
        """Computes cosine similarity between two embedding vectors."""
        va = np.array(a, dtype=np.float32)
        vb = np.array(b, dtype=np.float32)
        norm_a = np.linalg.norm(va)
        norm_b = np.linalg.norm(vb)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(va, vb) / (norm_a * norm_b))

    def max_similarity(self, candidate: str, existing_texts: List[str]) -> float:
        """Returns the maximum cosine similarity between candidate and any existing text."""
        if not existing_texts:
            return 0.0
        all_texts = existing_texts + [candidate]
        embeddings = self.embed(all_texts)
        candidate_emb = np.array(embeddings[-1])
        existing_embs = np.array(embeddings[:-1])
        if len(existing_embs) == 0:
            return 0.0
        norms = np.linalg.norm(existing_embs, axis=1, keepdims=True)
        norms[norms == 0] = 1e-8
        existing_normed = existing_embs / norms
        cand_norm = np.linalg.norm(candidate_emb)
        if cand_norm == 0:
            return 0.0
        cand_normed = candidate_emb / cand_norm
        similarities = existing_normed @ cand_normed
        return float(np.max(similarities))


class SentenceTransformerProvider(EmbeddingProvider):
    """
    sentence-transformers embedding provider.
    Default model: all-MiniLM-L6-v2 (384-dim, ~80MB, CPU-friendly).
    For Qwen3-Embedding-8B: set EMBEDDING_MODEL=Qwen/Qwen3-Embedding-8B (requires GPU).
    """

    def __init__(self):
        self._model = None
        self._model_name = settings.EMBEDDING_MODEL
        logger.info("[EMBEDDING] SentenceTransformerProvider configured. model=%s", self._model_name)

    def _get_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info("[EMBEDDING] Loading sentence-transformer model: %s", self._model_name)
                self._model = SentenceTransformer(self._model_name)
                logger.info("[EMBEDDING] Model loaded successfully.")
            except Exception as e:
                logger.error("[EMBEDDING] Failed to load sentence-transformers: %s", e)
                raise
        return self._model

    def embed(self, texts: List[str]) -> List[List[float]]:
        model = self._get_model()
        embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        return embeddings.tolist()


class OpenAICompatibleEmbeddingProvider(EmbeddingProvider):
    """
    OpenAI-compatible embedding API provider.
    Use this for Qwen3-Embedding-8B served via vLLM or SGLang.
    
    vLLM: vllm serve Qwen/Qwen3-Embedding-8B --task embedding --trust-remote-code
    """

    def __init__(self):
        import httpx
        self.client = httpx.Client(timeout=30.0)
        self.base_url = settings.EMBEDDING_BASE_URL.rstrip("/")
        self.model = settings.EMBEDDING_MODEL
        self.headers = {
            "Authorization": f"Bearer {settings.MODEL_API_KEY}",
            "Content-Type": "application/json",
        }
        logger.info("[EMBEDDING] OpenAICompatibleProvider. model=%s url=%s", self.model, self.base_url)

    def embed(self, texts: List[str]) -> List[List[float]]:
        payload = {"model": self.model, "input": texts}
        resp = self.client.post(
            f"{self.base_url}/embeddings",
            headers=self.headers,
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
        return [item["embedding"] for item in data["data"]]


class TFIDFFallbackProvider(EmbeddingProvider):
    """
    In-memory TF-IDF based similarity (no model download required).
    Used when sentence-transformers is unavailable.
    Note: Not suitable for pgvector storage — only for in-memory dedup.
    """

    def __init__(self):
        logger.warning("[EMBEDDING] Using TF-IDF fallback provider. Install sentence-transformers for better results.")

    def embed(self, texts: List[str]) -> List[List[float]]:
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, stop_words="english")
            matrix = vectorizer.fit_transform(texts)
            return matrix.toarray().tolist()
        except Exception as e:
            logger.error("[EMBEDDING] TF-IDF embed error: %s", e)
            # Return zero vectors as last resort
            return [[0.0] * 100 for _ in texts]

    def max_similarity(self, candidate: str, existing_texts: List[str]) -> float:
        if not existing_texts:
            return 0.0
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity as sk_cosine
            corpus = existing_texts + [candidate]
            vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, stop_words="english")
            matrix = vectorizer.fit_transform(corpus)
            candidate_vec = matrix[-1]
            existing_matrix = matrix[:-1]
            similarities = sk_cosine(candidate_vec, existing_matrix).flatten()
            return float(np.max(similarities)) if len(similarities) > 0 else 0.0
        except Exception as e:
            logger.warning("[EMBEDDING] TF-IDF similarity error: %s", e)
            return 0.0


# ─── Factory ─────────────────────────────────────────────────────────────────

_embedding_instance: Optional[EmbeddingProvider] = None


def get_embedding_provider() -> EmbeddingProvider:
    """
    Returns the singleton embedding provider instance.
    Selected based on EMBEDDING_PROVIDER env var.
    """
    global _embedding_instance
    if _embedding_instance is None:
        if not settings.ENABLE_EMBEDDING_SERVICE:
            logger.info("[EMBEDDING] Embedding service disabled. Using TF-IDF fallback.")
            _embedding_instance = TFIDFFallbackProvider()
            return _embedding_instance

        provider_name = settings.EMBEDDING_PROVIDER.lower()
        if provider_name == "sentence-transformers":
            try:
                _embedding_instance = SentenceTransformerProvider()
                # Lazy — model not loaded here, only on first embed() call
            except Exception as e:
                logger.warning("[EMBEDDING] SentenceTransformerProvider init error: %s. Using TF-IDF.", e)
                _embedding_instance = TFIDFFallbackProvider()
        elif provider_name in ("openai-compatible", "qwen", "vllm"):
            try:
                _embedding_instance = OpenAICompatibleEmbeddingProvider()
            except Exception as e:
                logger.warning("[EMBEDDING] OpenAICompatibleProvider init error: %s. Using TF-IDF.", e)
                _embedding_instance = TFIDFFallbackProvider()
        else:
            logger.warning("[EMBEDDING] Unknown provider '%s'. Using TF-IDF.", settings.EMBEDDING_PROVIDER)
            _embedding_instance = TFIDFFallbackProvider()
    return _embedding_instance

embedding_service = get_embedding_provider()
