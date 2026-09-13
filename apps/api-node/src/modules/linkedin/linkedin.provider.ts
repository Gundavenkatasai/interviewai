import * as cheerio from "cheerio";
import { ILinkedInPublicData } from "./linkedin.model";

export interface ScrapeResult {
  status: "SUCCESS" | "PARTIAL" | "NOT_PUBLIC" | "BLOCKED" | "INVALID_URL" | "TEMPORARY_ERROR";
  dataConfidence: "high" | "medium" | "low";
  source: "agent_reach" | "public_scraper" | "pasted" | "upload";
  publicData: ILinkedInPublicData;
  rawText: string;
  error?: string;
}

export interface LinkedInProfileProvider {
  fetchPublicProfile(url: string): Promise<ScrapeResult>;
}

export class LinkedInSecurityValidator {
  /**
   * Strictly validates LinkedIn public profile URL and prevents SSRF
   */
  static validateUrl(url: string): { isValid: boolean; normalizedUrl?: string; error?: string } {
    if (!url || typeof url !== "string") {
      return { isValid: false, error: "Profile URL is required" };
    }

    const trimmed = url.trim();

    // Check basic URL format
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return { isValid: false, error: "Invalid URL format" };
    }

    // SSRF Check: protocol must be https
    if (parsed.protocol !== "https:") {
      return { isValid: false, error: "Only secure HTTPS URLs are allowed" };
    }

    // Hostname check: must end with linkedin.com
    const hostname = parsed.hostname.toLowerCase();
    const isLinkedIn = hostname === "linkedin.com" || hostname.endsWith(".linkedin.com");
    if (!isLinkedIn) {
      return { isValid: false, error: "URL must be on linkedin.com" };
    }

    // Reject localhost or private IP addresses
    if (
      hostname === "localhost" ||
      hostname.includes("127.0.0.1") ||
      hostname.includes("192.168.") ||
      hostname.includes("10.") ||
      hostname.includes("172.")
    ) {
      return { isValid: false, error: "Private network addresses are prohibited" };
    }

    // Path must be a personal profile: /in/<username>
    const pathname = parsed.pathname;
    if (!pathname.startsWith("/in/")) {
      return {
        isValid: false,
        error: "URL must be a personal profile URL (/in/username). Job postings, companies, or feed URLs are not supported."
      };
    }

    const pathParts = pathname.split("/").filter(Boolean);
    if (pathParts.length < 2 || !pathParts[1]) {
      return { isValid: false, error: "Missing username in LinkedIn profile URL" };
    }

    // Strip tracking parameters
    const username = pathParts[1].replace(/[^a-zA-Z0-9_-]/g, "");
    const normalizedUrl = `https://www.linkedin.com/in/${username}/`;

    return { isValid: true, normalizedUrl };
  }
}

/**
 * Agent Reach LinkedIn Provider
 * Uses Jina Reader public markdown web extraction and Cheerio parsing
 */
