import { describe, it, expect } from "vitest";
import { ResumeATS } from "../src/modules/resume/resume.ats";

describe("Resume ATS Scoring Engine", () => {
  it("should return score 0 and insufficient_data for an empty resume (NO fake scores)", () => {
    const emptyProfile: any = {};
    const result = ResumeATS.calculateScore(emptyProfile);

    expect(result.score).toBe(0);
    expect(result.analysis.categories.structure).toBe(0);
    expect(result.analysis.categories.content).toBe(0);
    expect(result.analysis.categories.jobAlignment).toBe(0);
    expect(result.analysis.issues.length).toBeGreaterThan(0);
    expect(result.analysis.issues.some((i: any) => i.problem?.toLowerCase().includes("no content"))).toBe(true);
  });

  it("should calculate transparent deterministic score for a complete resume", () => {
    const completeProfile: any = {
      personal: {
        fullName: "Sarah Connor",
        email: "sarah.connor@example.com",
        phone: "+1 555-0199",
        location: "San Francisco, CA",
        linkedin: "linkedin.com/in/sarahconnor",
        github: "github.com/sarahconnor",
      },
      summary: "Senior Software Engineer with 6+ years of experience architecting distributed cloud systems and high-throughput microservices using Node.js and TypeScript.",
      experience: [
        {
          role: "Senior Full Stack Engineer",
          company: "Cyberdyne Systems",
          startDate: "2021",
          endDate: "Present",
          bullets: [
            "Architected real-time event streaming pipeline processing 10M messages daily using Apache Kafka and Redis.",
            "Decreased p99 API response times by 35% through query optimization and caching strategies.",
            "Mentored team of 5 junior engineers and established automated CI/CD deployment gates.",
          ],
        },
      ],
      education: [
        {
          degree: "B.S.",
          field: "Computer Science",
          institution: "University of California, Berkeley",
          startDate: "2015",
          endDate: "2019",
        },
      ],
      skills: {
        languages: ["TypeScript", "JavaScript", "Python"],
        frameworks: ["React", "Node.js", "Express", "Fastify"],
        databases: ["PostgreSQL", "MongoDB", "Redis"],
        cloud: ["AWS", "Docker", "Kubernetes"],
      },
      projects: [
        {
          name: "Distributed Task Scheduler",
          description: "Fault-tolerant cron-like task executor built with Node.js and Raft consensus.",
          technologies: ["Node.js", "TypeScript", "Redis"],
          bullets: ["Supports 10k concurrent scheduled jobs with automatic node failover."],
        },
      ],
    };

    const result = ResumeATS.calculateScore(completeProfile, "Senior Backend Engineer");

    // The score must be realistic, strictly greater than 60, and calculated with evidence
    expect(result.score).toBeGreaterThan(60);
    expect(result.score).toBeLessThanOrEqual(100);

    // Categories must have individual breakdowns
    expect(result.analysis.categories.parsing).toBe(100);
    expect(result.analysis.categories.structure).toBeGreaterThan(70);
    expect(result.analysis.categories.content).toBeGreaterThan(60);
    expect(result.analysis.categories.jobAlignment).toBeGreaterThan(60);
  });

  it("should flag critical issues when contact information is missing", () => {
    const profileNoContact: any = {
      summary: "Software Engineer with experience building apps.",
      experience: [
        {
          role: "Developer",
          company: "Acme",
          bullets: ["Built features."],
        },
      ],
    };

    const result = ResumeATS.calculateScore(profileNoContact);

    // Content score must be lower without contact
    expect(result.analysis.categories.content).toBeLessThan(100);

    // Issues must contain missing email/phone in Contact category
    const contactIssues = result.analysis.issues.filter(
      (i: any) => i.category === "Contact" || i.section === "personal"
    );
    expect(contactIssues.length).toBeGreaterThan(0);
    expect(contactIssues.some((i: any) => i.problem.toLowerCase().includes("email"))).toBe(true);
  });

  it("should generate clean, machine-readable plain text for 'What ATS Sees'", () => {
    const profile: any = {
      personal: {
        fullName: "Alex Rivera",
        email: "alex@example.com",
        phone: "+1 555-1234",
      },
      summary: "Dedicated software engineer.",
      experience: [
        {
          role: "Frontend Developer",
          company: "WebTech",
          bullets: ["Developed user-facing dashboards using React and Tailwind."],
        },
      ],
    };

    const plainText = ResumeATS.getWhatAtsSees(profile);

    expect(typeof plainText).toBe("string");
    expect(plainText).toContain("ALEX RIVERA");
    expect(plainText).toContain("alex@example.com");
    expect(plainText).toContain("EXPERIENCE");
    expect(plainText).toContain("Frontend Developer");
    expect(plainText).toContain("WebTech");
  });
});

import { AtsEvaluator } from "../src/modules/resume/ats-engine/ats.evaluator";

