import { z } from "zod";

export const LinkedInSettingsSchema = z.object({
  readProvider: z.enum(["MANUAL", "APIFY"]).default("MANUAL"),
  publishProvider: z.enum(["MANUAL", "PUBLORA", "CUSTOM"]).default("MANUAL"),
  mediaProvider: z.enum(["MANUAL", "PIXFARO"]).default("MANUAL"),
  approvalMode: z.enum(["STRICT", "PERMISSIVE"]).default("STRICT"),
  apifyToken: z.string().optional(),
  publoraApiKey: z.string().optional(),
  linkedinPlatformId: z.string().optional(),
  pixfaroToken: z.string().optional(),
  customPosterCommand: z.string().optional(),
  enabledSkills: z.array(z.string()).optional(),
});

export const DraftPostSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  targetAudience: z.enum(["founders", "operators", "engineers", "marketers", "general"]).default("engineers"),
  goal: z.enum(["comments", "reposts", "likes", "saves"]).default("comments"),
  formulaCode: z.string().optional(), // F1 - F20
  desiredLength: z.enum(["short", "medium", "long"]).default("medium"),
  storyBankId: z.string().optional(),
  customAngle: z.string().optional(),
  illustrationRequired: z.boolean().default(false),
});

export const HumanizeDraftSchema = z.object({
  draftId: z.string().optional(),
  rawText: z.string().min(10, "Text must be at least 10 characters"),
});

export const AuditDraftSchema = z.object({
  draftId: z.string().optional(),
  rawText: z.string().min(10, "Text must be at least 10 characters"),
});

export const RepurposeContentSchema = z.object({
  sourceType: z.enum(["resume_story", "project", "blog", "transcript", "raw_text"]),
  sourceContent: z.string().min(20, "Source content must be at least 20 characters"),
  goal: z.enum(["comments", "reposts", "likes", "saves"]).default("comments"),
  targetRole: z.string().optional(),
});

export const HookExtractorSchema = z.object({
  url: z.string().url().optional(),
  postText: z.string().optional(),
}).refine(data => data.url || data.postText, {
  message: "Either url or postText must be provided",
});

export const DraftCommentSchema = z.object({
  postUrl: z.string().url(),
  contextNotes: z.string().optional(),
  angle: z.enum(["insight", "agreement", "contrarian", "question", "appreciation"]).default("insight"),
});

export const DraftReplySchema = z.object({
  postUrl: z.string().url(),
  parentCommentId: z.string().optional(),
  replyToText: z.string().min(3, "Reply context must be provided"),
  angle: z.enum(["helpful", "clarification", "counter_point", "gratitude"]).default("helpful"),
});

export const CalendarGenerateSchema = z.object({
  daysCount: z.number().min(3).max(30).default(7),
  focusPillars: z.array(z.string()).optional(),
  timezone: z.string().default("UTC"),
});

export const PublishApprovedDraftSchema = z.object({
  draftId: z.string(),
  scheduledTime: z.string().datetime().optional(),
  platformId: z.string().optional(),
});

export const ApproveRecommendationSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  userEditedValue: z.string().optional(),
});

export const InterviewerTurnSchema = z.object({
  storyTitle: z.string().optional(),
  userAnswer: z.string().optional(),
  targetRole: z.string().optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(["assistant", "user"]),
    content: z.string(),
  })).default([]),
});
