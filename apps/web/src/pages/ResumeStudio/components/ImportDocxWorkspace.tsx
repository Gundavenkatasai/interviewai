import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, FileText, CheckCircle2, AlertTriangle, X,
  ArrowRight, Loader2, Shield, Eye, Table2, Link2,
  Image, AlignLeft, Info
} from "lucide-react";
import { ImportedDocxApi, IExtractionCoverage } from "../../../lib/importedDocxApi";

// ============================================================
// ImportDocxWorkspace
// Shown under ATS Resume Templates → Import tab.
// Handles file selection, upload, progress, and coverage display.
// ============================================================

const IMPORT_STEPS = [
  "Uploading file...",
  "Validating DOCX structure...",
  "Reading OOXML document parts...",
  "Extracting paragraphs, runs & tables...",
  "Detecting sections...",
  "Building source mappings...",
  "Calculating extraction coverage...",
  "Preparing editor workspace..."
];

interface Props {
  onBack: () => void;
  onOpenWorkspace?: (workspaceId: string) => void;
}

export const ImportDocxWorkspace: React.FC<Props> = ({ onBack, onOpenWorkspace }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStep, setImportStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<IExtractionCoverage | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith(".docx")) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError("Only .docx files are supported.");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  }, []);

  const handleImport = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    setError(null);
    setImportStep(0);

    // Simulate step-by-step progress
    const stepInterval = setInterval(() => {
      setImportStep(prev => {
        if (prev < IMPORT_STEPS.length - 2) return prev + 1;
        return prev;
      });
    }, 600);

    try {
      const result = await ImportedDocxApi.importDocx(selectedFile);
      clearInterval(stepInterval);
      setImportStep(IMPORT_STEPS.length - 1);

      if (result.success) {
        setCoverage(result.coverage || {
          paragraphsDetected: 1,
          paragraphsMapped: 1,
          runsDetected: 1,
          runsMapped: 1,
          tablesDetected: 0,
          tablesMapped: 0,
          headersDetected: 0,
          headersMapped: 0,
          footersDetected: 0,
          footersMapped: 0,
          imagesPreserved: 0,
          hyperlinksDetected: 0,
          hyperlinksMapped: 0,
          textBoxesDetected: 0,
          listsDetected: 0,
          listsMapped: 0
        });
        setWarnings(result.warnings || []);
        setWorkspaceId(result.workspaceId);
        setWorkspaceName(result.name || selectedFile.name);
        if (result.duplicate) {
          setWarnings(prev => ["Opening existing workspace for this file.", ...prev]);
        }
        if (onOpenWorkspace) {
          setTimeout(() => {
            onOpenWorkspace(result.workspaceId);
          }, 600);
        }
      } else {
        throw new Error("Import failed.");
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message || "We couldn't read this DOCX. The file may be corrupted or use an unsupported format.");
      setIsImporting(false);
    }
  };

  const handleOpenEditor = () => {
    if (workspaceId) {
      if (onOpenWorkspace) {
        onOpenWorkspace(workspaceId);
      } else {
        navigate(`?mode=templates&importedId=${workspaceId}`);
      }
    }
  };

  const coveragePct = coverage
    ? Math.round((coverage.paragraphsMapped / Math.max(coverage.paragraphsDetected, 1)) * 100)
    : 0;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "40px 24px" }}>

      {/* Header */}
      <div style={{ width: "100%", maxWidth: 760, marginBottom: 32 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", fontSize: 14, marginBottom: 24 }}>
          ← Back to Templates
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Import Your Resume</h1>
        <p style={{ color: "#94a3b8", marginTop: 8, fontSize: 15 }}>
          Upload your existing <strong style={{ color: "#a78bfa" }}>.docx</strong> resume. Your original formatting, tables, columns, fonts and images will be preserved.
        </p>
      </div>

      {/* Upload Zone */}
      {!isImporting && !workspaceId && (
        <div style={{ width: "100%", maxWidth: 760, display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "#7c3aed" : selectedFile ? "#22c55e" : "#334155"}`,
              borderRadius: 16,
              padding: "48px 32px",
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? "rgba(124,58,237,0.07)" : selectedFile ? "rgba(34,197,94,0.05)" : "rgba(30,41,59,0.6)",
              transition: "all 0.2s ease",
              backdropFilter: "blur(12px)"
            }}
          >
            <input ref={fileInputRef} type="file" accept=".docx" style={{ display: "none" }} onChange={handleFileSelect} />
            {selectedFile ? (
              <>
                <CheckCircle2 size={48} color="#22c55e" style={{ marginBottom: 12 }} />
                <p style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 16, margin: 0 }}>{selectedFile.name}</p>
                <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>{(selectedFile.size / 1024).toFixed(1)} KB — Click to change</p>
              </>
            ) : (
              <>
                <Upload size={48} color="#475569" style={{ marginBottom: 12 }} />
                <p style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 16, margin: 0 }}>Drag & drop your .DOCX resume here</p>
                <p style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>or click to choose a file</p>
                <p style={{ color: "#475569", fontSize: 12, marginTop: 12 }}>Maximum 10 MB · .docx only</p>
              </>
            )}
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <AlertTriangle size={16} color="#f87171" />
              <span style={{ color: "#f87171", fontSize: 14 }}>{error}</span>
            </div>
          )}

          {/* Guarantee Banner */}
          <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <Shield size={20} color="#a78bfa" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ color: "#c4b5fd", fontWeight: 600, fontSize: 13, margin: 0 }}>Your original is immutable</p>
              <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>The uploaded file is stored securely and never modified. All edits are applied to a copy.</p>
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={!selectedFile}
            style={{
              padding: "14px 32px",
              background: selectedFile ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "#1e293b",
              color: selectedFile ? "#fff" : "#475569",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: selectedFile ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s"
            }}
          >
            Import & Analyse <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Progress View */}
      {isImporting && !workspaceId && (
        <div style={{ width: "100%", maxWidth: 600, background: "rgba(15,23,42,0.8)", border: "1px solid #1e293b", borderRadius: 20, padding: 40, backdropFilter: "blur(12px)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <Loader2 size={36} color="#7c3aed" style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
            <h2 style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700, margin: 0 }}>Processing your resume...</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {IMPORT_STEPS.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {i < importStep ? (
                  <CheckCircle2 size={18} color="#22c55e" />
                ) : i === importStep ? (
                  <Loader2 size={18} color="#7c3aed" style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #334155" }} />
                )}
                <span style={{ color: i <= importStep ? "#e2e8f0" : "#475569", fontSize: 14 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success / Coverage View */}
      {workspaceId && coverage && (
        <div style={{ width: "100%", maxWidth: 760, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Success banner */}
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
            <CheckCircle2 size={32} color="#22c55e" />
            <div>
              <h2 style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, margin: 0 }}>{workspaceName}</h2>
              <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Import complete — {coveragePct}% of content mapped for editing</p>
            </div>
          </div>

          {/* Coverage Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
            {[
              { icon: AlignLeft, label: "Paragraphs", val: `${coverage.paragraphsMapped}/${coverage.paragraphsDetected}`, ok: coverage.paragraphsMapped === coverage.paragraphsDetected },
              { icon: Table2, label: "Tables", val: `${coverage.tablesMapped}/${coverage.tablesDetected}`, ok: true },
              { icon: Link2, label: "Hyperlinks", val: `${coverage.hyperlinksMapped}/${coverage.hyperlinksDetected}`, ok: true },
              { icon: Image, label: "Images", val: `${coverage.imagesPreserved} preserved`, ok: true },
              { icon: AlignLeft, label: "List items", val: `${coverage.listsMapped}/${coverage.listsDetected}`, ok: true },
              { icon: Eye, label: "Text boxes", val: coverage.textBoxesDetected > 0 ? `${coverage.textBoxesDetected} (read-only)` : "None", ok: true },
            ].map(({ icon: Icon, label, val, ok }) => (
              <div key={label} style={{ background: "rgba(15,23,42,0.7)", border: "1px solid #1e293b", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Icon size={14} color={ok ? "#22c55e" : "#f59e0b"} />
                  <span style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                </div>
                <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 15 }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Info size={14} color="#fbbf24" />
                <span style={{ color: "#fbbf24", fontSize: 13, fontWeight: 600 }}>Notes</span>
              </div>
              {warnings.map((w, i) => (
                <p key={i} style={{ color: "#d97706", fontSize: 13, margin: "4px 0" }}>• {w}</p>
              ))}
            </div>
          )}

          <button
            onClick={handleOpenEditor}
            style={{
              padding: "16px 36px",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: "0 0 30px rgba(124,58,237,0.3)",
              transition: "all 0.2s"
            }}
          >
            Open in Editor <ArrowRight size={20} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
