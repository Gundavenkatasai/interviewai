import mongoose from "mongoose";
import { Resume } from "../apps/api-node/src/modules/resume/resume.model";
import { Job } from "../apps/api-node/src/modules/jobs/jobs.model";
import { ResumeContentIntelligenceService } from "../apps/api-node/src/modules/resume/tailoring/resume-content-intelligence.service";
import { ResumePdfExporterService } from "../apps/api-node/src/modules/resume/pdf-export/resume-pdf-exporter.service";
import { PDFDocument } from "pdf-lib";
import fs from "fs";

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/interviewai");
  console.log("Connected to MongoDB.");

  const resume = await Resume.findOne({ name: "venkatasaicv" });
  if (!resume) {
    console.error("Resume not found");
    process.exit(1);
  }

  const job = await Job.findOne({});
  if (!job) {
    console.error("Job not found");
    process.exit(1);
  }

  console.log("Optimizing for job:", job.title);
  const opt = await ResumeContentIntelligenceService.optimizeForJob(
    resume.profileData,
    {
      id: String(job._id),
      title: job.title,
      companyName: job.companyName,
      description: job.description || "",
      skills: job.skills || []
    }
  );

  console.log("Generating A4 PDF via ResumePdfExporterService...");
  const pdfBuffer = await ResumePdfExporterService.exportToPdf(opt.structuredResume, "tech-fresher");

  console.log("PDF generated! Byte length:", pdfBuffer.length);
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pageCount = pdfDoc.getPageCount();
  console.log("Page count:", pageCount);

  if (pageCount !== 1) {
    console.error(`FAIL: Expected exactly 1 page, got ${pageCount}`);
    process.exit(1);
  }

  fs.writeFileSync("test_generated_resume.pdf", pdfBuffer);
  console.log("Saved test_generated_resume.pdf successfully!");
  console.log(">>> PDF EXPORT VALIDATION PASSED! <<<");

  await mongoose.disconnect();
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
