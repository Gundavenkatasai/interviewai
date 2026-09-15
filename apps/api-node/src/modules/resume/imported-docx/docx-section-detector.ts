import { DocxNodeTree, DocxParagraph, DocxTable } from "./docx-structure-extractor";
import { SectionType } from "./imported-docx.model";

// ============================================================
// DocxSectionDetector
// Takes the node tree produced by DocxStructureExtractor and
// classifies nodes into named resume sections.
// Uses deterministic signals first; falls back to heuristics.
// ============================================================

export interface DetectedSection {
  sectionType: SectionType;
  sectionTitle: string;       // Original heading text from document
  detectionConfidence: "HIGH" | "MEDIUM" | "LOW";
  order: number;              // Section order (0-based)
  documentPart: string;
  nodeIndices: number[];      // Indices into DocxNodeTree.nodes
}

// Known section keyword → canonical type (case-insensitive match)
const SECTION_KEYWORD_MAP: Record<string, SectionType> = {
  // Summary / Objective
  "summary": "SUMMARY",
  "professional summary": "SUMMARY",
  "career summary": "SUMMARY",
  "executive summary": "SUMMARY",
  "objective": "SUMMARY",
  "career objective": "SUMMARY",
  "profile": "SUMMARY",
  "professional profile": "SUMMARY",
  "about me": "SUMMARY",
  "about": "SUMMARY",
  "overview": "SUMMARY",
  "personal statement": "SUMMARY",

  // Experience
  "experience": "EXPERIENCE",
  "work experience": "EXPERIENCE",
  "professional experience": "EXPERIENCE",
  "employment history": "EXPERIENCE",
  "employment": "EXPERIENCE",
  "work history": "EXPERIENCE",
  "career history": "EXPERIENCE",
  "job history": "EXPERIENCE",
  "relevant experience": "EXPERIENCE",
  "selected experience": "EXPERIENCE",
  "industry experience": "EXPERIENCE",
  "consulting experience": "EXPERIENCE",
  "teaching experience": "EXPERIENCE",
  "research experience": "EXPERIENCE",

  // Education
  "education": "EDUCATION",
  "academic background": "EDUCATION",
  "educational background": "EDUCATION",
  "academic history": "EDUCATION",
  "qualifications": "EDUCATION",
  "academic qualifications": "EDUCATION",
  "degrees": "EDUCATION",

  // Skills
  "skills": "SKILLS",
  "technical skills": "SKILLS",
  "core competencies": "SKILLS",
  "competencies": "SKILLS",
  "key skills": "SKILLS",
  "areas of expertise": "SKILLS",
  "expertise": "SKILLS",
  "technologies": "SKILLS",
  "technical expertise": "SKILLS",
  "tools & technologies": "SKILLS",
  "tools and technologies": "SKILLS",
  "programming languages": "SKILLS",
  "software skills": "SKILLS",
  "it skills": "SKILLS",
  "hard skills": "SKILLS",
  "soft skills": "SKILLS",

  // Projects
  "projects": "PROJECTS",
  "key projects": "PROJECTS",
  "selected projects": "PROJECTS",
  "personal projects": "PROJECTS",
  "academic projects": "PROJECTS",
  "notable projects": "PROJECTS",
  "open source": "PROJECTS",
  "open source contributions": "PROJECTS",
  "portfolio": "PROJECTS",
  "side projects": "PROJECTS",

  // Certifications
  "certifications": "CERTIFICATIONS",
  "certificates": "CERTIFICATIONS",
  "professional certifications": "CERTIFICATIONS",
  "licenses": "CERTIFICATIONS",
  "licenses & certifications": "CERTIFICATIONS",
  "licenses and certifications": "CERTIFICATIONS",
  "accreditations": "CERTIFICATIONS",

  // Achievements / Awards
  "achievements": "ACHIEVEMENTS",
  "accomplishments": "ACHIEVEMENTS",
  "awards": "AWARDS",
  "honors": "AWARDS",
  "honors & awards": "AWARDS",
  "honors and awards": "AWARDS",
  "recognition": "AWARDS",
  "accolades": "AWARDS",

  // Languages
  "languages": "LANGUAGES",
  "language skills": "LANGUAGES",
  "linguistic skills": "LANGUAGES",

  // Volunteer
  "volunteer": "VOLUNTEER",
  "volunteer experience": "VOLUNTEER",
  "volunteering": "VOLUNTEER",
  "community involvement": "VOLUNTEER",
  "community service": "VOLUNTEER",
  "social work": "VOLUNTEER",

  // Publications
  "publications": "PUBLICATIONS",
  "papers": "PUBLICATIONS",
  "research papers": "PUBLICATIONS",
  "journal articles": "PUBLICATIONS",
  "conference papers": "PUBLICATIONS",
  "presentations": "PUBLICATIONS",

  // Internships
  "internships": "INTERNSHIPS",
  "internship experience": "INTERNSHIPS",

  // Training
  "training": "TRAINING",
  "trainings": "TRAINING",
  "professional development": "TRAINING",
  "workshops": "TRAINING",
  "training & workshops": "TRAINING",
  "training and workshops": "TRAINING",
  "courses": "TRAINING",

  // Interests
  "interests": "INTERESTS",
  "hobbies": "INTERESTS",
  "hobbies & interests": "INTERESTS",
  "extracurriculars": "INTERESTS",
  "activities": "INTERESTS",

  // References
  "references": "REFERENCES",
  "professional references": "REFERENCES",
};

