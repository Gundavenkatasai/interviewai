import mongoose, { Schema, Document } from "mongoose";

export interface IQuestionReview {
  questionId: string;
  category: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  missingElements: string[];
  evidenceUsed: string[];
  storyUsedId?: string;
  suggestedImprovement: string;
}

export interface IInterviewDebrief extends Document {
  userId: mongoose.Types.ObjectId;
  interviewId: mongoose.Types.ObjectId;
  jobSnapshotId?: mongoose.Types.ObjectId;
  resumeVersionId?: mongoose.Types.ObjectId;

  overallScore: number;
  whatWentWell: string[];
  whatToImprove: string[];

  questionReviews: IQuestionReview[];

  communicationSignals: {
    wordCount: number;
    answerDurationSec: number;
    wordsPerMinute: number;
    fillerWordsDetected: number;
    pausesDetected: number;
  };

  nextPracticeItems: {
    why: string;
    action: string;
    priority: "CRITICAL" | "HIGH" | "MEDIUM";
  }[];

  confidence: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_EVIDENCE";
  version: number;

  createdAt: Date;
  updatedAt: Date;
}

const QuestionReviewSchema = new Schema<IQuestionReview>({
  questionId: { type: String, required: true },
  category: { type: String, required: true },
  score: { type: Number, default: 0 },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  missingElements: [{ type: String }],
  evidenceUsed: [{ type: String }],
  storyUsedId: { type: String },
  suggestedImprovement: { type: String }
}, { _id: false });

const InterviewDebriefSchema = new Schema<IInterviewDebrief>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  interviewId: { type: Schema.Types.ObjectId, ref: "InterviewSession", required: true, unique: true },
  jobSnapshotId: { type: Schema.Types.ObjectId, ref: "Job" },
  resumeVersionId: { type: Schema.Types.ObjectId, ref: "ResumeVersion" },

  overallScore: { type: Number, default: 0 },
  whatWentWell: [{ type: String }],
  whatToImprove: [{ type: String }],

  questionReviews: [QuestionReviewSchema],

  communicationSignals: {
    wordCount: { type: Number, default: 0 },
    answerDurationSec: { type: Number, default: 0 },
    wordsPerMinute: { type: Number, default: 0 },
    fillerWordsDetected: { type: Number, default: 0 },
    pausesDetected: { type: Number, default: 0 }
  },

  nextPracticeItems: [{
    why: { type: String, required: true },
    action: { type: String, required: true },
    priority: { type: String, required: true }
  }],

  confidence: { type: String, default: "HIGH" },
  version: { type: Number, default: 1 }
}, { timestamps: true });


export type WeaknessState = "NEW" | "RECURRING" | "IMPROVING" | "RESOLVED" | "RETEST";

export interface IInterviewWeakness extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  topic: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: WeaknessState;
  firstDetectedAt: Date;
  lastDetectedAt: Date;
  occurrences: number;
  improvementCount: number;
  evidenceContexts: string[]; // brief string storing interviewId+question+reason
  recommendedAction: string;
}

const InterviewWeaknessSchema = new Schema<IInterviewWeakness>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  category: { type: String, required: true },
  topic: { type: String, required: true },
  severity: { type: String, required: true },
  status: { type: String, default: "NEW", index: true },
  firstDetectedAt: { type: Date, default: Date.now },
  lastDetectedAt: { type: Date, default: Date.now },
  occurrences: { type: Number, default: 1 },
  improvementCount: { type: Number, default: 0 },
  evidenceContexts: [{ type: String }],
  recommendedAction: { type: String }
}, { timestamps: true });

InterviewWeaknessSchema.index({ userId: 1, topic: 1 }, { unique: true });

export const InterviewDebrief = mongoose.model<IInterviewDebrief>("InterviewDebrief", InterviewDebriefSchema);
export const InterviewWeakness = mongoose.model<IInterviewWeakness>("InterviewWeakness", InterviewWeaknessSchema);
