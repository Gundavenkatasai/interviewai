import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export interface ILinkedInPublicData {
  name: string;
  headline: string;
  location: string;
  about: string;
  currentCompany?: string;
  currentRole?: string;
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    location?: string;
    description: string;
    bullets?: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    duration?: string;
  }>;
  skills: string[];
  certifications?: Array<{
    name: string;
    issuer: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
  }>;
  publicProfilePhoto?: string;
  followerCount?: string;
  publicUrl?: string;
}

export interface ILinkedInProfile {
  _id: string;
  userId: string;
  profileUrl: string;
  publicData: ILinkedInPublicData;
  rawScrapedText: string;
  fetchedAt: Date;
  sourceStatus: "SUCCESS" | "PARTIAL" | "NOT_PUBLIC" | "BLOCKED" | "INVALID_URL" | "TEMPORARY_ERROR";
  dataConfidence: "high" | "medium" | "low";
  source: "agent_reach" | "public_scraper" | "pasted" | "upload";
  createdAt: Date;
  updatedAt: Date;
}

const linkedInProfileSchema = new Schema<ILinkedInProfile>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    profileUrl: { type: String, required: true, index: true },
    publicData: { type: Object, required: true },
    rawScrapedText: { type: String, default: "" },
    fetchedAt: { type: Date, default: Date.now, index: true },
    sourceStatus: {
      type: String,
      enum: ["SUCCESS", "PARTIAL", "NOT_PUBLIC", "BLOCKED", "INVALID_URL", "TEMPORARY_ERROR"],
      default: "SUCCESS"
    },
    dataConfidence: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "high"
    },
    source: {
      type: String,
      enum: ["agent_reach", "public_scraper", "pasted", "upload"],
      default: "agent_reach"
    }
  },
  { timestamps: true }
);

linkedInProfileSchema.index({ userId: 1, profileUrl: 1 });
linkedInProfileSchema.index({ userId: 1, fetchedAt: -1 });

export const LinkedInProfile = mongoose.model<ILinkedInProfile>("LinkedInProfile", linkedInProfileSchema);

// LinkedIn Analysis
export interface ILinkedInAnalysis {
  _id: string;
  userId: string;
  profileId: string;
  score: number;
  scoreVersion: string;
  sectionScores: {
    headline: number;
    about: number;
    experience: number;
    skills: number;
    projects: number;
    education: number;
    keywords: number;
    completeness: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  headlineAnalysis: {
    current: string;
    score: number;
    problems: string[];
    suggestedVersions: string[];
  };
  aboutAnalysis: {
    current: string;
    score: number;
    problems: string[];
    suggestedAbout: string;
  };
  experienceAnalysis: Array<{
    company: string;
    role: string;
    duration: string;
    score: number;
    problems: string[];
    suggestedImprovements: string[];
  }>;
  skillsAnalysis: {
    currentSkills: string[];
    strongSkills: string[];
    missingSkills: string[];
    marketDemand: Array<{
      skill: string;
      demandLevel: "High" | "Medium" | "Low";
      userStatus: "Present" | "Gap";
      frequencyPercentage: number;
    }>;
  };
  consistencyAnalysis: {
    titleMismatch?: { resume: string; linkedin: string };
    locationMismatch?: { profile: string; linkedin: string };
    missingExperienceInResume: string[];
    missingSkillsInProfile: string[];
    overallConsistencyScore: number;
  };
  createdAt: Date;
}

const linkedInAnalysisSchema = new Schema<ILinkedInAnalysis>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    profileId: { type: String, ref: "LinkedInProfile", required: true, index: true },
    score: { type: Number, required: true, index: true },
    scoreVersion: { type: String, default: "1.0.0" },
    sectionScores: { type: Object, required: true },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    headlineAnalysis: { type: Object, default: {} },
    aboutAnalysis: { type: Object, default: {} },
    experienceAnalysis: { type: [Object], default: [] },
    skillsAnalysis: { type: Object, default: {} },
    consistencyAnalysis: { type: Object, default: {} }
  },
  { timestamps: true }
);

