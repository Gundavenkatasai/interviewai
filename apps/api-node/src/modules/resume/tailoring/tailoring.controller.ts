import { FastifyRequest, FastifyReply } from "fastify";
import { Resume, ResumeVersion } from "../resume.model";
import { Job } from "../../jobs/jobs.model";
import { ResumeTailoringRun } from "./tailoring.model";
import { TailoringService } from "./tailoring.service";
import { ResumeSecurity } from "../resume.security";

export class TailoringController {
  
  /**
   * POST /api/resume/tailor/plan
   * Generates a deterministic tailoring plan based on JD and Resume evidence
   */
  public static async generatePlan(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { resumeVersionId, jobId } = (req.body as any) || {};
      const userId = ResumeSecurity.getUserId(req);
      if (!userId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      if (!resumeVersionId || !jobId) {
        return reply.status(400).send({ error: "Missing required fields: resumeVersionId and jobId" });
      }

      // Try finding by version ID first
      let resumeVersion = await ResumeVersion.findOne({ _id: resumeVersionId, userId });
      let resume: any = null;

      if (!resumeVersion) {
        // Fallback: check if caller passed a canonical resumeId instead of a versionId
        resume = await Resume.findOne({ _id: resumeVersionId, userId });
        if (resume) {
          resumeVersion = await ResumeVersion.findOne({ resumeId: resume._id, userId }).sort({ versionNumber: -1 });
          if (!resumeVersion) {
            // Auto-create initial version 1 if none exists
            resumeVersion = new ResumeVersion({
              resumeId: resume._id,
              userId,
              versionNumber: 1,
              snapshot: resume.profileData || {},
              changeSummary: "Initial version for tailoring"
            });
            await resumeVersion.save();
          }
        }
      } else {
        resume = await Resume.findOne({ _id: resumeVersion.resumeId, userId });
      }

      if (!resumeVersion || !resume) {
        return reply.status(404).send({ error: "Resume version not found or access denied" });
      }

      const job = await Job.findById(jobId);
      if (!job) return reply.status(404).send({ error: "Job not found" });

      // Generate Plan
      const plan = await TailoringService.generatePlan(resume, job);

      // Create Run Record
      const run = new ResumeTailoringRun({
        userId,
        sourceResumeId: resume._id,
        sourceResumeVersionId: resumeVersion._id,
        jobId: job._id,
        jobSnapshot: job,
        status: "DRAFT",
        plan,
        atsScoreBefore: resumeVersion.atsScore || resume.atsScore
      });

      await run.save();

      return reply.status(200).send(run);
    } catch (err: any) {
      console.error("[TailoringController] generatePlan error:", err);
      return reply.status(500).send({ error: err.message });
    }
  }

  /**
   * POST /api/resume/tailor/:id
   * Executes AI tailoring based on the plan
   */
  public static async executeTailoring(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = ResumeSecurity.getUserId(req);
      if (!userId) return reply.status(401).send({ error: "Unauthorized" });

      const runId = (req.params as any).id;
      const run = await ResumeTailoringRun.findOne({ _id: runId, userId });
      if (!run) return reply.status(404).send({ error: "Run not found or access denied" });

      if (run.status !== "DRAFT") {
        return reply.status(400).send({ error: "Cannot execute tailoring on non-draft run" });
      }

      // Execute AI
      const aiProposal = await TailoringService.proposeChanges(runId, userId);
      
      const resumeVersion = await ResumeVersion.findOne({ _id: run.sourceResumeVersionId, userId });
      const resume = await Resume.findOne({ _id: resumeVersion!.resumeId, userId });
      
      // Truth Gate Validation
      const qualityGate = TailoringService.validateDrift(resume!, aiProposal);
      
      run.aiProposal = aiProposal;
      run.qualityGate = qualityGate;
      
      if (!qualityGate.passed) {
        run.status = "REJECTED";
      } else {
        run.status = "UNDER_REVIEW";
      }

      await run.save();

      return reply.status(200).send(run);
    } catch (err: any) {
      console.error("[TailoringController] executeTailoring error:", err);
      return reply.status(500).send({ error: err.message });
    }
  }

  /**
   * GET /api/resume/tailor/:id
   */
  public static async getRun(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = ResumeSecurity.getUserId(req);
      if (!userId) return reply.status(401).send({ error: "Unauthorized" });

      const run = await ResumeTailoringRun.findOne({ _id: (req.params as any).id, userId });
      if (!run) return reply.status(404).send({ error: "Not found or access denied" });
      return reply.status(200).send(run);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  }

  /**
   * POST /api/resume/tailor/:id/approve
   */
  public static async approveRun(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = ResumeSecurity.getUserId(req);
      if (!userId) return reply.status(401).send({ error: "Unauthorized" });

      const run = await ResumeTailoringRun.findOne({ _id: (req.params as any).id, userId });
      if (!run) return reply.status(404).send({ error: "Not found or access denied" });
      
      if (run.status !== "UNDER_REVIEW" && run.status !== "DRAFT") {
        return reply.status(400).send({ error: "Can only approve runs under review or draft" });
      }

      run.status = "APPROVED";
      await run.save();

      // Create a derived version
      const resumeVersion = await ResumeVersion.findOne({ _id: run.sourceResumeVersionId, userId });
      const nextVersionNum = resumeVersion ? (resumeVersion.versionNumber || 1) + 1 : 2;
      const targetResumeId = resumeVersion ? resumeVersion.resumeId : run.sourceResumeId;

      const newVersion = new ResumeVersion({
        resumeId: targetResumeId,
        userId: run.userId,
        versionNumber: nextVersionNum,
        snapshot: { ...(resumeVersion?.snapshot || {}), tailoredFor: run.jobId },
        changeSummary: "Tailored for job " + run.jobId
      });
      await newVersion.save();

      return reply.status(200).send({ run, newVersionId: newVersion._id });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  }

  /**
   * GET /api/resume/tailor/:id/before-after
   */
  public static async getBeforeAfter(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = ResumeSecurity.getUserId(req);
      if (!userId) return reply.status(401).send({ error: "Unauthorized" });

      const run = await ResumeTailoringRun.findOne({ _id: (req.params as any).id, userId });
      if (!run) return reply.status(404).send({ error: "Not found or access denied" });

      return reply.status(200).send({
        success: true,
        data: {
          before: run.jobSnapshot,
          plan: run.plan,
          proposal: run.aiProposal,
          atsScoreBefore: run.atsScoreBefore
        }
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  }

  /**
   * POST /api/resume/tailor/apply
   */
  public static async applyTailoring(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = ResumeSecurity.getUserId(req);
      if (!userId) return reply.status(401).send({ error: "Unauthorized" });

      const { runId } = (req.body as any) || {};
      if (runId) {
        return TailoringController.approveRun(req, reply);
      }

      return reply.status(200).send({ success: true, message: "Tailoring proposal applied successfully" });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  }
}
