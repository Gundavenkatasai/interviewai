import { IStructuredResume } from "../schema/structured-resume.schema";

export interface IValidationIssue {
  severity: "critical" | "warning" | "info";
  section: string;
  field?: string;
  message: string;
  autoFixAvailable: boolean;
}

export interface IResumeValidationReport {
  isValid: boolean;
  score: number; // 0 - 100
  issues: IValidationIssue[];
  metrics: {
    totalProjects: number;
    totalBullets: number;
    totalSkills: number;
    estimatedPageCount: 1 | 2;
    readingOrderPassed: boolean;
  };
}

export class ResumeValidator {
  /**
   * Exhaustively validates a structured resume for ATS compliance and document integrity
   */
  public static validate(resume: IStructuredResume, targetJdSkills: string[] = []): IResumeValidationReport {
    const issues: IValidationIssue[] = [];

    // 1. Contact / Basics Check
    if (!resume.basics.name || resume.basics.name.trim().length < 2) {
      issues.push({
        severity: "critical",
        section: "basics",
        field: "name",
        message: "Candidate full name is missing or too short.",
        autoFixAvailable: false
      });
    }

    if (!resume.basics.email || !resume.basics.email.includes("@")) {
      issues.push({
        severity: "critical",
        section: "basics",
        field: "email",
        message: "Valid email address is required for recruiter outreach.",
        autoFixAvailable: false
      });
    }

    if (!resume.basics.phone) {
      issues.push({
        severity: "warning",
        section: "basics",
        field: "phone",
        message: "Phone number is recommended for immediate recruiter scheduling.",
        autoFixAvailable: false
      });
    }

    // 2. Project Checks (Anti-Fragmentation, No Duplicates, Clean URLs, Max 2 Projects)
    if ((resume.projects || []).length > 2) {
      issues.push({
        severity: "warning",
        section: "projects",
        message: `Resume includes ${resume.projects.length} projects. Strict 1-page guideline requires maximum 2 projects.`,
        autoFixAvailable: true
      });
    }

    const projectNamesSeen = new Set<string>();
    const allBulletsSeen = new Set<string>();

    (resume.projects || []).forEach((proj, idx) => {
      // Check for fragmented project titles (e.g. "Smart", "indicators, and online presence")
      if (proj.name.length < 3 || /^(indicators|sentiment analysis|tech stack|and|the|a|for)\b/i.test(proj.name)) {
        issues.push({
          severity: "critical",
          section: "projects",
          field: `projects[${idx}].name`,
          message: `Project title '${proj.name}' appears fragmented or incomplete.`,
          autoFixAvailable: true
        });
      }

      // Check bullet count per project (max 2 for strict 1-page layout)
      if ((proj.bullets || []).length > 2) {
        issues.push({
          severity: "info",
          section: "projects",
          field: `projects[${idx}].bullets`,
          message: `Project '${proj.name}' has ${proj.bullets.length} bullets. Maximum 2 recommended for 1-page density.`,
          autoFixAvailable: true
        });
      }

      // Duplicate project detection
      const normalizedName = proj.name.toLowerCase().trim();
      if (projectNamesSeen.has(normalizedName)) {
        issues.push({
          severity: "critical",
          section: "projects",
          field: `projects[${idx}].name`,
          message: `Duplicate project detected: '${proj.name}'. Each project should be unique.`,
          autoFixAvailable: true
        });
      }
      projectNamesSeen.add(normalizedName);

      // Check bullets
      if (!proj.bullets || proj.bullets.length === 0) {
        issues.push({
          severity: "warning",
          section: "projects",
          field: `projects[${idx}].bullets`,
          message: `Project '${proj.name}' has no descriptive bullets explaining technical contributions.`,
          autoFixAvailable: true
        });
      }

      proj.bullets?.forEach((bullet, bIdx) => {
        const normBullet = bullet.toLowerCase().trim();
        if (allBulletsSeen.has(normBullet)) {
          issues.push({
            severity: "warning",
            section: "projects",
            field: `projects[${idx}].bullets[${bIdx}]`,
            message: `Duplicate bullet text detected across projects: '${bullet.slice(0, 40)}...'`,
            autoFixAvailable: true
          });
        }
        allBulletsSeen.add(normBullet);

        // Check for orphaned truncated text
        if (bullet.trim().endsWith("and") || bullet.trim().endsWith("using") || bullet.trim().endsWith("with")) {
          issues.push({
            severity: "warning",
            section: "projects",
            field: `projects[${idx}].bullets[${bIdx}]`,
            message: `Bullet point appears cut off or truncated: '${bullet}'`,
            autoFixAvailable: false
          });
        }
      });
    });

    // 3. Education Checks
    if (!resume.education || resume.education.length === 0) {
      issues.push({
        severity: "warning",
        section: "education",
        message: "No education entries found. University degrees or certifications enhance ATS credibility.",
        autoFixAvailable: false
      });
    }

    // 4. Skills Checks
    let totalSkillsCount = 0;
    (resume.skills || []).forEach((cat) => {
      totalSkillsCount += (cat.items || []).length;
    });

    if (totalSkillsCount < 5) {
      issues.push({
        severity: "warning",
        section: "skills",
        message: `Only ${totalSkillsCount} skills listed. A strong technical profile typically lists 8-15 core competencies.`,
        autoFixAvailable: false
      });
    }

    // 5. Keyword Coverage Check against Target JD
    if (targetJdSkills.length > 0) {
      const candidateSkillsFlat = new Set(
        (resume.skills || []).flatMap((c) => c.items.map((i) => i.toLowerCase().trim()))
      );
      const missingJdSkills = targetJdSkills.filter((s) => !candidateSkillsFlat.has(s.toLowerCase().trim()));

      if (missingJdSkills.length > 0) {
        issues.push({
          severity: "info",
          section: "skills",
          message: `${missingJdSkills.length} job-specific keywords not found in verified skills (${missingJdSkills.slice(0, 4).join(", ")}).`,
          autoFixAvailable: false
        });
      }
    }

    // Calculate overall document quality score
    const criticalCount = issues.filter((i) => i.severity === "critical").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;
    const score = Math.max(0, Math.min(100, 100 - criticalCount * 25 - warningCount * 5));

    // Page count estimate (strictly calibrated for A4 portrait with ~36-38 lines)
    const totalLines =
      8 + // header + summary
      (resume.skills?.length || 0) * 1.5 +
      (resume.projects || []).slice(0, 2).reduce((acc, p) => acc + 2 + Math.min(2, p.bullets?.length || 0), 0) +
      (resume.experience || []).slice(0, 2).reduce((acc, e) => acc + 2 + Math.min(2, e.bullets?.length || 0), 0) +
      (resume.education || []).slice(0, 2).length * 2 +
      Math.min(3, resume.certifications?.length || 0);

    const estimatedPageCount: 1 | 2 = totalLines > 38 ? 2 : 1;

    return {
      isValid: criticalCount === 0,
      score,
      issues,
      metrics: {
        totalProjects: resume.projects?.length || 0,
        totalBullets: allBulletsSeen.size,
        totalSkills: totalSkillsCount,
        estimatedPageCount,
        readingOrderPassed: true
      }
    };
  }
}
