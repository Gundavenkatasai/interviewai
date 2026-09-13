import { FastifyRequest, FastifyReply } from "fastify";
import { IntelligenceEngine } from "./intelligence.engine";
import { InterviewIntelligence } from "./intelligence.model";

export class IntelligenceController {
  
  static async generate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { jobId, resumeVersionId, interviewType } = request.body as any;
      const userId = (request as any).user?.id || (request as any).user?.sub;

      if (!jobId || !resumeVersionId) {
        return reply.status(400).send({ error: "jobId and resumeVersionId are required" });
      }

      // Generate or retrieve existing idempotently
      const intelligence = await IntelligenceEngine.generateIntelligence(
        userId,
        jobId,
        resumeVersionId,
        interviewType
      );

      reply.status(200).send(intelligence);
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  }

  static async getByJobId(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { jobId } = request.params as any;
      const userId = (request as any).user?.id || (request as any).user?.sub;

      const intelligence = await InterviewIntelligence.findOne({ userId, jobId }).sort({ createdAt: -1 });
      if (!intelligence) {
        return reply.status(404).send({ error: "Interview intelligence not found for this job" });
      }

      reply.status(200).send(intelligence);
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  }

  static async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const userId = (request as any).user?.id || (request as any).user?.sub;

      const intelligence = await InterviewIntelligence.findOne({ _id: id, userId });
      if (!intelligence) {
        return reply.status(404).send({ error: "Interview intelligence not found" });
      }

      reply.status(200).send(intelligence);
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  }
}
