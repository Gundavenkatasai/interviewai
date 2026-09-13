import { IResumeProfileData, IResumeATSAnalysis } from "./resume.model";
import { ATSReport } from "./ats-engine/ats.evaluator";

// Action verbs list for deterministic scoring
const STRONG_ACTION_VERBS = new Set([
  "architected", "engineered", "developed", "built", "implemented", "optimized",
  "designed", "spearheaded", "accelerated", "deployed", "scaled", "automated",
  "streamlined", "orchestrated", "refactored", "integrated", "delivered",
  "reduced", "increased", "decreased", "maximized", "transformed", "established",
  "led", "mentored", "launched", "migrated", "pioneered", "standardized",
  "benchmarked", "formulated", "created", "authored", "resolved", "configured"
]);

const WEAK_VERBS = new Set([
  "worked", "helped", "assisted", "handled", "was responsible for", "tried", "did",
  "participated", "involved in", "made", "looked after", "talked with", "checked"
]);

const BUZZWORDS = new Set([
  "synergy", "rockstar", "ninja", "go-getter", "hard worker", "thought leader",
  "detail-oriented", "team player", "self-starter", "results-driven", "fast-paced",
  "dynamic", "disruptive", "passionate"
]);

export class ResumeATS {
  /**
   * Deterministic ATS Score calculation (0 to 100)
   */
  static calculateScore(profileData: IResumeProfileData, targetRole = "Software Engineer"): {
    score: number;
    analysis: IResumeATSAnalysis;
  } {
    const issues: IResumeATSAnalysis["issues"] = [];
    const recommendations: string[] = [];
    const personal = profileData.personal || ({} as any);

    // Check for empty / insufficient resume data
    const allSkillsCount =
      (profileData.skills?.technical?.length || 0) +
      (profileData.skills?.languages?.length || 0) +
      (profileData.skills?.frameworks?.length || 0) +
      (profileData.skills?.databases?.length || 0) +
      (profileData.skills?.cloud?.length || 0) +
      (profileData.skills?.tools?.length || 0);

    const hasExperience = (profileData.experience || []).length > 0;
    const hasEducation = (profileData.education || []).length > 0;
    const hasProjects = (profileData.projects || []).length > 0;
    const hasSummary = Boolean(profileData.summary?.trim());
    const hasContact = Boolean(personal.fullName?.trim() || personal.email?.trim());

    if (!hasExperience && !hasEducation && !hasProjects && !hasSummary && allSkillsCount === 0) {
      // Zero fabricated score for empty data
      return {
        score: 0,
        analysis: {
          categories: {
            parsing: 100,
            structure: 0,
            formatting: 0,
            keywords: 0,
            jobAlignment: 0,
            content: 0
          },
          issues: [
            {
              severity: "critical",
              category: "Content",
              section: "general",
              problem: "Resume has no content yet",
              whyItMatters: "An empty resume cannot pass applicant tracking systems or be indexed by recruiters",
              suggestedFix: "Fill in your experience, skills, and education to calculate your ATS Compatibility Score"
            }
          ],
          recommendations: [
            "Add your target role, work history, and technical competencies to generate an ATS compatibility breakdown"
          ],
          healthScore: 0
        }
      };
    }

    // 1. Contact Information (10 points max)
    let contactPts = 0;
    if (personal.fullName?.trim()) contactPts += 2;
    if (personal.email?.trim() && personal.email.includes("@")) contactPts += 2;
    if (personal.phone?.trim()) contactPts += 2;
    if (personal.location?.trim()) contactPts += 2;
    if (personal.linkedin?.trim()) contactPts += 1;
    if (personal.github?.trim() || personal.portfolio?.trim()) contactPts += 1;

    if (!personal.email || !personal.email.includes("@")) {
      issues.push({
        severity: "critical",
        category: "Contact",
        section: "personal",
        problem: "Missing valid email address",
        whyItMatters: "ATS parsers immediately reject resumes without a reachable contact email",
        suggestedFix: "Add a professional email address (e.g., name@domain.com)"
      });
    }

    if (!personal.phone?.trim()) {
      issues.push({
        severity: "critical",
        category: "Contact",
        section: "personal",
        problem: "Missing phone number",
        whyItMatters: "Recruiters require a direct phone number for screening invitations",
        suggestedFix: "Include your mobile number with country/area code"
      });
    }

    if (!personal.linkedin?.trim()) {
      issues.push({
        severity: "medium",
        category: "Contact",
        section: "personal",
        problem: "Missing LinkedIn profile URL",
        whyItMatters: "Over 87% of technical recruiters cross-reference LinkedIn profiles during screening",
        suggestedFix: "Add your customized LinkedIn URL in Personal Information"
      });
    }

    if (!personal.github?.trim() && /engineer|developer|architect|programmer|data/i.test(targetRole)) {
      issues.push({
        severity: "low",
        category: "Contact",
        section: "personal",
        problem: "Missing GitHub profile link",
        whyItMatters: "Technical recruiters look for public repositories or open-source activity",
        suggestedFix: "Include your GitHub profile URL in Personal Information"
      });
    }

    const contactScore = Math.min(100, Math.round((contactPts / 10) * 100));

    // 2. Structure & Section Completeness (15 points max)
    let structurePts = 0;
    if (profileData.summary?.trim() && profileData.summary.length >= 50) {
      structurePts += 4;
    } else {
      issues.push({
        severity: "high",
        category: "Structure",
        section: "summary",
        problem: "Professional summary is missing or too short (< 50 chars)",
        whyItMatters: "Summaries ground candidate intent and help ATS align target keywords",
        suggestedFix: "Write a 2-3 sentence summary highlighting your core tech stack and target role"
      });
    }

    if (profileData.experience && profileData.experience.length > 0) {
      structurePts += 4;
    } else {
      issues.push({
        severity: "critical",
        category: "Structure",
        section: "experience",
        problem: "No work experience entries found",
        whyItMatters: "Professional experience is the primary weighting factor in ATS ranking algorithms",
        suggestedFix: "Add at least one relevant work or project experience role"
      });
    }

    if (profileData.education && profileData.education.length > 0) {
      structurePts += 3;
    } else {
      issues.push({
        severity: "medium",
        category: "Structure",
        section: "education",
        problem: "Education section is empty",
        whyItMatters: "Many corporate screening filters enforce a minimum degree requirement",
        suggestedFix: "Add your highest degree or diploma institution and graduation year"
      });
    }

    if (profileData.projects && profileData.projects.length > 0) {
      structurePts += 4;
    } else {
      issues.push({
        severity: "low",
        category: "Structure",
        section: "projects",
        problem: "No featured projects listed",
        whyItMatters: "Projects provide proof of hands-on architectural experience",
        suggestedFix: "Add 1-2 featured projects highlighting the technologies used"
      });
    }

    const structureScore = Math.min(100, Math.round((structurePts / 15) * 100));

    // 3. Experience Quality & Action Verbs (20 points max)
    let experiencePts = 0;
    let totalBullets = 0;
    let strongVerbCount = 0;
    let weakVerbCount = 0;
    let metricsCount = 0;

    for (const exp of profileData.experience || []) {
      const bullets = exp.bullets || [];
      totalBullets += bullets.length;

      for (const b of bullets) {
        if (!b?.trim()) continue;
        const words = b.toLowerCase().trim().split(/\s+/);
        const firstWord = words[0] || "";

        if (STRONG_ACTION_VERBS.has(firstWord)) strongVerbCount++;
        if (WEAK_VERBS.has(firstWord)) weakVerbCount++;

        // Measurable impact pattern
        if (/\b(?:\d+%(?:\.\d+)?|\$\d+[mk]?|\d+ms|\d+x|\d+k|\d+m|\d{2,})\b/i.test(b)) {
          metricsCount++;
        }
      }
    }

    if (totalBullets > 0) {
      const strongRatio = strongVerbCount / totalBullets;
      experiencePts += Math.min(12, Math.round(strongRatio * 15));

      if (weakVerbCount > 0) {
        issues.push({
          severity: "high",
          category: "Experience",
          section: "experience",
          problem: `${weakVerbCount} experience bullet(s) start with weak passive verbs (e.g., 'worked', 'helped')`,
          whyItMatters: "Passive verbs diminish perceived leadership and ownership of technical results",
          suggestedFix: "Use the AI Bullet Improver to replace weak verbs with strong action verbs like 'Engineered' or 'Architected'"
        });
      }

      if (strongRatio < 0.5) {
        recommendations.push("Begin at least 70% of bullet points with impactful action verbs");
      }
    } else if (profileData.experience?.length) {
      issues.push({
        severity: "high",
        category: "Experience",
        section: "experience",
        problem: "Experience entries lack bullet points detailing specific responsibilities",
        whyItMatters: "ATS algorithms extract skills and competencies directly from bulleted lists",
        suggestedFix: "Add 2-4 bullet points per work experience role"
      });
    }

    if ((profileData.experience?.length || 0) >= 2) experiencePts += 8;
    else if ((profileData.experience?.length || 0) === 1) experiencePts += 5;

    if (metricsCount >= 2) experiencePts += 5;
    else if (metricsCount === 1) experiencePts += 3;

    const experienceScore = Math.min(100, Math.round((experiencePts / 20) * 100));

    // 4. Skills Density & Categorization (20 points max)
    let skillsPts = 0;
    if (allSkillsCount >= 12) skillsPts += 15;
    else if (allSkillsCount >= 6) skillsPts += 10;
    else if (allSkillsCount >= 1) skillsPts += 5;
    else {
      issues.push({
        severity: "critical",
        category: "Skills",
        section: "skills",
        problem: "Skills section has 0 identified technologies",
        whyItMatters: "ATS keyword filters score resumes based on exact keyword density matches",
        suggestedFix: "Add your core technical skills, programming languages, and databases"
      });
    }

    const categoriesCount = [
      profileData.skills?.languages?.length,
      profileData.skills?.frameworks?.length,
      profileData.skills?.databases?.length,
      profileData.skills?.cloud?.length
    ].filter((l) => (l || 0) > 0).length;

    if (categoriesCount >= 3) skillsPts += 5;
    else if (allSkillsCount > 0) {
      issues.push({
        severity: "medium",
        category: "Skills",
        section: "skills",
        problem: "Skills are not organized into standard technical subcategories",
        whyItMatters: "Categorized skills help ATS parsers distinguish programming languages from databases and cloud tools",
        suggestedFix: "Organize skills under Languages, Frameworks, Databases, and Cloud"
      });
    }

    const skillsScore = Math.min(100, Math.round((skillsPts / 20) * 100));

    // 5. Quantifiable Impact & Metrics (15 points max)
    let impactPts = 0;
    if (metricsCount >= 3) {
      impactPts = 15;
    } else if (metricsCount >= 1) {
      impactPts = 8;
      issues.push({
        severity: "medium",
        category: "Impact",
        section: "experience",
        problem: "Few quantifiable achievements detected (only 1-2 metrics found)",
        whyItMatters: "Hiring managers favor quantifiable outcomes (e.g., '% latency reduction', 'users supported')",
        suggestedFix: "Use the Achievement Generator to include specific metrics or scale estimates"
      });
    } else {
      impactPts = 2;
      issues.push({
        severity: "high",
        category: "Impact",
        section: "experience",
        problem: "No measurable metrics or numbers detected across your experience bullets",
        whyItMatters: "Bullet points without numbers read as job descriptions rather than accomplished results",
        suggestedFix: "Incorporate metrics like latency, user volume, or test coverage"
      });
    }
    const impactScore = Math.min(100, Math.round((impactPts / 15) * 100));

    // 6. Formatting & Readability (10 points max)
    let formatPts = 10;
    const fullText = JSON.stringify(profileData);
    let buzzwordCount = 0;
    for (const buzz of BUZZWORDS) {
      if (fullText.toLowerCase().includes(buzz)) buzzwordCount++;
    }
    if (buzzwordCount > 0) {
      formatPts = Math.max(4, formatPts - buzzwordCount * 2);
      issues.push({
        severity: "low",
        category: "Formatting",
        section: "summary",
        problem: `Found generic buzzwords (${Array.from(BUZZWORDS).slice(0, 3).join(", ")})`,
        whyItMatters: "Buzzwords fill space without providing factual evidence of technical skill",
        suggestedFix: "Replace vague adjectives with specific technical accomplishments"
      });
    }
    const formattingScore = Math.min(100, formatPts * 10);

    // 7. Grammar & Tone (10 points max)
    let grammarPts = 10;
    let endingPeriods = 0;
    let noEndingPeriods = 0;
    for (const exp of profileData.experience || []) {
      for (const b of exp.bullets || []) {
        if (!b?.trim()) continue;
        if (b.trim().endsWith(".")) endingPeriods++;
        else noEndingPeriods++;
      }
    }
    if (endingPeriods > 0 && noEndingPeriods > 0) {
      grammarPts -= 2;
      issues.push({
        severity: "low",
        category: "Grammar",
        section: "experience",
        problem: "Inconsistent bullet punctuation detected (mixed ending periods)",
        whyItMatters: "Consistent formatting reflects professionalism and attention to detail",
        suggestedFix: "Ensure all experience bullets consistently end with (or without) a period"
      });
    }
    const grammarScore = Math.min(100, grammarPts * 10);

    // 8. Keywords & Role Alignment (calculated)
    const keywordsScore = Math.min(
      100,
      Math.round((allSkillsCount / 15) * 80 + (totalBullets >= 4 ? 20 : 10))
    );

    // Calculate total weighted score (0-100)
    const rawTotal = contactPts + structurePts + experiencePts + skillsPts + impactPts + formatPts + (grammarPts * 0.5);
    const totalScore = Math.min(100, Math.round(rawTotal));

    // Calculate overall Health Score
    const healthScore = Math.round(
      (contactScore * 0.15) +
      (structureScore * 0.20) +
      (experienceScore * 0.20) +
      (skillsScore * 0.20) +
      (impactScore * 0.15) +
      (formattingScore * 0.10)
    );

    if (totalScore >= 85) {
      recommendations.push("Resume is well-structured and ATS-ready. Tailor keywords for specific applications.");
    } else if (totalScore >= 70) {
      recommendations.push("Good baseline. Address high-priority issues to cross the 85+ ATS threshold.");
    } else {
      recommendations.push("Significant improvements needed. Complete missing sections and add measurable achievements.");
    }

    const analysis: IResumeATSAnalysis = {
      categories: {
        parsing: 100,
        structure: structureScore,
        formatting: formattingScore,
        keywords: keywordsScore,
        jobAlignment: Math.min(100, Math.round((keywordsScore + experienceScore) / 2)),
        content: Math.min(100, Math.round((grammarScore + impactScore) / 2))
      },
      issues,
      recommendations,
      healthScore
    };

    return { score: totalScore, analysis };
  }

