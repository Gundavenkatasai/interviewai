import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { LinkedInProfile, LinkedInAnalysis, LinkedInAnalysisVersion } from "./linkedin.model";
import { AgentReachLinkedInProvider, PastedProfileProvider, LinkedInSecurityValidator } from "./linkedin.provider";
import { LinkedInScorer } from "./linkedin.scorer";
import { Profile } from "../profile/profile.model";

const UrlSchema = z.object({
  profileUrl: z.string().url(),
  targetRole: z.string().optional()
});

const PastedSchema = z.object({
  rawText: z.string().min(20, "Please paste at least 20 characters of your profile content"),
  targetRole: z.string().optional()
});

export class LinkedInController {
  /**
   * Analyze public LinkedIn URL using Agent Reach
   */
  static async analyzeUrl(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { profileUrl, targetRole } = UrlSchema.parse(request.body);

    const validation = LinkedInSecurityValidator.validateUrl(profileUrl);
    if (!validation.isValid || !validation.normalizedUrl) {
      return reply.status(400).send({
        success: false,
        message: validation.error || "Invalid LinkedIn profile URL"
      });
    }

    const normalizedUrl = validation.normalizedUrl;

    // Check for cached public profile within 24h
    const existingProfile = await LinkedInProfile.findOne({
      userId,
      profileUrl: normalizedUrl,
      fetchedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    let publicData = existingProfile?.publicData;
    let rawText = existingProfile?.rawScrapedText || "";
    let sourceStatus = existingProfile?.sourceStatus || "SUCCESS";
    let dataConfidence = existingProfile?.dataConfidence || "high";
    let profileDoc = existingProfile;

    if (!existingProfile) {
      // Execute public scraping via Agent Reach provider
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
        source: scrapeResult.source
      });
    }

    // Run deterministic scoring & market comparison against MongoDB jobs
    const analysisData = await LinkedInScorer.scoreAndAnalyze(
      publicData!,
      userId,
      targetRole || "Software Engineer"
    );

    const analysis = await LinkedInAnalysis.create({
      userId,
      profileId: profileDoc!._id,
      ...analysisData
    });

    // Save version history
    await LinkedInAnalysisVersion.create({
      profileId: profileDoc!._id,
      userId,
      snapshot: analysis.toObject(),
      score: analysis.score
    });

    return {
      success: true,
      analysisId: analysis._id,
      status: "completed",
      score: analysis.score,
      profile: publicData,
      report: analysis,
      data: analysis
    };
  }

  /**
   * Analyze pasted profile content (fallback for non-public profiles)
   */
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
      source: "pasted"
    });

    const analysisData = await LinkedInScorer.scoreAndAnalyze(
      scrapeResult.publicData,
      userId,
      targetRole || "Software Engineer"
    );

    const analysis = await LinkedInAnalysis.create({
      userId,
      profileId: profileDoc._id,
      ...analysisData
    });

    return {
      success: true,
      analysisId: analysis._id,
      score: analysis.score,
      profile: scrapeResult.publicData,
      report: analysis,
      data: analysis
    };
  }

  /**
   * Get latest LinkedIn analysis for user
   */
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
      profile: profile?.publicData
    };
  }

  /**
   * Get analysis by ID
   */
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
      profile: profile?.publicData
    };
  }

  /**
   * Sync verified LinkedIn skills/data to user's canonical Profile upon explicit confirmation
   */
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
          profile.skills.push({ id: new Date().getTime().toString(), name: skill, category: "Technical", provenance: { sourceType: "LINKEDIN", status: "IMPORTED" }, verified_status: "VERIFIED", source: "LINKEDIN_IMPORT" });
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
      profile
    };
  }
}
