import { FastifyInstance } from "fastify";
import { DebriefController } from "./debrief.controller";
import { authenticate } from "../../middleware/auth";

export async function debriefRoutes(app: FastifyInstance) {
  app.post("/:interviewId/generate", { preValidation: [authenticate] }, DebriefController.generate);
  app.get("/:interviewId", { preValidation: [authenticate] }, DebriefController.getByInterviewId);
  app.get("/weaknesses", { preValidation: [authenticate] }, DebriefController.getWeaknesses);
}

export default debriefRoutes;
