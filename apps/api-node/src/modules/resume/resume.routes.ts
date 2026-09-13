import { FastifyInstance } from "fastify";
import { ResumeController } from "./resume.controller";
import { authenticate, optionalAuthenticate } from "../../middleware/auth";

export async function resumeRoutes(app: FastifyInstance) {
  // ATS Resume Template Generator Suite
  // @ts-ignore
  app.get("/templates", { preValidation: [optionalAuthenticate] }, ResumeController.getResumeTemplates);
  // @ts-ignore
  app.get("/templates/:id", { preValidation: [optionalAuthenticate] }, ResumeController.getResumeTemplate);
  // @ts-ignore
  app.post("/templates/import", { preValidation: [optionalAuthenticate] }, ResumeController.importResumeForTemplate);
  // @ts-ignore
  app.post("/templates/generate", { preValidation: [optionalAuthenticate] }, ResumeController.generateResumeFromTemplate);
  // @ts-ignore
  app.post("/:id/switch-template", { preValidation: [optionalAuthenticate] }, ResumeController.switchResumeTemplate);

  // Day 9: Artifact Generation & Management
  // @ts-ignore
  app.post("/:id/artifacts/generate", { preValidation: [authenticate] }, ResumeController.generateArtifact);
  // @ts-ignore
  app.get("/:id/artifacts", { preValidation: [authenticate] }, ResumeController.getArtifacts);
  // @ts-ignore
  app.get("/artifacts/:artifactId/download", { preValidation: [authenticate] }, ResumeController.downloadArtifact);


  // Dedicated ATS Checker endpoints (https://github.com/Jahangirhussen/ats-resume-checker.git)
  // @ts-ignore
  app.post("/ats-check", { preValidation: [optionalAuthenticate] }, ResumeController.checkAts);
  // @ts-ignore
  app.get("/ats-meta", { preValidation: [optionalAuthenticate] }, ResumeController.getAtsMeta);
  // Format-Preserving AI Optimization Suite
  // @ts-ignore
  app.post("/ats-optimize-plan", { preValidation: [optionalAuthenticate] }, ResumeController.generateOptimizationPlan);
  // @ts-ignore
  app.post("/ats-apply-optimizations", { preValidation: [optionalAuthenticate] }, ResumeController.applyOptimizations);
  // @ts-ignore
  app.get("/ats-download-optimized/:id", { preValidation: [optionalAuthenticate] }, ResumeController.downloadOptimizedDocx);
  // @ts-ignore
  app.post("/ats-rescore", { preValidation: [optionalAuthenticate] }, ResumeController.rescoreDocument);

  // RESTful ATS & Format-Preserving Optimization endpoints
  // @ts-ignore
  app.post("/:id/ats/scan", { preValidation: [authenticate] }, ResumeController.scanResumeAts);
  // @ts-ignore
  app.get("/:id/ats/report", { preValidation: [authenticate] }, ResumeController.getResumeAtsReport);
  // @ts-ignore
  app.get("/ats/scans/:id/compare/:otherId", { preValidation: [authenticate] }, ResumeController.compareAtsScans);
  // @ts-ignore
  app.post("/:id/ats/explain", { preValidation: [authenticate] }, ResumeController.explainAtsScore);
  // @ts-ignore
  app.post("/:id/optimize", { preValidation: [authenticate] }, ResumeController.optimizeResume);
  // @ts-ignore
  app.get("/:id/optimization/:runId", { preValidation: [authenticate] }, ResumeController.getOptimizationRun);
  // @ts-ignore
  app.post("/:id/optimization/:runId/apply", { preValidation: [authenticate] }, ResumeController.applyOptimizationRun);
  // @ts-ignore
  app.post("/:id/optimization/:runId/reject", { preValidation: [authenticate] }, ResumeController.rejectOptimizationRun);
  // @ts-ignore
  app.post("/:id/optimization/:runId/rescan", { preValidation: [authenticate] }, ResumeController.rescanOptimizationRun);
  // @ts-ignore
  app.get("/:id/download/original", { preValidation: [authenticate] }, ResumeController.downloadOriginalResume);
  // @ts-ignore
  app.get("/:id/download/optimized", { preValidation: [authenticate] }, ResumeController.downloadOptimizedResume);

  // Public shared resume endpoint (no auth required)
  // @ts-ignore
  app.get("/public/:slug", ResumeController.getPublicResume);

  // File upload & parsing
  app.post("/upload", { preValidation: [authenticate] }, ResumeController.uploadResume);
  // @ts-ignore
  app.post("/:id/parse", { preValidation: [authenticate] }, ResumeController.uploadResume);
  // @ts-ignore
  app.post("/:id/confirm", { preValidation: [authenticate] }, ResumeController.confirmResumeField);
  // @ts-ignore
  app.post("/:id/restore", { preValidation: [authenticate] }, ResumeController.restoreResumeVersion);

  // Resume CRUD
  app.get("/", { preValidation: [authenticate] }, ResumeController.getResumes);
  app.post("/", { preValidation: [authenticate] }, ResumeController.createResume);
  // @ts-ignore
  app.get("/:id", { preValidation: [authenticate] }, ResumeController.getResume);
  // @ts-ignore
  app.put("/:id", { preValidation: [authenticate] }, ResumeController.updateResume);
  // @ts-ignore
  app.delete("/:id", { preValidation: [authenticate] }, ResumeController.deleteResume);
  // @ts-ignore
  app.post("/:id/duplicate", { preValidation: [authenticate] }, ResumeController.duplicateResume);
  // @ts-ignore
  app.put("/:id/rename", { preValidation: [authenticate] }, ResumeController.renameResume);

  // Analysis & ATS endpoints
  // @ts-ignore
  app.post("/:id/analyze", { preValidation: [authenticate] }, ResumeController.analyzeResume);
  // @ts-ignore
  app.get("/:id/health", { preValidation: [authenticate] }, ResumeController.getResumeHealth);
  // @ts-ignore
  app.post("/:id/ats", { preValidation: [authenticate] }, ResumeController.analyzeResume);
  // @ts-ignore
  app.get("/:id/plain-text", { preValidation: [authenticate] }, ResumeController.getPlainText);

  // AI Writing & Generator suite
  // @ts-ignore
  app.post("/ai-generate", { preValidation: [authenticate] }, ResumeController.generateAIResume);
  // @ts-ignore
  app.post("/:id/improve", { preValidation: [authenticate] }, ResumeController.improveBullet);
  // @ts-ignore
  app.post("/:id/improve-bullet", { preValidation: [authenticate] }, ResumeController.improveBullet);
  // @ts-ignore
  app.post("/:id/generate-summary", { preValidation: [authenticate] }, ResumeController.generateSummary);
  // @ts-ignore
  app.post("/:id/generate-achievement", { preValidation: [authenticate] }, ResumeController.generateAchievement);
  // @ts-ignore
  app.post("/:id/generate-project", { preValidation: [authenticate] }, ResumeController.generateProject);
  // @ts-ignore
  app.post("/:id/grammar", { preValidation: [authenticate] }, ResumeController.checkGrammar);
  // @ts-ignore
  app.post("/:id/credibility-check", { preValidation: [authenticate] }, ResumeController.checkCredibility);
  // @ts-ignore
  app.post("/:id/interview-questions", { preValidation: [authenticate] }, ResumeController.generateInterviewQuestions);

  // Job Matching & Tailoring
  // @ts-ignore
  app.post("/:id/match-job", { preValidation: [authenticate] }, ResumeController.matchJob);
  // @ts-ignore
  app.post("/:id/tailor", { preValidation: [authenticate] }, ResumeController.tailorResume);
  // @ts-ignore
  app.post("/:id/apply-tailoring", { preValidation: [authenticate] }, ResumeController.applyTailoring);

  // Versioning & Comparison
  // @ts-ignore
  app.get("/:id/versions", { preValidation: [authenticate] }, ResumeController.getVersions);
  // @ts-ignore
  app.post("/:id/versions/:versionId/restore", { preValidation: [authenticate] }, ResumeController.restoreVersion);
  // @ts-ignore
  app.post("/:id/compare", { preValidation: [authenticate] }, ResumeController.compareVersions);

  // Exports
  // @ts-ignore
  app.post("/:id/export/docx", { preValidation: [authenticate] }, ResumeController.exportDocx);
  // @ts-ignore
  app.post("/:id/export/txt", { preValidation: [authenticate] }, ResumeController.exportTxt);
  // @ts-ignore
  app.post("/:id/export/json", { preValidation: [authenticate] }, ResumeController.exportJson);

  // Share links
  // @ts-ignore
  app.post("/:id/share", { preValidation: [authenticate] }, ResumeController.createShare);
  // @ts-ignore
  app.delete("/:id/share", { preValidation: [authenticate] }, ResumeController.deleteShare);

  // Activity & Analytics
  // @ts-ignore
  app.get("/:id/activity", { preValidation: [authenticate] }, ResumeController.getActivity);
  // @ts-ignore
  app.get("/:id/analytics", { preValidation: [authenticate] }, ResumeController.getAnalytics);

  // Integrations & Intelligence
  app.post("/github/analyze", { preValidation: [authenticate] }, ResumeController.analyzeGitHub);
  app.get("/market-keywords", { preValidation: [authenticate] }, ResumeController.getMarketKeywords);
}
