import { test, expect, describe } from "vitest";
import { DocxEngine } from "../src/modules/resume/docx-engine/docx.engine";
import { StructurePreservingDocxGenerator } from "../src/modules/resume/docx-engine/structure-preserver";
import * as fs from "fs";
import * as path from "path";

describe("Resume Tailoring - Format Preservation & DOCX Swapping", () => {
  test("should successfully swap bullet text without destroying structure", async () => {
    // 1. We will use the StructurePreserver to mock a DOCX AST
    const sampleResumeText = `
John Doe
Software Engineer
Email: john@example.com

Experience
Software Engineer at Tech Corp
2020 - Present
- Designed and developed a scalable microservices architecture.
- Built a REST API using Node.js and Express.
- Optimized database queries, reducing load times by 40%.
    `.trim();

    const ast = StructurePreservingDocxGenerator.parse(sampleResumeText);
    
    // Original bullet count
    const bulletCountBefore = ast.sections.reduce(
      (acc, s) => acc + s.items.filter((it) => it.type === "bullet").length,
      0
    );
    expect(bulletCountBefore).toBe(3);

    // 2. Mock a tailored optimization plan
    const swaps = [
      {
        id: "opt-1",
        section: "Experience",
        originalText: "Designed and developed a scalable microservices architecture.",
        proposedText: "Architected a scalable microservices backend using Node.js, improving ATS keyword context.",
        approved: true
      },
      {
        id: "opt-2",
        section: "Experience",
        originalText: "Optimized database queries, reducing load times by 40%.",
        proposedText: "Engineered query optimizations that decreased Postgres latency by 40%.",
        approved: true
      }
    ];

    // 3. Apply swaps
    StructurePreservingDocxGenerator.applySwaps(ast, swaps);
    const modifiedDocxBuffer = await StructurePreservingDocxGenerator.generateDocx(ast);
    
    // Since we generate a real DOCX here, we can't easily count the bullets in the buffer without Mammoth,
    // but we can check the AST that it didn't change the number of items.
    const bulletCountAfter = ast.sections.reduce(
      (acc, s) => acc + s.items.filter((it) => it.type === "bullet").length,
      0
    );

    expect(bulletCountAfter).toBe(bulletCountBefore); // Structure preserved
    
    // Check if AST has the updated text
    const allText = ast.sections.flatMap(s => s.items.map(i => i.rawText)).join(" ");
    expect(allText).toContain("Architected a scalable microservices backend using Node.js");
    expect(allText).toContain("Engineered query optimizations that decreased Postgres latency");
    expect(allText).not.toContain("Designed and developed a scalable microservices");
    
    expect(modifiedDocxBuffer.length).toBeGreaterThan(100);
  });
});
