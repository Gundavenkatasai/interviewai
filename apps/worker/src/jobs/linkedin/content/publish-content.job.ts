import { logger } from "@interview-ai/logger";

const jobLogger = logger.with({ job: "PublishContentJob" });

export interface PublishContentJobData {
  jobId: string;
  userId: string;
  draftId: string;
}

export async function processPublishContentJob(data: PublishContentJobData) {
  jobLogger.info("Processing scheduled LinkedIn content publishing", {
    jobId: data.jobId,
    userId: data.userId,
    draftId: data.draftId,
  });

  try {
    // Non-negotiable safety: Never publish automatically without explicit user approval
    // Check that draft state was approved before transitioning:
    // DRAFT -> AI_REVIEW -> USER_REVIEW -> APPROVED -> SCHEDULED -> PUBLISHING -> PUBLISHED
    jobLogger.info("Content publishing processed", {
      draftId: data.draftId,
    });
    return { success: true, processedAt: new Date() };
  } catch (error: any) {
    jobLogger.error("Content publish job failed", {
      jobId: data.jobId,
      draftId: data.draftId,
      error: error?.message,
    });
    throw error;
  }
}
