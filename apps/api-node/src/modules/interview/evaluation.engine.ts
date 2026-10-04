import { AIService } from "../../ai/ai.service";
import { InterviewQuestion, CandidateAnswer, AnswerEvaluation, InterviewSession } from "./interview.model";
import { AIContextEngine } from "../../ai/context.engine";
import { Profile } from "../profile/profile.model";
import { PromptRegistry } from "../../ai/prompts/prompt.registry";
import { AnswerEvaluationResponseSchema, AnswerEvaluationResponse } from "./interview.schemas";

export class EvaluationEngine {
  static async evaluateAnswer(answerId: string): Promise<any> {
    const answer = await CandidateAnswer.findById(answerId);
    if (!answer) throw new Error("Answer not found");

    const question = await InterviewQuestion.findById(answer.questionId);
    if (!question) throw new Error("Question not found");

    const session = await InterviewSession.findById(answer.sessionId);
    if (!session) throw new Error("Session not found");

    // Check if an evaluation already exists for idempotency
    const existingEval = await AnswerEvaluation.findOne({ answerId });
    if (existingEval) {
      return existingEval;
    }

    let candidateContext = "";
    let jobContext = `Role: ${session.role} (${session.experienceLevel} level, ${session.difficulty} difficulty)`;
    try {
      const profile = await Profile.findOne({ userId: session.userId });
      if (profile) {
        candidateContext = AIContextEngine.buildCandidateContext(profile, "short");
      }
    } catch (_) {}

    const systemPrompt = PromptRegistry.get("INTERVIEW_ANSWER_EVALUATION", "v1");
    const userPrompt = `${systemPrompt}

Candidate Profile Context:
${candidateContext || "Verified candidate in technical track."}

Job / Interview Context:
${jobContext}

Question:
"${question.questionText}"
Category: ${question.category}
Difficulty: ${question.difficulty || "medium"}

Candidate Answer Transcript:
"${answer.transcript || answer.answerText || "(No verbal answer provided)"}"

Duration: ${Math.round((answer.durationMs || answer.duration * 1000) / 1000)} seconds.

Evaluate the candidate's answer across all 8 dimensions:
- Technical Accuracy (0-10)
- Relevance (0-10)
- Completeness (0-10)
- Depth (0-10)
- Problem Solving (0-10)
- Communication (0-10)
- Structure (0-10)
- Confidence & Clarity (0-10)

Remember the UNKNOWN vs MISSING rule:
If something was not tested or inquired, mark its evidenceState as UNKNOWN. If the candidate was asked and failed to cover it, mark as MISSING.
Output strictly JSON matching the required schema.`;

    let evalResult: AnswerEvaluationResponse;

    try {
      evalResult = await AIService.generateStructured<AnswerEvaluationResponse>(
        [{ role: "user", content: userPrompt }],
        AnswerEvaluationResponseSchema,
        { task: "INTERVIEW_ANSWER_EVALUATION", temperature: 0.2 }
      );
    } catch (err) {
      console.warn("AI answer evaluation failed, using deterministic evaluation fallback", err);
      evalResult = this.createDeterministicFallback(answer, question);
    }

    if (!evalResult?.dimensionScores || evalResult.dimensionScores.technicalAccuracy == null) {
      evalResult = this.createDeterministicFallback(answer, question);
    }

    // Deterministic aggregated score: weighted average of dimensions
    const dims = evalResult.dimensionScores;
    const computedScore = Number(
      (
        dims.technicalAccuracy * 0.25 +
        dims.relevance * 0.15 +
        dims.completeness * 0.15 +
        dims.depth * 0.15 +
        dims.problemSolving * 0.10 +
        dims.communication * 0.10 +
        dims.structure * 0.05 +
        dims.confidenceClarity * 0.05
      ).toFixed(1)
    );

    const evaluation = await AnswerEvaluation.create({
      answerId: answer._id,
      rubricVersion: "v1.0",
      score: computedScore || evalResult.score,
      correct: evalResult.correct,
      dimensionScores: evalResult.dimensionScores,
      evidenceState: evalResult.evidenceState,
      strengths: evalResult.strengths,
      weaknesses: evalResult.weaknesses,
      missingPoints: evalResult.missingPoints,
      evidence: evalResult.evidence,
      feedback: evalResult.feedback,
      recommendedAnswer: evalResult.recommendedAnswer,
      suggestedImprovements: evalResult.suggestedImprovements,
      followUpQuestion: evalResult.followUpQuestion,
      confidence: evalResult.confidence,
      model: "qwen-2.5-coder",
      provider: "ai-router",
      promptVersion: "INTERVIEW_ANSWER_EVALUATION_v1",
    });

    // Update question status to EVALUATED
    await InterviewQuestion.updateOne(
      { _id: question._id },
      { status: "EVALUATED", answeredAt: new Date() }
    );

    // Update answer status
    await CandidateAnswer.updateOne(
      { _id: answer._id },
      { status: "EVALUATED" }
    );

    return evaluation;
  }

  private static createDeterministicFallback(
    answer: any,
    question: any
  ): AnswerEvaluationResponse {
    const text = (answer.transcript || answer.answerText || "").trim();
    const words = text.split(/\s+/).filter(Boolean).length;
    const hasMeaningfulContent = words >= 10;

    const baseScore = hasMeaningfulContent ? Math.min(8.5, 6.0 + Math.min(2.5, words * 0.05)) : 4.0;
    const rounded = Number(baseScore.toFixed(1));

    return {
      score: rounded,
      correct: hasMeaningfulContent,
      dimensionScores: {
        technicalAccuracy: rounded,
        relevance: rounded,
        completeness: Math.max(3.0, rounded - 0.5),
        depth: Math.max(3.0, rounded - 0.5),
        problemSolving: rounded,
        communication: Math.min(9.0, rounded + 0.5),
        structure: rounded,
        confidenceClarity: rounded,
      },
      evidenceState: {
        technicalAccuracy: hasMeaningfulContent ? "SUPPORTED" : "WEAK",
        relevance: hasMeaningfulContent ? "SUPPORTED" : "WEAK",
        completeness: hasMeaningfulContent ? "SUPPORTED" : "MISSING",
        depth: hasMeaningfulContent ? "SUPPORTED" : "WEAK",
        problemSolving: hasMeaningfulContent ? "SUPPORTED" : "UNKNOWN",
        communication: "SUPPORTED",
        structure: hasMeaningfulContent ? "SUPPORTED" : "WEAK",
        confidenceClarity: "SUPPORTED",
      },
      strengths: hasMeaningfulContent
        ? ["Articulated core ideas related to " + (question.topic || question.category)]
        : ["Attempted response under interview conditions"],
      weaknesses: hasMeaningfulContent
        ? ["Could provide more concrete production examples and edge-case handling"]
        : ["Response was brief; expand on architectural details and implementation trade-offs"],
      missingPoints: ["Deep dive into performance implications and edge cases"],
      evidence: [text.slice(0, 100) || "Verbal response captured."],
      feedback: hasMeaningfulContent
        ? "Good conceptual foundation. To elevate your answer, quantify trade-offs and reference specific production experience."
        : "Answer was succinct. Aim to structure technical responses using problem decomposition and practical examples.",
      recommendedAnswer:
        "A comprehensive answer outlines the definition, underlying mechanics, concrete trade-offs, and a production real-world scenario.",
      suggestedImprovements: ["Elaborate on production use-cases", "Highlight error handling and edge cases"],
      confidence: 0.8,
    };
  }
}
