import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

// ==========================================
// 14 Core Resume Sections
// ==========================================

export interface IResumePersonal {
  fullName: string;
  professionalTitle?: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  website?: string;
  provenance?: any;
}

export interface IResumeExperience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements?: string;
  bullets: string[];
  provenance?: any;
}

export interface IResumeEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  provenance?: any;
}

export interface IResumeProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  role?: string;
  outcome?: string;
  url?: string;
  bullets: string[];
  provenance?: any;
}

export interface IResumeSkillItem {
  id: string;
  raw: string;
  normalized: string;
  category: string;
  proficiency?: string;
  provenance?: any;
  verified_status?: string;
}

export interface IResumeSkills {
  technical: string[];
  languages: string[];
  frameworks: string[];
  databases: string[];
  cloud: string[];
  tools: string[];
  soft: string[];
  structured?: IResumeSkillItem[];
}

export interface IResumeCertification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
  provenance?: any;
}

export interface IResumeAchievement {
  id: string;
  title: string;
  description: string;
  date?: string;
  bullets?: string[];
}

export interface IResumeInternship {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface IResumePublication {
  id: string;
  title: string;
  publisher: string;
  date: string;
  url?: string;
  description?: string;
}

export interface IResumeVolunteer {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface IResumeLanguageItem {
  id: string;
  language: string;
  proficiency: "Native" | "Fluent" | "Professional" | "Intermediate" | "Basic";
}

export interface IResumeCustomItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  description?: string;
  bullets?: string[];
}

export interface IResumeCustomSection {
  id: string;
  title: string;
  items: IResumeCustomItem[];
}

export interface IResumeProfileData {
  personal: IResumePersonal;
  summary: string;
  summaryProvenance?: any;
  experience: IResumeExperience[];
  education: IResumeEducation[];
  projects: IResumeProject[];
  skills: IResumeSkills;
  certifications: IResumeCertification[];
  achievements: IResumeAchievement[];
  internships: IResumeInternship[];
  publications: IResumePublication[];
  volunteer: IResumeVolunteer[];
  languages: IResumeLanguageItem[];
  interests: string[];
  customSections: IResumeCustomSection[];
}

export interface IResumeSectionConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

export interface IResumeTheme {
  primaryColor: string;
  textColor: string;
  headingColor: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

export interface IResumeLayout {
  pageSize: "A4" | "Letter";
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  sectionSpacing: number;
  paragraphSpacing: number;
  columnGap: number;
}

export interface IResumeATSAnalysis {
  categories: {
    parsing: number;
    structure: number;
    formatting: number;
    keywords: number;
    jobAlignment: number;
    content: number;
  };
  issues: {
    severity: "critical" | "high" | "medium" | "low";
    category: string;
    section: string;
    problem: string;
    whyItMatters: string;
    suggestedFix: string;
  }[];
  recommendations: string[];
  healthScore: number;
}

export type ResumeTemplateId =
  | "ats_classic"
  | "ats_modern"
  | "ats_minimal"
  | "modern_dev"
  | "software_eng"
  | "student"
  | "fresh_grad"
  | "experienced_pro"
  | "minimal"
  | "two_column"
  | "academic"
  | "executive"
  | "technical"
  | "creative"
  | "finance_consulting";

export interface IResume {
  _id: string;
  userId: string;
  name: string;
  targetRole: string;
  filename?: string;
  fileType?: string;
  storagePath?: string;
  rawText?: string;
  isScanned?: boolean;
  sourceDocumentId?: string;
  parsingStatus?: "pending" | "completed" | "failed" | "partial";
  verificationStatus?: "unverified" | "reviewing" | "verified";
  profileData: IResumeProfileData;
  sections: IResumeSectionConfig[];
  template: ResumeTemplateId;
  theme: IResumeTheme;
  layout: IResumeLayout;
  atsScore: number;
  atsAnalysis: IResumeATSAnalysis;
  version: number;
  status: "draft" | "active" | "archived";
  shareSlug?: string;
  isShared?: boolean;
  sharePasswordHash?: string;
  shareExpiresAt?: Date;
  shareViews?: number;
  originalDocxPath?: string;
  optimizedDocxPath?: string;
  latestOptimizationPlan?: any;
  beforeAfterReport?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Default values
export const defaultPersonal: IResumePersonal = {
  fullName: "",
  professionalTitle: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  portfolio: "",
  website: ""
};

export const defaultSkills: IResumeSkills = {
  technical: [],
  languages: [],
  frameworks: [],
  databases: [],
  cloud: [],
  tools: [],
  soft: [],
  structured: []
};

export const defaultSections: IResumeSectionConfig[] = [
  { id: "personal", name: "Personal Information", enabled: true, order: 0 },
  { id: "summary", name: "Professional Summary", enabled: true, order: 1 },
  { id: "experience", name: "Work Experience", enabled: true, order: 2 },
  { id: "education", name: "Education", enabled: true, order: 3 },
  { id: "projects", name: "Projects", enabled: true, order: 4 },
  { id: "skills", name: "Skills & Proficiencies", enabled: true, order: 5 },
  { id: "certifications", name: "Certifications", enabled: true, order: 6 },
  { id: "achievements", name: "Achievements & Awards", enabled: true, order: 7 },
  { id: "internships", name: "Internships", enabled: false, order: 8 },
  { id: "publications", name: "Publications", enabled: false, order: 9 },
  { id: "volunteer", name: "Volunteer Experience", enabled: false, order: 10 },
  { id: "languages", name: "Languages", enabled: true, order: 11 },
  { id: "interests", name: "Interests", enabled: false, order: 12 },
  { id: "customSections", name: "Custom Sections", enabled: false, order: 13 }
];

export const defaultTheme: IResumeTheme = {
  primaryColor: "#5b21b6", // Interview AI purple
  textColor: "#334155",
  headingColor: "#0f172a",
  fontFamily: "Inter",
  fontSize: 14,
  lineHeight: 1.5,
  letterSpacing: 0,
};

export const defaultLayout: IResumeLayout = {
  pageSize: "A4",
  margins: { top: 36, right: 36, bottom: 36, left: 36 },
  sectionSpacing: 16,
  paragraphSpacing: 8,
  columnGap: 24,
};

export const defaultATSAnalysis: IResumeATSAnalysis = {
  categories: {
    parsing: 0,
    structure: 0,
    formatting: 0,
    keywords: 0,
    jobAlignment: 0,
    content: 0
  },
  issues: [
    {
      severity: "critical",
      category: "Content",
      section: "personal",
      problem: "No content analyzed yet",
      whyItMatters: "An empty resume cannot pass applicant tracking systems",
      suggestedFix: "Fill in personal and experience details"
    }
  ],
  recommendations: ["Upload or complete resume sections to calculate ATS score"],
  healthScore: 0
};

// ==========================================
// Mongoose Schemas & Models
// ==========================================

const resumeSchema = new Schema<IResume>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    name: { type: String, required: true, default: "My Resume" },
    targetRole: { type: String, default: "Software Engineer", index: true },
    filename: { type: String },
    fileType: { type: String },
    storagePath: { type: String },
    rawText: { type: String },
    isScanned: { type: Boolean, default: false },
    sourceDocumentId: { type: String, index: true },
    parsingStatus: { type: String, enum: ["pending", "completed", "failed", "partial"], default: "completed" },
    verificationStatus: { type: String, enum: ["unverified", "reviewing", "verified"], default: "unverified" },
    profileData: {
      personal: { type: Object, default: defaultPersonal },
      summary: { type: String, default: "" },
      experience: { type: [Object], default: [] },
      education: { type: [Object], default: [] },
      projects: { type: [Object], default: [] },
      skills: { type: Object, default: defaultSkills },
      certifications: { type: [Object], default: [] },
      achievements: { type: [Object], default: [] },
      internships: { type: [Object], default: [] },
      publications: { type: [Object], default: [] },
      volunteer: { type: [Object], default: [] },
      languages: { type: [Object], default: [] },
      interests: { type: [String], default: [] },
      customSections: { type: [Object], default: [] }
    },
    sections: { type: [Object], default: defaultSections },
    template: {
      type: String,
      enum: [
        "ats_classic",
        "ats_modern",
        "ats_minimal",
        "modern_dev",
        "software_eng",
        "student",
        "fresh_grad",
        "experienced_pro",
        "minimal",
        "two_column",
        "academic",
        "executive",
        "technical",
        "creative",
        "finance_consulting"
      ],
      default: "ats_classic"
    },
    theme: { type: Object, default: defaultTheme },
    layout: { type: Object, default: defaultLayout },
    atsScore: { type: Number, default: 0 },
    atsAnalysis: { type: Object, default: defaultATSAnalysis },
    version: { type: Number, default: 1 },
    status: { type: String, enum: ["draft", "active", "archived"], default: "active" },
    shareSlug: { type: String, unique: true, sparse: true, index: true },
    isShared: { type: Boolean, default: false },
    sharePasswordHash: { type: String },
    shareExpiresAt: { type: Date },
    shareViews: { type: Number, default: 0 },
    originalDocxPath: { type: String },
    optimizedDocxPath: { type: String },
    latestOptimizationPlan: { type: Schema.Types.Mixed },
    beforeAfterReport: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

resumeSchema.index({ userId: 1, updatedAt: -1 });
resumeSchema.index({ userId: 1, targetRole: 1 });

export const Resume = mongoose.model<IResume>("Resume", resumeSchema);

// Resume Document Model (Immutable Upload)
export interface IResumeDocument {
  _id: string;
  userId: string;
  filename: string;
  mimeType: string;
  hash: string;
  storagePath: string;
  pageCount?: number;
  parserVersion?: string;
  schemaVersion?: string;
  createdAt: Date;
}

const resumeDocumentSchema = new Schema<IResumeDocument>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    hash: { type: String, required: true, index: true },
    storagePath: { type: String, required: true },
    pageCount: { type: Number },
    parserVersion: { type: String, default: "1.0" },
    schemaVersion: { type: String, default: "1.0" }
  },
  { timestamps: true }
);

export const ResumeDocument = mongoose.model<IResumeDocument>("ResumeDocument", resumeDocumentSchema);

// Resume Import Tracking
export interface IResumeImport {
  _id: string;
  userId: string;
  resumeId?: string;
  sourceDocumentId: string;
  status: "processing" | "success" | "partial" | "failed" | "duplicate";
  duplicateOf?: string;
  error?: string;
  warnings?: string[];
  parserVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const resumeImportSchema = new Schema<IResumeImport>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    resumeId: { type: String, ref: "Resume" },
    sourceDocumentId: { type: String, ref: "ResumeDocument", required: true },
    status: { type: String, enum: ["processing", "success", "partial", "failed", "duplicate"], required: true },
    duplicateOf: { type: String },
    error: { type: String },
    warnings: { type: [String], default: [] },
    parserVersion: { type: String, default: "1.0" }
  },
  { timestamps: true }
);

