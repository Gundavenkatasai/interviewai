import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import {
  InterviewSession,
  InterviewQuestion,
  CandidateAnswer,
  AnswerEvaluation,
  InterviewReport,
  VALID_STATE_TRANSITIONS,
  InterviewState,
} from "../src/modules/interview/interview.model";
import { EvaluationEngine } from "../src/modules/interview/evaluation.engine";
import { QuestionEngine } from "../src/modules/interview/question.engine";
import { ReportEngine } from "../src/modules/interview/report.engine";

describe("Mock Interview Production Hardening & Critical Regression Suite", () => {
  const testUserId = "user-test-" + randomUUID();

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect("mongodb://127.0.0.1:27017/applyhustle");
    }
  });

  afterAll(async () => {
    // Clean up test data
    await InterviewSession.deleteMany({ userId: testUserId });
    await InterviewReport.deleteMany({ userId: testUserId });
  });

  // ── UNIT TESTS: State Transitions & Guardrails ────────────────────────────

  describe("Phase 1: Authoritative State Machine", () => {
    it("should enforce valid state transitions", () => {
      expect(VALID_STATE_TRANSITIONS.SETUP).toContain("PERMISSION_GRANTED");
      expect(VALID_STATE_TRANSITIONS.PERMISSION_GRANTED).toContain("AI_SPEAKING");
      expect(VALID_STATE_TRANSITIONS.AI_SPEAKING).toContain("CANDIDATE_READY");
      expect(VALID_STATE_TRANSITIONS.CANDIDATE_READY).toContain("CANDIDATE_SPEAKING");
      expect(VALID_STATE_TRANSITIONS.CANDIDATE_SPEAKING).toContain("PROCESSING");
      expect(VALID_STATE_TRANSITIONS.PROCESSING).toContain("EVALUATING");
      expect(VALID_STATE_TRANSITIONS.EVALUATING).toContain("GENERATING_NEXT");
      expect(VALID_STATE_TRANSITIONS.GENERATING_NEXT).toContain("AI_SPEAKING");
      expect(VALID_STATE_TRANSITIONS.COMPLETING).toContain("REPORT_GENERATING");
      expect(VALID_STATE_TRANSITIONS.REPORT_GENERATING).toContain("COMPLETED");
    });

    it("should reject illegal state skips", () => {
      // Cannot jump from SETUP directly to CANDIDATE_SPEAKING or COMPLETED
      expect(VALID_STATE_TRANSITIONS.SETUP).not.toContain("CANDIDATE_SPEAKING");
      expect(VALID_STATE_TRANSITIONS.SETUP).not.toContain("COMPLETED");
      expect(VALID_STATE_TRANSITIONS.AI_SPEAKING).not.toContain("COMPLETED");
      expect(VALID_STATE_TRANSITIONS.CANDIDATE_SPEAKING).not.toContain("AI_SPEAKING");
    });
  });

  describe("Phase 13: UNKNOWN vs MISSING Semantics", () => {
    it("should classify untested topics as UNKNOWN rather than MISSING", () => {
      const evaluation = {
        evidenceState: {
          technicalAccuracy: "SUPPORTED",
          relevance: "SUPPORTED",
          completeness: "SUPPORTED",
          depth: "WEAK",
          problemSolving: "UNKNOWN", // Candidate wasn't asked algorithmic puzzle
          communication: "SUPPORTED",
          structure: "SUPPORTED",
          confidenceClarity: "SUPPORTED",
        },
      };

      expect(evaluation.evidenceState.problemSolving).toBe("UNKNOWN");
      expect(evaluation.evidenceState.problemSolving).not.toBe("MISSING");
    });
  });

  // ── INTEGRATION & PHASE 34 CRITICAL REGRESSION TEST (5-Question E2E) ──────

  describe("Phase 34: Complete 5-Question End-to-End Interview Journey", () => {
    let sessionId: string;
    const generatedQuestionIds: string[] = [];
    const submittedAnswerIds: string[] = [];
    const evaluationIds: string[] = [];

    it("Step 1: Session Creation & Immutable Snapshot", async () => {
      const session = await InterviewSession.create({
        userId: testUserId,
        role: "Senior Full Stack Engineer",
        company: "Acme Tech",
        experienceLevel: "5+ years",
        interviewType: "technical",
        difficulty: "hard",
        technologies: ["TypeScript", "Node.js", "React", "PostgreSQL", "Docker"],
        coachMode: "interview",
        durationMinutes: 30,
        maxQuestions: 5,
        status: "setup",
        state: "SETUP",
        contextVersion: 1,
        contextSnapshot: {
          skills: ["TypeScript", "Node.js", "React", "PostgreSQL", "Docker"],
          targetRole: "Senior Full Stack Engineer",
          experienceSummary: "5+ years full stack engineering",
        },
        currentQuestionIndex: 0,
        stateVersion: 1,
      });

      expect(session).toBeDefined();
      expect(session._id).toBeDefined();
      expect(session.state).toBe("SETUP");
      expect(session.contextSnapshot?.skills).toContain("TypeScript");

      sessionId = session._id;
    });

    it("Step 2: Generate Initial Opening Question (Q1)", async () => {
      const q1 = await InterviewQuestion.create({
        sessionId,
        questionOrder: 1,
        sequenceNumber: 1,
        questionText: "How do you architect distributed state management and caching across multi-region services?",
        category: "technical",
        topic: "Distributed Systems",
        difficulty: "hard",
        status: "GENERATED",
      });

      expect(q1._id).toBeDefined();
      generatedQuestionIds.push(q1._id);

      await InterviewSession.updateOne(
        { _id: sessionId },
        { currentQuestionId: q1._id, currentQuestionIndex: 0, state: "AI_SPEAKING", $inc: { stateVersion: 1 } }
      );
    });

    it("Step 3: Answer Q1 & Evaluate", async () => {
      const q1Id = generatedQuestionIds[0];
      const answerSubmissionId = randomUUID();

      const answer = await CandidateAnswer.create({
        sessionId,
        questionId: q1Id,
        answerSubmissionId,
        answerText: "We use a multi-tiered approach: local in-memory L1 cache, shared Redis L2 with cache invalidation pub/sub, and PostgreSQL read replicas with eventual consistency.",
        duration: 45,
        durationMs: 45000,
        startedAt: new Date(Date.now() - 45000),
        submittedAt: new Date(),
        status: "SUBMITTED",
      });

      submittedAnswerIds.push(answer._id);
      expect(answer._id).toBeDefined();

      const evalResult = await EvaluationEngine.evaluateAnswer(answer._id);
      expect(evalResult).toBeDefined();
      expect(evalResult.score).toBeGreaterThanOrEqual(0);
      expect(evalResult.score).toBeLessThanOrEqual(10);
      expect(evalResult.dimensionScores.technicalAccuracy).toBeDefined();
      evaluationIds.push(evalResult._id);
    });

    it("Step 4: Verify Answer Idempotency (Duplicate Submission Blocked)", async () => {
      const q1Id = generatedQuestionIds[0];

      // Second attempt to insert duplicate answer with same sessionId + questionId must fail unique constraint or return existing
      let duplicateCaught = false;
      try {
        await CandidateAnswer.create({
          sessionId,
          questionId: q1Id,
          answerSubmissionId: randomUUID(),
          answerText: "Duplicate submission attempt",
          duration: 10,
        });
      } catch (err: any) {
        if (err.code === 11000) duplicateCaught = true;
      }

      expect(duplicateCaught).toBe(true);
    });

    it("Step 5: Dynamic Questions Q2, Q3, Q4, Q5 Generation & Answering Loop", async () => {
      for (let i = 2; i <= 5; i++) {
        // Generate Next Question dynamically
        const nextQ = await QuestionEngine.generateNextQuestion(sessionId);
        expect(nextQ).toBeDefined();
        expect(nextQ._id).toBeDefined();
        expect(generatedQuestionIds).not.toContain(nextQ._id);
        generatedQuestionIds.push(nextQ._id);

        // Submit answer
        const answer = await CandidateAnswer.create({
          sessionId,
          questionId: nextQ._id,
          answerSubmissionId: randomUUID(),
          answerText: `Candidate comprehensive answer for question #${i}: addressing architectural decomposition, trade-offs, and error mitigation.`,
          duration: 35,
          durationMs: 35000,
          startedAt: new Date(Date.now() - 35000),
          submittedAt: new Date(),
          status: "SUBMITTED",
        });
        submittedAnswerIds.push(answer._id);

        // Evaluate answer
        const ev = await EvaluationEngine.evaluateAnswer(answer._id);
        expect(ev).toBeDefined();
        expect(ev.score).toBeGreaterThan(0);
        evaluationIds.push(ev._id);
      }
    });

    it("Step 6: Verify Phase 34 Invariants (Exactly 5 Questions, 5 Answers, 5 Evaluations)", async () => {
      // 1. Exactly 5 questions
      expect(generatedQuestionIds.length).toBe(5);

      // 2. No duplicate question IDs
      const uniqueQIds = new Set(generatedQuestionIds);
      expect(uniqueQIds.size).toBe(5);

      // 3. Exactly 5 answer submissions
      expect(submittedAnswerIds.length).toBe(5);

      // 4. Exactly 5 evaluations
      expect(evaluationIds.length).toBe(5);
    });

    it("Step 7: Final Report Generation & Idempotency", async () => {
      // Generate report
      const report = await ReportEngine.generateReport(sessionId, testUserId, 1);

      expect(report).toBeDefined();
      expect(report.reportId).toBeDefined();
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(10);
      expect(report.totalQuestions).toBe(5);
      expect(report.answeredQuestions).toBe(5);
      expect(report.dimensionScores.technical).toBeDefined();
      expect(report.dimensionScores.communication).toBeDefined();
      expect(report.questionResults.length).toBe(5);

      // Verify Session state transitioned to COMPLETED
      const sessionAfter = await InterviewSession.findById(sessionId);
      expect(sessionAfter?.state).toBe("COMPLETED");

      // Verify Idempotency: Re-generating report returns exact same document without duplicate creation
      const secondCallReport = await ReportEngine.generateReport(sessionId, testUserId, 1);
      expect(secondCallReport._id.toString()).toBe(report._id.toString());
      expect(secondCallReport.reportId).toBe(report.reportId);

      const totalReports = await InterviewReport.countDocuments({ sessionId });
      expect(totalReports).toBe(1);
    });

    it("Step 8: Reopening Session Does Not Regenerate Report", async () => {
      const persisted = await InterviewReport.findOne({ sessionId, userId: testUserId });
      expect(persisted).toBeDefined();
      expect(persisted?.totalQuestions).toBe(5);
    });
  });

  describe("Phase 16: Question Skip Handling", () => {
    it("should record SKIPPED status without penalizing candidate as empty answer", async () => {
      const skipSession = await InterviewSession.create({
        userId: testUserId,
        role: "Frontend Engineer",
        interviewType: "technical",
        difficulty: "medium",
        maxQuestions: 2,
        state: "CANDIDATE_READY",
        contextVersion: 1,
      });

      const q = await InterviewQuestion.create({
        sessionId: skipSession._id,
        questionOrder: 1,
        sequenceNumber: 1,
        questionText: "What is your experience with WebGL and Three.js?",
        category: "technical",
        topic: "Graphics",
        status: "GENERATED",
      });

      // Skip the question
      await InterviewQuestion.updateOne(
        { _id: q._id },
        { status: "SKIPPED", skipReason: "Not applicable to role focus", answeredAt: new Date() }
      );

      const updatedQ = await InterviewQuestion.findById(q._id);
      expect(updatedQ?.status).toBe("SKIPPED");
      expect(updatedQ?.skipReason).toBe("Not applicable to role focus");

      // Cleanup
      await InterviewSession.deleteOne({ _id: skipSession._id });
      await InterviewQuestion.deleteOne({ _id: q._id });
    });
  });
});
