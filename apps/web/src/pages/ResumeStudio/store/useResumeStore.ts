import { create } from "zustand";
import { IResume, IResumeSectionConfig, IResumeTheme, IResumeLayout, ResumeTemplateId } from "../types/resume";

interface ResumeState {
  // State
  resume: IResume | null;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  lastSavedAt: string | null;
  
  // Selection
  activeSection: string | null;
  
  // Undo/Redo Stacks
  history: IResume[];
  future: IResume[];
  
  // Actions
  setResume: (resume: IResume) => void;
  updateProfileData: (path: string, value: any) => void;
  updateTheme: (theme: Partial<IResumeTheme>) => void;
  updateLayout: (layout: Partial<IResumeLayout>) => void;
  setTemplate: (templateId: ResumeTemplateId) => void;
  updateSectionOrder: (sections: IResumeSectionConfig[]) => void;
  setActiveSection: (sectionId: string | null) => void;
  
  // History Actions
  undo: () => void;
  redo: () => void;
  saveHistorySnapshot: () => void;
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  resume: null,
  isLoading: true,
  isSaving: false,
  isDirty: false,
  lastSavedAt: null,
  activeSection: null,
  
  history: [],
  future: [],

  setResume: (resume) => set({ resume, isLoading: false, isDirty: false }),
  
  setActiveSection: (sectionId) => set({ activeSection: sectionId }),

  saveHistorySnapshot: () => {
    try {
      const { resume, history } = get();
      if (!resume) return;
      
      // Only keep last 20 changes to avoid memory issues
      const newHistory = [...history, JSON.parse(JSON.stringify(resume))].slice(-20);
      set({ history: newHistory, future: [] });
    } catch (err) {
      console.error("Failed to save history snapshot", err);
    }
  },

  updateProfileData: (path, value) => {
    try {
      const { resume, saveHistorySnapshot } = get();
      if (!resume) return;
      
      saveHistorySnapshot();
      
      // Deep-clone profileData safely
      let clonedProfileData: any = {};
      try {
        clonedProfileData = resume.profileData ? JSON.parse(JSON.stringify(resume.profileData)) : {};
      } catch (e) {
        console.error("Failed to clone profileData", e);
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
    } catch (error) {
      console.error("Error in updateProfileData:", error);
    }
  },

  updateTheme: (themeUpdate) => {
    const { resume, saveHistorySnapshot } = get();
    if (!resume) return;
    
    saveHistorySnapshot();
    set({ 
      resume: { 
        ...resume, 
        theme: { ...resume.theme, ...themeUpdate } 
      }, 
      isDirty: true 
    });
  },

  updateLayout: (layoutUpdate) => {
    const { resume, saveHistorySnapshot } = get();
    if (!resume) return;
    
    saveHistorySnapshot();
    set({ 
      resume: { 
        ...resume, 
        layout: { ...resume.layout, ...layoutUpdate } 
      }, 
      isDirty: true 
    });
  },

  setTemplate: (templateId) => {
    const { resume, saveHistorySnapshot } = get();
    if (!resume) return;
    
    saveHistorySnapshot();
    set({ 
      resume: { ...resume, template: templateId }, 
      isDirty: true 
    });
  },

  updateSectionOrder: (sections) => {
    const { resume, saveHistorySnapshot } = get();
    if (!resume) return;
    
    saveHistorySnapshot();
    set({ 
      resume: { ...resume, sections }, 
      isDirty: true 
    });
  },

  undo: () => {
    const { history, future, resume } = get();
    if (history.length === 0 || !resume) return;
    
    const previousState = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);
    
    set({
      resume: previousState,
      history: newHistory,
      future: [resume, ...future],
      isDirty: true
    });
  },

  redo: () => {
    const { history, future, resume } = get();
    if (future.length === 0 || !resume) return;
    
    const nextState = future[0];
    const newFuture = future.slice(1);
    
    set({
      resume: nextState,
      history: [...history, resume],
      future: newFuture,
      isDirty: true
    });
  }
}));
