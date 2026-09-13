import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { MatchEngine } from "./match.engine";
import { Profile } from "../profile/profile.model";
import { Job, JobMatchScore } from "./jobs.model";
import { MATCH_ENGINE_VERSION } from "./matching/constants";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Day 5: Job Matching Engine", () => {
  
  it("should evaluate a hard blocker for location constraints", () => {
    const candidate = new Profile({
      userId: "user-1",
      careerGoals: { hardConstraints: ["REMOTE_ONLY"] }
    });

    const job = new Job({
      title: "Software Engineer",
      workMode: "ONSITE",
      isIndiaJob: true
    });

    const result = MatchEngine.calculateMatch(candidate, job);
    
    expect(result.status).toBe("BLOCKER");
    expect(result.matchScore).toBe(0);
    expect(result.hardConstraints.length).toBeGreaterThan(0);
    expect(result.hardConstraints[0].reason).toContain("Remote only");
  });

  it("should return a strong match for fully aligned profile", () => {
    const candidate = new Profile({
      userId: "user-2",
      skills: [
        { name: "Python", provenance: { status: "VERIFIED" } },
        { name: "AWS", provenance: { status: "VERIFIED" } },
        { name: "FastAPI", provenance: { status: "VERIFIED" } }
      ],
      careerGoals: { targetDirections: ["Backend Engineer"] },
      experience: [
        { title: "Backend Engineer", company: "Company A" },
        { title: "Backend Developer", company: "Company B" }
      ],
      preferredLocations: ["Bangalore"],
      preferredWorkMode: ["HYBRID"]
    });

    const job = new Job({
      title: "Backend Engineer",
      skillsNormalized: ["Python", "AWS", "FastAPI"],
      location: "Bangalore",
      workMode: "HYBRID",
      isIndiaJob: true,
      minExperience: 3
    });

    const result = MatchEngine.calculateMatch(candidate, job);
    
    expect(result.status).toBe("STRONG");
    expect(result.matchScore).toBeGreaterThanOrEqual(80);
    expect(result.matchedSkills).toContain("python");
    expect(result.missingSkills.length).toBe(0);
    expect(result.breakdown.location?.status).toBe("MATCH");
  });

  it("should handle UNKNOWNs properly without failing", () => {
    const candidate = new Profile({
      userId: "user-3",
      skills: [{ name: "Java" }]
      // Missing career goals, experience, and location preferences
    });

    const job = new Job({
      title: "Backend Engineer",
      // Missing skills
    });

    const result = MatchEngine.calculateMatch(candidate, job);
    
    expect(result.status).not.toBe("BLOCKER");
    // Missing skills in job -> skills UNKNOWN
    expect(result.unknownSignals).toContain("Job skills not specified");
  });
});
