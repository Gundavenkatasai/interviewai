from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field

# ==================== User & Auth Schemas ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# ==================== Interview Schemas ====================

class InterviewCreate(BaseModel):
    role: str = Field(..., example="Full Stack Developer")
    company: Optional[str] = Field(None, example="Stripe")
    experience_level: str = Field("0-2 years", example="0-2 years")
    interview_type: str = Field("Technical", example="Technical")
    difficulty: str = Field("Medium", example="Medium")
    technologies: List[str] = Field(default_factory=list, example=["React", "Node.js", "PostgreSQL"])
    coach_mode: str = Field("interview", example="practice")
    duration_minutes: int = Field(30, ge=5, le=120)
    max_questions: int = Field(10, ge=5, le=30, description="Number of questions: 5 | 10 | 15 | 20")
    resume_id: Optional[str] = None
    job_description_id: Optional[str] = None
    job_description_text: Optional[str] = None

class QuestionOut(BaseModel):
    id: str
    session_id: str
    question_order: int
    question_text: str
    category: str
    topic: Optional[str] = None
    source: Optional[str] = "ai"
    difficulty: Optional[str] = None
    resume_reference: Optional[str] = None
    similarity_score: Optional[float] = None
    generated_dynamically: bool = True
    expected_concepts: List[str] = []
    coding_starter_code: Optional[str] = None
    coding_test_cases: List[Dict[str, Any]] = []
    coding_language: Optional[str] = None
    is_follow_up: bool = False
    parent_question_id: Optional[str] = None
    created_at: datetime

    @property
    def source_display(self) -> str:
        """Human-readable source label for the UI."""
        src = self.source or "ai"
        if src == "resume_ai":
            return "Generated from your resume"
        elif src == "jd_ai":
            return "Based on job description"
        elif src == "role_ai":
            return "Role-specific question"
        elif src == "bank":
            return "Practice question"
        elif src == "custom":
            return "Custom question"
        return "AI generated"

    class Config:
        from_attributes = True

class NextQuestionResponse(BaseModel):
    """Response from POST /api/interviews/{session_id}/next-question"""
    question: QuestionOut
    session_question_count: int
    max_questions: int = 10
    category_distribution: Dict[str, int] = {}
    interview_complete: bool = False  # True when question_count >= max_questions

class AnswerEvaluationOut(BaseModel):
    id: str
    score: float
    correct: bool
    technical_depth: float
    communication: float
    correctness: float
    relevance: float
    completeness: float
    confidence: float
    examples: float
    problem_solving: float
    missing_points: List[str] = []
    feedback: str
    recommended_answer: Optional[str] = None
    suggested_improvements: List[str] = []
    follow_up_question: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CandidateAnswerOut(BaseModel):
    id: str
    question_id: str
    answer_text: str
    code_submission: Optional[str] = None
    duration_seconds: float
    submitted_at: datetime
    evaluation: Optional[AnswerEvaluationOut] = None

    class Config:
        from_attributes = True

class TranscriptOut(BaseModel):
    id: str
    speaker: str
    content: str
    timestamp: datetime
    confidence: float

    class Config:
        from_attributes = True

class InterviewScoreOut(BaseModel):
    overall_score: float
    technical_score: float
    communication_score: float
    problem_solving_score: float
    confidence_score: float
    strengths: List[str] = []
    weaknesses: List[str] = []
    questions_answered_well: List[str] = []
    questions_answered_poorly: List[str] = []
    recommended_study_topics: List[str] = []
    final_recommendation: str

    class Config:
        from_attributes = True

class InterviewOut(BaseModel):
    id: str
    role: str
    company: Optional[str]
    experience_level: str
    interview_type: str
    difficulty: str
    technologies: List[str] = []
    coach_mode: str
    status: str
    state: str = "CREATED"          # State machine state
    duration_minutes: int
    elapsed_seconds: int
    question_count: int = 0
    max_questions: int = 10
    current_question_index: int = 0
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    score: Optional[InterviewScoreOut] = None
    resume_id: Optional[str] = None

    class Config:
        from_attributes = True

class InterviewDetailOut(InterviewOut):
    questions: List[QuestionOut] = []
    transcripts: List[TranscriptOut] = []

# ==================== Action Request Schemas ====================

class QuestionCreate(BaseModel):
    question_text: str
    category: str = "technical"
    expected_concepts: List[str] = []
    coding_starter_code: Optional[str] = None
    coding_test_cases: List[Dict[str, Any]] = []
    coding_language: Optional[str] = None

