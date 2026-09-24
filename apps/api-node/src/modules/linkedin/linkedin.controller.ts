import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
  LinkedInProfile,
  LinkedInAnalysis,
  LinkedInAnalysisVersion,
  LinkedInRecommendation,
  LinkedInContentDraft,
  LinkedInContentPlan,
  LinkedInPublication,
  LinkedInCommentDraft,
  LinkedInReplyDraft,
  LinkedInThread,
  LinkedInEngager,
  LinkedInExecution,
} from "./linkedin.model";
import { AgentReachLinkedInProvider, PastedProfileProvider, LinkedInSecurityValidator } from "./linkedin.provider";
import { LinkedInScorer } from "./linkedin.scorer";
import { Profile } from "../profile/profile.model";
import { LinkedInAdapter } from "../../integrations/linkedin/linkedin.adapter";
import {
  LinkedInSettingsSchema,
  DraftPostSchema,
  HumanizeDraftSchema,
  AuditDraftSchema,
  RepurposeContentSchema,
  HookExtractorSchema,
  DraftCommentSchema,
  DraftReplySchema,
  CalendarGenerateSchema,
  PublishApprovedDraftSchema,
  ApproveRecommendationSchema,
  InterviewerTurnSchema,
} from "../../integrations/linkedin/linkedin.schemas";

const UrlSchema = z.object({
  profileUrl: z.string().url(),
  targetRole: z.string().optional(),
});

