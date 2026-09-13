import {
  ATS_RULES,
  KEYWORDS_DATA,
  ACTION_VERBS_DATA,
  SKILLS_DATA,
  ScoreBand
} from "./ats.data";

export interface ATSIssue {
  id: string; // e.g. "ATS-001" — stable ID for this issue within a scan report
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  why: string;
  where: string;
  suggestion: string;
  beforeExample?: string;
  afterExample?: string;
  confidence: string;
}

export interface ATSSectionWeight {
  category: string;
  weight: number;
  score: number;
  contribution: number;
}

export interface ATSRoadmapItem {
  cat: string;
  score: number;
  weight: number;
  deficiency: number;
}

export interface ATSReport {
  id: string;
  createdAt: number;
  fileName: string;
  role: string;
  roleCategory: string;
  seniority?: string;
  country?: string;
  atsProfile: string;
  atsProfileNote: string;
  overallScore: number;
  grade: string;
  gradeLabel: string;
  gradeColor: string;
  passProbability: number;
  health: "Green" | "Yellow" | "Red";
  recruiterSummary: string;
  categoryScores: Record<string, number>;
  rawScores: Record<string, number>;
  sectionWeights: ATSSectionWeight[];
  keywordRes: {
    required: string[];
    matched: string[];
    missing: string[];
    matchPct: number;
    techFound: string[];
    certsFound: string[];
    stuffed: Array<{ term: string; count: number }>;
    usedJD: boolean;
  };
  structureRes: {
    score: number;
    corePresent: number;
    missingCore: string[];
    bonusPresent: number;
    bonusTotal: number;
  };
  formattingRes: {
    score: number;
    issues: ATSIssue[];
  };
  writingRes: {
    score: number;
    issues: ATSIssue[];
    flesch: number;
    weakCount: number;
    buzzCount: number;
    passiveCount: number;
  };
  achievementRes: {
    score: number;
    issues: ATSIssue[];
    quantifiedPct: number;
    strongVerbPct: number;
  };
  experienceRes: {
    score: number;
    issues: ATSIssue[];
    totalYears: number;
    gaps: Array<{ from: number; to: number; years: number }>;
    roleCount: number;
  };
  educationRes: {
    score: number;
    issues: ATSIssue[];
    hasDegree: boolean;
    gpa: string | null;
  };
  contactRes: {
    score: number;
    issues: ATSIssue[];
  };
  contact: {
    email: string | null;
    emailValid: boolean;
    phone: string | null;
    phoneValid: boolean;
    linkedin: string | null;
    github: string | null;
    portfolio: string | null;
  };
  sections: Record<string, boolean>;
  wordCount: number;
  pageCount: number;
  ocrUsed: boolean;
  issues: ATSIssue[];
  strengths: string[];
  roadmap: {
    items: ATSRoadmapItem[];
    potentialGain: number;
  };
  resumeTextPreview: string;
}

export interface ATSInput {
  resumeText: string;
  jdText?: string;
  roleCategory?: string;
  roleName?: string;
  seniority?: string;
  country?: string;
  atsProfileKey?: string;
  fileName?: string;
  pageCount?: number;
  ocrUsed?: boolean;
}

