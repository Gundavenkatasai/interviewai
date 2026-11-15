import { AIService } from "../../ai/ai.service";
import {
  InterviewSession,
  InterviewQuestion,
  CandidateAnswer,
  AnswerEvaluation,
  InterviewReport,
  IInterviewReport,
  IQuestionResult,
} from "./interview.model";
import { PromptRegistry } from "../../ai/prompts/prompt.registry";
import { FinalReportResponseSchema, FinalReportResponse } from "./interview.schemas";

export class ReportEngine {
  /**
   * Generates or retrieves an authoritative, idempotent InterviewReport.
   */
  static async generateReport(sessionId: string, userId: string, reportVersion: number = 1): Promise<IInterviewReport> {
    const idempotencyKey = `${sessionId}_v${reportVersion}`;

    // 1. Idempotency Check: if report already exists, return it immediately
    const existingReport = await InterviewReport.findOne({ idempotencyKey, userId });
    if (existingReport) {
      return existingReport;
    }

    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new Error(`Interview session ${sessionId} not found`);
    }

    // 2. Fetch all questions, answers, and evaluations for this session
    const questions = await InterviewQuestion.find({ sessionId }).sort({ questionOrder: 1 });
    const answers = await CandidateAnswer.find({ sessionId });
    const evaluations = await AnswerEvaluation.find({
      answerId: { $in: answers.map((a) => a._id) },
    });

    const evalMap = new Map(evaluations.map((e) => [e.answerId.toString(), e]));
    const answerMap = new Map(answers.map((a) => [a.questionId.toString(), a]));

    const questionResults: IQuestionResult[] = [];
    let totalScoreSum = 0;
    let scoredQuestionsCount = 0;
    let answeredQuestionsCount = 0;
    let skippedQuestionsCount = 0;

    const dimTotals = {
      technical: 0,
      communication: 0,
      problemSolving: 0,
      relevance: 0,
      completeness: 0,
      depth: 0,
      structure: 0,
      confidence: 0,
    };

    const coveredTopics: string[] = [];
    const weakTopics: string[] = [];
    const strongTopics: string[] = [];
    const collectedStrengths: string[] = [];
    const collectedWeaknesses: string[] = [];

    for (const q of questions) {
      const topic = q.topic || q.category || "General";
      if (!coveredTopics.includes(topic)) coveredTopics.push(topic);

      if (q.status === "SKIPPED") {
        skippedQuestionsCount++;
        questionResults.push({
          questionId: q._id,
          sequenceNumber: q.questionOrder,
          questionText: q.questionText,
          category: q.category,
          difficulty: q.difficulty || session.difficulty,
          status: "SKIPPED",
          candidateAnswer: "(Question skipped by candidate)",
          score: 0,
          whatWentWell: [],
          whatCouldImprove: ["Topic was skipped; recommend reviewing fundamentals"],
          evidence: ["Candidate chose to skip this question"],
          recommendedAnswer: "Review core principles for " + topic,
        });
        continue;
      }

      const ans = answerMap.get(q._id.toString());
      const ev = ans ? evalMap.get(ans._id.toString()) : null;

      if (ans && ans.status !== "SKIPPED") {
        answeredQuestionsCount++;
      }

      if (ev) {
        scoredQuestionsCount++;
        totalScoreSum += ev.score;

        dimTotals.technical += ev.dimensionScores?.technicalAccuracy ?? ev.score;
        dimTotals.communication += ev.dimensionScores?.communication ?? ev.score;
        dimTotals.problemSolving += ev.dimensionScores?.problemSolving ?? ev.score;
        dimTotals.relevance += ev.dimensionScores?.relevance ?? ev.score;
        dimTotals.completeness += ev.dimensionScores?.completeness ?? ev.score;
        dimTotals.depth += ev.dimensionScores?.depth ?? ev.score;
        dimTotals.structure += ev.dimensionScores?.structure ?? ev.score;
        dimTotals.confidence += ev.dimensionScores?.confidenceClarity ?? ev.score;

        if (ev.score >= 7.5 && !strongTopics.includes(topic)) strongTopics.push(topic);
        if (ev.score < 6.5 && !weakTopics.includes(topic)) weakTopics.push(topic);

        if (ev.strengths?.length) collectedStrengths.push(...ev.strengths);
        if (ev.weaknesses?.length) collectedWeaknesses.push(...ev.weaknesses);

        questionResults.push({
          questionId: q._id,
          sequenceNumber: q.questionOrder,
          questionText: q.questionText,
          category: q.category,
          difficulty: q.difficulty || session.difficulty,
          status: "EVALUATED",
          candidateAnswer: ans?.answerText || ans?.transcript || "",
          score: ev.score,
          whatWentWell: ev.strengths || [],
          whatCouldImprove: ev.weaknesses || [],
          evidence: ev.evidence || [],
          recommendedAnswer: ev.recommendedAnswer,
        });
      } else {
        // Answered but not yet evaluated, or unattempted
        questionResults.push({
          questionId: q._id,
          sequenceNumber: q.questionOrder,
          questionText: q.questionText,
          category: q.category,
          difficulty: q.difficulty || session.difficulty,
          status: q.status || "ASKED",
          candidateAnswer: ans?.answerText || "",
          score: 5.0,
          whatWentWell: [],
          whatCouldImprove: [],
          evidence: [],
        });
      }
    }

