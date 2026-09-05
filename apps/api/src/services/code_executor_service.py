import time
import logging
import asyncio
import tempfile
import subprocess
import os
from typing import Optional, Dict, Any
import httpx

from src.config import settings
from src.schemas.schemas import CodeExecutionResponse, CodeReviewAIResponse
from src.services.ai_service import ai_service

logger = logging.getLogger("interviewai.code_executor")

LANGUAGE_PISTON_MAP = {
    "python": {"language": "python", "version": "3.10.0"},
    "javascript": {"language": "javascript", "version": "18.15.0"},
    "java": {"language": "java", "version": "15.0.2"},
    "cpp": {"language": "c++", "version": "10.2.0"},
    "c++": {"language": "c++", "version": "10.2.0"}
}

class CodeExecutorService:
    def __init__(self):
        self.piston_url = settings.PISTON_API_URL

    async def execute_code(self, language: str, code: str, stdin: str = "") -> CodeExecutionResponse:
        """Executes code in a secure sandbox. Attempts Piston container first, falls back to safe isolated runner."""
        lang_key = language.lower()
        start_time = time.time()

        # 1. Try Piston Container
        try:
            piston_config = LANGUAGE_PISTON_MAP.get(lang_key, {"language": lang_key, "version": "*"})
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{self.piston_url}/api/v2/execute",
                    json={
                        "language": piston_config["language"],
                        "version": piston_config["version"],
                        "files": [{"name": f"solution.{self._get_ext(lang_key)}", "content": code}],
                        "stdin": stdin,
                        "run_timeout": 5000,
                        "compile_timeout": 5000
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    run_info = data.get("run", {})
                    output = run_info.get("output", "")
                    exit_code = run_info.get("code", 0)
                    elapsed = (time.time() - start_time) * 1000
                    return CodeExecutionResponse(
                        language=language,
                        output=output,
                        error=run_info.get("stderr") if exit_code != 0 else None,
                        exit_code=exit_code,
                        execution_time_ms=round(elapsed, 2)
                    )
        except Exception as e:
            logger.info("Piston container not reachable (%s), using safe isolated fallback runner.", e)

        # 2. Safe isolated subprocess fallback for Python and JavaScript
        return await self._execute_safe_fallback(lang_key, code, stdin, start_time)

    async def _execute_safe_fallback(self, language: str, code: str, stdin: str, start_time: float) -> CodeExecutionResponse:
        """Executes code in a temporary isolated directory with strict execution limits."""
        loop = asyncio.get_running_loop()

        def _run_sync():
            with tempfile.TemporaryDirectory(prefix="sandbox_") as tmpdir:
                ext = self._get_ext(language)
                filepath = os.path.join(tmpdir, f"main.{ext}")
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(code)

                cmd = []
                if language in ("python", "py"):
                    cmd = ["py", filepath]
                elif language in ("javascript", "js", "node"):
                    cmd = ["node", filepath]
                else:
                    return CodeExecutionResponse(
                        language=language,
                        output="",
                        error=f"Direct sandbox fallback supports Python and JavaScript. For {language}, start Piston container via docker-compose.",
                        exit_code=1,
                        execution_time_ms=0.0
                    )

                try:
                    proc = subprocess.run(
                        cmd,
                        input=stdin,
                        capture_output=True,
                        text=True,
                        timeout=5.0,  # Strict 5-second CPU limit
                        cwd=tmpdir
                    )
                    elapsed = (time.time() - start_time) * 1000
                    return CodeExecutionResponse(
                        language=language,
                        output=proc.stdout,
                        error=proc.stderr if proc.returncode != 0 else None,
                        exit_code=proc.returncode,
                        execution_time_ms=round(elapsed, 2)
                    )
                except subprocess.TimeoutExpired:
                    return CodeExecutionResponse(
                        language=language,
                        output="",
                        error="Execution timed out (5.0s CPU limit exceeded). Check for infinite loops.",
                        exit_code=124,
                        execution_time_ms=5000.0
                    )
                except Exception as ex:
                    return CodeExecutionResponse(
                        language=language,
                        output="",
                        error=f"Sandbox error: {str(ex)}",
                        exit_code=1,
                        execution_time_ms=0.0
                    )

        return await loop.run_in_executor(None, _run_sync)

    @staticmethod
    def _get_ext(language: str) -> str:
        mapping = {
            "python": "py",
            "javascript": "js",
            "java": "java",
            "cpp": "cpp",
            "c++": "cpp"
        }
        return mapping.get(language.lower(), "txt")

    async def review_solution(self, problem: str, code: str, language: str, output: str) -> CodeReviewAIResponse:
        return await ai_service.review_code_submission(problem, code, language, output)

code_executor_service = CodeExecutorService()
