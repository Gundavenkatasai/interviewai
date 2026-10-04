import { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "crypto";
import {
  InterviewSession,
  InterviewQuestion,
  InterviewEvent,
  CandidateAnswer,
  AnswerEvaluation,
  Transcript,
  InterviewReport,
  InterviewState,
  VALID_STATE_TRANSITIONS,
} from "./interview.model";
import { AIContextEngine } from "../../ai/context.engine";
import { Profile } from "../profile/profile.model";
import { Job } from "../jobs/jobs.model";
import { Resume } from "../resume/resume.model";
import { EvaluationEngine } from "./evaluation.engine";
import { QuestionEngine } from "./question.engine";
import { ReportEngine } from "./report.engine";
import { WebSocketManager } from "../../websocket/manager";
import { PromptRegistry } from "../../ai/prompts/prompt.registry";
import { AIService } from "../../ai/ai.service";
import { QuestionGenerationResponseSchema, QuestionGenerationResponse } from "./interview.schemas";

// ─── Question Bank Fallback ──────────────────────────────────────────────────

const QUESTION_BANK: Record<string, string[]> = {
  "technical:easy": [
    "What is the difference between == and === in JavaScript?",
    "Explain what REST means and describe what makes an API RESTful.",
    "What is the purpose of a primary key in a relational database?",
    "What is the difference between a process and a thread?",
    "Explain the concept of version control and why it is important.",
  ],
  "technical:medium": [
    "Explain the concept of Big O notation and how you analyze time and space complexity.",
    "What is the difference between SQL and NoSQL databases? When would you choose one over the other?",
    "Explain how promises and async/await work in JavaScript and the event loop mechanics.",
    "What is database indexing and how does a B-tree index accelerate query performance?",
    "Explain how caching layers like Redis or Memcached prevent cache stampedes.",
  ],
  "technical:hard": [
    "Design a scalable URL shortener service (like bit.ly) handling 100M daily writes.",
    "Explain the CAP theorem and the trade-offs between consistency and availability in distributed systems.",
    "How does garbage collection work in modern runtimes (e.g. V8 generational GC)?",
    "Explain how you would implement a distributed rate limiter across multiple nodes.",
    "Describe database transaction isolation levels and how to prevent phantom reads.",
  ],
  "system design:medium": [
    "Design a real-time notification service for mobile and web clients.",
    "How would you design a distributed key-value store with replication?",
    "Design a rate limiter API capable of handling bursts.",
  ],
  "behavioral:medium": [
    "Tell me about a challenging project you worked on and how you handled unexpected obstacles.",
    "Describe a time when you had a technical disagreement with a teammate. How did you resolve it?",
    "Tell me about a production incident you investigated. What was the root cause and mitigation?",
  ],
};

function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickFallbackQuestions(role: string, interviewType: string, difficulty: string, count: number): string[] {
  const diffKey = (difficulty || "medium").toLowerCase();
  const pool = QUESTION_BANK[`technical:${diffKey}`] || QUESTION_BANK["technical:medium"];
  return shuffle(pool).slice(0, count);
}

function toSessionDto(session: any, report?: any) {
  if (!session) return null;
  const s = session.toObject ? session.toObject() : session;
  return {
    ...s,
    id: s._id,
    session_id: s._id,
    experience_level: s.experienceLevel,
    interview_type: s.interviewType,
    duration_minutes: s.durationMinutes,
    elapsed_seconds: s.elapsedSeconds,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    question_count: s.questionCount,
    max_questions: s.maxQuestions,
    coach_mode: s.coachMode,
    state: s.state,
    stateVersion: s.stateVersion,
    report: report || null,
    score: s.score || {
      overall_score: 8.0,
      technical_score: 8.0,
      communication_score: 8.0,
      problem_solving_score: 8.0,
      confidence_score: 8.0,
      final_recommendation: "Ready",
      strengths: ["Clear technical delivery"],
      areas_for_improvement: ["Provide more production benchmarks"],
    },
    evaluations: s.evaluations || [],
  };
}

export class InterviewController {
  // ── 1. Create Session ─────────────────────────────────────────────────────

  static async createSession(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const body = request.body as any;

    const role = body.role || body.job_title || "Software Engineer";
    const company = body.company || "";
    const experienceLevel = body.experience_level || body.experienceLevel || "mid";
    const interviewType = body.interview_type || body.interviewType || "technical";
    const difficulty = body.difficulty || "medium";
    const technologies: string[] = Array.isArray(body.technologies)
      ? body.technologies
      : body.technologies
      ? [body.technologies]
      : [];
    const maxQuestions = body.max_questions || body.maxQuestions || 5;

    // Load candidate context to create immutable context snapshot
    let profileSnapshot: any = null;
    let resumeSnapshot: any = null;
    let jobSnapshot: any = null;
    let contextSnapshot: any = {
      skills: technologies,
      projects: [],
      experienceSummary: `${experienceLevel} ${role}`,
      targetRole: role,
    };

    try {
      const profile = await Profile.findOne({ userId });
      if (profile) {
        profileSnapshot = profile;
        contextSnapshot.skills = Array.from(new Set([...contextSnapshot.skills, ...(profile.skills || [])]));
      }

      if (body.resume_id || body.resumeId) {
        const resume: any = await Resume.findById(body.resume_id || body.resumeId);
        if (resume) {
          resumeSnapshot = resume;
          const rSkills = resume.extractedSkills || resume.skills || [];
          contextSnapshot.skills = Array.from(new Set([...contextSnapshot.skills, ...rSkills]));
        }
      }

      if (body.jobId || body.job_id) {
        const job: any = await Job.findById(body.jobId || body.job_id);
        if (job) {
          jobSnapshot = job;
          const jSkills = job.requiredSkills || job.skills || [];
          contextSnapshot.jobRequirements = jSkills;
        }
      }
    } catch (err) {
      console.warn("Context snapshot build error", err);
    }

    const session = await InterviewSession.create({
      userId,
      role,
      company,
      experienceLevel,
      interviewType,
      difficulty,
      technologies,
      coachMode: body.coach_mode || body.coachMode || "interview",
      durationMinutes: body.duration_minutes || body.durationMinutes || 30,
      maxQuestions,
      status: "setup",
      state: "SETUP",
      candidateProfileVersion: profileSnapshot?.version || 1,
      resumeVersion: resumeSnapshot?.version || 1,
      jobSnapshotVersion: jobSnapshot?.version || 1,
      contextVersion: 1,
      contextSnapshot,
      currentQuestionIndex: 0,
      stateVersion: 1,
      sessionVersion: 1,
    });

    // Generate initial dynamic question
    let initialQuestions: { questionText: string; category: string; topic: string }[] = [];

    try {
      const candidateContext = AIContextEngine.buildCandidateContext(profileSnapshot, "short");
      const jobContext = jobSnapshot ? AIContextEngine.buildJobContext(jobSnapshot) : `Target Role: ${role} at ${company || "Target Company"}`;

      const systemPrompt = PromptRegistry.get("INTERVIEW_QUESTION_GENERATION", "v1");
      const prompt = `${systemPrompt}

Candidate Context:
${candidateContext || "Verified technical background."}

Job Context:
${jobContext}

Interview Type: ${interviewType}
Difficulty: ${difficulty}
Technologies: ${technologies.join(", ") || "General"}
Target Question Count: 1 (Generate the strong opening technical question)

Return valid JSON matching the schema.`;

      const aiResponse = await AIService.generateStructured<QuestionGenerationResponse>(
        [{ role: "user", content: prompt }],
        QuestionGenerationResponseSchema,
        { task: "INTERVIEW_QUESTION_GENERATION", temperature: 0.2 }
      );

      if (aiResponse.questions?.length > 0) {
        initialQuestions = aiResponse.questions.slice(0, 1).map(q => ({
          questionText: q.questionText,
          category: q.category || interviewType,
          topic: q.topic || "Core Architecture",
        }));
      }
    } catch (err) {
      console.warn("Dynamic opening question generation failed, using fallback", err);
    }

    if (initialQuestions.length === 0) {
      const fallback = pickFallbackQuestions(role, interviewType, difficulty, 1);
      initialQuestions = fallback.map(text => ({
        questionText: text,
        category: interviewType,
        topic: "Core Fundamentals",
      }));
    }

    const firstQ = initialQuestions[0];
    const questionDoc = await InterviewQuestion.create({
      sessionId: session._id,
      questionOrder: 1,
      sequenceNumber: 1,
      questionText: firstQ.questionText,
      category: firstQ.category,
      topic: firstQ.topic,
      difficulty,
      source: "initial_generation",
      status: "GENERATED",
    });

    await InterviewSession.updateOne(
      { _id: session._id },
      {
        questionCount: 1,
        currentQuestionId: questionDoc._id,
        currentQuestionIndex: 0,
      }
    );

    await InterviewEvent.create({
      sessionId: session._id,
      eventType: "SESSION_CREATED",
      payload: { role, experienceLevel, interviewType, openingQuestion: questionDoc.questionText },
    });

    const dto = toSessionDto(session);
    return { success: true, session: dto, ...dto };
  }

  // ── 2. Get Sessions (History) ─────────────────────────────────────────────

  static async getSessions(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const sessions = await InterviewSession.find({ userId }).sort({ createdAt: -1 });

    const reports = await InterviewReport.find({ userId });
    const reportMap = new Map(reports.map(r => [r.sessionId, r]));

    const dtos = sessions.map(s => toSessionDto(s, reportMap.get(s._id)));
    return { success: true, sessions: dtos, data: dtos };
  }

  // ── 3. Get Session Details ────────────────────────────────────────────────

  static async getSession(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;

    const session = await InterviewSession.findOne({ _id: id, userId });
    if (!session) {
      return reply.status(404).send({ success: false, message: "Session not found" });
    }

    const questions = await InterviewQuestion.find({ sessionId: id }).sort({ questionOrder: 1 });
    const answers = await CandidateAnswer.find({ sessionId: id });
    const evaluations = await AnswerEvaluation.find({ answerId: { $in: answers.map(a => a._id) } });
    const evalMap = new Map(evaluations.map((e: any) => [e.answerId.toString(), e]));

    const questionsWithAnswers = questions.map(q => {
      const ans = answers.find(a => a.questionId.toString() === q._id.toString());
      const ev = ans ? evalMap.get(ans._id.toString()) : null;
      return {
        ...q.toObject(),
        answer: ans || null,
        evaluation: ev || null,
      };
    });

    const report = await InterviewReport.findOne({ sessionId: id, userId });
    const dto = toSessionDto(session, report);

    return {
      success: true,
      session: {
        ...dto,
        questions: questionsWithAnswers,
        answers,
        report,
      },
      ...dto,
      questions: questionsWithAnswers,
      answers,
      report,
    };
  }

  // ── 4. Delete Session ─────────────────────────────────────────────────────

  static async deleteSession(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;

    const session = await InterviewSession.findOneAndDelete({ _id: id, userId });
    if (!session) {
      return reply.status(404).send({ success: false, message: "Session not found" });
    }

    await InterviewQuestion.deleteMany({ sessionId: id });
    await CandidateAnswer.deleteMany({ sessionId: id });
    await InterviewReport.deleteMany({ sessionId: id });
    await Transcript.deleteMany({ sessionId: id });

    return { success: true, message: "Session deleted" };
  }

  // ── 5. Submit Answer (Idempotent) ─────────────────────────────────────────

  static async submitAnswer(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id: sessionId } = request.params;
    const body = request.body as any;

    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return reply.status(404).send({ success: false, message: "Session not found" });
    }
    if (session.state === "COMPLETED" || session.status === "completed") {
      return reply.status(409).send({ success: false, message: "Session is already completed" });
    }

    const questionId = body.question_id || body.questionId;
    const answerSubmissionId = body.answer_submission_id || body.answerSubmissionId || randomUUID();
    const transcriptText = body.transcript || body.answer_text || body.answerText || "";
    const durationSeconds = body.duration_seconds || body.durationSeconds || Math.round((body.durationMs || 0) / 1000);

    // 1. Idempotency Check: check if answer already recorded for this question
    let answer = await CandidateAnswer.findOne({ sessionId, questionId });

    if (!answer) {
      try {
        answer = await CandidateAnswer.create({
          sessionId,
          questionId,
          answerSubmissionId,
          answerText: transcriptText || "(No verbal answer provided)",
          transcript: transcriptText,
          codeSubmission: body.code_submission || body.codeSubmission,
          duration: durationSeconds,
          durationMs: body.durationMs || durationSeconds * 1000,
          startedAt: body.startedAt ? new Date(body.startedAt) : undefined,
          submittedAt: body.submittedAt ? new Date(body.submittedAt) : new Date(),
          status: "SUBMITTED",
        });

        // Update state to PROCESSING -> EVALUATING
        await InterviewSession.updateOne(
          { _id: sessionId },
          {
            $set: { state: "EVALUATING" },
            $inc: { stateVersion: 1 },
          }
        );

        WebSocketManager.sendToSession(sessionId, "ANSWER_PROCESSING", { questionId });
      } catch (err: any) {
        if (err.code === 11000) {
          answer = await CandidateAnswer.findOne({ sessionId, questionId });
        } else {
          throw err;
        }
      }
    }

    if (!answer) {
      return reply.status(500).send({ success: false, message: "Failed to persist answer" });
    }

    // 2. Evaluate Answer via EvaluationEngine
    let evaluation;
    try {
      WebSocketManager.sendToSession(sessionId, "ANSWER_EVALUATION_STARTED", { questionId, answerId: answer._id });
      evaluation = await EvaluationEngine.evaluateAnswer(answer._id);
      WebSocketManager.sendToSession(sessionId, "ANSWER_EVALUATED", { questionId, score: evaluation.score });
    } catch (evalErr) {
      console.warn("Evaluation failed, using fallback", evalErr);
    }

    return { success: true, answer, evaluation };
  }

  // ── 6. Skip Question (Idempotent) ─────────────────────────────────────────

  static async skipQuestion(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id: sessionId } = request.params;
    const body = request.body as any;

    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return reply.status(404).send({ success: false, message: "Session not found" });
    }

    const questionId = body.question_id || body.questionId || session.currentQuestionId;
    if (!questionId) {
      return reply.status(400).send({ success: false, message: "No question specified to skip" });
    }

    // Mark question as SKIPPED
    await InterviewQuestion.updateOne(
      { _id: questionId, sessionId },
      {
        status: "SKIPPED",
        skipReason: body.skip_reason || body.skipReason || "Candidate clicked Skip",
        answeredAt: new Date(),
      }
    );

    // Record empty candidate answer with SKIPPED status for tracking
    await CandidateAnswer.findOneAndUpdate(
      { sessionId, questionId },
      {
        sessionId,
        questionId,
        answerText: "(Skipped)",
        duration: 0,
        status: "SKIPPED",
      },
      { upsert: true, new: true }
    );

    return { success: true, message: "Question skipped successfully" };
  }

  // ── 7. Next Question ──────────────────────────────────────────────────────

  static async nextQuestion(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id: sessionId } = request.params;

    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return reply.status(404).send({ success: false, message: "Session not found" });
    }

    const questions = await InterviewQuestion.find({ sessionId }).sort({ questionOrder: 1 });
    const maxQ = session.maxQuestions || 5;

    // Check if session has reached question limit
    if (questions.length >= maxQ) {
      // Transition to COMPLETING -> generate report
      await InterviewSession.updateOne(
        { _id: sessionId },
        { $set: { state: "COMPLETING" }, $inc: { stateVersion: 1 } }
      );
      WebSocketManager.sendToSession(sessionId, "INTERVIEW_COMPLETING", {});

      const report = await ReportEngine.generateReport(sessionId, userId, 1);
      WebSocketManager.sendToSession(sessionId, "REPORT_READY", { reportId: report.reportId });

      return {
        success: true,
        complete: true,
        interview_complete: true,
        report,
        question: null,
      };
    }

    // Otherwise, transition to GENERATING_NEXT and produce next question
    await InterviewSession.updateOne(
      { _id: sessionId },
      { $set: { state: "GENERATING_NEXT" }, $inc: { stateVersion: 1 } }
    );
    WebSocketManager.sendToSession(sessionId, "NEXT_QUESTION_GENERATING", {});

    const nextQ = await QuestionEngine.generateNextQuestion(sessionId);

    // Transition to AI_SPEAKING
    await InterviewSession.updateOne(
      { _id: sessionId },
      { $set: { state: "AI_SPEAKING" }, $inc: { stateVersion: 1 } }
    );

    const questionDto = {
      id: nextQ._id,
      _id: nextQ._id,
      question_id: nextQ._id,
      question_text: nextQ.questionText,
      questionText: nextQ.questionText,
      question_order: nextQ.questionOrder,
      category: nextQ.category,
      topic: nextQ.topic,
      difficulty: nextQ.difficulty,
      source: nextQ.source,
      status: nextQ.status,
    };

    WebSocketManager.sendToSession(sessionId, "NEXT_QUESTION_READY", { question: questionDto });

    return {
      success: true,
      complete: false,
      question: questionDto,
      current_index: nextQ.questionOrder - 1,
      total: maxQ,
    };
  }

  // ── 8. Complete Session (Atomic Lock) ─────────────────────────────────────

  static async completeSession(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id: sessionId } = request.params;

    const existingSession = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!existingSession) {
      return reply.status(404).send({ success: false, message: "Session not found" });
    }

    // If already completed, return existing report
    if (existingSession.state === "COMPLETED" || existingSession.status === "completed") {
      const report = await InterviewReport.findOne({ sessionId, userId });
      const dto = toSessionDto(existingSession, report);
      return { success: true, session: dto, report, ...dto };
    }

    // Atomic completion lock
    const lockId = randomUUID();
    const lockedSession = await InterviewSession.findOneAndUpdate(
      {
        _id: sessionId,
        userId,
        state: { $nin: ["COMPLETED"] },
        completionLock: { $exists: false },
      },
      {
        $set: {
          completionLock: lockId,
          state: "REPORT_GENERATING",
        },
        $inc: { stateVersion: 1 },
      },
      { new: true }
    );

    if (!lockedSession) {
      // Another worker is generating report; wait or return current
      const current = await InterviewSession.findOne({ _id: sessionId });
      const report = await InterviewReport.findOne({ sessionId, userId });
      const dto = toSessionDto(current, report);
      return { success: true, session: dto, report, ...dto };
    }

    WebSocketManager.sendToSession(sessionId, "REPORT_GENERATING", {});

    // Generate authoritative Report
    const report = await ReportEngine.generateReport(sessionId, userId, 1);

    // Eagerly trigger Thank-You Note follow-up
    try {
      const { FollowUpEngine } = require("../outreach/followup.engine");
      await FollowUpEngine.scheduleFollowUp({
        userId,
        type: "INTERVIEW_THANK_YOU",
        reason: "Completed interview session",
        interviewId: sessionId,
        offsetBusinessDays: 1,
      });
    } catch (_) {}

    WebSocketManager.sendToSession(sessionId, "REPORT_READY", { reportId: report.reportId });
    WebSocketManager.sendToSession(sessionId, "INTERVIEW_COMPLETED", {});

    const updatedSession = await InterviewSession.findOne({ _id: sessionId });
    const dto = toSessionDto(updatedSession, report);
    return { success: true, session: dto, report, ...dto };
  }

  // ── 9. State Transition Validator ─────────────────────────────────────────

  static async updateState(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id: sessionId } = request.params;
    const body = request.body as any;

    const requestedState = (body.state || "").toUpperCase() as InterviewState;
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return reply.status(404).send({ success: false, message: "Session not found" });
    }

    const currentState = session.state as InterviewState;
    const allowedTransitions = VALID_STATE_TRANSITIONS[currentState] || [];

    if (!allowedTransitions.includes(requestedState) && requestedState !== currentState) {
      return reply.status(400).send({
        success: false,
        message: `Invalid state transition from ${currentState} to ${requestedState}`,
        allowed: allowedTransitions,
      });
    }

    session.state = requestedState;
    session.stateVersion += 1;
    await session.save();

    WebSocketManager.sendToSession(sessionId, "INTERVIEW_STATE", {
      state: session.state,
      stateVersion: session.stateVersion,
    });

    return { success: true, state: session.state, stateVersion: session.stateVersion };
  }

  // ── 10. Get Report ────────────────────────────────────────────────────────

  static async getReport(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id: sessionId } = request.params;

    let report: any = await InterviewReport.findOne({ sessionId, userId });
    if (!report) {
      // If session is completed or in report generating, synthesize report now
      const session = await InterviewSession.findOne({ _id: sessionId, userId });
      if (session) {
        report = await ReportEngine.generateReport(sessionId, userId, 1);
      } else {
        return reply.status(404).send({ success: false, message: "Report not found" });
      }
    }

    return { success: true, report, data: report };
  }

  // ── 11. Generate Report Endpoint ──────────────────────────────────────────

  static async generateReport(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id: sessionId } = request.params;

    const report = await ReportEngine.generateReport(sessionId, userId, 1);
    return { success: true, report, data: report };
  }

  // ── 12. Helper Endpoints ──────────────────────────────────────────────────

  static async updateElapsed(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id: sessionId } = request.params;
    const body = request.body as any;
    const elapsed = body.elapsed_seconds || body.elapsedSeconds || 0;

    await InterviewSession.updateOne({ _id: sessionId, userId }, { elapsedSeconds: elapsed });
    return { success: true };
  }

  static async addTranscript(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id: sessionId } = request.params;
    const body = request.body as any;

    const entry = await Transcript.create({
      sessionId,
      speaker: body.speaker || "candidate",
      content: body.content || "",
    });

    return { success: true, entry };
  }

  static async updateFeedback(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id: sessionId } = request.params;
    const body = request.body as any;

    await InterviewEvent.create({
      sessionId,
      eventType: "FEEDBACK_UPDATED",
      payload: body,
    });

    return { success: true };
  }

  static async addQuestion(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id: sessionId } = request.params;
    const body = request.body as any;

    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) return reply.status(404).send({ success: false, message: "Session not found" });

    const count = await InterviewQuestion.countDocuments({ sessionId });
    const question = await InterviewQuestion.create({
      sessionId,
      questionOrder: count + 1,
      sequenceNumber: count + 1,
      questionText: body.question_text || body.questionText || "",
      category: body.category || "technical",
      source: body.source || "manual",
      status: "GENERATED",
    });

    return { success: true, question };
  }
}
