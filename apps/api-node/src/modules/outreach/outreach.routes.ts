import { FastifyInstance } from "fastify";
import { OutreachController } from "./outreach.controller";
import { authenticate } from "../../middleware/auth";

export async function outreachRoutes(app: FastifyInstance) {
  // Legacy / existing
  // Let's keep a generic generate if needed, but it's replaced by generateDraft in the UI ideally
  // app.post("/generate", { preValidation: [app.authenticate] }, OutreachController.generate);

  // New Day 16 endpoints
  app.get("/dashboard", { preValidation: [authenticate] }, OutreachController.getDashboard);
  app.get("/contacts", { preValidation: [authenticate] }, OutreachController.getContacts);
  // @ts-ignore
  app.get("/application/:id/timeline", { preValidation: [authenticate] }, OutreachController.getApplicationTimeline);
  
  app.post("/draft", { preValidation: [authenticate] }, OutreachController.generateDraft);
  app.post("/submit", { preValidation: [authenticate] }, OutreachController.submitCommunication);
  
  // @ts-ignore
  app.post("/followup/:id/suppress", { preValidation: [authenticate] }, OutreachController.suppressFollowUp);
}