export const ResumeImport = mongoose.model<IResumeImport>("ResumeImport", resumeImportSchema);

// Resume Version Model
export interface IResumeVersion {
  _id: string;
  resumeId: string;
  userId: string;
  versionNumber: number;
  snapshot: any;
  atsScore: number;
  targetRole: string;
  name: string;
  template?: string;
  theme?: any;
  layout?: any;
  changeSummary?: string;
  createdAt: Date;
}

const resumeVersionSchema = new Schema<IResumeVersion>(
  {
    _id: { type: String, default: () => randomUUID() },
    resumeId: { type: String, ref: "Resume", required: true, index: true },
    userId: { type: String, ref: "User", required: true, index: true },
    versionNumber: { type: Number, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
    atsScore: { type: Number, default: 0 },
    targetRole: { type: String, default: "" },
    name: { type: String, default: "" },
    template: { type: String },
    theme: { type: Schema.Types.Mixed },
    layout: { type: Schema.Types.Mixed },
    changeSummary: { type: String, default: "" }
  },
  { timestamps: true }
);

resumeVersionSchema.index({ resumeId: 1, versionNumber: -1 });
resumeVersionSchema.index({ userId: 1, createdAt: -1 });

export const ResumeVersion = mongoose.model<IResumeVersion>("ResumeVersion", resumeVersionSchema);

// Resume Analysis / ATS Report Model
export interface IResumeAtsReport {
  _id: string;
  resumeId: string;
  userId: string;
  jobId?: string;
  resumeVersionId?: string;
  sourceDocumentId?: string;
  jobSnapshotHash?: string;
  parserVersion?: string;
  engineVersion?: string;
  scoringVersion?: string;
  overallScore: number;
  categories: {
    parsing: number;
    structure: number;
    formatting: number;
    keywords: number;
    jobAlignment: number;
    content: number;
  };
  issues: {
    severity: "critical" | "high" | "medium" | "low";
    category: string;
    section: string;
    problem: string;
    whyItMatters: string;
    suggestedFix: string;
  }[];
  recommendations: string[];
  createdAt: Date;
}

const resumeAtsReportSchema = new Schema<IResumeAtsReport>(
  {
    _id: { type: String, default: () => randomUUID() },
    resumeId: { type: String, ref: "Resume", required: true, index: true },
    userId: { type: String, ref: "User", required: true, index: true },
    jobId: { type: String, ref: "Job", index: true },
    resumeVersionId: { type: String, ref: "ResumeVersion", index: true },
    sourceDocumentId: { type: String, ref: "ResumeDocument", index: true },
    jobSnapshotHash: { type: String },
    parserVersion: { type: String },
    engineVersion: { type: String },
    scoringVersion: { type: String },
    overallScore: { type: Number, required: true },
    categories: { type: Object, required: true },
    issues: { type: [Object], default: [] },
    recommendations: { type: [String], default: [] }
  },
  { timestamps: true }
);

resumeAtsReportSchema.index({ resumeId: 1, createdAt: -1 });

export const ResumeAtsReport = mongoose.model<IResumeAtsReport>("ResumeAtsReport", resumeAtsReportSchema);

// Backward compatible alias
export const ResumeAnalysis = ResumeAtsReport;

// Resume Job Match Model
export interface IResumeJobMatch {
  _id: string;
  resumeId: string;
  userId: string;
  jobId?: string;
  jobTitle: string;
  companyName: string;
  matchScore: number;
  breakdown: {
    technicalSkills: number;
    roleAlignment: number;
    experience: number;
    projects: number;
    keywords: number;
    education: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  strongKeywords: string[];
  missingKeywords: string[];
  tailoringDiff?: {
    summary?: { current: string; proposed: string };
    experienceBullets?: { company: string; current: string; proposed: string }[];
    skillsToAdd?: string[];
  };
  createdAt: Date;
}

const resumeJobMatchSchema = new Schema<IResumeJobMatch>(
  {
    _id: { type: String, default: () => randomUUID() },
    resumeId: { type: String, ref: "Resume", required: true, index: true },
    userId: { type: String, ref: "User", required: true, index: true },
    jobId: { type: String, ref: "Job", index: true },
    jobTitle: { type: String, required: true },
    companyName: { type: String, default: "" },
    matchScore: { type: Number, required: true },
    breakdown: { type: Object, default: {} },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    strongKeywords: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] },
    tailoringDiff: { type: Object }
  },
  { timestamps: true }
);

