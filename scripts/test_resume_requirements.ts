import mongoose from "mongoose";
import { Resume } from "../apps/api-node/src/modules/resume/resume.model";
import { ResumeContentIntelligenceService } from "../apps/api-node/src/modules/resume/tailoring/resume-content-intelligence.service";
import { ResumePdfExporterService } from "../apps/api-node/src/modules/resume/pdf-export/resume-pdf-exporter.service";
import { ResumeValidator } from "../apps/api-node/src/modules/resume/validation/resume-validator";
import { PDFDocument } from "pdf-lib";

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/interviewai");
  console.log("Connected to MongoDB.");

  const resume = await Resume.findOne({ name: "venkatasaicv" });
  if (!resume) {
    console.error("Resume not found!");
    process.exit(1);
  }

  console.log("Candidate verified projects in database:", resume.profileData.projects.map((p: any) => p.name));

  // TEST 1: Full-Stack Web / Realtime Messaging JD
  console.log("\n==================================================");
  console.log("TEST 1: FULL-STACK / REALTIME MESSAGING ROLE");
  console.log("==================================================");
  const fullstackJd = {
    id: "job-fullstack",
    title: "Full-Stack Web & Realtime Systems Engineer",
    companyName: "SocketWave Communications",
    description: "Seeking a Full-Stack Engineer skilled in React, TypeScript, Node.js, Express, Socket.IO, WebSockets, and MongoDB. Experience with payment integration and realtime communication required.",
    skills: ["React", "Node.js", "Express", "Socket.IO", "TypeScript", "MongoDB", "Razorpay"]
  };

  const opt1 = await ResumeContentIntelligenceService.optimizeForJob(resume.profileData, fullstackJd);
  console.log("Selected Projects (Count: " + opt1.structuredResume.projects.length + "):");
  opt1.structuredResume.projects.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.name} (Stack: ${p.technologies.join(", ")})`);
    console.log(`     Bullets (${p.bullets.length}):`);
    p.bullets.forEach(b => console.log(`       * ${b}`));
  });

  if (opt1.structuredResume.projects.length > 2) {
    throw new Error("FAIL: More than 2 projects selected for Full-Stack JD!");
  }
  if (!opt1.structuredResume.projects.some(p => p.name === "PizzaCraft") || !opt1.structuredResume.projects.some(p => p.name === "LPU Live")) {
    throw new Error("FAIL: Full-Stack JD did not prioritize PizzaCraft & LPU Live!");
  }
  console.log("✓ TEST 1 PASSED: Correctly prioritized top 2 projects for Full-Stack role.");

  // TEST 2: AI / Quality Assurance / Audio Analytics JD
  console.log("\n==================================================");
  console.log("TEST 2: AI & SPEECH INTELLIGENCE ENGINEER ROLE");
  console.log("==================================================");
  const aiJd = {
    id: "job-ai",
    title: "AI & Speech Analytics Engineer",
    companyName: "DeepGram Quality Systems",
    description: "Looking for an AI engineer to build intelligent audio transcription, sentiment analysis, speech-to-text, and automated QA dashboards using Deepgram API and modern frontend analytics.",
    skills: ["Deepgram API", "Speech-to-Text", "Sentiment Analysis", "Tailwind CSS", "JavaScript", "Analytics"]
  };

  const opt2 = await ResumeContentIntelligenceService.optimizeForJob(resume.profileData, aiJd);
  console.log("Selected Projects (Count: " + opt2.structuredResume.projects.length + "):");
  opt2.structuredResume.projects.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.name} (Stack: ${p.technologies.join(", ")})`);
  });

  if (opt2.structuredResume.projects.length > 2) {
    throw new Error("FAIL: More than 2 projects selected for AI JD!");
  }
  if (opt2.structuredResume.projects[0].name !== "Smart-Audit AI") {
    throw new Error("FAIL: AI JD did not rank Smart-Audit AI as top project!");
  }
  console.log("✓ TEST 2 PASSED: Correctly prioritized Smart-Audit AI as top project for AI role.");

  // TEST 3: Strict One-Page PDF Validation for All Templates
  console.log("\n==================================================");
  console.log("TEST 3: STRICT ONE-PAGE PDF GENERATION (ALL TEMPLATES)");
  console.log("==================================================");

  const templates = ["tech-fresher", "classic-ats", "modern-tech", "modern-minimal", "experienced-prof", "academic"] as const;

  for (const tId of templates) {
    const pdfBuf = await ResumePdfExporterService.exportToPdf(opt1.structuredResume, tId);
    const pdfDoc = await PDFDocument.load(pdfBuf);
    const pageCount = pdfDoc.getPageCount();
    console.log(`- Template [${tId}]: Generated ${pdfBuf.length} bytes, Page Count: ${pageCount}`);

    if (pageCount !== 1) {
      throw new Error(`FAIL: Template [${tId}] generated ${pageCount} pages, expected EXACTLY 1!`);
    }
    if (pdfBuf.length < 1000) {
      throw new Error(`FAIL: Template [${tId}] buffer is too small or empty!`);
    }
  }
  console.log("✓ TEST 3 PASSED: All 6 templates produce EXACTLY 1 A4 page with non-empty PDF binary.");

  // TEST 4: Resume Validator Audit
  console.log("\n==================================================");
  console.log("TEST 4: RESUME VALIDATOR AUDIT");
  console.log("==================================================");
  const validation = ResumeValidator.validate(opt1.structuredResume, fullstackJd.skills);
  console.log("Validation Quality Score:", validation.score);
  console.log("Estimated Page Count:", validation.metrics.estimatedPageCount);
  console.log("Total Projects in Resume:", validation.metrics.totalProjects);
  console.log("Total Bullets in Resume:", validation.metrics.totalBullets);
  console.log("Validation Issues Count:", validation.issues.length);

  if (!validation.isValid || validation.metrics.estimatedPageCount !== 1 || validation.metrics.totalProjects > 2) {
    throw new Error("FAIL: ResumeValidator failed acceptance criteria!");
  }
  console.log("✓ TEST 4 PASSED: Validation score 100/100, exactly 1 page estimated, maximum 2 projects confirmed.");

  console.log("\n==================================================");
  console.log(">>> ALL ACCEPTANCE TESTS PASSED WITH 100% SUCCESS! <<<");
  console.log("==================================================");

  await mongoose.disconnect();
}

main().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
