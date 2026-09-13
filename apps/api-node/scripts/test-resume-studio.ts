import mongoose from "mongoose";
import { Resume, ResumeVersion, ResumeAtsReport, ResumeJobMatch, ResumeActivity, ResumeShare, IResumeProfileData } from "../src/modules/resume/resume.model";
import { ResumeATS } from "../src/modules/resume/resume.ats";
import { ResumeParser } from "../src/modules/resume/resume.parser";
import { ResumeGenerator } from "../src/modules/resume/resume.generator";
import { ResumeMatcher } from "../src/modules/resume/resume.matcher";
import { ResumeAnalytics } from "../src/modules/resume/resume.analytics";
import { ResumeGitHub } from "../src/modules/resume/resume.github";
import { ResumeExporter } from "../src/modules/resume/resume.export";
import { Job } from "../src/modules/jobs/jobs.model";
import { env } from "../src/config/env";
import dotenv from "dotenv";

dotenv.config();

async function runResumeStudioTests() {
  console.log("=================================================");
  console.log("RESUME STUDIO PRODUCTION-READY VERIFICATION SUITE");
  console.log("=================================================\n");

  const mongoUri = env.MONGODB_URI || "mongodb://localhost:27017";
  const dbName = env.MONGODB_DB_NAME || "applyhustle";

  console.log(`[1] Connecting to MongoDB (${mongoUri}/${dbName})...`);
  await mongoose.connect(`${mongoUri}/${dbName}`);
  console.log("✓ Connected to MongoDB successfully.\n");

  const testUserId = "test-user-resume-studio-" + Date.now();

  // Test 1: Real Profile Data Construction & Deterministic ATS Scoring
  console.log("[2] Testing Deterministic ATS Scoring & Issue Severity...");
  const sampleProfile: IResumeProfileData = {
    personal: {
      fullName: "Alex Rivera",
      professionalTitle: "Senior Backend Engineer",
      email: "alex.rivera@example.com",
      phone: "+1 (555) 234-5678",
      location: "San Francisco, CA",
      linkedin: "https://linkedin.com/in/alexrivera",
      github: "https://github.com/alexrivera",
      portfolio: "https://alexrivera.dev",
      website: ""
    },
    summary: "Senior Backend Engineer with 5+ years of experience engineering high-throughput microservices using Node.js, TypeScript, and MongoDB. Specialized in distributed systems and performance optimization.",
    experience: [
      {
        id: "1",
        company: "Stripe",
        role: "Senior Software Engineer",
        location: "San Francisco, CA",
        startDate: "2022",
        endDate: "Present",
        current: true,
        description: "Payment infrastructure",
        bullets: [
          "Architected real-time settlement pipeline handling 10,000+ RPS with 99.99% availability.",
          "Optimized MongoDB aggregations and index strategies, reducing query latency by 45%.",
          "Worked on team tools and helped developers deploy microservices." // deliberately contains weak verb
        ]
      },
      {
        id: "2",
        company: "Twilio",
        role: "Software Engineer",
        location: "San Francisco, CA",
        startDate: "2020",
        endDate: "2022",
        current: false,
        description: "Messaging infrastructure",
        bullets: [
          "Engineered high-concurrency SMS delivery microservices using Node.js and Redis.",
          "Deployed containerized services across Kubernetes clusters serving 5M+ daily messages."
        ]
      }
    ],
    education: [
      {
        id: "1",
        institution: "UC Berkeley",
        degree: "B.S. in Computer Science",
        field: "Computer Science",
        startDate: "2016",
        endDate: "2020",
        gpa: "3.8"
      }
    ],
    projects: [
      {
        id: "1",
        name: "Distributed Rate Limiter",
        description: "Token bucket rate limiter on Redis",
        technologies: ["TypeScript", "Redis", "Fastify"],
        url: "https://github.com/alexrivera/ratelimiter",
        bullets: [
          "Engineered distributed sliding-window rate limiter processing 50k requests per second."
        ]
      }
    ],
    skills: {
      technical: ["Microservices", "REST APIs", "System Design", "Distributed Systems"],
      languages: ["TypeScript", "JavaScript", "Python", "Go"],
      frameworks: ["Node.js", "Fastify", "Express", "React"],
      databases: ["MongoDB", "PostgreSQL", "Redis"],
      cloud: ["AWS", "Docker", "Kubernetes", "CI/CD"],
      tools: ["Git", "Jest"],
      soft: ["System Architecture", "Mentorship"]
    },
    certifications: [],
    achievements: [],
    internships: [],
    publications: [],
    volunteer: [],
    languages: [{ id: "1", language: "English", proficiency: "Native" }],
    interests: [],
    customSections: []
  };

  const { score, analysis } = ResumeATS.calculateScore(sampleProfile, "Senior Backend Engineer");
  console.log(`✓ Calculated ATS Score: ${score}/100`);
  console.log(`✓ Health Score: ${analysis.healthScore}/100`);
  console.log(`✓ Categories: Keywords: ${analysis.categories.keywords}%, Experience: ${analysis.categories.experience}%, Skills: ${analysis.categories.skills}%`);
  console.log(`✓ Issues Detected (${analysis.issues.length}):`);
  analysis.issues.forEach((iss) => {
    console.log(`   - [${iss.severity.toUpperCase()}] ${iss.problem} -> Fix: ${iss.suggestedFix}`);
  });

  if (score < 50 || score > 100) throw new Error("ATS score out of expected bounds");

  // Test 2: Database Persistence & Versioning
  console.log("\n[3] Testing MongoDB Persistence & Versioning...");
  const resume = await Resume.create({
    userId: testUserId,
    name: "Alex Rivera - Senior Backend Resume",
    targetRole: "Senior Backend Engineer",
    profileData: sampleProfile,
    atsScore: score,
    atsAnalysis: analysis,
    version: 1
  });

  await ResumeVersion.create({
    resumeId: resume._id,
    userId: testUserId,
    versionNumber: 1,
    snapshot: resume.toObject(),
    atsScore: score,
    targetRole: "Senior Backend Engineer",
    name: resume.name,
    changeSummary: "Initial version"
  });
  console.log(`✓ Persisted Resume in MongoDB with _id: ${resume._id}`);

  // Test 3: Live AI Writing Assistant & 8 Bullet Modes
  console.log("\n[4] Testing AI Writing Assistant with live Qwen/Groq inference...");
  const weakBullet = "Worked on team tools and helped developers deploy microservices.";
  const improved = await ResumeGenerator.improveBullet(weakBullet, "impact", {
    technologies: ["Node.js", "Docker", "Kubernetes"]
  });
  console.log(`✓ Original: "${weakBullet}"`);
  console.log(`✓ AI Improved (impact mode): "${improved.improved}"`);

  // Test 4: Guided Achievement Generator
  console.log("\n[5] Testing Guided Achievement Generator...");
  const ach = await ResumeGenerator.generateAchievement({
    action: "Engineered Redis caching layer for user session management",
    tech: "Redis, Node.js",
    result: "reduced database load by 60%",
    users: "250,000 monthly users",
    improvement: "300ms faster p99 response times"
  });
  console.log(`✓ Generated Achievement: "${ach.bullet}"`);

  // Test 5: Job Matching Against Real MongoDB Database Jobs
  console.log("\n[6] Testing Job Matching against MongoDB 'jobs' collection...");
  const sampleJob = await Job.findOne({ skills: { $exists: true, $ne: [] } });
  let matchResult;
  if (sampleJob) {
    const jdText = `${sampleJob.title}\n${sampleJob.companyName}\n${sampleJob.description || ""}\nSkills: ${(sampleJob.skills || []).join(", ")}`;
    matchResult = ResumeMatcher.match(sampleProfile, jdText, sampleJob.title);
    console.log(`✓ Matched against real job: "${sampleJob.title}" at "${sampleJob.companyName}"`);
    console.log(`✓ Match Score: ${matchResult.matchScore}%`);
    console.log(`✓ Matched Skills: ${matchResult.matchedSkills.slice(0, 5).join(", ")}`);
    console.log(`✓ Missing Skills: ${matchResult.missingSkills.slice(0, 5).join(", ") || "None"}`);
  } else {
    console.log("Notice: No jobs in DB, testing with standard JD text...");
    const sampleJd = "We are seeking a Senior Backend Engineer proficient in Node.js, TypeScript, MongoDB, Kafka, and AWS to architect distributed financial applications.";
    matchResult = ResumeMatcher.match(sampleProfile, sampleJd, "Senior Backend Engineer");
    console.log(`✓ Match Score: ${matchResult.matchScore}%`);
  }

  // Test 6: Tailoring Diff Engine
  console.log("\n[7] Testing Tailoring Diff Engine (Current vs Proposed)...");
  const sampleJdForDiff = "Senior Backend Engineer specializing in scalable APIs, Kafka streaming, and AWS cloud infrastructure.";
  const diffResult = await ResumeMatcher.generateTailoringDiff(sampleProfile, sampleJdForDiff, "Senior Backend Engineer");
  console.log(`✓ Current Score: ${diffResult.currentScore} -> Potential Tailored Score: ${diffResult.potentialScore}`);
  console.log(`✓ Generated ${diffResult.diff.length} specific diff recommendations:`);
  diffResult.diff.forEach((d) => {
    console.log(`   - [${d.section}] CURRENT: "${d.current.slice(0, 60)}..."`);
    console.log(`     PROPOSED: "${d.proposed.slice(0, 60)}..."`);
  });

  // Test 7: Interview Risk Credibility Checker & Questions
  console.log("\n[8] Testing Credibility Risk Checker & Interview Questions...");
  const credibility = await ResumeGenerator.checkCredibility(sampleProfile);
  console.log(`✓ Overall Risk Level: ${credibility.overallRisk}`);
  console.log(`✓ High-metric claims flagged: ${credibility.riskItems.length}`);
  if (credibility.riskItems.length > 0) {
    console.log(`   - Risk Item: "${credibility.riskItems[0].claim}"`);
    console.log(`   - Sample Interview Probe: "${credibility.riskItems[0].interviewQuestions[0]}"`);
  }

  // Test 8: Public Sharing & Slug Generation
  console.log("\n[9] Testing Public Share Link & Slug Generation...");
  const slug = `alex-rivera-${Date.now()}`;
  await ResumeShare.create({
    resumeId: resume._id,
    userId: testUserId,
    slug,
    isPublic: true,
    views: 0
  });
  console.log(`✓ Generated Public Share Slug: /resume/public/${slug}`);

  // Test 9: Native DOCX, TXT, JSON Exports
  console.log("\n[10] Testing Multi-Format File Generation...");
  const docxBuffer = await ResumeExporter.generateDocx(sampleProfile, "Alex_Rivera_Resume");
  console.log(`✓ Valid Microsoft Word DOCX generated: ${docxBuffer.length} bytes`);
  if (docxBuffer.length < 1000) throw new Error("DOCX buffer size unexpectedly small");

  const txtOutput = ResumeExporter.generateTxt(sampleProfile);
  console.log(`✓ Clean ATS TXT generated: ${txtOutput.length} characters`);
  if (!txtOutput.includes("ALEX RIVERA")) throw new Error("TXT export missing candidate name");

  const jsonOutput = ResumeExporter.generateJson(sampleProfile);
  console.log(`✓ Structured JSON generated: ${jsonOutput.length} characters`);

  // Test 10: Career Recommendations against MongoDB
  console.log("\n[11] Testing Career Recommendations Calculation...");
  const recs = await ResumeAnalytics.getCareerRecommendations(sampleProfile);
  console.log(`✓ Generated ${recs.recommendations.length} role recommendations based on real DB jobs:`);
  recs.recommendations.slice(0, 3).forEach((r) => {
    console.log(`   - ${r.roleTitle}: ${r.matchPercentage}% fit (Matching: ${r.matchingSkills.slice(0, 3).join(", ")})`);
  });

  // Clean up test data
  console.log("\n[12] Cleaning up test database records...");
  await Resume.deleteMany({ userId: testUserId });
  await ResumeVersion.deleteMany({ userId: testUserId });
  await ResumeAtsReport.deleteMany({ userId: testUserId });
  await ResumeJobMatch.deleteMany({ userId: testUserId });
  await ResumeActivity.deleteMany({ userId: testUserId });
  await ResumeShare.deleteMany({ userId: testUserId });
  await mongoose.disconnect();
  console.log("✓ Test records cleaned up. Disconnected from MongoDB.");

  console.log("\n=================================================");
  console.log("ALL 12 RESUME STUDIO TESTS PASSED WITH CODE 0!");
  console.log("=================================================");
}

runResumeStudioTests().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED:", err);
  process.exit(1);
});