resumeJobMatchSchema.index({ resumeId: 1, jobId: 1 });
resumeJobMatchSchema.index({ userId: 1, createdAt: -1 });

export const ResumeJobMatch = mongoose.model<IResumeJobMatch>("ResumeJobMatch", resumeJobMatchSchema);

// Resume Activity History Model
export interface IResumeActivity {
  _id: string;
  resumeId: string;
  userId: string;
  action: string;
  description: string;
  details?: Record<string, any>;
  createdAt: Date;
}

const resumeActivitySchema = new Schema<IResumeActivity>(
  {
    _id: { type: String, default: () => randomUUID() },
    resumeId: { type: String, ref: "Resume", required: true, index: true },
    userId: { type: String, ref: "User", required: true, index: true },
    action: { type: String, required: true },
    description: { type: String, required: true },
    details: { type: Object, default: {} }
  },
  { timestamps: true }
);

resumeActivitySchema.index({ resumeId: 1, createdAt: -1 });
resumeActivitySchema.index({ userId: 1, createdAt: -1 });

export const ResumeActivity = mongoose.model<IResumeActivity>("ResumeActivity", resumeActivitySchema);

// Resume Interview Questions Model
export interface IResumeInterviewQuestion {
  _id: string;
  resumeId: string;
  userId: string;
  jobTitle?: string;
  questions: {
    id: string;
    type: "technical" | "behavioral" | "followup";
    topic: string;
    sourceClaim: string;
    question: string;
    context: string;
    riskLevel?: "low" | "medium" | "high";
    preparationTip: string;
  }[];
  createdAt: Date;
}

