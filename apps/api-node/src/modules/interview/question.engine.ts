import { AIService } from "../../ai/ai.service";
import { InterviewSession, InterviewQuestion, AnswerEvaluation, CandidateAnswer } from "./interview.model";
import { PromptRegistry } from "../../ai/prompts/prompt.registry";
import { FollowupQuestionResponseSchema, FollowupQuestionResponse } from "./interview.schemas";
import { AIContextEngine } from "../../ai/context.engine";
import { Profile } from "../profile/profile.model";

export class QuestionEngine {
  static async generateNextQuestion(sessionId: string): Promise<any> {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error("Session not found");

    const previousQuestions = await InterviewQuestion.find({ sessionId }).sort({ questionOrder: 1 });
    const askedTexts = new Set(previousQuestions.map(q => q.questionText.toLowerCase().trim()));

    // Find the latest evaluation to detect weak areas for dynamic follow-up
    let weakAreas: string[] = [];
    let strongAreas: string[] = [];
    let lastEvaluatedTopic: string = "";

    try {
      const answers = await CandidateAnswer.find({ sessionId }).sort({ createdAt: -1 }).limit(3);
      for (const ans of answers) {
        const ev = await AnswerEvaluation.findOne({ answerId: ans._id });
        if (ev) {
          if (ev.weaknesses?.length) weakAreas.push(...ev.weaknesses);
          if (ev.strengths?.length) strongAreas.push(...ev.strengths);
        }
      }
    } catch (_) {}

    let candidateContext = "";
    try {
      const profile = await Profile.findOne({ userId: session.userId });
      if (profile) {
        candidateContext = AIContextEngine.buildCandidateContext(profile, "short");
      }
    } catch (_) {}

    const order = previousQuestions.length + 1;
    const systemPrompt = PromptRegistry.get("INTERVIEW_FOLLOWUP_GENERATION", "v1");

    const prompt = `${systemPrompt}

Candidate Target Role: ${session.role}
Experience Level: ${session.experienceLevel}
Interview Type: ${session.interviewType}
Difficulty: ${session.difficulty}
Technologies: ${session.technologies?.join(", ") || "General"}

Previous Questions Asked in this Session:
${previousQuestions.map((q, i) => `${i + 1}. [${q.category}] ${q.questionText}`).join("\n")}

Candidate Performance Signals so far:
Weak Areas to potentially probe: ${weakAreas.slice(0, 3).join("; ") || "None flagged"}
Demonstrated Strengths: ${strongAreas.slice(0, 3).join("; ") || "General foundational"}

Instructions:
Generate question #${order}.
Ensure it tests a relevant topic, probes technical depth, and is distinct from all previously asked questions.
Return strictly valid JSON matching the schema.`;

    let questionData: FollowupQuestionResponse;

    try {
      questionData = await AIService.generateStructured<FollowupQuestionResponse>(
        [{ role: "user", content: prompt }],
        FollowupQuestionResponseSchema,
        { task: "INTERVIEW_FOLLOWUP_GENERATION", temperature: 0.3 }
      );

      // Verify not duplicate or missing
      if (!questionData?.questionText || askedTexts.has((questionData.questionText || "").toLowerCase().trim())) {
        questionData = this.getFallbackQuestion(session, askedTexts, order);
      }
    } catch (err) {
      console.warn("AI dynamic question generation failed, using fallback bank", err);
      questionData = this.getFallbackQuestion(session, askedTexts, order);
    }

    if (!questionData?.questionText) {
      questionData = this.getFallbackQuestion(session, askedTexts, order);
    }

    const newQuestion = await InterviewQuestion.create({
      sessionId: session._id,
      questionOrder: order,
      sequenceNumber: order,
      questionText: questionData.questionText,
      category: questionData.category || session.interviewType,
      topic: questionData.topic || "Technical",
      difficulty: session.difficulty,
      source: "dynamic_engine",
      status: "GENERATED",
      expectedConcepts: questionData.expectedConcepts || [],
      isFollowUp: weakAreas.length > 0 && order > 1,
    });

    await InterviewSession.updateOne(
      { _id: session._id },
      {
        questionCount: order,
        currentQuestionId: newQuestion._id,
        currentQuestionIndex: order - 1,
        $inc: { stateVersion: 1 },
      }
    );

    return newQuestion;
  }

  private static getFallbackQuestion(
    session: any,
    askedTexts: Set<string>,
    order: number
  ): FollowupQuestionResponse {
    const roleKey = (session.role || "software engineer").toLowerCase();
    const typeKey = (session.interviewType || "technical").toLowerCase();

    const candidates = [
      {
        questionText: `In the context of ${session.role}, how do you approach diagnosing performance bottlenecks under high concurrent traffic?`,
        category: "technical",
        topic: "Performance & Scaling",
      },
      {
        questionText: "Explain how you handle data consistency and transaction rollback when interacting with multiple microservices or distributed components.",
        category: "system design",
        topic: "Distributed Systems",
      },
      {
        questionText: "Walk me through an architectural trade-off you made in a recent project. What alternatives did you consider and why did you choose your approach?",
        category: "project",
        topic: "Architecture & Trade-offs",
      },
      {
        questionText: "How do you structure automated testing across unit, integration, and end-to-end tiers to balance velocity and reliability?",
        category: "technical",
        topic: "Testing & Reliability",
      },
      {
        questionText: "Describe a production incident or bug you encountered. How did you investigate, mitigate, and implement preventative measures?",
        category: "behavioral",
        topic: "Incident Management",
      },
      {
        questionText: `What are the core security considerations you enforce when designing APIs for ${session.role}?`,
        category: "security",
        topic: "API Security",
      },
      {
        questionText: "How do you decide between synchronous vs asynchronous processing (e.g. REST/gRPC vs message queues) for background tasks?",
        category: "system design",
        topic: "Async Architecture",
      },
    ];

    const pick = candidates.find(c => !askedTexts.has(c.questionText.toLowerCase().trim())) || {
      questionText: `Could you explain the architectural lifecycle of a request in your primary technology stack for ${session.role}?`,
      category: "technical",
      topic: "System Architecture",
    };

    return {
      questionText: pick.questionText,
      category: pick.category,
      topic: pick.topic,
      difficulty: session.difficulty || "medium",
      reason: "Curated domain progression",
      expectedConcepts: ["Decomposition", "Trade-offs", "Production experience"],
    };
  }
}
