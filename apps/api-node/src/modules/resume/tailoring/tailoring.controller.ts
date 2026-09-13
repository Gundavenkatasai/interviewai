import { FastifyRequest, FastifyReply } from "fastify";
import { Resume, ResumeVersion } from "../resume.model";
import { Job } from "../../jobs/jobs.model";
import { ResumeTailoringRun } from "./tailoring.model";
import { TailoringService } from "./tailoring.service";

export class TailoringController {
  
  /**
   * POST /api/resume/tailor/plan
   * Generates a deterministic tailoring plan based on JD and Resume evidence
   */
  public static async generatePlan(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { resumeVersionId, jobId } = req.body as any;
      const userId = (req as any).user?.id || (req.body as any).userId;

      const resumeVersion = await ResumeVersion.findOne({ _id: resumeVersionId, userId });
      if (!resumeVersion) return reply.status(404).send({ error: "Resume version not found or access denied" });
      
      const resume = await Resume.findOne({ _id: resumeVersion.resumeId, userId });
      if (!resume) return reply.status(404).send({ error: "Canonical resume not found or access denied" });

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
      const userId = (req as any).user?.id || (req.body as any).userId;
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
      const userId = (req as any).user?.id;
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
      const userId = (req as any).user?.id;
      const run = await ResumeTailoringRun.findOne({ _id: (req.params as any).id, userId });
      if (!run) return reply.status(404).send({ error: "Not found or access denied" });
      
      if (run.status !== "UNDER_REVIEW") {
        return reply.status(400).send({ error: "Can only approve runs under review" });
      }

      run.status = "APPROVED";
      await run.save();

      // Create a derived version
      const resumeVersion = await ResumeVersion.findOne({ _id: run.sourceResumeVersionId, userId });
      const newVersion = new ResumeVersion({
        resumeId: resumeVersion!.resumeId,
        userId: run.userId,
        versionNumber: resumeVersion!.versionNumber + 1,
        snapshot: { ...resumeVersion!.snapshot, tailoredFor: run.jobId },
        changeSummary: "Tailored for job " + run.jobId
      });
      await newVersion.save();

      return reply.status(200).send({ run, newVersionId: newVersion._id });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  }
}
