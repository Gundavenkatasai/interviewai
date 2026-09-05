"""
llm_provider.py
───────────────
LLMProvider abstraction layer for InterviewAI.

Architecture:
  LLMProvider (abstract)
    └── GroqProvider   — Groq Cloud API (default, free tier available)
    └── QwenProvider   — vLLM / SGLang OpenAI-compatible endpoint
                         (for Qwen3-30B-A3B-Instruct-2507 self-hosted)

Selection: set LLM_PROVIDER env var to 'groq' or 'openai-compatible'.
The model is NEVER hard-coded into business logic.
"""

import json
import logging
import re
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

import httpx

from src.config import settings

logger = logging.getLogger("interviewai.llm_provider")


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def call_json(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Calls the LLM and returns a parsed JSON dict. Raises on failure after retries."""
        ...

    @staticmethod
    def _extract_json(content: str) -> Dict[str, Any]:
        """Extracts JSON from LLM response, stripping markdown code fences if present."""
        clean = content.strip()
        if "`json" in clean:
            clean = clean.split("`json")[1].split("`")[0].strip()
        elif "`" in clean:
            parts = clean.split("`")
            if len(parts) >= 3:
                clean = parts[1].strip()
        # Remove <think>...</think> blocks (Qwen3 thinking mode)
        clean = re.sub(r"<think>.*?</think>", "", clean, flags=re.DOTALL).strip()
        return json.loads(clean)


class GroqProvider(LLMProvider):
    """
    Groq Cloud LLM provider (OpenAI-compatible API).
    Primary model: openai/gpt-oss-120b. Fallback: qwen/qwen3.8-27b.
    """

    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.base_url = "https://api.groq.com/openai/v1"
        self.model = settings.GROQ_MODEL
        self.fallback_model = settings.GROQ_FALLBACK_MODEL
        self.timeout = settings.LLM_TIMEOUT_SECONDS
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "InterviewAI/1.0",
        }
        logger.info("[LLM] GroqProvider initialized. model=%s fallback=%s", self.model, self.fallback_model)

    async def call_json(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        temp = temperature if temperature is not None else settings.TEMPERATURE
        mtok = max_tokens if max_tokens is not None else min(settings.MAX_TOKENS, 3000)

        payload = {
            "model": self.model,
            "messages": messages,
            "response_format": {"type": "json_object"},
            "temperature": temp,
            "max_tokens": mtok,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(settings.LLM_MAX_RETRIES + 1):
                try:
                    model_to_use = self.model if attempt == 0 else self.fallback_model
                    payload["model"] = model_to_use
                    resp = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=self.headers,
                        json=payload,
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        content = data["choices"][0]["message"]["content"]
                        return self._extract_json(content)
                    logger.warning(
                        "[GroqProvider] Attempt %d model=%s status=%s",
                        attempt + 1, model_to_use, resp.status_code
                    )
                except (httpx.TimeoutException, json.JSONDecodeError) as e:
                    logger.warning("[GroqProvider] Attempt %d error: %s", attempt + 1, e)

        raise RuntimeError("GroqProvider: all attempts exhausted")


class QwenProvider(LLMProvider):
    """
    OpenAI-compatible LLM provider for self-hosted models via vLLM or SGLang.
    Default model: Qwen/Qwen3-30B-A3B-Instruct-2507

    To start with vLLM (requires 4x A100 80GB or equivalent):
        vllm serve Qwen/Qwen3-30B-A3B-Instruct-2507 \\
            --tensor-parallel-size 4 --max-model-len 32768 --trust-remote-code

    To start with SGLang:
        python -m sglang.launch_server \\
            --model-path Qwen/Qwen3-30B-A3B-Instruct-2507 \\
            --tp 4 --trust-remote-code --port 8000
    """

    def __init__(self):
        self.base_url = settings.MODEL_BASE_URL.rstrip("/")
        self.model = settings.MODEL_NAME
        self.api_key = settings.MODEL_API_KEY
        self.timeout = settings.LLM_TIMEOUT_SECONDS
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        logger.info("[LLM] QwenProvider initialized. model=%s base_url=%s", self.model, self.base_url)

    async def call_json(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        temp = temperature if temperature is not None else settings.TEMPERATURE
        mtok = max_tokens if max_tokens is not None else settings.MAX_TOKENS

        # Add /no_think to suppress verbose thinking for JSON generation tasks
        modified_messages = []
        for i, msg in enumerate(messages):
            if i == 0 and msg["role"] == "system":
                modified_messages.append({
                    "role": "system",
                    "content": msg["content"] + "\n/no_think"
                })
            else:
                modified_messages.append(msg)

        payload = {
            "model": self.model,
            "messages": modified_messages,
            "temperature": temp,
            "max_tokens": mtok,
            "top_p": settings.TOP_P,
            "response_format": {"type": "json_object"},
        }

        for attempt in range(settings.LLM_MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=self.headers,
                        json=payload,
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        content = data["choices"][0]["message"]["content"]
                        return self._extract_json(content)
                    logger.warning(
                        "[QwenProvider] Attempt %d status=%s",
                        attempt + 1, resp.status_code
                    )
            except (httpx.TimeoutException, json.JSONDecodeError) as e:
                logger.warning("[QwenProvider] Attempt %d error: %s", attempt + 1, e)

        raise RuntimeError(f"QwenProvider: all attempts exhausted for model {self.model}")


# ─── Factory ─────────────────────────────────────────────────────────────────

_provider_instance: Optional[LLMProvider] = None


def get_llm_provider() -> LLMProvider:
    """
    Returns the singleton LLM provider instance.
    Selected once at startup based on LLM_PROVIDER env var.
    """
    global _provider_instance
    if _provider_instance is None:
        provider_name = settings.LLM_PROVIDER.lower()
        if provider_name == "groq":
            _provider_instance = GroqProvider()
        elif provider_name in ("openai-compatible", "qwen", "vllm", "sglang"):
            _provider_instance = QwenProvider()
        else:
            logger.warning(
                "[LLM] Unknown LLM_PROVIDER='%s', defaulting to GroqProvider",
                settings.LLM_PROVIDER
            )
            _provider_instance = GroqProvider()
    return _provider_instance
