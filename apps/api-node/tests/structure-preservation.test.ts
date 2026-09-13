import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import { ResumeParser } from "../src/modules/resume/resume.parser";
import { StructurePreservingDocxGenerator } from "../src/modules/resume/docx-engine/structure-preserver";

describe("StructurePreservingDocxGenerator", () => {
  const samplePdfPath = path.join(
    __dirname,
    "../uploads/51aa0bcf-856b-45e8-8795-07b3a7c130c8/venkatasai_cv.pdf"
  );

  it("should parse exact original section order and names from user CV", async () => {
    expect(fs.existsSync(samplePdfPath)).toBe(true);
    const pdfBuf = fs.readFileSync(samplePdfPath);
    const extracted = await ResumeParser.extractRawText(pdfBuf, "pdf");

    const ast = StructurePreservingDocxGenerator.parse(extracted.text);

    expect(ast.name).toBe("Gunda Venkata Sai");
    expect(ast.contactLines.length).toBeGreaterThanOrEqual(2);

    const sectionHeadings = ast.sections.map((s) => s.heading);
    expect(sectionHeadings).toEqual([
      "SKILLS",
      "PROJECTS",
      "TRAINING",
      "CERTIFICATIONS",
      "ACHIEVEMENTS",
      "EDUCATION"
    ]);

    // Check skills section has all 6 categories
    const skillsSec = ast.sections.find((s) => s.heading === "SKILLS");
    expect(skillsSec).toBeDefined();
    expect(skillsSec!.items.length).toBe(6);

    // Check projects section has all 3 projects
    const projectsSec = ast.sections.find((s) => s.heading === "PROJECTS");
    expect(projectsSec).toBeDefined();
    const entryHeaders = projectsSec!.items.filter((it) => it.type === "entry_header");
    expect(entryHeaders.length).toBe(3);
    expect(entryHeaders[0].leftText).toContain("MovieGuru");
    expect(entryHeaders[1].leftText).toContain("PizzaCraft");
    expect(entryHeaders[2].leftText).toContain("LPU Live");
  });

  it("should apply swaps strictly to targeted bullets while leaving template and other sections intact", async () => {
    const pdfBuf = fs.readFileSync(samplePdfPath);
    const extracted = await ResumeParser.extractRawText(pdfBuf, "pdf");
    const ast = StructurePreservingDocxGenerator.parse(extracted.text);

    const originalBullet = "Designed a PostgreSQL schema with Prisma across 5+ relational models to manage accounts, watchlists, and sync";
    const proposedBullet = "Designed an optimized PostgreSQL schema with Prisma across 5+ relational models improving query efficiency";

    StructurePreservingDocxGenerator.applySwaps(ast, [
      {
        originalText: originalBullet,
        proposedText: proposedBullet
      }
    ]);

    const docxBuf = await StructurePreservingDocxGenerator.generateDocx(ast);
    expect(docxBuf.length).toBeGreaterThan(5000);

    const extractedDocx = await mammoth.extractRawText({ buffer: docxBuf });
    const text = extractedDocx.value;

    // Check that proposed text replaced the original
    expect(text).toContain("Designed an optimized PostgreSQL schema with Prisma");
    expect(text).not.toContain("to manage accounts, watchlists, and sync");

    // Check all sections are in the generated docx in the same order
    const skillsPos = text.indexOf("SKILLS");
    const projectsPos = text.indexOf("PROJECTS");
    const trainingPos = text.indexOf("TRAINING");
    const certsPos = text.indexOf("CERTIFICATIONS");
    const achievePos = text.indexOf("ACHIEVEMENTS");
    const eduPos = text.indexOf("EDUCATION");

    expect(skillsPos).toBeLessThan(projectsPos);
    expect(projectsPos).toBeLessThan(trainingPos);
    expect(trainingPos).toBeLessThan(certsPos);
    expect(certsPos).toBeLessThan(achievePos);
    expect(achievePos).toBeLessThan(eduPos);

    // Check education entries exist
    expect(text).toContain("Lovely Professional University");
    expect(text).toContain("Sr Junior College");
    expect(text).toContain("Geethanjali High School");
  });
});
