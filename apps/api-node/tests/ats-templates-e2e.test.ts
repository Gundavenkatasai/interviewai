import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app";
import { FastifyInstance } from "fastify";

describe("ATS Resume Templates Suite E2E", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("1. GET /api/resumes/templates returns curated list of ATS templates", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/resumes/templates"
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.templates)).toBe(true);
    expect(body.templates.length).toBeGreaterThanOrEqual(6);

    const classic = body.templates.find((t: any) => t.id === "ats_classic");
    expect(classic).toBeDefined();
    expect(classic.name).toBe("ATS Classic");
    expect(classic.atsCompatibilityScore).toBeGreaterThanOrEqual(95);
    expect(classic.layout).toBeDefined();
    expect(classic.recommendedRoles.length).toBeGreaterThan(0);
  });

  it("2. GET /api/resumes/templates/:id returns specific template details", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/resumes/templates/ats_modern"
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.template.id).toBe("ats_modern");
    expect(body.template.name).toBe("ATS Modern");
  });

  it("3. POST /api/resumes/templates/import extracts verified canonical data with confidence", async () => {
    const sampleResumeText = `
Alex Mercer
alex.mercer@example.com | (555) 234-5678 | Seattle, WA | linkedin.com/in/alexmercer

PROFESSIONAL SUMMARY
Senior Cloud Systems Engineer with 8+ years designing microservices architectures.

WORK EXPERIENCE
Principal Cloud Engineer, Amazon Web Services (2020 - Present)
- Architected serverless ingestion pipelines processing 50M events daily with AWS Lambda and DynamoDB.
- Reduced infrastructure provisioning overhead by 40% using Terraform and automated CI/CD workflows.

Senior Backend Developer, Nordstrom (2016 - 2020)
- Built distributed inventory management microservices using Go and PostgreSQL.
- Optimized database indexing and query execution plans cutting P99 latency by 55ms.

EDUCATION
B.S. in Computer Science, University of Washington (2012 - 2016)

SKILLS & TOOLS
Programming Languages: Go, Python, TypeScript, Java
Cloud & DevOps: AWS, Docker, Kubernetes, Terraform, GitHub Actions
Databases: PostgreSQL, DynamoDB, Redis
    `;

    const res = await app.inject({
      method: "POST",
      url: "/api/resumes/templates/import",
      payload: {
        rawText: sampleResumeText,
        filename: "alex_resume.txt"
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.extractedData).toBeDefined();
    expect(body.extractedData.personal.email).toBe("alex.mercer@example.com");
    expect(body.extractedData.personal.phone).toContain("555");
    expect(body.extractedData.experience.length).toBeGreaterThanOrEqual(1);
    expect(body.extractedData.skills).toBeDefined();
    expect(body.fieldConfidence).toBeDefined();
    expect(body.fieldConfidence.email).toBeDefined();
    expect(body.importId).toBeDefined();
  });

  it("4. POST /api/resumes/templates/generate generates ATS resume and runs real ATS scanner", async () => {
    const verifiedProfileData = {
      basics: {
        name: "Alex Mercer",
        label: "Senior Cloud Systems Engineer",
        email: "alex.mercer@example.com",
        phone: "(555) 234-5678",
        location: "Seattle, WA"
      },
      personal: {
        fullName: "Alex Mercer",
        professionalTitle: "Senior Cloud Systems Engineer",
        email: "alex.mercer@example.com",
        phone: "(555) 234-5678",
        location: "Seattle, WA",
        linkedin: "linkedin.com/in/alexmercer"
      },
      summary: "Senior Cloud Systems Engineer with 8+ years designing microservices architectures.",
      experience: [
        {
          id: "exp-1",
          role: "Principal Cloud Engineer",
          company: "Amazon Web Services",
          startDate: "2020",
          endDate: "Present",
          location: "Seattle, WA",
          bullets: [
            "Architected serverless ingestion pipelines processing 50M events daily with AWS Lambda.",
            "Reduced infrastructure provisioning overhead by 40% using Terraform and automated CI/CD workflows."
          ]
        }
      ],
      education: [
        {
          id: "edu-1",
          institution: "University of Washington",
          degree: "B.S.",
          field: "Computer Science",
          endDate: "2016"
        }
      ],
      skills: {
        languages: ["Go", "Python", "TypeScript"],
        cloud: ["AWS", "Docker", "Kubernetes", "Terraform"],
        databases: ["PostgreSQL", "DynamoDB", "Redis"],
        tools: ["Git", "CI/CD", "Linux"]
      },
      projects: [],
      certifications: []
    };

    const res = await app.inject({
      method: "POST",
      url: "/api/resumes/templates/generate",
      payload: {
        templateId: "ats_classic",
        profileData: verifiedProfileData,
        targetRole: "Cloud Engineer"
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.resume).toBeDefined();
    expect(body.resume.template).toBe("ats_classic");
    expect(body.atsReport).toBeDefined();
    expect(typeof body.atsReport.overallScore).toBe("number");
    expect(body.atsReport.overallScore).toBeGreaterThan(0);
    expect(body.atsReport.categoryScores).toBeDefined();

    // 5. Test Template Switch: Switch template to ats_modern while preserving 100% of content
    const switchRes = await app.inject({
      method: "POST",
      url: `/api/resumes/${body.resume._id}/switch-template`,
      payload: {
        templateId: "ats_modern"
      }
    });

    expect(switchRes.statusCode).toBe(200);
    const switchBody = JSON.parse(switchRes.body);
    expect(switchBody.success).toBe(true);
    expect(switchBody.resume.template).toBe("ats_modern");
    // Canonical data preserved
    expect(switchBody.resume.profileData.personal.email).toBe("alex.mercer@example.com");
    expect(switchBody.resume.profileData.experience[0].company).toBe("Amazon Web Services");
    expect(switchBody.atsReport).toBeDefined();
  });
});
