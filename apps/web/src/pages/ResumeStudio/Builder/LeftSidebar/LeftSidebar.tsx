import React from "react";
import { useResumeStore } from "../../store/useResumeStore";
import { Settings, AlignLeft, Briefcase, GraduationCap, Award, FileText, Blocks, Code, Globe } from "lucide-react";
import { BasicsEditor } from "./BasicsEditor";
import { SummaryEditor } from "./SummaryEditor";
import { ExperienceEditor } from "./ExperienceEditor";
import { EducationEditor } from "./EducationEditor";
import { SkillsEditor } from "./SkillsEditor";
import { ProjectsEditor } from "./ProjectsEditor";
import { CertificationsEditor } from "./CertificationsEditor";
import { LanguagesEditor } from "./LanguagesEditor";
import { SectionList } from "./SectionList";

// Map section IDs to icons
const SECTION_ICONS: Record<string, React.ReactNode> = {
  personal: <Settings className="w-5 h-5" />,
  summary: <AlignLeft className="w-5 h-5" />,
  experience: <Briefcase className="w-5 h-5" />,
  education: <GraduationCap className="w-5 h-5" />,
  skills: <Code className="w-5 h-5" />,
  projects: <Blocks className="w-5 h-5" />,
  certifications: <Award className="w-5 h-5" />,
  achievements: <Award className="w-5 h-5" />,
  languages: <Globe className="w-5 h-5" />,
};

// Map section IDs to editor components
function renderEditor(sectionId: string) {
  switch (sectionId) {
    case "personal": return <BasicsEditor />;
    case "summary": return <SummaryEditor />;
    case "experience": return <ExperienceEditor />;
    case "education": return <EducationEditor />;
    case "skills": return <SkillsEditor />;
    case "projects": return <ProjectsEditor />;
    case "certifications": return <CertificationsEditor />;
    case "languages": return <LanguagesEditor />;
    default: return (
      <div className="text-zinc-500 text-sm p-4 text-center border border-dashed border-zinc-800 rounded-lg bg-zinc-900/50">
        Editor for <span className="font-semibold text-zinc-300">{sectionId}</span> is coming soon.
      </div>
    );
  }
}

export const LeftSidebar: React.FC = () => {
  const { resume, activeSection, setActiveSection } = useResumeStore();

  if (!resume) return <div className="p-4 text-zinc-500">Loading...</div>;

  return (
    <div className="flex h-full">
      {/* Navbar (Far Left) */}
      <div className="w-16 flex flex-col items-center py-4 bg-zinc-950 border-r border-zinc-800 space-y-2 overflow-y-auto no-scrollbar">
        {resume.sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
            className={`p-3 rounded-xl transition-all flex-shrink-0 ${
              activeSection === section.id
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
            }`}
            title={section.name}
          >
            {SECTION_ICONS[section.id] || <FileText className="w-5 h-5" />}
          </button>
        ))}
      </div>

      {/* Editor Panel */}
      {activeSection && (
        <div className="w-80 flex flex-col bg-zinc-950 border-r border-zinc-800 animate-in slide-in-from-left-8 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center flex-shrink-0">
            <span className="font-bold text-lg text-zinc-100">
              {resume.sections.find(s => s.id === activeSection)?.name || activeSection}
            </span>
          </div>

          {/* Form Content */}
          <div className="flex-1 p-5 overflow-y-auto no-scrollbar">
            {renderEditor(activeSection)}
          </div>
        </div>
      )}

      {/* Fallback Section List if nothing is active */}
      {!activeSection && (
        <div className="w-80 flex flex-col bg-zinc-950 border-r border-zinc-800 p-5">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Resume Sections</h2>
          <SectionList sections={resume.sections} icons={SECTION_ICONS} />
        </div>
      )}
    </div>
  );
};
