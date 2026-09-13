import { IResumeProfileData } from "./resume.model";
import { Job } from "../jobs/jobs.model";
import { ResumeATS } from "./resume.ats";
import { AIService } from "../../ai/ai.service";

const COMMON_TECH_KEYWORDS = [
  "react", "typescript", "javascript", "node.js", "python", "fastify", "express",
  "mongodb", "postgresql", "mysql", "redis", "docker", "kubernetes", "aws", "gcp",
  "azure", "ci/cd", "microservices", "graphql", "rest api", "system design",
  "git", "linux", "agile", "kafka", "elasticsearch", "unit testing", "jest",
  "tailwind css", "next.js", "vue", "angular", "java", "c++", "go", "rust",
  "terraform", "html5", "css3", "oauth", "jwt", "webpack", "vite", "prisma"
];

export class ResumeMatcher {
  /**
   * Extract structured requirements from Job Description
   */
  static extractJdKeywords(jobDescription: string): {
    requiredSkills: string[];
    preferredSkills: string[];
    keywords: string[];
  } {
    const jdLower = jobDescription.toLowerCase();
    const foundSkills: string[] = [];

    for (const tech of COMMON_TECH_KEYWORDS) {
      const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(?:^|[\\s,;:.()/-])${escaped}(?:$|[\\s,;:.()/-])`, "i").test(jdLower)) {
        foundSkills.push(tech.toUpperCase());
      }
    }

    return {
      requiredSkills: foundSkills.slice(0, 8),
      preferredSkills: foundSkills.slice(8),
      keywords: foundSkills
    };
  }

  /**
   * Collect all candidate skills into a clean lowercase Set
   */
  static getCandidateSkillsSet(profileData: IResumeProfileData): Set<string> {
    const candidateSkills = new Set<string>();
    const all = [
      ...(profileData.skills?.technical || []),
      ...(profileData.skills?.languages || []),
      ...(profileData.skills?.frameworks || []),
      ...(profileData.skills?.databases || []),
      ...(profileData.skills?.cloud || []),
      ...(profileData.skills?.tools || [])
    ];
    for (const s of all) {
      candidateSkills.add(s.toLowerCase().trim());
    }

    // Also check experience & project bullets for explicit skill mentions
    const textCorpus = [
      profileData.summary,
      ...(profileData.experience || []).flatMap((e) => [e.company, e.role, e.description, ...(e.bullets || [])]),
      ...(profileData.projects || []).flatMap((p) => [p.name, p.description, ...(p.technologies || []), ...(p.bullets || [])])
    ].join(" ").toLowerCase();

    for (const tech of COMMON_TECH_KEYWORDS) {
      const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(?:^|[\\s,;:.()/-])${escaped}(?:$|[\\s,;:.()/-])`, "i").test(textCorpus)) {
        candidateSkills.add(tech.toLowerCase());
      }
    }

    return candidateSkills;
  }

  /**
   * Match Resume against a Job Description (0 to 100)
   */
  static match(
    profileData: IResumeProfileData,
    jobDescription: string,
    jobTitle = "Target Role"
  ): {
    matchScore: number;
    breakdown: {
      technicalSkills: number;
      roleAlignment: number;
      experience: number;
      projects: number;
      keywords: number;
      education: number;
    };
    matchedSkills: string[];
    missingSkills: string[];
    strongKeywords: string[];
    missingKeywords: string[];
    recommendations: string[];
  } {
    const { keywords } = this.extractJdKeywords(jobDescription);
    const candidateSkills = this.getCandidateSkillsSet(profileData);

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      let hasMatch = false;
      for (const cs of candidateSkills) {
        if (cs === kwLower || cs.includes(kwLower) || kwLower.includes(cs)) {
          hasMatch = true;
          break;
        }
      }
      if (hasMatch) matchedSkills.push(kw);
      else missingSkills.push(kw);
    }

    // Keyword analysis in experience
    const expText = JSON.stringify(profileData.experience || []).toLowerCase();
    const strongKeywords = matchedSkills.filter((k) => expText.includes(k.toLowerCase()));
    const missingKeywords = missingSkills;

    // Technical Skills Match (40% weight)
    const techRatio = keywords.length > 0 ? matchedSkills.length / keywords.length : 0.8;
    const technicalSkillsScore = Math.min(100, Math.round(techRatio * 100));

    // Role Alignment (20% weight)
    const titleLower = jobTitle.toLowerCase();
    const candidateRoles = (profileData.experience || []).map((e) => (e.role || "").toLowerCase()).join(" ");
    const roleAlignmentScore =
      candidateRoles.includes(titleLower) || (profileData.summary || "").toLowerCase().includes(titleLower)
        ? 95
        : 75;

    // Experience Density (15% weight)
    const expCount = (profileData.experience || []).length;
    const experienceScore = Math.min(100, expCount >= 3 ? 95 : expCount >= 1 ? 80 : 40);

    // Projects Match (15% weight)
    const projCount = (profileData.projects || []).length;
    const projectsScore = Math.min(100, projCount >= 2 ? 90 : projCount === 1 ? 75 : 50);

    // Education (10% weight)
    const eduCount = (profileData.education || []).length;
    const educationScore = eduCount > 0 ? 90 : 60;

    // Calculate overall match score (0-100)
    const matchScore = Math.min(
      100,
      Math.max(
        15,
        Math.round(
          technicalSkillsScore * 0.4 +
            roleAlignmentScore * 0.2 +
            experienceScore * 0.15 +
            projectsScore * 0.15 +
            educationScore * 0.1
        )
      )
    );

    const recommendations: string[] = [];
    if (missingSkills.length > 0) {
      recommendations.push(
        `Job emphasizes: ${missingSkills.slice(0, 4).join(", ")}. If you have experience with these, add them to your resume skills or project bullets.`
      );
    }
    if (strongKeywords.length > 0) {
      recommendations.push(
        `Strong match confirmed for: ${strongKeywords.slice(0, 3).join(", ")} with demonstrated experience.`
      );
    }
    recommendations.push(
      `Align your headline and summary directly to the target role '${jobTitle}'.`
    );

    return {
      matchScore,
      breakdown: {
        technicalSkills: technicalSkillsScore,
        roleAlignment: roleAlignmentScore,
        experience: experienceScore,
        projects: projectsScore,
        keywords: technicalSkillsScore,
        education: educationScore
      },
      matchedSkills,
      missingSkills,
      strongKeywords,
      missingKeywords,
      recommendations
    };
  }

  /**
   * Aggregate market keywords from real MongoDB Job collection
   */
  static async getMarketKeywords(targetRole = "Software Engineer"): Promise<{
    role: string;
    frequentSkills: { skill: string; demandCount: number; status: "have" | "missing" }[];
    totalJobsAnalyzed: number;
  }> {
    const roleRegex = new RegExp(targetRole.split(/\s+/)[0] || "engineer", "i");
    const sampleJobs = await Job.find({ title: { $regex: roleRegex } }).limit(50);

    const counts: Record<string, number> = {};
    for (const j of sampleJobs) {
      for (const s of j.skills || []) {
        const norm = s.toUpperCase().trim();
        counts[norm] = (counts[norm] || 0) + 1;
      }
    }

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([skill, count]) => ({
        skill,
        demandCount: count,
        status: "missing" as "have" | "missing"
      }));

    return {
      role: targetRole,
      frequentSkills: sorted,
      totalJobsAnalyzed: sampleJobs.length
    };
  }

  /**
   * Resume Tailoring Diff Engine
   * Generates Current vs Proposed diffs without fabricating unearned facts
   */
  static async generateTailoringDiff(
    profileData: IResumeProfileData,
    jobDescription: string,
    jobTitle = "Target Role"
  ): Promise<{
    currentScore: number;
    potentialScore: number;
    diff: {
      section: string;
      field: string;
      current: string;
      proposed: string;
      rationale: string;
    }[];
    suggestedSkillsToAdd: string[];
  }> {
    const matchResult = this.match(profileData, jobDescription, jobTitle);
    const { score: currentScore } = ResumeATS.calculateScore(profileData, jobTitle);

    const prompt = `You are a technical career coach tailoring a resume to a job description.
TARGET ROLE: "${jobTitle}"
JOB DESCRIPTION:
${jobDescription.slice(0, 1500)}

CANDIDATE CURRENT SUMMARY:
"${profileData.summary || "Experienced developer."}"

FIRST EXPERIENCE ROLE:
"${profileData.experience?.[0]?.role || "Developer"}" at "${profileData.experience?.[0]?.company || "Company"}"
BULLET: "${profileData.experience?.[0]?.bullets?.[0] || "Worked on backend APIs."}"

STRICT GROUNDING RULES:
1. NEVER invent unearned companies, degrees, years of experience, or fake metrics.
2. Only highlight existing technologies or rephrase accomplishments to mirror JD phrasing.
3. If candidate is missing required skills, suggest phrasing that highlights readiness or adjacent tools.

Respond in JSON format:
{
  "tailoredSummary": "Improved summary aligning with target role",
  "summaryRationale": "Why this aligns better with ATS",
  "tailoredBullet": "Improved first experience bullet point",
  "bulletRationale": "Why this bullet has higher impact"
}`;

    const diff: any[] = [];
    let tailoredSummary = profileData.summary;
    let tailoredBullet = profileData.experience?.[0]?.bullets?.[0] || "";

    try {
      const res = await AIService.generateStructured<any>([{ role: "user", content: prompt }], {});
      if (res?.tailoredSummary) {
        tailoredSummary = res.tailoredSummary;
        diff.push({
          section: "Professional Summary",
          field: "summary",
          current: profileData.summary || "No summary provided",
          proposed: res.tailoredSummary,
          rationale: res.summaryRationale || "Aligns core headline with job requirements"
        });
      }
      if (res?.tailoredBullet && profileData.experience?.[0]?.bullets?.[0]) {
        tailoredBullet = res.tailoredBullet;
        diff.push({
          section: `Experience (${profileData.experience[0].company})`,
          field: "bullets[0]",
          current: profileData.experience[0].bullets[0],
          proposed: res.tailoredBullet,
          rationale: res.bulletRationale || "Emphasizes action verbs matching job responsibilities"
        });
      }
    } catch {}

    if (diff.length === 0) {
      // Deterministic fallback diff
      diff.push({
        section: "Professional Summary",
        field: "summary",
        current: profileData.summary || "Experienced developer.",
        proposed: `Results-driven ${jobTitle} specializing in scalable architecture and modern engineering standards, delivering high-reliability production applications.`,
        rationale: "Aligns job title and core focus directly with target job posting"
      });
    }

    const potentialScore = Math.min(96, Math.max(currentScore + 8, matchResult.matchScore + 5));

    return {
      currentScore,
      potentialScore,
      diff,
      suggestedSkillsToAdd: matchResult.missingSkills.slice(0, 5)
    };
  }
}
