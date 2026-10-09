import { LinkedInProfileData, DataProvenance, LinkedInExperienceItem, LinkedInEducationItem } from "../domain/provider.interface";
import { ContentHasher } from "./content.hasher";

export class ProfileNormalizer {
  /**
   * Sanitizes external untrusted text to prevent prompt injection and XSS
   */
  static sanitizeText(text: string): string {
    if (!text || typeof text !== "string") return "";
    return text
      .replace(/<[^>]*>/g, " ") // Strip HTML tags
      .replace(/\u0000/g, "") // Strip null bytes
      // Neutralize prompt injection delimiters
      .replace(/(?:system\s+instruction|system\s+prompt|ignore\s+all\s+previous\s+instructions)/gi, "[REDACTED]")
      .replace(/\r\n/g, "\n")
      .trim();
  }

  /**
   * Normalizes raw scraped or parsed fields into LinkedInProfileData
   */
  static normalize(raw: {
    canonicalUrl: string;
    fullName?: string;
    headline?: string;
    location?: string;
    about?: string;
    photoUrl?: string;
    bannerUrl?: string;
    experience?: any[];
    education?: any[];
    skills?: any[];
    certifications?: any[];
    projects?: any[];
    rawText?: string;
    source: DataProvenance["source"];
    sourceProvider: string;
    providerVersion: string;
  }): LinkedInProfileData {
    const rawText = this.sanitizeText(raw.rawText || "");
    const contentHash = ContentHasher.hash(rawText || raw.canonicalUrl);

    // Normalize experience without fabricating metrics
    const experience: LinkedInExperienceItem[] = (raw.experience || []).map((e) => ({
      company: this.sanitizeText(e.company || "Company"),
      role: this.sanitizeText(e.role || "Role"),
      duration: this.sanitizeText(e.duration || ""),
      startDate: e.startDate ? this.sanitizeText(e.startDate) : undefined,
      endDate: e.endDate ? this.sanitizeText(e.endDate) : undefined,
      isCurrent: Boolean(e.isCurrent),
      location: e.location ? this.sanitizeText(e.location) : undefined,
      description: this.sanitizeText(e.description || ""),
      bullets: Array.isArray(e.bullets)
        ? e.bullets.map((b: string) => this.sanitizeText(b)).filter(Boolean)
        : [],
      skills: Array.isArray(e.skills)
        ? e.skills.map((s: string) => this.sanitizeText(s)).filter(Boolean)
        : [],
    }));

    // Normalize education
    const education: LinkedInEducationItem[] = (raw.education || []).map((ed) => ({
      institution: this.sanitizeText(ed.institution || ed.school || "Institution"),
      degree: ed.degree ? this.sanitizeText(ed.degree) : undefined,
      fieldOfStudy: ed.fieldOfStudy || ed.field ? this.sanitizeText(ed.fieldOfStudy || ed.field) : undefined,
      startDate: ed.startDate ? this.sanitizeText(ed.startDate) : undefined,
      endDate: ed.endDate ? this.sanitizeText(ed.endDate) : undefined,
    }));

    // Normalize skills without synthetic additions
    const skillsSet = new Set<string>();
    for (const s of raw.skills || []) {
      const clean = typeof s === "string" ? this.sanitizeText(s) : this.sanitizeText(s.name || "");
      if (clean && clean.length > 1 && clean.length < 50) {
        skillsSet.add(clean);
      }
    }

    return {
      canonicalUrl: raw.canonicalUrl,
      fullName: this.sanitizeText(raw.fullName || "LinkedIn Member"),
      headline: this.sanitizeText(raw.headline || ""),
      location: this.sanitizeText(raw.location || ""),
      about: this.sanitizeText(raw.about || ""),
      photoUrl: raw.photoUrl ? raw.photoUrl.trim() : undefined,
      bannerUrl: raw.bannerUrl ? raw.bannerUrl.trim() : undefined,
      experience,
      education,
      skills: Array.from(skillsSet),
      certifications: (raw.certifications || []).map((c) => ({
        name: this.sanitizeText(c.name || ""),
        issuer: this.sanitizeText(c.issuer || ""),
      })),
      projects: (raw.projects || []).map((p) => ({
        title: this.sanitizeText(p.title || p.name || ""),
        description: this.sanitizeText(p.description || ""),
      })),
      rawText,
      provenance: {
        source: raw.source,
        sourceUrl: raw.canonicalUrl,
        sourceProvider: raw.sourceProvider,
        retrievedAt: new Date(),
        contentHash,
        providerVersion: raw.providerVersion,
        isUntrustedExternalContent: true,
      },
    };
  }
}
