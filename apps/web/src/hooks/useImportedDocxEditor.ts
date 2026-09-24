import { useState, useCallback, useRef } from "react";
import {
  ImportedDocxApi,
  IDocxSection,
  IWorkspaceSummary,
  IDocxVersion,
  IFieldByParaIndex,
} from "../lib/importedDocxApi";

// ============================================================
// useImportedDocxEditor
// Central state manager for the DOCX import editor.
// Handles: field edits, undo/redo, autosave, render, versions,
//          fieldsByParagraphIndex (for inline canvas editing),
//          activeFieldId (sidebar ↔ canvas highlight sync).
// ============================================================

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "pending";

interface UndoEntry {
  fieldId: string;
  prevValue: string;
  nextValue: string;
}

interface EditorState {
  workspace: IWorkspaceSummary | null;
  sections: IDocxSection[];
  pendingChanges: Record<string, string>; // fieldId → proposedValue
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  versions: IDocxVersion[];
  latestVersionId: string | null;
  isRendering: boolean;
  renderError: string | null;
  validationWarnings: string[];
}

export function useImportedDocxEditor(workspaceId: string) {
  const [state, setState] = useState<EditorState>({
    workspace: null,
    sections: [],
    pendingChanges: {},
    saveStatus: "idle",
    lastSavedAt: null,
    versions: [],
    latestVersionId: null,
    isRendering: false,
    renderError: null,
    validationWarnings: [],
  });

  // Undo/redo stacks
  const undoStack = useRef<UndoEntry[]>([]);
  const redoStack = useRef<UndoEntry[]>([]);

  // Autosave debounce timer
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Paragraph-index → field lookup map (for DocxInlineEditLayer).
  // Keyed by "{documentPart}:{paragraphIndex}" or table variant.
  const fieldsByParaIndexRef = useRef<Record<string, IFieldByParaIndex>>({});

  // Active field ID for canvas ↔ sidebar highlight sync
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  // Compatibility report from backend
  const [compatibilityReport, setCompatibilityReport] = useState<{
    hasTextBoxes: boolean;
    hasImages: boolean;
    hasTables: boolean;
    hasHeaders: boolean;
    hasFooters: boolean;
    unsupportedFeatures: string[];
  } | null>(null);

  // --------------------------------------------------------
  // Load workspace data (sections, fields, para-index map)
  // --------------------------------------------------------
  const loadWorkspace = useCallback(async () => {
    try {
      const res = await ImportedDocxApi.getWorkspace(workspaceId);
      setState(prev => ({
        ...prev,
        workspace: res.workspace,
        sections: res.sections,
      }));
      if (res.fieldsByParagraphIndex) {
        fieldsByParaIndexRef.current = res.fieldsByParagraphIndex;
      }
      if (res.compatibilityReport) {
        setCompatibilityReport(res.compatibilityReport);
      }
    } catch (err: any) {
      console.error("[DocxEditor] Failed to load workspace:", err.message);
    }
  }, [workspaceId]);

  // --------------------------------------------------------
  // Load versions
  // --------------------------------------------------------
  const loadVersions = useCallback(async () => {
    try {
      const res = await ImportedDocxApi.getVersions(workspaceId);
      setState(prev => ({
        ...prev,
        versions: res.versions,
        latestVersionId: res.versions[0]?._id || null,
      }));
    } catch (err: any) {
      console.error("[DocxEditor] Failed to load versions:", err.message);
    }
  }, [workspaceId]);

  // --------------------------------------------------------
  // Save all pending changes & auto-render (Autosave)
  // --------------------------------------------------------
  const saveAllChanges = useCallback(async (snapshot: Record<string, string>) => {
    const entries = Object.entries(snapshot);
    if (entries.length === 0) return;
    
    setState(prev => ({ ...prev, saveStatus: "saving" }));
    try {
      // 1. Save all field changes
      for (const [fieldId, value] of entries) {
        await ImportedDocxApi.saveChange(workspaceId, fieldId, value);
      }
      
      // 2. Generate a new DOCX version so SuperDocEditor updates
      const result = await ImportedDocxApi.renderDocx(workspaceId);
      
      // 3. Update state, clearing ONLY the fields we just saved
      setState(prev => {
        const newPending = { ...prev.pendingChanges };
        for (const fieldId of Object.keys(snapshot)) {
          delete newPending[fieldId];
        }
        return {
          ...prev,
          saveStatus: "saved",
          lastSavedAt: new Date(),
          pendingChanges: newPending,
          latestVersionId: result.versionId,
        };
      });
    } catch (err: any) {
      console.error("[DocxEditor] Autosave failed:", err.message);
      setState(prev => ({ ...prev, saveStatus: "error" }));
      throw err;
    }
  }, [workspaceId]);

  // --------------------------------------------------------
  // Update a field value (triggers autosave + syncs para map)
  // --------------------------------------------------------
  const updateField = useCallback(
    (fieldId: string, newValue: string, originalValue: string) => {
      // Record undo entry
      const prev = state.pendingChanges[fieldId] ?? originalValue;
      undoStack.current.push({ fieldId, prevValue: prev, nextValue: newValue });
      redoStack.current = []; // Clear redo on new change

      // Update pending changes + sections
      setState(prev => {
        const newPending = { ...prev.pendingChanges, [fieldId]: newValue };
        
        // Debounced autosave (1500ms) - pass the CURRENT pending changes snapshot
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(() => {
          saveAllChanges(newPending).catch(console.error);
        }, 1500);

        return {
          ...prev,
          pendingChanges: newPending,
          saveStatus: "pending",
          sections: prev.sections.map(sec => ({
            ...sec,
            fields: sec.fields.map(f =>
              f._id === fieldId ? { ...f, currentValue: newValue } : f
            ),
          })),
        };
      });

      // Keep the para-index map's currentValue in sync
      for (const key of Object.keys(fieldsByParaIndexRef.current)) {
        if (fieldsByParaIndexRef.current[key].fieldId === fieldId) {
          fieldsByParaIndexRef.current[key] = {
            ...fieldsByParaIndexRef.current[key],
            currentValue: newValue,
          };
        }
      }
    },
    [state.pendingChanges, saveAllChanges]
  );


  // --------------------------------------------------------
  // Undo
  // --------------------------------------------------------
  const undo = useCallback(() => {
    const entry = undoStack.current.pop();
    if (!entry) return;
    redoStack.current.push(entry);

    setState(prev => ({
      ...prev,
      pendingChanges: { ...prev.pendingChanges, [entry.fieldId]: entry.prevValue },
      sections: prev.sections.map(sec => ({
        ...sec,
        fields: sec.fields.map(f =>
          f._id === entry.fieldId ? { ...f, currentValue: entry.prevValue } : f
        ),
      })),
      saveStatus: "pending",
    }));

    // Update para map
    for (const key of Object.keys(fieldsByParaIndexRef.current)) {
      if (fieldsByParaIndexRef.current[key].fieldId === entry.fieldId) {
        fieldsByParaIndexRef.current[key] = {
          ...fieldsByParaIndexRef.current[key],
          currentValue: entry.prevValue,
        };
      }
    }

    // Capture the NEW pending changes for the autosave snapshot
    const newPending = { ...state.pendingChanges, [entry.fieldId]: entry.prevValue };

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveAllChanges(newPending).catch(console.error);
    }, 1500);
  }, [state.pendingChanges, saveAllChanges]);

  // --------------------------------------------------------
  // Redo
  // --------------------------------------------------------
  const redo = useCallback(() => {
    const entry = redoStack.current.pop();
    if (!entry) return;
    undoStack.current.push(entry);

    setState(prev => ({
      ...prev,
      pendingChanges: { ...prev.pendingChanges, [entry.fieldId]: entry.nextValue },
      sections: prev.sections.map(sec => ({
        ...sec,
        fields: sec.fields.map(f =>
          f._id === entry.fieldId ? { ...f, currentValue: entry.nextValue } : f
        ),
      })),
      saveStatus: "pending",
    }));

    for (const key of Object.keys(fieldsByParaIndexRef.current)) {
      if (fieldsByParaIndexRef.current[key].fieldId === entry.fieldId) {
        fieldsByParaIndexRef.current[key] = {
          ...fieldsByParaIndexRef.current[key],
          currentValue: entry.nextValue,
        };
      }
    }

    // Capture the NEW pending changes for the autosave snapshot
    const newPending = { ...state.pendingChanges, [entry.fieldId]: entry.nextValue };

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveAllChanges(newPending).catch(console.error);
    }, 1500);
  }, [state.pendingChanges, saveAllChanges]);

  // --------------------------------------------------------
  // Render DOCX (flush pending changes + generate artifact)
  // --------------------------------------------------------
  const renderDocx = useCallback(async (): Promise<string | null> => {
    setState(prev => ({ ...prev, isRendering: true, renderError: null }));
    try {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
      await saveAllChanges(state.pendingChanges);

      const result = await ImportedDocxApi.renderDocx(workspaceId);
      setState(prev => ({
        ...prev,
        isRendering: false,
        latestVersionId: result.versionId,
        validationWarnings: result.warnings || [],
        saveStatus: "saved",
      }));
      await loadVersions();
      return result.versionId;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isRendering: false,
        renderError: err.message || "Failed to generate DOCX.",
      }));
      return null;
    }
  }, [workspaceId, saveAllChanges, loadVersions]);

  // --------------------------------------------------------
  // Download latest version
  // --------------------------------------------------------
  const downloadLatestVersion = useCallback(() => {
    const targetVersionId = state.latestVersionId || (state.versions.length > 0 ? state.versions[0]._id : null);
    const url = targetVersionId
      ? ImportedDocxApi.getDownloadUrl(workspaceId, targetVersionId)
      : ImportedDocxApi.getOriginalDownloadUrl(workspaceId);

    const token = localStorage.getItem("interviewai_token") || localStorage.getItem("token") || "";
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) throw new Error(`Download failed with status ${r.status}`);
        return r.blob();
      })
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        const filename = state.workspace?.originalFilename || "resume.docx";
        a.download = targetVersionId ? filename.replace(/\.docx$/i, "_edited.docx") : filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
      })
      .catch(err => {
        console.error("Download failed:", err);
      });
  }, [state.latestVersionId, state.versions, state.workspace, workspaceId]);

  // --------------------------------------------------------
  // Highlight a field (sidebar → canvas sync, canvas → sidebar)
  // --------------------------------------------------------
  const highlightField = useCallback((fieldId: string | null) => {
    setActiveFieldId(fieldId);
  }, []);

  // --------------------------------------------------------
  // Lookup field metadata by paragraph index key
  // Used by DocxInlineEditLayer for canvas → field mapping
  // --------------------------------------------------------
  const getFieldByParaKey = useCallback((key: string) => {
    return fieldsByParaIndexRef.current[key] || null;
  }, []);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;
  const hasPendingChanges = Object.keys(state.pendingChanges).length > 0;

  return {
    ...state,
    activeFieldId,
    compatibilityReport,
    fieldsByParaIndexRef,
    loadWorkspace,
    loadVersions,
    updateField,
    saveAllChanges,
    undo,
    redo,
    renderDocx,
    downloadLatestVersion,
    highlightField,
    getFieldByParaKey,
    canUndo,
    canRedo,
    hasPendingChanges,
  };
}
