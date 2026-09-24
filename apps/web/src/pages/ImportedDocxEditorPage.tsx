import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Save, Download, History,
  Undo2, Redo2, RefreshCw, AlertTriangle, CheckCircle2,
  Loader2, FileText, Eye, EyeOff, Clock, X, Info,
  ChevronDown, ChevronUp, Wifi, WifiOff, Shield,
  ZoomIn, ZoomOut, Maximize2, Edit3, MousePointer
} from "lucide-react";
import { useImportedDocxEditor } from "../hooks/useImportedDocxEditor";
import { ImportedDocxApi, IDocxSection } from "../lib/importedDocxApi";
import {
  DocxInlineEditLayer,
  DocxInlineEditLayerHandle,
} from "../components/common/DocxInlineEditor";

// ============================================================
// ImportedDocxEditorPage
// Full three-panel workspace:
//   Left: Section list + editable fields sidebar (~300px)
//   Center: High-fidelity DOCX canvas (docx-preview — NOT Mammoth)
//   Right: collapsible info panel (coverage, versions)
// ============================================================

import * as docx from "docx-preview";

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

export default function ImportedDocxEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const editor = useImportedDocxEditor(id!);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"sections" | "versions" | "coverage">("sections");
  const [hasPreviewLoaded, setHasPreviewLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [inlineEditMode, setInlineEditMode] = useState(true);
  const inlineEditRef = useRef<DocxInlineEditLayerHandle>(null);

  // --------------------------------------------------------
  // Initial load
  // --------------------------------------------------------
  useEffect(() => {
    if (!id) return;
    editor.loadWorkspace();
    editor.loadVersions();
  }, [id]);

  // Set first section active after load
  useEffect(() => {
    if (editor.sections.length > 0 && !activeSectionId) {
      setActiveSectionId(editor.sections[0]._id);
    }
  }, [editor.sections]);

  // Load preview on mount
  useEffect(() => {
    if (!id) return;
    loadPreview();
  }, [id]);

  // --------------------------------------------------------
  // Canvas preview
  // --------------------------------------------------------
  const loadPreview = async (versionId?: string) => {
    if (!id) return;
    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      const res = await ImportedDocxApi.getPreview(id, versionId);
      if (containerRef.current) {
        const binaryStr = atob(res.docxBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        
        containerRef.current.innerHTML = "";
        
        await docx.renderAsync(bytes.buffer, containerRef.current, undefined, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          experimental: false, // stable rendering mode — consistent with DocxXeroxWorkspace
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        } as any);
        setHasPreviewLoaded(true);
        // Reattach inline editing after every canvas (re-)render
        if (inlineEditMode) {
          setTimeout(() => inlineEditRef.current?.reattach(), 150);
        }
      }
    } catch (err: any) {
      setPreviewError("Preview could not be rendered. The DOCX will still download correctly.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleRefreshPreview = () => loadPreview(editor.latestVersionId || undefined);

  // --------------------------------------------------------
  // Field editing
  // --------------------------------------------------------
  const handleFieldChange = useCallback((
    fieldId: string,
    newValue: string,
    originalValue: string
  ) => {
    editor.updateField(fieldId, newValue, originalValue);
    // Optimistic DOM update — no round-trip needed
    inlineEditRef.current?.applyOptimisticUpdate(fieldId, newValue);
  }, [editor.updateField]);

  // Canvas inline edit → editor + sidebar sync
  const handleInlineFieldChange = useCallback((
    fieldId: string,
    newValue: string,
    originalValue: string
  ) => {
    editor.updateField(fieldId, newValue, originalValue);
  }, [editor.updateField]);

  // Canvas focus → scroll sidebar to field
  const handleInlineFieldFocus = useCallback((fieldId: string) => {
    editor.highlightField(fieldId);
    for (const section of editor.sections) {
      if (section.fields.some((f: any) => f._id === fieldId)) {
        setActiveSectionId(section._id);
        break;
      }
    }
  }, [editor]);

  // Sidebar focus → scroll canvas
  const handleSidebarFieldFocus = useCallback((fieldId: string) => {
    editor.highlightField(fieldId);
    inlineEditRef.current?.scrollToField(fieldId);
  }, [editor]);

  // --------------------------------------------------------
  // Generate + download
  // --------------------------------------------------------
  const handleGenerateAndDownload = async () => {
    const versionId = await editor.renderDocx();
    if (versionId) {
      await loadPreview(versionId);
      editor.downloadLatestVersion();
    }
  };

  const handleSaveAndPreview = async () => {
    const versionId = await editor.renderDocx();
    if (versionId) {
      await loadPreview(versionId);
    }
  };

  // --------------------------------------------------------
  // UI Helpers
  // --------------------------------------------------------
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
    pending: <Clock size={13} color="#f59e0b" />,
    saving: <Loader2 size={13} color="#7c3aed" style={{ animation: "spin 1s linear infinite" }} />,
    saved: <CheckCircle2 size={13} color="#22c55e" />,
    error: <AlertTriangle size={13} color="#ef4444" />,
  }[editor.saveStatus];

  const saveStatusText = {
    idle: "",
    pending: "Unsaved changes",
    saving: "Saving...",
    saved: "All changes saved",
    error: "Save failed",
  }[editor.saveStatus];

  const activeSection = editor.sections.find(s => s._id === activeSectionId);

  if (!editor.workspace && !editor.sections.length) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} color="#7c3aed" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0a0f1e", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden" }}>

      {/* ── TOP TOOLBAR ── */}
      <div style={{ height: 56, background: "rgba(15,23,42,0.95)", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0, backdropFilter: "blur(12px)" }}>
        {/* Back */}
        <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: "6px 8px", borderRadius: 8 }}>
          <ChevronLeft size={16} /> Resume Studio
        </button>

        <div style={{ width: 1, height: 24, background: "#1e293b" }} />

        {/* File name */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={16} color="#7c3aed" />
          <span style={{ fontWeight: 600, fontSize: 14, color: "#e2e8f0" }}>
            {editor.workspace?.originalFilename || "Imported Resume"}
          </span>
        </div>

        {/* Save status */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 4 }}>
          {saveStatusIcon}
          <span style={{ fontSize: 12, color: "#64748b" }}>{saveStatusText}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Undo / Redo */}
        <button
          onClick={editor.undo}
          disabled={!editor.canUndo}
          title="Undo"
          style={{ background: "none", border: "none", cursor: editor.canUndo ? "pointer" : "not-allowed", color: editor.canUndo ? "#94a3b8" : "#334155", padding: 8, borderRadius: 8 }}
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={editor.redo}
          disabled={!editor.canRedo}
          title="Redo"
          style={{ background: "none", border: "none", cursor: editor.canRedo ? "pointer" : "not-allowed", color: editor.canRedo ? "#94a3b8" : "#334155", padding: 8, borderRadius: 8 }}
        >
          <Redo2 size={18} />
        </button>

        <div style={{ width: 1, height: 24, background: "#1e293b" }} />

        {/* Save + Preview */}
        <button
          onClick={handleSaveAndPreview}
          disabled={editor.isRendering || !editor.hasPendingChanges}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 16px",
            background: editor.hasPendingChanges ? "rgba(124,58,237,0.15)" : "transparent",
            border: "1px solid " + (editor.hasPendingChanges ? "#7c3aed" : "#1e293b"),
            borderRadius: 10,
            color: editor.hasPendingChanges ? "#a78bfa" : "#475569",
            fontSize: 13,
            fontWeight: 600,
            cursor: editor.hasPendingChanges && !editor.isRendering ? "pointer" : "not-allowed"
          }}
        >
          {editor.isRendering ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Eye size={14} />}
          Save & Preview
        </button>

        {/* Download DOCX */}
        <button
          onClick={handleGenerateAndDownload}
          disabled={editor.isRendering}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 18px",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            border: "none",
            borderRadius: 10,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: editor.isRendering ? "not-allowed" : "pointer",
            opacity: editor.isRendering ? 0.7 : 1,
            boxShadow: "0 0 20px rgba(124,58,237,0.25)"
          }}
        >
          {editor.isRendering ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={14} />}
          Download DOCX
        </button>

        {/* Version history */}
        <button
          onClick={() => { setShowVersionHistory(v => !v); setInfoPanelOpen(true); setActiveTab("versions"); }}
          title="Version History"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 8, borderRadius: 8 }}
        >
          <History size={18} />
        </button>

        {/* Toggle info panel */}
        <button
          onClick={() => setInfoPanelOpen(v => !v)}
          title="Info panel"
          style={{ background: "none", border: "none", cursor: "pointer", color: infoPanelOpen ? "#7c3aed" : "#64748b", padding: 8, borderRadius: 8 }}
        >
          <Info size={18} />
        </button>
      </div>

      {/* ── RENDER ERRORS ── */}
      {editor.renderError && (
        <div style={{ padding: "8px 20px", background: "rgba(239,68,68,0.12)", borderBottom: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={14} color="#f87171" />
            <span style={{ color: "#f87171", fontSize: 13 }}>{editor.renderError}</span>
          </div>
          <button onClick={() => {}} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}><X size={14} /></button>
        </div>
      )}

      {/* ── MAIN WORKSPACE ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT SIDEBAR ── */}
        {sidebarOpen && (
          <div style={{ width: 300, flexShrink: 0, background: "rgba(15,23,42,0.95)", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Sidebar header */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", letterSpacing: "0.04em", textTransform: "uppercase" }}>Sections</span>
              <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 4 }}>
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* Section list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {editor.sections.map(section => (
                <div key={section._id}>
                  {/* Section title */}
                  <button
                    onClick={() => {
                      setActiveSectionId(section._id);
                      toggleSection(section._id);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 16px",
                      background: activeSectionId === section._id ? "rgba(124,58,237,0.12)" : "transparent",
                      border: "none",
                      borderLeft: `3px solid ${activeSectionId === section._id ? (SECTION_COLORS[section.sectionType] || "#7c3aed") : "transparent"}`,
                      cursor: "pointer",
                      color: activeSectionId === section._id ? "#e2e8f0" : "#94a3b8",
                      fontSize: 13,
                      fontWeight: activeSectionId === section._id ? 600 : 400,
                      textAlign: "left",
                      transition: "all 0.15s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: SECTION_COLORS[section.sectionType] || "#475569" }} />
                      <span>{section.sectionTitle}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: "#475569", background: "#1e293b", borderRadius: 6, padding: "2px 6px" }}>{section.fieldCount}</span>
                      {collapsedSections.has(section._id) ? <ChevronDown size={14} color="#475569" /> : <ChevronUp size={14} color="#475569" />}
                    </div>
                  </button>

                  {/* Fields within section */}
                  {activeSectionId === section._id && !collapsedSections.has(section._id) && (
                    <div style={{ padding: "8px 14px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                      {section.fields.filter(f => f.isEditable).map(field => (
                        <FieldEditor
                          key={field._id}
                          field={field}
                          onChange={(val) => handleFieldChange(field._id, val, field.originalValue)}
                        />
                      ))}
                      {section.fields.filter(f => !f.isEditable).map(field => (
                        <div key={field._id} style={{ padding: "8px 10px", background: "rgba(71,85,105,0.1)", borderRadius: 8, border: "1px solid #1e293b" }}>
                          <span style={{ fontSize: 11, color: "#475569" }}>{field.label}</span>
                          <p style={{ fontSize: 12, color: "#475569", margin: "4px 0 0", fontStyle: "italic" }}>{field.editWarning || "Read-only"}</p>
                        </div>
                      ))}
                      {section.fields.length === 0 && (
                        <p style={{ fontSize: 12, color: "#475569", padding: "4px 0" }}>No editable fields in this section.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Sidebar footer: immutability badge */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={13} color="#22c55e" />
              <span style={{ fontSize: 11, color: "#475569" }}>Original resume is immutable</span>
            </div>
          </div>
        )}

        {/* Sidebar toggle when closed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ width: 24, flexShrink: 0, background: "#0f172a", border: "none", borderRight: "1px solid #1e293b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}
          >
            <ChevronRight size={14} />
          </button>
        )}

        {/* ── CENTER CANVAS ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#111827" }}>
          {/* Canvas toolbar */}
          <div style={{ height: 40, background: "rgba(15,23,42,0.8)", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", padding: "0 16px", gap: 10, flexShrink: 0 }}>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}><ZoomIn size={15} /></button>
            <span style={{ color: "#64748b", fontSize: 12, minWidth: 38, textAlign: "center" }}>{zoom}%</span>
            <button onClick={() => setZoom(z => Math.max(50, z - 10))} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}><ZoomOut size={15} /></button>
            <button onClick={() => setZoom(100)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4, fontSize: 11 }}>Fit</button>
            <div style={{ flex: 1 }} />
            <button onClick={handleRefreshPreview} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px solid #1e293b", borderRadius: 8, color: "#64748b", cursor: "pointer", padding: "4px 10px", fontSize: 12 }}>
              <RefreshCw size={12} /> Refresh Preview
            </button>
            <button
              onClick={() => setInlineEditMode(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 5, background: inlineEditMode ? "rgba(34,197,94,0.1)" : "none", border: `1px solid ${inlineEditMode ? "#22c55e" : "#1e293b"}`, borderRadius: 8, color: inlineEditMode ? "#4ade80" : "#64748b", cursor: "pointer", padding: "4px 10px", fontSize: 12 }}
              title={inlineEditMode ? "Inline editing ON" : "View Only"}
            >
              {inlineEditMode ? <Edit3 size={12} /> : <MousePointer size={12} />}
              {inlineEditMode ? "Direct Edit" : "View Only"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569" }}>
              <Eye size={12} />
              High-Fidelity Preview
            </div>
          </div>

          {/* Canvas content */}
          <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", padding: "32px 24px", background: "#1a1f2e", position: "relative" }}>
            {isLoadingPreview && (
              <div style={{ position: "absolute", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "rgba(26, 31, 46, 0.8)", padding: "20px 40px", borderRadius: 16, top: 100 }}>
                <Loader2 size={28} color="#7c3aed" style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 500 }}>Rendering high-fidelity preview…</span>
              </div>
            )}
            
            {previewError ? (
              <div style={{ maxWidth: 480, textAlign: "center", padding: 40 }}>
                <AlertTriangle size={36} color="#f59e0b" style={{ marginBottom: 12 }} />
                <p style={{ color: "#94a3b8", fontSize: 14 }}>{previewError}</p>
              </div>
            ) : (
              <div style={{ 
                transformOrigin: "top center", 
                transform: `scale(${zoom / 100})`, 
                transition: "transform 0.15s ease",
                opacity: isLoadingPreview ? 0.3 : 1,
                display: hasPreviewLoaded || isLoadingPreview ? "block" : "none"
              }}>
                <div
                  ref={containerRef}
                  className="docx-preview-canvas"
                  style={{
                    boxShadow: "0 4px 60px rgba(0,0,0,0.6)",
                    borderRadius: 4,
                    minWidth: 794,
                    minHeight: 1123,
                    background: "#fff"
                  }}
                />
              </div>
            )}

            {!hasPreviewLoaded && !isLoadingPreview && !previewError && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <FileText size={40} color="#334155" />
                <span style={{ color: "#475569", fontSize: 13 }}>No preview loaded yet.</span>
                <button onClick={handleRefreshPreview} style={{ color: "#7c3aed", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>Load Preview</button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT INFO PANEL ── */}
        {infoPanelOpen && (
          <div style={{ width: 280, flexShrink: 0, background: "rgba(15,23,42,0.95)", borderLeft: "1px solid #1e293b", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: "1px solid #1e293b" }}>
              {(["coverage", "versions"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "12px 0", background: "none", border: "none", cursor: "pointer", color: activeTab === tab ? "#a78bfa" : "#475569", fontWeight: activeTab === tab ? 700 : 400, fontSize: 12, borderBottom: activeTab === tab ? "2px solid #7c3aed" : "2px solid transparent", textTransform: "capitalize" }}>
                  {tab}
                </button>
              ))}
              <button onClick={() => setInfoPanelOpen(false)} style={{ padding: "12px 12px", background: "none", border: "none", color: "#475569", cursor: "pointer" }}><X size={14} /></button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {activeTab === "coverage" && editor.workspace?.extractionCoverage && (
                <CoveragePanel coverage={editor.workspace.extractionCoverage} warnings={editor.workspace.warnings || []} />
              )}
              {activeTab === "versions" && (
                <VersionsPanel
                  versions={editor.versions}
                  workspaceId={id!}
                  onPreviewVersion={(vId) => loadPreview(vId)}
                  onDownloadVersion={(vId) => {
                    const url = ImportedDocxApi.getDownloadUrl(id!, vId);
                    const token = localStorage.getItem("interviewai_token") || "";
                    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                      .then(r => r.blob())
                      .then(blob => {
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(blob);
                        a.download = `resume_v${vId}.docx`;
                        a.click();
                      });
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Inline Edit Layer — attached to docx-preview canvas DOM */}
      {inlineEditMode && (
        <DocxInlineEditLayer
          ref={inlineEditRef}
          containerRef={containerRef}
          fieldsByParaIndexRef={editor.fieldsByParaIndexRef}
          onFieldChange={handleInlineFieldChange}
          onFieldFocus={handleInlineFieldFocus}
          enabled={inlineEditMode && !isLoadingPreview}
          activeFieldId={editor.activeFieldId}
          pendingChanges={editor.pendingChanges}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .docx-preview-canvas h1, .docx-preview-canvas h2, .docx-preview-canvas h3 { margin: 0.8em 0 0.3em; }
        .docx-preview-canvas p { margin: 0.2em 0; }
        .docx-preview-canvas table { border-collapse: collapse; width: 100%; }
        .docx-preview-canvas td, .docx-preview-canvas th { border: 1px solid #ccc; padding: 4px 8px; vertical-align: top; }
        .docx-preview-canvas a { color: #0563c1; }
        .docx-preview-canvas ul, .docx-preview-canvas ol { padding-left: 20px; }
      `}</style>
    </div>
  );
}

// ============================================================
// Sub-component: FieldEditor
// ============================================================
function FieldEditor({ field, onChange }: { field: any; onChange: (val: string) => void }) {
  const [value, setValue] = useState(field.currentValue);
  const isModified = value !== field.originalValue;

  const handleChange = (v: string) => {
    setValue(v);
    onChange(v);
  };

  const isMultiLine = field.fieldType === "bullet" || field.fieldType === "text" || field.fieldType === "table_cell";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{field.label}</label>
        {isModified && <span style={{ fontSize: 10, color: "#a78bfa", background: "rgba(124,58,237,0.1)", borderRadius: 4, padding: "1px 5px" }}>edited</span>}
      </div>
      {isMultiLine ? (
        <textarea
          value={value}
          onChange={e => handleChange(e.target.value)}
          rows={Math.max(2, Math.ceil(value.length / 40))}
          style={{
            width: "100%",
            background: isModified ? "rgba(124,58,237,0.06)" : "#0f172a",
            border: `1px solid ${isModified ? "#7c3aed" : "#1e293b"}`,
            borderRadius: 8,
            color: "#e2e8f0",
            fontSize: 12,
            padding: "8px 10px",
            resize: "vertical",
            fontFamily: "inherit",
            lineHeight: 1.5,
            boxSizing: "border-box"
          }}
        />
      ) : (
        <input
          type={field.fieldType === "hyperlink_url" ? "url" : "text"}
          value={value}
          onChange={e => handleChange(e.target.value)}
          style={{
            width: "100%",
            background: isModified ? "rgba(124,58,237,0.06)" : "#0f172a",
            border: `1px solid ${isModified ? "#7c3aed" : "#1e293b"}`,
            borderRadius: 8,
            color: "#e2e8f0",
            fontSize: 12,
            padding: "7px 10px",
            fontFamily: "inherit",
            boxSizing: "border-box"
          }}
        />
      )}
      {field.fieldType === "hyperlink_url" && (
        <span style={{ fontSize: 10, color: "#475569" }}>Hyperlink URL — updates the link target only</span>
      )}
    </div>
  );
}

// ============================================================
// Sub-component: CoveragePanel
// ============================================================
function CoveragePanel({ coverage, warnings }: { coverage: any; warnings: string[] }) {
  const pct = Math.round((coverage.paragraphsMapped / Math.max(coverage.paragraphsDetected, 1)) * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Extraction Coverage</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: pct > 90 ? "#22c55e" : pct > 70 ? "#f59e0b" : "#ef4444" }}>{pct}%</span>
        </div>
        <div style={{ height: 6, background: "#1e293b", borderRadius: 3 }}>
          <div style={{ height: 6, width: `${pct}%`, background: pct > 90 ? "#22c55e" : pct > 70 ? "#f59e0b" : "#ef4444", borderRadius: 3, transition: "width 0.5s" }} />
        </div>
      </div>
      {[
        ["Paragraphs", `${coverage.paragraphsMapped}/${coverage.paragraphsDetected}`],
        ["Tables", `${coverage.tablesMapped}/${coverage.tablesDetected}`],
        ["Hyperlinks", `${coverage.hyperlinksMapped}/${coverage.hyperlinksDetected}`],
        ["Images", `${coverage.imagesPreserved} preserved`],
        ["Lists", `${coverage.listsMapped}/${coverage.listsDetected}`],
        ["Text boxes", `${coverage.textBoxesDetected} (read-only)`],
      ].map(([label, val]) => (
        <div key={label as string} style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>{label as string}</span>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{val as string}</span>
        </div>
      ))}
      {warnings.length > 0 && (
        <div style={{ marginTop: 8, borderTop: "1px solid #1e293b", paddingTop: 12 }}>
          <span style={{ fontSize: 11, color: "#f59e0b", display: "block", marginBottom: 6, fontWeight: 600 }}>Notes</span>
          {warnings.map((w, i) => <p key={i} style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0" }}>• {w}</p>)}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sub-component: VersionsPanel
// ============================================================
function VersionsPanel({ versions, workspaceId, onPreviewVersion, onDownloadVersion }: {
  versions: any[];
  workspaceId: string;
  onPreviewVersion: (vId: string) => void;
  onDownloadVersion: (vId: string) => void;
}) {
  if (!versions.length) {
    return <p style={{ color: "#475569", fontSize: 13, textAlign: "center", marginTop: 24 }}>No versions yet. Save changes and click Download to create your first version.</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {versions.map(v => (
        <div key={v._id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 13 }}>v{v.versionNumber}</span>
            <span style={{ fontSize: 11, color: "#475569" }}>{new Date(v.createdAt).toLocaleDateString()}</span>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 10px" }}>{v.changeSummary}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onPreviewVersion(v._id)} style={{ flex: 1, padding: "5px 0", background: "rgba(124,58,237,0.1)", border: "1px solid #7c3aed", borderRadius: 7, color: "#a78bfa", fontSize: 12, cursor: "pointer" }}>
              <Eye size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />Preview
            </button>
            <button onClick={() => onDownloadVersion(v._id)} style={{ flex: 1, padding: "5px 0", background: "#7c3aed", border: "none", borderRadius: 7, color: "#fff", fontSize: 12, cursor: "pointer" }}>
              <Download size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />Download
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