linkedInAnalysisSchema.index({ userId: 1, createdAt: -1 });
linkedInAnalysisSchema.index({ userId: 1, score: -1 });

export const LinkedInAnalysis = mongoose.model<ILinkedInAnalysis>("LinkedInAnalysis", linkedInAnalysisSchema);

// LinkedIn Analysis Versions
export interface ILinkedInAnalysisVersion {
  _id: string;
  profileId: string;
  userId: string;
  snapshot: any;
  score: number;
  createdAt: Date;
}

const linkedInAnalysisVersionSchema = new Schema<ILinkedInAnalysisVersion>(
  {
    _id: { type: String, default: () => randomUUID() },
    profileId: { type: String, ref: "LinkedInProfile", required: true, index: true },
    userId: { type: String, ref: "User", required: true, index: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
    score: { type: Number, required: true }
  },
  { timestamps: true }
);

linkedInAnalysisVersionSchema.index({ profileId: 1, createdAt: -1 });

export const LinkedInAnalysisVersion = mongoose.model<ILinkedInAnalysisVersion>(
  "LinkedInAnalysisVersion",
  linkedInAnalysisVersionSchema
);

// 1. LinkedIn Profile Snapshot
export interface ILinkedInProfileSnapshot {
  _id: string;
  userId: string;
  profileId: string;
  data: any;
  source: string;
  createdAt: Date;
}
const profileSnapshotSchema = new Schema<ILinkedInProfileSnapshot>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    profileId: { type: String, required: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    source: { type: String, default: "IMPORT" },
  },
  { timestamps: true }
);
profileSnapshotSchema.index({ userId: 1, createdAt: -1 });
export const LinkedInProfileSnapshot = mongoose.model<ILinkedInProfileSnapshot>("LinkedInProfileSnapshot", profileSnapshotSchema);

// 2. LinkedIn Recommendations
export interface ILinkedInRecommendation {
  _id: string;
  userId: string;
  analysisId: string;
  field: "headline" | "about" | "experience" | "skills" | "custom_url" | "photo" | "banner" | "featured" | "recommendations";
  currentValue: string;
  proposedValue: string;
  reason: string;
  evidence: string;
  source: string;
  confidence: number;
  requiresApproval: boolean;
  status: "SUGGESTED" | "USER_EDITED" | "USER_APPROVED" | "USER_REJECTED" | "APPLIED";
  appliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
const recommendationSchema = new Schema<ILinkedInRecommendation>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    analysisId: { type: String, required: true, index: true },
    field: { type: String, required: true },
    currentValue: { type: String, default: "" },
    proposedValue: { type: String, required: true },
    reason: { type: String, required: true },
    evidence: { type: String, default: "" },
    source: { type: String, default: "skills/linkedin-profile-optimizer" },
    confidence: { type: Number, default: 0.9 },
    requiresApproval: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["SUGGESTED", "USER_EDITED", "USER_APPROVED", "USER_REJECTED", "APPLIED"],
      default: "SUGGESTED",
      index: true,
    },
    appliedAt: { type: Date },
  },
  { timestamps: true }
);
recommendationSchema.index({ userId: 1, status: 1 });
recommendationSchema.index({ userId: 1, analysisId: 1 });
export const LinkedInRecommendation = mongoose.model<ILinkedInRecommendation>("LinkedInRecommendation", recommendationSchema);

