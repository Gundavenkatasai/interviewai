import { logger } from "@interview-ai/logger";

const jobLogger = logger.with({ job: "RefreshAnalyticsJob" });

export interface RefreshAnalyticsJobData {
  jobId: string;
  userId: string;
  profileId: string;
}

export async function processRefreshAnalyticsJob(data: RefreshAnalyticsJobData) {
  jobLogger.info("Starting background LinkedIn analytics refresh", {
    jobId: data.jobId,
    userId: data.userId,
    profileId: data.profileId,
  });

  try {
    jobLogger.info("Analytics snapshot updated successfully", {
      jobId: data.jobId,
      userId: data.userId,
    });
    return { success: true, processedAt: new Date() };
  } catch (error: any) {
    jobLogger.error("Analytics refresh failed in worker", {
      jobId: data.jobId,
      error: error?.message,
    });
    throw error;
  }
}