export class DocxSectionDetector {

  static detectSections(tree: DocxNodeTree): DetectedSection[] {
    const { nodes, documentPart } = tree;
    const sections: DetectedSection[] = [];
    let currentSection: DetectedSection | null = null;
    let sectionOrder = 0;

    // First pass: identify the name/contact header region (pre-first-section)
    // Everything before the first detected section heading = PERSONAL_INFO
    let firstSectionNodeIndex = -1;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.nodeType === "paragraph" && node.paragraph) {
        const { isHeading, plainText } = node.paragraph;
        if (isHeading && plainText.trim()) {
          const detected = this.classifySectionHeading(plainText.trim());
          // If it matches a known non-personal section, mark as first section boundary
          if (detected !== "PERSONAL_INFO") {
            firstSectionNodeIndex = i;
            break;
          }
        }
      }
    }

    // If document has content before the first detected section, it's PERSONAL_INFO
    if (firstSectionNodeIndex > 0) {
      const personalSection: DetectedSection = {
        sectionType: "PERSONAL_INFO",
        sectionTitle: "Personal Information",
        detectionConfidence: "HIGH",
        order: sectionOrder++,
        documentPart,
        nodeIndices: Array.from({ length: firstSectionNodeIndex }, (_, i) => i)
      };
      sections.push(personalSection);
    } else if (firstSectionNodeIndex === -1) {
      // No sections detected — entire document is personal/unknown
      return [{
        sectionType: "PERSONAL_INFO",
        sectionTitle: "Document Content",
        detectionConfidence: "LOW",
        order: 0,
        documentPart,
        nodeIndices: nodes.map((_, i) => i)
      }];
    }

    // Second pass: iterate from first section boundary, build sections
    for (let i = firstSectionNodeIndex; i < nodes.length; i++) {
      const node = nodes[i];
      let isNewSection = false;
      let newSectionType: SectionType = "CUSTOM";
      let newSectionTitle = "";
      let confidence: "HIGH" | "MEDIUM" | "LOW" = "LOW";

      if (node.nodeType === "paragraph" && node.paragraph?.isHeading && node.paragraph.plainText.trim()) {
        const text = node.paragraph.plainText.trim();
        const detected = this.classifySectionHeading(text);
        newSectionType = detected;
        newSectionTitle = text;
        confidence = this.getDetectionConfidence(text, detected);
        isNewSection = true;
      } else if (node.nodeType === "paragraph" && node.paragraph) {
        // Check if it's a visually prominent paragraph acting as heading
        // (large font, bold, centered, short) even without heading style
        const para = node.paragraph;
        if (this.looksLikeImplicitHeading(para)) {
          const text = para.plainText.trim();
          const detected = this.classifySectionHeading(text);
          newSectionType = detected;
          newSectionTitle = text;
          confidence = detected !== "CUSTOM" ? "MEDIUM" : "LOW";
          isNewSection = true;
        }
      }

      if (isNewSection) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          sectionType: newSectionType,
          sectionTitle: newSectionTitle,
          detectionConfidence: confidence,
          order: sectionOrder++,
          documentPart,
          nodeIndices: [i]
        };
      } else if (currentSection) {
        currentSection.nodeIndices.push(i);
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    // Post-process: merge consecutive CUSTOM sections that have no intervening known section
    return this.mergeConsecutiveCustomSections(sections);
  }

  // --------------------------------------------------------
  // Classify a heading text into a section type
  // --------------------------------------------------------
  static classifySectionHeading(text: string): SectionType {
    const normalized = text.trim().toLowerCase()
      .replace(/[•·*\-–—▪▫◦✦➢:]+/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Direct map lookup
    if (SECTION_KEYWORD_MAP[normalized]) {
      return SECTION_KEYWORD_MAP[normalized];
    }

    // Partial keyword match for compound headings
    for (const [keyword, type] of Object.entries(SECTION_KEYWORD_MAP)) {
      if (normalized.includes(keyword) || keyword.includes(normalized)) {
        return type;
      }
    }

    return "CUSTOM";
  }

  private static getDetectionConfidence(
    text: string,
    type: SectionType
  ): "HIGH" | "MEDIUM" | "LOW" {
    const normalized = text.trim().toLowerCase();
    if (type === "CUSTOM") return "LOW";
    if (SECTION_KEYWORD_MAP[normalized]) return "HIGH";
    return "MEDIUM";
  }

  private static looksLikeImplicitHeading(para: DocxParagraph): boolean {
    const text = para.plainText.trim();
    if (!text || text.length > 60) return false;
    // All caps short text not starting with bullet
    if (text === text.toUpperCase() && /[A-Z]/.test(text) && !para.isBullet) return true;
    // All runs are bold and text is short (< 45 chars)
    if (para.runs.length > 0 && para.runs.every(r => r.isBold) && text.length < 45 && !para.isBullet) return true;
    return false;
  }

  private static mergeConsecutiveCustomSections(sections: DetectedSection[]): DetectedSection[] {
    const result: DetectedSection[] = [];
    let i = 0;
    while (i < sections.length) {
      if (sections[i].sectionType === "CUSTOM" &&
          i + 1 < sections.length &&
          sections[i + 1].sectionType === "CUSTOM") {
        // Merge into first
        sections[i].nodeIndices = [
          ...sections[i].nodeIndices,
          ...sections[i + 1].nodeIndices
        ];
        i++; // Skip next
      } else {
        result.push(sections[i]);
        i++;
      }
    }
    return result;
  }
}
