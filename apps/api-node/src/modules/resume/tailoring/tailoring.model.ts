import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export interface ITailoringPlan {
  requirements: {
    requirementId: string;
    category: string;
    text: string;
    importance: "MANDATORY" | "IMPORTANT" | "PREFERRED" | "CONTEXTUAL";
  }[];
  evidenceMap: Record<string, {
    status: "VERIFIED" | "SUPPORTED" | "PARTIAL" | "MISSING" | "UNKNOWN" | "CONFLICT";
    evidenceIds: string[];
    reason?: string;
  }>;
  allowedRewrites: string[];
  forbiddenClaims: string[];
}

export interface IResumeTailoringRun {
  _id: string;
  userId: string;
  sourceResumeId: string;
  sourceResumeVersionId: string;
  jobId: string;
  jobSnapshot: any;
  status: "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "SUPERSEDED";
  plan: ITailoringPlan;
  aiProposal: any;
  qualityGate: {
    passed: boolean;
    issues: string[];
    details: any;
  };
  atsScoreBefore: number;
  atsScoreAfter: number;
  createdAt: Date;
  updatedAt: Date;
}

const resumeTailoringRunSchema = new Schema<IResumeTailoringRun>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    sourceResumeId: { type: String, ref: "Resume", required: true, index: true },
    sourceResumeVersionId: { type: String, ref: "ResumeVersion", required: true },
    jobId: { type: String, ref: "Job", required: true, index: true },
    jobSnapshot: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["DRAFT", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUPERSEDED"],
      default: "DRAFT",
    },
    plan: { type: Schema.Types.Mixed, required: true },
    aiProposal: { type: Schema.Types.Mixed },
    qualityGate: { type: Schema.Types.Mixed },
    atsScoreBefore: { type: Number, default: 0 },
    atsScoreAfter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

resumeTailoringRunSchema.index({ userId: 1, createdAt: -1 });
resumeTailoringRunSchema.index({ sourceResumeId: 1, jobId: 1 });

export const ResumeTailoringRun = mongoose.model<IResumeTailoringRun>("ResumeTailoringRun", resumeTailoringRunSchema);
