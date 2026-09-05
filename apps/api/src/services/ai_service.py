import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import ValidationError

from src.config import settings
from src.schemas.schemas import (
    AnswerEvaluationAIResponse,
    InterviewPlanAIResponse,
    ResumeAnalysisAIResponse,
    JobDescriptionAnalysisAIResponse,
    InterviewReportAIResponse,
    CodeReviewAIResponse,
    QuestionItemAI
)
from src.services.llm_provider import get_llm_provider

logger = logging.getLogger("interviewai.ai_service")


class AIService:
    def __init__(self):
        # Delegate all LLM calls to the pluggable provider (Groq or Qwen3 via vLLM).
        # Switch provider by setting LLM_PROVIDER env var — no code changes needed.
        self._llm = get_llm_provider()
        # Legacy attributes kept for backward compatibility with any code that references them
        self.model = settings.GROQ_MODEL if settings.is_groq_provider else settings.MODEL_NAME
        logger.info(
            "[AI_SERVICE] Initialized with provider=%s model=%s",
            settings.LLM_PROVIDER, self.model
        )

    async def _call_llm_json(
        self,
        messages: List[Dict[str, str]],
        target_model: Optional[str] = None,  # kept for backward compat; ignored
        temperature: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Calls the configured LLM provider and returns parsed JSON.
        Delegates to LLMProvider (Groq or Qwen3/vLLM) based on LLM_PROVIDER env var.
        """
        try:
            return await self._llm.call_json(messages, temperature=temperature)
        except Exception as e:
            logger.error("[AI_SERVICE] LLM call failed: %s", e)
            raise

    async def generate_interview_questions(
        self,
        role: str,
        company: Optional[str],
        experience_level: str,
        interview_type: str,
        difficulty: str,
        technologies: List[str],
        duration_minutes: int,
        resume_summary: Optional[Dict[str, Any]] = None,
        job_description: Optional[str] = None
    ) -> List[QuestionItemAI]:
        """Generates a structured list of interview questions tailored to the candidate."""
        num_questions = max(3, min(8, duration_minutes // 6))

        system_prompt = (
            "You are an expert technical and HR interviewer at top tier tech companies. "
            "You design realistic, progressive, in-depth interview questions tailored to the candidate's exact profile. "
            "You must return ONLY valid JSON matching the specified schema."
        )

        user_content = f"""
Generate {num_questions} progressive interview questions for:
- Target Role: {role}
- Target Company: {company or 'Top Tech Company'}
- Experience Level: {experience_level}
- Interview Type: {interview_type}
- Difficulty: {difficulty}
- Core Technologies: {', '.join(technologies) if technologies else 'General Software Engineering'}
- Planned Duration: {duration_minutes} minutes
"""
        if resume_summary:
            user_content += f"\nCandidate Resume Highlights: {json.dumps(resume_summary)}\nMake at least 1-2 questions directly reference their specific projects or experiences."
            
        if job_description:
            user_content += f"\nTarget Job Description: {job_description[:1000]}\nEnsure questions align with key job requirements."

        user_content += """
Return JSON in the exact structure:
{
  "questions": [
    {
      "question_text": "Detailed question string",
      "category": "technical | behavioral | hr | coding | resume_based",
      "expected_concepts": ["concept 1", "concept 2", "concept 3"],
      "coding_starter_code": "optional boilerplate code if coding question, else null",
      "coding_test_cases": [{"input": "...", "expected": "..."}],
      "coding_language": "javascript | python | java | c++ or null"
    }
  ]
}
If this is a Coding interview or Technical + Coding, include at least one coding question with starter code and test cases.
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        try:
            raw_json = await self._call_llm_json(messages)
            plan = InterviewPlanAIResponse.model_validate(raw_json)
            return plan.questions
        except Exception as e:
            logger.warning("Error generating AI questions, using fallback plan: %s", e)
            # Safe structured fallback
            return [
                QuestionItemAI(
                    question_text=f"Can you walk me through your experience as a {role} and highlight a project where you solved a challenging technical problem?",
                    category="behavioral",
                    expected_concepts=["STAR method", "System architecture", "Problem-solving"],
                ),
                QuestionItemAI(
                    question_text=f"Explain how you design scalable and maintainable applications using {technologies[0] if technologies else 'modern frameworks'}.",
                    category="technical",
                    expected_concepts=["Modularity", "State management", "Performance optimization"],
                ),
                QuestionItemAI(
                    question_text="How do you approach database optimization, caching, and handling concurrency in production systems?",
                    category="technical",
                    expected_concepts=["Indexing", "Redis/caching", "Transactions", "Isolation levels"],
                )
            ]

    async def evaluate_answer(
        self,
        question_text: str,
        expected_concepts: List[str],
        candidate_answer: str,
        role: str,
        experience_level: str,
        coach_mode: str = "interview",
        previous_context: Optional[str] = None
    ) -> AnswerEvaluationAIResponse:
        """
        Evaluates a candidate's answer across all 8 mandatory dimensions (0-10):
        Correctness, Relevance, Technical depth, Completeness, Communication, Confidence, Examples, Problem-solving approach.
        """
        system_prompt = (
            "You are an elite AI Interview Coach. Evaluate the candidate's answer strictly and constructively. "
            "Score each dimension accurately between 0.0 and 10.0 (one decimal place). "
            "You must return ONLY valid JSON adhering to the schema."
        )

        user_content = f"""
Question Asked:
"{question_text}"

Expected Concepts:
{json.dumps(expected_concepts)}

Candidate's Answer:
"{candidate_answer}"

Context:
- Role: {role}
- Experience: {experience_level}
- Coach Mode: {coach_mode}
{f"- Previous context: {previous_context}" if previous_context else ""}

Please evaluate across the 8 dimensions:
1. correctness (0-10)
2. relevance (0-10)
3. technical_depth (0-10)
4. completeness (0-10)
5. communication (0-10)
6. confidence (0-10)
7. examples (0-10)
8. problem_solving (0-10)

Calculate an overall score (0-10) as the weighted average.
Generate:
- correct: true/false
- missing_points: list of specific concepts the candidate missed
- feedback: 2-3 sentences of direct, actionable critique
- recommended_answer: a high-caliber model answer demonstrating senior-level competence
- suggested_improvements: list of 2-3 actionable tips
- follow_up_question: a sharp, contextual follow-up question digging deeper into their answer.

Format JSON strictly as:
{{
  "score": 7.8,
  "correct": true,
  "technical_depth": 7.5,
  "communication": 8.0,
  "correctness": 8.5,
  "relevance": 9.0,
  "completeness": 6.5,
  "confidence": 7.5,
  "examples": 7.0,
  "problem_solving": 8.0,
  "missing_points": ["Point 1", "Point 2"],
  "feedback": "...",
  "recommended_answer": "...",
  "suggested_improvements": ["Improvement 1", "Improvement 2"],
  "follow_up_question": "..."
}}
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        try:
            raw_json = await self._call_llm_json(messages)
            evaluation = AnswerEvaluationAIResponse.model_validate(raw_json)
            return evaluation
        except Exception as e:
            logger.error("Evaluation validation failed: %s", e)
            # Safe validated fallback
            return AnswerEvaluationAIResponse(
                score=7.0,
                correct=True,
                technical_depth=6.5,
                communication=7.5,
                correctness=7.0,
                relevance=8.0,
                completeness=6.5,
                confidence=7.0,
                examples=6.0,
                problem_solving=7.0,
                missing_points=["Include concrete architectural trade-offs", "Add production metrics"],
                feedback="Good fundamental understanding. Adding real-world production metrics and edge-case handling will significantly strengthen your response.",
                recommended_answer="A comprehensive response addresses the core mechanism, pros/cons, and specific production trade-offs.",
                suggested_improvements=["Structure with the STAR technique", "Cite quantitative performance impacts"],
                follow_up_question=f"How would you handle failure scenarios or disaster recovery for this approach in {role} systems?"
            )

    async def generate_follow_up(
        self,
        question_text: str,
        candidate_answer: str,
        role: str,
        difficulty: str
    ) -> str:
        """Generates an intelligent, targeted follow-up question based directly on candidate's answer."""
        messages = [
            {"role": "system", "content": "You are a senior tech lead interviewer. Return JSON with 'follow_up_question'."},
            {"role": "user", "content": f"""
Question: "{question_text}"
Candidate said: "{candidate_answer}"
Target Role: {role}
Difficulty: {difficulty}

Generate a concise, probing follow-up question that challenges their specific statements, tests trade-offs, or asks for deeper implementation details.
Respond in JSON: {{"follow_up_question": "..."}}
"""}
        ]
        try:
            res = await self._call_llm_json(messages)
            return res.get("follow_up_question", "Could you elaborate on the performance implications of that approach?")
        except Exception:
            return "What trade-offs or bottlenecks would you monitor when implementing this in production?"

    async def review_code_submission(
        self,
        problem_statement: str,
        code: str,
        language: str,
        execution_output: str
    ) -> CodeReviewAIResponse:
        """Performs AI code review analyzing time/space complexity, edge cases, and code quality."""
        messages = [
            {"role": "system", "content": "You are a staff software engineer conducting a coding interview review. Return valid JSON only."},
            {"role": "user", "content": f"""
Problem:
{problem_statement}

Language: {language}

Candidate Code:
```{language}
{code}
```

Execution Output:
{execution_output}

Evaluate the code quality, time complexity, space complexity, edge cases, and provide an optimized solution if applicable.
Return JSON strictly:
{{
  "score": 8.5,
  "time_complexity": "O(N)",
  "space_complexity": "O(1)",
  "code_quality": "Clean, idiomatic and well-structured.",
  "bugs_or_edge_cases": ["Edge case when input is empty array"],
  "suggested_improvements": ["Use descriptive variable names", "Guard against null values"],
  "optimized_code": "..."
}}
"""}
        ]
        try:
            res = await self._call_llm_json(messages)
            return CodeReviewAIResponse.model_validate(res)
        except Exception as e:
            logger.warning("Code review parsing error: %s", e)
            return CodeReviewAIResponse(
                score=7.5,
                time_complexity="O(N)",
                space_complexity="O(1)",
                code_quality="Functional and concise.",
                bugs_or_edge_cases=["Check empty input boundary"],
                suggested_improvements=["Add docstring and type annotations"],
                optimized_code=code
            )

    async def generate_interview_report(
        self,
        role: str,
        experience_level: str,
        difficulty: str,
        questions_with_answers_and_scores: List[Dict[str, Any]]
    ) -> InterviewReportAIResponse:
        """Generates a comprehensive post-interview diagnostic report."""
        messages = [
            {"role": "system", "content": "You are the Chief AI Interviewer generating an executive candidate assessment report. Return valid JSON only."},
            {"role": "user", "content": f"""
Candidate Role: {role}
Experience Level: {experience_level}
Difficulty: {difficulty}

Interview Questions & Evaluations:
{json.dumps(questions_with_answers_and_scores, indent=2)}

Synthesize overall performance across:
- Overall Score (0-10)
- Technical Score (0-10)
- Communication Score (0-10)
- Problem Solving Score (0-10)
- Confidence Score (0-10)
- Strengths (list)
- Weaknesses (list)
- Questions answered well (list)
- Questions answered poorly (list)
- Recommended study topics (list)
- Final Recommendation: Exactly one of ["Ready", "Needs Practice", "Needs Significant Improvement"]

Return JSON matching schema strictly.
"""}
        ]
        try:
            res = await self._call_llm_json(messages)
            return InterviewReportAIResponse.model_validate(res)
        except Exception as e:
            logger.warning("Report generation parsing error: %s", e)
            # Compute heuristic averages from existing scores
            avg_score = 7.5
            if questions_with_answers_and_scores:
                scores = [item.get("score", 7.0) for item in questions_with_answers_and_scores if "score" in item]
                if scores:
                    avg_score = round(sum(scores) / len(scores), 1)

            recommendation = "Ready" if avg_score >= 8.0 else ("Needs Practice" if avg_score >= 6.0 else "Needs Significant Improvement")

            return InterviewReportAIResponse(
                overall_score=avg_score,
                technical_score=avg_score,
                communication_score=min(10.0, avg_score + 0.5),
                problem_solving_score=avg_score,
                confidence_score=avg_score,
                strengths=["Clear articulation of fundamentals", "Good problem breakdown"],
                weaknesses=["Needs more depth in system scaling and metrics"],
                questions_answered_well=["Core conceptual questions"],
                questions_answered_poorly=["Deep architectural edge-cases"],
                recommended_study_topics=["Distributed systems", "Performance profiling", "Concurrency patterns"],
                final_recommendation=recommendation
            )

ai_service = AIService()
