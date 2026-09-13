import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export interface IAnalyticsDataQuality {
  totalRecords: number;
  completenessPercentage: number;
  missingSourceCount: number;
  missingOutcomeCount: number;
}

export interface ICareerAnalyticsSnapshot {
  _id: string;
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
  calculationVersion: string;
  
  funnelMetrics: any;
  sourceMetrics: any[];
  roleMetrics: any[];
  resumeMetrics: any[];
  interviewMetrics: any;
  gapMetrics: any[];
  nextBestActions: any[];
  aiSummary?: any;

  dataQuality: IAnalyticsDataQuality;
}

const analyticsSnapshotSchema = new Schema<ICareerAnalyticsSnapshot>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    generatedAt: { type: Date, default: Date.now },
    calculationVersion: { type: String, required: true, default: "v1.0.0" },
    
    funnelMetrics: { type: Schema.Types.Mixed, default: {} },
    sourceMetrics: { type: [Object], default: [] },
    roleMetrics: { type: [Object], default: [] },
    resumeMetrics: { type: [Object], default: [] },
    interviewMetrics: { type: Schema.Types.Mixed, default: {} },
    gapMetrics: { type: [Object], default: [] },
    nextBestActions: { type: [Object], default: [] },
    aiSummary: { type: Schema.Types.Mixed },
    
    dataQuality: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const CareerAnalyticsSnapshot = mongoose.model<ICareerAnalyticsSnapshot>("CareerAnalyticsSnapshot", analyticsSnapshotSchema);

export interface IAnalyticsEvent {
  _id: string;
  userId?: string;
  eventType: string;
  page?: string;
  resourceId?: string;
  metadata: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
}

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", index: true },
    eventType: { type: String, required: true, index: true },
    page: { type: String },
    resourceId: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    userAgent: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>("AnalyticsEvent", analyticsEventSchema);
