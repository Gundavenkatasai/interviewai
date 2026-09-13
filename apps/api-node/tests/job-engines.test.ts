import { test, expect, describe } from "vitest";
import { TrustEngine } from "../src/modules/jobs/trust.engine";
import { MatchEngine } from "../src/modules/jobs/match.engine";

describe("TrustEngine", () => {
  test("should identify highly trusted job from known ATS", () => {
    const job = {
      title: "Software Engineer",
      companyName: "Tech Corp",
      description: "Standard job description",
      applyUrl: "https://boards.greenhouse.io/techcorp/123",
      companyLogo: "https://logo.com/image.png"
    };

    const { score, details } = TrustEngine.analyzeJob(job as any);
    expect(score).toBe(100);
    expect(details.isOfficialDomain).toBe(true);
    expect(details.suspiciousWording).toBe(false);
  });

  test("should reduce score for suspicious wording and payment terms", () => {
    const job = {
      title: "Data Entry",
      companyName: "Unknown",
      description: "Send money via wire transfer to get your startup kit.",
      applyUrl: "https://scam-site.com/apply"
    };

    const { score, details } = TrustEngine.analyzeJob(job as any);
    expect(score).toBeLessThan(80);
    expect(details.isOfficialDomain).toBe(false);
    expect(details.suspiciousWording).toBe(true);
    expect(details.suspiciousPayment).toBe(true);
  });
});

describe("MatchEngine", () => {
  test("calculateMatch should return correct structure", () => {
    const profile = {
      skills: [{ name: "React" }, { name: "TypeScript" }, { name: "Node.js" }],
      preferredRoles: ["Software Engineer", "Frontend Developer"],
      preferredLocations: ["Remote", "New York"],
      preferredWorkMode: ["Remote"]
    };

    const job = {
      skillsNormalized: ["React", "TypeScript", "GraphQL"],
      roleFamily: "Software Engineer",
      locationNormalized: "Remote",
      workMode: "Remote"
    };

    const match = MatchEngine.calculateMatch(profile, job);
    expect(match.score).toBeGreaterThan(60);
    expect(match.status).toBeDefined();
    expect(match.matchedSkills).toContain("React");
    expect(match.matchedSkills).toContain("TypeScript");
    expect(match.missingSkills).toContain("GraphQL");
    expect(match.explanation).toContain("You share key skills");
  });
});
