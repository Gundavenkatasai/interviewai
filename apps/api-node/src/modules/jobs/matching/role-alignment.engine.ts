import { IProfile } from "../../profile/profile.model";
import { IJob } from "../jobs.model";

export interface RoleAlignmentResult {
  score: number; // 0-100
  alignment: "STRONG" | "GOOD" | "PARTIAL" | "WEAK" | "UNKNOWN";
  evidence: string;
}

export class RoleAlignmentEngine {
  static evaluate(candidate: IProfile, job: Partial<IJob>): RoleAlignmentResult {
    if (!job.title) {
      return { score: 50, alignment: "UNKNOWN", evidence: "Job title missing" };
    }

    const targetDirections = candidate.careerGoals?.targetDirections || [];
    const preferredRoles = candidate.preferredRoles || [];
    const targets = [...targetDirections, ...preferredRoles].map(r => r.toLowerCase());
    
    const jobTitle = job.title.toLowerCase();

    if (targets.length === 0) {
      return { score: 70, alignment: "UNKNOWN", evidence: "Candidate has no target roles defined" };
    }

    // Exact or contains match
    if (targets.some(t => jobTitle.includes(t) || t.includes(jobTitle))) {
      return {
        score: 100,
        alignment: "STRONG",
        evidence: `Job title aligns with target direction: ${targets.find(t => jobTitle.includes(t))}`
      };
    }

    // Keyword overlap heuristic
    const titleWords = jobTitle.split(/[\s-]+/);
    let overlap = false;
    for (const target of targets) {
      const targetWords = target.split(/[\s-]+/);
      const common = titleWords.filter(w => targetWords.includes(w) && w.length > 2);
      if (common.length > 0) {
        overlap = true;
        break;
      }
    }

    if (overlap) {
      return {
        score: 75,
        alignment: "GOOD",
        evidence: "Partial keyword overlap with target roles"
      };
    }

    return {
      score: 40,
      alignment: "WEAK",
      evidence: "Job title does not strongly align with stated career goals"
    };
  }
}
