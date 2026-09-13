import { FastifyRequest, FastifyReply } from "fastify";
import { DebriefEngine } from "./debrief.engine";
import { InterviewDebrief, InterviewWeakness } from "./debrief.model";

export class DebriefController {
  
  static async generate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { interviewId } = request.params as any;
      const userId = (request as any).user?.id || (request as any).user?.sub;

      if (!interviewId) {
        return reply.status(400).send({ error: "interviewId is required" });
      }

      // Generate idempotently
      let debrief: any = await InterviewDebrief.findOne({ userId, interviewId });
      if (!debrief) {
        debrief = await DebriefEngine.generateDebrief(userId, interviewId);
      }

      reply.status(200).send(debrief);
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  }

  static async getByInterviewId(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { interviewId } = request.params as any;
      const userId = (request as any).user?.id || (request as any).user?.sub;

      const debrief = await InterviewDebrief.findOne({ userId, interviewId });
      if (!debrief) {
        return reply.status(404).send({ error: "Debrief not found" });
      }

      reply.status(200).send(debrief);
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  }

  static async getWeaknesses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id || (request as any).user?.sub;
      const weaknesses = await InterviewWeakness.find({ userId }).sort({ lastDetectedAt: -1 });
      reply.status(200).send(weaknesses);
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  }
}