  /**
   * "What an ATS Sees": Extract clean machine-readable plain text representation
   */
  static getWhatAtsSees(profileData: IResumeProfileData): string {
    const lines: string[] = [];
    const personal = profileData?.personal || ({} as any);
    const summary = profileData?.summary;
    const experience = profileData?.experience || [];
    const education = profileData?.education || [];
    const projects = profileData?.projects || [];
    const skills = profileData?.skills || ({} as any);

    // Contact
    if (personal.fullName) lines.push(personal.fullName.toUpperCase());
    if (personal.professionalTitle) lines.push(personal.professionalTitle);
    const contactParts = [personal.email, personal.phone, personal.location, personal.linkedin, personal.github].filter(Boolean);
    if (contactParts.length > 0) lines.push(contactParts.join(" | "));
    lines.push("");

    // Summary
    if (summary?.trim()) {
      lines.push("PROFESSIONAL SUMMARY");
      lines.push(summary.trim());
      lines.push("");
    }

    // Experience
    if (experience && experience.length > 0) {
      lines.push("EXPERIENCE");
      for (const exp of experience) {
        lines.push(`${exp.role || "Role"} - ${exp.company || "Company"} (${exp.startDate || ""} - ${exp.endDate || (exp.current ? "Present" : "")})`);
        if (exp.location) lines.push(exp.location);
        if (exp.description) lines.push(exp.description);
        for (const b of exp.bullets || []) {
          if (b?.trim()) lines.push(`* ${b.trim()}`);
        }
        lines.push("");
      }
    }

    // Projects
    if (projects && projects.length > 0) {
      lines.push("PROJECTS");
      for (const proj of projects) {
        const techStr = proj.technologies?.length ? ` [Technologies: ${proj.technologies.join(", ")}]` : "";
        lines.push(`${proj.name || "Project"}${techStr}`);
        if (proj.description) lines.push(proj.description);
        for (const b of proj.bullets || []) {
          if (b?.trim()) lines.push(`* ${b.trim()}`);
        }
        lines.push("");
      }
    }

    // Skills
    const allSkills = [
      skills.languages?.length ? `Languages: ${skills.languages.join(", ")}` : null,
      skills.frameworks?.length ? `Frameworks: ${skills.frameworks.join(", ")}` : null,
      skills.databases?.length ? `Databases: ${skills.databases.join(", ")}` : null,
      skills.cloud?.length ? `Cloud & DevOps: ${skills.cloud.join(", ")}` : null,
      skills.tools?.length ? `Tools: ${skills.tools.join(", ")}` : null,
      skills.technical?.length ? `Technical Skills: ${skills.technical.join(", ")}` : null
    ].filter(Boolean);

    if (allSkills.length > 0) {
      lines.push("SKILLS & COMPETENCIES");
      for (const s of allSkills) {
        lines.push(s as string);
      }
      lines.push("");
    }

    // Education
    if (education && education.length > 0) {
      lines.push("EDUCATION");
      for (const edu of education) {
        lines.push(`${edu.degree || "Degree"} in ${edu.field || "Field"} - ${edu.institution || "Institution"} (${edu.endDate || ""})`);
        if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
        lines.push("");
      }
    }

    return lines.join("\n").trim();
  }

  /**
   * Maps the robust ATSReport from AtsEvaluator to the IResumeATSAnalysis DB schema format.
   */
  static mapAtsReportToAnalysis(report: ATSReport): { score: number; analysis: IResumeATSAnalysis } {
    return {
      score: report.overallScore,
      analysis: {
        categories: {
          parsing: report.categoryScores.parsing || 0,
          structure: report.categoryScores.structure || 0,
          formatting: report.categoryScores.formatting || 0,
          keywords: report.categoryScores.keywords || 0,
          jobAlignment: report.categoryScores.jobAlignment || 0,
          content: report.categoryScores.content || 0
        },
        issues: report.issues.map(issue => ({
          severity: issue.severity,
          category: issue.category,
          section: issue.where || "general",
          problem: issue.title,
          whyItMatters: issue.why,
          suggestedFix: issue.suggestion
        })),
        recommendations: report.strengths || [],
        healthScore: report.overallScore
      }
    };
  }
}
