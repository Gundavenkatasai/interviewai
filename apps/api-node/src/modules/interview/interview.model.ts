import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

// ─── Authoritative States ───────────────────────────────────────────────────

export type InterviewState =
  | "SETUP"
  | "PERMISSION_GRANTED"
  | "AI_SPEAKING"
  | "CANDIDATE_READY"
  | "CANDIDATE_SPEAKING"
  | "PROCESSING"
  | "EVALUATING"
  | "GENERATING_NEXT"
  | "COMPLETING"
  | "REPORT_GENERATING"
  | "COMPLETED"
  | "FAILED"
  | "RECONNECTING";

export const VALID_STATE_TRANSITIONS: Record<InterviewState, InterviewState[]> = {
  SETUP: ["PERMISSION_GRANTED", "FAILED"],
  PERMISSION_GRANTED: ["AI_SPEAKING", "CANDIDATE_READY", "FAILED"],
  AI_SPEAKING: ["CANDIDATE_READY", "FAILED", "RECONNECTING"],
  CANDIDATE_READY: ["CANDIDATE_SPEAKING", "AI_SPEAKING", "PROCESSING", "EVALUATING", "COMPLETING", "FAILED", "RECONNECTING"],
  CANDIDATE_SPEAKING: ["PROCESSING", "EVALUATING", "FAILED", "RECONNECTING"],
  PROCESSING: ["EVALUATING", "GENERATING_NEXT", "COMPLETING", "FAILED"],
  EVALUATING: ["GENERATING_NEXT", "COMPLETING", "REPORT_GENERATING", "FAILED"],
  GENERATING_NEXT: ["AI_SPEAKING", "CANDIDATE_READY", "COMPLETING", "FAILED"],
  COMPLETING: ["REPORT_GENERATING", "COMPLETED", "FAILED"],
  REPORT_GENERATING: ["COMPLETED", "FAILED"],
  COMPLETED: [],
  FAILED: ["SETUP", "RECONNECTING"],
  RECONNECTING: [
    "AI_SPEAKING",
    "CANDIDATE_READY",
    "CANDIDATE_SPEAKING",
    "PROCESSING",
    "EVALUATING",
    "GENERATING_NEXT",
    "COMPLETING",
    "REPORT_GENERATING",
    "COMPLETED",
    "FAILED",
  ],
};

export type QuestionStatus = "GENERATED" | "ASKED" | "ANSWERING" | "SUBMITTED" | "EVALUATED" | "SKIPPED";
export type EvidenceStatus = "SUPPORTED" | "WEAK" | "MISSING" | "UNKNOWN";

// ─── Interview Session ──────────────────────────────────────────────────────

export interface IInterviewSession {
  _id: string;
  userId: string;
  resumeId?: string;
  jobDescriptionId?: string;
  jobId?: string;
  candidateProfileVersion?: number;
  resumeVersion?: number;
  jobSnapshotVersion?: number;
  contextVersion: number;
  contextSnapshot?: {
    skills: string[];
    projects: string[];
    experienceSummary: string;
    targetRole: string;
    jobRequirements?: string[];
    previousWeaknesses?: string[];
    storyBankCount?: number;
  };
  role: string;
  company?: string;
  experienceLevel: string;
  interviewType: string;
  difficulty: string;
  technologies: string[];
  coachMode: string;
  status: string;
  state: InterviewState;
  durationMinutes: number;
  elapsedSeconds: number;
  questionCount: number;
  maxQuestions: number;
  currentQuestionId?: string;
  currentQuestionIndex: number;
  stateVersion: number;
  sessionVersion: number;
  lastSequence: number;
  score?: any;
  evaluations?: any[];
  startedAt?: Date;
  completedAt?: Date;
  completionLock?: string;
  createdAt: Date;
  updatedAt: Date;
}

