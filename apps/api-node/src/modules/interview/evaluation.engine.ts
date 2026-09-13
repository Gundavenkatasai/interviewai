import { AIService } from "../../ai/ai.service";
import { InterviewQuestion, CandidateAnswer, AnswerEvaluation, InterviewSession } from "./interview.model";
import { AIContextEngine } from "../../ai/context.engine";
import { Profile } from "../profile/profile.model";

export class EvaluationEngine {
  static async evaluateAnswer(answerId: string) {
    const answer = await CandidateAnswer.findById(answerId).populate("questionId");
    if (!answer) throw new Error("Answer not found");

    const question = answer.questionId as any;

    const schema = {
      type: "object",
      properties: {
        score: { type: "number" },
        feedback: { type: "string" },
        correct: { type: "boolean" },
        technicalDepth: { type: "number" },
        communication: { type: "number" },
        correctness: { type: "number" },
        relevance: { type: "number" },
        completeness: { type: "number" },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } }
      },
      required: ["score", "feedback", "correct", "technicalDepth", "communication", "correctness", "relevance", "completeness"]
    };

    const session = await InterviewSession.findById(answer.sessionId);
    let candidateContext = "";
    let jobContext = "";
    if (session) {
      const profile = await Profile.findOne({ userId: session.userId });
      candidateContext = AIContextEngine.buildCandidateContext(profile, "short");
      jobContext = `Role: ${session.role} at ${session.company || "Unknown Company"}`;
    }

    const prompt = `You are an expert technical interviewer. Evaluate the candidate's answer.
Context about the candidate:
${candidateContext}

Target Role:
${jobContext}

Question: "${question.questionText}"
Candidate Answer: "${answer.answerText}"

Provide a comprehensive evaluation according to the schema. The score should be out of 10.`;

    const result = await AIService.generateStructured<any>(
      [{ role: "user", content: prompt }],
      schema
    );

    const evaluation = await AnswerEvaluation.create({
      answerId: answer._id,
      ...result
    });

    return evaluation;
  }
}
