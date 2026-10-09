import {
  ILinkedInDataProvider,
  ProviderCapabilities,
  ProviderResult,
  LinkedInProfileData,
  ProviderHealthStatus,
} from "../../core/provider.interface";
import { ProfileNormalizer } from "../../normalization/profile.normalizer";
import { ContentHasher } from "../../deduplication/content.hasher";

export class ManualInputProvider implements ILinkedInDataProvider {
  readonly name = "manual_input";
  readonly version = "2.0.0";
  readonly capabilities: ProviderCapabilities = {
    supportsProfile: true,
    supportsPosts: true,
    supportsJobs: false,
    supportsCompanies: false,
    supportsEngagement: false,
    supportsSearch: false,
  };

  /**
   * Parses free-form pasted LinkedIn profile text
   */
  async parsePastedProfile(
    rawText: string,
    targetUrl: string = "https://www.linkedin.com/in/me/"
  ): Promise<ProviderResult<LinkedInProfileData>> {
    const startTime = Date.now();
    const cleanText = ProfileNormalizer.sanitizeText(rawText);

    if (!cleanText || cleanText.length < 10) {
      return {
        success: false,
        error: {
          code: "EMPTY_DATA",
          message: "Pasted text is too short to extract profile information. Please provide at least your headline or experience.",
          recoverable: false,
        },
        latencyMs: Date.now() - startTime,
        provenance: {
          source: "manual_input",
          sourceUrl: targetUrl,
          sourceProvider: this.name,
          retrievedAt: new Date(),
          contentHash: ContentHasher.hash(cleanText),
          providerVersion: this.version,
          isUntrustedExternalContent: true,
        },
      };
    }

    const lines = cleanText.split("\n").map((l) => l.trim()).filter(Boolean);

    let fullName = "";
    let headline = "";
    let about = "";
    const experience: any[] = [];
    const education: any[] = [];
    const skills: string[] = [];

    let currentSection: "header" | "about" | "experience" | "education" | "skills" = "header";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();

      // Detect section headers
      if (lower.startsWith("about") || lower.startsWith("summary")) {
        currentSection = "about";
        continue;
      } else if (lower.startsWith("experience") || lower.startsWith("work history")) {
        currentSection = "experience";
        continue;
      } else if (lower.startsWith("education")) {
        currentSection = "education";
        continue;
      } else if (lower.startsWith("skills") || lower.startsWith("top skills") || lower.startsWith("technologies")) {
        currentSection = "skills";
        continue;
      }

      // Process lines based on section
      if (currentSection === "header") {
        if (!fullName && line.length < 50 && !line.includes("|") && !line.includes("@")) {
          fullName = line;
        } else if (!headline && (line.length < 150 || line.includes("|") || line.includes("-"))) {
          headline = line;
        }
      } else if (currentSection === "about") {
        about += (about ? "\n" : "") + line;
      } else if (currentSection === "experience") {
        if (line.includes(" at ") || line.includes(" - ") || line.includes(" @ ")) {
          const parts = line.split(/ at | @ | - /);
          experience.push({
            role: parts[0]?.trim() || "Role",
            company: parts[1]?.trim() || "Company",
            duration: "Past role",
            description: "",
            bullets: [],
          });
        } else if (experience.length > 0) {
          const last = experience[experience.length - 1];
          if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
            last.bullets.push(line.replace(/^[•\-*]\s*/, ""));
          } else {
            last.description += (last.description ? " " : "") + line;
          }
        }
      } else if (currentSection === "education") {
        if (line.length > 3) {
          education.push({
            institution: line,
            degree: "Degree",
          });
        }
      } else if (currentSection === "skills") {
        // Split by comma or bullet
        const splitSkills = line.split(/[,•|*]/).map((s) => s.trim()).filter((s) => s.length > 1);
        skills.push(...splitSkills);
      }
    }

    const profile = ProfileNormalizer.normalize({
      canonicalUrl: targetUrl,
      fullName: fullName || "LinkedIn Member",
      headline: headline || "Professional",
      about,
      experience,
      education,
      skills,
      rawText: cleanText,
      source: "manual_input",
      sourceProvider: this.name,
      providerVersion: this.version,
    });

    return {
      success: true,
      data: profile,
      latencyMs: Date.now() - startTime,
      provenance: profile.provenance,
    };
  }

  async fetchProfile(url: string): Promise<ProviderResult<LinkedInProfileData>> {
    // For manual provider, fetching by URL expects previously stored pasted data
    return this.parsePastedProfile("", url);
  }

  async checkHealth(): Promise<ProviderHealthStatus> {
    return {
      providerName: this.name,
      isHealthy: true,
      lastChecked: new Date(),
      latencyMs: 1,
      successRate24h: 1.0,
      activeCircuitBreaker: false,
      capabilities: this.capabilities,
      statusMessage: "Manual input provider always available.",
    };
  }
}
