import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export interface ICategoryScoreDetail {
  score: number;
  maxScore: number;
  percentage: number;
  summary: string;
  issuesCount: number;
}

export interface IATSIssueItem {
  issueId: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  evidence: string;
  affectedSection: string;
  recommendation: string;
  pointsImpact: number;
  beforeExample?: string;
  afterExample?: string;
}

export interface IKeywordAnalysis {
  mode: "GENERAL" | "JOB_SPECIFIC";
  targetRole: string;
  jdMatchScore?: number;
  requiredKeywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  partiallyMatchedKeywords?: string[];
  stuffedKeywords?: Array<{ term: string; count: number }>;
}

export interface ISectionAnalysisItem {
  sectionName: string;
  status: "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" | "MISSING";
  whatIsGood: string;
  whatIsWrong: string;
  recommendation: string;
}

export interface IImprovementRoadmapItem {
  priority: number;
  title: string;
  category: string;
  description: string;
  action: string;
}

export interface IResumeAnalysis {
  _id: string;
  userId: string;
  resumeId?: string;
  jobId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  analysisMode: "GENERAL" | "JOB_SPECIFIC";
  targetRole: string;
  jobDescriptionText?: string;
  overallScore: number;
  scoreBand: "Excellent" | "Very Good" | "Good" | "Needs Improvement" | "Weak" | "Poor";
  categoryScores: {
    keywordsSkills: ICategoryScoreDetail;
    resumeStructure: ICategoryScoreDetail;
    experienceProjects: ICategoryScoreDetail;
    formattingReadability: ICategoryScoreDetail;
    educationCertifications: ICategoryScoreDetail;
    contactInfo: ICategoryScoreDetail;
    grammarClarity: ICategoryScoreDetail;
  };
  strengths: string[];
  issues: IATSIssueItem[];
  keywordAnalysis: IKeywordAnalysis;
  sectionAnalysis: ISectionAnalysisItem[];
  improvementRoadmap: IImprovementRoadmapItem[];
  extractedResumeData: any;
  rawText: string;
  previousAnalysisId?: string;
  beforeScore?: number;
  afterScore?: number;
  scoringVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const resumeAnalysisSchema = new Schema<IResumeAnalysis>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    resumeId: { type: String, ref: "Resume", index: true },
    jobId: { type: String, ref: "Job", index: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    fileType: { type: String, default: "pdf" },
    analysisMode: { type: String, enum: ["GENERAL", "JOB_SPECIFIC"], default: "GENERAL" },
    targetRole: { type: String, default: "Software Engineer" },
    jobDescriptionText: { type: String },
    overallScore: { type: Number, required: true, min: 0, max: 100 },
    scoreBand: { type: String, required: true },
    categoryScores: {
      keywordsSkills: { type: Object, required: true },
      resumeStructure: { type: Object, required: true },
      experienceProjects: { type: Object, required: true },
      formattingReadability: { type: Object, required: true },
      educationCertifications: { type: Object, required: true },
      contactInfo: { type: Object, required: true },
      grammarClarity: { type: Object, required: true },
    },
    strengths: { type: [String], default: [] },
    issues: { type: [Object], default: [] },
    keywordAnalysis: { type: Object, required: true },
    sectionAnalysis: { type: [Object], default: [] },
    improvementRoadmap: { type: [Object], default: [] },
    extractedResumeData: { type: Object, default: {} },
    rawText: { type: String, default: "" },
    previousAnalysisId: { type: String, ref: "ResumeAnalysis" },
    beforeScore: { type: Number },
    afterScore: { type: Number },
    scoringVersion: { type: String, default: "3.0-deterministic" },
  },
  { timestamps: true }
);

resumeAnalysisSchema.index({ userId: 1, createdAt: -1 });

export const ResumeAnalysisModel =
  mongoose.models.ResumeAnalysis ||
  mongoose.model<IResumeAnalysis>("ResumeAnalysis", resumeAnalysisSchema);
