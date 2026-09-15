import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  ChevronLeft, Download, Undo2, Redo2, RefreshCw,
  AlertTriangle, CheckCircle2, Loader2, FileText, Eye, Clock,
  X, Info, ChevronDown, ChevronUp, Shield, ZoomIn, ZoomOut, Maximize2
} from "lucide-react";
import * as docx from "docx-preview";
import { useImportedDocxEditor } from "../../../hooks/useImportedDocxEditor";
import { ImportedDocxApi } from "../../../lib/importedDocxApi";

interface Props {
  workspaceId: string;
  onBack: () => void;
}

const SECTION_COLORS: Record<string, string> = {
  PERSONAL_INFO: "#7c3aed",
  SUMMARY: "#0ea5e9",
  EXPERIENCE: "#22c55e",
  EDUCATION: "#f59e0b",
  SKILLS: "#06b6d4",
  PROJECTS: "#a855f7",
  CERTIFICATIONS: "#10b981",
  ACHIEVEMENTS: "#f97316",
  AWARDS: "#f97316",
  LANGUAGES: "#8b5cf6",
  VOLUNTEER: "#14b8a6",
  PUBLICATIONS: "#6366f1",
  INTERNSHIPS: "#84cc16",
  TRAINING: "#eab308",
  INTERESTS: "#ec4899",
  REFERENCES: "#94a3b8",
  HEADER_REGION: "#64748b",
  FOOTER_REGION: "#64748b",
  CUSTOM: "#475569",
};

