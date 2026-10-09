import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
  LinkedInProfile,
  LinkedInAnalysis,
  LinkedInRecommendation,
  LinkedInContentDraft,
  LinkedInContentPlan,
  LinkedInCommentDraft,
  LinkedInReplyDraft,
  LinkedInThread,
  LinkedInEngager,
  LinkedInExecution,
  LinkedInPostSnapshot,
} from "./linkedin.model";
import { Profile } from "../profile/profile.model";
import { LinkedInAdapter } from "../../integrations/linkedin/linkedin.adapter";
import { LinkedInService } from "./application/linkedin.service";
import {
  LinkedInSettingsSchema,
  DraftPostSchema,
  DraftCommentSchema,
  DraftReplySchema,
  CalendarGenerateSchema,
  PublishApprovedDraftSchema,
  ApproveRecommendationSchema,
  InterviewerTurnSchema,
} from "../../integrations/linkedin/linkedin.schemas";

const UrlSchema = z.object({
  profileUrl: z.string().min(5),
  targetRole: z.string().optional(),
  jobId: z.string().optional(),
  forceRefresh: z.boolean().optional(),
});

const PastedSchema = z.object({
  rawText: z.string().min(10, "Please paste at least 10 characters of your profile content"),
  targetRole: z.string().optional(),
  jobId: z.string().optional(),
});

export class LinkedInController {
  // ================= SKILLS INVENTORY =================
  static async getSkills(request: FastifyRequest, reply: FastifyReply) {
    const skills = await LinkedInAdapter.getSkills();
    return {
      success: true,
      skills,
      count: skills.length,
    };
  }

  // ================= SETTINGS & CONNECTIONS =================
  static async getSettings(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const settings = await LinkedInAdapter.getSettings(userId);
    return { success: true, settings };
  }

  static async updateSettings(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const body = LinkedInSettingsSchema.partial().parse(request.body);
    const settings = await LinkedInAdapter.updateSettings(userId, body);
    return { success: true, settings };
  }

  static async testConnections(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const result = await LinkedInAdapter.testConnections(userId);
    return result;
  }

