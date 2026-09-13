import { FollowUpTask, FollowUpStatus } from "./followup.model";
import { CommunicationActivity } from "./communication.model";
import { randomUUID } from "crypto";

export class FollowUpEngine {
  
  /**
   * Evaluates and schedules a follow-up task based on a significant event (e.g., Interview Completed).
   */
  static async scheduleFollowUp(params: {
    userId: string;
    type: string;
    reason: string;
    channel?: string;
    applicationId?: string;
    interviewId?: string;
    contactId?: string;
    offsetBusinessDays?: number;
  }) {
    const { userId, type, reason, channel = "EMAIL", applicationId, interviewId, contactId, offsetBusinessDays = 1 } = params;
    
    // Idempotency fingerprint
    const fingerprint = `${userId}_${type}_${applicationId || 'none'}_${interviewId || 'none'}_${contactId || 'none'}_attempt_1`;

    const existing = await FollowUpTask.findOne({ fingerprint });
    if (existing) return existing;

    // Check if user has suppressed this
    // A full suppression check could check a generic UserPreference model, but for now we assume allowed.
    
    // Calculate due date (naive business day calculation, skips weekends)
    const dueAt = new Date();
    let added = 0;
    while (added < offsetBusinessDays) {
      dueAt.setDate(dueAt.getDate() + 1);
      if (dueAt.getDay() !== 0 && dueAt.getDay() !== 6) {
        added++;
      }
    }

    const task = new FollowUpTask({
      userId,
      applicationId,
      interviewId,
      contactId,
      type,
      channel,
      dueAt,
      status: offsetBusinessDays === 0 ? "DUE" : "NOT_DUE",
      reason,
      attemptNumber: 1,
      fingerprint
    });

    await task.save();
    return task;
  }

  /**
   * Evaluates if a pending follow-up should be suppressed (e.g. because of a reply or a user action)
   */
  static async evaluateSuppression(userId: string, context: { applicationId?: string, interviewId?: string, contactId?: string }) {
    const pendingTasks = await FollowUpTask.find({
      userId,
      status: { $in: ["NOT_DUE", "DUE", "DRAFTING", "DRAFT_READY", "AWAITING_REVIEW"] },
      ...context
    });

    for (const task of pendingTasks) {
      task.status = "SUPPRESSED";
      await task.save();
    }
  }

  /**
   * Scans for NOT_DUE tasks that have crossed their due date and marks them DUE.
   */
  static async transitionDueTasks() {
    const now = new Date();
    await FollowUpTask.updateMany(
      { status: "NOT_DUE", dueAt: { $lte: now } },
      { $set: { status: "DUE" } }
    );
  }

}
