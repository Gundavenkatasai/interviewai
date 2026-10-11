import { IProfile } from "../../profile/profile.model";
import { IJob } from "../jobs.model";

export type ConstraintStatus = "PASS" | "BLOCKER";

export interface ConstraintResult {
  status: ConstraintStatus;
  reason?: string;
  field?: string;
}

export class HardConstraintEngine {
  static evaluate(candidate: IProfile, job: Partial<IJob>): ConstraintResult[] {
    const results: ConstraintResult[] = [];

    // 1. India Only constraint 
    // If the candidate explicitly requires India or has Indian preferred locations, and job is not an India job, block it.
    const isCandidateIndiaFocused = (candidate.preferredLocations || []).some(
      (loc: string) => /india|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|noida|gurgaon/i.test(loc)
    );
    if (isCandidateIndiaFocused && job.isIndiaJob === false) {
      results.push({
        status: "BLOCKER",
        field: "Location",
        reason: "Job is not applicable to India-based candidates."
      });
    }

    // 2. Candidate Hard Constraints
    // Candidate might have explicit hard constraints like "No Onsite" or "Remote only"
    const candidateConstraints = candidate.careerGoals?.hardConstraints || [];
    
    if (candidateConstraints.includes("REMOTE_ONLY") && job.workMode && job.workMode !== "REMOTE") {
      results.push({
        status: "BLOCKER",
        field: "Work Mode",
        reason: "Candidate requires Remote only, but job is " + job.workMode
      });
    }

    // 3. Authorization (Stub for future)
    if (job.description?.toLowerCase().includes("us citizen only") && candidate.workAuthorization !== "US_CITIZEN") {
      results.push({
        status: "BLOCKER",
        field: "Work Authorization",
        reason: "Job requires US Citizenship"
      });
    }

    if (results.length === 0) {
      results.push({ status: "PASS" });
    }

    return results;
  }
}
