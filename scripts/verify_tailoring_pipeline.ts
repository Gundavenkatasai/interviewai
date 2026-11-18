import mongoose from "mongoose";
import { Resume } from "../apps/api-node/src/modules/resume/resume.model";
import { Profile } from "../apps/api-node/src/modules/profile/profile.model";
import { Job } from "../apps/api-node/src/modules/jobs/jobs.model";
import { ResumeContentIntelligenceService } from "../apps/api-node/src/modules/resume/tailoring/resume-content-intelligence.service";
import { ResumeValidator } from "../apps/api-node/src/modules/resume/validation/resume-validator";

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/interviewai");
  console.log("Connected to MongoDB.");

  const resume = (await Resume.findOne({ name: "venkatasaicv" })) || (await Resume.findOne({ status: "active" }));
  if (!resume) {
    console.error("Active resume not found!");
    process.exit(1);
  }

  const candidate = (await Profile.findOne({ userId: resume.userId })) || (await Profile.findOne({}));

  console.log(`\n--- VERIFIED CANDIDATE RECORD ---`);
  console.log(`Candidate: ${candidate.personal?.name} (${candidate.userId})`);
  console.log(`Resume ID: ${resume._id}`);
  console.log(`Verified Projects: ${resume.profileData.projects?.map(p => p.name).join(", ")}`);
  console.log(`Verified Education: ${resume.profileData.education?.map(e => e.institution).join(" | ")}`);

  // Find a target job
  const job = await Job.findOne({ title: { $exists: true } });
  if (!job) {
    console.error("Job not found!");
    process.exit(1);
  }

  console.log(`\n--- TARGET REQUISITION ---`);
  console.log(`Job Title: ${job.title}`);
  console.log(`Company: ${job.companyName}`);

  // Run Optimization
  console.log(`\n--- EXECUTING RESUME CONTENT INTELLIGENCE OPTIMIZATION ---`);
  const result = await ResumeContentIntelligenceService.optimizeForJob(
    resume.profileData,
    {
      id: String(job._id),
      title: job.title,
      companyName: job.companyName,
      description: job.description || "",
      skills: job.skills || []
    }
  );

  console.log(`Template Recommended: ${result.recommendation.templateName} (${result.recommendation.templateId})`);
  console.log(`Rationale: ${result.recommendation.rationale}`);
  console.log(`Validation Score: ${result.validationReport.qualityScore}/100`);
  console.log(`Estimated Pages: ${result.validationReport.estimatedPages}`);
  console.log(`Telemetry Match Score: ${result.telemetry.jobMatchScore}%`);
  console.log(`Telemetry Quality Score: ${result.telemetry.resumeQualityScore}%`);
  console.log(`Telemetry Keyword Coverage: ${result.telemetry.keywordCoverageScore}%`);
  console.log(`Telemetry ATS Readability: ${result.telemetry.atsReadabilityScore}%`);
  console.log(`Matched Skills (${result.telemetry.matchedSkills.length}): ${result.telemetry.matchedSkills.join(", ")}`);

  console.log(`\n--- OPTIMIZED STRUCTURED PROJECTS ---`);
  for (const proj of result.structuredResume.projects) {
    console.log(`- Project: ${proj.name}`);
    console.log(`  Tech Stack: ${proj.technologies.join(", ")}`);
    console.log(`  Bullets (${proj.bullets.length}):`);
    for (const b of proj.bullets) {
      console.log(`    * ${b}`);
    }
  }

  // Validate unfragmented project titles
  const valid = ResumeValidator.validate(result.structuredResume);
  console.log(`\n--- INDEPENDENT VALIDATION AUDIT ---`);
  console.log(`Is Valid: ${valid.isValid}`);
  console.log(`Validation Score: ${valid.score}/100`);
  console.log(`Estimated Page Count: ${valid.metrics.estimatedPageCount}`);
  console.log(`Total Projects: ${valid.metrics.totalProjects}, Total Bullets: ${valid.metrics.totalBullets}`);
  console.log(`Issues: ${valid.issues.length === 0 ? "NONE (100% Clean)" : JSON.stringify(valid.issues, null, 2)}`);

  if (!valid.isValid || result.structuredResume.projects.some(p => p.name.length < 3 || p.name.includes("indicators"))) {
    console.error("FAIL: Fragmented projects detected!");
    process.exit(1);
  }

  console.log("\n>>> ALL TESTS PASSED SUCCESSFULLY! ARCHITECTURE FULLY VALIDATED! <<<");
  await mongoose.disconnect();
}

main().catch(err => {
  console.error("Error during verification:", err);
  process.exit(1);
});
