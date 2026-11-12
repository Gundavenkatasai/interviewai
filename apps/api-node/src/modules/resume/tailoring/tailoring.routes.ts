import { FastifyInstance } from "fastify";
import { TailoringController } from "./tailoring.controller";
import { authenticate } from "../../../middleware/auth";

export async function tailoringRoutes(app: FastifyInstance) {
  app.post("/plan", { preValidation: [authenticate] }, TailoringController.generatePlan);
  app.post("/apply", { preValidation: [authenticate] }, TailoringController.applyTailoring);
  app.get("/:id/before-after", { preValidation: [authenticate] }, TailoringController.getBeforeAfter);
  app.get("/:id", { preValidation: [authenticate] }, TailoringController.getRun);
  app.post("/:id", { preValidation: [authenticate] }, TailoringController.executeTailoring);
  app.post("/:id/approve", { preValidation: [authenticate] }, TailoringController.approveRun);
}
