import { IProfile } from "../../profile/profile.model";
import { IJob } from "../jobs.model";

export interface ExperienceMatchResult {
  score: number; // 0-100
  status: "MATCH" | "GAP" | "UNKNOWN";
  evidence: string;
}

export class ExperienceEngine {
  static evaluate(candidate: IProfile, job: Partial<IJob>): ExperienceMatchResult {
    // Determine candidate total years (simplified heuristic)
    let candidateYears = 0;
    if (candidate.experience && candidate.experience.length > 0) {
      // Very basic: assume 2 years per verified experience block if dates are hard to parse
      // A robust implementation would do date math
      candidateYears = candidate.experience.length * 2; 
    }

    if (job.minExperience != null) {
      if (candidateYears >= job.minExperience) {
        return {
          score: 100,
          status: "MATCH",
          evidence: `Candidate has estimated ${candidateYears} years experience, meeting the ${job.minExperience} year requirement.`
        };
      } else {
        return {
          score: Math.max(0, Math.round((candidateYears / job.minExperience) * 100)),
          status: "GAP",
          evidence: `Job requires ${job.minExperience} years, candidate has roughly ${candidateYears} years.`
        };
      }
    }

    // Seniority fallback
    if (job.seniority) {
      const isSenior = candidate.experience.some(e => e.title.toLowerCase().includes("senior") || e.title.toLowerCase().includes("lead"));
      if (job.seniority === "senior" && !isSenior && candidateYears < 4) {
        return { score: 50, status: "GAP", evidence: "Role is senior, candidate appears mid/junior." };
      }
    }

    return { score: 80, status: "UNKNOWN", evidence: "Experience requirement not explicitly specified." };
  }
}