// 3. LinkedIn Content Draft
export interface ILinkedInContentDraft {
  _id: string;
  userId: string;
  skill: string;
  topic: string;
  audience: string;
  goal: string;
  formulaCode?: string;
  hookType?: string;
  body: string;
  originalBody?: string;
  characterCount: number;
  humanizationStatus: "PENDING" | "HUMANIZED" | "SKIPPED";
  humanizedBody?: string;
  humanizerNotes?: string;
  auditStatus: "PENDING" | "PASSED" | "WARNINGS" | "FAILED";
  auditNotes?: string;
  approvalStatus: "DRAFT" | "REVIEW" | "USER_EDITED" | "APPROVED" | "EXECUTING" | "COMPLETED" | "FAILED" | "REJECTED" | "CANCELLED";
  publicationStatus: "UNPUBLISHED" | "SCHEDULED" | "PUBLISHED" | "FAILED";
  publishedAt?: Date;
  scheduledTime?: Date;
  sourceContext?: any;
  storyBankId?: string;
  mediaAssetId?: string;
  createdAt: Date;
  updatedAt: Date;
}
const contentDraftSchema = new Schema<ILinkedInContentDraft>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    skill: { type: String, default: "linkedin-post-writer" },
    topic: { type: String, required: true },
    audience: { type: String, default: "engineers" },
    goal: { type: String, default: "comments" },
    formulaCode: { type: String },
    hookType: { type: String },
    body: { type: String, required: true },
    originalBody: { type: String },
    characterCount: { type: Number, default: 0 },
    humanizationStatus: { type: String, enum: ["PENDING", "HUMANIZED", "SKIPPED"], default: "PENDING" },
    humanizedBody: { type: String },
    humanizerNotes: { type: String },
    auditStatus: { type: String, enum: ["PENDING", "PASSED", "WARNINGS", "FAILED"], default: "PENDING" },
    auditNotes: { type: String },
    approvalStatus: {
      type: String,
      enum: ["DRAFT", "REVIEW", "USER_EDITED", "APPROVED", "EXECUTING", "COMPLETED", "FAILED", "REJECTED", "CANCELLED"],
      default: "DRAFT",
      index: true,
    },
    publicationStatus: {
      type: String,
      enum: ["UNPUBLISHED", "SCHEDULED", "PUBLISHED", "FAILED"],
      default: "UNPUBLISHED",
      index: true,
    },
    publishedAt: { type: Date },
    scheduledTime: { type: Date },
    sourceContext: { type: Schema.Types.Mixed },
    storyBankId: { type: String },
    mediaAssetId: { type: String },
  },
  { timestamps: true }
);
contentDraftSchema.index({ userId: 1, createdAt: -1 });
contentDraftSchema.index({ userId: 1, approvalStatus: 1 });
export const LinkedInContentDraft = mongoose.model<ILinkedInContentDraft>("LinkedInContentDraft", contentDraftSchema);

// 4. LinkedIn Content Calendar Plan
export interface ILinkedInContentPlan {
  _id: string;
  userId: string;
  daysCount: number;
  timezone: string;
  items: Array<{
    day: number;
    date: string;
    topic: string;
    pillar: string;
    format: string;
    formulaCode: string;
    hook: string;
    objective: string;
    storyEvidence?: string;
    status: "PLANNED" | "DRAFTED" | "PUBLISHED";
    draftId?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
const contentPlanSchema = new Schema<ILinkedInContentPlan>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    daysCount: { type: Number, default: 7 },
    timezone: { type: String, default: "UTC" },
    items: { type: [Object], default: [] },
  },
  { timestamps: true }
);
contentPlanSchema.index({ userId: 1, createdAt: -1 });
export const LinkedInContentPlan = mongoose.model<ILinkedInContentPlan>("LinkedInContentPlan", contentPlanSchema);

// 5. LinkedIn Publication Record
export interface ILinkedInPublication {
  _id: string;
  userId: string;
  draftId?: string;
  kind: "post" | "comment" | "reply" | "reshare";
  mode: "publora" | "manual" | "diy";
  postGroupId?: string;
  targetUrl: string;
  draftText: string;
  scheduledTime?: Date;
  publishedAt?: Date;
  status: "SUCCESS" | "MANUAL_REQUIRED" | "FAILED";
  auditTrail: Array<{
    timestamp: Date;
    event: string;
    details?: any;
  }>;
  createdAt: Date;
}
const publicationSchema = new Schema<ILinkedInPublication>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    draftId: { type: String },
    kind: { type: String, enum: ["post", "comment", "reply", "reshare"], required: true },
    mode: { type: String, enum: ["publora", "manual", "diy"], required: true },
    postGroupId: { type: String },
    targetUrl: { type: String, required: true },
    draftText: { type: String, required: true },
    scheduledTime: { type: Date },
    publishedAt: { type: Date },
    status: { type: String, enum: ["SUCCESS", "MANUAL_REQUIRED", "FAILED"], default: "SUCCESS" },
    auditTrail: { type: [Object], default: [] },
  },
  { timestamps: true }
);
publicationSchema.index({ userId: 1, createdAt: -1 });
export const LinkedInPublication = mongoose.model<ILinkedInPublication>("LinkedInPublication", publicationSchema);

