import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Packer,
  HeadingLevel
} from "docx";
import mammoth from "mammoth";
import { ResumeParser } from "../src/modules/resume/resume.parser";
import { AtsEvaluator } from "../src/modules/resume/ats-engine/ats.evaluator";
import { DocxEngine } from "../src/modules/resume/docx-engine";
import { OptimizationService } from "../src/modules/resume/optimization/optimization.service";
import { OptimizationValidator } from "../src/modules/resume/optimization/optimization.validator";
import { StructurePreservingDocxGenerator } from "../src/modules/resume/docx-engine/structure-preserver";

describe("Critical End-to-End Format-Preservation Test", () => {
  it("executes full workflow on a realistic multi-section DOCX with custom formatting", async () => {
    // 1. Build a realistic multi-section DOCX fixture with custom margins, bold keywords, bullets, and dates
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                bottom: 720,
                left: 720,
                right: 720
              }
            }
          },
          children: [
            // Name Header
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Alexander Morgan",
                  bold: true,
                  size: 32,
                  font: "Calibri"
                })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "alex.morgan@example.com | (555) 234-5678 | San Francisco, CA | linkedin.com/in/alexmorgan",
                  size: 20,
                  font: "Calibri"
                })
              ]
            }),

            // Section 1: Technical Skills
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({ text: "TECHNICAL SKILLS", bold: true, size: 24, font: "Calibri" })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Languages: ", bold: true, font: "Calibri" }),
                new TextRun({ text: "TypeScript, JavaScript, Python, SQL", font: "Calibri" })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Frameworks: ", bold: true, font: "Calibri" }),
                new TextRun({ text: "React, Node.js, Express, Next.js, Fastify", font: "Calibri" })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Databases: ", bold: true, font: "Calibri" }),
                new TextRun({ text: "PostgreSQL, MongoDB, Redis, Prisma ORM", font: "Calibri" })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Cloud & Tools: ", bold: true, font: "Calibri" }),
                new TextRun({ text: "AWS (S3, EC2), Docker, Git, CI/CD, Jest", font: "Calibri" })
              ]
            }),

            // Section 2: Work Experience
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({ text: "WORK EXPERIENCE", bold: true, size: 24, font: "Calibri" })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Senior Software Engineer — Apex Global Technologies", bold: true, font: "Calibri" }),
                new TextRun({ text: "\tJan 2022 - Present", font: "Calibri" })
              ]
            }),
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({ text: "Worked on REST APIs and microservices using Node.js and Express.", font: "Calibri" })
              ]
            }),
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({ text: "Assisted with PostgreSQL database query optimization across key endpoints.", font: "Calibri" })
              ]
            }),
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({ text: "Automated test suites using Jest and GitHub Actions for continuous integration.", font: "Calibri" })
              ]
            }),

            // Section 3: Key Projects
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({ text: "KEY PROJECTS", bold: true, size: 24, font: "Calibri" })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "CloudScale - Distributed Task Queue", bold: true, font: "Calibri" }),
                new TextRun({ text: "\t2023", font: "Calibri" })
              ]
            }),
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({ text: "Built a distributed background processing queue using Redis and Node.js.", font: "Calibri" })
              ]
            }),
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({ text: "Integrated Docker container workflows for local and staging deployments.", font: "Calibri" })
              ]
            }),

            // Section 4: Education
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({ text: "EDUCATION", bold: true, size: 24, font: "Calibri" })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "B.S. in Computer Science — University of California, Berkeley", bold: true, font: "Calibri" }),
                new TextRun({ text: "\t2018 - 2022", font: "Calibri" })
              ]
            })
          ]
        }
      ]
    });

    const docxBuffer = await Packer.toBuffer(doc);
    expect(docxBuffer.length).toBeGreaterThan(1000);

    // 2. Parse original resume text
    const extracted = await ResumeParser.extractRawText(docxBuffer, "docx");
    expect(extracted.text).toContain("Alexander Morgan");
    expect(extracted.text).toContain("Apex Global Technologies");

    // 3. Run deterministic ATS scanner (Phase 1: Real initial ATS score)
    const initialAtsReport = AtsEvaluator.analyze({
      resumeText: extracted.text,
      roleName: "Senior Full Stack Engineer",
      roleCategory: "software-engineering"
    });

    expect(initialAtsReport.overallScore).toBeGreaterThan(0);
    expect(initialAtsReport.issues.length).toBeGreaterThan(0);

    // 4. Generate grounded optimization plan
    const structureMap = DocxEngine.buildStructureMap(
      (await (await (await import("jszip")).default.loadAsync(docxBuffer)).file("word/document.xml")!.async("string"))
    );
    expect(structureMap.bullets.length).toBeGreaterThanOrEqual(4);

    const plan = await OptimizationService.generatePlan({
      resumeId: "e2e-alex-morgan",
      resumeText: extracted.text,
      atsReport: initialAtsReport,
      structureMap,
      targetRole: "Senior Full Stack Engineer",
      verifiedSkills: ["Node.js", "Express", "PostgreSQL", "Redis", "Docker", "Jest", "TypeScript"],
      knownCompanies: ["Apex Global Technologies"],
      knownTitles: ["Senior Software Engineer"]
    });

    expect(plan.proposals.length).toBeGreaterThan(0);

    // 5. Anti-hallucination validation on all proposals
    for (const prop of plan.proposals) {
      const validation = OptimizationValidator.validateProposal(prop, {
        knownCompanies: ["Apex Global Technologies"],
        knownTitles: ["Senior Software Engineer"],
        candidateSkills: ["Node.js", "Express", "PostgreSQL", "Redis", "Docker"]
      });
      expect(validation.valid).toBe(true);

      // Verify no metrics were invented
      const propMetrics = OptimizationValidator.extractMetrics(prop.proposedText);
      const origMetrics = OptimizationValidator.extractMetrics(prop.originalText);
      expect(propMetrics.every((m) => origMetrics.includes(m))).toBe(true);
    }

    // 6. Apply approved swaps directly to original DOCX OOXML structure
    const acceptedSwaps = plan.proposals.map((p) => ({
      id: p.id,
      section: p.section,
      roleIndex: p.roleIndex,
      bulletIndex: p.bulletIndex,
      originalText: p.originalText,
      proposedText: p.proposedText,
      approved: true
    }));

    const swapResult = await DocxEngine.applySwaps(docxBuffer, acceptedSwaps);
    expect(swapResult.applied.length).toBeGreaterThan(0);
    expect(swapResult.bulletCountAfter).toBe(swapResult.bulletCountBefore);

    const modifiedDocxBuffer = swapResult.modifiedBuffer;
    expect(modifiedDocxBuffer.length).toBeGreaterThan(1000);

    // 7. Verify format preservation in modified DOCX
    const modifiedMammoth = await mammoth.extractRawText({ buffer: modifiedDocxBuffer });
    const modifiedText = modifiedMammoth.value;

    // Protected fields check
    expect(modifiedText).toContain("Alexander Morgan");
    expect(modifiedText).toContain("Apex Global Technologies");
    expect(modifiedText).toContain("University of California, Berkeley");
    expect(modifiedText).toContain("Jan 2022 - Present");

    // Sections order check
    const skillsIdx = modifiedText.indexOf("TECHNICAL SKILLS");
    const expIdx = modifiedText.indexOf("WORK EXPERIENCE");
    const projIdx = modifiedText.indexOf("KEY PROJECTS");
    const eduIdx = modifiedText.indexOf("EDUCATION");

    expect(skillsIdx).toBeLessThan(expIdx);
    expect(expIdx).toBeLessThan(projIdx);
    expect(projIdx).toBeLessThan(eduIdx);

    // 8. Re-scan updated artifact through ATS scanner (Phase 2: Real second ATS score)
    const secondAtsReport = AtsEvaluator.analyze({
      resumeText: modifiedText,
      roleName: "Senior Full Stack Engineer",
      roleCategory: "software-engineering"
    });

    // Score comparison verification
    expect(secondAtsReport.overallScore).toBeGreaterThanOrEqual(initialAtsReport.overallScore);
    const scoreDelta = secondAtsReport.overallScore - initialAtsReport.overallScore;
    expect(scoreDelta).toBeGreaterThanOrEqual(0);

    // Verify file opens cleanly and can be packaged for download
    expect(modifiedDocxBuffer.slice(0, 4).toString("hex")).toBe("504b0304"); // Valid ZIP/OOXML magic bytes
  }, 30000);
});
