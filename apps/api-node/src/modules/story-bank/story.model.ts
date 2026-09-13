import mongoose, { Schema, Document } from "mongoose";

export type StoryStatus = "DRAFT" | "NEEDS_USER_INPUT" | "AI_DRAFTED" | "USER_REVIEWED" | "VERIFIED" | "ARCHIVED";
export type CompletenessState = "COMPLETE" | "PARTIAL" | "INCOMPLETE" | "UNKNOWN";

export interface IStoryVersion {
  changedBy: string;
  changedAt: Date;
  changeReason: string;
  data: any;
}

export interface IInterviewStory extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  sourceEvidenceIds: string[]; // e.g. resumeExperience:123
  
  situation: string;
  task: string;
  action: string;
  result: string;
  reflection: string;

  situationCompleteness: CompletenessState;
  taskCompleteness: CompletenessState;
  actionCompleteness: CompletenessState;
  resultCompleteness: CompletenessState;

  competencyIds: string[]; // Maps to Day 13 competency taxonomy
  tags: string[];

  qualityScore: number;
  
  status: StoryStatus;
  userVerified: boolean;
  origin: "RESUME" | "USER_INPUT" | "INTERVIEW_ANSWER" | "IMPORTED_STORY";

  versions: IStoryVersion[];
  
  timesUsed: number;
  lastUsedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const StoryVersionSchema = new Schema<IStoryVersion>({
  changedBy: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changeReason: { type: String },
  data: { type: Schema.Types.Mixed, required: true }
}, { _id: false });

const InterviewStorySchema = new Schema<IInterviewStory>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true },
  sourceEvidenceIds: [{ type: String }],
  
  situation: { type: String, default: "UNKNOWN" },
  task: { type: String, default: "UNKNOWN" },
  action: { type: String, default: "UNKNOWN" },
  result: { type: String, default: "UNKNOWN" },
  reflection: { type: String, default: "UNKNOWN" },

  situationCompleteness: { type: String, default: "UNKNOWN" },
  taskCompleteness: { type: String, default: "UNKNOWN" },
  actionCompleteness: { type: String, default: "UNKNOWN" },
  resultCompleteness: { type: String, default: "UNKNOWN" },

  competencyIds: [{ type: String, index: true }],
  tags: [{ type: String }],

  qualityScore: { type: Number, default: 0 },
  
  status: { type: String, default: "DRAFT", index: true },
  userVerified: { type: Boolean, default: false },
  origin: { type: String, default: "USER_INPUT" },

  versions: [StoryVersionSchema],

  timesUsed: { type: Number, default: 0 },
  lastUsedAt: { type: Date }
}, { timestamps: true });

export const InterviewStory = mongoose.model<IInterviewStory>("InterviewStory", InterviewStorySchema);
