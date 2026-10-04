import { create } from "zustand";
import { IResume, IResumeSectionConfig, IResumeTheme, IResumeLayout, ResumeTemplateId } from "../types/resume";
import { ApiClient } from "../../../lib/api";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error" | "offline";

export interface IConflictData {
  serverRevision?: number;
  serverVersion?: number;
  serverUpdatedAt?: string;
  serverResume?: IResume;
}

interface ResumeState {
  // State
  resume: IResume | null;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  lastSavedAt: string | null;
  autoSaveStatus: AutoSaveStatus;
  autoSaveError: string | null;
  
  // Optimistic Concurrency & Offline State
  conflictData: IConflictData | null;
  hasLocalDraft: boolean;
  localDraftTimestamp: number | null;

  // Selection
  activeSection: string | null;
  
  // Undo/Redo Stacks
  history: IResume[];
  future: IResume[];
  
  // Core Actions
  setResume: (resume: IResume) => void;
  setName: (name: string) => void;
  updateProfileData: (path: string, value: any) => void;
  updateTheme: (theme: Partial<IResumeTheme>) => void;
  updateLayout: (layout: Partial<IResumeLayout>) => void;
  setTemplate: (templateId: ResumeTemplateId) => void;
  updateSectionOrder: (sections: IResumeSectionConfig[]) => void;
  setActiveSection: (sectionId: string | null) => void;
  
  // Autosave & Persistence Actions
  saveDraft: (isManualSnapshot?: boolean) => Promise<boolean>;
  scheduleAutoSave: () => void;
  resolveConflict: (choice: "local" | "server") => Promise<void>;
  checkLocalDraft: (resumeId: string) => boolean;
  restoreLocalDraft: () => void;
  discardLocalDraft: () => void;

  // History Actions
  undo: () => void;
  redo: () => void;
  saveHistorySnapshot: () => void;
}

let autoSaveTimer: NodeJS.Timeout | null = null;