class AnswerSubmit(BaseModel):
    question_id: str
    answer_text: str
    code_submission: Optional[str] = None
    duration_seconds: float = 0.0

class FollowUpRequest(BaseModel):
    question_id: str
    candidate_answer: str

class TranscriptSubmit(BaseModel):
    speaker: str  # interviewer, candidate
    content: str
    confidence: float = 1.0

class InterviewFeedbackSubmit(BaseModel):
    interviewer_notes: Optional[str] = None
    candidate_notes: Optional[str] = None

class ElapsedTimeUpdate(BaseModel):
    elapsed_seconds: int

# ==================== AI Structured Engine Schemas ====================

class AnswerEvaluationAIResponse(BaseModel):
    score: float = Field(..., description="Overall calculated score from 0-10")
    correct: bool = Field(..., description="Whether answer is factually correct")
    technical_depth: float = Field(..., ge=0, le=10)
    communication: float = Field(..., ge=0, le=10)
    correctness: float = Field(..., ge=0, le=10)
    relevance: float = Field(..., ge=0, le=10)
    completeness: float = Field(..., ge=0, le=10)
    confidence: float = Field(..., ge=0, le=10)
    examples: float = Field(..., ge=0, le=10)
    problem_solving: float = Field(..., ge=0, le=10)
    missing_points: List[str] = Field(default_factory=list)
    feedback: str = Field(...)
    recommended_answer: str = Field(...)
    suggested_improvements: List[str] = Field(default_factory=list)
    follow_up_question: Optional[str] = None

class QuestionItemAI(BaseModel):
    question_text: str
    category: str
    topic: str = ""
    difficulty: str = "medium"
    expected_concepts: List[str] = []
    coding_starter_code: Optional[str] = None
    coding_test_cases: List[Dict[str, Any]] = []
    coding_language: Optional[str] = None

class InterviewPlanAIResponse(BaseModel):
    questions: List[QuestionItemAI]

class ResumeProject(BaseModel):
    name: str = ""
    description: str = ""
    technologies: List[str] = Field(default_factory=list)
    frameworks: List[str] = Field(default_factory=list)
    database: Optional[str] = None
    apis: List[str] = Field(default_factory=list)
    authentication: Optional[str] = None
    architecture: Optional[str] = None
    deployment: Optional[str] = None
    responsibilities: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    challenges: Optional[str] = None
    features: List[str] = Field(default_factory=list)

class CandidateDetails(BaseModel):
    name: str = ""
    education: List[Dict[str, Any]] = Field(default_factory=list)
    experience: List[Dict[str, Any]] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)

class CandidateProfile(BaseModel):
    candidate: CandidateDetails = Field(default_factory=CandidateDetails)
    projects: List[ResumeProject] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)

class ResumeAnalysisAIResponse(BaseModel):
    candidate: Optional[CandidateDetails] = None
    skills: List[str] = Field(default_factory=list)
    projects: List[Dict[str, Any]] = Field(default_factory=list)
    experience: List[Dict[str, Any]] = Field(default_factory=list)
    education: List[Dict[str, Any]] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    profile: Optional[Dict[str, Any]] = None
    suggested_questions: List[str] = Field(default_factory=list)

class JobDescriptionAnalysisAIResponse(BaseModel):
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    responsibilities: List[str] = []
    experience_requirements: Optional[str] = None
    suggested_questions: List[str] = []

class InterviewReportAIResponse(BaseModel):
    overall_score: float = Field(..., ge=0, le=10)
    technical_score: float = Field(..., ge=0, le=10)
    communication_score: float = Field(..., ge=0, le=10)
    problem_solving_score: float = Field(..., ge=0, le=10)
    confidence_score: float = Field(..., ge=0, le=10)
    strengths: List[str] = []
    weaknesses: List[str] = []
    questions_answered_well: List[str] = []
    questions_answered_poorly: List[str] = []
    recommended_study_topics: List[str] = []
    final_recommendation: str = Field(..., description="Ready | Needs Practice | Needs Significant Improvement")

# ==================== Code Execution Schemas ====================

class CodeExecutionRequest(BaseModel):
    language: str  # python, javascript, java, c++
    code: str
    stdin: Optional[str] = ""

class CodeExecutionResponse(BaseModel):
    language: str
    output: str
    error: Optional[str] = None
    exit_code: int = 0
    execution_time_ms: float = 0.0

class CodeReviewAIResponse(BaseModel):
    score: float
    time_complexity: str
    space_complexity: str
    code_quality: str
    bugs_or_edge_cases: List[str] = []
    suggested_improvements: List[str] = []
    optimized_code: Optional[str] = None
