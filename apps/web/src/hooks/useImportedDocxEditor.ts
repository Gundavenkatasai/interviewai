import { useState, useCallback, useRef } from "react";
import {
  ImportedDocxApi,
  IDocxSection,
  IDocxField,
  IWorkspaceSummary,
  IDocxVersion,
} from "../lib/importedDocxApi";

// ============================================================
// useImportedDocxEditor
// Central state manager for the DOCX import editor.
// Handles: field edits, undo/redo, autosave, render, versions.
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

  // --------------------------------------------------------
  // Load workspace data
  // --------------------------------------------------------
  const loadWorkspace = useCallback(async () => {
    try {
      const res = await ImportedDocxApi.getWorkspace(workspaceId);
      setState(prev => ({
        ...prev,
        workspace: res.workspace,
        sections: res.sections,
      }));
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
  // Update a field value (triggers autosave)
  // --------------------------------------------------------
  const updateField = useCallback(
    (fieldId: string, newValue: string, originalValue: string) => {
      // Record undo
      const prev = state.pendingChanges[fieldId] ?? originalValue;
      undoStack.current.push({ fieldId, prevValue: prev, nextValue: newValue });
      redoStack.current = []; // Clear redo on new change

      setState(prev => ({
        ...prev,
        pendingChanges: { ...prev.pendingChanges, [fieldId]: newValue },
        saveStatus: "pending",
      }));

      // Also update the field's currentValue in sections
      setState(prev => ({
        ...prev,
        sections: prev.sections.map(sec => ({
          ...sec,
          fields: sec.fields.map(f =>
            f._id === fieldId ? { ...f, currentValue: newValue } : f
          ),
        })),
      }));

      // Debounced autosave
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        persistChange(fieldId, newValue);
      }, 1500);
    },
    [state.pendingChanges, workspaceId]
  );

  // --------------------------------------------------------
  // Persist a single change to backend
  // --------------------------------------------------------
  const persistChange = useCallback(
    async (fieldId: string, proposedValue: string) => {
      setState(prev => ({ ...prev, saveStatus: "saving" }));
      try {
        await ImportedDocxApi.saveChange(workspaceId, fieldId, proposedValue);
        setState(prev => ({
          ...prev,
          saveStatus: "saved",
          lastSavedAt: new Date(),
        }));
      } catch (err: any) {
        console.error("[DocxEditor] Autosave failed:", err.message);
        setState(prev => ({ ...prev, saveStatus: "error" }));
      }
    },
    [workspaceId]
  );

  // --------------------------------------------------------
  // Save all pending changes
  // --------------------------------------------------------
  const saveAllChanges = useCallback(async () => {
    const entries = Object.entries(state.pendingChanges);
    if (entries.length === 0) return;
    setState(prev => ({ ...prev, saveStatus: "saving" }));
    try {
      for (const [fieldId, value] of entries) {
        await ImportedDocxApi.saveChange(workspaceId, fieldId, value);
      }
      setState(prev => ({
        ...prev,
        saveStatus: "saved",
        lastSavedAt: new Date(),
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, saveStatus: "error" }));
    }
  }, [state.pendingChanges, workspaceId]);

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
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      persistChange(entry.fieldId, entry.prevValue);
    }, 1500);
  }, [persistChange]);

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
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      persistChange(entry.fieldId, entry.nextValue);
    }, 1500);
  }, [persistChange]);

  // --------------------------------------------------------
  // Render DOCX (apply all changes + generate artifact)
  // --------------------------------------------------------
  const renderDocx = useCallback(async (): Promise<string | null> => {
    setState(prev => ({ ...prev, isRendering: true, renderError: null }));
    try {
      // First flush any pending debounced saves
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
      await saveAllChanges();

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

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;
  const hasPendingChanges = Object.keys(state.pendingChanges).length > 0;

  return {
    ...state,
    loadWorkspace,
    loadVersions,
    updateField,
    saveAllChanges,
    undo,
    redo,
    renderDocx,
    downloadLatestVersion,
    canUndo,
    canRedo,
    hasPendingChanges,
  };
}
