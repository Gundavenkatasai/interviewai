export type AtsRiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type TemplateCategory = "ATS_SAFE" | "PROFESSIONAL" | "EXECUTIVE" | "MODERN";

export interface ITemplateAtsProfile {
  columns: 1 | 2;
  usesTables: boolean;
  usesTextBoxes: boolean;
  usesImagesForText: boolean;
  selectableText: boolean;
  semanticSections: boolean;
  riskLevel: AtsRiskLevel;
}

export interface ITemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  atsProfile: ITemplateAtsProfile;
  supportedPageSizes: ("A4" | "Letter")[];
  supportedSections: string[];
  version: string;
}

export const ATS_TEMPLATES: ITemplateMetadata[] = [
  {
    id: "ats_classic",
    name: "ATS Classic",
    description: "A conservative, single-column template with strong typography and standard hierarchy.",
    category: "ATS_SAFE",
    atsProfile: {
      columns: 1,
      usesTables: false,
      usesTextBoxes: false,
      usesImagesForText: false,
      selectableText: true,
      semanticSections: true,
      riskLevel: "LOW"
    },
    supportedPageSizes: ["A4", "Letter"],
    supportedSections: ["summary", "experience", "education", "projects", "skills", "certifications", "awards"],
    version: "1.0.0"
  },
  {
    id: "ats_compact",
    name: "ATS Compact",
    description: "A single-column template with tighter spacing, optimized for experienced candidates.",
    category: "ATS_SAFE",
    atsProfile: {
      columns: 1,
      usesTables: false,
      usesTextBoxes: false,
      usesImagesForText: false,
      selectableText: true,
      semanticSections: true,
      riskLevel: "LOW"
    },
    supportedPageSizes: ["A4", "Letter"],
    supportedSections: ["summary", "experience", "education", "projects", "skills", "certifications", "awards"],
    version: "1.0.0"
  },
  {
    id: "professional",
    name: "Professional",
    description: "A polished template with subtle layout enhancements for SaaS and corporate roles.",
    category: "PROFESSIONAL",
    atsProfile: {
      columns: 1,
      usesTables: false,
      usesTextBoxes: false,
      usesImagesForText: false,
      selectableText: true,
      semanticSections: true,
      riskLevel: "LOW"
    },
    supportedPageSizes: ["A4", "Letter"],
    supportedSections: ["summary", "experience", "education", "projects", "skills", "certifications", "awards"],
    version: "1.0.0"
  },
  {
    id: "executive",
    name: "Executive",
    description: "Premium typography with restrained visual treatment for senior professionals.",
    category: "EXECUTIVE",
    atsProfile: {
      columns: 1,
      usesTables: false,
      usesTextBoxes: false,
      usesImagesForText: false,
      selectableText: true,
      semanticSections: true,
      riskLevel: "LOW"
    },
    supportedPageSizes: ["A4", "Letter"],
    supportedSections: ["summary", "experience", "education", "projects", "skills", "certifications", "awards"],
    version: "1.0.0"
  },
  {
    id: "modern_ats",
    name: "Modern ATS",
    description: "A contemporary design with clear hierarchy and minimal accent usage.",
    category: "MODERN",
    atsProfile: {
      columns: 1,
      usesTables: false,
      usesTextBoxes: false,
      usesImagesForText: false,
      selectableText: true,
      semanticSections: true,
      riskLevel: "LOW"
    },
    supportedPageSizes: ["A4", "Letter"],
    supportedSections: ["summary", "experience", "education", "projects", "skills", "certifications", "awards"],
    version: "1.0.0"
  }
];

export function getTemplateById(id: string): ITemplateMetadata | undefined {
  return ATS_TEMPLATES.find((t) => t.id === id);
}
