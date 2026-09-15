import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { ResumeBuilderShell } from "../Builder/ResumeBuilderShell";
import { useResumeStore } from "../store/useResumeStore";
import { IResume } from "../types/resume";
import { ApiClient } from "../../../lib/api";

const DEFAULT_BUILDER_SECTIONS = [
  { id: "personal", name: "Personal Information", enabled: true, order: 0 },
  { id: "summary", name: "Professional Summary", enabled: true, order: 1 },
  { id: "experience", name: "Work Experience", enabled: true, order: 2 },
  { id: "education", name: "Education", enabled: true, order: 3 },
  { id: "projects", name: "Projects", enabled: true, order: 4 },
  { id: "skills", name: "Skills & Proficiencies", enabled: true, order: 5 },
  { id: "certifications", name: "Certifications", enabled: true, order: 6 },
  { id: "languages", name: "Languages", enabled: true, order: 7 },
];

const DEFAULT_PROFILE_DATA = {
  personal: { fullName: "", email: "", phone: "", location: "", linkedin: "", github: "", portfolio: "" },
  summary: "",
  experience: [],
  education: [],
  projects: [],
  skills: { technical: [], languages: [], frameworks: [], databases: [], cloud: [], tools: [], soft: [], structured: [] },
  certifications: [],
  achievements: [],
  internships: [],
  publications: [],
  volunteer: [],
  languages: [],
  interests: [],
  customSections: []
};

interface Props {
  resumeId: string;
}

export const ResumeBuilderWorkspace: React.FC<Props> = ({ resumeId }) => {
  const { setResume } = useResumeStore();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!resumeId) {
      setLoading(false);
      return;
    }

    const fetchResume = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await ApiClient.getResume(resumeId);
        if (response) {
          const backendResume = response.resume || response.data || response;

          const normalizedResume: IResume = {
            _id: backendResume._id,
            name: backendResume.name || "Untitled Resume",
            targetRole: backendResume.targetRole || "Professional",
            profileData: backendResume.profileData || DEFAULT_PROFILE_DATA,
            sections:
              Array.isArray(backendResume.sections) && backendResume.sections.length > 0
                ? backendResume.sections
                : DEFAULT_BUILDER_SECTIONS,
            template: backendResume.template || "ats_classic",
            theme: backendResume.theme || {
              primaryColor: "#000000",
              textColor: "#333333",
              headingColor: "#000000",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              lineHeight: 1.5,
              letterSpacing: 0,
            },
            layout: backendResume.layout || {
              pageSize: "A4",
              margins: { top: 48, right: 48, bottom: 48, left: 48 },
              sectionSpacing: 16,
              paragraphSpacing: 8,
              columnGap: 24,
            },
            atsScore: backendResume.atsScore || 0,
            updatedAt: backendResume.updatedAt,
            fileType: backendResume.fileType,
            hasRawText: Boolean(backendResume.rawText),
            filename: backendResume.filename,
          };

          setResume(normalizedResume);
        } else {
          setFetchError("Resume could not be loaded.");
        }
      } catch (err: any) {
        console.error("Failed to fetch resume:", err);
        setFetchError(err.message || "Failed to load resume.");
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [resumeId, setResume]);

  if (!resumeId) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="font-medium">Please select or upload a resume to start building.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <div className="font-medium text-zinc-300">Loading Resume Studio...</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] items-center justify-center bg-zinc-950 text-zinc-300 p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
        <h3 className="text-lg font-bold text-zinc-100">Resume Not Found</h3>
        <p className="text-sm text-zinc-400 mt-1 mb-6 max-w-sm">{fetchError}</p>
        <button
          onClick={() => navigate("?mode=templates")}
          className="px-4 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg border border-zinc-700 transition cursor-pointer"
        >
          ← Back to Resumes
        </button>
      </div>
    );
  }

  return <ResumeBuilderShell resumeId={resumeId!} />;
};
