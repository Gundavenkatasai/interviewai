import React, { useState, useRef } from "react";
import {
  Upload, X, CheckCircle2, AlertTriangle, FileText,
  RefreshCw, Check, ArrowRight
} from "lucide-react";
import { ApiClient } from "../../../../lib/api";

interface ResumeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedResume: any) => void;
}

export const ResumeImportModal: React.FC<ResumeImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parseResult, setParseResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "docx", "txt", "json"].includes(ext || "")) {
        setError("Unsupported file format. Please upload PDF, DOCX, TXT, or JSON.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit.");
        return;
      }
      setSelectedFile(file);
      setError(null);
      setParseResult(null);
    }
  };

  const handleUploadAndParse = async () => {
    if (!selectedFile) {
      setError("Please select a file to parse.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const res = await ApiClient.uploadResume(selectedFile);
      if (res?.resume) {
        setParseResult(res.resume);
      } else if (res?.profileData) {
        setParseResult({ profileData: res.profileData });
      } else {
        throw new Error(res?.message || "Failed to parse document content.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse resume. Check that the document contains selectable text.");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmImport = () => {
    if (parseResult) {
      onImportSuccess(parseResult);
      onClose();
    }
  };

  const profile = parseResult?.profileData || {};
  const personal = profile.personal || {};
  const experiences = profile.experience || [];
  const education = profile.education || [];
  const skills = profile.skills || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-slate-100">Import Existing Resume</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!parseResult ? (
            <>
              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/60 rounded-xl p-8 text-center cursor-pointer transition-colors space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-200">
                    {selectedFile ? selectedFile.name : "Click to select or drag and drop your file"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Supports PDF (with text layer), DOCX, TXT, or JSON export (Up to 10MB)
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleUploadAndParse}
                  disabled={!selectedFile || uploading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${uploading ? "animate-spin" : ""}`} />
                  {uploading ? "Extracting & Indexing Sections..." : "Upload & Parse"}
                </button>
              </div>
            </>
          ) : (
            /* Review Extracted Data */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-300 text-xs">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Resume parsed successfully. Please review the extracted sections before importing.</span>
              </div>

              <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs">
                <div>
                  <span className="text-slate-500 uppercase tracking-wider font-semibold">Candidate:</span>
                  <div className="text-slate-200 font-medium mt-0.5">
                    {personal.fullName || "Needs review"} • {personal.email || "No email"} • {personal.phone || "No phone"}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 uppercase tracking-wider font-semibold">Experience Extracted:</span>
                  <div className="text-slate-200 font-medium mt-0.5">
                    {experiences.length} position(s) detected
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 uppercase tracking-wider font-semibold">Education Extracted:</span>
                  <div className="text-slate-200 font-medium mt-0.5">
                    {education.length} academic credential(s) detected
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 uppercase tracking-wider font-semibold">Skills Extracted:</span>
                  <div className="text-slate-200 font-medium mt-0.5">
                    {Array.isArray(skills) ? skills.length : Object.values(skills).flat().length} skills identified
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setParseResult(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Choose Different File
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Import into Studio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
