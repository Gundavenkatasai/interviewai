import { FastifyInstance } from "fastify";
import { StoryController } from "./story.controller";
import { authenticate } from "../../middleware/auth";

export async function storyRoutes(app: FastifyInstance) {
  app.get("/", { preValidation: [authenticate] }, StoryController.list);
  app.post("/extract", { preValidation: [authenticate] }, StoryController.extract);
  app.post("/:id/verify", { preValidation: [authenticate] }, StoryController.verify);
  app.post("/match", { preValidation: [authenticate] }, StoryController.match);
}

export default storyRoutes;
