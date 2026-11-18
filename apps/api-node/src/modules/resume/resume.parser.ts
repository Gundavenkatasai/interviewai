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
      { key: "skills", regex: /^(?:skills|technical skills|technologies|core competencies|proficiencies)\s*(?::)?\s*$/i },
      { key: "projects", regex: /^(?:projects|personal projects|key projects|academic projects|technical projects)\s*(?::)?\s*$/i },
      { key: "experience", regex: /^(?:experience|work experience|employment history|professional experience)\s*(?::)?\s*$/i },
      { key: "internships", regex: /^(?:internships|internship experience)\s*(?::)?\s*$/i },
      { key: "training", regex: /^(?:training|trainings|vocational training|coursework|relevant coursework)\s*(?::)?\s*$/i },
      { key: "certifications", regex: /^(?:certifications|licenses & certifications|certificates)\s*(?::)?\s*$/i },
      { key: "achievements", regex: /^(?:achievements|awards & achievements|honors & awards|awards|accomplishments)\s*(?::)?\s*$/i },
      { key: "education", regex: /^(?:education|academic background|qualifications|academic history)\s*(?::)?\s*$/i },
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
      training: [],
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
          if (curExp.bullets.length > 0) {
            curExp.bullets[curExp.bullets.length - 1] += " " + line.trim();
          } else {
            curExp.bullets.push(line.trim());
          }
        }
      }
    }
    if (curExp) experience.push(curExp);

    // Parse Education (Enhanced for 2-line institution + degree/gpa/dates formats)
    const education: any[] = [];
    const eduLines = sectionChunks.education || [];

    for (let i = 0; i < eduLines.length; i++) {
      const l1 = eduLines[i];
      const l2 = eduLines[i + 1] || "";

      const combined = `${l1} ${l2}`;
      const dateMatch = combined.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z’']*\s*\d{2,4}\s*(?:[-–—]|\s+to\s+)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z’']*\s*\d{2,4}|present)|\b(?:19|20)\d{2}\s*(?:[-–—]|\s+to\s+)\s*(?:(?:19|20)\d{2}|present)\b)/i);
      const scoreMatch = combined.match(/(?:CGPA|GPA|Percentage):\s*[\d.]+/i);

      if (l2 && (dateMatch || scoreMatch || /bachelor|master|b\.tech|intermediate|ssc|high school|diploma/i.test(l2))) {
        const dateStr = dateMatch ? dateMatch[0] : "";
        let degreeLine = l2.replace(dateStr, "").trim();
        const scoreStr = scoreMatch ? scoreMatch[0] : "";
        if (scoreStr) degreeLine = degreeLine.replace(scoreStr, "").replace(/\|\s*$/, "").trim();

        const pipeParts = degreeLine.split("|").map((s) => s.trim()).filter(Boolean);

        education.push({
          id: String(education.length + 1),
          institution: l1.trim(),
          degree: pipeParts[0] || "Degree",
          field: pipeParts.length > 1 ? pipeParts[1] : "",
          startDate: dateStr.split(/(?:[-–—]|\s+to\s+)/i)[0]?.trim() || "",
          endDate: dateStr.split(/(?:[-–—]|\s+to\s+)/i)[1]?.trim() || "",
          gpa: scoreStr,
          provenance: { sourceType: "RESUME", status: "PARSED", extractedAt: new Date() }
        });
        i++; // skip next line as it was part of this entry
      } else if (dateMatch || /bachelor|master|b\.tech|intermediate|ssc|school|university/i.test(l1)) {
        education.push({
          id: String(education.length + 1),
          institution: l1.split(/[,|\-]/)[0]?.trim() || "University",
          degree: l1.split(/[,|\-]/)[1]?.trim() || "Degree",
          field: "",
          startDate: "",
          endDate: dateMatch ? dateMatch[0] : "",
          gpa: scoreMatch ? scoreMatch[0] : "",
          provenance: { sourceType: "RESUME", status: "PARSED", extractedAt: new Date() }
        });
      }
    }

    // Parse Categorized Skills
    const parsedSkills = { ...defaultSkills };
    const structuredSkills: any[] = [];
    const skillLines = sectionChunks.skills || [];

    skillLines.forEach((line) => {
      const cleaned = line.replace(/^[-•*·]\s*/, "");
      const colIdx = cleaned.indexOf(":");
      if (colIdx !== -1) {
        const categoryName = cleaned.slice(0, colIdx).trim().toLowerCase();
        const tokens = cleaned.slice(colIdx + 1).split(/[,|•·]/).map((s) => s.trim()).filter(Boolean);

        tokens.forEach((token) => {
          if (categoryName.includes("lang")) parsedSkills.languages.push(token);
          else if (categoryName.includes("web") || categoryName.includes("framework")) parsedSkills.frameworks.push(token);
          else if (categoryName.includes("data") || categoryName.includes("db")) parsedSkills.databases.push(token);
          else if (categoryName.includes("tool") || categoryName.includes("platform")) parsedSkills.tools.push(token);
          else if (categoryName.includes("soft")) parsedSkills.soft.push(token);
          else parsedSkills.technical.push(token);

          structuredSkills.push({
            id: String(structuredSkills.length + 1),
            raw: token,
            normalized: token,
            category: categoryName,
            provenance: { sourceType: "RESUME", status: "PARSED", extractedAt: new Date() }
          });
        });
      } else {
        const tokens = cleaned.split(/[,|•·]/).map((s) => s.trim()).filter(Boolean);
        tokens.forEach((token) => {
          parsedSkills.technical.push(token);
          structuredSkills.push({
            id: String(structuredSkills.length + 1),
            raw: token,
            normalized: token,
            category: "technical",
            provenance: { sourceType: "RESUME", status: "PARSED", extractedAt: new Date() }
          });
        });
      }
    });

    // Deduplicate lists
    parsedSkills.languages = Array.from(new Set(parsedSkills.languages));
    parsedSkills.frameworks = Array.from(new Set(parsedSkills.frameworks));
    parsedSkills.databases = Array.from(new Set(parsedSkills.databases));
    parsedSkills.tools = Array.from(new Set(parsedSkills.tools));
    parsedSkills.soft = Array.from(new Set(parsedSkills.soft));
    parsedSkills.technical = Array.from(new Set(parsedSkills.technical));
    parsedSkills.structured = structuredSkills;

    // Parse Projects (Advanced: Avoids Line-Wrap Splitting & Captures Tech Stacks & Links)
    const projects: any[] = [];
    const projLines = sectionChunks.projects || [];
    let curProj: any = null;

    for (const line of projLines) {
      const isBullet = /^[-•*·]\s*/.test(line);
      const isTechLine = /^tech(?:nologies)?:\s*/i.test(line);

      // Date regex for project header
      const dateMatch = line.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z’']*\s*\d{2,4}\s*(?:[-–—]|\s+to\s+)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z’']*\s*\d{2,4}|present))/i);

      // Project Header Condition: Non-bullet, non-tech line with separator or date
      const isProjectHeader = !isBullet && !isTechLine && (
        Boolean(dateMatch) ||
        line.includes(" | ") ||
        line.includes(" – ") ||
        line.includes(" - ")
      ) && !/^(developed|built|implemented|created|engineered|configured|deployed|automated|improved|leveraged|designed)/i.test(line);

      if (isProjectHeader) {
        if (curProj) projects.push(curProj);

        let pName = line;
        let pDesc = "";
        const pDate = dateMatch ? dateMatch[0] : "";

        if (pDate) {
          pName = pName.replace(pDate, "").trim();
        }

        // Split on space-hyphen-space or pipe, preserving hyphens inside words (e.g. Smart-Audit AI)
        const dashParts = pName.split(/\s+[-–—]\s+/);
        if (dashParts.length > 1) {
          pName = dashParts[0].trim();
          pDesc = dashParts.slice(1).join(" - ").replace(/\|\s*(?:GitHub|Live|Link).*/i, "").trim();
        } else {
          const pipeParts = pName.split(/\s*\|\s*/);
          pName = pipeParts[0].trim();
          if (pipeParts.length > 1) {
            pDesc = pipeParts.slice(1).filter((p) => !/^(GitHub|Live|Link)/i.test(p)).join(" | ").trim();
          }
        }

        pName = pName.replace(/\|\s*$/, "").trim();

        curProj = {
          id: String(projects.length + 1),
          name: pName,
          role: "Developer",
          description: pDesc,
          technologies: [],
          bullets: [],
          url: line.includes("Live") ? "https://live-demo.com" : line.includes("GitHub") ? "https://github.com" : undefined,
          provenance: { sourceType: "RESUME", status: "PARSED", extractedAt: new Date() }
        };
      } else if (isTechLine && curProj) {
        const techStr = line.replace(/^tech(?:nologies)?:\s*/i, "");
        const techs = techStr.split(/[,|•·]/).map((t) => t.trim()).filter(Boolean);
        curProj.technologies = techs;
      } else if (isBullet && curProj) {
        curProj.bullets.push(line.replace(/^[-•*·]\s*/, "").trim());
      } else if (curProj && curProj.bullets.length > 0) {
        // Line-wrap continuation from previous bullet!
        curProj.bullets[curProj.bullets.length - 1] += " " + line.trim();
      }
    }
    if (curProj) projects.push(curProj);

    // Parse Certifications
    const certifications: any[] = [];
    (sectionChunks.certifications || []).forEach((line) => {
      const cleaned = line.replace(/^[-•*·]\s*/, "").trim();
      if (!cleaned) return;
      const dateMatch = cleaned.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z’']*\s*\d{2,4}/i);
      const dateStr = dateMatch ? dateMatch[0] : "";
      const namePart = cleaned.replace(dateStr, "").trim();
      const parts = namePart.split(/\s*[-–—]\s*/);
      let certName = parts[0];
      let issuer = parts[1] || "Accredited Issuer";
      if (parts.length > 2) {
        certName = parts.slice(0, parts.length - 1).join(" - ");
        issuer = parts[parts.length - 1];
      }
      certifications.push({
        id: String(certifications.length + 1),
        name: certName.trim(),
        issuer: issuer.trim(),
        date: dateStr,
        provenance: { sourceType: "RESUME", status: "PARSED", extractedAt: new Date() }
      });
    });

    // Parse Achievements
    const achievements: any[] = [];
    (sectionChunks.achievements || []).forEach((line) => {
      const cleaned = line.replace(/^[-•*·]\s*/, "").trim();
      if (cleaned.length > 5) {
        achievements.push({
          id: String(achievements.length + 1),
          title: cleaned.slice(0, 80),
          description: cleaned
        });
      }
    });

    // Parse Training & Custom Sections
    const customSections: any[] = [];
    if (sectionChunks.training && sectionChunks.training.length > 0) {
      const trainingItems: string[] = [];
      sectionChunks.training.forEach((line) => {
        const cleaned = line.replace(/^[-•*·]\s*/, "").trim();
        if (cleaned) trainingItems.push(cleaned);
      });
      if (trainingItems.length > 0) {
        customSections.push({
          id: "custom-training",
          name: "Vocational & Technical Training",
          content: trainingItems.join("\n"),
          bullets: trainingItems,
          items: trainingItems
        });
      }
    }

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

    if (!personal.email || (experience.length === 0 && projects.length === 0)) {
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
      certifications,
      achievements,
      internships: [],
      publications: [],
      volunteer: [],
      languages,
      interests: [],
      customSections
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
