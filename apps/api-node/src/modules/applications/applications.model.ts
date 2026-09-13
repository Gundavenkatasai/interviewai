import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export type ApplicationStatus = 
  | "DISCOVERED" 
  | "SAVED" 
  | "PREPARING" 
  | "READY_TO_APPLY" 
  | "IN_PROGRESS" 
  | "READY_TO_SUBMIT" 
  | "SUBMITTED" 
  | "WITHDRAWN" 
  | "REJECTED" 
  | "INTERVIEWING" 
  | "OFFER" 
  | "HIRED" 
  | "ARCHIVED";

export interface IApplicationField {
  fieldId: string;
  label: string;
  normalizedType: "TEXT" | "TEXTAREA" | "EMAIL" | "PHONE" | "URL" | "NUMBER" | "DATE" | "SELECT" | "RADIO" | "CHECKBOX" | "FILE" | "MULTISELECT" | "UNKNOWN";
  inputType?: string;
  required: boolean;
  options?: string[];
  currentValue?: string | string[];
  suggestedValue?: string | string[];
  source?: string; // e.g., 'candidate.email', 'AI_GENERATED', 'USER_INPUT'
  confidence?: number;
  status: "AUTO_FILLED" | "SUGGESTED" | "NEEDS_REVIEW" | "UNKNOWN" | "SKIPPED" | "VERIFIED" | "NEEDS_USER_INPUT" | "VERIFICATION_FAILED";
  evidenceIds?: string[]; // References to canonical profile items for AI generated answers
}

export interface IJobApplication {
  _id: string;
  userId: string;
  jobId?: string; // Optional for manual entries, required for platform jobs
  jobSnapshotHash?: string;
  
  // Artifact links
  sourceResumeVersionId?: string;
  tailoringRunId?: string;
  resumeArtifactId?: string;

  companyName: string;
  jobTitle: string;
  status: ApplicationStatus | string; // legacy support for string statuses
  
  applicationUrl?: string;
  sourceUrl?: string;
  portal?: string;

  // Timestamps & Data
  appliedDate?: Date;
  preparedAt?: Date;
  submittedAt?: Date;
  nextInterviewDate?: Date;
  
  notes?: string;
  salaryRange?: string;

  // The application form representation
  fields: IApplicationField[];

  timeline: {
    status: string;
    date: Date;
    notes?: string;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}

const applicationFieldSchema = new Schema<IApplicationField>({
  fieldId: { type: String, required: true },
  label: { type: String, required: true },
  normalizedType: { type: String, required: true },
  inputType: { type: String },
  required: { type: Boolean, default: false },
  options: { type: [String] },
  currentValue: { type: Schema.Types.Mixed },
  suggestedValue: { type: Schema.Types.Mixed },
  source: { type: String },
  confidence: { type: Number },
  status: { type: String, required: true },
  evidenceIds: { type: [String] }
}, { _id: false });

const jobApplicationSchema = new Schema<IJobApplication>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    jobId: { type: String, ref: "Job", index: true },
    jobSnapshotHash: { type: String },
    
    sourceResumeVersionId: { type: String, ref: "ResumeVersion" },
    tailoringRunId: { type: String, ref: "ResumeTailoringRun" },
    resumeArtifactId: { type: String },

    companyName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    status: { type: String, default: "SAVED", index: true },
    
    applicationUrl: { type: String },
    sourceUrl: { type: String },
    portal: { type: String },

    appliedDate: { type: Date },
    preparedAt: { type: Date },
    submittedAt: { type: Date, index: true },
    nextInterviewDate: { type: Date },
    
    notes: { type: String },
    salaryRange: { type: String },

    fields: { type: [applicationFieldSchema], default: [] },

    timeline: [
      {
        status: { type: String, required: true },
        date: { type: Date, default: Date.now },
        notes: { type: String },
      }
    ],
  },
  { timestamps: true }
);

// Indexes
jobApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true, partialFilterExpression: { jobId: { $exists: true } } });
jobApplicationSchema.index({ userId: 1, status: 1 });
jobApplicationSchema.index({ userId: 1, createdAt: -1 });
jobApplicationSchema.index({ userId: 1, submittedAt: -1 });

export const JobApplication = mongoose.model<IJobApplication>("JobApplication", jobApplicationSchema);
