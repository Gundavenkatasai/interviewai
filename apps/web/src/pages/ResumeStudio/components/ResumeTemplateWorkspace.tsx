import React, { useState, useEffect } from "react";
import { Download, CheckCircle2, FileText, FileSpreadsheet, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { ApiClient } from "../../../lib/api";
import { TemplateGallery, TEMPLATES } from "./TemplateGallery";

interface Props {
  resumeId: string;
}

export const ResumeTemplateWorkspace: React.FC<Props> = ({ resumeId }) => {
  const [selectedTemplate, setSelectedTemplate] = useState("ats_classic");
  const [pageSize, setPageSize] = useState<"A4" | "Letter">("A4");
  const [isGenerating, setIsGenerating] = useState(false);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [loadingArtifacts, setLoadingArtifacts] = useState(true);

  useEffect(() => {
    if (!resumeId) {
      setLoadingArtifacts(false);
      return;
    }
    fetchArtifacts();
  }, [resumeId]);

  const fetchArtifacts = async () => {
    try {
      const res = await ApiClient.getArtifacts(resumeId);
      if (res?.artifacts) {
        setArtifacts(res.artifacts);
      }
    } catch (e) {
      console.error("Failed to fetch artifacts", e);
    } finally {
      setLoadingArtifacts(false);
    }
  };

  const handleGenerate = async (format: "PDF" | "DOCX") => {
    if (!resumeId) {
      alert("No resume selected. Please upload or select a resume first.");
      return;
    }
    setIsGenerating(true);
    try {
      await ApiClient.generateArtifact(resumeId, selectedTemplate, pageSize, format);
      await fetchArtifacts();
    } catch (e) {
      console.error("Generation failed", e);
      alert("Failed to generate resume artifact. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (artifactId: string, format: string) => {
    try {
      const blob = await ApiClient.downloadArtifact(artifactId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Resume_${format}.${format.toLowerCase()}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
      alert("Failed to download artifact.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-[1600px] mx-auto min-h-[calc(100vh-80px)]">
      {/* LEFT PANEL: Controls */}
      <div className="w-full lg:w-[450px] flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-1">Template Engine</h2>
          <p className="text-sm text-slate-400 mb-6">Select a deterministic ATS-safe template.</p>
          
          <TemplateGallery selectedTemplate={selectedTemplate} onSelect={setSelectedTemplate} />

          <div className="mt-8">
            <h3 className="text-sm font-bold text-slate-300 mb-3">Page Size</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setPageSize("A4")}
                className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                  pageSize === "A4" 
                    ? "bg-slate-700 text-white border border-slate-600" 
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800"
                }`}
              >
                A4
              </button>
              <button
                onClick={() => setPageSize("Letter")}
                className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                  pageSize === "Letter" 
                    ? "bg-slate-700 text-white border border-slate-600" 
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800"
                }`}
              >
                US Letter
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">Export & Download</h2>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleGenerate("PDF")}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              Generate PDF
            </button>
            <button
              onClick={() => handleGenerate("DOCX")}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-3 px-4 rounded-xl transition disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
              Generate DOCX
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Generated Artifacts & Validation */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl flex-1">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            Generated Artifacts
          </h2>
          <p className="text-slate-400 mb-6 text-sm">Every generated resume is versioned, validated, and safely stored.</p>
          
          {loadingArtifacts ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading history...
            </div>
          ) : artifacts.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-white font-bold mb-1">No Artifacts Yet</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Generate a PDF or DOCX using the controls on the left to see your validated artifacts here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {artifacts.map((a) => (
                <div key={a._id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:border-slate-600 transition">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {a.artifactType === "PDF" ? (
                        <div className="bg-rose-500/10 text-rose-400 p-2 rounded-lg"><FileText className="w-6 h-6" /></div>
                      ) : (
                        <div className="bg-blue-500/10 text-blue-400 p-2 rounded-lg"><FileSpreadsheet className="w-6 h-6" /></div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-white font-bold">
                        {TEMPLATES.find(t => t.id === a.templateId)?.name || a.templateId} ({a.pageSize})
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">Generated {new Date(a.createdAt).toLocaleString()}</p>
                      
                      {a.atsValidationStatus && (
                        <div className="flex items-center gap-3 mt-3 text-[11px] font-bold">
                          <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${a.atsValidationStatus.parsing === 'Good' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {a.atsValidationStatus.parsing === 'Good' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            Parsing: {a.atsValidationStatus.parsing}
                          </span>
                          <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${a.atsValidationStatus.structure === 'Good' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {a.atsValidationStatus.structure === 'Good' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            Structure: {a.atsValidationStatus.structure}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDownload(a._id, a.artifactType)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
