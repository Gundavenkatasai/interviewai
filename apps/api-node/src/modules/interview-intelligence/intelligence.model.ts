import mongoose, { Schema, Document } from "mongoose";

export type IntelligenceStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED" | "STALE";
export type QuestionPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type TopicDepth = "AWARENESS" | "FUNDAMENTALS" | "PRACTICAL" | "ADVANCED" | "SYSTEM_DESIGN";

export interface IPrepPriority {
  priorityLevel: QuestionPriority;
  reason: string;
  recommendedAction: string;
  sourceType: "JD" | "RESUME" | "GAP" | "HISTORY";
  evidenceIds: string[];
  estimatedMinutes: number;
}

export interface IPrepTopic {
  topic: string;
  category: "TECHNICAL" | "BEHAVIORAL" | "PROJECT" | "MOTIVATION" | "SYSTEM_DESIGN";
  importance: "HIGH" | "MEDIUM" | "LOW";
  candidateStrength: "STRONG" | "ADEQUATE" | "WEAK" | "UNKNOWN";
  recommendedDepth: TopicDepth;
  evidenceIds: string[];
}

export interface IPrepQuestion {
  question: string;
  category: string; // INTRO, MOTIVATION, RESUME, PROJECT, TECHNICAL, CODING, SYSTEM_DESIGN, BEHAVIORAL, ROLE_SPECIFIC, FOLLOW_UP
  priority: QuestionPriority;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  competency: string;
  whyLikely: string;
  evidenceIds: string[];
}

export interface IReadinessBreakdown {
  technical: number;
  behavioral: number;
  resumeDefensibility: number;
  roleUnderstanding: number;
  evidenceCoverage: number;
}

export interface IInterviewIntelligence extends Document {
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  jobSnapshotId: mongoose.Types.ObjectId;
  resumeVersionId: mongoose.Types.ObjectId;
  
  interviewType: string; // HR_SCREEN, HIRING_MANAGER, TECHNICAL, etc.
  targetRole: string;
  seniority: string;

  inputFingerprint: string; // hash(jobSnapshotId + resumeVersionId + interviewType)
  status: IntelligenceStatus;
  
  readinessScore: number;
  readinessState: "NOT_READY" | "NEEDS_PREPARATION" | "PARTIALLY_READY" | "READY" | "STRONGLY_READY" | "UNKNOWN";
  readinessBreakdown: IReadinessBreakdown;

  priorities: IPrepPriority[];
  topics: IPrepTopic[];
  likelyQuestions: IPrepQuestion[];
  interviewerQuestions: IPrepQuestion[]; // questions candidate should ask

  cheatSheet: {
    strengths: string[];
    gaps: string[];
    resumeClaims: string[];
  };

  error?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PrepPrioritySchema = new Schema<IPrepPriority>({
  priorityLevel: { type: String, required: true },
  reason: { type: String, required: true },
  recommendedAction: { type: String, required: true },
  sourceType: { type: String, required: true },
  evidenceIds: [{ type: String }],
  estimatedMinutes: { type: Number, default: 15 }
}, { _id: false });

const PrepTopicSchema = new Schema<IPrepTopic>({
  topic: { type: String, required: true },
  category: { type: String, required: true },
  importance: { type: String, required: true },
  candidateStrength: { type: String, required: true },
  recommendedDepth: { type: String, required: true },
  evidenceIds: [{ type: String }]
}, { _id: false });

const PrepQuestionSchema = new Schema<IPrepQuestion>({
  question: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, required: true },
  difficulty: { type: String, required: true },
  competency: { type: String, required: true },
  whyLikely: { type: String, required: true },
  evidenceIds: [{ type: String }]
}, { _id: false });

const InterviewIntelligenceSchema = new Schema<IInterviewIntelligence>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
  jobSnapshotId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
  resumeVersionId: { type: Schema.Types.ObjectId, ref: "ResumeVersion", required: true },
  
  interviewType: { type: String, default: "GENERAL" },
  targetRole: { type: String },
  seniority: { type: String },

  inputFingerprint: { type: String, required: true, unique: true },
  status: { type: String, default: "PENDING" },

  readinessScore: { type: Number, default: 0 },
  readinessState: { type: String, default: "UNKNOWN" },
  readinessBreakdown: {
    technical: { type: Number, default: 0 },
    behavioral: { type: Number, default: 0 },
    resumeDefensibility: { type: Number, default: 0 },
    roleUnderstanding: { type: Number, default: 0 },
    evidenceCoverage: { type: Number, default: 0 },
  },

  priorities: [PrepPrioritySchema],
  topics: [PrepTopicSchema],
  likelyQuestions: [PrepQuestionSchema],
  interviewerQuestions: [PrepQuestionSchema],

  cheatSheet: {
    strengths: [{ type: String }],
    gaps: [{ type: String }],
    resumeClaims: [{ type: String }]
  },

  error: { type: Schema.Types.Mixed }
}, { timestamps: true });

InterviewIntelligenceSchema.index({ userId: 1, jobId: 1 });
InterviewIntelligenceSchema.index({ inputFingerprint: 1 }, { unique: true });

export const InterviewIntelligence = mongoose.model<IInterviewIntelligence>(
  "InterviewIntelligence",
  InterviewIntelligenceSchema
);
