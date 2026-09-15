import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Upload, LayoutGrid, List, FileText, MoreVertical, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { ApiClient } from "../../../lib/api";
import { ImportedDocxApi, IWorkspaceSummary } from "../../../lib/importedDocxApi";
import { TemplateSelectionModal } from "./TemplateSelectionModal";
import { ResumeTemplateId } from "../types/resume";
import { ResumeThumbnailCard } from "./ResumeThumbnailCard";
import { ImportDocxWorkspace } from "./ImportDocxWorkspace";

export const ResumeDashboard: React.FC = () => {
  const [resumes, setResumes] = useState<any[]>([]);
  const [importedWorkspaces, setImportedWorkspaces] = useState<IWorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const [resumesRes, workspacesRes] = await Promise.allSettled([
        ApiClient.getResumes(),
        ImportedDocxApi.listWorkspaces()
      ]);

      if (resumesRes.status === "fulfilled" && Array.isArray(resumesRes.value)) {
        setResumes(resumesRes.value);
      }

      if (workspacesRes.status === "fulfilled" && workspacesRes.value?.workspaces) {
        setImportedWorkspaces(workspacesRes.value.workspaces);
      }
    } catch (e) {
      console.error("Failed to fetch resumes:", e);
    } finally {
      setLoading(false);
    }
  };

  const createNewResume = async (templateId: ResumeTemplateId = "ats_classic") => {
    setLoading(true);
    setIsTemplateModalOpen(false);
    try {
      const newResume = await ApiClient.createResume({
        name: "Untitled Resume",
        targetRole: "Professional",
        template: templateId,
      });
      const createdResume = newResume.resume || newResume.data;
      if (createdResume && createdResume._id) {
        navigate(`?mode=templates&id=${createdResume._id}`);
      }
    } catch (e) {
      console.error("Failed to create resume:", e);
    } finally {
      setLoading(false);
    }
  };

  const openResume = (id: string) => {
    navigate(`?mode=templates&id=${id}`);
  };

  const openImportedDocx = (workspaceId: string) => {
    navigate(`?mode=templates&importedId=${workspaceId}`);
  };

  if (isImporting) {
    return (
      <ImportDocxWorkspace
        onBack={() => setIsImporting(false)}
        onOpenWorkspace={(wId) => {
          setIsImporting(false);
          navigate(`?mode=templates&importedId=${wId}`);
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 w-full bg-zinc-950 min-h-screen text-zinc-100 font-sans selection:bg-indigo-500/30">
      
      {/* Top Navbar Simulation */}
      <div className="flex items-center justify-between mb-12 pb-4 border-b border-zinc-800">
        <div className="flex items-center space-x-4 bg-zinc-900 px-3 py-2 rounded-lg w-96 border border-zinc-800">
          <Search className="w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search by resume name or target role..." 
            className="bg-transparent border-none outline-none text-sm w-full text-zinc-300 placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-50 mb-1">Resumes</h1>
          <p className="text-zinc-400 text-sm">Manage and edit your ATS-optimized resumes.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsImporting(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2 text-zinc-400" />
            Import DOCX (Xerox)
          </button>
          <button 
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center px-4 py-2 text-sm font-bold text-zinc-950 bg-zinc-100 rounded-lg hover:bg-white transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sort by</label>
            <select className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-md px-2 py-1 outline-none">
              <option>Last Updated</option>
              <option>Name</option>
              <option>Date Created</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Filter by</label>
            <select className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-md px-2 py-1 outline-none">
              <option>All Resumes</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : resumes.length === 0 && importedWorkspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
          <FileText className="w-12 h-12 text-zinc-700 mb-3" />
          <h3 className="text-lg font-bold text-zinc-200">No Resumes Yet</h3>
          <p className="text-sm text-zinc-500 max-w-sm mt-1 mb-6">
            Import your existing DOCX resume for exact Xerox editing, or create a new one from an ATS template.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsImporting(true)}
              className="flex items-center px-4 py-2 text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition"
            >
              <Upload className="w-4 h-4 mr-2 text-indigo-400" />
              Import DOCX (Xerox)
            </button>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center px-4 py-2 text-xs font-bold text-zinc-950 bg-zinc-100 hover:bg-white rounded-lg transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create New
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Imported DOCX Xerox Resumes */}
          {importedWorkspaces.map((workspace) => (
            <div
              key={workspace._id}
              onClick={() => openImportedDocx(workspace._id)}
              className="group cursor-pointer rounded-xl overflow-hidden flex flex-col bg-zinc-950 border border-zinc-800 hover:border-indigo-500/60 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1"
            >
              {/* Thumbnail Area for DOCX */}
              <div className="h-64 bg-zinc-900/80 flex flex-col items-center justify-center relative border-b border-zinc-800 overflow-hidden p-6 text-center group-hover:bg-zinc-900 transition-colors">
                <div className="w-16 h-20 bg-white rounded-md shadow-lg border border-zinc-300 flex flex-col items-center justify-center p-2 mb-3 transform group-hover:scale-105 transition-transform">
                  <div className="w-8 h-8 rounded bg-indigo-500/15 flex items-center justify-center mb-1">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="w-full space-y-1">
                    <div className="h-1 bg-zinc-200 rounded-full w-3/4 mx-auto" />
                    <div className="h-1 bg-zinc-200 rounded-full w-full" />
                    <div className="h-1 bg-zinc-200 rounded-full w-2/3 mx-auto" />
                  </div>
                </div>

                <span className="text-[11px] font-bold text-zinc-300 truncate max-w-full px-2">
                  {workspace.originalFilename}
                </span>
                <span className="text-[10px] text-zinc-500 mt-1">
                  {workspace.totalSections} sections · {workspace.totalEditableFields} fields
                </span>

                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    DOCX Xerox
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-zinc-900 flex justify-between items-center">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-zinc-100 text-sm truncate">
                    {workspace.name || workspace.originalFilename}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-zinc-500">
                    <span>Imported {new Date(workspace.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Standard Template Resumes */}
          {resumes.map((resume) => (
            <div 
              key={resume._id}
              onClick={() => openResume(resume._id)}
              className="group cursor-pointer rounded-xl overflow-hidden flex flex-col bg-zinc-950 border border-zinc-800 hover:border-zinc-600 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1"
            >
              {/* Thumbnail Placeholder */}
              <div className="bg-zinc-100 flex flex-col items-center justify-center relative border-b border-zinc-800 overflow-hidden">
                <ResumeThumbnailCard 
                  templateId={resume.template} 
                  theme={resume.theme} 
                  layout={resume.layout} 
                  profileData={resume.profileData} 
                />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); }}
                    className="p-1.5 bg-zinc-900/80 hover:bg-zinc-900 text-zinc-300 rounded-md transition-colors backdrop-blur-sm"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-4 bg-zinc-900 flex justify-between items-center">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-zinc-100 text-sm truncate">{resume.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-zinc-500">
                    <span>Updated {new Date(resume.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplateSelectionModal 
        isOpen={isTemplateModalOpen} 
        onClose={() => setIsTemplateModalOpen(false)} 
        onSelect={createNewResume} 
      />
    </div>
  );
};
