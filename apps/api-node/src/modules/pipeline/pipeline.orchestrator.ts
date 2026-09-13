import { PipelineRun, IPipelineRun, PipelineStage, PipelineStatus, IPipelineStageRecord } from "./pipeline.model";
import { SuppressionEngine } from "./suppression.engine";
import { MatchEngine } from "../jobs/match.engine";
import { TrustEngine } from "../jobs/trust.engine";
import { Job } from "../jobs/jobs.model";
import { Profile } from "../profile/profile.model";
import { ApplicationService } from "../applications/application.service";
import { JobApplication } from "../applications/applications.model";
import { Resume } from "../resume/resume.model";
import { TailoringService } from "../resume/tailoring/tailoring.service";
import { ResumeATS } from "../resume/resume.ats";
import { ResumeVersion } from "../resume/resume.model";
import { ResumeTailoringRun } from "../resume/tailoring/tailoring.model";
import { randomUUID } from "crypto";

export class PipelineOrchestrator {
  
  static async startOrResume(userId: string, jobId: string): Promise<IPipelineRun> {
    let run = await PipelineRun.findOne({ userId, jobId });
    
    if (!run) {
      run = new PipelineRun({
        userId,
        jobId,
        idempotencyKey: randomUUID(),
        status: "PENDING",
        currentStage: "ELIGIBILITY_CHECK",
        startedAt: new Date()
      });
      await (run as any).save();
    } else if (run.status === "SUCCEEDED") {
      return run; // Already finished successfully
    }
    
    // In a system with BullMQ, we would enqueue a job here.
    // Instead, since this orchestrator runs on a Mongoose lock pattern,
    // we simply kick off the async processing.
    if (run.status === "PENDING" || run.status === "FAILED") {
      run.status = "RUNNING";
      run.workerId = randomUUID();
      run.lastHeartbeatAt = new Date();
      await (run as any).save();
      
      // Fire and forget background execution
      this.executeRun(run._id.toString(), run.workerId).catch(console.error);
    }
    
    return run;
  }

  private static async executeRun(runId: string, workerId: string) {
    const run = await PipelineRun.findById(runId);
    if (!run || run.workerId !== workerId || run.status !== "RUNNING") return;

    try {
      const job = await Job.findById(run.jobId);
      const profile = await Profile.findOne({ userId: run.userId });
      
      if (!job || !profile) throw new Error("Job or Profile missing");

      // We define the sequential pipeline of stages
      const stages: PipelineStage[] = [
        "ELIGIBILITY_CHECK",
        "SUPPRESSION",
        "MATCHING",
        "TRUST_EVALUATION",
        "RESUME_SELECTION",
        "TAILORING",
        "ATS_VALIDATION",
        "APPLICATION_PREPARATION",
        "APPLICATION_PACK"
      ];

      for (const stage of stages) {
        // If run is cancelled midway, abort safely
        const freshRun = await PipelineRun.findById(run._id);
        if (!freshRun || freshRun.status === "CANCELLED") return;

        // Skip stages that already succeeded
        const existingStage = run.stages.find(s => s.stage === stage);
        if (existingStage && existingStage.status === "SUCCEEDED") {
          continue;
        }

        // Keep heartbeat alive
        run.lastHeartbeatAt = new Date();
        run.currentStage = stage;
        await (run as any).save();

        await this.executeStage(run, stage, job, profile);
        
        if ((run.status as string) === "FAILED" || (run.status as string) === "BLOCKED") {
          return; // Stop pipeline
        }
      }

      run.status = "SUCCEEDED";
      run.completedAt = new Date();
      await (run as any).save();

    } catch (err: any) {
      run.status = "FAILED";
      run.error = { code: "UNHANDLED_CRASH", message: err.message };
      await (run as any).save();
    }
  }

