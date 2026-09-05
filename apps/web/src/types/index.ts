export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Question {
  id: string;
  session_id: string;
  question_order: number;
  question_text: string;
  category: string;
  topic?: string;
  source?: string;
  resume_reference?: string;
  similarity_score?: number;
  generated_dynamically?: boolean;
  expected_concepts: string[];
  coding_starter_code?: string;
  coding_test_cases?: { input: string; expected: string }[];
  coding_language?: string;
  is_follow_up: boolean;
  parent_question_id?: string;
  created_at: string;
  answers?: CandidateAnswer[];
}

export interface AnswerEvaluation {
  id: string;
  score: number;
  correct: boolean;
  technical_depth: number;
  communication: number;
  correctness: number;
  relevance: number;
  completeness: number;
  confidence: number;
  examples: number;
  problem_solving: number;
  missing_points: string[];
  feedback: string;
  recommended_answer?: string;
  suggested_improvements: string[];
  follow_up_question?: string;
  created_at: string;
}

export interface CandidateAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  code_submission?: string;
  duration_seconds: number;
  submitted_at: string;
  evaluation?: AnswerEvaluation;
}

export interface TranscriptItem {
  id?: string;
  speaker: "interviewer" | "candidate" | "ai_coach";
  content: string;
  timestamp?: string;
  confidence?: number;
}

export interface InterviewScore {
  overall_score: number;
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  confidence_score: number;
  strengths: string[];
  weaknesses: string[];
  questions_answered_well: string[];
  questions_answered_poorly: string[];
  recommended_study_topics: string[];
  final_recommendation: "Ready" | "Needs Practice" | "Needs Significant Improvement";
}

export interface InterviewSession {
  id: string;
  role: string;
  company?: string;
  experience_level: string;
  interview_type: string;
  difficulty: string;
  technologies: string[];
  coach_mode: "practice" | "interview" | "review";
  status: "setup" | "in_progress" | "paused" | "completed";
  state?: string;
  duration_minutes: number;
  elapsed_seconds: number;
  question_count: number;
  max_questions: number;
  current_question_index: number;
  resume_id?: string;
  job_description_id?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  questions?: Question[];
  transcripts?: TranscriptItem[];
  score?: InterviewScore;
}

export interface DashboardStats {
  total_interviews: number;
  completed_interviews: number;
  average_score: number;
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  confidence_score: number;
  strongest_skills: string[];
  weakest_skills: string[];
  recent_interviews: {
    id: string;
    role: string;
    difficulty: string;
    interview_type: string;
    status: string;
    created_at: string;
    score: number | null;
  }[];
  score_over_time: {
    date: string;
    score: number;
    technical: number;
    communication: number;
    role: string;
  }[];
  performance_radar: {
    subject: string;
    score: number;
    fullMark: number;
  }[];
  topic_performance: {
    topic: string;
    score: number;
  }[];
}

export interface CodeExecutionResponse {
  language: string;
  output: string;
  error?: string;
  exit_code: number;
  execution_time_ms: number;
}

export interface CodeReviewResponse {
  score: number;
  time_complexity: string;
  space_complexity: string;
  code_quality: string;
  bugs_or_edge_cases: string[];
  suggested_improvements: string[];
  optimized_code?: string;
}
