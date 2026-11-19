import { describe, it, expect } from "vitest";
import { AtsScoringService } from "../src/modules/ats/ats-scoring.service";

describe("ATS Deterministic 7-Category Scoring Service", () => {
  const strongSeniorResume = `
Alex Mercer
alex.mercer@cloudscale.io | +1 (555) 382-9102 | San Francisco, CA
linkedin.com/in/alexmercer | github.com/alexmercer

Professional Summary
Staff Systems Engineer with 8+ years designing fault-tolerant, high-concurrency distributed engines in Go and TypeScript. Proven track record eliminating single points of failure across production multi-region banking tiers.

Skills
Languages: Go, TypeScript, Python, SQL, Rust, Bash
Frameworks: React, Node.js, Fastify, Next.js, Gin, Express
Databases: PostgreSQL, Redis, Cassandra, MongoDB
Cloud & DevOps: AWS, Kubernetes, Docker, Terraform, CI/CD, ArgoCD

Experience
Staff Distributed Systems Engineer | ScaleGrid Infrastructure
Jan 2021 – Present | San Francisco, CA
• Architected distributed consensus engine handling 450k req/sec using Raft and Go, reducing tail latency by 34%.
• Standardized declarative ArgoCD GitOps pipelines, eliminating deployment rollbacks and boosting release velocity by 60%.
• Overhauled PostgreSQL database indexing and query cache, scaling concurrent read operations by 3.5x.

Senior Backend Engineer | Apex FinTech
Mar 2017 – Dec 2020 | New York, NY
• Engineered real-time fraud detection microservice processing $40M daily volume with sub-15ms p99 SLA.
• Reduced AWS infrastructure spend by $180k annually via spot instance auto-scaling clusters.

Education
Bachelor of Science in Computer Science
University of California, Berkeley | 2013 – 2017
`;

  const weakStudentResume = `
John Doe
No email provided
Summary: Looking for an internship or job.

Experience:
Acme Corp
2023
• Responsible for working on the website
• Helped with some bug fixes
• Handled customer tickets
`;

  it("should evaluate strong senior resume to 85+ score with accurate category distribution", () => {
    const result = AtsScoringService.evaluate(
      strongSeniorResume,
      {
        personal: {
          fullName: "Alex Mercer",
          email: "alex.mercer@cloudscale.io",
          phone: "+1 555-382-9102",
          linkedin: "linkedin.com/in/alexmercer",
          github: "github.com/alexmercer",
        },
        summary: "Staff Systems Engineer with 8+ years designing fault-tolerant distributed engines in Go and TypeScript.",
        skills: {
          languages: ["Go", "TypeScript", "Python", "SQL", "Rust"],
          frameworks: ["React", "Node.js", "Fastify"],
          databases: ["PostgreSQL", "Redis"],
          cloud: ["AWS", "Kubernetes", "Docker", "Terraform"],
        },
        experience: [
          {
            role: "Staff Distributed Systems Engineer",
            company: "ScaleGrid Infrastructure",
            bullets: [
              "Architected distributed consensus engine handling 450k req/sec using Raft and Go, reducing tail latency by 34%.",
              "Standardized declarative ArgoCD GitOps pipelines, eliminating deployment rollbacks and boosting release velocity by 60%.",
              "Overhauled PostgreSQL database indexing and query cache, scaling concurrent read operations by 3.5x.",
            ],
          },
        ],
        education: [
          {
            degree: "Bachelor of Science in Computer Science",
            institution: "University of California, Berkeley",
            graduationYear: "2017",
          },
        ],
      },
      { mode: "GENERAL", pageCount: 1, fileName: "Alex_Mercer.pdf" }
    );

    // Verify 7 Category Weights Sum: 25 + 15 + 15 + 15 + 10 + 10 + 10 = 100
    const cats = result.categoryScores;
    expect(cats.keywordsSkills.maxScore).toBe(25);
    expect(cats.resumeStructure.maxScore).toBe(15);
    expect(cats.experienceProjects.maxScore).toBe(15);
    expect(cats.formattingReadability.maxScore).toBe(15);
    expect(cats.educationCertifications.maxScore).toBe(10);
    expect(cats.contactInfo.maxScore).toBe(10);
    expect(cats.grammarClarity.maxScore).toBe(10);

    const totalMax =
      cats.keywordsSkills.maxScore +
      cats.resumeStructure.maxScore +
      cats.experienceProjects.maxScore +
      cats.formattingReadability.maxScore +
      cats.educationCertifications.maxScore +
      cats.contactInfo.maxScore +
      cats.grammarClarity.maxScore;
    expect(totalMax).toBe(100);

    // Assert high score for strong senior resume
    expect(result.overallScore).toBeGreaterThanOrEqual(85);
    expect(["Excellent", "Very Good"]).toContain(result.scoreBand);
    expect(result.strengths.length).toBeGreaterThanOrEqual(3);
    expect(cats.contactInfo.score).toBe(10); // Full contact info
    expect(cats.educationCertifications.score).toBeGreaterThanOrEqual(8);
  });

  it("should evaluate weak resume with critical issues and explainable deductions", () => {
    const result = AtsScoringService.evaluate(
      weakStudentResume,
      {
        personal: { fullName: "John Doe" },
        summary: "Looking for an internship or job.",
        experience: [
          {
            role: "Intern",
            company: "Acme Corp",
            bullets: [
              "Responsible for working on the website",
              "Helped with some bug fixes",
              "Handled customer tickets",
            ],
          },
        ],
      },
      { mode: "GENERAL", pageCount: 1, fileName: "Weak_Resume.pdf" }
    );

    expect(result.overallScore).toBeLessThan(55);
    expect(["Needs Improvement", "Weak", "Poor"]).toContain(result.scoreBand);

    // Critical issue for missing email
    const emailIssue = result.issues.find((i) => i.category === "contactInfo" && i.severity === "CRITICAL");
    expect(emailIssue).toBeDefined();
    expect(emailIssue?.title.toLowerCase()).toContain("email");

    // Issues for weak passive phrasing
    const passiveIssue = result.issues.find((i) => i.category === "grammarClarity" || i.category === "experienceProjects");
    expect(passiveIssue).toBeDefined();
  });

  it("should perform Job-Specific ATS Keyword matching against target JD", () => {
    const jd = `
We are looking for a Senior Cloud & Distributed Systems Engineer.
Requirements: Kubernetes, Terraform, ArgoCD, Go, Kafka, PostgreSQL, Distributed Systems, Microservices.
Nice to have: Cassandra, Redis, Rust.
`;

    const result = AtsScoringService.evaluate(
      strongSeniorResume,
      {
        skills: {
          languages: ["Go", "TypeScript", "Rust"],
          frameworks: ["React", "Node.js"],
          databases: ["PostgreSQL", "Redis", "Cassandra"],
          cloud: ["Kubernetes", "Docker", "Terraform", "ArgoCD"],
        },
      },
      { mode: "JOB_SPECIFIC", jdText: jd, targetRole: "Senior Cloud Engineer" }
    );

    expect(result.keywordAnalysis.mode).toBe("JOB_SPECIFIC");
    expect(result.keywordAnalysis.jdMatchScore).toBeGreaterThan(60);
    expect(result.keywordAnalysis.matchedKeywords).toContain("kubernetes");
    expect(result.keywordAnalysis.matchedKeywords).toContain("terraform");
    expect(result.keywordAnalysis.matchedKeywords).toContain("argocd");
  });
});
