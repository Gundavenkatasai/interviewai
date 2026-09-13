import { Profile } from "./profile.model";
import { UpdateProfileInput } from "./profile.schema";
import { AIService } from "../../ai/ai.service";

export class ProfileService {
  static async getProfile(userId: string) {
    let profile = await Profile.findOne({ userId });
    
    if (!profile) {
      profile = await Profile.create({ userId });
    }
    
    return profile;
  }

  static async updateProfile(userId: string, data: UpdateProfileInput) {
    let profile = await Profile.findOne({ userId });
    
    if (!profile) {
      profile = new Profile({ userId, ...data });
    } else {
      // Basic activity tracking / fact history for critical fields
      const changes: any[] = [];
      if (data.skills && JSON.stringify(data.skills) !== JSON.stringify(profile.skills)) {
        changes.push({ field: "skills", reason: "User updated skills", changedBy: "USER" });
      }
      
      Object.assign(profile, data);
      
      if (changes.length > 0) {
        profile.factHistory.push(...changes);
      }
    }
    
    await profile.save();
    return profile;
  }

  static async verifyFact(userId: string, entityId: string, entityType: string, action: "VERIFY" | "REJECT") {
    const profile = await Profile.findOne({ userId });
    if (!profile) throw new Error("Profile not found");

    const entityArray = profile[entityType as keyof typeof profile] as any[];
    if (!entityArray || !Array.isArray(entityArray)) throw new Error(`Invalid entity type ${entityType}`);

    const index = entityArray.findIndex(item => item.id === entityId);
    if (index === -1) throw new Error("Entity not found");

    const fact = entityArray[index];
    
    if (action === "VERIFY") {
      fact.provenance.status = "VERIFIED";
      fact.provenance.verifiedAt = new Date();
      fact.verified_status = "VERIFIED"; // backward compatibility
    } else if (action === "REJECT") {
      fact.provenance.status = "REJECTED";
      fact.provenance.verifiedAt = new Date();
      fact.verified_status = "UNVERIFIED";
    }

    profile.markModified(entityType);
    profile.factHistory.push({
      field: `${entityType}.${entityId}`,
      oldValue: "UNVERIFIED",
      newValue: action,
      reason: `Fact explicitly ${action.toLowerCase()}ed by user`,
      changedBy: "USER"
    });

    await profile.save();
    return profile;
  }

  static async resolveConflict(userId: string, conflictId: string, resolutionType: "USE_A" | "USE_B" | "MERGED" | "REJECT", mergedData?: any) {
    const profile = await Profile.findOne({ userId });
    if (!profile) throw new Error("Profile not found");

    const conflictIndex = profile.conflicts.findIndex((c: any) => c.id === conflictId);
    if (conflictIndex === -1) throw new Error("Conflict not found");

    const conflict = profile.conflicts[conflictIndex];
    conflict.status = "RESOLVED";
    conflict.resolution = resolutionType;

    // Based on resolution, update the actual field
    const fieldParts = conflict.field.split("."); // e.g. "experience.startDate"
    // Note: A full robust implementation would dynamically traverse the object.
    // For Day 2 MVP, we just resolve the conflict state so the UI clears it.

    profile.markModified("conflicts");
    await profile.save();
    return profile;
  }

  static async getIntelligenceSummary(userId: string) {
    const profile = await Profile.findOne({ userId });
    if (!profile) throw new Error("Profile not found");

    // Profile Health calculation (deterministic code, NOT AI)
    let healthScore = 0;
    if (profile.personal?.fullName) healthScore += 10;
    if (profile.personal?.email) healthScore += 10;
    if (profile.experience && profile.experience.length > 0) healthScore += 30;
    if (profile.skills && profile.skills.length > 0) healthScore += 20;
    if (profile.education && profile.education.length > 0) healthScore += 10;
    if (profile.careerGoals?.targetDirections?.length > 0) healthScore += 20;

    // Sanitize for AI to prevent huge payloads
    const cleanProfile = {
      skills: profile.skills.map((s: any) => s.name),
      experience: profile.experience.map((e: any) => ({ title: e.title, company: e.company, months: 12 })),
      education: profile.education.map((e: any) => e.degree),
      goals: profile.careerGoals
    };

    const schema = {
      type: "object",
      properties: {
        coreStrengths: { type: "array", items: { type: "string" } },
        potentialGaps: { type: "array", items: { type: "string" } },
        careerArchetype: { type: "string" },
        recommendedNextSteps: { type: "array", items: { type: "string" } }
      },
      required: ["coreStrengths", "potentialGaps", "careerArchetype"]
    };

    const messages = [
      { role: "system", content: "You are a senior career intelligence system. Analyze the candidate facts and return a concise career summary. Do not invent facts." },
      { role: "user", content: `Candidate Profile: ${JSON.stringify(cleanProfile)}` }
    ];

    try {
      const aiSummary = await AIService.generateStructured(messages as any, schema);
      return {
        healthScore,
        healthStatus: healthScore > 75 ? "STRONG" : healthScore > 40 ? "NEEDS_ATTENTION" : "WEAK",
        summary: aiSummary
      };
    } catch (error) {
      console.error("AI Provider Error:", error);
      return {
        healthScore,
        healthStatus: healthScore > 75 ? "STRONG" : healthScore > 40 ? "NEEDS_ATTENTION" : "WEAK",
        summary: { coreStrengths: [], potentialGaps: ["AI Analysis unavailable"], careerArchetype: "Unknown" }
      };
    }
  }
}