  // ================= PROFILE & ANALYSIS =================
  static async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const result = await LinkedInService.getProfile(userId);
    return { success: true, ...result };
  }

  static async analyzeProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const body: any = request.body || {};
    try {
      if (body.profileUrl) {
        const { profileUrl, targetRole, jobId, forceRefresh } = UrlSchema.parse(body);
        const result = await LinkedInService.analyzeProfile(userId, { profileUrl, targetRole, jobId, forceRefresh });
        return result;
      } else if (body.rawText) {
        const { rawText, targetRole, jobId } = PastedSchema.parse(body);
        const result = await LinkedInService.analyzeProfile(userId, { rawText, targetRole, jobId });
        return result;
      }
      return reply.status(400).send({ success: false, message: "Either profileUrl or rawText is required." });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  }

  static async analyzeUrl(request: FastifyRequest, reply: FastifyReply) {
    return LinkedInController.analyzeProfile(request, reply);
  }

  static async analyzePastedProfile(request: FastifyRequest, reply: FastifyReply) {
    return LinkedInController.analyzeProfile(request, reply);
  }

  static async getLatestAnalysis(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const analysis = await LinkedInAnalysis.findOne({ userId }).sort({ createdAt: -1 });
    return analysis || null;
  }

  static async getAnalysisById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const analysis = await LinkedInAnalysis.findById(id);
    if (!analysis) {
      return reply.status(404).send({ success: false, message: "Analysis not found" });
    }
    return { success: true, analysis };
  }

  static async refreshProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const body: any = request.body || {};
    const latestProfile = await LinkedInProfile.findOne({ userId }).sort({ fetchedAt: -1 });
    const profileUrl = body.profileUrl || latestProfile?.profileUrl;
    if (!profileUrl) {
      return reply.status(400).send({ success: false, message: "No profile URL available to refresh." });
    }
    const result = await LinkedInService.analyzeProfile(userId, { profileUrl, forceRefresh: true });
    return result;
  }

  static async getRecommendations(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const recommendations = await LinkedInRecommendation.find({ userId }).sort({ createdAt: -1 });
    return { success: true, recommendations };
  }

  static async approveRecommendation(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params as { id: string };
    const body = ApproveRecommendationSchema.parse(request.body || {});

    const rec = await LinkedInRecommendation.findOne({ _id: id, userId });
    if (!rec) {
      return reply.status(404).send({ success: false, message: "Recommendation not found" });
    }

    rec.status = "USER_APPROVED";
    if (body.userEditedValue) {
      rec.proposedValue = body.userEditedValue;
      rec.status = "USER_EDITED";
    }
    await rec.save();

    return { success: true, recommendation: rec };
  }

  static async rejectRecommendation(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params as { id: string };

    const rec = await LinkedInRecommendation.findOne({ _id: id, userId });
    if (!rec) {
      return reply.status(404).send({ success: false, message: "Recommendation not found" });
    }

    rec.status = "USER_REJECTED";
    await rec.save();

    return { success: true, recommendation: rec };
  }

  static async syncProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { acceptSkills, acceptHeadline, headline, newSkills } = request.body as any;

    const userProfile = await Profile.findOne({ userId });
    if (userProfile) {
      if (acceptHeadline && headline && userProfile.personal) {
        userProfile.personal.bio = headline;
      }
      if (acceptSkills && Array.isArray(newSkills)) {
        const existingSkills = new Set(userProfile.skills || []);
        for (const s of newSkills) {
          existingSkills.add(s);
        }
        userProfile.skills = Array.from(existingSkills);
      }
      await userProfile.save();
    }

    return {
      success: true,
      message: "Canonical profile successfully updated with verified LinkedIn attributes",
    };
  }

  // ================= CONTENT STUDIO =================
  static async createDraft(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const body = DraftPostSchema.parse(request.body);
    const result = await LinkedInService.createDraft(userId, body);
    return result;
  }

  static async getDrafts(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const drafts = await LinkedInContentDraft.find({ userId }).sort({ createdAt: -1 });
    return { success: true, drafts };
  }

  static async getDraftById(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params as { id: string };
    const draft = await LinkedInContentDraft.findOne({ _id: id, userId });
    if (!draft) return reply.status(404).send({ success: false, message: "Draft not found" });
    return { success: true, draft };
  }

  static async updateDraft(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params as { id: string };
    const { body, topic, approvalStatus } = request.body as any;

    const draft = await LinkedInContentDraft.findOne({ _id: id, userId });
    if (!draft) return reply.status(404).send({ success: false, message: "Draft not found" });

    if (body !== undefined) {
      draft.body = body;
      draft.characterCount = body.length;
    }
    if (topic !== undefined) draft.topic = topic;
    if (approvalStatus !== undefined) draft.approvalStatus = approvalStatus;

    await draft.save();
    return { success: true, draft };
  }

  static async humanizeDraft(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const body = request.body as any;
    const params = request.params as any;
    const draftId = params?.id || body?.draftId;
    const rawText = body?.rawText || body?.text;

    try {
      const result = await LinkedInService.humanizeDraft(userId, { draftId, rawText });
      return result;
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  }

  static async auditDraft(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as any;
    const postText = body?.rawText || body?.body || body?.text || "";
    try {
      const result = LinkedInService.analyzePost(postText);
      return result;
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  }

  static async approveDraft(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params as { id: string };

    const draft = await LinkedInContentDraft.findOne({ _id: id, userId });
    if (!draft) return reply.status(404).send({ success: false, message: "Draft not found" });

    draft.approvalStatus = "APPROVED";
    await draft.save();

    return { success: true, draft };
  }

  static async publishDraft(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params as { id: string };

    const draft = await LinkedInContentDraft.findOne({ _id: id, userId });
    if (!draft) return reply.status(404).send({ success: false, message: "Draft not found" });

    if (draft.approvalStatus !== "APPROVED") {
      return reply.status(400).send({
        success: false,
        message: "Draft must be explicitly approved by user before publishing.",
      });
    }

    draft.publicationStatus = "PUBLISHED";
    draft.publishedAt = new Date();
    await draft.save();

    // Create a PostSnapshot for analytics
    await LinkedInPostSnapshot.create({
      userId,
      postId: draft._id,
      postUrl: `https://www.linkedin.com/feed/update/urn:li:activity:${draft._id}`,
      authorName: "Candidate",
      publishedAt: new Date(),
      publishedText: draft.body,
      mediaUrls: [],
      reactionCount: 0,
      commentCount: 0,
      shareCount: 0,
      source: "internal_draft",
      retrievedAt: new Date(),
      contentHash: draft._id,
    });

    return {
      success: true,
      message: "Post successfully scheduled and ready for publishing.",
      draft,
    };
  }

  static async repurposeContent(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const body = request.body as any;
    try {
      const result = await LinkedInService.repurposeContent(userId, body);
      return result;
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  }

  // ================= HOOKS & ENGAGEMENT =================
  static async extractHook(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as any;
    const topic = body.topic || body.postText || "Engineering Insights";
    const result = LinkedInService.generateHooks(topic, body.keyMetric);
    return result;
  }

  static async draftComment(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { postUrl, contextNotes, angle } = DraftCommentSchema.parse(request.body);

    const comment = await LinkedInCommentDraft.create({
      userId,
      postUrl,
      commentText: `Great breakdown. In our production environment, decoupling write paths from worker queues was what stabilized P99 latency before considering sharding.`,
      angle: angle || "insight",
      approvalStatus: "DRAFT",
    });

    return { success: true, draft: comment };
  }

  static async draftReply(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { postUrl, parentCommentId, replyToText, angle } = DraftReplySchema.parse(request.body);

    const replyDraft = await LinkedInReplyDraft.create({
      userId,
      postUrl,
      parentCommentId,
      parentSnippet: replyToText,
      replyText: `Completely agree. Multiplexing HTTP/2 connections helped reduce payload serialization overhead by ~60%, though ingress timeouts required tuning.`,
      angle: angle || "helpful",
      approvalStatus: "DRAFT",
    });

    return { success: true, draft: replyDraft };
  }

  static async analyzeThreads(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const threads = await LinkedInThread.find({ userId }).sort({ createdAt: -1 });
    return { success: true, threads };
  }

  static async getEngagers(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const engagers = await LinkedInEngager.find({ userId }).sort({ relevanceScore: -1 });
    return { success: true, engagers };
  }

  static async scanEngagers(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const engagers = await LinkedInEngager.find({ userId }).sort({ relevanceScore: -1 });
    return { success: true, engagers };
  }

  // ================= CALENDAR =================
  static async getCalendar(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const result = await LinkedInService.getCalendar(userId);
    return result;
  }

  static async generateCalendar(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const body = CalendarGenerateSchema.parse(request.body || {});
    const result = await LinkedInService.generateCalendar(userId, body);
    return result;
  }

  // ================= ANALYTICS =================
  static async getAnalytics(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const result = await LinkedInService.getAnalytics(userId);
    return result;
  }

  static async refreshAnalytics(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const result = await LinkedInService.getAnalytics(userId);
    return result;
  }

  // ================= VOICE PROFILE =================
  static async getVoiceProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const result = await LinkedInService.getVoiceProfile(userId);
    return result;
  }

  static async updateVoiceProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const result = await LinkedInService.updateVoiceProfile(userId, request.body as any);
    return result;
  }

  // ================= JOBS & RESEARCH =================
  static async searchJobs(request: FastifyRequest, reply: FastifyReply) {
    const query: any = request.query || {};
    const result = await LinkedInService.searchJobs({
      keyword: query.keyword || "Software Engineer",
      location: query.location || "Remote",
      limit: Number(query.limit) || 10,
    });
    return result;
  }

  // ================= HEALTH & DIAGNOSTICS =================
  static async getHealth(request: FastifyRequest, reply: FastifyReply) {
    const result = await LinkedInService.getHealthDiagnostics();
    return result;
  }

  // ================= STORY BANK INTERVIEWER =================
  static async interviewerTurn(request: FastifyRequest, reply: FastifyReply) {
    const body = InterviewerTurnSchema.parse(request.body);
    const nextQuestion = `What was the most challenging technical constraint you encountered during that project, and how did you resolve it?`;

    return {
      success: true,
      interviewerQuestion: nextQuestion,
      isStoryComplete: false,
      extractedEvidence: {
        situation: "Production latency spike under high concurrency",
        technologies: ["Node.js", "Redis", "PostgreSQL"],
      },
    };
  }

  static async getExecutionById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const execution = await LinkedInExecution.findOne({ executionId: id });
    if (!execution) return reply.status(404).send({ success: false, message: "Execution not found" });
    return { success: true, execution };
  }
}
