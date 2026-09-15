import { FC } from "react";
import { IResume, ResumeTemplateId, IResumeTheme, IResumeLayout } from "../types/resume";
import { ClassicAtsTemplate } from "../Builder/Canvas/templates/ClassicAtsTemplate";
import { ModernAtsTemplate } from "../Builder/Canvas/templates/ModernAtsTemplate";
import { MinimalAtsTemplate } from "../Builder/Canvas/templates/MinimalAtsTemplate";
import { TwoColumnTemplate } from "../Builder/Canvas/templates/TwoColumnTemplate";
import { CreativeTemplate } from "../Builder/Canvas/templates/CreativeTemplate";

export type ResumeTemplateCategory = 
  | "All"
  | "ATS Friendly"
  | "Minimal"
  | "Modern"
  | "Executive"
  | "Creative";

export interface ResumeRenderProps {
  resume: IResume;
}

export interface ResumeTemplateDefinition {
  id: ResumeTemplateId;
  name: string;
  description: string;
  category: ResumeTemplateCategory;
  atsFriendly: boolean;
  supportsPhoto: boolean;
  supportsColumns: boolean;
  supportsSidebar: boolean;
  renderer: FC<ResumeRenderProps>;
  defaultTheme: IResumeTheme;
  defaultLayout: IResumeLayout;
}

class TemplateRegistry {
  private templates: Map<ResumeTemplateId, ResumeTemplateDefinition> = new Map();

  register(template: ResumeTemplateDefinition) {
    this.templates.set(template.id, template);
  }

  getTemplate(id: ResumeTemplateId): ResumeTemplateDefinition | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): ResumeTemplateDefinition[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: ResumeTemplateCategory): ResumeTemplateDefinition[] {
    if (category === "All") return this.getAllTemplates();
    return this.getAllTemplates().filter(t => t.category === category);
  }

  getATSFriendlyTemplates(): ResumeTemplateDefinition[] {
    return this.getAllTemplates().filter(t => t.atsFriendly);
  }
}

export const resumeTemplateRegistry = new TemplateRegistry();

resumeTemplateRegistry.register({
  id: "ats_classic",
  name: "Classic ATS",
  description: "A clean, single-column design optimized for maximum Applicant Tracking System compatibility.",
  category: "ATS Friendly",
  atsFriendly: true,
  supportsPhoto: false,
  supportsColumns: false,
  supportsSidebar: false,
  renderer: ClassicAtsTemplate,
  defaultTheme: {
    primaryColor: "#000000",
    textColor: "#333333",
    headingColor: "#000000",
    fontFamily: "Times New Roman, serif",
    fontSize: 12,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  defaultLayout: {
    pageSize: "Letter",
    margins: { top: 48, right: 48, bottom: 48, left: 48 },
    sectionSpacing: 16,
    paragraphSpacing: 4,
    columnGap: 0,
  }
});

resumeTemplateRegistry.register({
  id: "ats_modern",
  name: "Modern ATS",
  description: "A clean, modern design featuring subtle color accents and crisp sans-serif typography. Optimized for readability.",
  category: "Modern",
  atsFriendly: true,
  supportsPhoto: false,
  supportsColumns: false,
  supportsSidebar: false,
  renderer: ModernAtsTemplate,
  defaultTheme: {
    primaryColor: "#4f46e5", // Indigo 600
    textColor: "#334155", // Slate 700
    headingColor: "#0f172a", // Slate 900
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    lineHeight: 1.6,
    letterSpacing: 0,
  },
  defaultLayout: {
    pageSize: "Letter",
    margins: { top: 48, right: 48, bottom: 48, left: 48 },
    sectionSpacing: 20,
    paragraphSpacing: 6,
    columnGap: 0,
  }
});

resumeTemplateRegistry.register({
  id: "ats_minimal",
  name: "Minimal ATS",
  description: "An elegant, highly breathable layout focused on sophisticated typography and whitespace.",
  category: "Minimal",
  atsFriendly: true,
  supportsPhoto: false,
  supportsColumns: false,
  supportsSidebar: false,
  renderer: MinimalAtsTemplate,
  defaultTheme: {
    primaryColor: "#64748b", // Slate 500
    textColor: "#475569", // Slate 600
    headingColor: "#1e293b", // Slate 800
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: 10,
    lineHeight: 1.8,
    letterSpacing: 0.5,
  },
  defaultLayout: {
    pageSize: "Letter",
    margins: { top: 60, right: 60, bottom: 60, left: 60 },
    sectionSpacing: 24,
    paragraphSpacing: 8,
    columnGap: 0,
  }
});

resumeTemplateRegistry.register({
  id: "two_column",
  name: "Two Column",
  description: "A striking two-column layout with a colorful sidebar. Great for showcasing skills and contact info prominently.",
  category: "Creative",
  atsFriendly: false,
  supportsPhoto: true,
  supportsColumns: true,
  supportsSidebar: true,
  renderer: TwoColumnTemplate,
  defaultTheme: {
    primaryColor: "#0f172a", // Slate 900 sidebar
    textColor: "#334155",
    headingColor: "#0f172a",
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    lineHeight: 1.6,
    letterSpacing: 0,
  },
  defaultLayout: {
    pageSize: "Letter",
    margins: { top: 32, right: 32, bottom: 32, left: 32 },
    sectionSpacing: 24,
    paragraphSpacing: 6,
    columnGap: 0,
  }
});

resumeTemplateRegistry.register({
  id: "creative",
  name: "Creative Modern",
  description: "A bold, modern design with a colorful header and grid-based lower sections. Perfect for designers and marketers.",
  category: "Creative",
  atsFriendly: false,
  supportsPhoto: true,
  supportsColumns: true,
  supportsSidebar: false,
  renderer: CreativeTemplate,
  defaultTheme: {
    primaryColor: "#db2777", // Pink 600
    textColor: "#334155",
    headingColor: "#111827",
    fontFamily: "'Outfit', sans-serif",
    fontSize: 11,
    lineHeight: 1.6,
    letterSpacing: 0,
  },
  defaultLayout: {
    pageSize: "Letter",
    margins: { top: 32, right: 32, bottom: 32, left: 32 },
    sectionSpacing: 24,
    paragraphSpacing: 6,
    columnGap: 0,
  }
});
