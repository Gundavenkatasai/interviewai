import React, { useMemo } from "react";
import { resumeTemplateRegistry } from "../registry/TemplateRegistry";
import { IResume, IResumeTheme, IResumeLayout, IResumeProfileData } from "../types/resume";

interface Props {
  templateId: string;
  theme?: IResumeTheme;
  layout?: IResumeLayout;
  profileData?: IResumeProfileData;
}

// Default demo data so thumbnail always has content
const DEMO_RESUME: IResume = {
  _id: "preview",
  name: "Preview",
  targetRole: "Software Engineer",
  template: "ats_classic",
  atsScore: 90,
  updatedAt: new Date().toISOString(),
  theme: {
    primaryColor: "#000000",
    textColor: "#333333",
    headingColor: "#000000",
    fontFamily: "'Times New Roman', serif",
    fontSize: 12,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  layout: {
    pageSize: "Letter",
    margins: { top: 48, right: 48, bottom: 48, left: 48 },
    sectionSpacing: 16,
    paragraphSpacing: 4,
    columnGap: 0,
  },
  sections: [],
  profileData: {
    personal: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: "",
    },
    summary: "",
    experience: [],
    education: [],
    projects: [],
    skills: { technical: [], languages: [], frameworks: [], databases: [], cloud: [], tools: [], soft: [] },
    certifications: [],
    achievements: [],
    internships: [],
    publications: [],
    volunteer: [],
    languages: [],
    interests: [],
    customSections: [],
  },
};

/**
 * Renders a real scaled-down preview of a resume template.
 * Uses CSS transform: scale() to shrink the full 794px wide template
 * into a tiny card thumbnail — the same technique used by Reactive Resume.
 */
export const ResumeThumbnailCard: React.FC<Props> = ({
  templateId,
  theme,
  layout,
  profileData,
}) => {
  const TemplateRenderer = useMemo(() => {
    const def = resumeTemplateRegistry.getTemplate(templateId as any);
    return def ? def.renderer : null;
  }, [templateId]);

  const previewResume: IResume = {
    ...DEMO_RESUME,
    template: templateId as any,
    theme: theme || DEMO_RESUME.theme,
    layout: layout || DEMO_RESUME.layout,
    profileData: profileData || DEMO_RESUME.profileData,
  };

  // The card thumbnail area is ~192px wide (the w-full of the card).
  // The template renders at 794px wide. So scale = ~0.24
  const SCALE = 0.24;
  const TEMPLATE_W = 794;
  const TEMPLATE_H = 1123;

  // Outer container must match the scaled dimensions
  const outerW = TEMPLATE_W * SCALE;
  const outerH = TEMPLATE_H * SCALE;

  if (!TemplateRenderer) {
    return (
      <div
        className="w-full bg-white flex items-center justify-center"
        style={{ height: `${outerH}px` }}
      >
        <span className="text-gray-400 text-xs">No preview</span>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden bg-white w-full"
      style={{ height: `${outerH}px` }}
    >
      {/* The template renders at full size and is then scaled down */}
      <div
        style={{
          width: `${TEMPLATE_W}px`,
          height: `${TEMPLATE_H}px`,
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <TemplateRenderer resume={previewResume} />
      </div>
    </div>
  );
};
