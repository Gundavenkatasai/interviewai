import { FastifyRequest, FastifyReply } from "fastify";
import { JobApplication, IApplicationField } from "./applications.model";
import { ApplicationService } from "./application.service";
import { Job } from "../jobs/jobs.model";
import { ResumeVersion } from "../resume/resume.model";
import { ResumeTailoringRun } from "../resume/tailoring/tailoring.model";
import { Profile } from "../profile/profile.model";
import { z } from "zod";

const ApplicationSchema = z.object({
  jobId: z.string().optional(),
  companyName: z.string(),
  jobTitle: z.string(),
  status: z.string().optional(),
  appliedDate: z.string().optional(),
  nextInterviewDate: z.string().optional(),
  notes: z.string().optional(),
  salaryRange: z.string().optional(),
  url: z.string().optional(),
});

export class ApplicationsController {
  static async getApplications(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const applications = await JobApplication.find({ userId }).sort({ appliedDate: -1, createdAt: -1 });
    return { success: true, data: applications };
  }

  static async getApplication(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;
    const application = await JobApplication.findOne({ _id: id, userId });
    
    if (!application) return reply.status(404).send({ success: false, message: "Application not found" });
    return { success: true, data: application };
  }

  static async createApplication(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const data = ApplicationSchema.parse(request.body);
    
    // Check duplication
    if (data.jobId) {
      const existing = await ApplicationService.checkDuplicate(userId, data.jobId);
      if (existing) {
        return reply.status(409).send({ success: false, message: "Duplicate application exists", data: existing });
      }
    }

    const status = data.status || "SAVED";
    const application = await JobApplication.create({
      userId,
      ...data,
      status,
      appliedDate: data.appliedDate ? new Date(data.appliedDate) : undefined,
      nextInterviewDate: data.nextInterviewDate ? new Date(data.nextInterviewDate) : undefined,
      timeline: [
        {
          status,
          date: new Date(),
          notes: "Application record created."
        }
      ]
    });

    return { success: true, data: application };
  }

  static async prepareApplication(request: FastifyRequest<{ Params: { id: string }, Body: { resumeVersionId: string, tailoringRunId?: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;
    const { resumeVersionId, tailoringRunId } = request.body;

    const application = await JobApplication.findOne({ _id: id, userId });
    if (!application) return reply.status(404).send({ success: false, message: "Application not found" });

    // Job Liveness Check
    if (application.jobId) {
      const liveness = await ApplicationService.checkJobLiveness(application.jobId);
      if (liveness === "STALE" || liveness === "REMOVED") {
        // Just a warning, we still proceed but note it
        application.notes = (application.notes ? application.notes + "\\n" : "") + `Warning: Job appears ${liveness.toLowerCase()}`;
      }
    }

    application.status = "PREPARING";
    application.sourceResumeVersionId = resumeVersionId;
    application.tailoringRunId = tailoringRunId;

    // We simulate form detection here by providing some mock fields
    const fields: IApplicationField[] = [
      { fieldId: "f1", label: "First Name", normalizedType: "TEXT", required: true, status: "UNKNOWN" },
      { fieldId: "f2", label: "Last Name", normalizedType: "TEXT", required: true, status: "UNKNOWN" },
      { fieldId: "f3", label: "Email", normalizedType: "EMAIL", required: true, status: "UNKNOWN" },
      { fieldId: "f4", label: "Phone", normalizedType: "PHONE", required: true, status: "UNKNOWN" },
      { fieldId: "f5", label: "LinkedIn", normalizedType: "URL", required: false, status: "UNKNOWN" },
      { fieldId: "f6", label: "Will you now or in the future require sponsorship?", normalizedType: "SELECT", required: true, options: ["Yes", "No"], status: "UNKNOWN" },
      { fieldId: "f7", label: "Why do you want to work here?", normalizedType: "TEXTAREA", required: false, status: "UNKNOWN" },
    ];

    const profile = await Profile.findOne({ userId });
    
    // Run deterministic mapper
    const mappedFields = ApplicationService.mapStandardFields(fields, profile || {});
    
    application.fields = mappedFields;
    application.preparedAt = new Date();
    application.status = "READY_TO_APPLY";
    application.timeline.push({ status: "READY_TO_APPLY", date: new Date(), notes: "Application prepared and fields mapped." });

    await application.save();

    return { success: true, data: application };
  }

  static async generateAnswer(request: FastifyRequest<{ Params: { id: string, fieldId: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id, fieldId } = request.params;
    
    const application = await JobApplication.findOne({ _id: id, userId });
    if (!application) return reply.status(404).send({ success: false, message: "Application not found" });

    const fieldIndex = application.fields.findIndex(f => f.fieldId === fieldId);
    if (fieldIndex === -1) return reply.status(404).send({ success: false, message: "Field not found" });

    const profile = await Profile.findOne({ userId });
    
    // Generate AI Answer
    const updatedField = await ApplicationService.generateAnswer(application.fields[fieldIndex], profile || {}, application.tailoringRunId, userId);
    
    application.fields[fieldIndex] = updatedField;
    application.markModified('fields');
    await application.save();

    return { success: true, data: updatedField };
  }

  static async verifyFields(request: FastifyRequest<{ Params: { id: string }, Body: { fields: Partial<IApplicationField>[] } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;
    const { fields } = request.body;
    
    const application = await JobApplication.findOne({ _id: id, userId });
    if (!application) return reply.status(404).send({ success: false, message: "Application not found" });

    // Update with current browser values
    for (const f of fields) {
      const idx = application.fields.findIndex(af => af.fieldId === f.fieldId);
      if (idx !== -1 && f.currentValue !== undefined) {
        application.fields[idx].currentValue = f.currentValue;
      }
    }

    application.fields = ApplicationService.verifyFields(application.fields);
    application.markModified('fields');
    await application.save();

    return { success: true, data: application.fields };
  }

  static async markSubmitted(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    const { id } = request.params;
    
    const application = await JobApplication.findOne({ _id: id, userId });
    if (!application) return reply.status(404).send({ success: false, message: "Application not found" });

    application.status = "SUBMITTED";
    application.submittedAt = new Date();
    application.appliedDate = new Date();
    application.timeline.push({ status: "SUBMITTED", date: new Date(), notes: "Application marked as submitted by human." });
    
    await application.save();
    return { success: true, data: application };
  }
}