const interviewSessionSchema = new Schema<IInterviewSession>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    resumeId: { type: String, ref: "Resume" },
    jobDescriptionId: { type: String },
    jobId: { type: String, ref: "Job" },
    candidateProfileVersion: { type: Number, default: 1 },
    resumeVersion: { type: Number, default: 1 },
    jobSnapshotVersion: { type: Number, default: 1 },
    contextVersion: { type: Number, default: 1 },
    contextSnapshot: { type: Object, default: {} },
    role: { type: String, required: true },
    company: { type: String },
    experienceLevel: { type: String, default: "mid" },
    interviewType: { type: String, default: "technical" },
    difficulty: { type: String, default: "medium" },
    technologies: { type: [String], default: [] },
    coachMode: { type: String, default: "interview" },
    status: { type: String, default: "setup" },
    state: { type: String, default: "SETUP", index: true },
    durationMinutes: { type: Number, default: 30 },
    elapsedSeconds: { type: Number, default: 0 },
    questionCount: { type: Number, default: 0 },
    maxQuestions: { type: Number, default: 5 },
    currentQuestionId: { type: String },
    currentQuestionIndex: { type: Number, default: 0 },
    stateVersion: { type: Number, default: 1 },
    sessionVersion: { type: Number, default: 1 },
    lastSequence: { type: Number, default: 0 },
    score: { type: Object },
    evaluations: { type: [Object], default: [] },
    startedAt: { type: Date },
    completedAt: { type: Date },
    completionLock: { type: String },
  },
  { timestamps: true }
);

export const InterviewSession = mongoose.model<IInterviewSession>("InterviewSession", interviewSessionSchema);

// ─── Interview Question ─────────────────────────────────────────────────────

export interface IInterviewQuestion {
  _id: string;
  sessionId: string;
  questionOrder: number;
  sequenceNumber: number;
  questionText: string;
  normalizedText?: string;
  category: string;
  topic?: string;
  source: string;
  difficulty?: string;
  resumeReference?: string;
  sourceContext?: any;
  status: QuestionStatus;
  skipReason?: string;
  similarityScore?: number;
  embedding?: number[];
  expectedConcepts: any[];
  codingStarterCode?: string;
  codingTestCases: any[];
  codingLanguage?: string;
  isFollowUp: boolean;
  parentQuestionId?: string;
  generatedAt: Date;
  answeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const interviewQuestionSchema = new Schema<IInterviewQuestion>(
  {
    _id: { type: String, default: () => randomUUID() },
    sessionId: { type: String, ref: "InterviewSession", required: true, index: true },
    questionOrder: { type: Number, default: 1 },
    sequenceNumber: { type: Number, default: 1 },
    questionText: { type: String, required: true },
    normalizedText: { type: String, index: true },
    category: { type: String, default: "technical" },
    topic: { type: String },
    source: { type: String, default: "ai" },
    difficulty: { type: String },
    resumeReference: { type: String },
    sourceContext: { type: Object, default: {} },
    status: { type: String, default: "GENERATED", index: true },
    skipReason: { type: String },
    similarityScore: { type: Number },
    embedding: { type: [Number] },
    expectedConcepts: { type: [Object], default: [] },
    codingStarterCode: { type: String },
    codingTestCases: { type: [Object], default: [] },
    codingLanguage: { type: String },
    isFollowUp: { type: Boolean, default: false },
    parentQuestionId: { type: String },
    generatedAt: { type: Date, default: Date.now },
    answeredAt: { type: Date },
  },
  { timestamps: true }
);

export const InterviewQuestion = mongoose.model<IInterviewQuestion>("InterviewQuestion", interviewQuestionSchema);

// ─── Candidate Answer ───────────────────────────────────────────────────────

export interface ICandidateAnswer {
  _id: string;
  questionId: string;
  sessionId: string;
  answerSubmissionId?: string;
  answerText: string;
  transcript?: string;
  codeSubmission?: string;
  audioReference?: string;
  duration: number;
  durationMs?: number;
  startedAt?: Date;
  submittedAt: Date;
  answerVersion: number;
  status: "SUBMITTED" | "EVALUATED" | "SKIPPED";
  createdAt: Date;
  updatedAt: Date;
}

export const candidateAnswerSchema = new Schema<ICandidateAnswer>(
  {
    _id: { type: String, default: () => randomUUID() },
    questionId: { type: String, ref: "InterviewQuestion", required: true, index: true },
    sessionId: { type: String, ref: "InterviewSession", required: true, index: true },
    answerSubmissionId: { type: String, index: true },
    answerText: { type: String, required: true },
    transcript: { type: String },
    codeSubmission: { type: String },
    audioReference: { type: String },
    duration: { type: Number, default: 0.0 },
    durationMs: { type: Number, default: 0 },
    startedAt: { type: Date },
    submittedAt: { type: Date, default: Date.now },
    answerVersion: { type: Number, default: 1 },
    status: { type: String, default: "SUBMITTED" },
  },
  { timestamps: true }
);

candidateAnswerSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });
candidateAnswerSchema.index({ sessionId: 1, questionId: 1, answerSubmissionId: 1 });