// 6. LinkedIn Comment & Reply Drafts
export interface ILinkedInCommentDraft {
  _id: string;
  userId: string;
  postUrl: string;
  postUrn?: string;
  postAuthor?: string;
  postSnippet?: string;
  commentText: string;
  angle: string;
  approvalStatus: "DRAFT" | "APPROVED" | "REJECTED";
  publishedStatus: "PENDING" | "COPIED" | "PUBLISHED";
  publishedAt?: Date;
  createdAt: Date;
}
const commentDraftSchema = new Schema<ILinkedInCommentDraft>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    postUrl: { type: String, required: true },
    postUrn: { type: String },
    postAuthor: { type: String },
    postSnippet: { type: String },
    commentText: { type: String, required: true },
    angle: { type: String, default: "insight" },
    approvalStatus: { type: String, enum: ["DRAFT", "APPROVED", "REJECTED"], default: "DRAFT" },
    publishedStatus: { type: String, enum: ["PENDING", "COPIED", "PUBLISHED"], default: "PENDING" },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);
commentDraftSchema.index({ userId: 1, createdAt: -1 });
export const LinkedInCommentDraft = mongoose.model<ILinkedInCommentDraft>("LinkedInCommentDraft", commentDraftSchema);

export interface ILinkedInReplyDraft {
  _id: string;
  userId: string;
  postUrl: string;
  postUrn?: string;
  parentCommentId?: string;
  parentCommentUrn?: string;
  parentAuthor?: string;
  parentSnippet?: string;
  replyText: string;
  angle: string;
  approvalStatus: "DRAFT" | "APPROVED" | "REJECTED";
  publishedStatus: "PENDING" | "COPIED" | "PUBLISHED";
  publishedAt?: Date;
  createdAt: Date;
}
const replyDraftSchema = new Schema<ILinkedInReplyDraft>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    postUrl: { type: String, required: true },
    postUrn: { type: String },
    parentCommentId: { type: String },
    parentCommentUrn: { type: String },
    parentAuthor: { type: String },
    parentSnippet: { type: String },
    replyText: { type: String, required: true },
    angle: { type: String, default: "helpful" },
    approvalStatus: { type: String, enum: ["DRAFT", "APPROVED", "REJECTED"], default: "DRAFT" },
    publishedStatus: { type: String, enum: ["PENDING", "COPIED", "PUBLISHED"], default: "PENDING" },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);
replyDraftSchema.index({ userId: 1, createdAt: -1 });
export const LinkedInReplyDraft = mongoose.model<ILinkedInReplyDraft>("LinkedInReplyDraft", replyDraftSchema);

// 7. LinkedIn Thread Monitor
export interface ILinkedInThread {
  _id: string;
  userId: string;
  postUrl: string;
  postUrn?: string;
  userCommentUrn?: string;
  author: string;
  replyStatus: "AWAITING_REPLY" | "REPLY_RECEIVED" | "RESOLVED";
  detectedResponse?: string;
  suggestedFollowUp?: string;
  dueTime?: Date;
  actionStatus: "PENDING" | "ACTED" | "DISMISSED";
  lastCheckedAt?: Date;
  createdAt: Date;
}
const threadSchema = new Schema<ILinkedInThread>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    postUrl: { type: String, required: true },
    postUrn: { type: String },
    userCommentUrn: { type: String },
    author: { type: String, default: "Unknown" },
    replyStatus: { type: String, enum: ["AWAITING_REPLY", "REPLY_RECEIVED", "RESOLVED"], default: "AWAITING_REPLY" },
    detectedResponse: { type: String },
    suggestedFollowUp: { type: String },
    dueTime: { type: Date },
    actionStatus: { type: String, enum: ["PENDING", "ACTED", "DISMISSED"], default: "PENDING" },
    lastCheckedAt: { type: Date },
  },
  { timestamps: true }
);
threadSchema.index({ userId: 1, replyStatus: 1 });
export const LinkedInThread = mongoose.model<ILinkedInThread>("LinkedInThread", threadSchema);