export const DocxXeroxWorkspace: React.FC<Props> = ({ workspaceId, onBack }) => {
  const editor = useImportedDocxEditor(workspaceId);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(100);
  const [hasPreviewLoaded, setHasPreviewLoaded] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const renderAbortRef = useRef<boolean>(false);

  // Load workspace metadata and version history on mount
  useEffect(() => {
    if (!workspaceId) return;
    editor.loadWorkspace();
    editor.loadVersions();
  }, [workspaceId]);

  // Set default active section once sections are loaded
  useEffect(() => {
    if (editor.sections.length > 0 && !activeSectionId) {
      setActiveSectionId(editor.sections[0]._id);
    }
  }, [editor.sections, activeSectionId]);

  // Render high-fidelity Xerox preview of the DOCX
  const loadPreview = useCallback(async (versionId?: string) => {
    if (!workspaceId) return;
    setIsLoadingPreview(true);
    setPreviewError(null);
    renderAbortRef.current = false;

    try {
      const res = await ImportedDocxApi.getPreview(workspaceId, versionId);
      if (!res?.docxBase64) {
        throw new Error("No DOCX binary received from server.");
      }

      // Ensure container exists; if not yet attached to DOM, wait briefly
      let attempts = 0;
      while (!containerRef.current && attempts < 25) {
        await new Promise((r) => setTimeout(r, 40));
        attempts++;
      }

      const container = containerRef.current;
      if (container && !renderAbortRef.current) {
        const binaryStr = atob(res.docxBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        container.innerHTML = "";

        await docx.renderAsync(bytes.buffer, container, undefined, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          experimental: false,
          useBase64URL: true,
        });

        if (!renderAbortRef.current) {
          setHasPreviewLoaded(true);
        }
      }
    } catch (err: any) {
      console.error("[DocxXerox] Preview render error:", err);
      setPreviewError("Unable to render preview canvas. Your document is saved and can still be downloaded.");
    } finally {
      if (!renderAbortRef.current) {
        setIsLoadingPreview(false);
      }
    }
  }, [workspaceId]);

  // Automatically render preview as soon as workspace is ready or version changes
  useEffect(() => {
    if (editor.workspace?._id) {
      loadPreview(editor.latestVersionId || undefined);
    }
  }, [editor.workspace?._id, editor.latestVersionId, loadPreview]);

  // Initial preview load trigger on mount
  useEffect(() => {
    loadPreview();
    return () => {
      renderAbortRef.current = true;
    };
  }, [loadPreview]);

  // Field change handler
  const handleFieldChange = useCallback(
    (fieldId: string, newValue: string, originalValue: string) => {
      editor.updateField(fieldId, newValue, originalValue);
    },
    [editor]
  );

  // Save changes and re-render the preview canvas
  const handleSaveAndPreview = async () => {
    const versionId = await editor.renderDocx();
    if (versionId) {
      await loadPreview(versionId);
    } else {
      await loadPreview();
    }
  };

  // Generate & download the finalized DOCX with original formatting preserved
  const handleGenerateAndDownload = async () => {
    if (editor.hasPendingChanges) {
      const versionId = await editor.renderDocx();
      if (versionId) {
        await loadPreview(versionId);
      }
    }
    editor.downloadLatestVersion();
  };

  const toggleSection = (id: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveStatusIcon = {
    idle: null,
    pending: <Clock size={13} className="text-amber-400" />,
    saving: <Loader2 size={13} className="text-indigo-400 animate-spin" />,
    saved: <CheckCircle2 size={13} className="text-emerald-400" />,
    error: <AlertTriangle size={13} className="text-rose-400" />,
  }[editor.saveStatus];

  const saveStatusText = {
    idle: "",
    pending: "Unsaved changes",
    saving: "Saving...",
    saved: "All changes saved",
    error: "Save failed",
  }[editor.saveStatus];

  if (!editor.workspace && !editor.sections.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] w-full bg-zinc-950 text-zinc-400">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <p className="text-sm font-medium text-zinc-300">Loading DOCX Xerox Workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[700px] w-full bg-zinc-950 text-zinc-100 font-sans border-t border-zinc-800 overflow-hidden">
      {/* ── TOP TOOLBAR ── */}
      <div className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-6 flex-shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Resumes
          </button>
          <div className="h-5 w-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-100 truncate max-w-xs">
                  {editor.workspace?.originalFilename || "Imported Resume"}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  DOCX Xerox
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            {saveStatusIcon}
            <span className="text-xs text-zinc-500">{saveStatusText}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Undo / Redo */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 mr-2">
            <button
              onClick={editor.undo}
              disabled={!editor.canUndo}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded-md text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition cursor-pointer"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={editor.redo}
              disabled={!editor.canRedo}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded-md text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition cursor-pointer"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Save & Preview */}
          <button
            onClick={handleSaveAndPreview}
            disabled={editor.isRendering || !editor.hasPendingChanges}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition ${
              editor.hasPendingChanges
                ? "bg-indigo-600/15 border-indigo-500 text-indigo-300 hover:bg-indigo-600/25 cursor-pointer"
                : "bg-transparent border-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {editor.isRendering ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            Save & Preview
          </button>

          {/* Download DOCX */}
          <button
            onClick={handleGenerateAndDownload}
            disabled={editor.isRendering}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            {editor.isRendering ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Download DOCX
          </button>

          {/* Info toggle */}
          <button
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              showInfoPanel
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
            title="Coverage & Notes"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── WORKSPACE BODY ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT SIDEBAR: DETECTED SECTIONS & FIELDS ── */}
        <div className="w-96 flex-shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col overflow-hidden">
          {/* Section List Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Resume Sections
              </span>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {editor.sections.length} sections extracted from DOCX
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              100% Editable
            </span>
          </div>

          {/* Section Items & Fields */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 p-2 space-y-2">
            {editor.sections.map((section) => {
              const isSelected = activeSectionId === section._id;
              const isCollapsed = collapsedSections.has(section._id);
              const color = SECTION_COLORS[section.sectionType] || "#7c3aed";

              return (
                <div
                  key={section._id}
                  className={`rounded-xl border transition-all ${
                    isSelected
                      ? "bg-zinc-900/90 border-indigo-500/40 shadow-sm"
                      : "bg-zinc-950/60 border-zinc-900 hover:border-zinc-800"
                  }`}
                >
                  {/* Section Title Bar */}
                  <button
                    onClick={() => {
                      setActiveSectionId(section._id);
                      toggleSection(section._id);
                    }}
                    className="w-full flex items-center justify-between p-3 text-left outline-none cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-bold text-zinc-200 truncate">
                        {section.sectionTitle}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/50">
                        {section.fieldCount} fields
                      </span>
                      {isCollapsed ? (
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                    </div>
                  </button>

                  {/* Editable Fields inside Section */}
                  {(!isCollapsed || isSelected) && (
                    <div className="px-3 pb-3 pt-1 space-y-3 border-t border-zinc-800/60 mt-1">
                      {section.fields
                        .filter((f) => f.isEditable)
                        .map((field) => (
                          <FieldEditorItem
                            key={field._id}
                            field={field}
                            pendingValue={editor.pendingChanges[field._id]}
                            onChange={(newVal) =>
                              handleFieldChange(field._id, newVal, field.originalValue)
                            }
                          />
                        ))}

                      {section.fields.filter((f) => !f.isEditable).map((field) => (
                        <div
                          key={field._id}
                          className="p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/40 text-[11px] text-zinc-500"
                        >
                          <span className="font-semibold">{field.label}:</span>{" "}
                          <span className="italic">{field.editWarning || "Read-only"}</span>
                        </div>
                      ))}

                      {section.fields.length === 0 && (
                        <p className="text-xs text-zinc-500 py-1 text-center">
                          No editable text fields found in this section.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Immutability Footer */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Original format is 100% preserved</span>
            </div>
          </div>
        </div>

        {/* ── CENTER: HIGH-FIDELITY DOCX XEROX CANVAS ── */}
        <div className="flex-1 flex flex-col bg-zinc-900 overflow-hidden relative">
          {/* Canvas Sub-bar */}
          <div className="h-10 bg-zinc-950/80 border-b border-zinc-800/80 px-4 flex items-center justify-between flex-shrink-0 z-10">
            <div className="flex items-center space-x-2 text-xs text-zinc-400">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>High-Fidelity Document Xerox View</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => loadPreview(editor.latestVersionId || undefined)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-md transition cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh Canvas
              </button>
            </div>
          </div>

          {/* Scrollable Canvas Viewport */}
          <div className="flex-1 overflow-auto flex justify-center p-8 relative">
            {isLoadingPreview && (
              <div className="absolute top-12 z-20 flex items-center gap-2.5 px-4 py-2 bg-zinc-950/90 border border-zinc-800 rounded-full shadow-xl text-xs text-zinc-300 backdrop-blur-md">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                <span>Rendering exact DOCX document…</span>
              </div>
            )}

            {previewError ? (
              <div className="flex flex-col items-center justify-center my-auto p-8 text-center max-w-md bg-zinc-950/80 border border-zinc-800 rounded-2xl shadow-xl">
                <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
                <p className="text-sm font-semibold text-zinc-200 mb-1">Canvas Render Notice</p>
                <p className="text-xs text-zinc-400 mb-4">{previewError}</p>
                <button
                  onClick={() => loadPreview(editor.latestVersionId || undefined)}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center",
                  transition: "transform 0.15s ease",
                  opacity: isLoadingPreview && !hasPreviewLoaded ? 0.3 : 1,
                }}
              >
                {/* Real DOCX container rendered via docx-preview */}
                <div
                  ref={containerRef}
                  className="docx-xerox-container bg-white shadow-2xl rounded-sm min-w-[794px] min-h-[1123px] text-zinc-900 selection:bg-indigo-500/20"
                />
              </div>
            )}
          </div>

          {/* Floating Zoom Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-zinc-950/95 border border-zinc-800 px-4 py-1.5 rounded-full shadow-2xl backdrop-blur-md z-10">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              disabled={zoom <= 50}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-zinc-300 w-12 text-center select-none">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              disabled={zoom >= 200}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-3.5 bg-zinc-800 mx-1" />
            <button
              onClick={() => setZoom(100)}
              className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Fit / 100%"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── RIGHT COLLAPSIBLE INFO PANEL ── */}
        {showInfoPanel && (
          <div className="w-72 flex-shrink-0 bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-200">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Coverage & Details
              </span>
              <button
                onClick={() => setShowInfoPanel(false)}
                className="p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <span className="text-zinc-500 font-semibold block mb-1">Original File</span>
                <span className="text-zinc-200 break-all font-mono">
                  {editor.workspace?.originalFilename}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 font-semibold block mb-1">Extraction Status</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Editing
                </span>
              </div>
              {editor.workspace?.extractionCoverage && (
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <span className="text-zinc-400 font-semibold block">Mapped Elements</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">Paragraphs</span>
                      <span className="font-bold text-zinc-200">
                        {editor.workspace.extractionCoverage.paragraphsMapped}/
                        {editor.workspace.extractionCoverage.paragraphsDetected}
                      </span>
                    </div>
                    <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[10px]">Tables</span>
                      <span className="font-bold text-zinc-200">
                        {editor.workspace.extractionCoverage.tablesMapped}/
                        {editor.workspace.extractionCoverage.tablesDetected}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .docx-xerox-container {
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.6);
        }
        .docx-xerox-container .docx-wrapper {
          background: transparent !important;
          padding: 0 !important;
        }
        .docx-xerox-container section.docx {
          margin-bottom: 20px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
        }
      `}</style>
    </div>
  );
};

// ------------------------------------------------------------
// Sub-component: FieldEditorItem with real-time editing
// ------------------------------------------------------------
interface FieldEditorItemProps {
  field: any;
  pendingValue?: string;
  onChange: (val: string) => void;
}

const FieldEditorItem: React.FC<FieldEditorItemProps> = ({ field, pendingValue, onChange }) => {
  const [localVal, setLocalVal] = useState(pendingValue ?? field.currentValue ?? "");

  useEffect(() => {
    setLocalVal(pendingValue ?? field.currentValue ?? "");
  }, [pendingValue, field.currentValue]);

  const isModified = localVal !== field.originalValue;
  const isMultiLine =
    field.fieldType === "bullet" ||
    field.fieldType === "text" ||
    field.fieldType === "table_cell" ||
    localVal.length > 50;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalVal(val);
    onChange(val);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-zinc-400">{field.label}</label>
        {isModified && (
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded">
            edited
          </span>
        )}
      </div>

      {isMultiLine ? (
        <textarea
          value={localVal}
          onChange={handleChange}
          rows={Math.max(2, Math.min(6, Math.ceil(localVal.length / 36)))}
          className={`w-full p-2.5 text-xs rounded-lg border bg-zinc-900 outline-none transition font-sans leading-relaxed ${
            isModified
              ? "border-indigo-500/60 text-zinc-100 focus:border-indigo-500"
              : "border-zinc-800 text-zinc-300 focus:border-zinc-700"
          }`}
        />
      ) : (
        <input
          type="text"
          value={localVal}
          onChange={handleChange}
          className={`w-full px-2.5 py-1.5 text-xs rounded-lg border bg-zinc-900 outline-none transition font-sans ${
            isModified
              ? "border-indigo-500/60 text-zinc-100 focus:border-indigo-500"
              : "border-zinc-800 text-zinc-300 focus:border-zinc-700"
          }`}
        />
      )}
    </div>
  );
};
