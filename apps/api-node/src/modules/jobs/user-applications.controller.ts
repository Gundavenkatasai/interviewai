import { FastifyRequest, FastifyReply } from "fastify";
import { Job, SavedJob, JobApplication, JobAlert, UserJobPreferences } from "./jobs.model";
import { JobEligibilityEngine } from "./eligibility.engine";

function formatIST(date?: Date | string | null): string {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }) + " IST";
  } catch {
    return "";
  }
}

export class UserApplicationsController {
  
  /**
   * GET /api/user/saved-jobs
   */
  static async getSavedJobs(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user?.sub || "demo-user";
    const savedRecords = await SavedJob.find({ userId }).sort({ savedAt: -1 });
    const jobIds = savedRecords.map(s => s.jobId);

    const jobs = await Job.find({ _id: { $in: jobIds } });
    const jobMap = new Map(jobs.map(j => [String(j._id), j]));

    const result = savedRecords.map(s => {
      const job = jobMap.get(s.jobId);
      if (!job) return null;

      const evalResult = JobEligibilityEngine.evaluateJob(job);
      const rawDate = job.originalPublishedAt || job.sourcePostedAt;
      const ageHours = rawDate ? (Date.now() - new Date(rawDate).getTime()) / (1000 * 60 * 60) : 999;

      return {
        id: String(job._id),
        saved_id: s._id,
        title: job.title,
        company_name: job.companyName,
        location: job.location || "India",
        work_mode: job.workMode,
        employment_type: job.employmentType,
        source: job.source,
        apply_url: job.applyUrl || job.canonicalUrl || job.sourceUrl,
        saved_at: s.savedAt,
        notes: s.notes,
        published_at_ist: formatIST(rawDate),
        is_eligible_72h: evalResult.eligible,
        time_remaining_hours: evalResult.timeRemainingHours || 0,
        status: evalResult.eligible ? "ACTIVE_72H" : "EXPIRED_BEYOND_72H",
      };
    }).filter(Boolean);

    return reply.send({ success: true, saved_jobs: result, total: result.length });
  }

  /**
   * POST /api/user/applications
   */
  static async trackApplication(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user?.sub || "demo-user";
    const { jobId, status = "Applied", notes } = (request.body as any) || {};

    if (!jobId) {
      return reply.status(400).send({ success: false, message: "jobId is required" });
    }

    const application = await JobApplication.findOneAndUpdate(
      { userId, jobId },
      {
        $set: {
          status,
          notes,
          appliedAt: new Date(),
        }
      },
      { upsert: true, new: true }
    );

    return reply.send({ success: true, application });
  }

  /**
   * GET /api/user/applications
   */
  static async getApplications(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user?.sub || "demo-user";
    const applications = await JobApplication.find({ userId }).sort({ appliedAt: -1 });
    const jobIds = applications.map(a => a.jobId);

    const jobs = await Job.find({ _id: { $in: jobIds } });
    const jobMap = new Map(jobs.map(j => [String(j._id), j]));

    const result = applications.map(app => {
      const job = jobMap.get(app.jobId);
      return {
        id: app._id,
        job_id: app.jobId,
        status: app.status,
        notes: app.notes,
        applied_at: app.appliedAt,
        job: job ? {
          title: job.title,
          company_name: job.companyName,
          location: job.location,
          source: job.source,
          apply_url: job.applyUrl || job.canonicalUrl,
        } : null,
      };
    });

    return reply.send({ success: true, applications: result, total: result.length });
  }

  /**
   * GET /api/user/preferences
   */
  static async getPreferences(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user?.sub || "demo-user";
    const prefs = await UserJobPreferences.findOne({ userId });
    return reply.send({ success: true, preferences: prefs || {} });
  }

  /**
   * POST /api/user/preferences
   */
  static async savePreferences(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user?.sub || "demo-user";
    const body = (request.body as any) || {};
    const prefs = await UserJobPreferences.findOneAndUpdate(
      { userId } as any,
      { $set: body },
      { upsert: true, new: true }
    );
    return reply.send({ success: true, preferences: prefs });
  }
}
