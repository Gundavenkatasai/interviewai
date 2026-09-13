import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export interface IInterviewSession {
  _id: string;
  userId: string;
  resumeId?: string;
  jobDescriptionId?: string;
  role: string;
  company?: string;
  experienceLevel: string;
  interviewType: string;
  difficulty: string;
  technologies: string[];
  coachMode: string;
  status: string;
  state: string;
  durationMinutes: number;
  elapsedSeconds: number;
  questionCount: number;
  maxQuestions: number;
  currentQuestionIndex: number;
  stateVersion: number;
  lastSequence: number;
  score?: any;
  evaluations?: any[];
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

const interviewSessionSchema = new Schema<IInterviewSession>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    resumeId: { type: String, ref: "Resume" },
    jobDescriptionId: { type: String },
    role: { type: String, required: true },
    company: { type: String },
    experienceLevel: { type: String, default: "mid" },
    interviewType: { type: String, default: "technical" },
    difficulty: { type: String, default: "medium" },
    technologies: { type: [String], default: [] },
    coachMode: { type: String, default: "interview" },
    status: { type: String, default: "setup" },
    state: { type: String, default: "CREATED" },
    durationMinutes: { type: Number, default: 30 },
    elapsedSeconds: { type: Number, default: 0 },
    questionCount: { type: Number, default: 0 },
    maxQuestions: { type: Number, default: 10 },
    currentQuestionIndex: { type: Number, default: 0 },
    stateVersion: { type: Number, default: 1 },
    lastSequence: { type: Number, default: 0 },
    score: { type: Object },
    evaluations: { type: [Object], default: [] },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const InterviewSession = mongoose.model<IInterviewSession>("InterviewSession", interviewSessionSchema);

export interface IInterviewQuestion {
  _id: string;
  sessionId: string;
  questionOrder: number;
  questionText: string;
  normalizedText?: string;
  category: string;
  topic?: string;
  source: string;
  difficulty?: string;
  resumeReference?: string;
  similarityScore?: number;
  embedding?: number[];
  expectedConcepts: any[];
  codingStarterCode?: string;
  codingTestCases: any[];
  codingLanguage?: string;
  isFollowUp: boolean;
  parentQuestionId?: string;
  createdAt: Date;
}

const interviewQuestionSchema = new Schema<IInterviewQuestion>(
  {
    _id: { type: String, default: () => randomUUID() },
    sessionId: { type: String, ref: "InterviewSession", required: true, index: true },
    questionOrder: { type: Number, default: 1 },
    questionText: { type: String, required: true },
    normalizedText: { type: String, index: true },
    category: { type: String, default: "technical" },
    topic: { type: String },
    source: { type: String, default: "ai" },
    difficulty: { type: String },
    resumeReference: { type: String },
    similarityScore: { type: Number },
    embedding: { type: [Number] },
    expectedConcepts: { type: [Object], default: [] },
    codingStarterCode: { type: String },
    codingTestCases: { type: [Object], default: [] },
    codingLanguage: { type: String },
    isFollowUp: { type: Boolean, default: false },
    parentQuestionId: { type: String },
  },
  { timestamps: true }
);

export const InterviewQuestion = mongoose.model<IInterviewQuestion>("InterviewQuestion", interviewQuestionSchema);

// Additional schemas like CandidateAnswer, AnswerEvaluation, Transcript
export const candidateAnswerSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    questionId: { type: String, ref: "InterviewQuestion", required: true, index: true },
    sessionId: { type: String, ref: "InterviewSession", required: true, index: true },
    answerText: { type: String, required: true },
    codeSubmission: { type: String },
    transcript: { type: String },
    audioReference: { type: String },
    duration: { type: Number, default: 0.0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

candidateAnswerSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });

export const CandidateAnswer = mongoose.model("CandidateAnswer", candidateAnswerSchema);

export const answerEvaluationSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    answerId: { type: String, ref: "CandidateAnswer", required: true, unique: true, index: true },
    score: { type: Number, default: 0.0 },
    correct: { type: Boolean, default: true },
    technicalDepth: { type: Number, default: 0.0 },
    communication: { type: Number, default: 0.0 },
    correctness: { type: Number, default: 0.0 },
    relevance: { type: Number, default: 0.0 },
    completeness: { type: Number, default: 0.0 },
    confidence: { type: Number, default: 0.0 },
    examples: { type: Number, default: 0.0 },
    problemSolving: { type: Number, default: 0.0 },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    missingPoints: { type: [String], default: [] },
    feedback: { type: String, required: true },
    recommendedAnswer: { type: String },
    suggestedImprovements: { type: [String], default: [] },
    followUpQuestion: { type: String },
  },
  { timestamps: true }
);

export const AnswerEvaluation = mongoose.model("AnswerEvaluation", answerEvaluationSchema);

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
