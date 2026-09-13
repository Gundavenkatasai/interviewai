import { FastifyRequest, FastifyReply } from "fastify";
import { PipelineRun, SuppressionLog } from "./pipeline.model";
import { PipelineOrchestrator } from "./pipeline.orchestrator";
import { z } from "zod";

export class PipelineController {
  
  static async startPipeline(req: FastifyRequest, reply: FastifyReply) {
    const schema = z.object({
      jobId: z.string().uuid(),
    });

    const { jobId } = schema.parse(req.body);
    const userId = req.user!.sub;

    // Delegate to Orchestrator to instantiate or retrieve existing run
    const run = await PipelineOrchestrator.startOrResume(userId, jobId);

    return reply.send({ success: true, data: run });
  }

  static async getPipelineRuns(req: FastifyRequest, reply: FastifyReply) {
    const userId = req.user!.sub;
    
    // In a real app we'd add pagination and filtering
    const runs = await PipelineRun.find({ userId }).sort({ updatedAt: -1 }).limit(50);
    
    return reply.send({ success: true, data: runs });
  }

  static async getPipelineRunById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = req.user!.sub;
    const run = await PipelineRun.findOne({ _id: req.params.id, userId });
    
    if (!run) {
      return reply.code(404).send({ success: false, error: "Pipeline run not found" });
    }
    
    return reply.send({ success: true, data: run });
  }

  static async retryPipeline(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = req.user!.sub;
    const run = await PipelineRun.findOne({ _id: req.params.id, userId });
    
    if (!run) {
      return reply.code(404).send({ success: false, error: "Pipeline run not found" });
    }

    if (run.status !== "FAILED" && run.status !== "CANCELLED" && run.status !== "BLOCKED") {
      return reply.code(400).send({ success: false, error: `Cannot retry pipeline in state ${run.status}` });
    }

    const resumedRun = await PipelineOrchestrator.startOrResume(userId, run.jobId);
    
    return reply.send({ success: true, data: resumedRun });
  }

  static async cancelPipeline(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = req.user!.sub;
    const run = await PipelineRun.findOne({ _id: req.params.id, userId });
    
    if (!run) {
      return reply.code(404).send({ success: false, error: "Pipeline run not found" });
    }

    if (run.status === "SUCCEEDED" || run.status === "FAILED") {
      return reply.code(400).send({ success: false, error: `Cannot cancel pipeline in state ${run.status}` });
    }

    run.status = "CANCELLED";
    await run.save();
    
    return reply.send({ success: true, data: run });
  }
}
