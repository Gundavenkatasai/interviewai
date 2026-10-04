/**
 * @interview-ai/types
 * Centralized cross-application TypeScript interfaces
 */

// User & Authentication
export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role?: string;
  createdAt: string;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  headline?: string;
  bio?: string;
  skills: string[];
  experienceYears?: number;
  targetRoles: string[];
  targetLocations: string[];
  preferredWorkMode?: 'REMOTE' | 'HYBRID' | 'ONSITE';
  salaryExpectation?: {
    currency: string;
    min: number;
    max: number;
  };
}

// Jobs & Matching
export interface JobSummary {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: 'REMOTE' | 'HYBRID' | 'ONSITE';
  employmentType?: string;
  descriptionSnippet: string;
  source: string;
  sourceUrl: string;
  matchScore?: number;
  trustScore?: number;
  recommendationPriority?: number;
  postedAt?: string;
  isSaved?: boolean;
}

// Resumes & ATS
export interface ResumeDocument {
  id: string;
  userId: string;
  title: string;
  fileUrl?: string;
  fileType: 'PDF' | 'DOCX' | 'CANONICAL';
  isPrimary: boolean;
  atsScore?: number;
  version: number;
  updatedAt: string;
}

export interface AtsScoreBreakdown {
  overallScore: number;
  technicalSkillsScore: number;
  softSkillsScore: number;
  experienceRelevanceScore: number;
  keywordMatchRate: number;
  formattingScore: number;
  missingKeywords: string[];
  matchedKeywords: string[];
  recommendations: string[];
}

// Mock Interview Session & State Machine
export type InterviewState =
  | 'SETUP'
  | 'PERMISSION_GRANTED'
  | 'AI_SPEAKING'
  | 'CANDIDATE_READY'
  | 'CANDIDATE_SPEAKING'
  | 'PROCESSING'
  | 'EVALUATING'
  | 'GENERATING_NEXT'
  | 'COMPLETING'
  | 'REPORT_GENERATING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RECONNECTING';

export interface RubricDimensionScores {
  technicalAccuracy: number;
  communicationClarity: number;
  problemSolvingStructure: number;
  depthOfKnowledge: number;
  practicalExperience: number;
  edgeCaseAwareness: number;
  relevanceAndBrevity: number;
  confidenceAndPoise: number;
}

export interface InterviewSessionSummary {
  id: string;
  userId: string;
  jobRole: string;
  interviewType: string;
  status: InterviewState;
  stateVersion: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  overallScore?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface InterviewReportSummary {
  id: string;
  sessionId: string;
  rubricVersion: string;
  overallScore: number;
  dimensionScores: RubricDimensionScores;
  strengths: string[];
  improvements: string[];
  executiveSummary: string;
  createdAt: string;
}

// Applications & Pipeline
export interface JobApplicationSummary {
  id: string;
  userId: string;
  jobId: string;
  company: string;
  role: string;
  status: 'DISCOVERED' | 'TAILORING' | 'READY_TO_APPLY' | 'APPLIED' | 'SCREENING' | 'INTERVIEWING' | 'OFFER' | 'REJECTED';
  appliedAt?: string;
  tailoredResumeId?: string;
}

// WebSocket Envelope
export interface WebSocketEnvelope<T = any> {
  type: string;
  sessionId?: string;
  sequence?: number;
  stateVersion?: number;
  questionId?: string;
  timestamp: string;
  payload: T;
}
