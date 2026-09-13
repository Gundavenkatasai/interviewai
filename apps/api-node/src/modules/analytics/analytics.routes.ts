import { FastifyInstance } from "fastify";
import { AnalyticsController } from "./analytics.controller";
import { authenticate, optionalAuthenticate } from "../../middleware/auth";

export async function analyticsRoutes(app: FastifyInstance) {
  // Legacy telemetry endpoint
  app.post("/event", { preValidation: [optionalAuthenticate] }, AnalyticsController.trackEvent);
  
  // Day 17 endpoints
  app.get("/overview", { preValidation: [authenticate] }, AnalyticsController.getOverview);
  
  // @ts-ignore
  app.get("/evidence", { preValidation: [authenticate] }, AnalyticsController.getEvidence);
}
