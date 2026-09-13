import mongoose, { Schema } from "mongoose";
import { randomUUID } from "crypto";

export type FollowUpStatus = "NOT_DUE" | "DUE" | "DRAFTING" | "DRAFT_READY" | "AWAITING_REVIEW" | "APPROVED" | "SENT" | "REPLIED" | "SKIPPED" | "SUPPRESSED" | "EXPIRED";

export interface IFollowUpTask {
  _id: string;
  userId: string;

  applicationId?: string;
  interviewId?: string;
  contactId?: string;
  communicationId?: string; // Links to drafted/sent communication

  type: string;
  channel: string;

  dueAt: Date;
  status: FollowUpStatus;

  reason: string;

  attemptNumber: number;
  maxAttempts: number;

  fingerprint: string; // Ensure idempotency (e.g., userId_applicationId_type_attemptNumber)

  sourceVersion: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const followUpTaskSchema = new Schema<IFollowUpTask>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    
    applicationId: { type: String, ref: "JobApplication", index: true },
    interviewId: { type: String, ref: "InterviewSession", index: true },
    contactId: { type: String, ref: "CareerContact" },
    communicationId: { type: String, ref: "CommunicationActivity" },

    type: { type: String, required: true },
    channel: { type: String, default: "EMAIL" },

    dueAt: { type: Date, required: true, index: true },
    status: { type: String, default: "NOT_DUE", index: true },

    reason: { type: String, required: true },

    attemptNumber: { type: Number, default: 1 },
    maxAttempts: { type: Number, default: 2 },

    fingerprint: { type: String, required: true, unique: true },
    
    sourceVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

followUpTaskSchema.index({ userId: 1, status: 1, dueAt: 1 });

export const FollowUpTask = mongoose.model<IFollowUpTask>("FollowUpTask", followUpTaskSchema);
