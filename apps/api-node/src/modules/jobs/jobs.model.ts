import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export interface IJob {
  _id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  description?: string;
  location?: string;
  locationNormalized?: string;
  country?: string;
  countryCode?: string;
  state?: string;
  city?: string;
  isIndiaJob: boolean;
  status: string;
  isActive: boolean;
  isExpired: boolean;
  exclusionReason?: string;
  rejectionReason?: string;
  dataQualityScore?: number;
  trustScore?: number;
  trustDetails?: {
    isOfficialDomain: boolean;
    suspiciousWording: boolean;
    suspiciousPayment: boolean;
    evidence: string[];
  };
  matchScore?: number;
  matchDetails?: any;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  salaryPeriod: string;
  workMode?: string;
  jobType?: string;
  employmentType?: string;
  experienceLevel?: string;
  seniority?: string;
  minExperience?: number;
  maxExperience?: number;
  roleCategory?: string;
  roleFamily?: string;
  industry?: string;
  educationLevel?: string;
  skills: any[];
  skillsNormalized: any[];
  source?: string;
  sourceJobId?: string;
  sourceUrl?: string;
  applyUrl?: string;
  canonicalUrl?: string;
  applicationUrl?: string;
  rawSourceData?: string;
  sourcePostedAt?: Date;
  postingDateConfidence: string;
  firstSeenAt?: Date;
  lastSeenAt?: Date;
  scrapedAt?: Date;
  postedAt: Date;
  createdAt: Date;
  contentHash?: string;
  freshness: string;
  applyUrlStatus?: string;
  duplicateClusterId?: string;
  canonicalJobId?: string;
  sourceReferences: any[];
  jobQualitySignals: any;
}

const jobSchema = new Schema<IJob>(
  {
    _id: { type: String, default: () => randomUUID() },
    title: { type: String, required: true, index: true },
    companyName: { type: String, required: true, index: true },
    companyLogo: { type: String },
    description: { type: String },
    location: { type: String },
    locationNormalized: { type: String },
    country: { type: String, index: true },
    countryCode: { type: String },
    state: { type: String, index: true },
    city: { type: String, index: true },
    isIndiaJob: { type: Boolean, default: false, index: true },
    status: { type: String, default: "active", index: true },
    isActive: { type: Boolean, default: true, index: true },
    isExpired: { type: Boolean, default: false, index: true },
    exclusionReason: { type: String },
    rejectionReason: { type: String },
    dataQualityScore: { type: Number },
    trustScore: { type: Number },
    trustDetails: {
      isOfficialDomain: { type: Boolean, default: false },
      suspiciousWording: { type: Boolean, default: false },
      suspiciousPayment: { type: Boolean, default: false },
      evidence: { type: [String], default: [] }
    },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    salaryCurrency: { type: String, default: "INR" },
    salaryPeriod: { type: String, default: "year" },
    workMode: { type: String, index: true },
    jobType: { type: String, index: true },
    employmentType: { type: String, index: true },
    experienceLevel: { type: String },
    seniority: { type: String, index: true },
    minExperience: { type: Number, index: true },
    maxExperience: { type: Number },
    roleCategory: { type: String, index: true },
    roleFamily: { type: String, index: true },
    industry: { type: String, index: true },
    educationLevel: { type: String },
    skills: { type: [Object], default: [] },
    skillsNormalized: { type: [Object], default: [] },
    source: { type: String, index: true },
    sourceJobId: { type: String, index: true },
    sourceUrl: { type: String },
    applyUrl: { type: String },
    canonicalUrl: { type: String },
    applicationUrl: { type: String },
    rawSourceData: { type: String },
    sourcePostedAt: { type: Date, index: true },
    postingDateConfidence: { type: String, default: "unknown" },
    firstSeenAt: { type: Date },
    lastSeenAt: { type: Date },
    scrapedAt: { type: Date },
    postedAt: { type: Date, default: Date.now, index: true },
    contentHash: { type: String, index: true },
    freshness: { type: String, default: "UNKNOWN", index: true },
    applyUrlStatus: { type: String, default: "UNKNOWN", index: true },
    duplicateClusterId: { type: String, index: true },
    canonicalJobId: { type: String, index: true },
    sourceReferences: { type: [Object], default: [] },
    jobQualitySignals: { type: Object, default: {} },
  },
  { timestamps: true }
);

// Indexes
jobSchema.index({ source: 1, sourceJobId: 1 }, { unique: true });
jobSchema.index({ country: 1, isActive: 1, sourcePostedAt: -1 });

export const Job = mongoose.model<IJob>("Job", jobSchema);

export const savedJobSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    jobId: { type: String, ref: "Job", required: true, index: true },
    savedAt: { type: Date, default: Date.now },
    notes: { type: String },
    tags: { type: [String], default: [] },
    matchScore: { type: Number },
    matchDetails: {
      status: { type: String, enum: ["MATCHED", "PARTIAL", "MISSING", "UNCERTAIN"], default: "UNCERTAIN" },
      matchedSkills: { type: [String], default: [] },
      missingSkills: { type: [String], default: [] },
      explanation: { type: String }
    }
  },
  { timestamps: true }
);

savedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });
export const SavedJob = mongoose.model("SavedJob", savedJobSchema);

export const applicationClickSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    jobId: { type: String, ref: "Job", required: true, index: true },
    userId: { type: String, ref: "User", index: true },
    applyUrl: { type: String },
    source: { type: String },
    clickedAt: { type: Date, default: Date.now, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

export const ApplicationClick = mongoose.model("ApplicationClick", applicationClickSchema);

export const jobSourceStatusSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    name: { type: String, required: true, unique: true, index: true },
    status: { type: String, default: "active" },
    lastRun: { type: Date },
    jobsCount: { type: Number, default: 0 },
    durationMs: { type: Number },
    error: { type: String },
  },
  { timestamps: true }
);

export const JobSourceStatus = mongoose.model("JobSourceStatus", jobSourceStatusSchema);

export const jobIngestionRunSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    source: { type: String, required: true, index: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    status: { type: String, default: "running" },
    query: { type: String },
    pagesAttempted: { type: Number, default: 0 },
    jobsFetched: { type: Number, default: 0 },
    jobsAccepted: { type: Number, default: 0 },
    jobsRejected: { type: Number, default: 0 },
    duplicates: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

export const JobIngestionRun = mongoose.model("JobIngestionRun", jobIngestionRunSchema);

export const jobMatchScoreSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    candidateId: { type: String, required: true, index: true },
    jobId: { type: String, required: true, index: true },
    matchScore: { type: Number, required: true },
    trustScore: { type: Number, required: true },
    recommendationPriority: { type: Number, default: 0 },
    breakdown: { type: Object, default: {} },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    unknownSignals: { type: [String], default: [] },
    hardConstraints: { type: [Object], default: [] },
    explanations: { type: Object, default: null }, // LLM explanation JSON
    engineVersion: { type: String, required: true },
    candidateVersion: { type: String, default: "v1" }, // Can integrate hash later
    jobVersion: { type: String, default: "v1" },
  },
  { timestamps: true }
);

jobMatchScoreSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

export const JobMatchScore = mongoose.model("JobMatchScore", jobMatchScoreSchema);
