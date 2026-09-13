import { FastifyRequest, FastifyReply } from "fastify";
import { StoryEngine } from "./story.engine";
import { InterviewStory } from "./story.model";

export class StoryController {
  
  static async extract(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { text, sourceId } = request.body as any;
      const userId = (request as any).user?.id || (request as any).user?.sub;

      if (!text) {
        return reply.status(400).send({ error: "Evidence text is required" });
      }

      const story = await StoryEngine.extractStory(userId, text, sourceId);
      reply.status(200).send(story);
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  }

  static async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id || (request as any).user?.sub;
      const stories = await InterviewStory.find({ userId }).sort({ createdAt: -1 });
      reply.status(200).send(stories);
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  }

  static async verify(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const userId = (request as any).user?.id || (request as any).user?.sub;

      const story = await InterviewStory.findOne({ _id: id, userId });
      if (!story) return reply.status(404).send({ error: "Story not found" });

      story.status = "VERIFIED";
      story.userVerified = true;
      await story.save();

      reply.status(200).send(story);
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  }

  static async match(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { question, competency } = request.body as any;
      const userId = (request as any).user?.id || (request as any).user?.sub;

      if (!question || !competency) {
        return reply.status(400).send({ error: "question and competency are required" });
      }

      const match = await StoryEngine.matchStoryToQuestion(userId, question, competency);
      reply.status(200).send(match);
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  }
}
