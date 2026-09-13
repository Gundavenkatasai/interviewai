import { IProfile } from "../../profile/profile.model";
import { IJob } from "../jobs.model";

export interface LocationMatchResult {
  score: number; // 0-100
  status: "MATCH" | "PREFERENCE_MISMATCH" | "UNKNOWN";
  evidence: string;
}

export class LocationEngine {
  static evaluate(candidate: IProfile, job: Partial<IJob>): LocationMatchResult {
    if (!job.location && !job.workMode) {
      return { score: 50, status: "UNKNOWN", evidence: "Job location and work mode are unknown" };
    }

    const preferredLocations = (candidate.preferredLocations || []).map(l => l.toLowerCase());
    const preferredWorkModes = (candidate.preferredWorkMode || []).map(m => m.toLowerCase());
    
    let score = 50;
    const evidenceList = [];
    let status: LocationMatchResult["status"] = "UNKNOWN";

    // Work Mode
    if (job.workMode) {
      if (preferredWorkModes.length > 0) {
        if (preferredWorkModes.includes(job.workMode.toLowerCase())) {
          score += 25;
          evidenceList.push(`Matches preferred work mode: ${job.workMode}`);
          status = "MATCH";
        } else {
          score -= 10;
          evidenceList.push(`Work mode mismatch (Job is ${job.workMode})`);
          status = "PREFERENCE_MISMATCH";
        }
      } else {
        evidenceList.push(`Work mode: ${job.workMode} (No preference stated)`);
      }
    }

    // Location
    if (job.location) {
      if (preferredLocations.length > 0) {
        const jobLocLower = job.location.toLowerCase();
        if (preferredLocations.some(pl => jobLocLower.includes(pl))) {
          score += 25;
          evidenceList.push(`Matches preferred location: ${job.location}`);
          status = "MATCH";
        } else {
          // It's not in their preferred list
          if (status !== "MATCH") status = "PREFERENCE_MISMATCH";
          evidenceList.push(`Location ${job.location} is not in preferred list`);
        }
      } else {
        evidenceList.push(`Location: ${job.location} (No preference stated)`);
      }
    }

    return {
      score: Math.max(0, Math.min(100, score === 50 && evidenceList.length === 0 ? 50 : (score === 50 && status !== "UNKNOWN" ? 75 : score))),
      status,
      evidence: evidenceList.join(", ")
    };
  }
}
