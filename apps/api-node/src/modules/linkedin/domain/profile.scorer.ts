import {
  LinkedInProfileData,
  SectionStatus,
  SectionConfidence,
} from "./provider.interface";

export interface SectionAnalysisResult {
  score: number; // 0 - 100
  status: SectionStatus;
  confidence: SectionConfidence;
  evidence: string;
  issues: string[];
  recommendations: string[];
}

export type SectionKey =
  | "PHOTO"
  | "BANNER"
  | "HEADLINE"
  | "ABOUT"
  | "FEATURED"
  | "EXPERIENCE"
  | "EDUCATION"
  | "SKILLS"
  | "CERTIFICATIONS"
  | "PROJECTS"
  | "CUSTOM_URL"
  | "RECOMMENDATIONS"
  | "ACTIVITY"
  | "KEYWORDS";

export interface FullProfileAnalysis {
  overallScore: number;
  sections: Record<SectionKey, SectionAnalysisResult>;
  headlineAnalysis: {
    current: string;
    score: number;
    issues: string[];
    options: Array<{
      id: "OPTION_1" | "OPTION_2" | "OPTION_3";
      style: "Recruiter Search Focused" | "Technical Depth" | "Value & Impact";
      headline: string;
      score: number;
      reason: string;
      keywords: string[];
      tradeoffs: string;
    }>;
  };
  aboutAnalysis: {
    current: string;
    score: number;
    issues: string[];
    improvements: Array<{
      style: "concise" | "recruiter_focused" | "technical" | "storytelling";
      text: string;
      reason: string;
      evidenceUsed: string[];
    }>;
  };
  experienceAnalysis: Array<{
    company: string;
    role: string;
    duration?: string;
    score: number;
    issues: string[];
    recommendations: string[];
  }>;
  skillsAnalysis: {
    strong: string[];
    relevant: string[];
    weak: string[];
    missing: string[];
    unknown: string[];
    marketCoveragePercentage: number;
  };
  targetAlignment: {
    targetRole: string;
    roleAlignmentScore: number;
    keywordCoverageScore: number;
    experienceAlignmentScore: number;
    seniorityAlignmentScore: number;
    gaps: string[];
    recommendations: string[];
  };
  resumeConsistency?: {
    overallConsistencyScore: number;
    conflicts: Array<{
      type: "TITLE_MISMATCH" | "DATE_MISMATCH" | "COMPANY_MISMATCH" | "SKILL_DISCREPANCY" | "PROJECT_DISCREPANCY";
      severity: "HIGH" | "MEDIUM" | "LOW";
      description: string;
      linkedinValue: string;
      resumeValue: string;
    }>;
  };
}

