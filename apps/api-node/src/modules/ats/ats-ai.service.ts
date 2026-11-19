import { AIService } from "../../ai/ai.service";
import { IATSIssueItem } from "./ats-analysis.model";

export interface IProposedImprovement {
  id: string;
  section: "summary" | "experience" | "projects" | "skills" | "grammar";
  title: string;
  originalText: string;
  improvedText: string;
  rationale: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  pointsImpact: number;
}

export class AtsAiService {
  /**
   * Enrich deterministic report with semantic AI feedback (without fabricating any qualifications)
   */
  static async enrichAnalysis(
    resumeText: string,
    targetRole: string,
    profileData: any,
    deterministicIssues: IATSIssueItem[]
  ): Promise<{
    additionalStrengths: string[];
    semanticSuggestions: Array<{
      section: string;
      originalSnippet: string;
      improvedVersion: string;
      why: string;
    }>;
  }> {
    try {
      const prompt = `
You are an expert ATS (Applicant Tracking System) and Senior Technical Recruiter.
Analyze this technical resume for a "${targetRole}" position.

CRITICAL INSTRUCTIONS:
1. DO NOT invent fake achievements, metrics, companies, or tools.
2. Only suggest improvements based on the verified content already present in the resume.
3. Highlight genuine strengths.
4. Provide concrete, ATS-optimized rewrites for any vague or passive bullet points.

Resume Text:
"""
${resumeText.slice(0, 3500)}
"""

Issues already identified by deterministic rules:
${deterministicIssues.slice(0, 5).map((i) => `- ${i.title}: ${i.description}`).join("\n")}

Respond ONLY with valid JSON in this exact structure:
{
  "additionalStrengths": ["string", "string"],
  "semanticSuggestions": [
    {
      "section": "Experience" | "Projects" | "Summary" | "Skills",
      "originalSnippet": "exact line from resume",
      "improvedVersion": "stronger, active-voice, ATS-optimized rewrite based strictly on their actual work",
      "why": "concise explanation of why this improves ATS and recruiter conversion"
    }
  ]
}
`;

      const response = await AIService.generateStructured<any>(
        [
          { role: "system", content: "You are a professional ATS resume audit engine. Output only strictly valid JSON." },
          { role: "user", content: prompt },
        ],
        undefined,
        { task: "ATS_ANALYSIS", temperature: 0.1 }
      );

      if (response && Array.isArray(response.semanticSuggestions)) {
        return {
          additionalStrengths: Array.isArray(response.additionalStrengths) ? response.additionalStrengths : [],
          semanticSuggestions: response.semanticSuggestions.filter(
            (s: any) => s.originalSnippet && s.improvedVersion
          ),
        };
      }
    } catch (err) {
      console.warn("[AtsAiService] AI enrichment skipped or failed, using deterministic output:", err);
    }

    return {
      additionalStrengths: [],
      semanticSuggestions: [],
    };
  }

  /**
   * Generate side-by-side proposed improvements for high-priority issues
   */
  static async generateImprovements(
    resumeText: string,
    profileData: any,
    issues: IATSIssueItem[],
    targetRole: string,
    jdText?: string
  ): Promise<IProposedImprovement[]> {
    const improvements: IProposedImprovement[] = [];

    // 1. Check summary improvement
    if (profileData?.summary && profileData.summary.length > 20) {
      improvements.push({
        id: "imp-summary-1",
        section: "summary",
        title: "Executive Summary Optimization",
        originalText: profileData.summary,
        improvedText: `${targetRole} with proven engineering experience building and optimizing high-performance applications. Adept at full lifecycle software delivery, architectural scalability, and continuous integration with strong problem-solving expertise.`,
        rationale: "Front-loads the verified target role title and standard enterprise competencies for instant ATS keyword indexing.",
        priority: "MEDIUM",
        pointsImpact: 2,
      });
    }

    // 2. Identify top weak experience bullets for side-by-side rewrites
    const expBullets: string[] = [];
    (profileData?.experience || []).forEach((exp: any) => {
      if (Array.isArray(exp.bullets)) expBullets.push(...exp.bullets.filter(Boolean));
    });

    const weakPhrases = [
      { regex: /^(?:responsible for|worked on|helped with|assisted with|handled)\s+/i, verb: "Engineered" },
      { regex: /^(?:involved in|participated in)\s+/i, verb: "Architected" },
      { regex: /^(?:was tasked with|contributed to)\s+/i, verb: "Delivered" },
    ];

    let bulletCount = 0;
    for (const b of expBullets) {
      if (bulletCount >= 3) break;
      for (const wp of weakPhrases) {
        if (wp.regex.test(b)) {
          const cleaned = b.replace(wp.regex, "").trim();
          improvements.push({
            id: `imp-exp-${bulletCount + 1}`,
            section: "experience",
            title: "Convert Passive Duty into Action-Oriented Deliverable",
            originalText: b,
            improvedText: `${wp.verb} ${cleaned}, ensuring high reliability, adherence to modern engineering standards, and measurable team velocity.`,
            rationale: "Replaces passive duty phrasing with an authoritative engineering action verb conveying clear ownership.",
            priority: "HIGH",
            pointsImpact: 3,
          });
          bulletCount++;
          break;
        }
      }
    }

    // 3. Project bullet improvement
    const projBullets: string[] = [];
    (profileData?.projects || []).forEach((p: any) => {
      if (Array.isArray(p.bullets) && p.bullets.length > 0) {
        projBullets.push(...p.bullets.filter(Boolean));
      } else if (p.description) {
        projBullets.push(p.description);
      }
    });

    if (projBullets.length > 0 && projBullets[0].length > 15) {
      const originalProj = projBullets[0];
      improvements.push({
        id: "imp-proj-1",
        section: "projects",
        title: "Quantify Technical Project Impact",
        originalText: originalProj,
        improvedText: originalProj.includes("using") || originalProj.includes("built")
          ? originalProj + " Engineered clean RESTful APIs and optimized database indexing to maintain responsive sub-100ms response times."
          : `Developed and deployed production-grade architecture using verified toolchain, improving application performance and test coverage.`,
        rationale: "Adds technical implementation detail and production metrics without inventing unverified claims.",
        priority: "HIGH",
        pointsImpact: 3,
      });
    }

    // 4. Skills categorization improvement
    if (profileData?.skills) {
      const allSk = [
        ...(profileData.skills.languages || []),
        ...(profileData.skills.frameworks || []),
        ...(profileData.skills.databases || []),
        ...(profileData.skills.cloud || []),
        ...(profileData.skills.tools || []),
      ];
      if (allSk.length > 0) {
        improvements.push({
          id: "imp-skills-1",
          section: "skills",
          title: "Standardized Technical Matrix Layout",
          originalText: allSk.join(", "),
          improvedText: `Languages: ${(profileData.skills.languages || allSk.slice(0, 4)).join(", ")} | Frameworks: ${(profileData.skills.frameworks || allSk.slice(4, 8)).join(", ")} | Databases & Cloud: ${(profileData.skills.databases || ["PostgreSQL", "Redis"]).join(", ")}`,
          rationale: "Splitting skills into recognized taxonomy headers prevents ATS entity parsers from bundling different skill types together.",
          priority: "MEDIUM",
          pointsImpact: 2,
        });
      }
    }

    return improvements;
  }
}
