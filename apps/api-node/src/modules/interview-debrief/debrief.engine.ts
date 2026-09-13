import { InterviewDebrief, IInterviewDebrief, InterviewWeakness, WeaknessState } from "./debrief.model";
import { InterviewSession, InterviewQuestion, CandidateAnswer, Transcript } from "../interview/interview.model";
import { AIService } from "../../ai/ai.service";
import { INTERVIEW_DEBRIEF_PROMPT, InterviewDebriefResultSchema } from "../../ai/prompts/debrief.prompts";

export class DebriefEngine {

  /**
   * Generates an entire interview debrief.
   */
  static async generateDebrief(userId: string, interviewId: string): Promise<IInterviewDebrief> {
    const session = await InterviewSession.findOne({ _id: interviewId, userId });
    if (!session) throw new Error("Interview session not found or access denied");

    // Fetch questions and answers
    const questions = await InterviewQuestion.find({ sessionId: interviewId }).sort({ questionOrder: 1 });
    const answers = await CandidateAnswer.find({ sessionId: interviewId });
    const transcripts = await Transcript.find({ sessionId: interviewId }).sort({ timestamp: 1 });

    // Format data for AI
    const qnaData = questions.map(q => {
      const answer = answers.find(a => a.questionId.toString() === q._id.toString());
      return `Q${q.questionOrder} (${q.category}): ${q.questionText}\nCandidate Answer: ${answer?.answerText || "No answer provided"}`;
    }).join("\n\n");

    const promptText = INTERVIEW_DEBRIEF_PROMPT
      .replace("{{targetRole}}", session.role)
      .replace("{{interviewType}}", session.interviewType)
      .replace("{{qnaData}}", qnaData);

    const aiResult = await AIService.generateStructured<any>(
      [{ role: "user", content: promptText }],
      InterviewDebriefResultSchema,
      {
        task: "INTERVIEW_DEBRIEF",
        temperature: 0.2
      }
    );

    // Create the Debrief record
    const debrief = new InterviewDebrief({
      userId,
      interviewId,
      jobSnapshotId: session.jobDescriptionId,
      resumeVersionId: session.resumeId,
      
      overallScore: aiResult.overallScore,
      whatWentWell: aiResult.whatWentWell,
      whatToImprove: aiResult.whatToImprove,
      
      questionReviews: aiResult.questionReviews.map((qr: any) => ({
        questionId: qr.questionId,
        category: questions.find(q => q._id.toString() === qr.questionId)?.category || "UNKNOWN",
        score: qr.review.score,
        strengths: qr.review.strengths,
        weaknesses: qr.review.weaknesses,
        missingElements: qr.review.missingElements,
        suggestedImprovement: qr.review.suggestedImprovement
      })),

      nextPracticeItems: aiResult.nextPracticeItems,
      confidence: "HIGH" // Simplified for now
    });

    await debrief.save();

    // Process weaknesses deterministically
    await this.processWeaknesses(userId, interviewId, debrief);

    return debrief;
  }

  /**
   * Deterministic state machine for interview weaknesses
   */
  static async processWeaknesses(userId: string, interviewId: string, debrief: IInterviewDebrief) {
    const weaknessMap = new Map<string, { topic: string, category: string, count: number, contexts: string[] }>();

    // Identify weaknesses from question reviews (score < 6)
    for (const qr of debrief.questionReviews) {
      if (qr.score < 6) {
        // We use the category as a proxy for the weakness topic for now
        const topic = qr.category;
        
        if (!weaknessMap.has(topic)) {
          weaknessMap.set(topic, { topic, category: "PERFORMANCE", count: 0, contexts: [] });
        }
        const entry = weaknessMap.get(topic)!;
        entry.count += 1;
        entry.contexts.push(`[${interviewId}] Q: ${qr.suggestedImprovement}`);
      }
    }

    // Identify weaknesses from global 'whatToImprove'
    for (const imp of debrief.whatToImprove) {
      // Simplified mapping
      const topic = imp.slice(0, 50); 
      weaknessMap.set(topic, { topic, category: "GLOBAL", count: 1, contexts: [`[${interviewId}] ${imp}`] });
    }

    // Process each detected weakness through the state machine
    for (const [topic, data] of weaknessMap.entries()) {
      let weakness = await InterviewWeakness.findOne({ userId, topic });

      if (!weakness) {
        // NEW weakness
        weakness = new InterviewWeakness({
          userId,
          category: data.category,
          topic: data.topic,
          severity: "MEDIUM",
          status: "NEW",
          occurrences: 1,
          evidenceContexts: data.contexts
        });
      } else {
        // State transition
        weakness.occurrences += 1;
        weakness.lastDetectedAt = new Date();
        weakness.evidenceContexts.push(...data.contexts);

        if (weakness.status === "NEW") {
          weakness.status = "RECURRING";
        } else if (weakness.status === "IMPROVING" || weakness.status === "RESOLVED") {
          weakness.status = "RECURRING"; // Re-triggered
          weakness.improvementCount = 0;
        }
      }

      await weakness.save();
    }

    // Reward weaknesses not triggered
    const activeWeaknesses = await InterviewWeakness.find({ userId, status: { $in: ["NEW", "RECURRING", "IMPROVING", "RETEST"] } });
    for (const aw of activeWeaknesses) {
      if (!weaknessMap.has(aw.topic)) {
        // It improved!
        aw.improvementCount += 1;
        if (aw.improvementCount === 1) {
          aw.status = "IMPROVING";
        } else if (aw.improvementCount >= 2) {
          aw.status = "RESOLVED";
        }
        await aw.save();
      }
    }
  }
}
