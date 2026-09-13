import { FastifyInstance } from "fastify";
import { InterviewController } from "./interview.controller";
import { authenticate } from "../../middleware/auth";

export async function interviewRoutes(app: FastifyInstance) {
  // Session CRUD
  app.post("/", { preValidation: [authenticate] }, InterviewController.createSession);
  app.get("/", { preValidation: [authenticate] }, InterviewController.getSessions);
  // @ts-ignore
  app.get("/:id", { preValidation: [authenticate] }, InterviewController.getSession);
  // @ts-ignore
  app.delete("/:id", { preValidation: [authenticate] }, InterviewController.deleteSession);

  // Interview actions
  // @ts-ignore
  app.post("/:id/answers", { preValidation: [authenticate] }, InterviewController.submitAnswer);
  // @ts-ignore
  app.post("/:id/next-question", { preValidation: [authenticate] }, InterviewController.nextQuestion);
  // @ts-ignore
  app.post("/:id/complete", { preValidation: [authenticate] }, InterviewController.completeSession);
  // @ts-ignore
  app.post("/:id/elapsed", { preValidation: [authenticate] }, InterviewController.updateElapsed);
  // @ts-ignore
  app.post("/:id/transcript", { preValidation: [authenticate] }, InterviewController.addTranscript);
  // @ts-ignore
  app.post("/:id/feedback", { preValidation: [authenticate] }, InterviewController.updateFeedback);
  // @ts-ignore
  app.post("/:id/questions", { preValidation: [authenticate] }, InterviewController.addQuestion);
}