const resumeInterviewQuestionSchema = new Schema<IResumeInterviewQuestion>(
  {
    _id: { type: String, default: () => randomUUID() },
    resumeId: { type: String, ref: "Resume", required: true, index: true },
    userId: { type: String, ref: "User", required: true, index: true },
    jobTitle: { type: String },
    questions: { type: [Object], default: [] }
  },
  { timestamps: true }
);

resumeInterviewQuestionSchema.index({ resumeId: 1, createdAt: -1 });

export const ResumeInterviewQuestion = mongoose.model<IResumeInterviewQuestion>(
  "ResumeInterviewQuestion",
  resumeInterviewQuestionSchema
);

// GitHub Profiles & Repositories Cache
export interface IGitHubProfile {
  _id: string;
  userId: string;
  username: string;
  name?: string;
  bio?: string;
  publicRepos: number;
  avatarUrl?: string;
  htmlUrl: string;
  cachedAt: Date;
}

const githubProfileSchema = new Schema<IGitHubProfile>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    username: { type: String, required: true },
    name: { type: String },
    bio: { type: String },
    publicRepos: { type: Number, default: 0 },
    avatarUrl: { type: String },
    htmlUrl: { type: String, required: true },
    cachedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

githubProfileSchema.index({ userId: 1, username: 1 });