    const isUnattempted = answeredQuestionsCount === 0;

    let computedOverallScore = 0;
    let computedDimensions = {
      technical: 0,
      communication: 0,
      problemSolving: 0,
      relevance: 0,
      completeness: 0,
      depth: 0,
      structure: 0,
      confidence: 0,
    };

    let reportAiData: FinalReportResponse;

    if (isUnattempted) {
      reportAiData = {
        overallScore: 0,
        dimensionScores: computedDimensions,
        strengths: [],
        weaknesses: ["No questions were answered during this interview session."],
        technicalGaps: coveredTopics.length > 0 ? coveredTopics : ["All technical domains unattempted"],
        communicationFeedback: ["Insufficient evidence: no verbal or text responses were provided."],
        repeatedMistakes: [],
        topicCoverage: {
          coveredTopics: [],
          weakTopics: coveredTopics,
          strongTopics: [],
          remainingTopics: coveredTopics,
        },
        questionEvaluations: [],
        recommendedTopics: coveredTopics.length > 0 ? coveredTopics : ["Core role competencies"],
        recommendedQuestions: questions.map((q) => q.questionText).slice(0, 3),
        readinessAssessment: "Not Ready",
        nextBestActions: [
          "Retake the interview and submit verbal or text answers to receive an accurate performance evaluation.",
        ],
        confidence: "HIGH",
      };
    } else {
      const divisor = scoredQuestionsCount > 0 ? scoredQuestionsCount : 1;
      computedOverallScore = Number((totalScoreSum / divisor).toFixed(1));

      computedDimensions = {
        technical: Number((dimTotals.technical / divisor).toFixed(1)),
        communication: Number((dimTotals.communication / divisor).toFixed(1)),
        problemSolving: Number((dimTotals.problemSolving / divisor).toFixed(1)),
        relevance: Number((dimTotals.relevance / divisor).toFixed(1)),
        completeness: Number((dimTotals.completeness / divisor).toFixed(1)),
        depth: Number((dimTotals.depth / divisor).toFixed(1)),
        structure: Number((dimTotals.structure / divisor).toFixed(1)),
        confidence: Number((dimTotals.confidence / divisor).toFixed(1)),
      };

      // 3. AI synthesis for comprehensive diagnostic feedback
      const systemPrompt = PromptRegistry.get("INTERVIEW_FINAL_REPORT", "v1");
      const summaryEvidence = questionResults.map(
        (r, i) => `Q${i + 1} (${r.category} - ${r.difficulty}): "${r.questionText}"
Candidate Answer: "${(r.candidateAnswer || "").slice(0, 300)}"
Score: ${r.score}/10
Strengths: ${r.whatWentWell.join(", ") || "None noted"}
Improvements: ${r.whatCouldImprove.join(", ") || "None noted"}`
      ).join("\n\n");

      const prompt = `${systemPrompt}

Target Role: ${session.role}
Difficulty: ${session.difficulty}
Experience Level: ${session.experienceLevel}

Persisted Session Evidence:
${summaryEvidence}

Deterministic Metrics:
Overall Score: ${computedOverallScore}
Scored Questions: ${scoredQuestionsCount}
Answered Questions: ${answeredQuestionsCount}
Skipped Questions: ${skippedQuestionsCount}

Generate a comprehensive diagnostic report strictly matching the JSON schema.
Distinguish UNKNOWN vs MISSING. Do not fabricate feedback unsupported by actual answers.`;

      try {
        reportAiData = await AIService.generateStructured<FinalReportResponse>(
          [{ role: "user", content: prompt }],
          FinalReportResponseSchema,
          { task: "INTERVIEW_FINAL_REPORT", temperature: 0.2 }
        );
      } catch (err) {
        console.warn("AI report synthesis failed, using deterministic aggregation", err);
        reportAiData = this.buildDeterministicReport(
          session,
          computedOverallScore,
          computedDimensions,
          collectedStrengths,
          collectedWeaknesses,
          coveredTopics,
          weakTopics,
          strongTopics
        );
      }

      if (!reportAiData || !Array.isArray(reportAiData.strengths)) {
        reportAiData = this.buildDeterministicReport(
          session,
          computedOverallScore,
          computedDimensions,
          collectedStrengths,
          collectedWeaknesses,
          coveredTopics,
          weakTopics,
          strongTopics
        );
      }
    }