export const CandidateAnswer = mongoose.model<ICandidateAnswer>("CandidateAnswer", candidateAnswerSchema);

// ─── Answer Evaluation ──────────────────────────────────────────────────────

export interface IAnswerEvaluation {
  _id: string;
  answerId: string;
  rubricVersion: string;
  score: number;
  correct: boolean;
  dimensionScores: {
    technicalAccuracy: number;
    relevance: number;
    completeness: number;
    depth: number;
    problemSolving: number;
    communication: number;
    structure: number;
    confidenceClarity: number;
  };
  evidenceState: {
    technicalAccuracy: EvidenceStatus;
    relevance: EvidenceStatus;
    completeness: EvidenceStatus;
    depth: EvidenceStatus;
    problemSolving: EvidenceStatus;
    communication: EvidenceStatus;
    structure: EvidenceStatus;
    confidenceClarity: EvidenceStatus;
  };
  strengths: string[];
  weaknesses: string[];
  missingPoints: string[];
  evidence: string[];
  feedback: string;
  recommendedAnswer?: string;
  suggestedImprovements: string[];
  followUpQuestion?: string;
  confidence: number;
  model: string;
  provider: string;
  promptVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export const answerEvaluationSchema = new Schema<IAnswerEvaluation>(
  {
    _id: { type: String, default: () => randomUUID() },
    answerId: { type: String, ref: "CandidateAnswer", required: true, unique: true, index: true },
    rubricVersion: { type: String, default: "v1.0" },
    score: { type: Number, default: 0.0 },
    correct: { type: Boolean, default: true },
    dimensionScores: {
      technicalAccuracy: { type: Number, default: 0 },
      relevance: { type: Number, default: 0 },
      completeness: { type: Number, default: 0 },
      depth: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      structure: { type: Number, default: 0 },
      confidenceClarity: { type: Number, default: 0 },
    },
    evidenceState: {
      technicalAccuracy: { type: String, default: "UNKNOWN" },
      relevance: { type: String, default: "UNKNOWN" },
      completeness: { type: String, default: "UNKNOWN" },
      depth: { type: String, default: "UNKNOWN" },
      problemSolving: { type: String, default: "UNKNOWN" },
      communication: { type: String, default: "UNKNOWN" },
      structure: { type: String, default: "UNKNOWN" },
      confidenceClarity: { type: String, default: "UNKNOWN" },
    },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    missingPoints: { type: [String], default: [] },
    evidence: { type: [String], default: [] },
    feedback: { type: String, required: true },
    recommendedAnswer: { type: String },
    suggestedImprovements: { type: [String], default: [] },
    followUpQuestion: { type: String },
    confidence: { type: Number, default: 0.85 },
    model: { type: String, default: "qwen-2.5-coder" },
    provider: { type: String, default: "qwen" },
    promptVersion: { type: String, default: "INTERVIEW_ANSWER_EVALUATION_v1" },
  },
  { timestamps: true }
);

export const AnswerEvaluation = mongoose.model<IAnswerEvaluation>("AnswerEvaluation", answerEvaluationSchema);

// ─── Interview Report ───────────────────────────────────────────────────────

export interface IQuestionResult {
  questionId: string;
  sequenceNumber: number;
  questionText: string;
  category: string;
  difficulty: string;
  status: QuestionStatus;
  candidateAnswer?: string;
  score: number;
  whatWentWell: string[];
  whatCouldImprove: string[];
  evidence: string[];
  recommendedAnswer?: string;
}

export interface IInterviewReport {
  _id: string;
  reportId: string;
  sessionId: string;
  userId: string;
  candidateSnapshotVersion?: number;
  resumeVersion?: number;
  jobSnapshotVersion?: number;
  totalQuestions: number;
  answeredQuestions: number;
  skippedQuestions: number;
  overallScore: number;
  dimensionScores: {
    technical: number;
    communication: number;
    problemSolving: number;
    relevance: number;
    completeness: number;
    depth: number;
    structure: number;
    confidence: number;
  };
  strengths: string[];
  weaknesses: string[];
  technicalGaps: string[];
  communicationFeedback: string[];
  repeatedMistakes: string[];
  topicCoverage: {
    coveredTopics: string[];
    weakTopics: string[];
    strongTopics: string[];
    remainingTopics: string[];
  };
  questionResults: IQuestionResult[];
  recommendedTopics: string[];
  recommendedQuestions: string[];
  readinessAssessment: "Ready" | "Needs Practice" | "Not Ready" | "Strongly Ready";
  nextBestActions: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reportVersion: number;
  scoringVersion: string;
  rubricVersion: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const interviewReportSchema = new Schema<IInterviewReport>(
  {
    _id: { type: String, default: () => randomUUID() },
    reportId: { type: String, default: () => randomUUID(), index: true },
    sessionId: { type: String, ref: "InterviewSession", required: true, index: true },
    userId: { type: String, ref: "User", required: true, index: true },
    candidateSnapshotVersion: { type: Number, default: 1 },
    resumeVersion: { type: Number, default: 1 },
    jobSnapshotVersion: { type: Number, default: 1 },
    totalQuestions: { type: Number, default: 0 },
    answeredQuestions: { type: Number, default: 0 },
    skippedQuestions: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 },
    dimensionScores: {
      technical: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      relevance: { type: Number, default: 0 },
      completeness: { type: Number, default: 0 },
      depth: { type: Number, default: 0 },
      structure: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
    },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    technicalGaps: { type: [String], default: [] },
    communicationFeedback: { type: [String], default: [] },
    repeatedMistakes: { type: [String], default: [] },
    topicCoverage: {
      coveredTopics: { type: [String], default: [] },
      weakTopics: { type: [String], default: [] },
      strongTopics: { type: [String], default: [] },
      remainingTopics: { type: [String], default: [] },
    },
    questionResults: { type: [Object], default: [] },
    recommendedTopics: { type: [String], default: [] },
    recommendedQuestions: { type: [String], default: [] },
    readinessAssessment: { type: String, default: "Needs Practice" },
    nextBestActions: { type: [String], default: [] },
    confidence: { type: String, default: "HIGH" },
    reportVersion: { type: Number, default: 1 },
    scoringVersion: { type: String, default: "v1.0" },
    rubricVersion: { type: String, default: "rubric-v1.0" },
    idempotencyKey: { type: String, unique: true, index: true },
  },
  { timestamps: true }
);

export const InterviewReport = mongoose.model<IInterviewReport>("InterviewReport", interviewReportSchema);

// ─── Transcript & Event ─────────────────────────────────────────────────────

export const transcriptSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    sessionId: { type: String, ref: "InterviewSession", required: true, index: true },
    speaker: { type: String, required: true }, // interviewer, candidate, ai_coach
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    confidence: { type: Number, default: 1.0 },
  },
  { timestamps: true }
);

export const Transcript = mongoose.model("Transcript", transcriptSchema);

export const interviewEventSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    sessionId: { type: String, ref: "InterviewSession", required: true, index: true },
    eventType: { type: String, required: true, index: true },
    payload: { type: Object, default: {} },
  },
  { timestamps: true }
);

export const InterviewEvent = mongoose.model("InterviewEvent", interviewEventSchema);
