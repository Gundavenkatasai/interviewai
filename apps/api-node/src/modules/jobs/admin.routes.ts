import { FastifyInstance } from "fastify";
import { AdminController } from "./admin.controller";
import { optionalAuthenticate } from "../../middleware/auth";

export async function adminRoutes(app: FastifyInstance) {
  // Admin Source health and metrics
  app.get("/sources", { preValidation: [optionalAuthenticate] }, AdminController.getSources);
  
  // Admin Sync logs
  app.get("/sync-logs", { preValidation: [optionalAuthenticate] }, AdminController.getSyncLogs);

  // Admin trigger manual sync across all 14 sources
  app.post("/sync", { preValidation: [optionalAuthenticate] }, AdminController.triggerFullSync);

  // Admin trigger manual sync for single source
  app.post("/sync/:source", { preValidation: [optionalAuthenticate] }, AdminController.triggerSourceSync);

  // Admin 72h validation audit logs
  app.get("/validation-logs", { preValidation: [optionalAuthenticate] }, AdminController.getValidationLogs);
}