const PastedSchema = z.object({
  rawText: z.string().min(20, "Please paste at least 20 characters of your profile content"),
  targetRole: z.string().optional(),
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
  static async analyzeProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const body: any = request.body || {};
    if (body.profileUrl) {
      return LinkedInController.analyzeUrl(request, reply);
    } else if (body.rawText) {
      return LinkedInController.analyzePastedProfile(request, reply);
    }
    return reply.status(400).send({ success: false, message: "Either profileUrl or rawText is required" });
  }

  static async analyzeUrl(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { profileUrl, targetRole } = UrlSchema.parse(request.body);

    const validation = LinkedInSecurityValidator.validateUrl(profileUrl);
    if (!validation.isValid || !validation.normalizedUrl) {
      return reply.status(400).send({
        success: false,
        message: validation.error || "Invalid LinkedIn profile URL",
      });
    }

    const normalizedUrl = validation.normalizedUrl;

    const existingProfile = await LinkedInProfile.findOne({
      userId,
      profileUrl: normalizedUrl,
      fetchedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    let publicData = existingProfile?.publicData;
    let rawText = existingProfile?.rawScrapedText || "";
    let sourceStatus = existingProfile?.sourceStatus || "SUCCESS";
    let dataConfidence = existingProfile?.dataConfidence || "high";
    let profileDoc = existingProfile;

    if (!existingProfile) {
      const provider = new AgentReachLinkedInProvider();
      const scrapeResult = await provider.fetchPublicProfile(normalizedUrl);

      publicData = scrapeResult.publicData;
      rawText = scrapeResult.rawText;
      sourceStatus = scrapeResult.status;
      dataConfidence = scrapeResult.dataConfidence;

      profileDoc = await LinkedInProfile.create({
        userId,
        profileUrl: normalizedUrl,
        publicData,
        rawScrapedText: rawText,
        sourceStatus,
        dataConfidence,
        source: scrapeResult.source,
      });
    }

    const analysisData = await LinkedInScorer.scoreAndAnalyze(
      publicData!,
      userId,
      targetRole || "Software Engineer"
    );

    const analysis = await LinkedInAnalysis.create({
      userId,
      profileId: profileDoc!._id,
      ...analysisData,
    });

    await LinkedInAnalysisVersion.create({
      profileId: profileDoc!._id,
      userId,
      snapshot: analysis.toObject(),
      score: analysis.score,
    });

    // Populate recommendations from section analyses
    if (analysisData.headlineAnalysis?.suggestedVersions?.[0]) {
      await LinkedInRecommendation.create({
        userId,
        analysisId: analysis._id,
        field: "headline",
        currentValue: publicData?.headline || "",
        proposedValue: analysisData.headlineAnalysis.suggestedVersions[0],
        reason: "Strengthen keyword visibility and direct career impact",
        confidence: 0.95,
      });
    }

    if (analysisData.skillsAnalysis?.missingSkills?.length) {
      for (const missingSkill of analysisData.skillsAnalysis.missingSkills.slice(0, 3)) {
        await LinkedInRecommendation.create({
          userId,
          analysisId: analysis._id,
          field: "skills",
          currentValue: "",
          proposedValue: missingSkill,
          reason: `High market demand in ${targetRole || "Software Engineer"} postings`,
          confidence: 0.9,
        });
      }
    }

    return {
      success: true,
      analysisId: analysis._id,
      status: "completed",
      score: analysis.score,
      profile: publicData,
      report: analysis,
      data: analysis,
    };
  }

  static async analyzePastedProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { rawText, targetRole } = PastedSchema.parse(request.body);

    const scrapeResult = PastedProfileProvider.parsePastedText(rawText);

    const profileDoc = await LinkedInProfile.create({
      userId,
      profileUrl: "https://www.linkedin.com/in/pasted-profile/",
      publicData: scrapeResult.publicData,
      rawScrapedText: rawText,
      sourceStatus: "SUCCESS",
      dataConfidence: "high",
      source: "pasted",
    });

    const analysisData = await LinkedInScorer.scoreAndAnalyze(
      scrapeResult.publicData,
      userId,
      targetRole || "Software Engineer"
    );

    const analysis = await LinkedInAnalysis.create({
      userId,
      profileId: profileDoc._id,
      ...analysisData,
    });

    return {
      success: true,
      analysisId: analysis._id,
      score: analysis.score,
      profile: scrapeResult.publicData,
      report: analysis,
      data: analysis,
    };
  }

  static async getLatestAnalysis(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const analysis = await LinkedInAnalysis.findOne({ userId }).sort({ createdAt: -1 });

    if (!analysis) {
      return { success: true, analysis: null, report: null };
    }

    const profile = await LinkedInProfile.findOne({ _id: analysis.profileId, userId });
    return {
      success: true,
      analysis,
      report: analysis,
      profile: profile?.publicData,
    };
  }

  static async getAnalysisById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;

    const analysis = await LinkedInAnalysis.findOne({ _id: id, userId });
    if (!analysis) {
      return reply.status(404).send({ success: false, message: "Analysis not found" });
    }

    const profile = await LinkedInProfile.findOne({ _id: analysis.profileId, userId });
    return {
      success: true,
      analysis,
      report: analysis,
      profile: profile?.publicData,
    };
  }

  // ================= RECOMMENDATIONS =================
  static async getRecommendations(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const recommendations = await LinkedInAdapter.getRecommendations(userId);
    return { success: true, recommendations };
  }

  static async approveRecommendation(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;
    const body = ApproveRecommendationSchema.partial().parse(request.body || {});
    const result = await LinkedInAdapter.approveRecommendation(userId, id, "APPROVE", body.userEditedValue);
    return result;
  }

  static async rejectRecommendation(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;
    const result = await LinkedInAdapter.approveRecommendation(userId, id, "REJECT");
    return result;
  }

  // ================= CONTENT STUDIO =================
  static async createDraft(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const body = DraftPostSchema.parse(request.body);
    const draft = await LinkedInAdapter.createPostDraft(userId, body);
    return { success: true, draft };
  }

  static async getDrafts(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const drafts = await LinkedInContentDraft.find({ userId }).sort({ createdAt: -1 });
    return { success: true, drafts };
  }

  static async getDraftById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;
    const draft = await LinkedInContentDraft.findOne({ _id: id, userId });
    if (!draft) return reply.status(404).send({ success: false, message: "Draft not found" });
    return { success: true, draft };
  }

  static async updateDraft(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;
    const { body, topic } = (request.body as any) || {};

    const draft = await LinkedInContentDraft.findOne({ _id: id, userId });
    if (!draft) return reply.status(404).send({ success: false, message: "Draft not found" });

    if (body !== undefined) {
      draft.body = body;
      draft.characterCount = body.length;
      draft.approvalStatus = "USER_EDITED";
    }
    if (topic !== undefined) draft.topic = topic;
    draft.updatedAt = new Date();
    await draft.save();

    return { success: true, draft };
  }

  static async humanizeDraft(request: FastifyRequest<{ Params: { id?: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const id = request.params?.id;
    const body = HumanizeDraftSchema.parse(request.body || { rawText: "" });
    const result = await LinkedInAdapter.humanizeDraft(userId, id || body.draftId, body.rawText);
    return { success: true, ...result };
  }

  static async auditDraft(request: FastifyRequest<{ Params: { id?: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const id = request.params?.id;
    const body = AuditDraftSchema.parse(request.body || { rawText: "" });
    const result = await LinkedInAdapter.auditDraft(userId, id || body.draftId, body.rawText);
    return { success: true, ...result };
  }

  static async approveDraft(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;
    const result = await LinkedInAdapter.approveDraft(userId, id);
    return result;
  }

  static async publishDraft(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;
    const body = PublishApprovedDraftSchema.partial().parse(request.body || {});
    const result = await LinkedInAdapter.publishDraft(userId, id, {
      scheduledTime: body.scheduledTime,
      platformId: body.platformId,
    });
    return result;
  }

  static async repurposeContent(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const body = RepurposeContentSchema.parse(request.body);
    const draft = await LinkedInAdapter.repurposeContent(userId, body);
    return { success: true, draft };
  }

  // ================= HOOK EXTRACTOR =================
  static async extractHook(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const body = HookExtractorSchema.parse(request.body);
    const result = await LinkedInAdapter.extractHook(userId, body);
    return { success: true, data: result };
  }

  // ================= COMMENTS & REPLIES =================
  static async draftComment(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const body = DraftCommentSchema.parse(request.body);
    const draft = await LinkedInAdapter.draftComment(userId, body);
    return { success: true, draft };
  }

  static async draftReply(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const body = DraftReplySchema.parse(request.body);
    const draft = await LinkedInAdapter.draftReply(userId, body);
    return { success: true, draft };
  }

  static async analyzeThreads(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const threads = await LinkedInThread.find({ userId }).sort({ createdAt: -1 });
    return { success: true, threads };
  }

  // ================= AUDIENCE & ENGAGERS =================
  static async getEngagers(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const engagers = await LinkedInEngager.find({ userId }).sort({ relevanceScore: -1 });
    return { success: true, engagers };
  }

  static async scanEngagers(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { postUrl } = z.object({ postUrl: z.string().url() }).parse(request.body);
    const result = await LinkedInAdapter.scanPostEngagers(userId, postUrl);
    return result;
  }

  // ================= CALENDAR =================
  static async getCalendar(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const plan = await LinkedInContentPlan.findOne({ userId }).sort({ createdAt: -1 });
    return { success: true, plan };
  }

  static async generateCalendar(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const body = CalendarGenerateSchema.parse(request.body || {});
    const plan = await LinkedInAdapter.generateContentPlan(userId, body);
    return { success: true, plan };
  }

  // ================= INTERVIEWER =================
  static async interviewerTurn(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const body = InterviewerTurnSchema.parse(request.body || {});
    const result = await LinkedInAdapter.interviewTurn(userId, body);
    return { success: true, ...result };
  }

  // ================= EXECUTIONS =================
  static async getExecutionById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;
    const execution = await LinkedInExecution.findOne({ executionId: id, userId });
    if (!execution) return reply.status(404).send({ success: false, message: "Execution not found" });
    return { success: true, execution };
  }

  // ================= LEGACY SYNC =================
  static async syncProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { acceptSkills, acceptHeadline, headline, newSkills } = (request.body as any) || {};

    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return reply.status(404).send({ success: false, message: "User profile not found" });
    }

    let modified = false;

    if (acceptSkills && Array.isArray(newSkills) && newSkills.length > 0) {
      const existingSkillNames = new Set(
        (profile.skills || []).map((s: any) => (typeof s === "string" ? s : s.name).toLowerCase())
      );

      for (const skill of newSkills) {
        if (!existingSkillNames.has(skill.toLowerCase())) {
          profile.skills.push({
            id: new Date().getTime().toString(),
            name: skill,
            category: "Technical",
            provenance: { sourceType: "LINKEDIN", status: "IMPORTED", confidence: 1.0 },
            verified_status: "VERIFIED",
            source: "LINKEDIN_IMPORT",
          });
          modified = true;
        }
      }
    }

    if (acceptHeadline && headline) {
      if (!profile.personal) profile.personal = {};
      profile.personal.bio = headline;
      modified = true;
    }

    if (modified) {
      profile.updatedAt = new Date();
      await profile.save();
    }

    return {
      success: true,
      message: "Profile synchronized successfully",
      profile,
    };
  }
}