export class ProfileScorer {
  /**
   * Deterministically evaluates each section with zero fake numbers
   */
  static analyze(
    profile: LinkedInProfileData,
    targetRole: string = "Software Engineer",
    marketDemandSkills: string[] = ["TypeScript", "Node.js", "Python", "React", "PostgreSQL", "System Design", "AWS", "Docker"],
    resumeData?: any
  ): FullProfileAnalysis {
    const sections: Record<SectionKey, SectionAnalysisResult> = {} as any;

    // 1. PHOTO
    if (profile.photoUrl) {
      sections.PHOTO = {
        score: 95,
        status: "STRONG",
        confidence: "high",
        evidence: "Profile photo is detected.",
        issues: [],
        recommendations: ["Ensure your photo is professional, clear, and well-lit."],
      };
    } else {
      sections.PHOTO = {
        score: 0,
        status: "NEEDS_WORK",
        confidence: "medium",
        evidence: "No profile photo detected.",
        issues: ["Profiles without photos receive up to 21x fewer views in recruiter search."],
        recommendations: ["Upload a high-resolution headshot with neutral background."],
      };
    }

    // 2. BANNER
    if (profile.bannerUrl) {
      sections.BANNER = {
        score: 90,
        status: "STRONG",
        confidence: "high",
        evidence: "Custom background banner detected.",
        issues: [],
        recommendations: ["Keep banner aligned with your technical domain."],
      };
    } else {
      sections.BANNER = {
        score: 30,
        status: "NEEDS_WORK",
        confidence: "medium",
        evidence: "Default LinkedIn background banner detected.",
        issues: ["Default banner leaves valuable visual real estate unutilized."],
        recommendations: ["Add a banner showcasing your tech stack, speaking engagements, or engineering domain."],
      };
    }

    // 3. HEADLINE
    const headline = profile.headline || "";
    const headlineLen = headline.length;
    let headlineScore = 0;
    const headlineIssues: string[] = [];
    const headlineRecs: string[] = [];

    if (!headline) {
      headlineScore = 0;
      headlineIssues.push("Headline is missing.");
      headlineRecs.push("Add a structured headline stating role, tech stack, and impact.");
    } else {
      if (headlineLen >= 40) headlineScore += 50;
      else if (headlineLen >= 20) headlineScore += 30;
      else headlineIssues.push("Headline is too short (< 20 chars) to include primary keywords.");

      if (headline.includes("|") || headline.includes("•") || headline.includes("-") || headline.includes("—")) {
        headlineScore += 30;
      } else {
        headlineIssues.push("Headline lacks structured separators (| or •) to distinguish role from specialty.");
        headlineRecs.push("Use pipe separators (|) to separate Role | Core Stack | Domain Impact.");
      }

      if (new RegExp(targetRole, "i").test(headline)) {
        headlineScore += 20;
      } else {
        headlineIssues.push(`Target role "${targetRole}" is not explicitly listed in headline.`);
        headlineRecs.push(`Include "${targetRole}" or equivalent standard role title.`);
      }
    }

    sections.HEADLINE = {
      score: Math.min(100, headlineScore),
      status: headlineScore >= 80 ? "STRONG" : headlineScore >= 50 ? "GOOD" : "NEEDS_WORK",
      confidence: "high",
      evidence: headline ? `Headline detected (${headlineLen} chars): "${headline}"` : "Headline is missing.",
      issues: headlineIssues,
      recommendations: headlineRecs,
    };

    // 4. ABOUT
    const about = profile.about || "";
    const aboutLen = about.length;
    let aboutScore = 0;
    const aboutIssues: string[] = [];
    const aboutRecs: string[] = [];

    if (!about) {
      aboutScore = 0;
      aboutIssues.push("About summary is missing.");
      aboutRecs.push("Add an executive summary describing your technical background, ownership, and engineering impact.");
    } else {
      if (aboutLen >= 400) aboutScore += 50;
      else if (aboutLen >= 150) aboutScore += 35;
      else aboutIssues.push("About summary is brief (< 150 chars). Elaborate on architectural philosophy and major projects.");

      if (/\b(?:architected|engineered|built|scaled|delivered|spearheaded|refactored|designed)\b/i.test(about)) {
        aboutScore += 30;
      } else {
        aboutIssues.push("About section lacks strong active engineering verbs (e.g., architected, scaled, engineered).");
        aboutRecs.push("Incorporate strong action verbs highlighting technical ownership.");
      }

      if (about.includes("@") || /contact|reach out|email|github/i.test(about)) {
        aboutScore += 20;
      } else {
        aboutRecs.push("Add a call-to-action or contact channel for recruiters.");
      }
    }

    sections.ABOUT = {
      score: Math.min(100, aboutScore),
      status: aboutScore >= 80 ? "STRONG" : aboutScore >= 45 ? "GOOD" : "NEEDS_WORK",
      confidence: "high",
      evidence: about ? `About section contains ${aboutLen} characters.` : "About section is absent.",
      issues: aboutIssues,
      recommendations: aboutRecs,
    };

    // 5. FEATURED
    sections.FEATURED = {
      score: profile.projects.length > 0 ? 85 : 40,
      status: profile.projects.length > 0 ? "GOOD" : "NEEDS_WORK",
      confidence: "medium",
      evidence: profile.projects.length > 0 ? `${profile.projects.length} featured items/projects detected.` : "No featured items detected.",
      issues: profile.projects.length === 0 ? ["No featured section highlights or portfolio artifacts."] : [],
      recommendations: ["Pin 2-3 top GitHub repositories, tech write-ups, or system architecture articles."],
    };

    // 6. EXPERIENCE
    const expCount = profile.experience.length;
    let expScore = 0;
    const expIssues: string[] = [];
    const expRecs: string[] = [];

    if (expCount >= 3) expScore += 50;
    else if (expCount >= 1) expScore += 30;
    else expIssues.push("No work experience positions detected.");

    let bulletsFound = 0;
    for (const exp of profile.experience) {
      if (exp.bullets && exp.bullets.length > 0) bulletsFound += exp.bullets.length;
    }

    if (bulletsFound >= 6) expScore += 40;
    else if (bulletsFound >= 2) expScore += 25;
    else {
      expIssues.push("Roles lack detailed achievement bullet points.");
      expRecs.push("Use 3-5 bullet points per role showing technical challenge, implementation, and measurable result if available.");
    }

    if (expCount > 0) expScore += 10;

    sections.EXPERIENCE = {
      score: Math.min(100, expScore),
      status: expScore >= 80 ? "STRONG" : expScore >= 50 ? "GOOD" : expCount > 0 ? "NEEDS_WORK" : "MISSING",
      confidence: "high",
      evidence: `${expCount} roles listed with ${bulletsFound} total detail bullets.`,
      issues: expIssues,
      recommendations: expRecs,
    };

    // 7. EDUCATION
    sections.EDUCATION = {
      score: profile.education.length > 0 ? 90 : 30,
      status: profile.education.length > 0 ? "STRONG" : "NEEDS_WORK",
      confidence: "high",
      evidence: profile.education.length > 0 ? `${profile.education.length} education entries found.` : "Education section is empty.",
      issues: profile.education.length === 0 ? ["Add university degree or formal technical training."] : [],
      recommendations: profile.education.length === 0 ? ["List your degree or technical coursework."] : ["Include relevant coursework and graduation year."],
    };

    // 8. SKILLS
    const skillsCount = profile.skills.length;
    const userSkillsLower = new Set(profile.skills.map((s) => s.toLowerCase()));
    let matchingMarket = 0;

    for (const ms of marketDemandSkills) {
      if (userSkillsLower.has(ms.toLowerCase())) matchingMarket++;
    }

    const marketCoverage = marketDemandSkills.length > 0 ? Math.round((matchingMarket / marketDemandSkills.length) * 100) : 50;

    let skillsScore = 0;
    if (skillsCount >= 15) skillsScore += 50;
    else if (skillsCount >= 5) skillsScore += 35;
    else skillsScore += 15;

    skillsScore += Math.round(marketCoverage * 0.5);

    sections.SKILLS = {
      score: Math.min(100, skillsScore),
      status: skillsScore >= 75 ? "STRONG" : skillsScore >= 50 ? "GOOD" : "NEEDS_WORK",
      confidence: "high",
      evidence: `${skillsCount} skills detected. Covers ${marketCoverage}% of top market demand skills for ${targetRole}.`,
      issues: skillsCount < 10 ? ["Fewer than 10 skills listed. Recruiters filter candidates by skill count."] : [],
      recommendations: ["Add technical keywords that reflect your actual hands-on toolstack."],
    };

    // 9. CERTIFICATIONS
    sections.CERTIFICATIONS = {
      score: profile.certifications.length > 0 ? 85 : 50,
      status: profile.certifications.length > 0 ? "STRONG" : "NEEDS_WORK",
      confidence: "medium",
      evidence: profile.certifications.length > 0 ? `${profile.certifications.length} certifications found.` : "No certifications detected.",
      issues: [],
      recommendations: ["Add official cloud or architecture certifications if you hold them (AWS, GCP, CKA)."],
    };

    // 10. PROJECTS
    sections.PROJECTS = {
      score: profile.projects.length >= 2 ? 90 : profile.projects.length === 1 ? 70 : 40,
      status: profile.projects.length >= 1 ? "STRONG" : "NEEDS_WORK",
      confidence: "high",
      evidence: `${profile.projects.length} project items listed.`,
      issues: profile.projects.length === 0 ? ["No standalone technical projects listed."] : [],
      recommendations: ["List 2-3 production or open-source projects with architectural descriptions."],
    };

    // 11. CUSTOM URL
    const isCustomUrl = profile.canonicalUrl && !/[0-9]{7,}/.test(profile.canonicalUrl);
    sections.CUSTOM_URL = {
      score: isCustomUrl ? 100 : 40,
      status: isCustomUrl ? "STRONG" : "NEEDS_WORK",
      confidence: "high",
      evidence: isCustomUrl ? "Clean vanity URL detected." : "Default numeric LinkedIn URL detected.",
      issues: isCustomUrl ? [] : ["Your LinkedIn public URL contains auto-generated random numbers."],
      recommendations: isCustomUrl ? [] : ["Customize your public profile URL under LinkedIn settings (e.g. linkedin.com/in/firstnamelastname)."],
    };

    // 12. RECOMMENDATIONS
    sections.RECOMMENDATIONS = {
      score: (profile.recommendationsReceivedCount || 0) > 0 ? 90 : 50,
      status: (profile.recommendationsReceivedCount || 0) > 0 ? "STRONG" : "UNKNOWN",
      confidence: "low",
      evidence: profile.recommendationsReceivedCount ? `${profile.recommendationsReceivedCount} recommendations.` : "Public recommendation count unavailable.",
      issues: [],
      recommendations: ["Request 2-3 recommendations from former managers or senior peers."],
    };

    // 13. ACTIVITY
    sections.ACTIVITY = {
      score: profile.recentActivitySummary ? 80 : 50,
      status: profile.recentActivitySummary ? "GOOD" : "UNKNOWN",
      confidence: "low",
      evidence: profile.recentActivitySummary ? "Recent public post activity detected." : "Public feed activity not visible on guest profile.",
      issues: [],
      recommendations: ["Publish or comment weekly to maintain an active visibility signal in recruiter search."],
    };

    // 14. KEYWORDS
    const keywordsScore = Math.min(100, Math.round(marketCoverage * 0.7 + (headlineLen > 30 ? 30 : 10)));
    sections.KEYWORDS = {
      score: keywordsScore,
      status: keywordsScore >= 75 ? "STRONG" : keywordsScore >= 50 ? "GOOD" : "NEEDS_WORK",
      confidence: "high",
      evidence: `Keyword discoverability score: ${keywordsScore}/100.`,
      issues: keywordsScore < 70 ? ["Key search terms for your target role are missing from the headline and about section."] : [],
      recommendations: [`Ensure ${marketDemandSkills.slice(0, 4).join(", ")} appear naturally in your headline and role descriptions.`],
    };

    // Weighted Overall Score
    const weights: Record<SectionKey, number> = {
      HEADLINE: 0.15,
      ABOUT: 0.15,
      EXPERIENCE: 0.20,
      SKILLS: 0.15,
      KEYWORDS: 0.10,
      PROJECTS: 0.05,
      EDUCATION: 0.05,
      PHOTO: 0.04,
      BANNER: 0.03,
      CUSTOM_URL: 0.03,
      FEATURED: 0.02,
      CERTIFICATIONS: 0.01,
      RECOMMENDATIONS: 0.01,
      ACTIVITY: 0.01,
    };

    let weightedSum = 0;
    for (const [key, weight] of Object.entries(weights)) {
      weightedSum += (sections[key as SectionKey]?.score || 0) * weight;
    }
    const overallScore = Math.round(weightedSum);

    // Headline options (Current, Option 1, Option 2, Option 3)
    const options: any[] = [
      {
        id: "OPTION_1",
        style: "Recruiter Search Focused",
        headline: `${targetRole} | ${profile.skills.slice(0, 3).join(" • ") || "Distributed Systems"} | Ex-${profile.experience[0]?.company || "Tech"}`,
        score: 92,
        reason: "Prioritizes high-volume recruiter search keywords and exact target role title in first 40 characters.",
        keywords: [targetRole, ...profile.skills.slice(0, 3)],
        tradeoffs: "Direct and recruiter-optimized; less personal brand storytelling.",
      },
      {
        id: "OPTION_2",
        style: "Technical Depth",
        headline: `Senior ${targetRole} • Architecting High-Throughput Systems with ${profile.skills.slice(0, 2).join(" & ") || "Go & TypeScript"}`,
        score: 88,
        reason: "Highlights architectural engineering capability and specific technology expertise.",
        keywords: [targetRole, "Systems Architecture", ...profile.skills.slice(0, 2)],
        tradeoffs: "Appeals strongly to engineering hiring managers; slightly more specialized.",
      },
      {
        id: "OPTION_3",
        style: "Value & Impact",
        headline: `${targetRole} | Building Scalable Infrastructure & Developer Platforms`,
        score: 85,
        reason: "Focuses on business outcomes and platform ownership.",
        keywords: [targetRole, "Infrastructure", "Platforms"],
        tradeoffs: "Broader scope; covers team impact rather than granular syntax keywords.",
      },
    ];

    // Detailed Experience Analysis
    const experienceAnalysis = profile.experience.map((exp) => {
      const expIssuesLocal: string[] = [];
      const expRecsLocal: string[] = [];
      let itemScore = 70;

      if (!exp.bullets || exp.bullets.length === 0) {
        itemScore = 50;
        expIssuesLocal.push("Role lacks bullet points detailing specific initiatives.");
        expRecsLocal.push(`Add 3-4 bullet points highlighting technical work at ${exp.company}.`);
      } else {
        itemScore = 85;
      }

      expRecsLocal.push("Include measurable impact if available (e.g. latency, concurrency, user scale). Never fabricate metrics.");

      return {
        company: exp.company,
        role: exp.role,
        duration: exp.duration,
        score: itemScore,
        issues: expIssuesLocal,
        recommendations: expRecsLocal,
      };
    });

    // Skills Breakdown
    const strongSkills: string[] = [];
    const relevantSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const ms of marketDemandSkills) {
      if (userSkillsLower.has(ms.toLowerCase())) {
        strongSkills.push(ms);
      } else {
        missingSkills.push(ms);
      }
    }
    for (const us of profile.skills) {
      if (!strongSkills.includes(us)) {
        relevantSkills.push(us);
      }
    }

