import { FastifyInstance } from "fastify";
import { LinkedInController } from "./linkedin.controller";
import { authenticate } from "../../middleware/auth";

export async function linkedinRoutes(app: FastifyInstance) {
  // Skills Inventory
  app.get("/skills", { preValidation: [authenticate] }, LinkedInController.getSkills);

  // Settings & Connection testing
  app.get("/settings", { preValidation: [authenticate] }, LinkedInController.getSettings);
  app.patch("/settings", { preValidation: [authenticate] }, LinkedInController.updateSettings);
  app.post("/connections/test", { preValidation: [authenticate] }, LinkedInController.testConnections);

  // Profile Analysis & Recommendations
  app.post("/analyze", { preValidation: [authenticate] }, LinkedInController.analyzeProfile);
  app.post("/analyze-url", { preValidation: [authenticate] }, LinkedInController.analyzeUrl);
  app.post("/analyze-pasted-profile", { preValidation: [authenticate] }, LinkedInController.analyzePastedProfile);
  app.get("/analysis", { preValidation: [authenticate] }, LinkedInController.getLatestAnalysis);
  app.get("/analysis/latest", { preValidation: [authenticate] }, LinkedInController.getLatestAnalysis);
  // @ts-ignore
  app.get("/analysis/:id", { preValidation: [authenticate] }, LinkedInController.getAnalysisById);
  app.get("/recommendations", { preValidation: [authenticate] }, LinkedInController.getRecommendations);
  // @ts-ignore
  app.post("/recommendations/:id/approve", { preValidation: [authenticate] }, LinkedInController.approveRecommendation);
  // @ts-ignore
  app.post("/recommendations/:id/reject", { preValidation: [authenticate] }, LinkedInController.rejectRecommendation);
  app.post("/sync-profile", { preValidation: [authenticate] }, LinkedInController.syncProfile);

  // Content Studio
  app.post("/content/draft", { preValidation: [authenticate] }, LinkedInController.createDraft);
  app.get("/content/drafts", { preValidation: [authenticate] }, LinkedInController.getDrafts);
  // @ts-ignore
  app.get("/content/drafts/:id", { preValidation: [authenticate] }, LinkedInController.getDraftById);
  // @ts-ignore
  app.patch("/content/drafts/:id", { preValidation: [authenticate] }, LinkedInController.updateDraft);
  // @ts-ignore
  app.post("/content/drafts/:id/humanize", { preValidation: [authenticate] }, LinkedInController.humanizeDraft);
  // @ts-ignore
  app.post("/content/humanize", { preValidation: [authenticate] }, LinkedInController.humanizeDraft);
  // @ts-ignore
  app.post("/content/drafts/:id/audit", { preValidation: [authenticate] }, LinkedInController.auditDraft);
  // @ts-ignore
  app.post("/content/audit", { preValidation: [authenticate] }, LinkedInController.auditDraft);
  // @ts-ignore
  app.post("/content/drafts/:id/approve", { preValidation: [authenticate] }, LinkedInController.approveDraft);
  // @ts-ignore
  app.post("/content/drafts/:id/publish", { preValidation: [authenticate] }, LinkedInController.publishDraft);
  app.post("/content/repurpose", { preValidation: [authenticate] }, LinkedInController.repurposeContent);

  // Hook Extractor
  app.post("/hooks/extract", { preValidation: [authenticate] }, LinkedInController.extractHook);

  // Engagement Workspace
  app.post("/comments/draft", { preValidation: [authenticate] }, LinkedInController.draftComment);
  app.post("/replies/draft", { preValidation: [authenticate] }, LinkedInController.draftReply);
  app.post("/threads/analyze", { preValidation: [authenticate] }, LinkedInController.analyzeThreads);
  app.get("/threads", { preValidation: [authenticate] }, LinkedInController.analyzeThreads);

  // Audience & Engagers
  app.get("/engagers", { preValidation: [authenticate] }, LinkedInController.getEngagers);
  app.post("/engagers/scan", { preValidation: [authenticate] }, LinkedInController.scanEngagers);

  // Content Calendar
  app.get("/calendar", { preValidation: [authenticate] }, LinkedInController.getCalendar);
  app.post("/calendar/generate", { preValidation: [authenticate] }, LinkedInController.generateCalendar);

  // Story Bank Interviewer
  app.post("/interviewer/turn", { preValidation: [authenticate] }, LinkedInController.interviewerTurn);

  // Executions status
  // @ts-ignore
  app.get("/executions/:id", { preValidation: [authenticate] }, LinkedInController.getExecutionById);
}
