import { IResume, IResumeProfileData } from "../resume.model";
import { IJob } from "../../jobs/jobs.model";
import { MatchEngine } from "../../jobs/match.engine";
import { ITailoringPlan, ResumeTailoringRun } from "./tailoring.model";
import { AIService } from "../../../ai/ai.service";
import { z } from "zod";
import { randomUUID } from "crypto";

const TailoringProposalSchema = z.object({
  summary: z.object({
    proposedText: z.string(),
    reason: z.string(),
    evidenceIds: z.array(z.string())
  }).optional(),
  experience: z.array(z.object({
    experienceId: z.string(),
    bullets: z.array(z.object({
      originalBulletIndex: z.number(),
      proposedText: z.string(),
      reason: z.string(),
      evidenceIds: z.array(z.string()),
      matchedRequirements: z.array(z.string())
    }))
  })).optional(),
  skills: z.object({
    reorder: z.array(z.string())
  }).optional()
});

export class TailoringService {
  /**
   * Generates a deterministic tailoring plan based on verified evidence
   */
  public static async generatePlan(resume: IResume, job: IJob): Promise<ITailoringPlan> {
    const profile = this.resumeToProfileAdapter(resume.profileData);
    
    // 1. Get Match Results (Reusing Day 5 Match Engine)
    const matchResult = MatchEngine.calculateMatch(profile, job);
    
    // 2. Extract Requirements
    const requirements: ITailoringPlan["requirements"] = (job.skills || []).map((s: string, i: number) => ({
      requirementId: `req-${i}`,
      category: "Skill",
      text: s,
      importance: "IMPORTANT"
    }));

    // Add role requirement
    requirements.push({
      requirementId: "req-role",
      category: "Role",
      text: job.title,
      importance: "MANDATORY" as const
    });

    // 3. Evidence Mapping
    const evidenceMap: ITailoringPlan["evidenceMap"] = {};
    const allowedRewrites: string[] = ["summary", "experience_bullets"];
    const forbiddenClaims: string[] = [];

    // Map matched skills
    for (const skill of matchResult.matchedSkills) {
      evidenceMap[skill] = {
        status: "VERIFIED",
        evidenceIds: ["skills-section"],
        reason: "Matched from candidate verified skills"
      };
    }

    // Map missing skills (Forbidden to add)
    for (const skill of matchResult.missingSkills) {
      evidenceMap[skill] = {
        status: "MISSING",
        evidenceIds: [],
        reason: "No verified evidence found in candidate profile"
      };
      forbiddenClaims.push(`Add skill: ${skill}`);
    }

    // Map unknown skills
    for (const signal of matchResult.unknownSignals) {
      evidenceMap[signal] = {
        status: "UNKNOWN",
        evidenceIds: [],
        reason: "Could not deterministically verify"
      };
      forbiddenClaims.push(`Claim certainty about: ${signal}`);
    }
    
    forbiddenClaims.push("Invent new metrics, numbers, or percentages");
    forbiddenClaims.push("Invent new companies or job titles");

    return {
      requirements,
      evidenceMap,
      allowedRewrites,
      forbiddenClaims
    };
  }

  /**
   * Proposes AI rewrites safely constrained by the tailoring plan
   */
  public static async proposeChanges(runId: string, userId: string): Promise<any> {
    const run = await ResumeTailoringRun.findOne({ _id: runId, userId });
    if (!run) throw new Error("Tailoring run not found or access denied");

    const prompt = `You are a Resume Tailoring Engine.
    
    JOB REQUIREMENTS:
    ${JSON.stringify(run.plan.requirements, null, 2)}
    
    EVIDENCE MAP (Factual Source of Truth):
    ${JSON.stringify(run.plan.evidenceMap, null, 2)}
    
    ALLOWED REWRITES:
    ${run.plan.allowedRewrites.join(", ")}
    
    FORBIDDEN CLAIMS (NEVER DO THESE):
    ${run.plan.forbiddenClaims.join("\\n")}
    
    RULES:
    1. NEVER invent metrics.
    2. NEVER add skills from the MISSING list.
    3. ONLY rewrite summary and experience bullets.
    
    Provide your output in JSON matching the requested schema.`;

    // Make structured call
    // Note: We're stubbing the actual AI call payload structure to fit AIService constraints
    const response = await AIService.generateStructured(
      [{ role: "system", content: prompt }, { role: "user", content: "Propose tailoring changes" }],
      {}, 
      "qwen" // Or fallback depending on provider routing
    );

    // Validate using Zod (simulated here)
    const parsed = TailoringProposalSchema.parse(response);

    return parsed;
  }

  /**
   * Deterministic No-Drift Validation Gate
   */
  public static validateDrift(originalResume: IResume, aiProposal: any): { passed: boolean; issues: string[]; details: any } {
    const issues: string[] = [];
    
    // E.g. Check for new numbers in proposed bullets that aren't in original bullets
    if (aiProposal.experience) {
      for (const exp of aiProposal.experience) {
        const originalExp = originalResume.profileData.experience.find(e => e.id === exp.experienceId);
        if (!originalExp) continue;

        for (const bullet of exp.bullets) {
          const originalBullet = originalExp.bullets[bullet.originalBulletIndex];
          if (!originalBullet) continue;

          // Simple claim extraction check (metrics/numbers)
          const originalNumbers: string[] = originalBullet.match(/\d+%?/g) || [];
          const proposedNumbers: string[] = bullet.proposedText.match(/\d+%?/g) || [];

          for (const num of proposedNumbers) {
            if (!originalNumbers.includes(num)) {
              issues.push(`Fabricated metric detected: '${num}' in experience ${exp.experienceId}`);
            }
          }
        }
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      details: {}
    };
  }

  /**
   * Helper to convert IResumeProfileData to IProfile for MatchEngine
   */
  private static resumeToProfileAdapter(profileData: IResumeProfileData): any {
    // Adapter mapping to make MatchEngine happy
    return {
      skills: [...profileData.skills.technical, ...profileData.skills.frameworks, ...profileData.skills.tools].map(s => ({ name: s, level: "expert", isVerified: true })),
      experience: profileData.experience.map(e => ({
        title: e.role,
        company: e.company,
        isCurrent: e.current,
        startDate: e.startDate,
        endDate: e.endDate,
        description: e.description + "\\n" + e.bullets.join("\\n")
      })),
      location: { city: profileData.personal.location }
    };
  }
}
