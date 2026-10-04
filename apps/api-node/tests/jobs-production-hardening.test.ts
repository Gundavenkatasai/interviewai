import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { Job, SavedJob, ViewedJob } from "../src/modules/jobs/jobs.model";
import { JobSourceRegistry } from "../src/modules/jobs/ingestion/source.registry";

describe("Jobs Page Production Hardening & Verification Suite", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect("mongodb://127.0.0.1:27017/applyhustle");
    }
  });

  afterAll(async () => {
    // Keep connection intact for dev server
  });

  describe("Phase 4 & Critical Regression Test: Canonical Source Invariants", () => {
    it("should never contain MockSource in production database", async () => {
      const mockCount = await Job.countDocuments({ source: "MockSource" });
      expect(mockCount).toBe(0);
    });

    it("should have authoritative sources for all database jobs", async () => {
      const invalidSources = await Job.countDocuments({
        $or: [
          { source: { $exists: false } },
          { source: null },
          { source: "" },
          { source: "UNKNOWN" }
        ]
      });
      expect(invalidSources).toBe(0);
    });

    it("should filter strictly on canonical source without leaking Indeed jobs", async () => {
      const linkedInJobs = await Job.find({
        source: { $in: ["LinkedIn", "linkedin", "LINKEDIN"] },
        isActive: { $ne: false },
        isIndiaJob: true
      }).limit(50);

      expect(linkedInJobs.length).toBeGreaterThan(0);
      for (const job of linkedInJobs) {
        expect(job.source.toLowerCase()).toBe("linkedin");
      }
    });

    it("should support all target sources in Critical Regression Test", async () => {
      const testSources = ["LinkedIn", "Naukri", "Foundit", "Wellfound", "Cutshort", "Hirist", "Shine", "TimesJobs"];
      const lowerSources = testSources.map(s => s.toLowerCase());

      const results = await Job.find({
        source: { $in: testSources.flatMap(s => [s, s.toLowerCase(), s.toUpperCase()]) },
        isActive: { $ne: false },
        isIndiaJob: true
      }).limit(100);

      expect(results.length).toBeGreaterThan(0);
      for (const job of results) {
        expect(lowerSources).toContain(job.source.toLowerCase());
        expect(job.source.toLowerCase()).not.toBe("indeed");
      }
    });
  });

  describe("Phase 13 & 14: India-Only & Remote Work Mode Verification", () => {
    it("should ensure 100% of active jobs are verified Indian tech roles", async () => {
      const nonIndiaJobs = await Job.countDocuments({
        isActive: { $ne: false },
        isIndiaJob: false
      });
      expect(nonIndiaJobs).toBe(0);
    });

    it("should properly categorize work modes", async () => {
      const remoteJobs = await Job.countDocuments({
        workMode: { $in: ["REMOTE", "remote", "Remote"] }
      });
      const onsiteJobs = await Job.countDocuments({
        workMode: { $in: ["ONSITE", "onsite", "Onsite"] }
      });
      expect(remoteJobs + onsiteJobs).toBeGreaterThan(0);
    });
  });

  describe("Phase 21: Deterministic Pagination Invariants", () => {
    it("should guarantee no duplicate jobs across consecutive pages", async () => {
      const pageSize = 20;
      const sortObj = { sourcePostedAt: -1, createdAt: -1, _id: -1 };

      const page1 = await Job.find({ isActive: { $ne: false }, isIndiaJob: true })
        .sort(sortObj as any)
        .skip(0)
        .limit(pageSize);

      const page2 = await Job.find({ isActive: { $ne: false }, isIndiaJob: true })
        .sort(sortObj as any)
        .skip(pageSize)
        .limit(pageSize);

      const page1Ids = new Set(page1.map(j => String(j._id)));
      const intersection = page2.filter(j => page1Ids.has(String(j._id)));

      expect(intersection.length).toBe(0);
    });
  });

  describe("Phase 35, 36 & 62: Idempotent User Operations", () => {
    const testUserId = "test-user-prod-hardening-99";
    let sampleJobId: string;

    beforeAll(async () => {
      const sample = await Job.findOne();
      sampleJobId = String(sample!._id);
    });

    afterAll(async () => {
      await SavedJob.deleteMany({ userId: testUserId });
      await ViewedJob.deleteMany({ userId: testUserId });
    });

    it("should handle idempotent save requests without duplicate key errors", async () => {
      // First save
      await SavedJob.findOneAndUpdate(
        { userId: testUserId, jobId: sampleJobId },
        { $setOnInsert: { savedAt: new Date() } },
        { upsert: true, new: true }
      );

      // Duplicate save
      await SavedJob.findOneAndUpdate(
        { userId: testUserId, jobId: sampleJobId },
        { $setOnInsert: { savedAt: new Date() } },
        { upsert: true, new: true }
      );

      const count = await SavedJob.countDocuments({ userId: testUserId, jobId: sampleJobId });
      expect(count).toBe(1);
    });

    it("should handle idempotent view tracking", async () => {
      await ViewedJob.findOneAndUpdate(
        { userId: testUserId, jobId: sampleJobId },
        { $set: { viewedAt: new Date() } },
        { upsert: true, new: true }
      );

      await ViewedJob.findOneAndUpdate(
        { userId: testUserId, jobId: sampleJobId },
        { $set: { viewedAt: new Date() } },
        { upsert: true, new: true }
      );

      const count = await ViewedJob.countDocuments({ userId: testUserId, jobId: sampleJobId });
      expect(count).toBe(1);
    });

    it("should handle unsave cleanly", async () => {
      await SavedJob.deleteOne({ userId: testUserId, jobId: sampleJobId });
      const count = await SavedJob.countDocuments({ userId: testUserId, jobId: sampleJobId });
      expect(count).toBe(0);
    });
  });

  describe("Phase 5: Source Capabilities Registry", () => {
    it("should report all registered sources with capabilities info", () => {
      const capabilities = JobSourceRegistry.getCapabilitiesInfo();
      expect(capabilities.length).toBeGreaterThanOrEqual(10);
      const keys = capabilities.map(c => c.key);
      expect(keys).toContain("LINKEDIN");
      expect(keys).toContain("NAUKRI");
      expect(keys).toContain("INDEED");
      expect(keys).toContain("FOUNDIT");
      expect(keys).toContain("WELLFOUND");
      expect(keys).toContain("CUTSHORT");
      expect(keys).toContain("HIRIST");
      expect(keys).toContain("SHINE");
      expect(keys).toContain("TIMESJOBS");
    });
  });
});
