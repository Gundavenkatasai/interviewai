const pdfParse = require("pdf-parse");
import mammoth from "mammoth";
import { IResumeProfileData, defaultPersonal, defaultSkills } from "./resume.model";

export class ResumeParser {
  /**
   * Extract raw text from uploaded buffer with Scanned PDF detection
   */
  static async extractRawText(
    buffer: Buffer,
    fileType: string
  ): Promise<{ text: string; isScanned: boolean; warnings: string[] }> {
    const type = fileType.toLowerCase();
    const warnings: string[] = [];
    let text = "";
    let isScanned = false;

    if (type.includes("pdf")) {
      try {
        let pdfText = "";
        const pdfModule = require("pdf-parse");
        if (pdfModule?.PDFParse) {
          const parser = new pdfModule.PDFParse({ data: buffer });
          const res = await parser.getText();
          pdfText = res?.text || "";
          if (typeof parser.destroy === "function") {
            await parser.destroy();
          }
        } else if (typeof pdfModule === "function") {
          const data = await pdfModule(buffer);
          pdfText = data.text || "";
        } else if (typeof pdfModule?.default === "function") {
          const data = await pdfModule.default(buffer);
          pdfText = data.text || "";
        }
        text = pdfText;

        // Scanned PDF detection: if total extracted text across pages is under 25 chars
        if (text.trim().length < 25) {
          isScanned = true;
          warnings.push(
            "This PDF appears to be scanned or contains only images. Text could not be extracted directly."
          );
        }
      } catch (err: any) {
        console.error("[ResumeParser] PDF parsing error:", err);
        isScanned = true;
        warnings.push("Failed to parse PDF stream. Document might be encrypted or scanned.");
      }
    } else if (type.includes("docx") || type.includes("word")) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value || "";
        if (result.messages?.length) {
          warnings.push(...result.messages.map((m) => m.message));
        }
      } catch (err: any) {
        console.error("[ResumeParser] DOCX parsing error:", err);
        warnings.push("Failed to parse DOCX file contents.");
      }
    } else {
      // Default to UTF-8 plain text
      text = buffer.toString("utf-8");
    }

    return { text: text.trim(), isScanned, warnings };
  }

  /**
   * Parse extracted raw text into all 14 structured resume sections
   */
  static parseTextToResume(
    rawText: string,
    defaultName = "Extracted Resume"
  ): {
    profileData: IResumeProfileData;
    confidence: "high" | "medium" | "low";
    confidenceMessage?: string;
  } {
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    // 1. Extract contact information
    const emailMatch = rawText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const linkedinMatch = rawText.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
    const githubMatch = rawText.match(/https?:\/\/(?:www\.)?github\.com\/[\w-]+/i);
    const portfolioMatch = rawText.match(
      /https?:\/\/(?!www\.linkedin\.com|www\.github\.com)[\w.-]+\.[a-z]{2,}(?:\/[\w.-]*)*\/?/i
    );

    // Full name detection
    let detectedName = "";
    for (let i = 0; i < Math.min(lines.length, 4); i++) {
      const line = lines[i];
      if (
        !line.includes("@") &&
        !line.match(/\d{3}/) &&
        !line.toLowerCase().includes("resume") &&
        !line.toLowerCase().includes("curriculum") &&
        line.length < 50
      ) {
        detectedName = line;
        break;
      }
    }

    const locationMatch = rawText.match(/([A-Z][a-zA-Z\s]+,\s*(?:[A-Z]{2}|[A-Z][a-zA-Z]+))/);

    const personal = {
      fullName: detectedName || defaultPersonal.fullName,
      professionalTitle: "",
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      location: locationMatch ? locationMatch[0] : "",
      linkedin: linkedinMatch ? linkedinMatch[0] : "",
      github: githubMatch ? githubMatch[0] : "",
      portfolio: portfolioMatch ? portfolioMatch[0] : "",
      website: "",
      provenance: { sourceType: "RESUME", status: "PARSED", extractedAt: new Date() }
    };

    // 2. Identify sections by headers
    const sectionHeaders = [
      { key: "summary", regex: /^(?:summary|professional summary|profile|about me|executive summary)\s*(?::)?\s*$/i },
      { key: "experience", regex: /^(?:experience|work experience|employment history|professional experience)\s*(?::)?\s*$/i },
      { key: "education", regex: /^(?:education|academic background|qualifications|training)\s*(?::)?\s*$/i },
      { key: "projects", regex: /^(?:projects|personal projects|key projects|academic projects)\s*(?::)?\s*$/i },
      { key: "skills", regex: /^(?:skills|technical skills|technologies|core competencies|proficiencies)\s*(?::)?\s*$/i },
      { key: "certifications", regex: /^(?:certifications|licenses & certifications|certificates)\s*(?::)?\s*$/i },
      { key: "achievements", regex: /^(?:achievements|awards & achievements|honors & awards|awards)\s*(?::)?\s*$/i },
      { key: "internships", regex: /^(?:internships|internship experience)\s*(?::)?\s*$/i },
      { key: "publications", regex: /^(?:publications|research papers)\s*(?::)?\s*$/i },
      { key: "volunteer", regex: /^(?:volunteer|community service|volunteering)\s*(?::)?\s*$/i },
      { key: "languages", regex: /^(?:languages|language proficiencies)\s*(?::)?\s*$/i },
      { key: "interests", regex: /^(?:interests|hobbies|activities)\s*(?::)?\s*$/i }
    ];

    const sectionChunks: Record<string, string[]> = {
      summary: [],
      experience: [],
      education: [],
      projects: [],
      skills: [],
      certifications: [],
      achievements: [],
      internships: [],
      publications: [],
      volunteer: [],
      languages: [],
      interests: []
    };

    let currentSection: string | null = null;

    for (const line of lines) {
      const matchedHeader = sectionHeaders.find((h) => h.regex.test(line));
      if (matchedHeader) {
        currentSection = matchedHeader.key;
        continue;
      }
      if (currentSection && sectionChunks[currentSection]) {
        sectionChunks[currentSection].push(line);
      }
    }

    // Parse Professional Summary
    const summary = (sectionChunks.summary || []).join(" ").slice(0, 1000);

    // Parse Experience
    const experience: any[] = [];
    const expLines = sectionChunks.experience || [];
    let curExp: any = null;

    for (const line of expLines) {
      const dateMatch = line.match(/(?:19|20)\d{2}\s*(?:-|–|to)\s*(?:(?:19|20)\d{2}|present)/i);
      const isBullet = /^[-•*·]\s*/.test(line);

      if (dateMatch && !isBullet) {
        if (curExp) experience.push(curExp);
        const parts = line.split(/[|,\-–]/).map((p) => p.trim());
        curExp = {
          id: String(experience.length + 1),
          company: parts[0] || "Company",
          role: parts[1] || "Role",
          location: "",
          startDate: dateMatch[0].split(/(?:-|–|to)/)[0].trim(),
          endDate: dateMatch[0].split(/(?:-|–|to)/)[1]?.trim() || "Present",
          current: /present/i.test(line),
          description: "",
          bullets: [],
          provenance: { sourceType: "RESUME", status: "PARSED", extractedAt: new Date() }
        };
      } else if (curExp) {
        if (isBullet) {
          curExp.bullets.push(line.replace(/^[-•*·]\s*/, ""));
        } else if (line.length > 5) {
          curExp.bullets.push(line);
        }
      }
    }
    if (curExp) experience.push(curExp);

    // Parse Education
    const education: any[] = [];
    const eduLines = sectionChunks.education || [];
    let curEdu: any = null;

    for (const line of eduLines) {
      const yearMatch = line.match(/(?:19|20)\d{2}/);
      if (yearMatch) {
        if (curEdu) education.push(curEdu);
        curEdu = {
          id: String(education.length + 1),
          institution: line.split(/[,|\-]/)[0]?.trim() || "University",
          degree: line.split(/[,|\-]/)[1]?.trim() || "Degree",
          field: "",
          startDate: "",
          endDate: yearMatch[0],
          provenance: { sourceType: "RESUME", status: "PARSED", extractedAt: new Date() }
        };
      }
    }
    if (curEdu) education.push(curEdu);

    const skillsText = (sectionChunks.skills || []).join(" ").replace(/\s{2,}/g, " ");
    const parsedSkills = { ...defaultSkills };
    const skillTokens = skillsText
      .split(/[,|•·\n]/)
      .map((s) => s.trim().replace(/^.*:\s*/, "")) // Also strip categories like "Languages:"
      .filter((s) => s.length > 1 && s.length < 50);

    const knownLangs = ["javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "php", "ruby", "sql", "html", "css"];
    const knownFrameworks = ["react", "node.js", "next.js", "vue", "angular", "express", "fastify", "django", "spring", "flask"];
    const knownDbs = ["mongodb", "postgresql", "mysql", "redis", "sqlite", "dynamodb", "elasticsearch"];
    const knownCloud = ["aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "linux"];

    const structuredSkills: any[] = [];
    for (const token of skillTokens) {
      const lower = token.toLowerCase();
      let category = "technical";
      if (knownLangs.some((l) => lower.includes(l))) { parsedSkills.languages.push(token); category = "language"; }
      else if (knownFrameworks.some((f) => lower.includes(f))) { parsedSkills.frameworks.push(token); category = "framework"; }
      else if (knownDbs.some((d) => lower.includes(d))) { parsedSkills.databases.push(token); category = "database"; }
      else if (knownCloud.some((c) => lower.includes(c))) { parsedSkills.cloud.push(token); category = "cloud"; }
      else { parsedSkills.technical.push(token); }
      
      structuredSkills.push({
        id: String(structuredSkills.length + 1),
        raw: token,
        normalized: token, // basic normalization fallback
        category,
        provenance: { sourceType: "RESUME", status: "PARSED", extractedAt: new Date() }
      });
    }
    parsedSkills.structured = structuredSkills;

    // Parse Projects
    const projects: any[] = [];
    const projLines = sectionChunks.projects || [];
    let curProj: any = null;

    for (const line of projLines) {
      const isBullet = /^[-•*·]\s*/.test(line);
      const isTitle = !isBullet && line.length > 3 && (line.length < 60 || line.includes("|") || line.includes(" – ") || line.includes(" - ")) && !line.toLowerCase().startsWith("tech") && !line.toLowerCase().startsWith("implemented") && !line.toLowerCase().startsWith("designed") && !line.toLowerCase().startsWith("developed") && !line.toLowerCase().startsWith("built") && !line.toLowerCase().startsWith("automated") && !line.toLowerCase().startsWith("configured") && !line.toLowerCase().startsWith("deployed") && !line.toLowerCase().startsWith("improved") && !line.toLowerCase().startsWith("leveraged") && !line.toLowerCase().startsWith("added") && !line.toLowerCase().startsWith("created") && !line.toLowerCase().startsWith("set up");
      
      if (isTitle) {
        if (curProj) projects.push(curProj);
        curProj = {
          id: String(projects.length + 1),
          name: line.replace(/[:\-].*$/, "").trim(),
          description: line,
          technologies: [],
          bullets: [],
          provenance: { sourceType: "RESUME", status: "PARSED", extractedAt: new Date() }
        };
      } else if (curProj) {
        curProj.bullets.push(line.replace(/^[-•*·]\s*/, ""));
      }
    }
    if (curProj) projects.push(curProj);

    // Parse Languages
    const languages: any[] = [];
    const langLines = sectionChunks.languages || [];
    for (const l of langLines) {
      const parts = l.split(/[:\-(]/).map((p) => p.replace(/[)]/g, "").trim());
      if (parts[0] && parts[0].length < 25) {
        languages.push({
          id: String(languages.length + 1),
          language: parts[0],
          proficiency: "Professional"
        });
      }
    }

    // Confidence determination
    let confidence: "high" | "medium" | "low" = "high";
    let confidenceMessage = "Information extracted with high confidence.";

    if (!personal.email || experience.length === 0) {
      confidence = "low";
      confidenceMessage = "Please verify this information. Critical contact or experience fields could not be cleanly detected.";
    } else if (allSkillsCount(parsedSkills) < 4 || !personal.phone) {
      confidence = "medium";
      confidenceMessage = "Some fields were incomplete. Please review extracted sections.";
    }

    const profileData: IResumeProfileData = {
      personal,
      summary,
      summaryProvenance: { sourceType: "RESUME", status: "PARSED", extractedAt: new Date() },
      experience,
      education,
      projects,
      skills: parsedSkills,
      certifications: [],
      achievements: [],
      internships: [],
      publications: [],
      volunteer: [],
      languages,
      interests: [],
      customSections: []
    };

    return { profileData, confidence, confidenceMessage };
  }

  /**
   * Parse standard JSON Resume (jsonresume.org) or ApplyHustle JSON format
   */
  static parseJsonResume(jsonString: string): {
    profileData: IResumeProfileData;
    confidence: "high" | "medium" | "low";
    fieldConfidence: Record<string, "high" | "medium" | "low">;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new Error("Invalid JSON format in resume file.");
    }

    // Check if it is already an ApplyHustle profileData structure
    if (parsed.personal && (parsed.experience || parsed.skills || parsed.education)) {
      return {
        profileData: {
          personal: { ...defaultPersonal, ...(parsed.personal || {}) },
          summary: parsed.summary || "",
          experience: parsed.experience || [],
          education: parsed.education || [],
          projects: parsed.projects || [],
          skills: { ...defaultSkills, ...(parsed.skills || {}) },
          certifications: parsed.certifications || [],
          achievements: parsed.achievements || [],
          internships: parsed.internships || [],
          publications: parsed.publications || [],
          volunteer: parsed.volunteer || [],
          languages: parsed.languages || [],
          interests: parsed.interests || [],
          customSections: parsed.customSections || []
        },
        confidence: "high",
        fieldConfidence: {
          name: parsed.personal?.fullName ? "high" : "low",
          email: parsed.personal?.email ? "high" : "low",
          phone: parsed.personal?.phone ? "high" : "medium",
          location: parsed.personal?.location ? "high" : "medium",
          summary: parsed.summary ? "high" : "medium",
          experience: parsed.experience?.length ? "high" : "low",
          education: parsed.education?.length ? "high" : "medium",
          skills: "high",
          projects: parsed.projects?.length ? "high" : "medium"
        },
        warnings: []
      };
    }

    // Otherwise, parse standard JSON Resume (jsonresume.org schema)
    const b = parsed.basics || {};
    let locationStr = "";
    if (typeof b.location === "string") {
      locationStr = b.location;
    } else if (b.location && typeof b.location === "object") {
      locationStr = [b.location.city, b.location.region || b.location.countryCode].filter(Boolean).join(", ");
    }

    let linkedin = "";
    let github = "";
    let portfolio = b.url || "";
    for (const prof of b.profiles || []) {
      const net = (prof.network || "").toLowerCase();
      if (net.includes("linkedin")) linkedin = prof.url || linkedin;
      else if (net.includes("github")) github = prof.url || github;
      else if (!portfolio) portfolio = prof.url || "";
    }

    const personal = {
      fullName: b.name || "",
      professionalTitle: b.label || "",
      email: b.email || "",
      phone: b.phone || "",
      location: locationStr,
      linkedin,
      github,
      portfolio,
      website: b.url || ""
    };

    const experience = (parsed.work || []).map((w: any, idx: number) => ({
      id: String(idx + 1),
      company: w.name || w.company || "Company",
      role: w.position || "Role",
      location: w.location || "",
      startDate: w.startDate || "",
      endDate: w.endDate || "Present",
      current: !w.endDate || /present/i.test(w.endDate),
      description: w.summary || "",
      bullets: Array.isArray(w.highlights) ? w.highlights : w.summary ? [w.summary] : [],
      provenance: { sourceType: "IMPORT", status: "PARSED", extractedAt: new Date() }
    }));

    const education = (parsed.education || []).map((e: any, idx: number) => ({
      id: String(idx + 1),
      institution: e.institution || "University",
      degree: e.studyType || "Degree",
      field: e.area || "",
      startDate: e.startDate || "",
      endDate: e.endDate || "",
      gpa: e.score || "",
      provenance: { sourceType: "IMPORT", status: "PARSED", extractedAt: new Date() }
    }));

    const projects = (parsed.projects || []).map((p: any, idx: number) => ({
      id: String(idx + 1),
      name: p.name || "Project",
      description: p.description || "",
      technologies: Array.isArray(p.keywords) ? p.keywords : [],
      url: p.url || "",
      bullets: Array.isArray(p.highlights) ? p.highlights : [],
      provenance: { sourceType: "IMPORT", status: "PARSED", extractedAt: new Date() }
    }));

    const skills = { ...defaultSkills };
    for (const sk of parsed.skills || []) {
      if (typeof sk === "string") {
        skills.technical.push(sk);
      } else if (sk && typeof sk === "object") {
        if (Array.isArray(sk.keywords)) {
          skills.technical.push(...sk.keywords);
        }
        if (sk.name) skills.technical.push(sk.name);
      }
    }
    skills.technical = Array.from(new Set(skills.technical));

    const certifications = (parsed.certificates || parsed.certifications || []).map((c: any, idx: number) => ({
      id: String(idx + 1),
      name: c.name || "Certification",
      issuer: c.issuer || "",
      date: c.date || "",
      url: c.url || ""
    }));

    const languages = (parsed.languages || []).map((l: any, idx: number) => ({
      id: String(idx + 1),
      language: l.language || "Language",
      proficiency: (l.fluency || "Professional") as any
    }));

    const fieldConfidence: Record<string, "high" | "medium" | "low"> = {
      name: personal.fullName ? "high" : "low",
      email: personal.email ? "high" : "low",
      phone: personal.phone ? "high" : "medium",
      location: personal.location ? "high" : "medium",
      summary: (b.summary || "").length > 30 ? "high" : "medium",
      experience: experience.length > 0 ? "high" : "low",
      education: education.length > 0 ? "high" : "medium",
      skills: skills.technical.length > 0 ? "high" : "medium",
      projects: projects.length > 0 ? "high" : "medium"
    };

    const profileData: IResumeProfileData = {
      personal: { ...personal, provenance: { sourceType: "IMPORT", status: "PARSED", extractedAt: new Date() } },
      summary: b.summary || "",
      summaryProvenance: { sourceType: "IMPORT", status: "PARSED", extractedAt: new Date() },
      experience,
      education,
      projects,
      skills,
      certifications,
      achievements: [],
      internships: [],
      publications: [],
      volunteer: [],
      languages,
      interests: (parsed.interests || []).map((it: any) => typeof it === "string" ? it : it.name).filter(Boolean),
      customSections: []
    };

    return {
      profileData,
      confidence: "high",
      fieldConfidence,
      warnings
    };
  }

  /**
   * Parse uploaded file buffer (PDF, DOCX, TXT, JSON) with field-level confidence
   */
  static async parseResumeBuffer(
    buffer: Buffer,
    filename: string,
    fileMime?: string
  ): Promise<{
    rawText: string;
    profileData: IResumeProfileData;
    fieldConfidence: Record<string, "high" | "medium" | "low">;
    overallConfidence: "high" | "medium" | "low";
    warnings: string[];
    isScanned: boolean;
  }> {
    const isJson = filename.toLowerCase().endsWith(".json") || (fileMime && fileMime.includes("json"));

    if (isJson) {
      const rawText = buffer.toString("utf-8");
      const { profileData, confidence, fieldConfidence, warnings } = this.parseJsonResume(rawText);
      return {
        rawText,
        profileData,
        fieldConfidence,
        overallConfidence: confidence,
        warnings,
        isScanned: false
      };
    }

    const { text, isScanned, warnings } = await this.extractRawText(buffer, fileMime || filename);
    const { profileData, confidence } = this.parseTextToResume(text, filename);

    const fieldConfidence: Record<string, "high" | "medium" | "low"> = {
      name: profileData.personal.fullName && profileData.personal.fullName !== defaultPersonal.fullName ? "high" : "low",
      email: profileData.personal.email ? "high" : "low",
      phone: profileData.personal.phone ? "high" : "medium",
      location: profileData.personal.location ? "high" : "medium",
      summary: profileData.summary && profileData.summary.length > 30 ? "high" : "medium",
      experience: profileData.experience.length >= 1 ? (profileData.experience.every((e) => e.company && e.role) ? "high" : "medium") : "low",
      education: profileData.education.length >= 1 ? "high" : "medium",
      skills: allSkillsCount(profileData.skills) >= 4 ? "high" : "medium",
      projects: profileData.projects.length >= 1 ? "high" : "medium"
    };

    if (fieldConfidence.name === "low") {
      warnings.push("Could not reliably detect candidate name. Please verify in review.");
    }
    if (fieldConfidence.email === "low") {
      warnings.push("No email address found in the document.");
    }
    if (fieldConfidence.experience === "low") {
      warnings.push("Work experience could not be cleanly detected. Please review work history.");
    }
    if (isScanned) {
      warnings.push("Document appears to be scanned or image-based. Extracted text may be incomplete.");
    }

    return {
      rawText: text,
      profileData,
      fieldConfidence,
      overallConfidence: confidence,
      warnings,
      isScanned
    };
  }
}

function allSkillsCount(skills: any): number {
  return (
    (skills.technical?.length || 0) +
    (skills.languages?.length || 0) +
    (skills.frameworks?.length || 0) +
    (skills.databases?.length || 0) +
    (skills.cloud?.length || 0)
  );
}
