import { FastifyInstance } from "fastify";
import { ApplicationsController } from "./applications.controller";
import { authenticate } from "../../middleware/auth";

export async function applicationsRoutes(app: FastifyInstance) {
  // @ts-ignore
  app.get("/", { preValidation: [authenticate] }, ApplicationsController.getApplications);
  // @ts-ignore
  app.get("/:id", { preValidation: [authenticate] }, ApplicationsController.getApplication);
  // @ts-ignore
  app.post("/", { preValidation: [authenticate] }, ApplicationsController.createApplication);
  
  // Day 11 Application Engine Routes
  // @ts-ignore
  app.post("/:id/prepare", { preValidation: [authenticate] }, ApplicationsController.prepareApplication);
  // @ts-ignore
  app.post("/:id/answers/:fieldId", { preValidation: [authenticate] }, ApplicationsController.generateAnswer);
  // @ts-ignore
  app.post("/:id/verify", { preValidation: [authenticate] }, ApplicationsController.verifyFields);
  // @ts-ignore
  app.post("/:id/mark-submitted", { preValidation: [authenticate] }, ApplicationsController.markSubmitted);
}
