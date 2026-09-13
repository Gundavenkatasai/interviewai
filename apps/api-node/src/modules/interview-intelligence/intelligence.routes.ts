import { FastifyInstance } from "fastify";
import { IntelligenceController } from "./intelligence.controller";
import { authenticate } from "../../middleware/auth";

export async function intelligenceRoutes(app: FastifyInstance) {
  app.post("/generate", { preValidation: [authenticate] }, IntelligenceController.generate);
  app.get("/job/:jobId", { preValidation: [authenticate] }, IntelligenceController.getByJobId);
  app.get("/:id", { preValidation: [authenticate] }, IntelligenceController.getById);
}

export default intelligenceRoutes;