// 8. LinkedIn Engager Analytics
export interface ILinkedInEngager {
  _id: string;
  userId: string;
  name: string;
  headline: string;
  profileUrl: string;
  company: string;
  role: string;
  icpCategory: "RECRUITER" | "HIRING_MANAGER" | "PEER" | "FOUNDER" | "OTHER";
  relevanceScore: number;
  actionRecommendation: string;
  connectionStatus: "NOT_CONNECTED" | "INVITED" | "CONNECTED";
  source: string;
  createdAt: Date;
}
const engagerSchema = new Schema<ILinkedInEngager>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    headline: { type: String, default: "" },
    profileUrl: { type: String, default: "" },
    company: { type: String, default: "Unknown" },
    role: { type: String, default: "Unknown" },
    icpCategory: {
      type: String,
      enum: ["RECRUITER", "HIRING_MANAGER", "PEER", "FOUNDER", "OTHER"],
      default: "PEER",
    },
    relevanceScore: { type: Number, default: 50 },
    actionRecommendation: { type: String, default: "Review engagement" },
    connectionStatus: {
      type: String,
      enum: ["NOT_CONNECTED", "INVITED", "CONNECTED"],
      default: "NOT_CONNECTED",
    },
    source: { type: String, default: "ENGAGER_ANALYTICS" },
  },
  { timestamps: true }
);
engagerSchema.index({ userId: 1, relevanceScore: -1 });
export const LinkedInEngager = mongoose.model<ILinkedInEngager>("LinkedInEngager", engagerSchema);

// 9. LinkedIn Integration Settings
export interface ILinkedInIntegrationSettings {
  _id: string;
  userId: string;
  readProvider: "MANUAL" | "APIFY";
  publishProvider: "MANUAL" | "PUBLORA" | "CUSTOM";
  mediaProvider: "MANUAL" | "PIXFARO";
  approvalMode: "STRICT" | "PERMISSIVE";
  apifyTokenMasked?: string;
  publoraApiKeyMasked?: string;
  linkedinPlatformIdMasked?: string;
  pixfaroTokenMasked?: string;
  customPosterCommand?: string;
  enabledSkills: string[];
  createdAt: Date;
  updatedAt: Date;
}
const settingsSchema = new Schema<ILinkedInIntegrationSettings>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, unique: true, index: true },
    readProvider: { type: String, enum: ["MANUAL", "APIFY"], default: "MANUAL" },
    publishProvider: { type: String, enum: ["MANUAL", "PUBLORA", "CUSTOM"], default: "MANUAL" },
    mediaProvider: { type: String, enum: ["MANUAL", "PIXFARO"], default: "MANUAL" },
    approvalMode: { type: String, enum: ["STRICT", "PERMISSIVE"], default: "STRICT" },
    apifyTokenMasked: { type: String },
    publoraApiKeyMasked: { type: String },
    linkedinPlatformIdMasked: { type: String },
    pixfaroTokenMasked: { type: String },
    customPosterCommand: { type: String },
    enabledSkills: { type: [String], default: [] },
  },
  { timestamps: true }
);
export const LinkedInIntegrationSettings = mongoose.model<ILinkedInIntegrationSettings>(
  "LinkedInIntegrationSettings",
  settingsSchema
);