export class AtsEvaluator {
  private static clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
  }

  private static words(text: string): string[] {
    return text.toLowerCase().match(/[a-z0-9+.#/]+/g) || [];
  }

  private static sentences(text: string): string[] {
    return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  }

  private static countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, "");
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
    word = word.replace(/^y/, "");
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  public static fleschScore(text: string): number {
    const sents = this.sentences(text);
    const w = this.words(text);
    if (!sents.length || !w.length) return 0;
    const syllables = w.reduce((sum, word) => sum + this.countSyllables(word), 0);
    const score = 206.835 - 1.015 * (w.length / sents.length) - 84.6 * (syllables / w.length);
    return Math.round(this.clamp(score, 0, 100));
  }

  private static textContainsWord(text: string, term: string): boolean {
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, "i").test(text);
  }

  private static extractKeyPhrases(jdText: string): string[] {
    const stop = new Set(KEYWORDS_DATA.stopwords);
    const raw = jdText.toLowerCase().match(/[a-z][a-z0-9+.#/\-]{1,30}/g) || [];
    const freq: Record<string, number> = {};
    raw.forEach((w) => {
      if (stop.has(w) || w.length < 3) return;
      freq[w] = (freq[w] || 0) + 1;
    });

    const techHits = KEYWORDS_DATA.tech_stack.filter((t) =>
      new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(jdText)
    );

    const ranked = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([k]) => k);

    return Array.from(new Set([...techHits.map((t) => t.toLowerCase()), ...ranked])).slice(0, 35);
  }

  public static extractContact(text: string) {
    const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const PHONE_RE = /(\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/;
    const LINKEDIN_RE = /linkedin\.com\/in\/[a-zA-Z0-9\-_/]+/i;
    const GITHUB_RE = /github\.com\/[a-zA-Z0-9\-_/]+/i;
    const URL_RE = /(https?:\/\/)?(www\.)?[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(\/[^\s]*)?/gi;

    const emailMatch = text.match(EMAIL_RE);
    const phoneMatch = text.match(PHONE_RE);
    const linkedinMatch = text.match(LINKEDIN_RE);
    const githubMatch = text.match(GITHUB_RE);
    const urls = text.match(URL_RE) || [];
    const portfolio = urls.find(
      (u) => !/linkedin\.com|github\.com/i.test(u) && /\.(com|dev|io|me|net|org|xyz|portfolio)/i.test(u)
    ) || null;

    const email = emailMatch ? emailMatch[0] : null;
    const phone = phoneMatch ? phoneMatch[0].trim() : null;

    return {
      email,
      emailValid: email ? /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) : false,
      phone,
      phoneValid: phone ? phone.replace(/\D/g, "").length >= 7 : false,
      linkedin: linkedinMatch ? linkedinMatch[0] : null,
      github: githubMatch ? githubMatch[0] : null,
      portfolio
    };
  }

  public static detectSections(text: string): Record<string, boolean> {
    const headers = KEYWORDS_DATA.section_headers;
    const lines = text.split(/\n/);
    const found: Record<string, boolean> = {};

    for (const [section, aliases] of Object.entries(headers)) {
      const re = new RegExp(`^\\s*(${aliases.join("|")})\\s*:?\\s*$`, "i");
      const idx = lines.findIndex((l) => re.test(l.trim()));
      found[section] = idx !== -1;
    }

    for (const [section, aliases] of Object.entries(headers)) {
      if (found[section]) continue;
      const re = new RegExp(`\\b(${aliases.join("|")})\\b`, "i");
      found[section] = re.test(text);
    }
    return found;
  }

  public static splitBullets(text: string): string[] {
    const lines = text
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const explicitBullets = lines.filter((l) => /^[•\-*▪◦‣o]\s+/.test(l));
    if (explicitBullets.length >= 2) {
      return explicitBullets.map((l) => l.replace(/^[•\-*▪◦‣o]\s+/, ""));
    }
    return lines
      .filter((l) => l.length > 20 && l.length < 220 && !l.includes("@") && !l.includes("|"))
      .map((l) => l.replace(/^[•\-*▪◦‣o]\s+/, ""));
  }

  private static mkIssue(
    category: string,
    severity: "critical" | "high" | "medium" | "low",
    title: string,
    why: string,
    where: string,
    suggestion: string,
    confidence: "high" | "medium" | "low",
    beforeExample?: string,
    afterExample?: string
  ): ATSIssue {
    return {
      id: "", // Will be assigned sequentially after all issues are collected
      category,
      severity,
      title,
      why,
      where,
      suggestion,
      beforeExample,
      afterExample,
      confidence:
        confidence === "high"
          ? "Rule-based — high confidence"
          : confidence === "low"
          ? "Advisory — baseline confidence"
          : "Heuristic — medium confidence"
    };
  }

  private static buildBeforeAfter(weakPhrase: string): { before: string; after: string } {
    const examples: Record<string, [string, string]> = {
      "responsible for": ["Responsible for managing a team of engineers", "Led a team of 8 engineers, cutting release cycle time by 30%"],
      "worked on": ["Worked on the checkout flow redesign", "Redesigned the checkout flow, increasing conversion by 18%"],
      "helped with": ["Helped with customer onboarding", "Streamlined customer onboarding, reducing setup time from 3 days to 4 hours"],
      "assisted with": ["Assisted with database migration", "Co-architected PostgreSQL database migration with zero downtime"],
      "handled": ["Handled client requests and bugs", "Triaged and resolved 150+ high-priority client incidents with 99.4% SLA adherence"]
    };
    const pair = examples[weakPhrase.toLowerCase()] || ["Responsible for managing team", "Led a cross-functional team of 12 and improved delivery velocity by 28%"];
    return { before: pair[0], after: pair[1] };
  }

  private static analyzeKeywords(resumeText: string, jdText?: string, roleCategory?: string) {
    const resumeLower = resumeText.toLowerCase();
    let required = jdText && jdText.trim().length > 30 ? this.extractKeyPhrases(jdText) : [];
    const roleSkills = (roleCategory && SKILLS_DATA[roleCategory]) || [];
    if (required.length < 8) {
      required = Array.from(new Set([...required, ...roleSkills.map((s) => s.toLowerCase())]));
    }
    const matched: string[] = [];
    const missing: string[] = [];
    required.forEach((term) => {
      (this.textContainsWord(resumeLower, term) ? matched : missing).push(term);
    });
    const matchPct = required.length ? Math.round((matched.length / required.length) * 100) : 100;

    const techFound = KEYWORDS_DATA.tech_stack.filter((t) => this.textContainsWord(resumeLower, t.toLowerCase()));
    const certsFound = KEYWORDS_DATA.certifications.filter((c) => resumeLower.includes(c.toLowerCase()));

    const resumeWords = this.words(resumeText);
    const totalWords = resumeWords.length || 1;
    const stuffed: Array<{ term: string; count: number }> = [];
    matched.forEach((term) => {
      const count = resumeWords.filter((w) => w === term || w.startsWith(term)).length;
      const density = count / totalWords;
      if (density > 0.04 && count > 5) stuffed.push({ term, count });
    });

    return { required, matched, missing, matchPct, techFound, certsFound, stuffed, usedJD: Boolean(jdText && jdText.trim().length > 30) };
  }

  private static analyzeStructure(sections: Record<string, boolean>) {
    const core = ["contact", "summary", "experience", "education", "skills"];
    const bonus = ["projects", "certifications", "awards", "publications", "research", "languages", "volunteer", "references"];
    const corePresent = core.filter((s) => sections[s]).length;
    const bonusPresent = bonus.filter((s) => sections[s]).length;
    const score = this.clamp(Math.round((corePresent / core.length) * 85 + (bonusPresent / bonus.length) * 15), 0, 100);
    const missingCore = core.filter((s) => !sections[s]);
    return { score, corePresent, missingCore, bonusPresent, bonusTotal: bonus.length };
  }

  private static analyzeFormatting(text: string, pageCount: number, ocrUsed: boolean, wordCount: number) {
    const rules = ATS_RULES.formattingRisks;
    const issues: ATSIssue[] = [];
    let score = 100;

    if (ocrUsed) {
      issues.push(
        this.mkIssue(
          "formatting",
          "critical",
          "Scanned / image-based PDF detected",
          "Your file had almost no extractable text layer and required OCR parsing. Most applicant tracking systems cannot read scanned image resumes.",
          "Whole document",
          "Export your resume directly from Word or Google Docs as a searchable PDF or upload a DOCX file instead.",
          "high"
        )
      );
      score -= 40;
    }

    if (pageCount > rules.maxRecommendedPages) {
      issues.push(
        this.mkIssue(
          "formatting",
          "medium",
          `Resume is ${pageCount} pages long`,
          `Standard ATS and recruiter conventions recommend ${rules.maxRecommendedPages} pages or fewer unless you possess 10+ years of senior executive experience.`,
          "Whole document",
          "Condense older roles and tighten bullet points to fit comfortably within 1-2 pages.",
          "medium"
        )
      );
      score -= 10;
    }

    if (wordCount < rules.minWordsWarn) {
      issues.push(
        this.mkIssue(
          "formatting",
          "high",
          "Resume content is too brief",
          `Only ~${wordCount} words detected. Resumes with sparse content score poorly on keyword and skill matching engines.`,
          "Whole document",
          "Expand your experience bullets with quantified deliverables, responsibilities, and relevant tools.",
          "high"
        )
      );
      score -= 15;
    }

    if (wordCount > rules.maxWordsWarn) {
      issues.push(
        this.mkIssue(
          "formatting",
          "low",
          "Resume content may be excessively long",
          `~${wordCount} words detected. Overly dense resumes dilute critical keyword density and reduce human recruiter scan rates.`,
          "Whole document",
          "Trim legacy or tangential roles and keep the focus on high-impact accomplishments from the last 10 years.",
          "low"
        )
      );
      score -= 5;
    }

    const iconMatches = text.match(/[☀-➿\u{1F300}-\u{1FAFF}]/gu) || [];
    if (iconMatches.length > 3) {
      issues.push(
        this.mkIssue(
          "formatting",
          "medium",
          "Special icons or emojis detected in text",
          "Emoji or decorative icon glyphs in the text layer can get parsed as corrupt characters by legacy ATS parsers.",
          `${iconMatches.length} glyph(s) identified`,
          'Replace icon glyphs with plain standard text labels (e.g., use "Email:" instead of an envelope icon).',
          "medium"
        )
      );
      score -= 8;
    }

    const lines = text.split("\n").filter((l) => l.trim());
    const multiSpaceLines = lines.filter((l) => /\S {3,}\S/.test(l)).length;
    const totalLines = lines.length || 1;
    if (multiSpaceLines / totalLines > 0.25) {
      issues.push(
        this.mkIssue(
          "formatting",
          "medium",
          "Possible multi-column layout detected",
          "Significant line gaps indicate multi-column columns or sidebars. ATS software parses text left-to-right, which frequently scrambles columnar layouts.",
          `${multiSpaceLines} of ${totalLines} lines affected`,
          "Switch to a single-column, top-to-bottom layout for guaranteed parsing fidelity.",
          "medium"
        )
      );
      score -= 12;
    }

    if (/\|.*\|.*\|/.test(text)) {
      issues.push(
        this.mkIssue(
          "formatting",
          "low",
          "Possible table or border structure detected",
          "Pipe characters suggest tabular data. Tables frequently confuse ATS section extractors.",
          "Extracted text layer",
          "Convert tables into clear linear bullet points.",
          "low"
        )
      );
      score -= 6;
    }

    return { score: this.clamp(score, 0, 100), issues };
  }

  private static analyzeWritingQuality(text: string, bullets: string[]) {
    const issues: ATSIssue[] = [];
    let score = 100;
    const weak = ACTION_VERBS_DATA.weak;
    const buzz = ACTION_VERBS_DATA.buzzwords;
    const lower = text.toLowerCase();

    const weakHits = weak.filter((w) => lower.includes(w));
    if (weakHits.length) {
      const topWeak = weakHits[0];
      const { before, after } = this.buildBeforeAfter(topWeak);
      issues.push(
        this.mkIssue(
          "writingQuality",
          "high",
          "Weak or passive filler phrases detected",
          `Phrases such as "${weakHits.slice(0, 3).join('", "')}" weaken your authority and score lower against strong action-verb indices.`,
          `${weakHits.length} occurrence(s)`,
          `Replace passive phrases with strong ownership verbs.`,
          "medium",
          before,
          after
        )
      );
      score -= Math.min(20, weakHits.length * 4);
    }

    const buzzHits = buzz.filter((b) => lower.includes(b));
    if (buzzHits.length) {
      issues.push(
        this.mkIssue(
          "writingQuality",
          "low",
          "Cliché buzzwords detected",
          `Terms like "${buzzHits.slice(0, 3).join('", "')}" lack measurable evidence and are screened out by recruiters.`,
          `${buzzHits.length} occurrence(s)`,
          "Replace subjective buzzwords with specific, verified accomplishments.",
          "medium"
        )
      );
      score -= Math.min(10, buzzHits.length * 2);
    }

    const passiveMatches = text.match(/\b(is|are|was|were|been|being|be)\s+\w+ed\b/gi) || [];
    if (passiveMatches.length > 2) {
      issues.push(
        this.mkIssue(
          "writingQuality",
          "medium",
          "Passive voice constructions found",
          `Identified ${passiveMatches.length} passive constructions (e.g., "${passiveMatches[0]}"). Active voice conveys proactive leadership and ownership.`,
          `${passiveMatches.length} occurrence(s)`,
          "Rewrite in active voice starting with a past-tense action verb.",
          "medium",
          "The project was completed by our team on time",
          "Led cross-functional team to complete project 2 weeks ahead of schedule"
        )
      );
      score -= Math.min(12, passiveMatches.length * 2);
    }

    const wordList = this.words(text).filter((w) => w.length > 4 && !KEYWORDS_DATA.stopwords.includes(w));
    const freq: Record<string, number> = {};
    wordList.forEach((w) => (freq[w] = (freq[w] || 0) + 1));
    const overused = Object.entries(freq).filter(([, c]) => c >= 6).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (overused.length) {
      issues.push(
        this.mkIssue(
          "writingQuality",
          "low",
          "Excessive word repetition",
          `The term "${overused[0][0]}" appears ${overused[0][1]} times, which can look unnatural and flag keyword stuffing alarms.`,
          overused.map(([w, c]) => `"${w}" (${c}x)`).join(", "),
          "Diversify terminology using accurate contextual synonyms.",
          "low"
        )
      );
      score -= 5;
    }

    const longSentences = this.sentences(text).filter((s) => this.words(s).length > 32);
    if (longSentences.length > 3) {
      issues.push(
        this.mkIssue(
          "writingQuality",
          "low",
          "Run-on sentences identified",
          `${longSentences.length} sentences exceed 32 words, reducing recruiter scanning ease and clarity.`,
          "Multiple sections",
          "Break long clauses into concise, punchy bullet points.",
          "low"
        )
      );
      score -= 6;
    }

    const flesch = this.fleschScore(text);
    if (flesch < 30) {
      issues.push(
        this.mkIssue(
          "writingQuality",
          "medium",
          "Low readability score (Flesch)",
          `Flesch Reading Ease is ${flesch}/100. The text is dense and difficult for reviewers to skim quickly.`,
          "Whole document",
          "Simplify phrasing and shorten sentence structures.",
          "medium"
        )
      );
      score -= 8;
    }

    return {
      score: this.clamp(score, 0, 100),
      issues,
      flesch,
      weakCount: weakHits.length,
      buzzCount: buzzHits.length,
      passiveCount: passiveMatches.length
    };
  }

  private static analyzeAchievements(bullets: string[]) {
    const issues: ATSIssue[] = [];
    if (!bullets.length) {
      issues.push(
        this.mkIssue(
          "achievements",
          "high",
          "No clear bullet points detected",
          "We could not identify distinct bulleted accomplishment statements in your work history. ATS software and recruiters expect clear bullet points.",
          "Experience section",
          "Format responsibilities and achievements as 3-6 bullet points per role.",
          "medium"
        )
      );
      return { score: 40, issues, quantifiedPct: 0, strongVerbPct: 0 };
    }

    const strong = new Set(ACTION_VERBS_DATA.strong);
    let quantified = 0;
    let strongStart = 0;

    bullets.forEach((b) => {
      if (/\d/.test(b)) quantified++;
      const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
      if (strong.has(firstWord)) strongStart++;
    });

    const quantifiedPct = Math.round((quantified / bullets.length) * 100);
    const strongVerbPct = Math.round((strongStart / bullets.length) * 100);
    const score = Math.round(quantifiedPct * 0.5 + strongVerbPct * 0.5);

    if (quantifiedPct < 40) {
      issues.push(
        this.mkIssue(
          "achievements",
          "critical",
          "Bullet points lack measurable metrics or impact",
          `Only ${quantifiedPct}% of bullet points contain quantifiable numbers, dollar values, or percentages. Metrics are the single strongest indicator of real-world value.`,
          "Experience bullets",
          "Add specific numbers, percentage gains, time saved, or scale to your bullet points.",
          "high",
          "Responsible for managing customer support requests",
          "Resolved 45+ daily customer support tickets, improving CSAT from 82% to 96%"
        )
      );
    }

    if (strongVerbPct < 40) {
      issues.push(
        this.mkIssue(
          "achievements",
          "high",
          "Bullets do not open with strong action verbs",
          `Only ${strongVerbPct}% of bullets start with a recognized high-impact action verb (e.g., 'engineered', 'launched', 'accelerated').`,
          "Experience bullets",
          "Begin every bullet point with a past-tense action verb conveying ownership.",
          "medium",
          "Was involved in updating the payment system",
          "Overhauled payment microservice to support Stripe and PayPal, processing $2M+ monthly"
        )
      );
    }

    return { score: this.clamp(score, 0, 100), issues, quantifiedPct, strongVerbPct };
  }

  private static parseDateRanges(text: string): Array<[number, number]> {
    const monthYear = "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?\\s+(\\d{4})";
    const yearOnly = "(19|20)\\d{2}";
    const re = new RegExp(`(${monthYear}|${yearOnly})\\s*(?:-|–|—|to)\\s*(${monthYear}|${yearOnly}|Present|Current)`, "gi");
    const ranges: Array<[number, number]> = [];
    let m: RegExpExecArray | null;

    while ((m = re.exec(text)) !== null) {
      const startMatch = m[0].match(/(19|20)\d{2}/);
      const startYear = startMatch ? parseInt(startMatch[0], 10) : 0;
      const isPresent = /present|current/i.test(m[0]);
      const endMatches = m[0].match(/(19|20)\d{2}/g) || [];
      const endYear = isPresent ? new Date().getFullYear() : parseInt(endMatches[endMatches.length - 1], 10);
      if (startYear && endYear && endYear >= startYear) {
        ranges.push([startYear, endYear]);
      }
    }
    return ranges;
  }

  private static analyzeExperience(text: string, seniority?: string) {
    const issues: ATSIssue[] = [];
    const ranges = this.parseDateRanges(text).sort((a, b) => a[0] - b[0]);
    const coverage: number[] = [];
    ranges.forEach(([s, e]) => {
      for (let y = s; y <= e; y++) coverage.push(y);
    });
    const totalYears = new Set(coverage).size;

    const gaps: Array<{ from: number; to: number; years: number }> = [];
    for (let i = 1; i < ranges.length; i++) {
      const gap = ranges[i][0] - ranges[i - 1][1];
      if (gap >= 1) gaps.push({ from: ranges[i - 1][1], to: ranges[i][0], years: gap });
    }

    if (gaps.length) {
      issues.push(
        this.mkIssue(
          "experience",
          "low",
          `${gaps.length} potential employment gap(s) detected`,
          "Gaps of 1+ years between roles were found. Review these to ensure they are explained or framed positively.",
          gaps.map((g) => `${g.from}–${g.to}`).join(", "),
          "Briefly mention freelancing, education, certifications, or personal projects during gaps.",
          "low"
        )
      );
    }

    let score = 70;
    if (seniority && ATS_RULES.seniorityExpectedYears[seniority]) {
      const [min, max] = ATS_RULES.seniorityExpectedYears[seniority];
      if (totalYears >= min && totalYears <= max + 3) {
        score = 95;
      } else if (totalYears < min) {
        score = this.clamp(60 - (min - totalYears) * 8, 20, 60);
        issues.push(
          this.mkIssue(
            "experience",
            "medium",
            `Experience appears below typical range for ${seniority}`,
            `Detected ~${totalYears} year(s) of experience; ${seniority} roles typically expect ${min}-${max} years.`,
            "Experience timeline",
            "Highlight relevant projects and certifications to offset fewer formal years of experience.",
            "low"
          )
        );
      } else {
        score = 85;
      }
    } else if (ranges.length === 0) {
      score = 50;
      issues.push(
        this.mkIssue(
          "experience",
          "medium",
          "No clear employment dates detected",
          'Recognizable date ranges (e.g., "Jan 2022 – Present") could not be extracted.',
          "Experience section",
          "Provide clear start and end dates (Month Year) for every position.",
          "medium"
        )
      );
    }

    return { score: this.clamp(score, 0, 100), issues, totalYears, gaps, roleCount: ranges.length };
  }

  private static analyzeEducation(text: string) {
    const issues: ATSIssue[] = [];
    const degreeRe = /\b(Bachelor|Master|PhD|Ph\.D|B\.?Sc|M\.?Sc|BBA|MBA|B\.?A\.?|M\.?A\.?|B\.?Tech|M\.?Tech|Associate Degree|Diploma)\b/i;
    const hasDegree = degreeRe.test(text);
    const yearMatch = text.match(/(19|20)\d{2}/g) || [];
    const gpaMatch = text.match(/\bGPA[:\s]*([0-4]\.\d{1,2})/i);
    let score = 60;

    if (hasDegree) {
      score += 25;
    } else {
      issues.push(
        this.mkIssue(
          "education",
          "medium",
          "No standard degree title detected",
          "Could not identify formal degree titles (e.g., Bachelor of Science, Master, B.Tech, Diploma).",
          "Education section",
          'Spell out your degree title clearly (e.g., "Bachelor of Science in Computer Science").',
          "low"
        )
      );
    }

    if (yearMatch.length) score += 15;

    return { score: this.clamp(score, 0, 100), issues, hasDegree, gpa: gpaMatch ? gpaMatch[1] : null };
  }

  private static analyzeContact(contact: ReturnType<typeof AtsEvaluator.extractContact>, roleCategory?: string) {
    const issues: ATSIssue[] = [];
    let score = 100;

    if (!contact.email) {
      issues.push(
        this.mkIssue(
          "contact",
          "critical",
          "Missing email address",
          "Recruiters and automated ATS notifications require an email address. Resumes without an email are rejected immediately.",
          "Header / Contact section",
          "Include a professional, clickable email address at the top of your resume.",
          "high"
        )
      );
      score -= 40;
    } else if (!contact.emailValid) {
      issues.push(
        this.mkIssue(
          "contact",
          "high",
          "Email address format appears invalid",
          `Detected email "${contact.email}" does not match standard RFC format.`,
          contact.email,
          "Verify spelling of your email address.",
          "high"
        )
      );
      score -= 20;
    }

    if (!contact.phone) {
      issues.push(
        this.mkIssue(
          "contact",
          "high",
          "Missing phone number",
          "Phone numbers are heavily utilized for ATS deduplication and recruiter phone screens.",
          "Header / Contact section",
          "Add your phone number with country calling code.",
          "high"
        )
      );
      score -= 20;
    }

    if (!contact.linkedin) {
      issues.push(
        this.mkIssue(
          "contact",
          "low",
          "No LinkedIn profile detected",
          "Recruiters expect a LinkedIn profile link to verify work experience and professional network.",
          "Header / Contact section",
          "Add your customized LinkedIn URL (e.g., linkedin.com/in/yourname).",
          "medium"
        )
      );
      score -= 10;
    }

    const devRoles = ["software-engineering", "ai-data", "devops-cloud", "cybersecurity", "qa-testing"];
    if (roleCategory && devRoles.includes(roleCategory) && !contact.github) {
      issues.push(
        this.mkIssue(
          "contact",
          "low",
          "No GitHub profile detected for technical role",
          "For software engineering and data roles, a GitHub profile confirms code samples and contributions.",
          "Header / Contact section",
          "Add your active GitHub profile URL.",
          "medium"
        )
      );
      score -= 10;
    }

    return { score: this.clamp(score, 0, 100), issues };
  }

  private static detectDuplicates(text: string): ATSIssue[] {
    const issues: ATSIssue[] = [];
    const lines = text
      .split("\n")
      .map((l) => l.trim().toLowerCase())
      .filter((l) => l.length > 15);
    const freq: Record<string, number> = {};
    lines.forEach((l) => (freq[l] = (freq[l] || 0) + 1));
    const dupes = Object.entries(freq).filter(([, c]) => c > 1);
    if (dupes.length) {
      issues.push(
        this.mkIssue(
          "structure",
          "low",
          "Duplicate lines detected across sections",
          `${dupes.length} line(s) appear to be repeated word-for-word in multiple areas.`,
          "Multiple sections",
          "Remove repetitive bullet points to keep content focused and high-density.",
          "high"
        )
      );
    }
    return issues;
  }

  private static applyAtsProfile(score: number, strictness: number): number {
    const gap = 100 - score;
    const adjusted = score - gap * (strictness - 1);
    return this.clamp(Math.round(adjusted), 0, 100);
  }

  private static getGrade(score: number): ScoreBand {
    return (
      ATS_RULES.scoreBands.find((b) => score >= b.min) ||
      ATS_RULES.scoreBands[ATS_RULES.scoreBands.length - 1]
    );
  }

  private static buildRoadmap(categoryScores: Record<string, number>): {
    items: ATSRoadmapItem[];
    potentialGain: number;
  } {
    const weights = ATS_RULES.categoryWeights;
    const items = Object.entries(categoryScores)
      .map(([cat, s]) => ({
        cat,
        score: s,
        weight: weights[cat] || 0,
        deficiency: (100 - s) * (weights[cat] || 0)
      }))
      .filter((i) => i.deficiency > 1)
      .sort((a, b) => b.deficiency - a.deficiency)
      .slice(0, 5);

    const potentialGain = Math.round(items.reduce((sum, i) => sum + i.deficiency * 0.6, 0));
    return { items, potentialGain };
  }

  private static generateRecruiterSummary(
    r: Pick<ATSReport, "overallScore" | "grade" | "gradeLabel" | "role" | "strengths" | "issues" | "health" | "roadmap">
  ): string {
    const critical = r.issues.filter((i) => i.severity === "critical").length;
    const high = r.issues.filter((i) => i.severity === "high").length;
    const topCat = r.roadmap.items[0]?.cat || "core structure";
    const action =
      r.health === "Green"
        ? "This resume is in strong competitive shape and ready for recruiter review."
        : r.health === "Yellow"
        ? "This resume needs targeted revisions to reach optimal interview conversion rates."
        : "This resume needs significant revisions before submission — several critical issues would trigger automatic filtering by applicant tracking systems.";

    return (
      `Candidate scored ${r.overallScore}/100 (Grade ${r.grade} — ${r.gradeLabel}) for the ${r.role} role. ` +
      `${r.strengths.length ? "Key strengths: " + r.strengths.slice(0, 2).join(" and ") + ". " : ""}` +
      `${critical + high > 0 ? `${critical} critical and ${high} high-priority issue(s) identified, primarily around ${topCat}. ` : "No critical or high-priority issues were detected. "}` +
      action
    );
  }

  /**
   * Main evaluation entry point
   */
  public static analyze(input: ATSInput): ATSReport {
    const {
      resumeText,
      jdText = "",
      roleCategory = "software-engineering",
      roleName = "Software Engineer",
      seniority = "Mid-level",
      country = "USA",
      atsProfileKey = "generic",
      fileName = "resume",
      pageCount = 1,
      ocrUsed = false
    } = input;

    const sections = this.detectSections(resumeText);
    const contact = this.extractContact(resumeText);
    if (contact.email || contact.phone) {
      sections.contact = true;
    }
    const bullets = this.splitBullets(resumeText);
    const wordCount = this.words(resumeText).length;

    const keywordRes = this.analyzeKeywords(resumeText, jdText, roleCategory);
    const structureRes = this.analyzeStructure(sections);
    const formattingRes = this.analyzeFormatting(resumeText, pageCount, ocrUsed, wordCount);
    const writingRes = this.analyzeWritingQuality(resumeText, bullets);
    const achievementRes = this.analyzeAchievements(bullets);
    const experienceRes = this.analyzeExperience(resumeText, seniority);
    const educationRes = this.analyzeEducation(resumeText);
    const contactRes = this.analyzeContact(contact, roleCategory);
    const dupIssues = this.detectDuplicates(resumeText);

    const rawScores: Record<string, number> = {
      parsing: 100, // Derived from extraction success and formatting risks
      structure: structureRes.score,
      formatting: formattingRes.score,
      keywords: keywordRes.matchPct,
      jobAlignment: Math.min(100, Math.round((keywordRes.matchPct + experienceRes.score) / 2)),
      content: Math.round((writingRes.score + achievementRes.score + educationRes.score + contactRes.score) / 4)
    };

    const profile = ATS_RULES.atsProfiles[atsProfileKey] || ATS_RULES.atsProfiles.generic;
    const categoryScores: Record<string, number> = {};
    Object.entries(rawScores).forEach(([k, v]) => {
      categoryScores[k] = this.applyAtsProfile(v, profile.strictness);
    });

    const weights = ATS_RULES.categoryWeights;
    const overallScore = this.clamp(
      Math.round(
        Object.entries(categoryScores).reduce(
          (sum, [k, v]) => sum + v * (weights[k] || 0),
          0
        )
      ),
      0,
      100
    );

    const gradeInfo = this.getGrade(overallScore);
    const passProbability = this.clamp(
      Math.round(overallScore * 0.6 + categoryScores.keywords * 0.4),
      0,
      100
    );

    const allIssues: ATSIssue[] = [
      ...keywordRes.missing.slice(0, 10).map((m) =>
        this.mkIssue(
          "keywordMatch",
          "high",
          `Missing target keyword: "${m}"`,
          "This keyword is expected in the job description / target role skill set. Resumes missing required keywords are commonly filtered out by automated screening queries.",
          keywordRes.usedJD ? "Job Description requirement" : "Target Role skill list",
          `Naturally incorporate "${m}" into your Skills or Experience section if you have experience with it.`,
          "high"
        )
      ),
      ...structureRes.missingCore.map((s) =>
        this.mkIssue(
          "structure",
          s === "contact" || s === "experience" ? "critical" : "high",
          `Missing "${s.toUpperCase()}" section heading`,
          `A standard "${s}" section header was not detected. ATS parsers depend on recognized headers to index your credentials correctly.`,
          "Section headers",
          `Add a standard "${s.charAt(0).toUpperCase() + s.slice(1)}" section heading.`,
          "high"
        )
      ),
      ...formattingRes.issues,
      ...writingRes.issues,
      ...achievementRes.issues,
      ...experienceRes.issues,
      ...educationRes.issues,
      ...contactRes.issues,
      ...dupIssues
    ];

    if (keywordRes.stuffed.length) {
      allIssues.push(
        this.mkIssue(
          "keywordMatch",
          "medium",
          "Potential keyword stuffing detected",
          `"${keywordRes.stuffed[0].term}" occurs with high frequency (${keywordRes.stuffed[0].count} times). Excessive repetition can trigger spam detection filters.`,
          "Multiple locations",
          "Use terminology organically (2-4 well-placed instances are sufficient for ATS matching).",
          "medium"
        )
      );
    }

    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Assign sequential ATS-001, ATS-002 IDs after sorting by severity
    allIssues.forEach((issue, idx) => {
      issue.id = `ATS-${String(idx + 1).padStart(3, "0")}`;
    });

    const strengths: string[] = [];
    if (categoryScores.contact >= 90) strengths.push("Complete, verified contact information");
    if (categoryScores.achievements >= 75) strengths.push("Strong, quantified achievement bullet points with numbers and metrics");
    if (categoryScores.keywordMatch >= 75) strengths.push("Strong keyword and skill alignment with the target role");
    if (categoryScores.structure >= 85) strengths.push("Clear, standard section structure easily parsed by ATS systems");
    if (writingRes.flesch >= 50) strengths.push("Clear, highly readable writing style");
    if (keywordRes.certsFound.length) strengths.push(`Recognized professional certifications: ${keywordRes.certsFound.slice(0, 3).join(", ")}`);
    if (keywordRes.techFound.length >= 5) strengths.push(`Robust technical stack coverage (${keywordRes.techFound.length} tools detected)`);
    if (!strengths.length) strengths.push("Resume successfully parsed. Review the priority issues below to elevate your score.");

    const critical = allIssues.filter((i) => i.severity === "critical").length;
    const high = allIssues.filter((i) => i.severity === "high").length;
    const health: "Green" | "Yellow" | "Red" = critical > 0 ? "Red" : high > 2 ? "Yellow" : "Green";

    const sectionWeights: ATSSectionWeight[] = Object.entries(weights).map(([cat, w]) => ({
      category: cat,
      weight: Math.round(w * 100),
      score: categoryScores[cat] ?? 0,
      contribution: Math.round((w * (categoryScores[cat] ?? 0)))
    }));

    const roadmap = this.buildRoadmap(categoryScores);

    const report: ATSReport = {
      id: "ats_" + Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
      fileName: fileName || "resume",
      role: roleName || "Software Engineer",
      roleCategory,
      seniority,
      country,
      atsProfile: profile.label,
      atsProfileNote: profile.note,
      overallScore,
      grade: gradeInfo.grade,
      gradeLabel: gradeInfo.label,
      gradeColor: gradeInfo.color,
      passProbability,
      health,
      recruiterSummary: "",
      categoryScores,
      rawScores,
      sectionWeights,
      keywordRes,
      structureRes,
      formattingRes,
      writingRes,
      achievementRes,
      experienceRes,
      educationRes,
      contactRes,
      contact,
      sections,
      wordCount,
      pageCount,
      ocrUsed,
      issues: allIssues,
      strengths: strengths.slice(0, 6),
      roadmap,
      resumeTextPreview: resumeText.slice(0, 5000)
    };

    report.recruiterSummary = this.generateRecruiterSummary(report);

    return report;
  }
}
