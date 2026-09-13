import React, { forwardRef } from "react";
import { ATSClassicTemplate } from "./renderers/ATSClassicTemplate";
import { ATSModernTemplate } from "./renderers/ATSModernTemplate";
import { ATSMinimalTemplate } from "./renderers/ATSMinimalTemplate";
import { FinanceConsultingTemplate } from "./renderers/FinanceConsultingTemplate";
import { ModernDevTemplate } from "./renderers/ModernDevTemplate";
import { MinimalTemplate } from "./renderers/MinimalTemplate";
import { ExecutiveTemplate } from "./renderers/ExecutiveTemplate";
import { TechnicalTemplate } from "./renderers/TechnicalTemplate";
import { TwoColumnTemplate } from "./renderers/TwoColumnTemplate";
import { CreativeTemplate } from "./renderers/CreativeTemplate";

export interface ResumeRendererProps {
  resume: any;
  paperSize?: "a4" | "letter";
  className?: string;
}

export const ResumeRenderer = forwardRef<HTMLDivElement, ResumeRendererProps>(
  ({ resume, paperSize = "a4", className = "" }, ref) => {
    if (!resume) {
      return (
        <div className="w-full h-full flex items-center justify-center p-12 text-slate-400 text-xs">
          No resume selected to preview.
        </div>
      );
    }

    const templateId = (resume.template || "ats_classic").toLowerCase();

    // Paper dimension classes:
    // A4: 210mm x 297mm
    // Letter: 215.9mm x 279.4mm (8.5in x 11in)
    const dimensionStyle =
      paperSize === "letter"
        ? { width: "215.9mm", minHeight: "279.4mm" }
        : { width: "210mm", minHeight: "297mm" };

    const renderTemplateContent = () => {
      switch (templateId) {
        case "ats_modern":
          return <ATSModernTemplate resume={resume} paperSize={paperSize} />;
        case "ats_minimal":
          return <ATSMinimalTemplate resume={resume} paperSize={paperSize} />;
        case "finance_consulting":
        case "finance":
        case "consulting":
          return <FinanceConsultingTemplate resume={resume} paperSize={paperSize} />;
        case "modern_dev":
        case "software_eng":
          return <ModernDevTemplate resume={resume} paperSize={paperSize} />;
        case "minimal":
        case "fresh_grad":
          return <MinimalTemplate resume={resume} paperSize={paperSize} />;
        case "executive":
        case "experienced_pro":
          return <ExecutiveTemplate resume={resume} paperSize={paperSize} />;
        case "technical":
          return <TechnicalTemplate resume={resume} paperSize={paperSize} />;
        case "two_column":
        case "student":
          return <TwoColumnTemplate resume={resume} paperSize={paperSize} />;
        case "creative":
        case "academic":
          return <CreativeTemplate resume={resume} paperSize={paperSize} />;
        case "ats_classic":
        default:
          return <ATSClassicTemplate resume={resume} paperSize={paperSize} />;
      }
    };

    return (
      <div
        ref={ref}
        style={dimensionStyle}
        className={`bg-white shadow-2xl rounded-sm print:shadow-none print:m-0 overflow-hidden shrink-0 ${className}`}
      >
        {renderTemplateContent()}
      </div>
    );
  }
);

ResumeRenderer.displayName = "ResumeRenderer";
