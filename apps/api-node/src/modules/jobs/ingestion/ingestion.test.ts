import { expect, describe, it, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Job, JobIngestionRun } from "../jobs.model";
import { FakeAdapter } from "./adapters/fake.adapter";
import { IngestionPipeline } from "./ingestion.pipeline";
import { JobDeduplicator } from "./job.deduplicator";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 120000); // 2 mins for mongodb download

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe("Day 4: Job Ingestion Pipeline", () => {
  it("should process and insert new jobs correctly, enforcing India-only filter", async () => {
    const adapter = new FakeAdapter();
    adapter.staticJobs = [
      {
        id: "gh-1",
        title: "Frontend Engineer",
        companyName: "Acme Corp",
        location: "Bengaluru, India",
        url: "https://acme.com/job/1",
        postedAt: new Date().toISOString()
      },
      {
        id: "gh-2",
        title: "Backend Engineer",
        companyName: "Acme Corp",
        location: "London, UK", // Should be filtered out
        url: "https://acme.com/job/2",
        postedAt: new Date().toISOString()
      },
      {
        id: "gh-3",
        title: "Remote Fullstack",
        companyName: "Acme Corp",
        location: "Worldwide (Remote)", // Should be kept
        url: "https://acme.com/job/3",
        workMode: "REMOTE",
        postedAt: new Date().toISOString()
      }
    ];

    const run = await IngestionPipeline.executeSource(adapter);
    expect(run.status).toBe("completed");
    expect(run.jobsFetched).toBe(3);
    expect(run.jobsAccepted).toBe(2); // UK job filtered out
    expect(run.jobsRejected).toBe(1);

    const jobs = await Job.find({});
    expect(jobs.length).toBe(2);
    expect(jobs[0].isIndiaJob).toBe(true);
    expect(jobs[0].freshness).toBe("FRESH"); // Because postedAt is now
  });

  it("should detect duplicate clusters across sources based on contentHash", async () => {
    // Insert a base job first
    const adapter1 = new FakeAdapter();
    adapter1.source = "Lever";
    adapter1.staticJobs = [{
      id: "lev-100",
      title: "Data Scientist",
      companyName: "Globex",
      location: "Pune, India",
      description: "Standard data science role...",
      url: "https://globex.lever.co/lev-100",
      postedAt: new Date().toISOString()
    }];
    await IngestionPipeline.executeSource(adapter1);

    // Run a different adapter with the exact same content (duplicate)
    const adapter2 = new FakeAdapter();
    adapter2.source = "Greenhouse";
    adapter2.staticJobs = [{
      id: "gh-200",
      title: "Data Scientist",
      companyName: "Globex",
      location: "Pune, India",
      description: "Standard data science role...",
      url: "https://globex.greenhouse.io/gh-200",
      postedAt: new Date().toISOString()
    }];
    const run = await IngestionPipeline.executeSource(adapter2);
    
    expect(run.duplicates).toBe(1);
    expect(run.jobsAccepted).toBe(0);

    const jobs = await Job.find({ title: "Data Scientist" });
    expect(jobs.length).toBe(1); // Merged into 1 canonical job
    expect(jobs[0].sourceReferences.length).toBe(2); // Both sources tracked
    expect(jobs[0].sourceReferences[0].source).toBe("Lever");
    expect(jobs[0].sourceReferences[1].source).toBe("Greenhouse");
  });

  it("should handle RESTRICTED sources safely without crashing", async () => {
    const adapter = new FakeAdapter();
    adapter.forceError = true;
    
    // Simulating a RESTRICTED or FAILING source (like LinkedIn block)
    const run = await IngestionPipeline.executeSource(adapter);
    expect(run.status).toBe("FAILING");
    expect(run.jobsFetched).toBe(0);
    expect(run.errorCount).toBe(0); // Error prevented at health check stage
    expect(run.metadata.reason).toBeDefined();
  });
});
