import { FastifyInstance } from "fastify";
import { TailoringController } from "./tailoring.controller";
import { authenticate } from "../../../middleware/auth";

export async function tailoringRoutes(app: FastifyInstance) {
  // @ts-ignore
  app.post("/plan", { preValidation: [authenticate] }, TailoringController.generatePlan);
  // @ts-ignore
  app.post("/apply", { preValidation: [authenticate] }, TailoringController.applyTailoring);
  // @ts-ignore
  app.get("/:id/before-after", { preValidation: [authenticate] }, TailoringController.getBeforeAfter);
  // @ts-ignore
  app.get("/:id", { preValidation: [authenticate] }, TailoringController.getRun);
  // Legacy / debug endpoints
  // @ts-ignore
  app.post("/:id", { preValidation: [authenticate] }, TailoringController.executeTailoring);
  // @ts-ignore
  app.post("/:id/approve", { preValidation: [authenticate] }, TailoringController.approveRun);
}
