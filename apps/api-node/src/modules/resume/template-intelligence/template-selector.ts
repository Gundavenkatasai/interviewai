export type TemplateId =
  | "classic-ats"
  | "tech-fresher"
  | "modern-minimal"
  | "experienced-prof"
  | "academic"
  | "modern-tech";

export interface ITemplateRecommendation {
  templateId: TemplateId;
  templateName: string;
  rationale: string;
  sectionOrder: string[];
  density: "compact" | "balanced" | "spacious";
  maxTargetPages: 1 | 2;
  highlights: string[];
}

export interface ICandidateMetrics {
  yearsOfExperience: number;
  experienceCount: number;
  projectsCount: number;
  publicationsCount: number;
  educationCount: number;
  certificationsCount: number;
  hasInternships: boolean;
  targetRole?: string;
  jobDescription?: string;
  isStudentOrFresher?: boolean;
}

export class TemplateIntelligenceEngine {
  /**
   * Deterministic template selection based on candidate career stage & JD context
   */
  public static selectTemplate(metrics: ICandidateMetrics): ITemplateRecommendation {
    const roleLower = (metrics.targetRole || "").toLowerCase();
    const jdLower = (metrics.jobDescription || "").toLowerCase();

    const isAcademic =
      metrics.publicationsCount > 0 ||
      /research|phd|postdoc|fellow|scientist|professor|lecturer|academic/i.test(roleLower) ||
      /research|publications|fellowship/i.test(jdLower);

    const isExperienced =
      metrics.yearsOfExperience >= 3 ||
      metrics.experienceCount >= 2;

    const isTechRole =
      /software|developer|engineer|full[\s-]stack|frontend|backend|devops|data|ai|ml|cloud|web/i.test(roleLower) ||
      /react|python|java|javascript|typescript|c\+\+|node|docker|kubernetes/i.test(jdLower);

    // Rule 1: Academic & Research
    if (isAcademic) {
      return {
        templateId: "academic",
        templateName: "Academic & Research Curriculum",
        rationale: "Selected because your background emphasizes education, research scholarship, and publications.",
        sectionOrder: ["education", "publications", "projects", "achievements", "certifications", "skills", "experience"],
        density: "spacious",
        maxTargetPages: 2,
        highlights: ["Academic credentials front-loaded", "Research citations & publications matrix"]
      };
    }

    // Rule 2: Experienced Professional (3+ years)
    if (isExperienced) {
      return {
        templateId: "experienced-prof",
        templateName: "Experienced Professional",
        rationale: "Selected because your verified career history includes substantial professional employment and leadership achievements.",
        sectionOrder: ["summary", "experience", "skills", "projects", "certifications", "education", "achievements"],
        density: "balanced",
        maxTargetPages: 2,
        highlights: ["Chronological employment history first", "Metric-driven impact bullets prioritized"]
      };
    }

    // Rule 3: Tech Fresher / Student / Projects > Experience
    if (isTechRole && (metrics.yearsOfExperience < 2 || metrics.experienceCount === 0 || metrics.isStudentOrFresher)) {
      return {
        templateId: "tech-fresher",
        templateName: "Tech Fresher (Jake's Resume / LaTeX Style)",
        rationale: "Recommended template: Tech Fresher. Selected because your strongest verified qualifications are technical projects, categorized skills, and education.",
        sectionOrder: ["skills", "projects", "education", "certifications", "achievements", "experience"],
        density: "compact",
        maxTargetPages: 1,
        highlights: [
          "Categorized skills matrix at top for instant ATS keyword matching",
          "Project engineering depth highlighted with tech stacks and live links",
          "Compact 1-page fit following top engineering resume guidelines"
        ]
      };
    }

    // Rule 4: Modern Tech Professional
    if (isTechRole) {
      return {
        templateId: "modern-tech",
        templateName: "Modern Tech Professional",
        rationale: "Selected to highlight modern full-stack competencies, architecture projects, and specialized toolchains.",
        sectionOrder: ["summary", "skills", "experience", "projects", "education", "certifications"],
        density: "balanced",
        maxTargetPages: 1,
        highlights: ["Modern visual hierarchy with slate accents", "Structured technical skill grouping"]
      };
    }

    // Rule 5: Modern Minimalist
    if (/design|product|operations|analyst/i.test(roleLower)) {
      return {
        templateId: "modern-minimal",
        templateName: "Modern Minimalist",
        rationale: "Selected for clean typographical whitespace and elegant single-column clarity.",
        sectionOrder: ["summary", "experience", "skills", "education", "projects"],
        density: "spacious",
        maxTargetPages: 1,
        highlights: ["Single-column clean sans-serif layout", "Balanced whitespace and professional hierarchy"]
      };
    }

    // Rule 6: General / Conservative Fallback -> Classic ATS (Harvard standard)
    return {
      templateId: "classic-ats",
      templateName: "Classic ATS Single-Column",
      rationale: "Recommended template: Classic ATS. Selected for universal ATS parseability with traditional single-column serif formatting.",
      sectionOrder: ["summary", "experience", "education", "skills", "projects", "certifications"],
      density: "compact",
      maxTargetPages: 1,
      highlights: ["100% linear top-to-bottom parse order", "Traditional Georgia/Times serif typography"]
    };
  }
}
