import {
  KEYWORDS_DATA,
  ACTION_VERBS_DATA,
  SKILLS_DATA,
} from "../resume/ats-engine/ats.data";
import {
  ICategoryScoreDetail,
  IATSIssueItem,
  IKeywordAnalysis,
  ISectionAnalysisItem,
  IImprovementRoadmapItem,
} from "./ats-analysis.model";

export interface IScoreEvaluationResult {
  overallScore: number;
  scoreBand: "Excellent" | "Very Good" | "Good" | "Needs Improvement" | "Weak" | "Poor";
  categoryScores: {
    keywordsSkills: ICategoryScoreDetail;
    resumeStructure: ICategoryScoreDetail;
    experienceProjects: ICategoryScoreDetail;
    formattingReadability: ICategoryScoreDetail;
    educationCertifications: ICategoryScoreDetail;
    contactInfo: ICategoryScoreDetail;
    grammarClarity: ICategoryScoreDetail;
  };
  strengths: string[];
  issues: IATSIssueItem[];
  keywordAnalysis: IKeywordAnalysis;
  sectionAnalysis: ISectionAnalysisItem[];
  improvementRoadmap: IImprovementRoadmapItem[];
  targetRole: string;
}

export interface IScoreOptions {
  mode: "GENERAL" | "JOB_SPECIFIC";
  targetRole?: string;
  jdText?: string;
  pageCount?: number;
  isScanned?: boolean;
  fileName?: string;
}

