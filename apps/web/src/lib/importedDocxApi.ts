// Typed API client for the Imported DOCX Editor feature.
// Token is read from localStorage under "interviewai_token" (same key as ApiClient).

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

function getToken(): string {
  return localStorage.getItem("interviewai_token") || localStorage.getItem("token") || "";
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      errMsg = data.message || errMsg;
    } catch {}
    throw new Error(errMsg);
  }
  return res.json() as Promise<T>;
}

// ============================================================
// Types
// ============================================================

export interface IWorkspaceSummary {
  _id: string;
  name: string;
  originalFilename: string;
  status: "processing" | "ready" | "error";
  totalSections: number;
  totalEditableFields: number;
  hasHeaders: boolean;
  hasFooters: boolean;
  hasImages: boolean;
  hasTables: boolean;
  hasHyperlinks: boolean;
  hasTextBoxes: boolean;
  extractionCoverage: IExtractionCoverage;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IExtractionCoverage {
  paragraphsDetected: number;
  paragraphsMapped: number;
  runsDetected: number;
  runsMapped: number;
  tablesDetected: number;
  tablesMapped: number;
  headersDetected: number;
  headersMapped: number;
  footersDetected: number;
  footersMapped: number;
  hyperlinksDetected: number;
  hyperlinksMapped: number;
  textBoxesDetected: number;
  textBoxesMapped: number;
  imagesDetected: number;
  imagesPreserved: number;
  listsDetected: number;
  listsMapped: number;
  unsupportedElements: string[];
  warnings: string[];
}

export interface IDocxField {
  _id: string;
  fieldKey: string;
  fieldType: "text" | "bullet" | "table_cell" | "hyperlink_text" | "hyperlink_url" | "header_text" | "footer_text" | "heading";
  label: string;
  currentValue: string;
  originalValue: string;
  isEditable: boolean;
  editWarning?: string;
  order: number;
}

export interface IDocxSection {
  _id: string;
  sectionType: string;
  sectionTitle: string;
  detectionConfidence: "HIGH" | "MEDIUM" | "LOW";
  order: number;
  fieldCount: number;
  documentPart: string;
  fields: IDocxField[];
}

export interface IWorkspaceDetail extends IWorkspaceSummary {
  sections: IDocxSection[];
}

export interface IDocxChange {
  _id: string;
  fieldId: string;
  operation: string;
  originalValue: string;
  proposedValue: string;
  status: "pending" | "applied" | "rejected";
  createdAt: string;
}

export interface IDocxVersion {
  _id: string;
  versionNumber: number;
  artifactHash: string;
  appliedChangeIds: string[];
  changeSummary: string;
  validationResult: {
    valid: boolean;
    warnings: string[];
    overflowRisk: boolean;
    changeSummary: string;
  };
  createdAt: string;
}

export interface IRenderResult {
  success: boolean;
  versionId: string;
  versionNumber: number;
  applied: number;
  skipped: number;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    overflowRisk: boolean;
    changeSummary: string;
  };
  warnings: string[];
}

// ============================================================
// API Functions
// ============================================================

export const ImportedDocxApi = {
  // Upload a DOCX file for import
  async importDocx(file: File): Promise<{
    success: boolean;
    workspaceId: string;
    name: string;
    totalSections: number;
    totalFields: number;
    duplicate?: boolean;
    coverage: IExtractionCoverage;
    warnings: string[];
  }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/api/resume/imported-docx/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    return handleResponse(res);
  },

  // List all workspaces
  async listWorkspaces(): Promise<{ success: boolean; workspaces: IWorkspaceSummary[] }> {
    const res = await fetch(`${API_BASE}/api/resume/imported-docx`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  // Get workspace detail (with sections + fields)
  async getWorkspace(id: string): Promise<{ success: boolean; workspace: IWorkspaceSummary; sections: IDocxSection[] }> {
    const res = await fetch(`${API_BASE}/api/resume/imported-docx/${id}`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  // Save a field change
  async saveChange(workspaceId: string, fieldId: string, proposedValue: string, operation = "REPLACE_TEXT"): Promise<{
    success: boolean;
    change: IDocxChange;
  }> {
    const res = await fetch(`${API_BASE}/api/resume/imported-docx/${workspaceId}/changes`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ fieldId, proposedValue, operation }),
    });
    return handleResponse(res);
  },

  // Get pending changes
  async getChanges(workspaceId: string): Promise<{ success: boolean; changes: IDocxChange[] }> {
    const res = await fetch(`${API_BASE}/api/resume/imported-docx/${workspaceId}/changes`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  // Apply changes and generate DOCX
  async renderDocx(workspaceId: string): Promise<IRenderResult> {
    const res = await fetch(`${API_BASE}/api/resume/imported-docx/${workspaceId}/render`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    return handleResponse(res);
  },

  // Get version history
  async getVersions(workspaceId: string): Promise<{ success: boolean; versions: IDocxVersion[] }> {
    const res = await fetch(`${API_BASE}/api/resume/imported-docx/${workspaceId}/versions`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  // Get preview (base64 DOCX for mammoth rendering)
  async getPreview(workspaceId: string, versionId?: string): Promise<{
    success: boolean;
    docxBase64: string;
    filename: string;
  }> {
    const qs = versionId ? `?versionId=${versionId}` : "";
    const res = await fetch(`${API_BASE}/api/resume/imported-docx/${workspaceId}/preview${qs}`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  // Download a version
  getDownloadUrl(workspaceId: string, versionId: string): string {
    return `${API_BASE}/api/resume/imported-docx/${workspaceId}/download/${versionId}`;
  },

  // Download original
  getOriginalDownloadUrl(workspaceId: string): string {
    return `${API_BASE}/api/resume/imported-docx/${workspaceId}/download/original`;
  },

  // Delete workspace
  async deleteWorkspace(workspaceId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/api/resume/imported-docx/${workspaceId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handleResponse(res);
  },
};
