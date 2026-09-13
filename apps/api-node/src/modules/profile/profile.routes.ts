import { FastifyInstance } from "fastify";
import { ProfileController } from "./profile.controller";
import { authenticate } from "../../middleware/auth";

export async function profileRoutes(app: FastifyInstance) {
  // Canonical Profile CRUD
  app.get("/", { preValidation: [authenticate] }, ProfileController.get);
  app.put("/", { preValidation: [authenticate] }, ProfileController.update);
  
  // Provenance & Conflicts
  app.post("/facts/verify", { preValidation: [authenticate] }, ProfileController.verifyFact);
  // @ts-ignore
  app.post("/conflicts/:id/resolve", { preValidation: [authenticate] }, ProfileController.resolveConflict);
  
  // Career Intelligence
  app.get("/intelligence-summary", { preValidation: [authenticate] }, ProfileController.getIntelligenceSummary);
}
