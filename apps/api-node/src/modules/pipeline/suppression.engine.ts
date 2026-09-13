import { IProfile } from "../profile/profile.model";
import { IJob } from "../jobs/jobs.model";
import { HardConstraintEngine } from "../jobs/matching/hard-constraints.engine";
import { JobApplication } from "../applications/applications.model";
import { SuppressionLog } from "./pipeline.model";

export type SuppressionReason =
  | "ALREADY_APPLIED"
  | "STALE_JOB"
  | "BLOCKED_COMPANY"
  | "LOCATION_MISMATCH"
  | "EXPERIENCE_MISMATCH"
  | "WORK_MODE_MISMATCH"
  | "MISSING_REQUIRED_INFORMATION"
  | "LOW_TRUST"
  | "USER_SUPPRESSED";

export class SuppressionEngine {
  
  static async evaluate(userId: string, profile: IProfile, job: IJob): Promise<{ suppressed: boolean; reason?: SuppressionReason; detail?: string }> {
    
    // 1. Check if Already Applied (via JobApplication Day 11 entity)
    const existingApp = await JobApplication.findOne({ userId, jobId: job._id });
    if (existingApp && existingApp.status !== "DISCOVERED" && existingApp.status !== "SAVED") {
      return this.logSuppression(userId, job._id.toString(), "ALREADY_APPLIED", "User has an active or submitted application for this job.");
    }

    // 2. Freshness Check
    if (job.createdAt && new Date(job.createdAt).getTime() < Date.now() - 45 * 24 * 60 * 60 * 1000) {
      return this.logSuppression(userId, job._id.toString(), "STALE_JOB", "Job is older than 45 days.");
    }

    // 3. Hard Constraints (Reuse Day 5 matching engine logic)
    const hardConstraints = HardConstraintEngine.evaluate(profile, job);
    for (const hc of hardConstraints) {
      if (hc.status === "BLOCKER") {
        let reason: SuppressionReason = "MISSING_REQUIRED_INFORMATION";
        if (hc.field === "LOCATION") reason = "LOCATION_MISMATCH";
        if (hc.field === "WORK_MODE") reason = "WORK_MODE_MISMATCH";
        
        return this.logSuppression(userId, job._id.toString(), reason, hc.reason || "Did not meet hard constraints.");
      }
    }

    return { suppressed: false };
  }

  private static async logSuppression(userId: string, jobId: string, reason: SuppressionReason, detail: string) {
    // Fire and forget log insertion
    SuppressionLog.create({
      userId,
      jobId,
      reason,
      rule: detail,
      timestamp: new Date()
    }).catch(err => console.error("Failed to log suppression:", err));

    return { suppressed: true, reason, detail };
  }
}
