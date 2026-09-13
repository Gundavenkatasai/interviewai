import { FastifyRequest, FastifyReply } from "fastify";
import { DashboardService } from "./dashboard.service";

export class DashboardController {
  static async getStats(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.sub;
    try {
      const stats = await DashboardService.getDashboardStats(userId);
      return { success: true, data: stats };
    } catch (error: any) {
      reply.status(500).send({ success: false, error: { message: error.message } });
    }
  }
}