// 10. LinkedIn Execution Logs
export interface ILinkedInExecution {
  _id: string;
  executionId: string;
  userId: string;
  skillName: string;
  command: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  progressStep: number;
  stage: string;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  provider?: string;
  fallbackUsed: boolean;
  cost?: string;
  errorCode?: string;
  errorMessage?: string;
  inputParams?: any;
  outputResult?: any;
  createdAt: Date;
}
const executionSchema = new Schema<ILinkedInExecution>(
  {
    _id: { type: String, default: () => randomUUID() },
    executionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    skillName: { type: String, required: true },
    command: { type: String, required: true },
    status: {
      type: String,
      enum: ["QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"],
      default: "QUEUED",
      index: true,
    },
    progressStep: { type: Number, default: 0 },
    stage: { type: String, default: "INITIATING" },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    durationMs: { type: Number },
    provider: { type: String },
    fallbackUsed: { type: Boolean, default: false },
    cost: { type: String },
    errorCode: { type: String },
    errorMessage: { type: String },
    inputParams: { type: Schema.Types.Mixed },
    outputResult: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);
executionSchema.index({ userId: 1, startTime: -1 });
export const LinkedInExecution = mongoose.model<ILinkedInExecution>("LinkedInExecution", executionSchema);

// 11. LinkedIn Approval Record
export interface ILinkedInApproval {
  _id: string;
  userId: string;
  resourceType: "DRAFT" | "RECOMMENDATION" | "COMMENT" | "REPLY";
  resourceId: string;
  status: "APPROVED" | "REJECTED";
  approvedAt: Date;
  approvedBy: string;
  userNotes?: string;
  createdAt: Date;
}
const approvalSchema = new Schema<ILinkedInApproval>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    resourceType: { type: String, enum: ["DRAFT", "RECOMMENDATION", "COMMENT", "REPLY"], required: true },
    resourceId: { type: String, required: true, index: true },
    status: { type: String, enum: ["APPROVED", "REJECTED"], required: true },
    approvedAt: { type: Date, default: Date.now },
    approvedBy: { type: String, required: true },
    userNotes: { type: String },
  },
  { timestamps: true }
);
approvalSchema.index({ userId: 1, resourceId: 1 });
export const LinkedInApproval = mongoose.model<ILinkedInApproval>("LinkedInApproval", approvalSchema);

// 12. LinkedIn Media Asset
export interface ILinkedInMediaAsset {
  _id: string;
  userId: string;
  provider: "pixfaro" | "manual" | "upload";
  assetType: "illustration" | "quote_card" | "banner";
  prompt: string;
  url?: string;
  cost?: string;
  status: "PENDING" | "READY" | "FAILED";
  createdAt: Date;
}
const mediaAssetSchema = new Schema<ILinkedInMediaAsset>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    provider: { type: String, enum: ["pixfaro", "manual", "upload"], default: "manual" },
    assetType: { type: String, enum: ["illustration", "quote_card", "banner"], default: "illustration" },
    prompt: { type: String, required: true },
    url: { type: String },
    cost: { type: String },
    status: { type: String, enum: ["PENDING", "READY", "FAILED"], default: "READY" },
  },
  { timestamps: true }
);
mediaAssetSchema.index({ userId: 1, createdAt: -1 });
export const LinkedInMediaAsset = mongoose.model<ILinkedInMediaAsset>("LinkedInMediaAsset", mediaAssetSchema);

// 13. LinkedIn Story Reference
export interface ILinkedInStoryReference {
  _id: string;
  userId: string;
  draftId: string;
  storyId: string;
  claimedFacts: string[];
  verified: boolean;
  createdAt: Date;
}
const storyReferenceSchema = new Schema<ILinkedInStoryReference>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    draftId: { type: String, required: true, index: true },
    storyId: { type: String, required: true, index: true },
    claimedFacts: { type: [String], default: [] },
    verified: { type: Boolean, default: true },
  },
  { timestamps: true }
);
storyReferenceSchema.index({ userId: 1, draftId: 1 });
export const LinkedInStoryReference = mongoose.model<ILinkedInStoryReference>("LinkedInStoryReference", storyReferenceSchema);

