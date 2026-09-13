import { FastifyRequest, FastifyReply } from "fastify";
import { ProfileService } from "./profile.service";
import { UpdateProfileSchema, FactVerificationSchema, ConflictResolutionSchema } from "./profile.schema";

export class ProfileController {
  static async get(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const profile = await ProfileService.getProfile(userId);
    return { success: true, profile };
  }

  static async update(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const data = UpdateProfileSchema.parse(request.body);
    const profile = await ProfileService.updateProfile(userId, data);
    return { success: true, profile };
  }

  static async verifyFact(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const data = FactVerificationSchema.parse(request.body);
    
    try {
      const profile = await ProfileService.verifyFact(userId, data.entityId, data.entityType, data.action);
      return { success: true, profile };
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: error.message } });
    }
  }

  static async resolveConflict(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;
    const data = ConflictResolutionSchema.parse({ ...request.body as any, conflictId: id });
    
    try {
      const profile = await ProfileService.resolveConflict(userId, data.conflictId, data.resolutionType, data.mergedData);
      return { success: true, profile };
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: error.message } });
    }
  }

  static async getIntelligenceSummary(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    try {
      const summary = await ProfileService.getIntelligenceSummary(userId);
      return { success: true, data: summary };
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
    }
  }
}
