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
