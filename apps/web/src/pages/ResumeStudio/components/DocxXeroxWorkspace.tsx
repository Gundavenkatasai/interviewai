/**
 * DocxXeroxWorkspace
 *
 * Three-panel imported DOCX editor:
 *   Left   — Section list + editable field sidebar
 *   Center — High-fidelity DOCX canvas (docx-preview, direct inline editing)
 *   Right  — Collapsible info/coverage panel
 *
 * Canvas rendering: docx-preview (MIT license) renders the actual DOCX binary
 * directly to DOM — NOT a reconstructed Interview AI template.
 *
 * Inline editing: DocxInlineEditLayer attaches contenteditable to rendered
 * paragraph nodes, enabling click-to-edit directly in the canvas.
 *
 * Edit flow:
 *   Sidebar edit → editor.updateField → autosave → optimistic DOM update
 *   Canvas inline edit → onFieldChange → editor.updateField → sidebar syncs
 *   "Save & Preview" → renderDocx → server applies mutations → re-render
 *   Download → DOCX output with changes applied, all formatting preserved
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  ChevronLeft, Download, Undo2, Redo2, RefreshCw,
  AlertTriangle, CheckCircle2, Loader2, FileText, Eye, Clock,
  X, Info, ChevronDown, ChevronUp, Shield, ZoomIn, ZoomOut,
  Maximize2, Edit3, MousePointer
} from "lucide-react";
import { SuperDocEditor } from "@superdoc/react";
import "@superdoc/react/style.css";
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
  const [inlineEditMode, setInlineEditMode] = useState(true);

  const [docFile, setDocFile] = useState<File | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderAbortRef = useRef<boolean>(false);

  // Load workspace + version history on mount
  useEffect(() => {
    if (!workspaceId) return;
    editor.loadWorkspace();
    editor.loadVersions();
  }, [workspaceId]);

  // Set default active section
  useEffect(() => {
    if (editor.sections.length > 0 && !activeSectionId) {
      setActiveSectionId(editor.sections[0]._id);
    }
  }, [editor.sections, activeSectionId]);

  // --------------------------------------------------------
  // Render high-fidelity DOCX Xerox preview
  // --------------------------------------------------------
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

      // Wait for container to attach to DOM
      let attempts = 0;
      while (!containerRef.current && attempts < 25) {
        await new Promise(r => setTimeout(r, 40));
        attempts++;
      }

      if (!renderAbortRef.current) {
        const binaryStr = atob(res.docxBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const file = new File([bytes], res.filename || "document.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        setDocFile(file);
        setHasPreviewLoaded(true);
      }
    } catch (err: any) {
      console.error("[DocxXerox] Preview render error:", err);
      setPreviewError(
        "Unable to render the preview canvas. Your document is saved and can be downloaded."
      );
    } finally {
      if (!renderAbortRef.current) {
        setIsLoadingPreview(false);
      }
    }
  }, [workspaceId, inlineEditMode]);

  // Auto-render when workspace loads or version changes
  useEffect(() => {
    if (editor.workspace?._id) {
      loadPreview(editor.latestVersionId || undefined);
    }
  }, [editor.workspace?._id, editor.latestVersionId, loadPreview]);

  // Initial render on mount
  useEffect(() => {
    loadPreview();
    return () => { renderAbortRef.current = true; };
  }, [loadPreview]);

  // --------------------------------------------------------
  // Field change from sidebar — update field + optimistic canvas
  // --------------------------------------------------------
  const handleFieldChange = useCallback(
    (fieldId: string, newValue: string, originalValue: string) => {
      editor.updateField(fieldId, newValue, originalValue);
    },
    [editor]
  );

  // Field focus from inline canvas → highlight sidebar
  const handleInlineFieldFocus = useCallback(
    (fieldId: string) => {
      editor.highlightField(fieldId);
      // Find and expand the section containing this field
      for (const section of editor.sections) {
        if (section.fields.some((f: any) => f._id === fieldId)) {
          setActiveSectionId(section._id);
          setCollapsedSections(prev => {
            const next = new Set(prev);
            next.delete(section._id);
            return next;
          });
          break;
        }
      }
    },
    [editor]
  );

  // Sidebar field focus → scroll canvas
  const handleSidebarFieldFocus = useCallback(
    (fieldId: string) => {
      editor.highlightField(fieldId);
    },
    [editor]
  );

  // --------------------------------------------------------
  // Save & Preview
  // --------------------------------------------------------
  const handleSaveAndPreview = async () => {
    const versionId = await editor.renderDocx();
    if (versionId) {
      await loadPreview(versionId);
    } else {
      await loadPreview();
    }
  };

  // --------------------------------------------------------
  // Download DOCX
  // --------------------------------------------------------
  const handleGenerateAndDownload = async () => {
    if (editor.hasPendingChanges) {
      const versionId = await editor.renderDocx();
      if (versionId) await loadPreview(versionId);
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
        <p className="text-sm font-medium text-zinc-300">Loading DOCX Workspace...</p>
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
            Back
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

        {/* Right controls */}
        <div className="flex items-center space-x-2">
          {/* Undo / Redo */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 mr-1">
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

          {/* Inline Edit toggle */}
          <button
            onClick={() => setInlineEditMode(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
              inlineEditMode
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
            title={inlineEditMode ? "Inline editing ON — click text in canvas to edit" : "Inline editing OFF"}
          >
            {inlineEditMode ? <Edit3 className="w-3.5 h-3.5" /> : <MousePointer className="w-3.5 h-3.5" />}
            {inlineEditMode ? "Direct Edit" : "View Only"}
          </button>

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
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-60"
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

      {/* Render error banner */}
      {editor.renderError && (
        <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 flex items-center gap-3 text-xs text-rose-300 flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
          <span>{editor.renderError}</span>
        </div>
      )}

      {/* Compatibility notices */}
      {editor.compatibilityReport?.hasTextBoxes && (
        <div className="px-4 py-1.5 bg-amber-500/8 border-b border-amber-500/15 flex items-center gap-2 text-xs text-amber-400/80 flex-shrink-0">
          <Info className="w-3 h-3" />
          <span>This resume contains text boxes — they are preserved in the output but cannot be edited inline.</span>
        </div>
      )}

      {/* ── WORKSPACE BODY ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <div className="w-[340px] flex-shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Resume Sections</span>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {editor.sections.length} sections · click to edit
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Editable
            </span>
          </div>

          {/* Section list + fields */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {editor.sections.map(section => {
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
                  {/* Section header */}
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
                        {section.fieldCount}
                      </span>
                      {isCollapsed ? (
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                    </div>
                  </button>

                  {/* Fields */}
                  {(!isCollapsed || isSelected) && (
                    <div className="px-3 pb-3 pt-1 space-y-2.5 border-t border-zinc-800/60">
                      {section.fields
                        .filter((f: any) => f.isEditable)
                        .map((field: any) => (
                          <FieldEditorItem
                            key={field._id}
                            field={field}
                            pendingValue={editor.pendingChanges[field._id]}
                            isHighlighted={editor.activeFieldId === field._id}
                            onChange={newVal =>
                              handleFieldChange(field._id, newVal, field.originalValue)
                            }
                            onFocus={() => handleSidebarFieldFocus(field._id)}
                          />
                        ))}

                      {section.fields.filter((f: any) => !f.isEditable).map((field: any) => (
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
                          No editable text in this section.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Original format is 100% preserved</span>
            </div>
          </div>
        </div>

        {/* ── CENTER CANVAS ── */}
        <div className="flex-1 flex flex-col bg-zinc-900 overflow-hidden relative">
          {/* Canvas sub-bar */}
          <div className="h-10 bg-zinc-950/80 border-b border-zinc-800/80 px-4 flex items-center justify-between flex-shrink-0 z-10">
            <div className="flex items-center space-x-2 text-xs text-zinc-400">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {inlineEditMode
                  ? "Click any text to edit directly in the canvas"
                  : "High-Fidelity Document Preview"}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => loadPreview(editor.latestVersionId || undefined)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-md transition cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>
          </div>

          {/* Scrollable canvas viewport */}
          <div className="flex-1 overflow-auto flex justify-center p-8 relative">
            {isLoadingPreview && (
              <div className="absolute top-12 z-20 flex items-center gap-2.5 px-4 py-2 bg-zinc-950/90 border border-zinc-800 rounded-full shadow-xl text-xs text-zinc-300 backdrop-blur-md">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                <span>Rendering document...</span>
              </div>
            )}

            {previewError ? (
              <div className="flex flex-col items-center justify-center my-auto p-8 text-center max-w-md bg-zinc-950/80 border border-zinc-800 rounded-2xl shadow-xl">
                <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
                <p className="text-sm font-semibold text-zinc-200 mb-1">Canvas Render Notice</p>
                <p className="text-xs text-zinc-400 mb-4">{previewError}</p>
                <p className="text-[11px] text-zinc-500 mb-4">
                  Your original document is safe and unchanged. You can still download it.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => loadPreview(editor.latestVersionId || undefined)}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition cursor-pointer"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={editor.downloadLatestVersion}
                    className="px-4 py-2 text-xs font-semibold bg-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Original
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="superdoc-wrapper w-full h-full flex justify-center"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center",
                  transition: "transform 0.15s ease",
                  opacity: isLoadingPreview && !hasPreviewLoaded ? 0.3 : 1,
                }}
              >
                <div className="bg-white shadow-2xl rounded-sm min-w-[794px] min-h-[1123px] text-zinc-900 overflow-hidden relative">
                  <SuperDocEditor document={docFile} />
                </div>
              </div>
            )}
          </div>

          {/* Floating zoom bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-zinc-950/95 border border-zinc-800 px-4 py-1.5 rounded-full shadow-2xl backdrop-blur-md z-10">
            <button
              onClick={() => setZoom(z => Math.max(50, z - 10))}
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
              onClick={() => setZoom(z => Math.min(200, z + 10))}
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
              title="Reset to 100%"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── RIGHT INFO PANEL ── */}
        {showInfoPanel && (
          <div className="w-72 flex-shrink-0 bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-hidden">
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
              {/* File info */}
              <div>
                <span className="text-zinc-500 font-semibold block mb-1">Original File</span>
                <span className="text-zinc-200 break-all font-mono text-[11px]">
                  {editor.workspace?.originalFilename}
                </span>
              </div>

              {/* Status */}
              <div>
                <span className="text-zinc-500 font-semibold block mb-1">Extraction Status</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Editing
                </span>
              </div>

              {/* Inline edit hint */}
              <div className="bg-indigo-500/8 border border-indigo-500/20 rounded-lg p-3">
                <p className="text-indigo-300 font-semibold text-[11px] mb-1">
                  {inlineEditMode ? "✎ Direct Editing Active" : "View Only Mode"}
                </p>
                <p className="text-zinc-500 text-[11px]">
                  {inlineEditMode
                    ? "Click any text in the document canvas to edit it directly."
                    : "Toggle 'Direct Edit' in the toolbar to enable inline canvas editing."}
                </p>
              </div>

              {/* Coverage stats */}
              {editor.workspace?.extractionCoverage && (
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <span className="text-zinc-400 font-semibold block">Mapped Elements</span>
                  {[
                    ["Paragraphs", `${editor.workspace.extractionCoverage.paragraphsMapped}/${editor.workspace.extractionCoverage.paragraphsDetected}`],
                    ["Tables", `${editor.workspace.extractionCoverage.tablesMapped}/${editor.workspace.extractionCoverage.tablesDetected}`],
                    ["Hyperlinks", `${editor.workspace.extractionCoverage.hyperlinksMapped}/${editor.workspace.extractionCoverage.hyperlinksDetected}`],
                    ["Images", `${editor.workspace.extractionCoverage.imagesPreserved} preserved`],
                    ["Lists", `${editor.workspace.extractionCoverage.listsMapped}/${editor.workspace.extractionCoverage.listsDetected}`],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between text-[11px]">
                      <span className="text-zinc-500">{label}</span>
                      <span className="text-zinc-300 font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Compatibility notices */}
              {(editor.compatibilityReport?.unsupportedFeatures?.length ?? 0) > 0 && (
                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-amber-400 font-semibold block mb-2">Compatibility Notes</span>
                  {(editor.compatibilityReport?.unsupportedFeatures ?? []).map((msg: string, i: number) => (
                    <p key={i} className="text-[11px] text-zinc-500 mb-1.5">• {msg}</p>
                  ))}
                </div>
              )}

              {/* Version history */}
              {editor.versions.length > 0 && (
                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-zinc-400 font-semibold block mb-2">Version History</span>
                  {editor.versions.slice(0, 5).map(v => (
                    <div key={v._id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 mb-2">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-200 font-bold">v{v.versionNumber}</span>
                        <span className="text-zinc-600">
                          {new Date(v.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-[10px] mt-0.5">{v.changeSummary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* SuperDoc wrapper customizations */
        .superdoc-wrapper * {
          /* Allow SuperDoc to manage its own internal CSS perfectly */
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Sub-component: FieldEditorItem
// Sidebar text/textarea editor for a single DOCX field.
// ─────────────────────────────────────────────────────────────────
interface FieldEditorItemProps {
  field: any;
  pendingValue?: string;
  isHighlighted?: boolean;
  onChange: (val: string) => void;
  onFocus?: () => void;
}

const FieldEditorItem: React.FC<FieldEditorItemProps> = ({
  field,
  pendingValue,
  isHighlighted,
  onChange,
  onFocus,
}) => {
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
    <div
      className={`space-y-1 rounded-lg p-1.5 transition-all ${
        isHighlighted ? "bg-indigo-500/8 ring-1 ring-indigo-500/30" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-zinc-400">{field.label}</label>
        {isModified && (
          <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
            edited
          </span>
        )}
      </div>

      {isMultiLine ? (
        <textarea
          value={localVal}
          onChange={handleChange}
          onFocus={onFocus}
          rows={Math.max(2, Math.min(6, Math.ceil(localVal.length / 36)))}
          className={`w-full p-2.5 text-xs rounded-lg border bg-zinc-900 outline-none transition font-sans leading-relaxed resize-none ${
            isHighlighted
              ? "border-indigo-500/60 text-zinc-100 focus:border-indigo-500"
              : isModified
              ? "border-indigo-500/40 text-zinc-100 focus:border-indigo-500"
              : "border-zinc-800 text-zinc-300 focus:border-zinc-700"
          }`}
        />
      ) : (
        <input
          type={field.fieldType === "hyperlink_url" ? "url" : "text"}
          value={localVal}
          onChange={handleChange}
          onFocus={onFocus}
          className={`w-full px-2.5 py-1.5 text-xs rounded-lg border bg-zinc-900 outline-none transition font-sans ${
            isHighlighted
              ? "border-indigo-500/60 text-zinc-100 focus:border-indigo-500"
              : isModified
              ? "border-indigo-500/40 text-zinc-100 focus:border-indigo-500"
              : "border-zinc-800 text-zinc-300 focus:border-zinc-700"
          }`}
        />
      )}

      {field.fieldType === "hyperlink_url" && (
        <p className="text-[10px] text-zinc-600">Updates the hyperlink target URL only</p>
      )}
    </div>
  );
};
