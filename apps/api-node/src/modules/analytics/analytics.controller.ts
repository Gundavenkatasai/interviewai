import { FastifyRequest, FastifyReply } from "fastify";
import { AnalyticsService } from "./analytics.service";
import { JobApplication } from "../applications/applications.model";
import { Job } from "../jobs/jobs.model";
import { InterviewSession } from "../interview/interview.model";
import { FollowUpTask } from "../outreach/followup.model";

export class AnalyticsController {
  static async trackEvent(request: FastifyRequest, reply: FastifyReply) {
    // Stub to prevent frontend from breaking if it calls /api/analytics/event
    return { success: true };
  }

  static async getOverview(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.sub;
    const { forceRefresh } = request.query as any;
    
    try {
      const summary = await AnalyticsService.getOverview(userId, forceRefresh === 'true');
      return { success: true, data: summary };
    } catch (error: any) {
      console.error("Error in AnalyticsController.getOverview:", error);
      reply.status(500).send({ success: false, error: { message: error.message } });
    }
  }

  static async getEvidence(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.sub;
    const { type, ids } = request.query as any;
    
    if (!ids) {
      return { success: true, data: [] };
    }
    
    const idArray = ids.split(',');
    try {
      let data: any[] = [];
      if (type === 'applications') {
        data = await JobApplication.find({ _id: { $in: idArray }, userId }).populate('jobId', 'title companyName source matchScore');
      } else if (type === 'interviews') {
        data = await InterviewSession.find({ _id: { $in: idArray }, userId });
      }
      return { success: true, data };
    } catch (error: any) {
      reply.status(500).send({ success: false, error: { message: error.message } });
    }
  }
}