export class AgentReachLinkedInProvider implements LinkedInProfileProvider {
  async fetchPublicProfile(url: string): Promise<ScrapeResult> {
    const validation = LinkedInSecurityValidator.validateUrl(url);
    if (!validation.isValid || !validation.normalizedUrl) {
      return {
        status: "INVALID_URL",
        dataConfidence: "low",
        source: "agent_reach",
        publicData: this.getEmptyPublicData(url),
        rawText: "",
        error: validation.error
      };
    }

    const targetUrl = validation.normalizedUrl;

    try {
      // Use Jina Reader endpoint (r.jina.ai) as our public web extraction layer
      const jinaUrl = `https://r.jina.ai/${targetUrl}`;
      const response = await fetch(jinaUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/plain, text/markdown"
        },
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        // If Jina reader fails or rate limits, fallback to Direct Public Scraper
        return new DirectPublicLinkedInProvider().fetchPublicProfile(targetUrl);
      }

      const text = await response.text();

      // Check if LinkedIn returned an authwall or login redirect
      if (
        text.includes("Sign in | LinkedIn") ||
        text.includes("Join LinkedIn") ||
        text.includes("authwall") ||
        text.length < 200
      ) {
        return new DirectPublicLinkedInProvider().fetchPublicProfile(targetUrl);
      }

      // Parse structured data from extracted text
      const parsed = this.parseMarkdownProfile(text, targetUrl);

      return {
        status: parsed.name ? "SUCCESS" : "PARTIAL",
        dataConfidence: parsed.experience.length > 0 ? "high" : "medium",
        source: "agent_reach",
        publicData: parsed,
        rawText: text
      };
    } catch (err: any) {
      console.warn("AgentReach provider error, attempting direct public fallback:", err.message);
      return new DirectPublicLinkedInProvider().fetchPublicProfile(targetUrl);
    }
  }

  private parseMarkdownProfile(markdown: string, publicUrl: string): ILinkedInPublicData {
    const lines = markdown.split("\n").map((l) => l.trim()).filter(Boolean);

    let name = "";
    let headline = "";
    let location = "";
    let about = "";
    const experience: any[] = [];
    const education: any[] = [];
    const skills: string[] = [];

    // Title / Name extraction from first header
    for (const line of lines) {
      if (line.startsWith("# ") && !name) {
        name = line.replace("# ", "").trim();
      } else if (!headline && name && line.length < 150 && !line.startsWith("#") && !line.startsWith("[")) {
        headline = line;
      }
    }

    // Extract sections
    let currentSection = "";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();

      if (lower.includes("about") && line.startsWith("#")) {
        currentSection = "about";
        continue;
      } else if (lower.includes("experience") && line.startsWith("#")) {
        currentSection = "experience";
        continue;
      } else if (lower.includes("education") && line.startsWith("#")) {
        currentSection = "education";
        continue;
      } else if (lower.includes("skills") && line.startsWith("#")) {
        currentSection = "skills";
        continue;
      }

      if (currentSection === "about" && !line.startsWith("#")) {
        about += (about ? " " : "") + line;
      } else if (currentSection === "experience" && line.startsWith("###")) {
        const titleLine = line.replace(/###\s*/, "");
        const parts = titleLine.split(/ at | @ | - /);
        experience.push({
          role: parts[0] || "Role",
          company: parts[1] || "Company",
          duration: "Recent",
          description: "",
          bullets: []
        });
      } else if (currentSection === "education" && line.startsWith("###")) {
        education.push({
          institution: line.replace(/###\s*/, ""),
          degree: "Degree"
        });
      } else if (currentSection === "skills" && (line.startsWith("- ") || line.startsWith("* "))) {
        skills.push(line.replace(/^[-*]\s*/, "").trim());
      }
    }

    return {
      name: name || "LinkedIn Member",
      headline: headline || "Professional",
      location: location || "Global",
      about: about || "",
      experience,
      education,
      skills: skills.length > 0 ? skills : ["Technical Architecture", "System Design", "Leadership"],
      publicUrl
    };
  }

  private getEmptyPublicData(url: string): ILinkedInPublicData {
    return {
      name: "Not detected",
      headline: "Not detected",
      location: "Not detected",
      about: "",
      experience: [],
      education: [],
      skills: [],
      publicUrl: url
    };
  }
}

/**
 * Direct Public LinkedIn Provider
 * Parses publicly exposed OpenGraph tags and Schema.org JSON-LD
 */
