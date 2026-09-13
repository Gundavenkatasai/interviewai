import { IJobApplication, JobApplication, ApplicationStatus, IApplicationField } from "./applications.model";
import { IProfile } from "../profile/profile.model";
import { Job } from "../jobs/jobs.model";
import { ResumeTailoringRun } from "../resume/tailoring/tailoring.model";
import { AIService } from "../../ai/ai.service";
import { z } from "zod";

export class ApplicationService {
  /**
   * Duplicate Check: Ensures we don't silently create multiple applications for the same job and user.
   */
  static async checkDuplicate(userId: string, jobId: string): Promise<IJobApplication | null> {
    return await JobApplication.findOne({ userId, jobId });
  }

  /**
   * Liveness Check: Ensures the job is still active before preparing.
   */
  static async checkJobLiveness(jobId: string): Promise<"LIVE" | "STALE" | "REMOVED" | "UNKNOWN"> {
    const job = await Job.findById(jobId);
    if (!job) return "REMOVED";
    
    // If it's over 45 days old, mark as stale
    if (job.createdAt && new Date(job.createdAt).getTime() < Date.now() - 45 * 24 * 60 * 60 * 1000) {
      return "STALE";
    }
    
    // In a real system, we might ping the job URL.
    return "LIVE";
  }

  /**
   * Deterministic Field Mapping using semantic rules and guard words
   */
  static mapStandardFields(fields: IApplicationField[], profile: any): IApplicationField[] {
    const mapped = [...fields];
    
    // Normalize profile to simple key-value for basic fields
    const profileData = {
      firstName: profile.personal?.firstName || profile.personal?.name?.split(' ')[0],
      lastName: profile.personal?.lastName || profile.personal?.name?.split(' ').slice(1).join(' '),
      email: profile.personal?.email,
      phone: profile.personal?.phone,
      location: profile.personal?.location,
      linkedin: profile.links?.find((l: any) => l.url?.includes('linkedin'))?.url,
      github: profile.links?.find((l: any) => l.url?.includes('github'))?.url,
      portfolio: profile.links?.find((l: any) => l.url?.includes('portfolio'))?.url,
    };

    for (const field of mapped) {
      const label = field.label.toLowerCase();
      
      // GUARD WORDS
      if (label.includes("emergency") || label.includes("reference") || label.includes("manager")) {
        field.status = "NEEDS_USER_INPUT";
        continue;
      }

      // SENSITIVE EEO / WORK AUTH
      if (label.includes("gender") || label.includes("race") || label.includes("veteran") || label.includes("disability") || label.includes("sponsorship") || label.includes("authorized") || label.includes("visa")) {
        field.status = "NEEDS_USER_INPUT";
        continue;
      }

      // DETERMINISTIC MAPPING
      if (label === "first name" || label.includes("first name")) {
        field.suggestedValue = profileData.firstName;
        field.status = profileData.firstName ? "SUGGESTED" : "NEEDS_USER_INPUT";
        field.source = "candidate.firstName";
      } else if (label === "last name" || label.includes("last name")) {
        field.suggestedValue = profileData.lastName;
        field.status = profileData.lastName ? "SUGGESTED" : "NEEDS_USER_INPUT";
        field.source = "candidate.lastName";
      } else if (label.includes("email")) {
        field.suggestedValue = profileData.email;
        field.status = profileData.email ? "SUGGESTED" : "NEEDS_USER_INPUT";
        field.source = "candidate.email";
      } else if (label === "phone" || label.includes("phone number") || label.includes("mobile")) {
        field.suggestedValue = profileData.phone;
        field.status = profileData.phone ? "SUGGESTED" : "NEEDS_USER_INPUT";
        field.source = "candidate.phone";
      } else if (label.includes("linkedin")) {
        field.suggestedValue = profileData.linkedin;
        field.status = profileData.linkedin ? "SUGGESTED" : "NEEDS_USER_INPUT";
        field.source = "candidate.linkedin";
      } else if (label.includes("github")) {
        field.suggestedValue = profileData.github;
        field.status = profileData.github ? "SUGGESTED" : "NEEDS_USER_INPUT";
        field.source = "candidate.github";
      } else if (label.includes("portfolio") || label.includes("website")) {
        field.suggestedValue = profileData.portfolio;
        field.status = profileData.portfolio ? "SUGGESTED" : "NEEDS_USER_INPUT";
        field.source = "candidate.portfolio";
      }
    }
    
    return mapped;
  }

  /**
   * Generates answers for ambiguous essay-style questions using AI
   */
  static async generateAnswer(field: IApplicationField, profile: any, runId?: string, userId?: string): Promise<IApplicationField> {
    const run = runId && userId ? await ResumeTailoringRun.findOne({ _id: runId, userId }) : null;
    
    const prompt = `You are an Application Assistant.
    Answer the following application question on behalf of the candidate.
    
    QUESTION: ${field.label}
    
    CANDIDATE FACTS:
    ${JSON.stringify(profile.experience || [], null, 2)}
    ${JSON.stringify(profile.projects || [], null, 2)}
    
    ${run ? `JOB REQUIREMENTS MAP:\\n${JSON.stringify(run.plan.evidenceMap, null, 2)}` : ""}
    
    RULES:
    1. Do not invent any metrics or experience.
    2. Answer concisely.
    3. Return structured JSON with "answer" and an array of "evidenceIds" referencing the candidate facts.`;

    const AnswerSchema = z.object({
      answer: z.string(),
      evidenceIds: z.array(z.string())
    });

    try {
      const response = await AIService.generateStructured(
        [{ role: "system", content: prompt }, { role: "user", content: "Generate answer" }],
        {},
        "qwen"
      );
      
      const parsed = AnswerSchema.parse(response);
      field.suggestedValue = parsed.answer;
      field.status = "SUGGESTED";
      field.evidenceIds = parsed.evidenceIds;
      field.source = "AI_GENERATED";
      return field;
    } catch (err) {
      console.error("[ApplicationService] Answer Generation failed:", err);
      field.status = "NEEDS_USER_INPUT";
      return field;
    }
  }

  /**
   * Mock field read-back verification
   */
  static verifyFields(fields: IApplicationField[]): IApplicationField[] {
    return fields.map(f => {
      // In a real browser extension flow, the extension reads the DOM.
      // Here we simulate that the field matched the suggestion.
      if (f.status === "AUTO_FILLED" || f.status === "SUGGESTED") {
        if (f.currentValue === f.suggestedValue) {
          f.status = "VERIFIED";
        } else if (f.currentValue && f.suggestedValue && f.currentValue !== f.suggestedValue) {
          f.status = "VERIFICATION_FAILED";
        }
      }
      return f;
    });
  }
}
