import { describe, it, expect, beforeEach } from "vitest";
import { ResumeSecurity } from "../src/modules/resume/resume.security";
import { ResumeWorkerQueue } from "../src/modules/resume/resume.queue";
import JSZip from "jszip";
import crypto from "crypto";

describe("Resume Studio Production Hardening Suite", () => {
  describe("Security, Magic Bytes & Path Traversal (Phase 5, 21, 43)", () => {
    it("should accept valid PDF magic bytes (%PDF-)", async () => {
      const validPdfBuffer = Buffer.from("%PDF-1.7\nSample PDF body\n%%EOF");
      const result = await ResumeSecurity.validateUpload(validPdfBuffer, "my_resume.pdf", "application/pdf");

      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe("pdf");
      expect(result.sanitizedFilename).toBe("my_resume.pdf");
      expect(result.storageFilename).toContain("my_resume.pdf");
    });

    it("should reject a fake PDF (text file renamed to .pdf)", async () => {
      const fakePdfBuffer = Buffer.from("Hello world, this is a plain text file pretending to be PDF");
      const result = await ResumeSecurity.validateUpload(fakePdfBuffer, "fake.pdf", "application/pdf");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Unsupported file format");
    });

    it("should accept valid DOCX with valid OOXML structure", async () => {
      const zip = new JSZip();
      zip.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types></Types>');
      zip.file("word/document.xml", '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"></w:document>');
      const docxBuffer = await zip.generateAsync({ type: "nodebuffer" });

      const result = await ResumeSecurity.validateUpload(docxBuffer, "engineer_cv.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

      expect(result.isValid).toBe(true);
      expect(result.fileType).toBe("docx");
      expect(result.sanitizedFilename).toBe("engineer_cv.docx");
    });

    it("should reject corrupted DOCX with invalid OOXML contents", async () => {
      // PK signature without word/document.xml
      const zip = new JSZip();
      zip.file("random.txt", "not a real word doc");
      const badZipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      const result = await ResumeSecurity.validateUpload(badZipBuffer, "corrupt.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid DOCX format");
    });

    it("should sanitize malicious path traversal filenames", () => {
      const dirty1 = "../../../../etc/passwd";
      const dirty2 = "..\\..\\windows\\system32\\cmd.exe";
      const dirty3 = "resume\x00_test.docx";
      const dirty4 = "resume:with*illegal<chars>.pdf";

      expect(ResumeSecurity.sanitizeFilename(dirty1)).not.toContain("../");
      expect(ResumeSecurity.sanitizeFilename(dirty2)).not.toContain("..\\");
      expect(ResumeSecurity.sanitizeFilename(dirty3)).not.toContain("\x00");
      expect(ResumeSecurity.sanitizeFilename(dirty4)).not.toMatch(/[:*<>]/);
    });

    it("should reject oversized files (> 10MB)", async () => {
      const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const result = await ResumeSecurity.validateUpload(oversizedBuffer, "large.pdf", "application/pdf");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("exceeds 10MB limit");
    });

    it("should sanitize XSS and prompt injection in text fields", () => {
      const maliciousText = '<script>alert("XSS")</script>Experienced React Developer with Javascript:void(0) and onload=evil()';
      const clean = ResumeSecurity.sanitizeText(maliciousText);

      expect(clean).not.toContain("<script>");
      expect(clean).not.toContain("javascript:");
      expect(clean).not.toContain("onload=");
    });
  });

  describe("Stable ID Generation & Provenance (Phase 7, 8, 9)", () => {
    it("should inject persistent UUIDs into array items without IDs", () => {
      const profileData: any = {
        experience: [
          { role: "Software Engineer", company: "Acme", bullets: ["Built API"] },
          { id: "existing-uuid-123", role: "Dev", company: "Beta", bullets: ["Fixed bugs"] }
        ],
        education: [
          { degree: "B.S.", field: "CS", institution: "State Univ" }
        ],
        customSections: [
          {
            title: "Volunteer",
            items: [{ title: "Organizer" }]
          }
        ],
        skills: {
          structured: [
            { raw: "TypeScript", normalized: "TypeScript", category: "Languages" }
          ]
        }
      };

      const result = ResumeSecurity.ensureStableIds(profileData);

      expect(result.experience[0].id).toBeDefined();
      expect(result.experience[0].id.length).toBeGreaterThan(10);
      expect(result.experience[1].id).toBe("existing-uuid-123"); // Preserved
      expect(result.education[0].id).toBeDefined();
      expect(result.customSections[0].items[0].id).toBeDefined();
      expect(result.skills.structured[0].id).toBeDefined();
    });
  });

  describe("Worker Queue & Concurrency Protection (Phase 28, 46, 47)", () => {
    it("should execute jobs within bounded concurrency and timeout limits", async () => {
      const queue = ResumeWorkerQueue.getInstance();

      const task = async (val: number) => {
        return val * 2;
      };

      const result = await queue.add("PARSE", "user_1", 21, task, { timeoutMs: 5000 });
      expect(result).toBe(42);
    });

    it("should deduplicate tasks with matching idempotency keys", async () => {
      const queue = ResumeWorkerQueue.getInstance();
      let executionCount = 0;

      const slowTask = async () => {
        executionCount++;
        await new Promise(r => setTimeout(r, 100));
        return "result_data";
      };

      const key = `test_idempotency_${Date.now()}`;
      const [res1, res2] = await Promise.all([
        queue.add("EXPORT", "user_1", {}, slowTask, { idempotencyKey: key }),
        queue.add("EXPORT", "user_1", {}, slowTask, { idempotencyKey: key })
      ]);

      expect(res1).toBe("result_data");
      expect(res2).toBe("result_data");
      expect(executionCount).toBe(1); // Executed only once
    });

    it("should retry transient failures with exponential backoff", async () => {
      const queue = ResumeWorkerQueue.getInstance();
      let attempts = 0;

      const flakyTask = async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error("Temporary network glitch");
        }
        return "recovered";
      };

      const result = await queue.add("ATS_SCAN", "user_1", {}, flakyTask, {
        maxAttempts: 2,
        timeoutMs: 5000
      });

      expect(result).toBe("recovered");
      expect(attempts).toBe(2);
    });
  });
});