describe("AtsEvaluator Engine (Ported from ats-resume-checker)", () => {
  const sampleResume = `
John Doe
john.doe@example.com | (555) 234-5678 | linkedin.com/in/johndoe | github.com/johndoe | San Francisco, CA

Professional Summary
Senior Software Engineer with 6+ years of experience designing, scaling, and architecting distributed systems and cloud native applications using TypeScript, Node.js, Python, and AWS.

Experience
Senior Software Engineer | TechCorp Inc.
Jan 2021 – Present
• Architected event-driven microservices architecture using Node.js and AWS SQS, handling 5M daily requests with 99.99% uptime.
• Engineered automated CI/CD pipeline using Docker and GitHub Actions, cutting release deployment cycles from 4 hours to 12 minutes.
• Spearheaded database migration to PostgreSQL, reducing complex query latency by 42%.

Software Engineer | StartupLabs
Jun 2018 – Dec 2020
• Developed responsive web applications using React and TypeScript, boosting customer conversion by 25%.
• Automated unit and integration testing suite using Vitest and Cypress, improving test coverage to 92%.

Education
Bachelor of Science in Computer Science
University of California, Berkeley | 2014 – 2018 | GPA: 3.8

Skills
Languages: JavaScript, TypeScript, Python, SQL, Java
Frameworks: React, Node.js, Express, Fastify, Next.js
Cloud & DevOps: AWS, Docker, Kubernetes, CI/CD, Git
Databases: PostgreSQL, MongoDB, Redis
`;

  it("should evaluate sample resume across all 8 categories with accurate scoring", () => {
    const report = AtsEvaluator.analyze({
      resumeText: sampleResume,
      roleCategory: "software-engineering",
      roleName: "Senior Software Engineer",
      seniority: "Senior",
      country: "USA",
      atsProfileKey: "generic",
      fileName: "John_Doe_Resume.pdf"
    });

    expect(report.overallScore).toBeGreaterThan(70);
    expect(report.overallScore).toBeLessThanOrEqual(100);
    expect(["A+", "A", "B"]).toContain(report.grade);
    expect(["Green", "Yellow"]).toContain(report.health);
    expect(report.passProbability).toBeGreaterThan(60);

    // Check 6 categories
    expect(report.categoryScores.parsing).toBe(100);
    expect(report.categoryScores.structure).toBeGreaterThan(80);
    expect(report.categoryScores.content).toBeGreaterThan(50);
    expect(report.categoryScores.jobAlignment).toBeGreaterThanOrEqual(0);

    // Check strengths
    expect(report.strengths.length).toBeGreaterThan(0);
    expect(report.sectionWeights.length).toBe(6);
  });

  it("should detect matched and missing keywords against a specific job description", () => {
    const jd = `
We are seeking a Senior Backend Engineer proficient in Go, Rust, Kubernetes, Terraform, GraphQL, and Redis.
Responsibilities include scaling high-concurrency microservices and managing cloud infrastructure.
`;

    const report = AtsEvaluator.analyze({
      resumeText: sampleResume,
      jdText: jd,
      roleCategory: "software-engineering",
      roleName: "Backend Engineer"
    });

    expect(report.keywordRes.usedJD).toBe(true);
    expect(report.keywordRes.missing).toContain("rust");
    expect(report.keywordRes.missing).toContain("terraform");
    expect(report.keywordRes.matched).toContain("kubernetes");
    expect(report.keywordRes.matched).toContain("redis");

    // Missing keywords should appear in issues with suggestions
    const missingIssues = report.issues.filter((i) => i.category === "keywordMatch");
    expect(missingIssues.length).toBeGreaterThan(0);
    expect(missingIssues.some((i) => i.title.toLowerCase().includes("rust"))).toBe(true);
  });

  it("should generate actionable Before & After fixes for weak verbs or unquantified bullets", () => {
    const weakResume = `
Jane Smith
jane@example.com | 555-9876

Summary
Hard working and results-driven developer.

Experience
Developer | Acme Co
2022 - 2023
• Responsible for working on the website
• Helped with bug fixes and stuff
• Was involved in updating the database
`;

    const report = AtsEvaluator.analyze({
      resumeText: weakResume,
      roleCategory: "software-engineering",
      seniority: "Junior"
    });

    expect(report.overallScore).toBeLessThan(70);

    const weakIssue = report.issues.find(
      (i) => i.category === "writingQuality" && i.title.toLowerCase().includes("weak")
    );
    expect(weakIssue).toBeDefined();
    expect(weakIssue?.beforeExample).toBeDefined();
    expect(weakIssue?.afterExample).toBeDefined();

    const achievementIssue = report.issues.find(
      (i) => i.category === "achievements" && i.title.toLowerCase().includes("measurable")
    );
    expect(achievementIssue).toBeDefined();
    expect(achievementIssue?.beforeExample).toBeDefined();
    expect(achievementIssue?.afterExample).toBeDefined();
  });
});
