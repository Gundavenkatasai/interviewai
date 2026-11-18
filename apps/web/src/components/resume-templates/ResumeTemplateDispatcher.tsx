import React, { useRef, useState, useEffect } from "react";
import { IStructuredResume, TemplateId } from "../../types/resume-schema";
import { TechFresherTemplate } from "./TechFresherTemplate";
import { ClassicAtsTemplate } from "./ClassicAtsTemplate";
import { ModernMinimalTemplate } from "./ModernMinimalTemplate";
import { ExperiencedProfTemplate } from "./ExperiencedProfTemplate";
import { AcademicTemplate } from "./AcademicTemplate";
import { ModernTechTemplate } from "./ModernTechTemplate";
import { computeLayoutDensity } from "./density-config";
import { CheckCircle2, AlertTriangle, Layers } from "lucide-react";

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
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const density = computeLayoutDensity(resume);

  useEffect(() => {
    if (canvasRef.current) {
      const { scrollHeight, clientHeight } = canvasRef.current;
      setIsOverflowing(scrollHeight > clientHeight + 6);
    }
  }, [resume, templateId, zoom, density]);

  const renderTemplate = () => {
    switch (templateId) {
      case "tech-fresher":
        return <TechFresherTemplate resume={resume} density={density} />;
      case "classic-ats":
        return <ClassicAtsTemplate resume={resume} density={density} />;
      case "modern-minimal":
        return <ModernMinimalTemplate resume={resume} density={density} />;
      case "experienced-prof":
        return <ExperiencedProfTemplate resume={resume} density={density} />;
      case "academic":
        return <AcademicTemplate resume={resume} density={density} />;
      case "modern-tech":
        return <ModernTechTemplate resume={resume} density={density} />;
      default:
        return <TechFresherTemplate resume={resume} density={density} />;
    }
  };

  return (
    <div className="flex flex-col items-center w-full space-y-3">
      {/* ── A4 Calibration Status Bar (Hidden when printing) ── */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-[210mm] px-2 text-[11px] font-mono text-[#5C564E] print:hidden">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-[#181614]">
            <Layers className="w-3.5 h-3.5 text-[#C84B26]" />
            A4 PORTRAIT (210 × 297 mm)
          </span>
          <span className="text-gray-300">•</span>
          <span>PAGE 1 OF 1</span>
        </div>

        <div className="flex items-center gap-2">
          {isOverflowing ? (
            <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Content Overflow Warning (Compacting)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#2E6347] bg-[#EBF3EE] px-2 py-0.5 rounded border border-[#D0E3D6] font-semibold">
              <CheckCircle2 className="w-3 h-3 text-[#2E6347]" />
              Single-Page A4 Verified ({density.toUpperCase()})
            </span>
          )}
        </div>
      </div>

      {/* ── Physical A4 Sheet Canvas ── */}
      <div className="flex justify-center w-full overflow-x-auto py-2">
        <div
          id="resume-a4-canvas"
          ref={canvasRef}
          data-density={density}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
            width: "210mm",
            height: "297mm",
            minHeight: "297mm",
            maxHeight: "297mm",
            boxSizing: "border-box",
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
          className="bg-white text-black shadow-2xl border border-gray-300 print:shadow-none print:border-none print:w-full print:transform-none select-text transition-all"
        >
          {renderTemplate()}
        </div>
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
