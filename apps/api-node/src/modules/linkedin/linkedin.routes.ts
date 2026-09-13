import { FastifyInstance } from "fastify";
import { LinkedInController } from "./linkedin.controller";
import { authenticate } from "../../middleware/auth";

export async function linkedinRoutes(app: FastifyInstance) {
  app.post("/analyze-url", { preValidation: [authenticate] }, LinkedInController.analyzeUrl);
  app.post("/analyze-pasted-profile", { preValidation: [authenticate] }, LinkedInController.analyzePastedProfile);
  app.get("/analysis", { preValidation: [authenticate] }, LinkedInController.getLatestAnalysis);
  // @ts-ignore
  app.get("/analysis/:id", { preValidation: [authenticate] }, LinkedInController.getAnalysisById);
  app.post("/sync-profile", { preValidation: [authenticate] }, LinkedInController.syncProfile);
}
