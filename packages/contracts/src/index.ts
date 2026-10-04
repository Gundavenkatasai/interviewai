import { z } from "zod";

// ==========================================
// Authentication Schemas
// ==========================================
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// ==========================================
// Job Schemas
// ==========================================
export const JobQuerySchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  workMode: z.enum(["REMOTE", "HYBRID", "ONSITE"]).optional(),
  source: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(["freshness", "match", "trust"]).default("freshness"),
});
export type JobQuery = z.infer<typeof JobQuerySchema>;

// ==========================================
// Interview Lifecycle Schemas
// ==========================================
export const CreateInterviewSessionSchema = z.object({
  jobRole: z.string().min(2),
  interviewType: z.string().default("TECHNICAL"),
  experienceLevel: z.string().default("MID"),
  totalQuestions: z.number().int().min(1).max(20).default(5),
  resumeText: z.string().optional(),
  jobDescription: z.string().optional(),
});
export type CreateInterviewSession = z.infer<typeof CreateInterviewSessionSchema>;

export const SubmitAnswerSchema = z.object({
  questionId: z.string().min(1),
  answerSubmissionId: z.string().min(1),
  transcript: z.string().min(1),
  durationMs: z.number().nonnegative(),
  confidence: z.number().min(0).max(1).optional(),
});
export type SubmitAnswer = z.infer<typeof SubmitAnswerSchema>;

export const SkipQuestionSchema = z.object({
  questionId: z.string().min(1),
  reason: z.string().default("CANDIDATE_SKIPPED"),
});
export type SkipQuestion = z.infer<typeof SkipQuestionSchema>;

export const UpdateStateSchema = z.object({
  fromState: z.string(),
  toState: z.string(),
  stateVersion: z.number().int().positive(),
  metadata: z.record(z.any()).optional(),
});
export type UpdateState = z.infer<typeof UpdateStateSchema>;

// ==========================================
// 8-Dimension Rubric Evaluation Schemas
// ==========================================
export const RubricDimensionScoresSchema = z.object({
  technicalAccuracy: z.number().min(0).max(100),
  communicationClarity: z.number().min(0).max(100),
  problemSolvingStructure: z.number().min(0).max(100),
  depthOfKnowledge: z.number().min(0).max(100),
  practicalExperience: z.number().min(0).max(100),
  edgeCaseAwareness: z.number().min(0).max(100),
  relevanceAndBrevity: z.number().min(0).max(100),
  confidenceAndPoise: z.number().min(0).max(100),
});
export type RubricDimensionScoresContract = z.infer<typeof RubricDimensionScoresSchema>;

// ==========================================
// Normalized WebSocket Envelope
// ==========================================
export const WebSocketEnvelopeSchema = z.object({
  type: z.string(),
  sessionId: z.string().optional(),
  sequence: z.number().optional(),
  stateVersion: z.number().optional(),
  questionId: z.string().optional(),
  timestamp: z.string(),
  payload: z.any(),
});
export type WebSocketEnvelopeContract = z.infer<typeof WebSocketEnvelopeSchema>;
