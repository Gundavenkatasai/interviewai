import { FastifyInstance } from "fastify";
import { TailoringController } from "./tailoring.controller";
import { authenticate } from "../../../middleware/auth";

export async function tailoringRoutes(app: FastifyInstance) {
  // @ts-ignore
  app.post("/plan", { preValidation: [authenticate] }, TailoringController.generatePlan);
  // @ts-ignore
  app.post("/:id", { preValidation: [authenticate] }, TailoringController.executeTailoring);
  // @ts-ignore
  app.get("/:id", { preValidation: [authenticate] }, TailoringController.getRun);
  // @ts-ignore
  app.post("/:id/approve", { preValidation: [authenticate] }, TailoringController.approveRun);
}
