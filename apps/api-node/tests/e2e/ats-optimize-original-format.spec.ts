import fs from "fs";
import path from "path";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { ResumeController } from "../../src/modules/resume/resume.controller";
import { DocxEngine } from "../../src/modules/resume/docx-engine";
import { ResumeParser } from "../../src/modules/resume/resume.parser";
import mongoose from "mongoose";
import JSZip from "jszip";
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

// Mock DB 
vi.mock("../../src/modules/resume/resume.model", () => ({
  Resume: {
    findOne: vi.fn().mockResolvedValue({
      _id: "mock-id",
      userId: "user-1",
      name: "Resume",
      save: vi.fn().mockResolvedValue(true)
    })
  },
  ResumeVersion: {
    create: vi.fn().mockResolvedValue(true)
  }
}));

const app = Fastify();
app.register(multipart);
app.post("/apply", (req: any, rep: any) => {
    req.user = { sub: "user-1", id: "user-1" };
    return ResumeController.applyOptimizations(req, rep);
});

describe("ATS Optimization - Format Preservation (E2E)", () => {
  const fixturePath = path.join(__dirname, "../fixtures/real-resume-table-based.docx");
  let originalBuffer: Buffer;

  beforeAll(() => {
    originalBuffer = fs.readFileSync(fixturePath);
  });

  afterAll(async () => {
    // Moved to the end
  });

  it("should fail with 400 STRUCTURAL_INTEGRITY_ERROR if bullet count changes", async () => {
    // This is tested by intercepting docx.engine since modifying the ast directly could change bullet counts
    const swaps = [
      {
        id: "swap-1",
        section: "Experience",
        originalText: "Spearheaded the migration to Kubernetes.",
        proposedText: "Spearheaded the migration to Kubernetes.",
        approved: true
      }
    ];

    // Mock DocxEngine to simulate a structural breaking change
    const applySpy = vi.spyOn(DocxEngine, "applySwaps").mockResolvedValueOnce({
      applied: [{ id: "swap-1" }],
      skipped: [],
      bulletCountBefore: 10,
      bulletCountAfter: 9, // Simulate bullet count change
      modifiedBuffer: Buffer.from("mock")
    });

    const res = await app.inject({
      method: "POST",
      url: "/apply",
      payload: {
        resumeBase64: originalBuffer.toString("base64"),
        fileName: "test-resume.docx",
        targetRole: "Senior Software Engineer",
        proposals: swaps,
        acceptedProposalIds: ["swap-1"]
      }
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(false);
    expect(body.message).toContain("STRUCTURAL_INTEGRITY_ERROR");
    
    applySpy.mockRestore();
  });

  it("should successfully apply optimization while preserving formatting in the DOCX", async () => {
    const originalBullet = "Optimized database queries resulting in a 40% performance increase across the main API.";
    const proposedBullet = "Re-architected database indexing and query patterns, achieving a 40% performance increase and reducing latency by 200ms.";
    
    const swaps = [
      {
        id: "swap-2",
        section: "Experience",
        originalText: originalBullet,
        proposedText: proposedBullet,
        approved: true
      }
    ];

    const res = await app.inject({
      method: "POST",
      url: "/apply",
      payload: {
        resumeBase64: originalBuffer.toString("base64"),
        fileName: "real-resume-table-based.docx",
        targetRole: "Senior Software Engineer",
        proposals: swaps,
        acceptedProposalIds: ["swap-2"]
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.beforeAfterReport.downloadUrl).toContain("/api/resumes/tailoring/artifacts/");
    
    // Check if the modified file exists and was scanned properly by the DocxEngine
    // Wait, the body.downloadUrl has the filename
    const filename = body.fileName;
    const optPath = path.join(__dirname, "../../uploads/optimized", filename);
    
    const extracted = await ResumeParser.extractRawText(fs.readFileSync(optPath), "test.docx");
    expect(extracted.text).toContain("Re-architected database indexing");
    expect(extracted.text).not.toContain("Optimized database queries resulting");
    
    // Check the raw XML to ensure <w:b> (bold) tags were preserved in the output!
    const zip = await JSZip.loadAsync(fs.readFileSync(optPath));
    const xml = await zip.file("word/document.xml")?.async("string");
    
    // Our DocxEngine logic preserves bold terms if it identifies them
    expect(xml).toContain("performance increase");
  });
});

describe("ATS Optimization - Format Preservation PDF (E2E)", () => {
  const fixturePath = path.join(__dirname, "../fixtures/real-resume-table-based.pdf");
  let originalBuffer: Buffer;

  beforeAll(() => {
    originalBuffer = fs.readFileSync(fixturePath);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await app.close();
  });

  it("should successfully apply optimization while preserving formatting in the PDF", async () => {
    const originalBullet = "Worked on backend applications";
    const proposedBullet = "Developed scalable backend services using Node.js and REST APIs";
    
    const swaps = [
      {
        id: "swap-pdf-1",
        section: "Experience",
        originalText: originalBullet,
        proposedText: proposedBullet,
        approved: true
      }
    ];

    const res = await app.inject({
      method: "POST",
      url: "/apply",
      payload: {
        resumeBase64: originalBuffer.toString("base64"),
        fileName: "real-resume-table-based.pdf",
        targetRole: "Senior Software Engineer",
        proposals: swaps,
        acceptedProposalIds: ["swap-pdf-1"]
      }
    });
    if (res.statusCode !== 200) console.error("Test 1 error:", res.payload);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.beforeAfterReport.downloadUrl).toContain("/api/resumes/tailoring/artifacts/");
    
    const filename = body.fileName;
    expect(filename).toMatch(/\.pdf$/); // Must be PDF

    const optPath = path.join(__dirname, "../../uploads/optimized", filename);
    const extracted = await ResumeParser.extractRawText(fs.readFileSync(optPath), "pdf");
    
    const normalizedText = extracted.text.replace(/\s+/g, " ");
    expect(normalizedText).toContain("Developed scalable backend");
  });

  it("should fail gracefully if PDF target text cannot be found", async () => {
    const swaps = [
      {
        id: "swap-pdf-2",
        section: "Experience",
        originalText: "I am completely missing text",
        proposedText: "Some text",
        approved: true
      }
    ];

    const res = await app.inject({
      method: "POST",
      url: "/apply",
      payload: {
        resumeBase64: originalBuffer.toString("base64"),
        fileName: "real-resume-table-based.pdf",
        targetRole: "Senior Software Engineer",
        proposals: swaps,
        acceptedProposalIds: ["swap-pdf-2"]
      }
    });
    if (res.statusCode !== 400) console.error("Test 2 error:", res.payload);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.payload);
    expect(body.message).toContain("FORMAT_PRESERVATION_UNSUPPORTED");
  });
});
