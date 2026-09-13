import mongoose, { Schema } from "mongoose";
import { randomUUID } from "crypto";

export type CommunicationChannel = "EMAIL" | "LINKEDIN" | "IN_APP" | "COPY_TO_CLIPBOARD" | "MANUAL";
export type CommunicationDirection = "OUTBOUND" | "INBOUND";
export type CommunicationStatus = "DRAFT" | "AWAITING_REVIEW" | "APPROVED" | "READY" | "SENDING" | "SENT" | "FAILED" | "RETRYABLE_FAILURE" | "BOUNCED" | "REPLIED" | "CANCELLED" | "USER_COPIED";

export interface ICommunicationActivity {
  _id: string;
  userId: string;

  applicationId?: string;
  interviewId?: string;
  jobId?: string;
  contactId?: string;

  channel: CommunicationChannel;
  type: string;
  direction: CommunicationDirection;
  status: CommunicationStatus;

  subject?: string;
  body?: string;
  originalDraft?: string; // preserve original AI draft
  
  draftVersion: number;
  promptVersion?: string;
  inputFingerprint?: string;
  aiProvider?: string;

  scheduledAt?: Date;
  sentAt?: Date;
  repliedAt?: Date;

  providerMessageId?: string;
  
  metadata?: any;
  
  createdAt: Date;
  updatedAt: Date;
}

const communicationActivitySchema = new Schema<ICommunicationActivity>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    
    applicationId: { type: String, ref: "JobApplication", index: true },
    interviewId: { type: String, ref: "InterviewSession", index: true },
    jobId: { type: String, ref: "Job" },
    contactId: { type: String, ref: "CareerContact", index: true },

    channel: { type: String, required: true },
    type: { type: String, required: true },
    direction: { type: String, default: "OUTBOUND" },
    status: { type: String, default: "DRAFT", index: true },

    subject: { type: String },
    body: { type: String },
    originalDraft: { type: String },
    
    draftVersion: { type: Number, default: 1 },
    promptVersion: { type: String },
    inputFingerprint: { type: String },
    aiProvider: { type: String },

    scheduledAt: { type: Date },
    sentAt: { type: Date },
    repliedAt: { type: Date },

    providerMessageId: { type: String },
    metadata: { type: Object },
  },
  { timestamps: true }
);

communicationActivitySchema.index({ userId: 1, createdAt: -1 });

export const CommunicationActivity = mongoose.model<ICommunicationActivity>("CommunicationActivity", communicationActivitySchema);