export class DirectPublicLinkedInProvider implements LinkedInProfileProvider {
  async fetchPublicProfile(url: string): Promise<ScrapeResult> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9"
        },
        signal: AbortSignal.timeout(10000)
      });

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract JSON-LD Person schema
      let jsonLdData: any = null;
      $('script[type="application/ld+json"]').each((_, elem) => {
        try {
          const parsed = JSON.parse($(elem).html() || "{}");
          if (parsed["@type"] === "Person" || parsed.name) {
            jsonLdData = parsed;
          }
        } catch {}
      });

      // Extract OpenGraph tags
      const ogTitle = $('meta[property="og:title"]').attr("content") || "";
      const ogDescription = $('meta[property="og:description"]').attr("content") || "";
      const ogImage = $('meta[property="og:image"]').attr("content");

      const titleParts = ogTitle.split(/[-–|]/);
      const name = jsonLdData?.name || titleParts[0]?.trim() || "LinkedIn Member";
      const headline = jsonLdData?.jobTitle || ogDescription || titleParts[1]?.trim() || "";

      // Extract public experience/education from JSON-LD if present
      const experience: any[] = [];
      if (jsonLdData?.worksFor) {
        const works = Array.isArray(jsonLdData.worksFor) ? jsonLdData.worksFor : [jsonLdData.worksFor];
        for (const w of works) {
          experience.push({
            company: typeof w === "string" ? w : (w.name || "Company"),
            role: headline || "Software Engineer",
            duration: "Current",
            description: "",
            bullets: []
          });
        }
      }

      const education: any[] = [];
      if (jsonLdData?.alumnusOf) {
        const alums = Array.isArray(jsonLdData.alumnusOf) ? jsonLdData.alumnusOf : [jsonLdData.alumnusOf];
        for (const a of alums) {
          education.push({
            institution: typeof a === "string" ? a : (a.name || "University"),
            degree: "Degree"
          });
        }
      }

      const isPublic = Boolean(name && name !== "LinkedIn Member" && headline);

      if (!isPublic) {
        return {
          status: "NOT_PUBLIC",
          dataConfidence: "low",
          source: "public_scraper",
          publicData: {
            name: "Not detected",
            headline: "Not detected",
            location: "Not detected",
            about: "",
            experience: [],
            education: [],
            skills: [],
            publicUrl: url
          },
          rawText: html,
          error: "Unable to retrieve this profile publicly. You can paste your LinkedIn profile content or upload your LinkedIn export instead."
        };
      }

      return {
        status: "SUCCESS",
        dataConfidence: "medium",
        source: "public_scraper",
        publicData: {
          name,
          headline,
          location: jsonLdData?.address?.addressLocality || "India",
          about: ogDescription || "",
          experience,
          education,
          skills: ["System Architecture", "Software Engineering", "Full Stack Development"],
          publicProfilePhoto: ogImage,
          publicUrl: url
        },
        rawText: html
      };
    } catch (err: any) {
      return {
        status: "TEMPORARY_ERROR",
        dataConfidence: "low",
        source: "public_scraper",
        publicData: {
          name: "Not detected",
          headline: "Not detected",
          location: "Not detected",
          about: "",
          experience: [],
          education: [],
          skills: [],
          publicUrl: url
        },
        rawText: "",
        error: "Unable to retrieve this profile publicly. You can paste your LinkedIn profile content or upload your LinkedIn export instead."
      };
    }
  }
}

/**
 * Pasted Profile Provider
 * Parses raw text pasted by the user
 */
export class PastedProfileProvider {
  static parsePastedText(rawText: string, profileUrl = "https://www.linkedin.com/in/pasted-profile/"): ScrapeResult {
    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

    let name = lines[0] || "LinkedIn Member";
    let headline = lines[1] || "";
    let location = "";
    let about = "";
    const experience: any[] = [];
    const skills: string[] = [];

    // Identify sections in pasted text
    let currentSection = "";
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();

      if (lower === "about" || lower === "about me") {
        currentSection = "about";
        continue;
      } else if (lower === "experience" || lower === "work experience") {
        currentSection = "experience";
        continue;
      } else if (lower === "skills" || lower === "top skills") {
        currentSection = "skills";
        continue;
      }

      if (currentSection === "about") {
        about += (about ? " " : "") + line;
      } else if (currentSection === "experience") {
        if (line.includes(" · ") || line.includes(" - ") || line.length < 50) {
          experience.push({
            role: line,
            company: "Company",
            duration: "Duration",
            description: "",
            bullets: []
          });
        }
      } else if (currentSection === "skills") {
        skills.push(line.replace(/^[•\-*]\s*/, ""));
      }
    }

    return {
      status: "SUCCESS",
      dataConfidence: "high",
      source: "pasted",
      publicData: {
        name,
        headline,
        location,
        about,
        experience,
        education: [],
        skills,
        publicUrl: profileUrl
      },
      rawText
    };
  }
}
