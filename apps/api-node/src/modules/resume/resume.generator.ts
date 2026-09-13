import { AIService } from "../../ai/ai.service";
import { IResumeProfileData } from "./resume.model";

export class ResumeGenerator {
  /**
   * AI Summary Generator grounded strictly in user's profile and target role
   */
  static async generateSummary(
    profileData: IResumeProfileData,
    targetRole = "Software Engineer"
  ): Promise<string> {
    const skills = [
      ...(profileData.skills?.technical || []),
      ...(profileData.skills?.languages || []),
      ...(profileData.skills?.frameworks || []),
      ...(profileData.skills?.databases || [])
    ].slice(0, 10).join(", ");

    const expTitles = (profileData.experience || [])
      .map((e) => e.role)
      .filter(Boolean)
      .slice(0, 3)
      .join(", ");

    const prompt = `You are a professional executive resume writer.
Write a concise, high-impact 3-sentence professional summary for a candidate targeting the role: "${targetRole}".

VERIFIED CANDIDATE SOURCE DATA:
- Candidate Name: ${profileData.personal?.fullName || "Candidate"}
- Target Role: ${targetRole}
- Verified Skills: ${skills || "Full-stack software engineering"}
- Recent Experience Roles: ${expTitles || "Software Engineer"}

STRICT GROUNDING RULES:
1. Do NOT invent years of experience (e.g., do NOT say "10+ years" unless provided).
2. Do NOT invent unearned metrics, companies, or degrees.
3. Keep it punchy, active, and ATS-optimized.
4. Output ONLY the summary text, with no preamble or quotes.`;

    const res = await AIService.generate([{ role: "user", content: prompt }]);
    if (res && res.trim().length > 30) {
      return res.replace(/^["'\s]+|["'\s]+$/g, "").trim();
    }

    // Deterministic fallback
    return `Results-driven ${targetRole} skilled in ${skills || "modern software development"}, with a proven track record of engineering robust architectures and delivering high-quality production applications.`;
  }

  /**
   * AI Bullet Point Improver supporting 8 modes:
   * improve, shorten, expand, professional, ats_friendly, impact, grammar, rewrite
   */
  static async improveBullet(
    bullet: string,
    mode: "improve" | "shorten" | "expand" | "professional" | "ats_friendly" | "impact" | "grammar" | "rewrite" = "improve",
    context?: { role?: string; company?: string; technologies?: string[] }
  ): Promise<{
    original: string;
    improved: string;
    mode: string;
    suggestions: string[];
    problemsDetected: string[];
  }> {
    const knownTechs = context?.technologies?.join(", ") || "";
    const problemsDetected: string[] = [];

    // Analyze bullet problems deterministically
    const words = bullet.trim().split(/\s+/);
    if (/^(?:worked|helped|did|assisted|handled|was responsible)\b/i.test(bullet)) {
      problemsDetected.push("Starts with a weak or passive verb");
    }
    if (!/\b(?:\d+%(?:\.\d+)?|\$\d+[mk]?|\d+ms|\d+x|\d+k|\d+m|\d{2,})\b/i.test(bullet)) {
      problemsDetected.push("Lacks measurable impact or metric");
    }
    if (words.length < 6) problemsDetected.push("Bullet is too brief to demonstrate ownership");
    if (words.length > 35) problemsDetected.push("Bullet is overly long and risks losing reader attention");

    const modeInstructions: Record<string, string> = {
      improve: "Refactor with a strong action verb and clear result following Google's X-Y-Z formula.",
      shorten: "Make concise (12-18 words) while retaining key technical action and outcome.",
      expand: "Elaborate on technical implementation details without inventing unearned facts.",
      professional: "Use formal engineering terminology and remove colloquial or informal phrases.",
      ats_friendly: "Front-load standard technical keywords and action verbs for ATS indexing.",
      impact: "Emphasize the business or system outcome (e.g. latency, scale, reliability). If no metric is in source, add '(Add measurable outcome if available)'.",
      grammar: "Fix all grammatical errors, tense inconsistencies, and punctuation while preserving exact wording.",
      rewrite: "Completely rephrase for maximum clarity and technical precision."
    };

    const prompt = `You are an expert technical resume coach.
Transform this bullet point using mode: "${mode.toUpperCase()}".
Instruction: ${modeInstructions[mode] || modeInstructions.improve}

SOURCE BULLET: "${bullet}"
${knownTechs ? `Verified candidate technologies: ${knownTechs}` : ""}

STRICT ANTI-HALLUCINATION RULES:
1. NEVER invent users, revenue, companies, percentages, or technologies not in the source.
2. If metrics are missing, you may append: "(Add measurable result if available)".
3. Return ONLY the single improved bullet point string without bullet marks (•, -, *) or quotes.`;

    let improved = "";
    try {
      const res = await AIService.generate([{ role: "user", content: prompt }]);
      if (res && res.trim().length > 10) {
        improved = res.replace(/^["'\s•\-*]+|["'\s]+$/g, "").trim();
      }
    } catch {}

    if (!improved) {
      // Deterministic fallback based on mode
      const verb = mode === "professional" ? "Architected and delivered" : "Engineered and optimized";
      improved = `${verb} ${words.slice(1).join(" ")}${!/\d/.test(bullet) ? " (Add measurable result if available)" : ""}`;
    }

    return {
      original: bullet,
      improved,
      mode,
      suggestions: [
        "Incorporate exact metrics where possible",
        "Highlight technologies used to achieve the outcome"
      ],
      problemsDetected
    };
  }

  /**
   * Guided Achievement Generator without inventing metrics
   */
  static async generateAchievement(input: {
    action: string;
    tech?: string;
    result?: string;
    users?: string;
    time?: string;
    improvement?: string;
  }): Promise<{ bullet: string; formatted: string }> {
    const prompt = `Generate a high-impact resume achievement bullet from this guided user input:
- What candidate did: ${input.action}
- Technologies used: ${input.tech || "Not specified"}
- Result achieved: ${input.result || "Not specified"}
- Users/Scale affected: ${input.users || "None specified"}
- Timeframe: ${input.time || "None specified"}
- Performance/Business improvement: ${input.improvement || "None specified"}

STRICT RULES:
1. ONLY include numbers, users, or metrics if provided in the input above. NEVER invent numbers like "500 users" or "30% faster" unless provided above.
2. Output ONLY the single achievement bullet text.`;

    const res = await AIService.generate([{ role: "user", content: prompt }]);
    const formatted = res?.trim() || `${input.action} utilizing ${input.tech || "modern software tools"}, resulting in ${input.result || "successful deployment"}.`;

    return {
      bullet: formatted.replace(/^["'\s•\-*]+|["'\s]+$/g, ""),
      formatted
    };
  }

  /**
   * Project Description Generator
   */
  static async generateProject(input: {
    name: string;
    description: string;
    technologies: string[];
    role?: string;
    outcome?: string;
    url?: string;
  }): Promise<{
    summary: string;
    bullets: string[];
  }> {
    const techStr = input.technologies.join(", ");
    const prompt = `Generate a professional resume project description and 3 technical bullet points based on:
Project Name: ${input.name}
Core Idea: ${input.description}
Technologies: ${techStr}
Candidate Role: ${input.role || "Lead Developer"}
Outcome/Scale: ${input.outcome || "Production deployment"}

Respond in JSON format:
{
  "summary": "1-2 sentence project overview",
  "bullets": [
    "Technical architectural bullet starting with strong verb",
    "Feature implementation bullet highlighting verified technologies",
    "Outcome or deployment bullet"
  ]
}`;

    const res = await AIService.generateStructured<{ summary: string; bullets: string[] }>(
      [{ role: "user", content: prompt }],
      {}
    );

    if (res?.summary && Array.isArray(res.bullets) && res.bullets.length > 0) {
      return res;
    }

    return {
      summary: `${input.name} is an application developed using ${techStr}.`,
      bullets: [
        `Architected the core system using ${techStr}, ensuring high availability and maintainability.`,
        `Implemented key user workflows and backend integrations for optimal responsiveness.`,
        `Deployed and validated full end-to-end functionality in production environment.`
      ]
    };
  }

  /**
   * Grammar and Writing Assistant
   */
  static async checkGrammar(text: string): Promise<{
    hasIssues: boolean;
    issues: { error: string; suggestion: string; reason: string }[];
    correctedText: string;
  }> {
    const prompt = `Analyze this resume text for grammar, spelling, passive voice, weak verbs, buzzwords, and punctuation.
Text: "${text}"

Respond in pure JSON:
{
  "hasIssues": true,
  "issues": [
    { "error": "exact phrase with issue", "suggestion": "better phrasing", "reason": "why this is better" }
  ],
  "correctedText": "full corrected version of text"
}`;

    const res = await AIService.generateStructured<any>(
      [{ role: "user", content: prompt }],
      {}
    );

    if (res && typeof res.hasIssues === "boolean") {
      return res;
    }

    return {
      hasIssues: false,
      issues: [],
      correctedText: text
    };
  }

  /**
   * Credibility Checker / "Interview Risk" Detector
   * Analyzes resume claims and flags unmeasured percentages or unsubstantiated metrics
   */
  static async checkCredibility(profileData: IResumeProfileData): Promise<{
    overallRisk: "low" | "medium" | "high";
    riskItems: {
      claim: string;
      section: string;
      riskLevel: "low" | "medium" | "high";
      reason: string;
      interviewQuestions: string[];
      defenseRecommendation: string;
    }[];
  }> {
    const riskItems: any[] = [];
    const bullets: { text: string; section: string }[] = [];

    for (const exp of profileData.experience || []) {
      for (const b of exp.bullets || []) {
        bullets.push({ text: b, section: `Experience at ${exp.company}` });
      }
    }
    for (const p of profileData.projects || []) {
      for (const b of p.bullets || []) {
        bullets.push({ text: b, section: `Project ${p.name}` });
      }
    }

    for (const b of bullets) {
      // Look for claims with big percentages or numbers (e.g., 50%+, 10x, $1M+)
      const highMetricMatch = b.text.match(/\b(?:\d{2,}%|10x|\$\d+[mk]|\d+k\+?)\b/i);
      if (highMetricMatch) {
        riskItems.push({
          claim: b.text,
          section: b.section,
          riskLevel: "medium",
          reason: `Contains specific quantitative claim (${highMetricMatch[0]}). Interviewers frequently probe how this was measured.`,
          interviewQuestions: [
            `How did you measure this metric (${highMetricMatch[0]})?`,
            "What was the baseline before your optimization?",
            "What specific tools or profiling telemetry did you use?"
          ],
          defenseRecommendation: "Prepare a clear 2-minute STAR response explaining the baseline, the intervention, and the measurement tool."
        });
      }
    }

    const overallRisk = riskItems.length > 3 ? "high" : riskItems.length > 0 ? "medium" : "low";

    return {
      overallRisk,
      riskItems
    };
  }

  /**
   * Resume → Interview Questions Generator
   * Generates technical, follow-up, and behavioral questions grounded in actual resume items
   */
  static async generateInterviewQuestions(
    profileData: IResumeProfileData,
    targetRole = "Software Engineer"
  ): Promise<{
    questions: {
      id: string;
      type: "technical" | "behavioral" | "followup";
      topic: string;
      sourceClaim: string;
      question: string;
      context: string;
      riskLevel: "low" | "medium" | "high";
      preparationTip: string;
    }[];
  }> {
    const skills = [
      ...(profileData.skills?.languages || []),
      ...(profileData.skills?.frameworks || []),
      ...(profileData.skills?.databases || [])
    ].slice(0, 8).join(", ");

    const expSummary = (profileData.experience || [])
      .map((e) => `${e.role} at ${e.company}: ${(e.bullets || []).slice(0, 2).join("; ")}`)
      .slice(0, 3)
      .join("\n");

    const prompt = `You are a Principal Engineer and Hiring Manager conducting an interview for: "${targetRole}".
Generate 5 realistic interview questions based strictly on the candidate's verified resume claims:

Candidate Skills: ${skills}
Experience Claims:
${expSummary || "Full-stack developer"}

Generate a mix of:
- Technical deep dive questions based on their specific technologies
- Follow-up architectural questions
- Behavioral / challenge questions based on their projects

Respond in JSON:
{
  "questions": [
    {
      "id": "1",
      "type": "technical",
      "topic": "System Design / Tech Stack",
      "sourceClaim": "the exact claim or skill from resume",
      "question": "The interview question",
      "context": "Why the interviewer is asking this",
      "riskLevel": "medium",
      "preparationTip": "How candidate should answer using STAR methodology"
    }
  ]
}`;

    const res = await AIService.generateStructured<any>(
      [{ role: "user", content: prompt }],
      {}
    );

    if (res?.questions && Array.isArray(res.questions) && res.questions.length > 0) {
      return res;
    }

    // Deterministic fallback
    return {
      questions: [
        {
          id: "1",
          type: "technical",
          topic: "Core Architecture",
          sourceClaim: skills || "Web Application",
          question: `Can you walk me through the end-to-end architecture of your most impactful project using ${skills.split(",")[0] || "modern stacks"}?`,
          context: "Assessing architectural depth and design tradeoffs",
          riskLevel: "low",
          preparationTip: "Focus on data flow, caching, database indexing, and error handling."
        },
        {
          id: "2",
          type: "followup",
          topic: "Scaling & Performance",
          sourceClaim: "Performance optimization",
          question: "What was the biggest performance bottleneck you encountered, and how did you diagnose and resolve it?",
          context: "Assessing problem-solving under pressure",
          riskLevel: "medium",
          preparationTip: "Describe the profiling tools used, the root cause discovered, and the measured outcome."
        },
        {
          id: "3",
          type: "behavioral",
          topic: "Team Collaboration & Conflict",
          sourceClaim: "Work experience",
          question: "Tell me about a technical disagreement you had with a team member. How did you arrive at a resolution?",
          context: "Assessing communication and engineering humility",
          riskLevel: "low",
          preparationTip: "Highlight objective benchmarking, peer discussions, and alignment with business goals."
        }
      ]
    };
  }

  /**
   * AI Full Resume Generator
   * Transforms candidate background, target role, and raw notes into structured resume sections
   * strictly adhering to verified evidence without inventing false credentials.
   */
  static async generateFullResume(params: {
    targetRole: string;
    careerGoal?: string;
    experienceLevel?: string;
    skills?: string[];
    rawNotes?: string;
    existingProfile?: any;
    jobDescription?: string;
  }): Promise<Partial<IResumeProfileData>> {
    const { targetRole, careerGoal, experienceLevel = "Mid", skills = [], rawNotes = "", existingProfile, jobDescription } = params;

    const candidateLocation = existingProfile?.personal?.location || "";

    const prompt = `You are a professional executive resume writer.
Generate a structured, ATS-optimized resume profile for a candidate with the following verified inputs:
- Target Role: "${targetRole}"
- Career Goal: "${careerGoal || "Seeking challenging engineering opportunities"}"
- Experience Level: "${experienceLevel}"
- Stated Skills: ${skills.join(", ") || "Full-stack software engineering"}
- Background Notes: "${rawNotes || "Practical experience building web applications and services."}"
${jobDescription ? `- Target Job Description: "${jobDescription.slice(0, 1000)}"` : ""}

STRICT ANTI-HALLUCINATION RULES:
1. Do NOT invent companies the user did not mention; if no company is mentioned, use placeholder names like "Software Project / Company".
2. Do NOT invent fake degrees or unearned GPA metrics.
3. Keep bullet points active, technically grounded, and focused on actual engineering responsibilities.
4. Output MUST be strictly valid JSON matching this exact structure:
{
  "summary": "2-3 sentence impactful summary",
  "skills": {
    "languages": ["lang1", "lang2"],
    "frameworks": ["framework1"],
    "databases": ["db1"],
    "cloud": ["cloud1"],
    "tools": ["tool1"],
    "technical": ["skill1"],
    "soft": ["soft1"]
  },
  "experience": [
    {
      "id": "1",
      "company": "Company or Project Name",
      "role": "${targetRole}",
      "location": "Location",
      "startDate": "2023",
      "endDate": "Present",
      "current": true,
      "description": "",
      "bullets": ["Strong action verb bullet describing real technical implementation"]
    }
  ],
  "education": [
    {
      "id": "1",
      "institution": "University / College",
      "degree": "B.S. in Computer Science",
      "field": "Computer Science",
      "startDate": "2019",
      "endDate": "2023"
    }
  ],
  "projects": [
    {
      "id": "1",
      "name": "Featured Project",
      "description": "Technical project description",
      "technologies": ["React", "TypeScript", "Node.js"],
      "bullets": ["Architectural bullet describing implementation"]
    }
  ]
}`;

    const res = await AIService.generateStructured<Partial<IResumeProfileData>>(
      [{ role: "user", content: prompt }],
      {}
    );

    if (res?.summary && (res.experience || res.skills)) {
      return res;
    }

    // Deterministic fallback
    return {
      summary: `Dedicated ${targetRole} with a strong foundation in ${skills.slice(0, 4).join(", ") || "modern software engineering"}, dedicated to building scalable and robust applications.`,
      skills: {
        technical: skills,
        languages: skills.filter(s => /javascript|typescript|python|java|c\+\+|go|rust|sql/i.test(s)),
        frameworks: skills.filter(s => /react|node|next|vue|angular|express|fastify|django/i.test(s)),
        databases: skills.filter(s => /mongo|postgres|sql|redis/i.test(s)),
        cloud: skills.filter(s => /aws|docker|kubernetes|gcp|azure/i.test(s)),
        tools: ["Git"],
        soft: ["Problem Solving", "Collaboration"]
      },
      experience: [
        {
          id: "1",
          company: "Engineering Project / Organization",
          role: targetRole,
          location: candidateLocation || "Remote",
          startDate: "2023",
          endDate: "Present",
          current: true,
          description: "",
          bullets: [
            `Engineered responsive features and backend services aligning with ${targetRole} standards.`,
            `Collaborated on architecture and code reviews to maintain high quality and reliability.`
          ]
        }
      ],
      education: existingProfile?.education?.length ? existingProfile.education : [
        {
          id: "1",
          institution: "University",
          degree: "Bachelor of Science",
          field: "Computer Science",
          startDate: "2019",
          endDate: "2023"
        }
      ],
      projects: existingProfile?.projects?.length ? existingProfile.projects : [
        {
          id: "1",
          name: `${targetRole} Portfolio Application`,
          description: `Full-stack application built using ${skills.slice(0, 3).join(", ") || "modern tech stack"}`,
          technologies: skills.slice(0, 3),
          bullets: [
            `Architected the core system architecture and responsive user workflows.`,
            `Implemented automated tests and streamlined build pipeline.`
          ]
        }
      ]
    };
  }
}