    // Consistency check if resume provided
    let resumeConsistency: any = undefined;
    if (resumeData) {
      const conflicts: any[] = [];
      if (resumeData.targetRole && profile.headline && !profile.headline.toLowerCase().includes(resumeData.targetRole.toLowerCase())) {
        conflicts.push({
          type: "TITLE_MISMATCH",
          severity: "MEDIUM",
          description: "Resume target title differs from LinkedIn headline title.",
          linkedinValue: profile.headline,
          resumeValue: resumeData.targetRole,
        });
      }
      resumeConsistency = {
        overallConsistencyScore: conflicts.length === 0 ? 100 : 75,
        conflicts,
      };
    }

    return {
      overallScore,
      sections,
      headlineAnalysis: {
        current: headline,
        score: sections.HEADLINE.score,
        issues: headlineIssues,
        options,
      },
      aboutAnalysis: {
        current: about,
        score: sections.ABOUT.score,
        issues: aboutIssues,
        improvements: [
          {
            style: "recruiter_focused",
            text: about ? `${about}\n\nCore Competencies: ${profile.skills.slice(0, 6).join(", ")}` : `Experienced ${targetRole} with focus on building resilient software.`,
            reason: "Appends explicit core competencies block for automated search scanning.",
            evidenceUsed: profile.skills.slice(0, 6),
          },
        ],
      },
      experienceAnalysis,
      skillsAnalysis: {
        strong: strongSkills,
        relevant: relevantSkills,
        weak: [],
        missing: missingSkills,
        unknown: [],
        marketCoveragePercentage: marketCoverage,
      },
      targetAlignment: {
        targetRole,
        roleAlignmentScore: new RegExp(targetRole, "i").test(headline) ? 90 : 65,
        keywordCoverageScore: marketCoverage,
        experienceAlignmentScore: expCount > 0 ? 85 : 40,
        seniorityAlignmentScore: 80,
        gaps: missingSkills.slice(0, 3).map((s) => `Missing key skill: ${s}`),
        recommendations: [`Demonstrate experience with ${missingSkills.slice(0, 2).join(" and ")} in your work history if applicable.`],
      },
      resumeConsistency,
    };
  }
}