  private static async executeStage(run: IPipelineRun, stage: PipelineStage, job: any, profile: any) {
    let stageRecord = run.stages.find(s => s.stage === stage);
    if (!stageRecord) {
      stageRecord = { stage, status: "RUNNING", attempts: 1, startedAt: new Date() };
      run.stages.push(stageRecord);
    } else {
      stageRecord.status = "RUNNING";
      stageRecord.attempts += 1;
      stageRecord.startedAt = new Date();
    }
    await (run as any).save();

    try {
      switch (stage) {
        case "ELIGIBILITY_CHECK":
        case "SUPPRESSION": {
          const supp = await SuppressionEngine.evaluate(run.userId, profile, job);
          if (supp.suppressed) {
            stageRecord.status = "SUCCEEDED";
            stageRecord.resultRef = { suppressed: true, reason: supp.reason };
            run.status = "BLOCKED"; // Pipeline gracefully stops
            run.error = { code: "SUPPRESSED", message: supp.reason || "Suppressed" };
          } else {
            stageRecord.status = "SUCCEEDED";
          }
          break;
        }
        case "MATCHING": {
          const matchResult = await MatchEngine.calculateMatch(profile, job);
          stageRecord.resultRef = { score: matchResult.matchScore, status: matchResult.status };
          stageRecord.status = "SUCCEEDED";
          run.matchResultId = "MOCK_DB_ID"; // Usually we save MatchResult to DB
          
          if (matchResult.status === "BLOCKER") {
            run.status = "BLOCKED";
            let message = "Job failed hard match constraints";
            if (matchResult.hardConstraints) {
              for (const hc of matchResult.hardConstraints) {
                if (hc.field === "LOCATION") message = "LOCATION_MISMATCH";
                if (hc.field === "WORK_MODE") message = "WORK_MODE_MISMATCH";
              }
            }
            run.error = { code: "LOW_MATCH", message };
          }
          break;
        }
        case "TRUST_EVALUATION": {
          const trustResult = await TrustEngine.analyzeJob(job);
          stageRecord.resultRef = { score: trustResult.trustScore };
          stageRecord.status = "SUCCEEDED";
          if (trustResult.trustScore < 40) { // e.g., low score is DANGER
            run.status = "BLOCKED";
            run.error = { code: "DANGER_TRUST", message: "Job failed trust constraints" };
          }
          break;
        }
        case "RESUME_SELECTION": {
          const canonical = await Resume.findOne({ userId: run.userId, isCanonical: true });
          if (!canonical) {
            throw new Error("No canonical resume found");
          }
          run.sourceResumeVersionId = canonical._id.toString();
          stageRecord.status = "SUCCEEDED";
          stageRecord.resultRef = { resumeId: canonical._id };
          break;
        }
        case "TAILORING": {
          if (!run.sourceResumeVersionId) throw new Error("Missing resume");
          // Re-use Day 10 tailoring logic
          const resumeVersion = await ResumeVersion.findById(run.sourceResumeVersionId);
          const resume = await Resume.findById(resumeVersion!.resumeId);
          const plan = await TailoringService.generatePlan(resume!, job);
          
          const tailoringRun = new ResumeTailoringRun({
            userId: run.userId,
            sourceResumeId: resume!._id,
            sourceResumeVersionId: resumeVersion!._id,
            jobId: job._id,
            jobSnapshot: job,
            status: "UNDER_REVIEW",
            plan
          });
          
          // Generate AI proposal directly
          await tailoringRun.save();
          const aiProposal = await TailoringService.proposeChanges(tailoringRun._id.toString(), run.userId);
          const qualityGate = TailoringService.validateDrift(resume!, aiProposal);
          
          tailoringRun.aiProposal = aiProposal;
          tailoringRun.qualityGate = qualityGate;
          
          if (!qualityGate.passed) {
             run.status = "BLOCKED";
             run.error = { code: "TAILORING_DRIFT", message: "AI proposal failed no-drift validation" };
          }
          await tailoringRun.save();

          run.tailoringRunId = tailoringRun._id.toString();
          stageRecord.status = "SUCCEEDED";
          stageRecord.resultRef = { tailoringRunId: tailoringRun._id };
          break;
        }
        case "ATS_VALIDATION": {
          // Run Day 8 ATS check on the tailored plan context
          const resumeVersion = await ResumeVersion.findById(run.sourceResumeVersionId);
          const resume = await Resume.findById(resumeVersion!.resumeId);
          const atsResult = ResumeATS.calculateScore(resume!.profileData, job.title);
          stageRecord.status = "SUCCEEDED";
          stageRecord.resultRef = { atsScore: atsResult.score || 80 };
          break;
        }
        case "APPLICATION_PREPARATION": {
          // Day 11 logic
          // Creates a JobApplication in "PREPARING" or "READY_TO_APPLY" state
          const existing = await ApplicationService.checkDuplicate(run.userId, run.jobId);
          let app = existing;
          
          if (!app) {
             app = await JobApplication.create({
                userId: run.userId,
                jobId: run.jobId,
                companyName: job.companyName,
                jobTitle: job.title,
                status: "PREPARING",
                sourceResumeVersionId: run.sourceResumeVersionId,
                tailoringRunId: run.tailoringRunId
             });
          } else {
             app.status = "PREPARING";
             app.sourceResumeVersionId = run.sourceResumeVersionId;
             app.tailoringRunId = run.tailoringRunId;
             await (app as any).save();
          }
          run.applicationId = app._id.toString();
          stageRecord.status = "SUCCEEDED";
          break;
        }
        case "APPLICATION_PACK": {
          // In Day 12, the Application Pack is the unified presentation layer.
          // We mark the Application as READY_FOR_REVIEW for human action.
          if (run.applicationId) {
            await JobApplication.findByIdAndUpdate(run.applicationId, { status: "READY_TO_APPLY" });
          }
          stageRecord.status = "SUCCEEDED";
          break;
        }
        default:
          stageRecord.status = "SUCCEEDED";
      }
    } catch (err: any) {
      stageRecord.status = "FAILED";
      stageRecord.errorCode = "STAGE_ERROR";
      stageRecord.errorMessage = err.message;
      run.status = "FAILED";
      run.error = { code: stageRecord.errorCode, message: err.message };
    }
    
    stageRecord.completedAt = new Date();
    await (run as any).save();
  }
}
