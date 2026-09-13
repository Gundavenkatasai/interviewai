import { FastifyInstance } from "fastify";
import { PipelineController } from "./pipeline.controller";

export async function pipelineRoutes(fastify: FastifyInstance) {
  fastify.addHook("preValidation", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  fastify.post("/run", PipelineController.startPipeline);
  fastify.get("/runs", PipelineController.getPipelineRuns);
  fastify.get("/runs/:id", PipelineController.getPipelineRunById);
  fastify.post("/runs/:id/retry", PipelineController.retryPipeline);
  fastify.post("/runs/:id/cancel", PipelineController.cancelPipeline);
}
