import { logger } from "@interview-ai/logger";

const jobLogger = logger.with({ job: "SearchJobsJob" });

export interface SearchJobsJobData {
  jobId: string;
  userId: string;
  keywords: string;
  location?: string;
  limit?: number;
}

export async function processSearchJobsJob(data: SearchJobsJobData) {
  jobLogger.info("Starting background LinkedIn job search", {
    jobId: data.jobId,
    userId: data.userId,
    keywords: data.keywords,
  });

  try {
    jobLogger.info("Job search completed", {
      jobId: data.jobId,
      userId: data.userId,
    });
    return { success: true, processedAt: new Date() };
  } catch (error: any) {
    jobLogger.error("Job search failed in worker", {
      jobId: data.jobId,
      error: error?.message,
    });
    throw error;
  }
}
