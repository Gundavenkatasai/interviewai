import React from "react";
import { IStructuredResume, TemplateId } from "../../types/resume-schema";
import { TechFresherTemplate } from "./TechFresherTemplate";
import { ClassicAtsTemplate } from "./ClassicAtsTemplate";
import { ModernMinimalTemplate } from "./ModernMinimalTemplate";
import { ExperiencedProfTemplate } from "./ExperiencedProfTemplate";
import { AcademicTemplate } from "./AcademicTemplate";
import { ModernTechTemplate } from "./ModernTechTemplate";

interface Props {
  resume: IStructuredResume;
  templateId: TemplateId;
  zoom?: number;
}

export const ResumeTemplateDispatcher: React.FC<Props> = ({
  resume,
  templateId,
  zoom = 1,
}) => {
  const renderTemplate = () => {
    switch (templateId) {
      case "tech-fresher":
        return <TechFresherTemplate resume={resume} />;
      case "classic-ats":
        return <ClassicAtsTemplate resume={resume} />;
      case "modern-minimal":
        return <ModernMinimalTemplate resume={resume} />;
      case "experienced-prof":
        return <ExperiencedProfTemplate resume={resume} />;
      case "academic":
        return <AcademicTemplate resume={resume} />;
      case "modern-tech":
        return <ModernTechTemplate resume={resume} />;
      default:
        return <TechFresherTemplate resume={resume} />;
    }
  };

  return (
    <div className="flex justify-center w-full overflow-x-auto py-4">
      <div
        id="resume-a4-canvas"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top center",
          transition: "transform 0.15s ease-out",
          width: "210mm",
          minHeight: "297mm",
        }}
        className="bg-white text-black shadow-xl border border-gray-300 print:shadow-none print:border-none print:w-full print:transform-none select-text transition-all"
      >
        {renderTemplate()}
      </div>
    </div>
  );
};

export const TEMPLATE_METADATA: Record<
  TemplateId,
  { name: string; tag: string; description: string; bestFor: string }
> = {
  "tech-fresher": {
    name: "Tech Fresher (Jake's Resume / LaTeX)",
    tag: "High ATS Rating (99%)",
    description: "Front-loaded skills and engineering projects. Maximum density, single-page fit.",
    bestFor: "Software engineers, new graduates, project-heavy profiles",
  },
  "classic-ats": {
    name: "Classic ATS (Harvard Standard)",
    tag: "Universal Parseability",
    description: "Single-column serif typography with traditional linear reading order.",
    bestFor: "Corporate applications, enterprise ATS parsers, general roles",
  },
  "modern-tech": {
    name: "Modern Tech Professional",
    tag: "Engineering Aesthetic",
    description: "Modern typography, tech badges, and structured architecture callouts.",
    bestFor: "Full-Stack, DevOps, Cloud, AI/ML engineers",
  },
  "modern-minimal": {
    name: "Modern Minimalist",
    tag: "Clean Typography",
    description: "Clean sans-serif typography, generous whitespace, and high visual contrast.",
    bestFor: "Product, Design, Operations, Tech Leads",
  },
  "experienced-prof": {
    name: "Experienced Professional",
    tag: "Executive Hierarchy",
    description: "Chronological experience prioritized with metric-driven impact bullets.",
    bestFor: "3+ years experience, Senior / Lead roles",
  },
  academic: {
    name: "Academic & Research Curriculum",
    tag: "Research & Citations",
    description: "Education and academic research front-loaded with publications and coursework.",
    bestFor: "Researchers, PhDs, Scientists, Academic positions",
  },
};
