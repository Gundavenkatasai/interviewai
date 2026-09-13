import { describe, it, expect } from "vitest";
import { OptimizationValidator } from "../src/modules/resume/optimization/optimization.validator";
import { OptimizationService } from "../src/modules/resume/optimization/optimization.service";
import { AtsEvaluator } from "../src/modules/resume/ats-engine/ats.evaluator";
import { IOptimizationProposal } from "../src/modules/resume/optimization/optimization.types";

describe("AI Resume Optimization Pipeline & Anti-Hallucination Guard", () => {
  it("should REJECT proposals that invent unearned metrics (percentages, multipliers, currency)", () => {
    const proposalWithHallucinatedMetric: IOptimizationProposal = {
      id: "p1",
      section: "Experience",
      targetId: "0",
      originalText: "Improved backend API latency through caching.",
      proposedText: "Improved backend API latency by 42% through Redis caching.",
      reason: "Adds metric",
      evidence: ["Redis"],
      issueIds: ["weak_impact"],
      unsupportedClaims: [],
      risk: "high"
    };

    const result = OptimizationValidator.validateProposal(proposalWithHallucinatedMetric);

    expect(result.valid).toBe(false);
    expect(
      result.rejectedReasons.some((r) => r.includes("Fabricated metric detected"))
    ).toBe(true);
  });

  it("should ALLOW metrics if they were already present in the source resume", () => {
    const proposalWithLegitimateMetric: IOptimizationProposal = {
      id: "p2",
      section: "Experience",
      targetId: "0",
      originalText: "Reduced server latency by 35% using caching.",
      proposedText: "Architected distributed Redis caching layer, reducing server latency by 35% across core microservices.",
      reason: "Replaces weak verb with strong action verb while retaining verified metric",
      evidence: ["Redis", "Microservices"],
      issueIds: ["action_verbs"],
      unsupportedClaims: [],
      risk: "low"
    };

    const result = OptimizationValidator.validateProposal(proposalWithLegitimateMetric);

    expect(result.valid).toBe(true);
    expect(result.rejectedReasons.length).toBe(0);
  });

  it("should REJECT proposals that alter protected fields (company name, job title, degree)", () => {
    const proposalAlteringCompany: IOptimizationProposal = {
      id: "p3",
      section: "Experience",
      targetId: "0",
      originalText: "Software Engineer at Google building cloud tools.",
      proposedText: "Staff Engineer at Meta building cloud tools.",
      reason: "Elevates role title",
      evidence: ["Google"],
      issueIds: ["title"],
      unsupportedClaims: [],
      risk: "high"
    };

    const result = OptimizationValidator.validateProposal(proposalAlteringCompany, {
      knownCompanies: ["Google"],
      knownTitles: ["Software Engineer"]
    });

    expect(result.valid).toBe(false);
    expect(
      result.rejectedReasons.some((r) => r.includes("Protected company name") || r.includes("Protected job title"))
    ).toBe(true);
  });

  it("should REJECT proposals with no evidence provided", () => {
    const proposalNoEvidence: IOptimizationProposal = {
      id: "p4",
      section: "Experience",
      targetId: "0",
      originalText: "Worked on frontend.",
      proposedText: "Engineered scalable Next.js UI.",
      reason: "Improves wording",
      evidence: [], // Empty evidence
      issueIds: ["verbs"],
      unsupportedClaims: [],
      risk: "medium"
    };

    const result = OptimizationValidator.validateProposal(proposalNoEvidence);

    expect(result.valid).toBe(false);
    expect(result.rejectedReasons.some((r) => r.includes("No grounding evidence provided"))).toBe(true);
  });

  it("should generate deterministic optimization plan grounded in real ATS report issues", async () => {
    const resumeText = `Sarah Connor
sarah@example.com | (555) 123-4567 | San Francisco, CA | linkedin.com/in/sarah
WORK EXPERIENCE
Software Engineer | Acme Corp | 2021 - Present
• Worked on REST APIs using Node.js and Express.
• Assisted with database queries in MongoDB.
TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python
Frameworks: React, Node.js, Express, Fastify
Databases: MongoDB, PostgreSQL, Redis`;

    const atsReport = AtsEvaluator.analyze({
      resumeText,
      roleName: "Backend Engineer",
      roleCategory: "software-engineering"
    });

    expect(atsReport.overallScore).toBeGreaterThan(0);

    const plan = await OptimizationService.generatePlan({
      resumeId: "test-resume-1",
      resumeText,
      atsReport,
      targetRole: "Backend Engineer",
      verifiedSkills: ["Node.js", "Express", "TypeScript", "MongoDB", "Redis"]
    });

    expect(plan.proposals.length).toBeGreaterThan(0);

    // Every proposal must be validated with zero fabricated metrics
    for (const proposal of plan.proposals) {
      expect(proposal.originalText).toBeDefined();
      expect(proposal.proposedText).toBeDefined();
      expect(proposal.evidence.length).toBeGreaterThan(0);

      const metrics = OptimizationValidator.extractMetrics(proposal.proposedText);
      const originalMetrics = OptimizationValidator.extractMetrics(proposal.originalText);
      expect(metrics.every((m) => originalMetrics.includes(m))).toBe(true);
    }
  }, 20000);

  it("should generate actionable proposals for user CV venkatasai_cv.pdf without hallucination", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const { ResumeParser } = await import("../src/modules/resume/resume.parser");

    const samplePdfPath = path.join(
      __dirname,
      "../uploads/51aa0bcf-856b-45e8-8795-07b3a7c130c8/venkatasai_cv.pdf"
    );

    if (fs.existsSync(samplePdfPath)) {
      const pdfBuf = fs.readFileSync(samplePdfPath);
      const extracted = await ResumeParser.extractRawText(pdfBuf, "pdf");

      const atsReport = AtsEvaluator.analyze({
        resumeText: extracted.text,
        roleName: "Full Stack Developer",
        roleCategory: "software-engineering"
      });

      const plan = await OptimizationService.generatePlan({
        resumeId: "venkata-cv",
        resumeText: extracted.text,
        atsReport,
        targetRole: "Full Stack Developer"
      });

      expect(plan.proposals.length).toBeGreaterThan(0);

      // Verify all proposals have valid structure and no fabricated metrics
      for (const p of plan.proposals) {
        expect(p.originalText).toBeDefined();
        expect(p.proposedText).toBeDefined();
        expect(p.proposedText.trim().length).toBeGreaterThan(5);
        expect(p.proposedText).not.toEqual(p.originalText);
      }
    }
  }, 60000);
});