export class AtsScoringService {
  private static clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
  }

  private static words(text: string): string[] {
    return text.toLowerCase().match(/[a-z0-9+.#/]+/g) || [];
  }

  private static sentences(text: string): string[] {
    return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  }

  private static fleschScore(text: string): number {
    const sents = this.sentences(text);
    const w = this.words(text);
    if (!sents.length || !w.length) return 0;
    const syllables = w.reduce((sum, word) => {
      word = word.toLowerCase().replace(/[^a-z]/g, "");
      if (word.length <= 3) return sum + 1;
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
      word = word.replace(/^y/, "");
      const matches = word.match(/[aeiouy]{1,2}/g);
      return sum + (matches ? matches.length : 1);
    }, 0);
    const score = 206.835 - 1.015 * (w.length / sents.length) - 84.6 * (syllables / w.length);
    return Math.round(this.clamp(score, 0, 100));
  }

  private static extractJdKeyPhrases(jdText: string): string[] {
    const jdStopwords = new Set([
      ...KEYWORDS_DATA.stopwords,
      "location", "hybrid", "remote", "onsite", "proven", "track", "record", "deep",
      "plus", "requirements", "experience", "skills", "required", "seeking", "looking",
      "candidate", "qualifications", "responsibilities", "ideal", "preferred", "role",
      "work", "ability", "strong", "understanding", "knowledge", "working", "proficient",
      "hands-on", "familiarity", "excellent", "years", "degree", "opportunity", "team",
      "company", "join", "help", "build", "environment", "high", "great", "nice", "have"
    ]);

    // Priority 1: Match recognized tech stack terms and tools from KEYWORDS_DATA
    const techHits = KEYWORDS_DATA.tech_stack
      .filter((t) => new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(jdText))
      .map((t) => t.toLowerCase());

    // Priority 2: Extract meaningful keywords cleaned of trailing punctuation
    const rawTokens = jdText.toLowerCase().match(/[a-z][a-z0-9+.#/\-]{1,25}/g) || [];
    const freq: Record<string, number> = {};
    rawTokens.forEach((token) => {
      const cleaned = token.replace(/^[.,:;!?'"()\[\]{}]+|[.,:;!?'"()\[\]{}]+$/g, "").trim();
      if (!cleaned || jdStopwords.has(cleaned) || cleaned.length < 3 || /^\d+$/.test(cleaned)) return;
      freq[cleaned] = (freq[cleaned] || 0) + 1;
    });

    const rankedTokens = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);

    // Front-load tech stack hits, then high-frequency domain keywords
    return Array.from(new Set([...techHits, ...rankedTokens])).slice(0, 25);
  }

  public static detectTargetRole(resumeText: string, profile: any): string {
    if (profile?.personal?.professionalTitle && profile.personal.professionalTitle.length > 3) {
      return profile.personal.professionalTitle;
    }

    const firstLines = resumeText.split("\n").slice(0, 10).join(" ");
    const roles = [
      "Staff Systems Engineer", "Staff Systems Architect", "Lead Infrastructure Architect",
      "Cloud Infrastructure Architect", "Cloud Architect", "Solutions Architect",
      "Full Stack Engineer", "Full Stack Developer", "Software Engineer", "Backend Engineer",
      "Frontend Engineer", "DevOps Engineer", "Site Reliability Engineer", "Data Scientist",
      "Data Engineer", "Machine Learning Engineer", "Mobile Developer", "Android Developer",
      "iOS Developer", "Security Engineer", "QA Engineer", "Product Manager", "Systems Architect"
    ];

    for (const r of roles) {
      if (new RegExp(`\\b${r}\\b`, "i").test(firstLines)) {
        return r;
      }
    }

    if (profile?.experience?.[0]?.role) {
      const raw = profile.experience[0].role.split(/\||–|-|\(/)[0].trim();
      if (raw.length > 3 && raw.length < 40) {
        return raw;
      }
    }

    return "Software Engineer";
  }

  /**
   * Deterministic ATS Evaluation across all 7 Categories (Total: 100 points)
   */
  public static evaluate(
    resumeText: string,
    profileData: any,
    options: IScoreOptions
  ): IScoreEvaluationResult {
    const {
      mode = "GENERAL",
      jdText = "",
      pageCount = 1,
      isScanned = false,
      fileName = "resume.pdf",
    } = options;

    const issues: IATSIssueItem[] = [];
    const strengths: string[] = [];
    let issueIndex = 1;

    const createIssue = (
      category: string,
      severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      title: string,
      description: string,
      evidence: string,
      affectedSection: string,
      recommendation: string,
      pointsImpact: number,
      beforeExample?: string,
      afterExample?: string
    ): IATSIssueItem => {
      const item: IATSIssueItem = {
        issueId: `ATS-${String(issueIndex++).padStart(3, "0")}`,
        category,
        severity,
        title,
        description,
        evidence,
        affectedSection,
        recommendation,
        pointsImpact,
        beforeExample,
        afterExample,
      };
      issues.push(item);
      return item;
    };

    const targetRole = options.targetRole || this.detectTargetRole(resumeText, profileData);
    const resumeLower = resumeText.toLowerCase();
    const resumeWords = this.words(resumeText);
    const totalWords = resumeWords.length || 1;

    // Collect all candidate skills from extracted profile
    const profileSkills: string[] = [];
    if (profileData?.skills) {
      const sk = profileData.skills;
      if (Array.isArray(sk.languages)) profileSkills.push(...sk.languages);
      if (Array.isArray(sk.frameworks)) profileSkills.push(...sk.frameworks);
      if (Array.isArray(sk.databases)) profileSkills.push(...sk.databases);
      if (Array.isArray(sk.cloud)) profileSkills.push(...sk.cloud);
      if (Array.isArray(sk.tools)) profileSkills.push(...sk.tools);
      if (Array.isArray(sk.technical)) profileSkills.push(...sk.technical);
    }

    // Collect bullets from experiences and projects
    const allBullets: string[] = [];
    (profileData?.experience || []).forEach((exp: any) => {
      if (Array.isArray(exp.bullets)) allBullets.push(...exp.bullets.filter(Boolean));
    });
    (profileData?.projects || []).forEach((proj: any) => {
      if (Array.isArray(proj.bullets)) allBullets.push(...proj.bullets.filter(Boolean));
      else if (proj.description) allBullets.push(proj.description);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // CATEGORY 1: Keyword and Skills Relevance — 25 Points Max
    // ─────────────────────────────────────────────────────────────────────────
    let cat1Score = 25;
    let requiredKeywords: string[] = [];
    let matchedKeywords: string[] = [];
    let missingKeywords: string[] = [];
    let partiallyMatchedKeywords: string[] = [];
    let jdMatchScore: number | undefined;

    if (mode === "JOB_SPECIFIC" && jdText.trim().length > 30) {
      requiredKeywords = this.extractJdKeyPhrases(jdText);
      requiredKeywords.forEach((kw) => {
        const cleanKw = kw.replace(/^[.,:;!?'"()\[\]{}]+|[.,:;!?'"()\[\]{}]+$/g, "").trim();
        if (!cleanKw) return;
        const esc = cleanKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        let found = new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, "i").test(resumeLower);

        // Root stem & plural matching (e.g. microservices <-> microservice, caching <-> cache)
        if (!found) {
          if (cleanKw.endsWith("s") && cleanKw.length > 4) {
            const singular = cleanKw.slice(0, -1);
            found = new RegExp(`(^|[^a-z0-9])${singular}([^a-z0-9]|$)`, "i").test(resumeLower);
          } else if (cleanKw.endsWith("ing") && cleanKw.length > 5) {
            const base = cleanKw.slice(0, -3);
            found = new RegExp(`(^|[^a-z0-9])${base}`, "i").test(resumeLower);
          }
        }

        if (found) {
          matchedKeywords.push(cleanKw);
        } else {
          // Check partial match (e.g. "react" vs "react.js", "postgres" vs "postgresql")
          const partial = profileSkills.some((s) => s.toLowerCase().includes(cleanKw) || cleanKw.includes(s.toLowerCase()));
          if (partial) {
            partiallyMatchedKeywords.push(cleanKw);
          } else {
            missingKeywords.push(cleanKw);
          }
        }
      });

      const matchPct = requiredKeywords.length
        ? Math.round(((matchedKeywords.length + partiallyMatchedKeywords.length * 0.5) / requiredKeywords.length) * 100)
        : 100;
      jdMatchScore = matchPct;

      // Deterministic allocation:
      // - Keyword coverage: 10 pts
      const coveragePoints = Math.round((matchPct / 100) * 10);
      // - Technical skill identified: up to 10 pts
      const techSkillsCount = profileSkills.length;
      const techPoints = this.clamp(Math.round(techSkillsCount >= 10 ? 10 : (techSkillsCount / 10) * 10), 3, 10);
      // - Contextual keyword utilization in projects/experience: up to 5 pts
      const contextHits = matchedKeywords.filter((kw) =>
        allBullets.some((b) => b.toLowerCase().includes(kw))
      ).length;
      const contextPoints = this.clamp(Math.round((contextHits / Math.max(matchedKeywords.length, 1)) * 5), 2, 5);

      cat1Score = coveragePoints + techPoints + contextPoints;

      if (missingKeywords.length > 3) {
        const topMissing = missingKeywords.slice(0, 5);
        createIssue(
          "keywordsSkills",
          "HIGH",
          `Missing Critical JD Keywords: ${topMissing.join(", ")}`,
          `The target job description explicitly requires these skills/technologies, but they were not detected in your resume.`,
          `Job Description requirement: ${topMissing.join(", ")}`,
          "Skills & Projects sections",
          `If you possess verified experience with these technologies, incorporate them naturally into your Skills and Project descriptions.`,
          Math.min(5, 10 - coveragePoints)
        );
      }
    } else {
      // General Mode: Evaluate against role taxonomy
      const roleCat = "software-engineering";
      const taxonomy = SKILLS_DATA[roleCat] || [];
      requiredKeywords = taxonomy.slice(0, 20).map((s) => s.toLowerCase());

      requiredKeywords.forEach((kw) => {
        const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, "i").test(resumeLower)) {
          matchedKeywords.push(kw);
        } else {
          missingKeywords.push(kw);
        }
      });

      const techCount = profileSkills.length;
      const techPts = this.clamp(Math.round((techCount / 12) * 12), 4, 12);
      const roleMatchPts = this.clamp(Math.round((matchedKeywords.length / 8) * 8), 3, 8);
      const contextPts = this.clamp(allBullets.length >= 4 ? 5 : 3, 2, 5);

      cat1Score = techPts + roleMatchPts + contextPts;

      if (techCount < 5) {
        createIssue(
          "keywordsSkills",
          "HIGH",
          "Limited Technical Skill Representation",
          "Your resume lists very few technical proficiencies. ATS algorithms rank candidates by specific programming languages, frameworks, and tools.",
          `Only ${techCount} distinct technical skills detected`,
          "Skills section",
          "Categorize and expand your verified technical skills into Languages, Frameworks, Cloud, and Tools.",
          4
        );
      }
    }

    // Check keyword stuffing / excessive repetition
    const freq: Record<string, number> = {};
    resumeWords.forEach((w) => {
      if (w.length > 3 && !KEYWORDS_DATA.stopwords.includes(w)) {
        freq[w] = (freq[w] || 0) + 1;
      }
    });
    const stuffed = Object.entries(freq)
      .filter(([term, count]) => count >= 6 && count / totalWords > 0.035)
      .map(([term, count]) => ({ term, count }));

    if (stuffed.length > 0) {
      cat1Score = Math.max(5, cat1Score - 2);
      createIssue(
        "keywordsSkills",
        "MEDIUM",
        `Potential Keyword Stuffing: "${stuffed[0].term}"`,
        `The keyword "${stuffed[0].term}" appears ${stuffed[0].count} times. Excessive repetition reduces readability and can trigger ATS spam filters.`,
        `"${stuffed[0].term}" repeated ${stuffed[0].count} times (${((stuffed[0].count / totalWords) * 100).toFixed(1)}% density)`,
        "Throughout document",
        "Use natural phrasing and synonyms. 2–3 contextual mentions are sufficient for ATS parsing.",
        2
      );
    }

    cat1Score = this.clamp(cat1Score, 0, 25);
    if (cat1Score >= 20) strengths.push("Strong technical keyword and tooling footprint");

    // ─────────────────────────────────────────────────────────────────────────
    // CATEGORY 2: Resume Structure and Sections — 15 Points Max
    // ─────────────────────────────────────────────────────────────────────────
    let cat2Score = 0;
    const hasContact = Boolean(profileData?.personal?.email || profileData?.personal?.phone);
    const hasSummary = Boolean(profileData?.summary && profileData.summary.length >= 40);
    const hasSkills = Boolean(profileSkills.length > 0);
    const hasExperience = Boolean(profileData?.experience && profileData.experience.length > 0);
    const hasInternships = Boolean(profileData?.internships && profileData.internships.length > 0);
    const hasProjects = Boolean(profileData?.projects && profileData.projects.length > 0);
    const hasEducation = Boolean(profileData?.education && profileData.education.length > 0);
    const hasCerts = Boolean(profileData?.certifications && profileData.certifications.length > 0);

    if (hasContact) cat2Score += 3;
    else {
      createIssue(
        "resumeStructure",
        "CRITICAL",
        "Missing Contact Header Section",
        "No clear header containing standard contact identifiers was detected.",
        "Header area",
        "Header / Contact",
        "Place your full name, email, phone, location, and LinkedIn at the top of page 1.",
        3
      );
    }

    if (hasSummary) cat2Score += 2;
    else {
      createIssue(
        "resumeStructure",
        "LOW",
        "Missing or Brief Professional Summary",
        "A concise 2–3 sentence executive summary introduces your core engineering focus to both recruiters and parsers.",
        profileData?.summary ? `Summary only has ${profileData.summary.length} characters` : "No summary section detected",
        "Professional Summary",
        "Add a 2–3 sentence summary highlighting your technical domain, key accomplishments, and target role.",
        1
      );
    }

    if (hasSkills) cat2Score += 3;
    else {
      createIssue(
        "resumeStructure",
        "HIGH",
        "Missing Dedicated Skills Section",
        "Applicant tracking systems look for an explicit 'Technical Skills' or 'Skills' header to extract core competencies.",
        "Skills section not detected",
        "Skills",
        "Add a distinct 'Skills' section with clear categorized groupings.",
        3
      );
    }

    // Experience-aware: Freshers can substitute Experience with Projects/Internships without penalty
    if (hasExperience) {
      cat2Score += 3;
    } else if (hasInternships || (hasProjects && profileData.projects.length >= 2)) {
      cat2Score += 3; // Fair experience-aware evaluation
    } else {
      cat2Score += 1;
      createIssue(
        "resumeStructure",
        "HIGH",
        "Sparse Experience or Project History",
        "Neither professional employment, internships, nor multi-project technical portfolios could be identified.",
        "Experience section missing or empty",
        "Experience / Projects",
        "Add detailed descriptions of your work experience, internships, or academic engineering projects.",
        2
      );
    }

    if (hasEducation) cat2Score += 2;
    else {
      createIssue(
        "resumeStructure",
        "MEDIUM",
        "Missing Education Section",
        "Degrees and academic credentials provide required baseline verification for enterprise ATS screeners.",
        "Education section missing",
        "Education",
        "Add an 'Education' section stating degree, institution, and graduation year.",
        2
      );
    }

    if (hasProjects || hasCerts) cat2Score += 2;
    else {
      createIssue(
        "resumeStructure",
        "LOW",
        "No Projects or Certifications Found",
        "Demonstrated projects or industry certifications significantly increase candidate interview callbacks.",
        "No projects or certifications found",
        "Projects",
        "Add 1–2 key engineering projects showcasing technologies you built or deployed.",
        1
      );
    }

    cat2Score = this.clamp(cat2Score, 0, 15);
    if (cat2Score >= 13) strengths.push("Well-organized, standard ATS section hierarchy");

    // ─────────────────────────────────────────────────────────────────────────
    // CATEGORY 3: Work Experience and Project Quality — 15 Points Max
    // ─────────────────────────────────────────────────────────────────────────
    let cat3Score = 15;
    const strongVerbs = new Set(ACTION_VERBS_DATA.strong.map((v) => v.toLowerCase()));

    let quantifiedBulletsCount = 0;
    let strongVerbBulletsCount = 0;
    const weakBulletsFound: string[] = [];

    allBullets.forEach((bullet) => {
      const bTrim = bullet.trim();
      // Quantified check: contains numbers, percentages, currency, or scale metrics
      if (/\d+[%kKmMbBxX]?|\$|€|£|₹|\b(reduced|increased|improved|cut|saved|scaled)\b/i.test(bTrim)) {
        quantifiedBulletsCount++;
      }

      // Strong action verb check
      const firstWord = bTrim.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
      if (firstWord && strongVerbs.has(firstWord)) {
        strongVerbBulletsCount++;
      }

      // Vague statement check
      if (
        /^(worked on|helped with|responsible for|assisted in|handled|involved in|participated in)\b/i.test(bTrim) ||
        bTrim.length < 35
      ) {
        weakBulletsFound.push(bTrim);
      }
    });

    const totalBulletCount = Math.max(allBullets.length, 1);
    const quantifiedPct = Math.round((quantifiedBulletsCount / totalBulletCount) * 100);
    const strongVerbPct = Math.round((strongVerbBulletsCount / totalBulletCount) * 100);

    // Quantified impact: 6 pts
    let quantPts = 6;
    if (quantifiedPct < 20) {
      quantPts = 2;
      createIssue(
        "experienceProjects",
        "HIGH",
        "Bullets Lack Quantifiable Metrics or Scale",
        `Only ${quantifiedPct}% of your project and experience bullet points contain quantifiable metrics, percentages, or measurable results.`,
        weakBulletsFound[0] || "Experience bullets lack quantifiable deliverables",
        "Experience & Projects",
        "Include measurable impact (e.g. latency reduced by 35%, throughput increased to 10k req/sec, test coverage improved to 90%).",
        4,
        "Worked on database queries to make them faster",
        "Optimized PostgreSQL connection pooling and indexing, reducing p95 query latency by 42%"
      );
    } else if (quantifiedPct < 45) {
      quantPts = 4;
    }

    // Strong action verbs: 5 pts
    let verbPts = 5;
    if (strongVerbPct < 25) {
      verbPts = 2;
      createIssue(
        "experienceProjects",
        "MEDIUM",
        "Bullets Do Not Open with Strong Action Verbs",
        `Only ${strongVerbPct}% of bullets start with high-impact engineering verbs (e.g. 'Architected', 'Engineered', 'Overhauled', 'Automated').`,
        weakBulletsFound[1] || "Bullets open with passive phrasing",
        "Experience & Projects",
        "Begin every bullet point with a decisive action verb in the past tense.",
        3,
        "Was responsible for writing automated test cases",
        "Engineered automated E2E test suites with Cypress, boosting regression coverage to 94%"
      );
    } else if (strongVerbPct < 50) {
      verbPts = 3.5;
    }

    // Technical depth & specificity: 4 pts
    let depthPts = 4;
    if (weakBulletsFound.length >= 3) {
      depthPts = 2;
      createIssue(
        "experienceProjects",
        "MEDIUM",
        "Vague Technical Descriptions Detected",
        "Several statements describe responsibilities broadly without specifying the underlying architecture, protocols, or tools.",
        `"${weakBulletsFound[0]}"`,
        "Projects & Experience",
        "Specify the exact tools, architectures, and outcomes for each project contribution.",
        2
      );
    }

    cat3Score = this.clamp(Math.round(quantPts + verbPts + depthPts), 0, 15);
    if (cat3Score >= 12) strengths.push("Strong bullet point structure with verified technical achievements");

    // ─────────────────────────────────────────────────────────────────────────
    // CATEGORY 4: Formatting and ATS Readability — 15 Points Max
    // ─────────────────────────────────────────────────────────────────────────
    let cat4Score = 15;

    // Scanned image check (6 pts)
    if (isScanned || resumeText.trim().length < 50) {
      cat4Score -= 9;
      createIssue(
        "formattingReadability",
        "CRITICAL",
        "Scanned Document / Empty Text Layer Detected",
        "The uploaded PDF has virtually no extractable text layer. Modern and legacy ATS systems cannot parse scanned bitmap images.",
        `Only ${resumeText.trim().length} characters extracted from file stream`,
        "Whole Document",
        "Export directly from Google Docs or Microsoft Word as a native text PDF, or upload a DOCX document.",
        9
      );
    }

    // Multi-column parse scrambling check (3 pts)
    const lines = resumeText.split("\n").filter((l) => l.trim());
    const multiSpaceLines = lines.filter((l) => /\S {4,}\S/.test(l)).length;
    if (lines.length > 0 && multiSpaceLines / lines.length > 0.22) {
      cat4Score -= 2;
      createIssue(
        "formattingReadability",
        "MEDIUM",
        "Complex Multi-Column Layout Detected",
        "Significant horizontal spacing indicates multiple columns or floating sidebars. ATS parsers read left-to-right across columns, scrambling content order.",
        `${multiSpaceLines} lines feature wide horizontal gaps characteristic of multi-column tables`,
        "Document Layout",
        "Use a clean single-column linear layout to guarantee 100% parsing fidelity across Taleo, Workday, and Greenhouse.",
        2
      );
    }

    // Page count compliance (3 pts)
    if (pageCount > 2) {
      cat4Score -= 2;
      createIssue(
        "formattingReadability",
        "MEDIUM",
        `Resume Length Exceeds Standard Window (${pageCount} Pages)`,
        "Standard recruiter conventions strongly recommend 1 page (for candidates with under 5 years experience) or 2 pages maximum.",
        `Document contains ${pageCount} pages`,
        "Page Count",
        "Condense older roles and tighten bullet spacing to fit within 1–2 pages.",
        2
      );
    }

    // Emojis / strange glyphs (1.5 pts)
    const iconMatches = resumeText.match(/[☀-➿\u{1F300}-\u{1FAFF}]/gu) || [];
    if (iconMatches.length > 2) {
      cat4Score -= 1.5;
      createIssue(
        "formattingReadability",
        "LOW",
        "Special Emojis or Icons Detected in Text Layer",
        "Decorative symbols or emojis can corrupt text extraction in older ATS parsers, producing garbled characters.",
        `${iconMatches.length} emoji/icon glyph(s) identified`,
        "Text Layer",
        "Replace icons with clean textual headers and standard bullet points.",
        1.5
      );
    }

    // Word count bounds (1.5 pts)
    if (totalWords < 180) {
      cat4Score -= 1.5;
      createIssue(
        "formattingReadability",
        "HIGH",
        "Document Content is Too Sparse",
        `Only ${totalWords} words detected. Resumes under 200 words score poorly on automated keyword scoring and completeness checks.`,
        `Word count: ${totalWords}`,
        "Content Density",
        "Add detailed descriptions to your projects, responsibilities, and technical proficiencies.",
        1.5
      );
    } else if (totalWords > 1200) {
      cat4Score -= 1;
    }

    cat4Score = this.clamp(Math.round(cat4Score), 0, 15);
    if (cat4Score >= 13) strengths.push("Clean single-column text layer with high ATS readability");

    // ─────────────────────────────────────────────────────────────────────────
    // CATEGORY 5: Education and Certifications — 10 Points Max
    // ─────────────────────────────────────────────────────────────────────────
    let cat5Score = 10;
    const degreeRegex = /\b(Bachelor|Master|PhD|Ph\.D|B\.?Sc|M\.?Sc|BBA|MBA|B\.?A\.?|M\.?A\.?|B\.?Tech|M\.?Tech|Associate Degree|Diploma|B\.E\.|M\.E\.)\b/i;
    const hasDegree = degreeRegex.test(resumeText);
    const hasUniversity = (profileData?.education || []).some((e: any) => e.institution && e.institution.length > 2) ||
      /\b(University|College|Institute|Polytechnic|Academy|School)\b/i.test(resumeText);
    const hasGradYear = /(?:19|20)\d{2}/.test(resumeText);

    if (!hasDegree) {
      cat5Score -= 3;
      createIssue(
        "educationCertifications",
        "MEDIUM",
        "No Formal Degree Designation Detected",
        "Could not detect recognized academic degrees (e.g. Bachelor of Technology, Bachelor of Science, Master of Science).",
        "Education section",
        "Education",
        "Explicitly write your degree title (e.g. 'Bachelor of Technology in Computer Science').",
        3
      );
    }

    if (!hasUniversity) {
      cat5Score -= 2;
      createIssue(
        "educationCertifications",
        "LOW",
        "Institution Name Not Clearly Stated",
        "Could not identify an accredited college or university name in the education section.",
        "Institution missing or ambiguous",
        "Education",
        "State your full college or university name alongside your degree.",
        2
      );
    }

    if (!hasGradYear) {
      cat5Score -= 1.5;
      createIssue(
        "educationCertifications",
        "LOW",
        "Graduation Year Omitted",
        "Graduation years allow recruiters and automated parsers to calibrate your seniority band.",
        "Graduation timeline not detected",
        "Education",
        "Include your graduation year (e.g. 'Graduation: 2024' or '2020 – 2024').",
        1.5
      );
    }

    cat5Score = this.clamp(Math.round(cat5Score), 0, 10);
    if (cat5Score >= 8) strengths.push("Clear academic credentials with degree verification");

    // ─────────────────────────────────────────────────────────────────────────
    // CATEGORY 6: Contact Information and Professional Links — 10 Points Max
    // ─────────────────────────────────────────────────────────────────────────
    let cat6Score = 10;
    const email = profileData?.personal?.email || (resumeText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] ?? null);
    const phone = profileData?.personal?.phone || (resumeText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/)?.[0] ?? null);
    const linkedin = profileData?.personal?.linkedin || (resumeText.match(/linkedin\.com\/in\/[\w-]+/i)?.[0] ?? null);
    const github = profileData?.personal?.github || (resumeText.match(/github\.com\/[\w-]+/i)?.[0] ?? null);
    const portfolio = profileData?.personal?.portfolio || (resumeText.match(/https?:\/\/(?!www\.linkedin|www\.github)[\w.-]+\.[a-z]{2,}/i)?.[0] ?? null);

    if (!email) {
      cat6Score -= 4;
      createIssue(
        "contactInfo",
        "CRITICAL",
        "Missing Contact Email Address",
        "Automated ATS candidate records cannot be created without a valid email address.",
        "No email detected",
        "Header / Contact",
        "Include a professional email address at the top of your resume.",
        4
      );
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      cat6Score -= 2;
      createIssue(
        "contactInfo",
        "HIGH",
        "Malformed Email Address Detected",
        `Extracted email "${email}" does not match standard RFC email formatting.`,
        email,
        "Header / Contact",
        "Verify your email spelling and domain format.",
        2
      );
    }

    if (!phone) {
      cat6Score -= 3;
      createIssue(
        "contactInfo",
        "HIGH",
        "Missing Phone Number",
        "Recruiters use phone numbers for ATS deduplication and scheduling phone screens.",
        "No phone number detected",
        "Header / Contact",
        "Add a primary contact phone number with country dialing code.",
        3
      );
    }

    if (!linkedin) {
      cat6Score -= 1.5;
      createIssue(
        "contactInfo",
        "LOW",
        "No LinkedIn Profile Link Found",
        "90%+ of technical recruiters cross-reference resumes with LinkedIn profiles for verified identity verification.",
        "LinkedIn profile omitted",
        "Header / Contact",
        "Include your customized LinkedIn URL (e.g. linkedin.com/in/username).",
        1.5
      );
    }

    if (!github && !portfolio) {
      cat6Score -= 1.5;
      createIssue(
        "contactInfo",
        "LOW",
        "No GitHub or Portfolio Link for Technical Candidate",
        "Adding a GitHub profile or portfolio URL provides instant proof of code and project deliverables.",
        "GitHub/Portfolio omitted",
        "Header / Contact",
        "Include a link to your active GitHub account or engineering portfolio.",
        1.5
      );
    }

    cat6Score = this.clamp(Math.round(cat6Score), 0, 10);
    if (cat6Score >= 9) strengths.push("Complete contact information and professional verified links");

    // ─────────────────────────────────────────────────────────────────────────
    // CATEGORY 7: Grammar, Clarity and Content Quality — 10 Points Max
    // ─────────────────────────────────────────────────────────────────────────
    let cat7Score = 10;
    const weakFillerHits = ACTION_VERBS_DATA.weak.filter((w) => resumeLower.includes(w));
    const buzzwordHits = ACTION_VERBS_DATA.buzzwords.filter((b) => resumeLower.includes(b));
    const passiveMatches = resumeText.match(/\b(is|are|was|were|been|being|be)\s+\w+ed\b/gi) || [];

    if (weakFillerHits.length >= 2) {
      cat7Score -= 2.5;
      createIssue(
        "grammarClarity",
        "HIGH",
        `Passive Filler Phrases Detected: "${weakFillerHits.slice(0, 3).join('", "')}"`,
        "Phrases like 'responsible for' or 'helped with' describe obligations rather than proactive leadership and results.",
        `${weakFillerHits.length} passive filler instances identified`,
        "Experience & Projects",
        "Replace passive duties with active achievement verbs.",
        2.5,
        "Responsible for handling customer support tickets",
        "Resolved 45+ daily customer support tickets, elevating CSAT from 82% to 96%"
      );
    }

    if (buzzwordHits.length >= 2) {
      cat7Score -= 2;
      createIssue(
        "grammarClarity",
        "LOW",
        `Unsubstantiated Buzzwords Detected: "${buzzwordHits.slice(0, 3).join('", "')}"`,
        "Subjective adjectives like 'hard working' or 'go-getter' are screened out by recruiters unless backed by measurable achievements.",
        `${buzzwordHits.length} corporate buzzwords identified`,
        "Summary & Experience",
        "Replace subjective buzzwords with demonstrated technical milestones.",
        2
      );
    }

    if (passiveMatches.length > 3) {
      cat7Score -= 2;
      createIssue(
        "grammarClarity",
        "MEDIUM",
        "High Frequency of Passive Voice Constructions",
        `Found ${passiveMatches.length} passive sentence structures (e.g. "${passiveMatches[0]}"). Passive voice weakens candidate agency.`,
        `${passiveMatches.length} passive verb constructions`,
        "Experience bullets",
        "Convert statements to active voice starting with a past-tense action verb.",
        2,
        "The web application was rebuilt using React and Tailwind",
        "Rebuilt client web application using React and Tailwind, slashing bundle size by 38%"
      );
    }

    const flesch = this.fleschScore(resumeText);
    if (flesch < 30) {
      cat7Score -= 1.5;
      createIssue(
        "grammarClarity",
        "LOW",
        "Low Readability Score (Flesch Index)",
        `Flesch Reading Ease is ${flesch}/100. Overly dense, convoluted clauses reduce human recruiter skimming speed.`,
        `Flesch reading score: ${flesch}`,
        "Throughout document",
        "Break long sentences into concise, bulleted statements under 24 words.",
        1.5
      );
    }

    // Duplicate verbatim lines check
    const dupLines = lines.map((l) => l.trim().toLowerCase()).filter((l) => l.length > 25);
    const lineFreq: Record<string, number> = {};
    dupLines.forEach((l) => (lineFreq[l] = (lineFreq[l] || 0) + 1));
    const duplicates = Object.entries(lineFreq).filter(([, count]) => count > 1);
    if (duplicates.length > 0) {
      cat7Score -= 1;
      createIssue(
        "grammarClarity",
        "LOW",
        "Duplicate Verbatim Lines Identified",
        `${duplicates.length} line(s) appear word-for-word in multiple sections.`,
        `"${duplicates[0][0]}" repeated`,
        "Multiple sections",
        "Remove repetitive statements to keep your resume compact and impactful.",
        1
      );
    }

    cat7Score = this.clamp(Math.round(cat7Score), 0, 10);
    if (cat7Score >= 8) strengths.push("Professional tone and active voice clarity");

    // ─────────────────────────────────────────────────────────────────────────
    // FINAL OVERALL SCORE & AGGREGATION
    // ─────────────────────────────────────────────────────────────────────────
    const overallScore = this.clamp(
      cat1Score + cat2Score + cat3Score + cat4Score + cat5Score + cat6Score + cat7Score,
      0,
      100
    );

    let scoreBand: "Excellent" | "Very Good" | "Good" | "Needs Improvement" | "Weak" | "Poor";
    if (overallScore >= 90) scoreBand = "Excellent";
    else if (overallScore >= 80) scoreBand = "Very Good";
    else if (overallScore >= 70) scoreBand = "Good";
    else if (overallScore >= 55) scoreBand = "Needs Improvement";
    else if (overallScore >= 40) scoreBand = "Weak";
    else scoreBand = "Poor";

    // Build Category Score Details
    const categoryScores = {
      keywordsSkills: {
        score: cat1Score,
        maxScore: 25,
        percentage: Math.round((cat1Score / 25) * 100),
        summary:
          cat1Score >= 21
            ? "Excellent keyword density and comprehensive technical coverage."
            : cat1Score >= 16
            ? "Good keyword foundation with opportunities to highlight additional specific tools."
            : "Under-represented technical keywords for the target role.",
        issuesCount: issues.filter((i) => i.category === "keywordsSkills").length,
      },
      resumeStructure: {
        score: cat2Score,
        maxScore: 15,
        percentage: Math.round((cat2Score / 15) * 100),
        summary:
          cat2Score >= 13
            ? "Clean, complete ATS section hierarchy with all core headings present."
            : cat2Score >= 10
            ? "Most standard sections present, but some key headers are missing or misplaced."
            : "Missing multiple required sections expected by automated parsers.",
        issuesCount: issues.filter((i) => i.category === "resumeStructure").length,
      },
      experienceProjects: {
        score: cat3Score,
        maxScore: 15,
        percentage: Math.round((cat3Score / 15) * 100),
        summary:
          cat3Score >= 12
            ? "Strong bullet points with clear technical implementation details."
            : cat3Score >= 9
            ? "Solid project and experience background, but needs more quantifiable metrics."
            : "Vague descriptions without measurable metrics or strong action verbs.",
        issuesCount: issues.filter((i) => i.category === "experienceProjects").length,
      },
      formattingReadability: {
        score: cat4Score,
        maxScore: 15,
        percentage: Math.round((cat4Score / 15) * 100),
        summary:
          cat4Score >= 13
            ? "Clean single-column structure with high OCR and text layer extractability."
            : cat4Score >= 9
            ? "Parsable text layer, but some layout or page length anomalies detected."
            : "Significant formatting or extraction risks that could cause parsing failures.",
        issuesCount: issues.filter((i) => i.category === "formattingReadability").length,
      },
      educationCertifications: {
        score: cat5Score,
        maxScore: 10,
        percentage: Math.round((cat5Score / 10) * 100),
        summary:
          cat5Score >= 8
            ? "Clear academic credentials with degree, institution, and dates verified."
            : cat5Score >= 6
            ? "Academic history present, but degree or graduation timeline is ambiguous."
            : "Missing or unverified formal education credentials.",
        issuesCount: issues.filter((i) => i.category === "educationCertifications").length,
      },
      contactInfo: {
        score: cat6Score,
        maxScore: 10,
        percentage: Math.round((cat6Score / 10) * 100),
        summary:
          cat6Score >= 9
            ? "All essential contact details and professional links verified."
            : cat6Score >= 6
            ? "Essential contact details present, but missing LinkedIn or GitHub."
            : "Missing critical contact information (email or phone).",
        issuesCount: issues.filter((i) => i.category === "contactInfo").length,
      },
      grammarClarity: {
        score: cat7Score,
        maxScore: 10,
        percentage: Math.round((cat7Score / 10) * 100),
        summary:
          cat7Score >= 8
            ? "Active, professional tone with strong sentence clarity."
            : cat7Score >= 6
            ? "Generally clear, but contains occasional passive phrasing or buzzwords."
            : "Frequent passive voice, weak filler phrases, or repetitive wording.",
        issuesCount: issues.filter((i) => i.category === "grammarClarity").length,
      },
    };

    // Sort issues by severity: CRITICAL first, then HIGH, MEDIUM, LOW
    const severityRank: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    issues.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

    // Section-wise analysis
    const sectionAnalysis: ISectionAnalysisItem[] = [
      {
        sectionName: "Professional Summary",
        status: hasSummary ? "EXCELLENT" : "NEEDS_IMPROVEMENT",
        whatIsGood: hasSummary ? "Concise summary provides clear focus and target domain." : "Clean header space.",
        whatIsWrong: hasSummary ? "Ensure key competencies are front-loaded." : "Missing or brief summary statement.",
        recommendation: "Provide a 2–3 sentence executive summary showcasing your core engineering competencies.",
      },
      {
        sectionName: "Technical Skills",
        status: profileSkills.length >= 8 ? "EXCELLENT" : profileSkills.length >= 4 ? "GOOD" : "NEEDS_IMPROVEMENT",
        whatIsGood: `Detected ${profileSkills.length} technical skills across tools and frameworks.`,
        whatIsWrong: profileSkills.length < 8 ? "Skill count is lower than competitive industry benchmarks." : "None",
        recommendation: "Organize skills into Languages, Frameworks, Cloud, and Databases for instant recruiter parsing.",
      },
      {
        sectionName: "Experience & Internships",
        status: hasExperience || hasInternships ? "GOOD" : "NEEDS_IMPROVEMENT",
        whatIsGood: `${(profileData?.experience || []).length} role(s) / internships cataloged.`,
        whatIsWrong: quantifiedPct < 40 ? "Most bullets describe responsibilities rather than quantitative outcomes." : "None",
        recommendation: "Quantify achievements by adding metrics, percentage gains, scale, or latency improvements.",
      },
      {
        sectionName: "Engineering Projects",
        status: hasProjects ? "EXCELLENT" : "NEEDS_IMPROVEMENT",
        whatIsGood: `${(profileData?.projects || []).length} key project(s) showcased.`,
        whatIsWrong: !hasProjects ? "Missing technical projects to demonstrate hands-on coding ability." : "None",
        recommendation: "Detail the technical stack, architectural decisions, and deployed results for each project.",
      },
      {
        sectionName: "Education & Credentials",
        status: hasDegree && hasUniversity ? "EXCELLENT" : "GOOD",
        whatIsGood: hasDegree ? "Accredited degree title verified." : "Academic background listed.",
        whatIsWrong: !hasGradYear ? "Graduation year or dates omitted." : "None",
        recommendation: "Specify your exact degree title, institution, and graduation year.",
      },
      {
        sectionName: "Contact Information",
        status: email && phone ? "EXCELLENT" : "NEEDS_IMPROVEMENT",
        whatIsGood: "Essential communication channels present.",
        whatIsWrong: !linkedin ? "Missing LinkedIn profile link." : !github ? "Missing GitHub or portfolio link." : "None",
        recommendation: "Include clickable LinkedIn and GitHub profile links in your top header.",
      },
    ];

    // Priority Improvement Roadmap
    const improvementRoadmap: IImprovementRoadmapItem[] = [];
    const critIssues = issues.filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH");
    if (critIssues.length > 0) {
      improvementRoadmap.push({
        priority: 1,
        title: "Resolve Critical Parsing & Contact Blockers",
        category: "contactInfo",
        description: critIssues[0].description,
        action: critIssues[0].recommendation,
      });
    }

    const structIssues = issues.filter((i) => i.category === "resumeStructure");
    if (structIssues.length > 0) {
      improvementRoadmap.push({
        priority: 2,
        title: "Standardize ATS Section Headings",
        category: "resumeStructure",
        description: structIssues[0].description,
        action: structIssues[0].recommendation,
      });
    }

    const expIssues = issues.filter((i) => i.category === "experienceProjects" || i.category === "keywordsSkills");
    if (expIssues.length > 0) {
      improvementRoadmap.push({
        priority: 3,
        title: "Inject Quantifiable Metrics and Role Keywords",
        category: "experienceProjects",
        description: "Transform generic responsibilities into quantified accomplishments with target technologies.",
        action: "Add measurable numbers, percentage gains, and specific framework names to each project bullet.",
      });
    }

    const grammarIssues = issues.filter((i) => i.category === "grammarClarity");
    if (grammarIssues.length > 0) {
      improvementRoadmap.push({
        priority: 4,
        title: "Refine Action Verbs and Active Voice",
        category: "grammarClarity",
        description: "Eliminate passive filler phrases ('responsible for', 'worked on') in favor of active verbs.",
        action: "Start each bullet point with a decisive action verb conveying proactive ownership.",
      });
    }

    // Default roadmap items if resume is already high-scoring
    if (improvementRoadmap.length === 0) {
      improvementRoadmap.push({
        priority: 1,
        title: "Optimize Keyword Match for Target Companies",
        category: "keywordsSkills",
        description: "Tailor technical keywords to match exact job requisition requirements.",
        action: "Run a Job-Specific scan against specific job descriptions before applying.",
      });
    }

    return {
      overallScore,
      scoreBand,
      categoryScores,
      strengths,
      issues,
      keywordAnalysis: {
        mode,
        targetRole,
        jdMatchScore,
        requiredKeywords,
        matchedKeywords,
        missingKeywords,
        partiallyMatchedKeywords,
        stuffedKeywords: stuffed,
      },
      sectionAnalysis,
      improvementRoadmap,
      targetRole,
    };
  }
}
