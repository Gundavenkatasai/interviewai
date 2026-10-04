import { describe, it, expect } from "vitest";
import { CreateInterviewSessionSchema, SubmitAnswerSchema, RubricDimensionScoresSchema } from "@interview-ai/contracts";

describe("Interview E2E Contract Tests", () => {
  it("validates session creation request contract", () => {
    const validPayload = {
      jobRole: "Senior Frontend Engineer",
      interviewType: "TECHNICAL",
      experienceLevel: "SENIOR",
      totalQuestions: 5,
    };
    const result = CreateInterviewSessionSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("validates answer submission contract with idempotency key", () => {
    const payload = {
      questionId: "q_101",
      answerSubmissionId: "sub_uuid_456",
      transcript: "I used React useMemo and useCallback to optimize re-renders in large trees.",
      durationMs: 45000,
      confidence: 0.95,
    };
    const result = SubmitAnswerSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("validates all 8 rubric dimension evaluation scores", () => {
    const scores = {
      technicalAccuracy: 88,
      communicationClarity: 85,
      problemSolvingStructure: 90,
      depthOfKnowledge: 82,
      practicalExperience: 91,
      edgeCaseAwareness: 78,
      relevanceAndBrevity: 84,
      confidenceAndPoise: 87,
    };
    const result = RubricDimensionScoresSchema.safeParse(scores);
    expect(result.success).toBe(true);
  });
});
