import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export type PipelineStage = 
  | "ELIGIBILITY_CHECK"
  | "SUPPRESSION"
  | "MATCHING"
  | "TRUST_EVALUATION"
  | "RESUME_SELECTION"
  | "TAILORING"
  | "TAILORING_VALIDATION"
  | "ATS_VALIDATION"
  | "APPLICATION_PREPARATION"
  | "APPLICATION_PACK";

export type PipelineStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "BLOCKED" | "SKIPPED";

export interface IPipelineStageRecord {
  stage: PipelineStage;
  status: PipelineStatus;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  inputFingerprint?: string;
  outputFingerprint?: string;
  errorCode?: string;
  errorMessage?: string;
  resultRef?: any;
}

export interface IPipelineRun {
  _id: string;
  userId: string;
  jobId: string;
  jobSnapshotHash?: string;
  status: PipelineStatus;
  currentStage: PipelineStage;
  stages: IPipelineStageRecord[];
  
  // Artifact References
  sourceResumeVersionId?: string;
  applicationId?: string;
  tailoringRunId?: string;
  atsScanId?: string;
  matchResultId?: string;
  trustResultId?: string;

  // Idempotency & Concurrency
  idempotencyKey?: string;
  workerId?: string;
  lastHeartbeatAt?: Date;

  error?: {
    code: string;
    message: string;
  };
  
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pipelineStageSchema = new Schema<IPipelineStageRecord>({
  stage: { type: String, required: true },
  status: { type: String, required: true },
  startedAt: { type: Date },
  completedAt: { type: Date },
  attempts: { type: Number, default: 0 },
  inputFingerprint: { type: String },
  outputFingerprint: { type: String },
  errorCode: { type: String },
  errorMessage: { type: String },
  resultRef: { type: Schema.Types.Mixed },
}, { _id: false });

const pipelineRunSchema = new Schema<IPipelineRun>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true },
    jobId: { type: String, ref: "Job", required: true },
    jobSnapshotHash: { type: String },
    
    status: { type: String, required: true, default: "PENDING" },
    currentStage: { type: String, required: true, default: "ELIGIBILITY_CHECK" },
    stages: { type: [pipelineStageSchema], default: [] },
    
    sourceResumeVersionId: { type: String },
    applicationId: { type: String },
    tailoringRunId: { type: String },
    atsScanId: { type: String },
    matchResultId: { type: String },
    trustResultId: { type: String },
    
    idempotencyKey: { type: String },
    workerId: { type: String },
    lastHeartbeatAt: { type: Date },
    
    error: {
      code: { type: String },
      message: { type: String }
    },
    
    startedAt: { type: Date },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes for worker queries and dashboard
pipelineRunSchema.index({ userId: 1, status: 1 });
pipelineRunSchema.index({ userId: 1, jobId: 1 });
pipelineRunSchema.index({ status: 1, lastHeartbeatAt: 1 }); // for stale run recovery
pipelineRunSchema.index({ idempotencyKey: 1 });

export const PipelineRun = mongoose.model<IPipelineRun>("PipelineRun", pipelineRunSchema);

export interface ISuppressionLog {
  _id: string;
  userId: string;
  jobId: string;
  reason: string;
  rule: string;
  timestamp: Date;
}

const suppressionLogSchema = new Schema<ISuppressionLog>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true },
    jobId: { type: String, ref: "Job", required: true },
    reason: { type: String, required: true },
    rule: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const SuppressionLog = mongoose.model<ISuppressionLog>("SuppressionLog", suppressionLogSchema);