export const GitHubProfile = mongoose.model<IGitHubProfile>("GitHubProfile", githubProfileSchema);

export interface IGitHubRepository {
  _id: string;
  userId: string;
  username: string;
  name: string;
  description?: string;
  language?: string;
  languages: string[];
  stars: number;
  forks: number;
  topics: string[];
  htmlUrl: string;
  updatedAtGitHub: string;
}

const githubRepositorySchema = new Schema<IGitHubRepository>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    username: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    language: { type: String },
    languages: { type: [String], default: [] },
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    topics: { type: [String], default: [] },
    htmlUrl: { type: String, required: true },
    updatedAtGitHub: { type: String }
  },
  { timestamps: true }
);

githubRepositorySchema.index({ userId: 1, username: 1, name: 1 });

export const GitHubRepository = mongoose.model<IGitHubRepository>("GitHubRepository", githubRepositorySchema);

// Resume Share Model
export interface IResumeShare {
  _id: string;
  resumeId: string;
  userId: string;
  slug: string;
  isPublic: boolean;
  passwordHash?: string;
  expiresAt?: Date;
  views: number;
  createdAt: Date;
}

const resumeShareSchema = new Schema<IResumeShare>(
  {
    _id: { type: String, default: () => randomUUID() },
    resumeId: { type: String, ref: "Resume", required: true, index: true },
    userId: { type: String, ref: "User", required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    isPublic: { type: Boolean, default: true },
    passwordHash: { type: String },
    expiresAt: { type: Date },
    views: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const ResumeShare = mongoose.model<IResumeShare>("ResumeShare", resumeShareSchema);

// Resume Chunk Model (for vector search fallback)
export interface IResumeChunk {
  _id: string;
  resumeId: string;
  userId: string;
  section?: string;
  chunkTitle?: string;
  chunkText: string;
  metadataJson: Record<string, any>;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const resumeChunkSchema = new Schema<IResumeChunk>(
  {
    _id: { type: String, default: () => randomUUID() },
    resumeId: { type: String, ref: "Resume", required: true, index: true },
    userId: { type: String, ref: "User", required: true, index: true },
    section: { type: String },
    chunkTitle: { type: String },
    chunkText: { type: String, required: true },
    metadataJson: { type: Object, default: {} },
    embedding: { type: [Number] }
  },
  { timestamps: true }
);

export const ResumeChunk = mongoose.model<IResumeChunk>("ResumeChunk", resumeChunkSchema);

// ==========================================
// Resume Optimization Runs & Changes
// ==========================================

export interface IResumeOptimizationRun {
  _id: string;
  originalResumeId: string;
  originalVersionId?: string;
  atsScanId?: string;
  userId: string;
  targetRole: string;
  jdText?: string;
  changes: Array<{
    id: string;
    section: string;
    targetId: string;
    originalText: string;
    proposedText: string;
    reason: string;
    evidence: string[];
    issueIds: string[];
    risk: string;
  }>;
  acceptedChanges: string[];
  rejectedChanges: string[];
  beforeScore: number;
  afterScore?: number;
  scoreDelta?: number;
  attemptCount: number;
  status: "pending_review" | "applied" | "rejected" | "regressed";
  explanation: string[];
  optimizedDocxPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

const resumeOptimizationRunSchema = new Schema<IResumeOptimizationRun>(
  {
    _id: { type: String, default: () => randomUUID() },
    originalResumeId: { type: String, ref: "Resume", required: true, index: true },
    originalVersionId: { type: String, ref: "ResumeVersion" },
    atsScanId: { type: String, ref: "ResumeAtsReport" },
    userId: { type: String, ref: "User", required: true, index: true },
    targetRole: { type: String, default: "Software Engineer" },
    jdText: { type: String, default: "" },
    changes: { type: [Object], default: [] },
    acceptedChanges: { type: [String], default: [] },
    rejectedChanges: { type: [String], default: [] },
    beforeScore: { type: Number, required: true },
    afterScore: { type: Number },
    scoreDelta: { type: Number },
    attemptCount: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["pending_review", "applied", "rejected", "regressed"],
      default: "pending_review"
    },
    explanation: { type: [String], default: [] },
    optimizedDocxPath: { type: String }
  },
  { timestamps: true }
);

resumeOptimizationRunSchema.index({ originalResumeId: 1, createdAt: -1 });
resumeOptimizationRunSchema.index({ userId: 1, createdAt: -1 });

export const ResumeOptimizationRun = mongoose.model<IResumeOptimizationRun>(
  "ResumeOptimizationRun",
  resumeOptimizationRunSchema
);

// Optimization Change
export interface IResumeOptimizationChange {
  _id: string;
  runId: string;
  resumeId: string;
  section: string;
  originalText: string;
  proposedText: string;
  appliedText?: string;
  reason: string;
  evidence: string[];
  status: "proposed" | "accepted" | "rejected" | "edited";
  createdAt: Date;
}

const resumeOptimizationChangeSchema = new Schema<IResumeOptimizationChange>(
  {
    _id: { type: String, default: () => randomUUID() },
    runId: { type: String, ref: "ResumeOptimizationRun", required: true, index: true },
    resumeId: { type: String, ref: "Resume", required: true, index: true },
    section: { type: String, required: true },
    originalText: { type: String, required: true },
    proposedText: { type: String, required: true },
    appliedText: { type: String },
    reason: { type: String, default: "" },
    evidence: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["proposed", "accepted", "rejected", "edited"],
      default: "proposed"
    }
  },
  { timestamps: true }
);

export const ResumeOptimizationChange = mongoose.model<IResumeOptimizationChange>(
  "ResumeOptimizationChange",
  resumeOptimizationChangeSchema
);

// Resume Export
export interface IResumeExport {
  _id: string;
  resumeId: string;
  userId: string;
  format: "docx" | "pdf" | "txt" | "json";
  fileName: string;
  filePath: string;
  isOptimized: boolean;
  createdAt: Date;
}

const resumeExportSchema = new Schema<IResumeExport>(
  {
    _id: { type: String, default: () => randomUUID() },
    resumeId: { type: String, ref: "Resume", required: true, index: true },
    userId: { type: String, ref: "User", required: true, index: true },
    format: { type: String, enum: ["docx", "pdf", "txt", "json"], required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    isOptimized: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const ResumeExport = mongoose.model<IResumeExport>("ResumeExport", resumeExportSchema);

// ==========================================
// ATS Resume Templates & Imports
// ==========================================

export interface IResumeTemplate {
  _id: string;
  id: string;
  name: string;
  category: "ATS" | "Technical" | "Executive" | "Modern" | "Minimal" | "Creative" | "Finance";
  description: string;
  layout: "single_column" | "two_column" | "minimal";
  atsCompatibilityScore: number;
  atsSafe: boolean;
  recommendedRoles: string[];
  typography: string;
  badge: string;
  badgeColor: string;
  features: string[];
  isAtsCertified: boolean;
  createdAt: Date;
}

const resumeTemplateSchema = new Schema<IResumeTemplate>(
  {
    _id: { type: String, default: () => randomUUID() },
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    description: { type: String, default: "" },
    layout: { type: String, default: "single_column" },
    atsCompatibilityScore: { type: Number, default: 95 },
    atsSafe: { type: Boolean, default: true },
    recommendedRoles: { type: [String], default: [] },
    typography: { type: String, default: "Calibri / Georgia" },
    badge: { type: String, default: "ATS Safe" },
    badgeColor: { type: String, default: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    features: { type: [String], default: [] },
    isAtsCertified: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const ResumeTemplate = mongoose.model<IResumeTemplate>("ResumeTemplate", resumeTemplateSchema);



// Resume Template Generation
export interface IResumeTemplateGeneration {
  _id: string;
  userId?: string;
  resumeId: string;
  templateId: string;
  sourceResumeId?: string;
  canonicalDataSnapshot: IResumeProfileData;
  atsScore: number;
  atsReport?: any;
  createdAt: Date;
  updatedAt: Date;
}

const resumeTemplateGenerationSchema = new Schema<IResumeTemplateGeneration>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, index: true },
    resumeId: { type: String, ref: "Resume", required: true, index: true },
    templateId: { type: String, required: true, index: true },
    sourceResumeId: { type: String },
    canonicalDataSnapshot: { type: Schema.Types.Mixed, required: true },
    atsScore: { type: Number, default: 0 },
    atsReport: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const ResumeTemplateGeneration = mongoose.model<IResumeTemplateGeneration>(
  "ResumeTemplateGeneration",
  resumeTemplateGenerationSchema
);

// ==========================================
// Day 9: Generated Resume Artifact
// ==========================================

export interface IResumeArtifact {
  _id: string;
  userId: string;
  resumeId: string;
  resumeVersionId: string;
  templateId: string;
  templateVersion: string;
  pageSize: "A4" | "Letter";
  artifactType: "PDF" | "DOCX" | "PREVIEW";
  rendererVersion: string;
  storageKey: string;
  artifactHash: string;
  atsValidationStatus?: {
    parsing: string;
    structure: string;
    formattingRisk: string;
  };
  atsScanId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const resumeArtifactSchema = new Schema<IResumeArtifact>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true, index: true },
    resumeId: { type: String, required: true, index: true },
    resumeVersionId: { type: String, required: true, index: true },
    templateId: { type: String, required: true, index: true },
    templateVersion: { type: String, required: true },
    pageSize: { type: String, enum: ["A4", "Letter"], default: "A4" },
    artifactType: { type: String, enum: ["PDF", "DOCX", "PREVIEW"], required: true },
    rendererVersion: { type: String, required: true },
    storageKey: { type: String, required: true },
    artifactHash: { type: String, required: true, index: true },
    atsValidationStatus: { type: Schema.Types.Mixed },
    atsScanId: { type: String }
  },
  { timestamps: true }
);

export const ResumeArtifact = mongoose.model<IResumeArtifact>("ResumeArtifact", resumeArtifactSchema);
