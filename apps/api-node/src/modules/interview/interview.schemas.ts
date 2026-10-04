import { z } from "zod";

export const EvidenceStatusSchema = z.enum(["SUPPORTED", "WEAK", "MISSING", "UNKNOWN"]);

export const QuestionItemSchema = z.object({
  questionText: z.string().min(5),
  category: z.string().default("technical"),
  topic: z.string().default("General"),
  difficulty: z.enum(["easy", "medium", "hard", "Easy", "Medium", "Hard"]).default("medium"),
  expectedConcepts: z.array(z.string()).default([]),
});

export const QuestionGenerationResponseSchema = z.object({
  questions: z.array(QuestionItemSchema).min(1),
});

export const AnswerEvaluationResponseSchema = z.object({
  score: z.number().min(0).max(10),
  correct: z.boolean().default(true),
  dimensionScores: z.object({
    technicalAccuracy: z.number().min(0).max(10),
    relevance: z.number().min(0).max(10),
    completeness: z.number().min(0).max(10),
    depth: z.number().min(0).max(10),
    problemSolving: z.number().min(0).max(10),
    communication: z.number().min(0).max(10),
    structure: z.number().min(0).max(10),
    confidenceClarity: z.number().min(0).max(10),
  }),
  evidenceState: z.object({
    technicalAccuracy: EvidenceStatusSchema.default("UNKNOWN"),
    relevance: EvidenceStatusSchema.default("UNKNOWN"),
    completeness: EvidenceStatusSchema.default("UNKNOWN"),
    depth: EvidenceStatusSchema.default("UNKNOWN"),
    problemSolving: EvidenceStatusSchema.default("UNKNOWN"),
    communication: EvidenceStatusSchema.default("UNKNOWN"),
    structure: EvidenceStatusSchema.default("UNKNOWN"),
    confidenceClarity: EvidenceStatusSchema.default("UNKNOWN"),
  }).default({
    technicalAccuracy: "UNKNOWN",
    relevance: "UNKNOWN",
    completeness: "UNKNOWN",
    depth: "UNKNOWN",
    problemSolving: "UNKNOWN",
    communication: "UNKNOWN",
    structure: "UNKNOWN",
    confidenceClarity: "UNKNOWN",
  }),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  evidence: z.array(z.string()).default([]),
  missingPoints: z.array(z.string()).default([]),
  feedback: z.string().min(5),
  recommendedAnswer: z.string().optional(),
  suggestedImprovements: z.array(z.string()).default([]),
  followUpQuestion: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.85),
});

export const FollowupQuestionResponseSchema = z.object({
  questionText: z.string().min(5),
  category: z.string().default("technical"),
  topic: z.string().default("Targeted Follow-up"),
  difficulty: z.enum(["easy", "medium", "hard", "Easy", "Medium", "Hard"]).default("medium"),
  reason: z.string().default("Probe deeper into candidate's previous response"),
  expectedConcepts: z.array(z.string()).default([]),
});

export const FinalReportResponseSchema = z.object({
  overallScore: z.number().min(0).max(10),
  dimensionScores: z.object({
    technical: z.number().min(0).max(10),
    communication: z.number().min(0).max(10),
    problemSolving: z.number().min(0).max(10),
    relevance: z.number().min(0).max(10),
    completeness: z.number().min(0).max(10),
    depth: z.number().min(0).max(10),
    structure: z.number().min(0).max(10),
    confidence: z.number().min(0).max(10),
  }),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).default([]),
  technicalGaps: z.array(z.string()).default([]),
  communicationFeedback: z.array(z.string()).default([]),
  repeatedMistakes: z.array(z.string()).default([]),
  topicCoverage: z.object({
    coveredTopics: z.array(z.string()).default([]),
    weakTopics: z.array(z.string()).default([]),
    strongTopics: z.array(z.string()).default([]),
    remainingTopics: z.array(z.string()).default([]),
  }),
  questionEvaluations: z.array(
    z.object({
      questionText: z.string(),
      score: z.number().min(0).max(10),
      whatWentWell: z.array(z.string()).default([]),
      whatCouldImprove: z.array(z.string()).default([]),
      evidence: z.array(z.string()).default([]),
      recommendedAnswer: z.string().optional(),
    })
  ).default([]),
  recommendedTopics: z.array(z.string()).default([]),
  recommendedQuestions: z.array(z.string()).default([]),
  readinessAssessment: z.enum(["Ready", "Needs Practice", "Not Ready", "Strongly Ready"]).default("Needs Practice"),
  nextBestActions: z.array(z.string()).default([]),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).default("HIGH"),
});

export type QuestionGenerationResponse = z.infer<typeof QuestionGenerationResponseSchema>;
export type AnswerEvaluationResponse = z.infer<typeof AnswerEvaluationResponseSchema>;
export type FollowupQuestionResponse = z.infer<typeof FollowupQuestionResponseSchema>;
export type FinalReportResponse = z.infer<typeof FinalReportResponseSchema>;
