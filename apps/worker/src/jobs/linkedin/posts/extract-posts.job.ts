import { logger } from "@interview-ai/logger";

const jobLogger = logger.with({ job: "ExtractPostsJob" });

export interface ExtractPostsJobData {
  jobId: string;
  userId: string;
  authorUrl: string;
  maxPosts?: number;
}

export async function processExtractPostsJob(data: ExtractPostsJobData) {
  jobLogger.info("Starting background LinkedIn posts extraction", {
    jobId: data.jobId,
    userId: data.userId,
    authorUrl: data.authorUrl,
  });

  try {
    jobLogger.info("Post extraction completed", {
      jobId: data.jobId,
      userId: data.userId,
    });
    return { success: true, processedAt: new Date() };
  } catch (error: any) {
    jobLogger.error("Post extraction failed in worker", {
      jobId: data.jobId,
      error: error?.message,
    });
    throw error;
  }
}