export const useResumeStore = create<ResumeState>((set, get) => ({
  resume: null,
  isLoading: true,
  isSaving: false,
  isDirty: false,
  lastSavedAt: null,
  autoSaveStatus: "idle",
  autoSaveError: null,
  conflictData: null,
  hasLocalDraft: false,
  localDraftTimestamp: null,
  activeSection: null,
  
  history: [],
  future: [],

  setResume: (resume) => {
    set({
      resume,
      isLoading: false,
      isDirty: false,
      autoSaveStatus: "idle",
      autoSaveError: null,
      conflictData: null
    });
    // Check if there is an unsaved local draft for this resume
    get().checkLocalDraft(resume._id);
  },

  checkLocalDraft: (resumeId: string) => {
    try {
      const stored = localStorage.getItem(`resume_draft_${resumeId}`);
      if (!stored) {
        set({ hasLocalDraft: false, localDraftTimestamp: null });
        return false;
      }
      const parsed = JSON.parse(stored);
      const { resume } = get();
      if (!resume) return false;

      const serverUpdated = resume.updatedAt ? new Date(resume.updatedAt).getTime() : 0;
      if (parsed.timestamp && parsed.timestamp > serverUpdated + 2000) {
        set({ hasLocalDraft: true, localDraftTimestamp: parsed.timestamp });
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  restoreLocalDraft: () => {
    try {
      const { resume } = get();
      if (!resume) return;
      const stored = localStorage.getItem(`resume_draft_${resume._id}`);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed.draft) {
        get().saveHistorySnapshot();
        set({
          resume: { ...parsed.draft, _id: resume._id },
          isDirty: true,
          hasLocalDraft: false,
          localDraftTimestamp: null,
          autoSaveStatus: "idle"
        });
        get().scheduleAutoSave();
      }
    } catch (e) {
      console.error("Failed to restore local draft:", e);
    }
  },

  discardLocalDraft: () => {
    const { resume } = get();
    if (resume) {
      localStorage.removeItem(`resume_draft_${resume._id}`);
    }
    set({ hasLocalDraft: false, localDraftTimestamp: null });
  },

  setActiveSection: (sectionId) => set({ activeSection: sectionId }),

  saveHistorySnapshot: () => {
    try {
      const { resume, history } = get();
      if (!resume) return;
      
      const newHistory = [...history, JSON.parse(JSON.stringify(resume))].slice(-25);
      set({ history: newHistory, future: [] });
    } catch (err) {
      console.error("Failed to save history snapshot", err);
    }
  },

  scheduleAutoSave: () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // Backup to local storage immediately in case of browser refresh / tab crash
    const { resume } = get();
    if (resume && resume._id) {
      try {
        localStorage.setItem(`resume_draft_${resume._id}`, JSON.stringify({
          draft: resume,
          timestamp: Date.now(),
          revision: resume.revision || 1
        }));
      } catch (e) {
        // LocalStorage full or private browsing
      }
    }

    // Debounce backend save by 1500ms
    autoSaveTimer = setTimeout(() => {
      get().saveDraft(false);
    }, 1500);
  },

  setName: (name: string) => {
    const { resume, saveHistorySnapshot, scheduleAutoSave } = get();
    if (!resume) return;
    saveHistorySnapshot();
    set({ resume: { ...resume, name }, isDirty: true });
    scheduleAutoSave();
  },

  updateProfileData: (path, value) => {
    try {
      const { resume, saveHistorySnapshot, scheduleAutoSave } = get();
      if (!resume) return;
      
      saveHistorySnapshot();
      
      let clonedProfileData: any = {};
      try {
        clonedProfileData = resume.profileData ? JSON.parse(JSON.stringify(resume.profileData)) : {};
      } catch (e) {
        clonedProfileData = {};
      }

      const keys = path.split('.');
      let current: any = clonedProfileData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (current[keys[i]] === undefined || current[keys[i]] === null || typeof current[keys[i]] !== 'object') {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      set({ resume: { ...resume, profileData: clonedProfileData }, isDirty: true });
      scheduleAutoSave();
    } catch (error) {
      console.error("Error in updateProfileData:", error);
    }
  },

  updateTheme: (themeUpdate) => {
    const { resume, saveHistorySnapshot, scheduleAutoSave } = get();
    if (!resume) return;
    
    saveHistorySnapshot();
    set({ 
      resume: { 
        ...resume, 
        theme: { ...resume.theme, ...themeUpdate } 
      }, 
      isDirty: true 
    });
    scheduleAutoSave();
  },

  updateLayout: (layoutUpdate) => {
    const { resume, saveHistorySnapshot, scheduleAutoSave } = get();
    if (!resume) return;
    
    saveHistorySnapshot();
    set({ 
      resume: { 
        ...resume, 
        layout: { ...resume.layout, ...layoutUpdate } 
      }, 
      isDirty: true 
    });
    scheduleAutoSave();
  },

  setTemplate: (templateId) => {
    const { resume, saveHistorySnapshot, scheduleAutoSave } = get();
    if (!resume) return;
    
    saveHistorySnapshot();
    set({ 
      resume: { ...resume, template: templateId }, 
      isDirty: true 
    });
    scheduleAutoSave();
  },

  updateSectionOrder: (sections) => {
    const { resume, saveHistorySnapshot, scheduleAutoSave } = get();
    if (!resume) return;
    
    saveHistorySnapshot();
    set({ 
      resume: { ...resume, sections }, 
      isDirty: true 
    });
    scheduleAutoSave();
  },

  saveDraft: async (isManualSnapshot = false) => {
    const { resume, isSaving } = get();
    if (!resume || !resume._id) return false;

    // Prevent parallel save requests
    if (isSaving && !isManualSnapshot) return false;

    set({ isSaving: true, autoSaveStatus: "saving", autoSaveError: null });

    try {
      const payload: any = {
        name: resume.name,
        targetRole: resume.targetRole,
        template: resume.template,
        theme: resume.theme,
        layout: resume.layout,
        sections: resume.sections,
        profileData: resume.profileData,
        baseRevision: resume.revision || 1,
        createSnapshot: isManualSnapshot
      };

      const res = await ApiClient.updateResume(resume._id, payload);

      if (res && (res.resume || res.data)) {
        const updated = res.resume || res.data;
        const newRevision = res.revision || updated.revision || ((resume.revision || 1) + 1);
        const newVersion = res.version || updated.version || resume.version;

        set({
          resume: {
            ...resume,
            ...updated,
            revision: newRevision,
            version: newVersion,
            atsScore: updated.atsScore ?? resume.atsScore
          },
          isSaving: false,
          isDirty: false,
          autoSaveStatus: "saved",
          lastSavedAt: new Date().toLocaleTimeString(),
          conflictData: null
        });

        // Clean up confirmed draft from localStorage
        localStorage.removeItem(`resume_draft_${resume._id}`);
        return true;
      }

      set({ isSaving: false, autoSaveStatus: "error", autoSaveError: "Save failed: invalid response" });
      return false;
    } catch (err: any) {
      console.error("[useResumeStore] Save failed:", err);

      // Check for 409 Version Conflict
      if (err.response?.status === 409 || err.status === 409 || err.error?.code === "VERSION_CONFLICT") {
        const errorData = err.response?.data?.error || err.error || {};
        set({
          isSaving: false,
          autoSaveStatus: "error",
          autoSaveError: "Version conflict: changes detected from another session.",
          conflictData: {
            serverRevision: errorData.serverRevision,
            serverVersion: errorData.serverVersion,
            serverUpdatedAt: errorData.serverUpdatedAt,
            serverResume: errorData.serverResume
          }
        });
        return false;
      }

      // Check for offline / network failure
      const isOffline = !navigator.onLine || err.message?.includes("Network Error") || err.code === "ERR_NETWORK";
      set({
        isSaving: false,
        autoSaveStatus: isOffline ? "offline" : "error",
        autoSaveError: isOffline ? "Offline: draft stored safely in your browser." : (err.message || "Failed to save draft.")
      });
      return false;
    }
  },

  resolveConflict: async (choice: "local" | "server") => {
    const { resume, conflictData } = get();
    if (!resume) return;

    if (choice === "server") {
      if (conflictData?.serverResume) {
        set({
          resume: conflictData.serverResume,
          isDirty: false,
          conflictData: null,
          autoSaveStatus: "saved",
          lastSavedAt: new Date().toLocaleTimeString()
        });
        localStorage.removeItem(`resume_draft_${resume._id}`);
      }
    } else {
      // Keep local: force save with server's latest revision
      const targetRevision = conflictData?.serverRevision ?? (resume.revision || 1);
      set({
        resume: { ...resume, revision: targetRevision },
        conflictData: null
      });
      await get().saveDraft(true);
    }
  },

  undo: () => {
    const { history, future, resume, scheduleAutoSave } = get();
    if (history.length === 0 || !resume) return;
    
    const previousState = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);
    
    set({
      resume: previousState,
      history: newHistory,
      future: [resume, ...future],
      isDirty: true
    });
    scheduleAutoSave();
  },

  redo: () => {
    const { history, future, resume, scheduleAutoSave } = get();
    if (future.length === 0 || !resume) return;
    
    const nextState = future[0];
    const newFuture = future.slice(1);
    
    set({
      resume: nextState,
      history: [...history, resume],
      future: newFuture,
      isDirty: true
    });
    scheduleAutoSave();
  }
}));