    // 4. Create and persist immutable InterviewReport
    const reportDoc = await InterviewReport.create({
      sessionId,
      userId,
      candidateSnapshotVersion: session.candidateProfileVersion || 1,
      resumeVersion: session.resumeVersion || 1,
      jobSnapshotVersion: session.jobSnapshotVersion || 1,
      totalQuestions: questions.length,
      answeredQuestions: answeredQuestionsCount,
      skippedQuestions: skippedQuestionsCount,
      overallScore: computedOverallScore,
      dimensionScores: {
        technical: computedDimensions.technical,
        communication: computedDimensions.communication,
        problemSolving: computedDimensions.problemSolving,
        relevance: computedDimensions.relevance,
        completeness: computedDimensions.completeness,
        depth: computedDimensions.depth,
        structure: computedDimensions.structure,
        confidence: computedDimensions.confidence,
      },
      strengths: reportAiData.strengths.length > 0 ? reportAiData.strengths : ["Clear conceptual delivery under interview conditions"],
      weaknesses: reportAiData.weaknesses,
      technicalGaps: reportAiData.technicalGaps,
      communicationFeedback: reportAiData.communicationFeedback,
      repeatedMistakes: reportAiData.repeatedMistakes,
      topicCoverage: {
        coveredTopics,
        weakTopics,
        strongTopics,
        remainingTopics: [],
      },
      questionResults,
      recommendedTopics: reportAiData.recommendedTopics,
      recommendedQuestions: reportAiData.recommendedQuestions,
      readinessAssessment: computedOverallScore >= 8.0 ? "Ready" : computedOverallScore >= 6.5 ? "Needs Practice" : "Not Ready",
      nextBestActions: reportAiData.nextBestActions,
      confidence: reportAiData.confidence || "HIGH",
      reportVersion,
      scoringVersion: "v1.0",
      rubricVersion: "rubric-v1.0",
      idempotencyKey,
    });

    // 5. Update session with final score and state
    await InterviewSession.updateOne(
      { _id: sessionId },
      {
        status: "completed",
        state: "COMPLETED",
        completedAt: new Date(),
        score: {
          overall_score: computedOverallScore,
          technical_score: computedDimensions.technical,
          communication_score: computedDimensions.communication,
          problem_solving_score: computedDimensions.problemSolving,
          confidence_score: computedDimensions.confidence,
          final_recommendation: reportDoc.readinessAssessment,
          strengths: reportDoc.strengths,
          areas_for_improvement: reportDoc.weaknesses,
          recommended_study_topics: reportDoc.recommendedTopics,
        },
        $inc: { stateVersion: 1 },
      }
    );

    return reportDoc;
  }

  private static buildDeterministicReport(
    session: any,
    overallScore: number,
    dimensions: any,
    collectedStrengths: string[],
    collectedWeaknesses: string[],
    coveredTopics: string[],
    weakTopics: string[],
    strongTopics: string[]
  ): FinalReportResponse {
    const isZero = overallScore === 0;

    return {
      overallScore,
      dimensionScores: dimensions,
      strengths: isZero
        ? []
        : collectedStrengths.length > 0
        ? Array.from(new Set(collectedStrengths)).slice(0, 5)
        : ["Provided responses to the interview prompts"],
      weaknesses: isZero
        ? ["No answers were submitted during this interview session."]
        : collectedWeaknesses.length > 0
        ? Array.from(new Set(collectedWeaknesses)).slice(0, 5)
        : ["Add more quantitative system metrics and edge-case handling in responses"],
      technicalGaps: weakTopics.length > 0 ? weakTopics : isZero ? ["Interview not attempted"] : ["Production edge-cases"],
      communicationFeedback: isZero
        ? ["Insufficient evidence: no verbal or text responses were provided."]
        : ["Completed response turn within session time limits"],
      repeatedMistakes: [],
      topicCoverage: {
        coveredTopics,
        weakTopics,
        strongTopics,
        remainingTopics: [],
      },
      questionEvaluations: [],
      recommendedTopics: weakTopics.length > 0 ? weakTopics : ["Distributed system resilience", "API design trade-offs"],
      recommendedQuestions: [
        `How would you architect a fault-tolerant caching layer for ${session.role}?`,
        "Describe your methodology for profiling and fixing database deadlocks in production.",
      ],
      readinessAssessment: overallScore >= 8.0 ? "Ready" : overallScore >= 6.5 ? "Needs Practice" : "Not Ready",
      nextBestActions: isZero
        ? ["Retake the mock interview and provide detailed technical answers."]
        : [
            "Review key architectural patterns for identified weak topics",
            "Practice timed responses with STAR structure for complex scenario questions",
          ],
      confidence: "HIGH",
    };
  }
}
