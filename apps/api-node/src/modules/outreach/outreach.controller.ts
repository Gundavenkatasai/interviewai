import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { CareerContact } from "./contact.model";
import { CommunicationActivity } from "./communication.model";
import { FollowUpTask } from "./followup.model";
import { CommunicationEngine } from "./communication.engine";
import { ClaimValidatorEngine } from "./claim-validator.engine";
import { FollowUpEngine } from "./followup.engine";
import { JobApplication } from "../applications/applications.model";
import { InterviewSession } from "../interview/interview.model";

const DraftRequestSchema = z.object({
  applicationId: z.string().optional(),
  interviewId: z.string().optional(),
  contactId: z.string().optional(),
  type: z.string(),
  tone: z.string().default("professional"),
  channel: z.string().default("EMAIL")
});

const SubmitCommunicationSchema = z.object({
  activityId: z.string(),
  action: z.enum(["COPY", "SEND"])
});

export class OutreachController {

  static async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    
    // Get due followups
    const dueFollowUps = await FollowUpTask.find({ userId, status: "DUE" })
      .populate("applicationId")
      .populate("interviewId")
      .populate("contactId")
      .sort({ dueAt: 1 });

    // Get upcoming
    const upcomingFollowUps = await FollowUpTask.find({ userId, status: "NOT_DUE" })
      .populate("contactId")
      .sort({ dueAt: 1 })
      .limit(10);

    // Get recent communications
    const recentActivity = await CommunicationActivity.find({ userId })
      .populate("contactId")
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      success: true,
      data: {
        due: dueFollowUps,
        upcoming: upcomingFollowUps,
        recent: recentActivity
      }
    };
  }

  static async getContacts(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const contacts = await CareerContact.find({ userId }).sort({ createdAt: -1 });
    return { success: true, contacts };
  }

  static async getApplicationTimeline(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;
    
    const activities = await CommunicationActivity.find({ userId, applicationId: id })
      .populate("contactId")
      .sort({ createdAt: 1 });
      
    const followUps = await FollowUpTask.find({ userId, applicationId: id, status: { $in: ["DUE", "NOT_DUE"] } });

    return { success: true, activities, pendingFollowUps: followUps };
  }

  static async generateDraft(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { applicationId, interviewId, contactId, type, tone, channel } = DraftRequestSchema.parse(request.body);

    let jobId;
    let jobContextStr = "";
    let interviewContextStr = "";

    if (applicationId) {
      const app = await JobApplication.findOne({ _id: applicationId, userId });
      if (app && app.jobId) jobId = app.jobId;
    }
    
    if (interviewId) {
      const int = await InterviewSession.findOne({ _id: interviewId, userId });
      if (int) {
        interviewContextStr = `Role: ${int.role}, Tech: ${int.technologies.join(", ")}`;
      }
    }

    const result = await CommunicationEngine.generateDraft({
      userId,
      type,
      tone,
      jobId,
      interviewId,
      contactId
    });

    // Validate claims
    const validation = await ClaimValidatorEngine.validate(result.draft.body, {
      interview: interviewContextStr
    });

    // Save as DRAFT in DB
    const activity = new CommunicationActivity({
      userId,
      applicationId,
      interviewId,
      contactId,
      type,
      channel,
      status: "DRAFT",
      subject: result.draft.subject,
      body: result.draft.body,
      originalDraft: result.draft.body,
      draftVersion: 1,
      metadata: {
        tone,
        validationStatus: validation.status,
        validationReason: validation.reasoning
      }
    });

    await activity.save();

    return {
      success: true,
      activity,
      validation
    };
  }

  static async submitCommunication(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { activityId, action } = SubmitCommunicationSchema.parse(request.body);

    const activity = await CommunicationActivity.findOne({ _id: activityId, userId });
    if (!activity) {
      return reply.status(404).send({ success: false, message: "Activity not found" });
    }

    if (activity.status === "SENT" || activity.status === "USER_COPIED") {
      return reply.status(400).send({ success: false, message: "Already submitted" });
    }

    if (action === "COPY") {
      activity.status = "USER_COPIED";
      activity.sentAt = new Date();
    } else if (action === "SEND") {
      // We don't have a real SMTP connector yet, mock sending process
      activity.status = "SENT";
      activity.sentAt = new Date();
      activity.providerMessageId = `mock-msg-${Date.now()}`;
    }

    await activity.save();

    // If there was a pending follow up for this, suppress it
    await FollowUpEngine.evaluateSuppression(userId, { 
      applicationId: activity.applicationId, 
      interviewId: activity.interviewId, 
      contactId: activity.contactId 
    });

    return { success: true, activity };
  }

  static async suppressFollowUp(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;
    
    const task = await FollowUpTask.findOne({ _id: id, userId });
    if (task) {
      task.status = "SUPPRESSED";
      await task.save();
    }
    
    return { success: true, task };
  }

}
