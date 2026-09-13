import { test, expect, describe } from "vitest";
import { AIContextEngine } from "../src/ai/context.engine";

describe("AIContextEngine", () => {
  test("buildCandidateContext should format string properly", () => {
    const profile = {
      personal: { firstName: "John", lastName: "Doe" },
      experience: [{ title: "Engineer", company: "Google" }],
      skills: [{ name: "TypeScript" }]
    };
    
    const context = AIContextEngine.buildCandidateContext(profile as any);
    expect(context).toContain("John Doe");
    expect(context).toContain("Engineer at Google");
    expect(context).toContain("TypeScript");
  });

  test("buildJobContext should format string properly", () => {
    const job = {
      title: "Senior Dev",
      company: "Acme Corp",
      description: "Must know Node.js",
      skills: ["Node.js", "AWS"]
    };
    
    const context = AIContextEngine.buildJobContext(job as any);
    expect(context).toContain("Senior Dev");
    expect(context).toContain("Acme Corp");
    expect(context).toContain("Must know Node.js");
  });
});
