import { z } from "zod";
import { AIService } from "../../../ai/ai.service";
import { LLMMessage } from "../../../ai/core/provider.interface";
import { IProfile } from "../../profile/profile.model";
import { IJob } from "../jobs.model";

export const explanationSchema = z.object({
  whyThisJob: z.array(z.string()).describe("List of reasons why this job matches the candidate, referencing specific evidence"),
  whyNot: z.array(z.string()).describe("List of potential gaps, missing requirements, or reasons it might not be a fit"),
  recommendedActions: z.array(z.string()).describe("Short actionable recommendations for the candidate regarding this job")
});

export type MatchExplanation = z.infer<typeof explanationSchema>;

export class ExplanationEngine {
  /**
   * Generates a structural explanation from the LLM based purely on the deterministic breakdown.
   */
  static async generate(candidate: IProfile, job: Partial<IJob>, breakdown: any): Promise<MatchExplanation> {
    const systemPrompt = `You are an expert career advisor. Your job is to explain the Match Score to the candidate.
You MUST rely ONLY on the provided Evidence Breakdown, Candidate Summary, and Job Summary.
DO NOT hallucinate requirements that aren't in the job.
DO NOT hallucinate candidate skills that aren't in the candidate summary.
If a score component is UNKNOWN, do not treat it as a gap, just state that it is unknown.`;

    const candidateSummary = `Target Roles: ${candidate.careerGoals?.targetDirections?.join(", ") || "None"}
Verified Skills: ${(candidate.skills || []).map(s => s.name).join(", ")}
Experience: ${(candidate.experience || []).map(e => e.title + " at " + e.company).join("; ")}`;

    const jobSummary = `Title: ${job.title}
Required Skills: ${job.skillsNormalized?.join(", ") || "None specified"}
Description Snippet: ${job.description?.substring(0, 300) || ""}`;

    const breakdownText = JSON.stringify(breakdown, null, 2);

    const prompt = `Explain why this job is or isn't a fit.
Candidate Summary:
${candidateSummary}

Job Summary:
${jobSummary}

Evidence Breakdown:
${breakdownText}

Output a structured JSON explanation.`;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ];

    try {
      // Execute LLM task
      const result = await AIService.generateStructured<MatchExplanation>(messages, explanationSchema, {
        task: "ANALYSIS", 
        temperature: 0.1 // Keep it deterministic
      });
      return result;
    } catch (e) {
      console.error("Explanation generation failed", e);
      return {
        whyThisJob: ["Deterministic breakdown is available, but detailed AI explanation is currently offline."],
        whyNot: [],
        recommendedActions: ["Review the breakdown manually."]
      };
    }
  }
}
