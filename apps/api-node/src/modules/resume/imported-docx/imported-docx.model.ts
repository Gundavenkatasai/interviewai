import mongoose, { Schema } from "mongoose";
import { randomUUID } from "crypto";

// ============================================================
// ImportedDocxWorkspace
// The top-level record for an imported original DOCX.
// The user's original file is NEVER mutated — it lives in
// ResumeDocument (originalDocumentId) and is immutable.
// ============================================================

export type WorkspaceStatus = "processing" | "ready" | "error";

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

export interface IImportedDocxWorkspace {
  _id: string;
  userId: string;
  originalDocumentId: string;  // → ResumeDocument._id (immutable)
  originalHash: string;         // sha256 of original file
  originalFilename: string;
  status: WorkspaceStatus;
  structureVersion: string;
  extractionCoverage: IExtractionCoverage;
  warnings: string[];
  name: string;                 // user-editable display name
  pageCount?: number;
  pageSize?: "A4" | "Letter" | "Unknown";
  hasHeaders: boolean;
  hasFooters: boolean;
  hasImages: boolean;
  hasTables: boolean;
  hasHyperlinks: boolean;
  hasTextBoxes: boolean;
  totalEditableFields: number;
  totalSections: number;
  createdAt: Date;
  updatedAt: Date;
}

const importedDocxWorkspaceSchema = new Schema<IImportedDocxWorkspace>(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, ref: "User", required: true, index: true },
    originalDocumentId: { type: String, ref: "ResumeDocument", required: true },
    originalHash: { type: String, required: true },
    originalFilename: { type: String, required: true },
    status: { type: String, enum: ["processing", "ready", "error"], default: "processing" },
    structureVersion: { type: String, default: "v1" },
    extractionCoverage: { type: Schema.Types.Mixed, default: {} },
    warnings: { type: [String], default: [] },
    name: { type: String, default: "Imported Resume" },
    pageCount: { type: Number },
    pageSize: { type: String },
    hasHeaders: { type: Boolean, default: false },
    hasFooters: { type: Boolean, default: false },
    hasImages: { type: Boolean, default: false },
    hasTables: { type: Boolean, default: false },
    hasHyperlinks: { type: Boolean, default: false },
    hasTextBoxes: { type: Boolean, default: false },
    totalEditableFields: { type: Number, default: 0 },
    totalSections: { type: Number, default: 0 },
  },
  { timestamps: true }
);

importedDocxWorkspaceSchema.index({ userId: 1, createdAt: -1 });

export const ImportedDocxWorkspace = mongoose.model<IImportedDocxWorkspace>(
  "ImportedDocxWorkspace",
  importedDocxWorkspaceSchema
);

// ============================================================
// ImportedDocxSection
// A detected section inside the imported DOCX.
// ============================================================

export type SectionType =
  | "PERSONAL_INFO"
  | "SUMMARY"
  | "EXPERIENCE"
  | "EDUCATION"
  | "SKILLS"
  | "PROJECTS"
  | "CERTIFICATIONS"
  | "ACHIEVEMENTS"
  | "AWARDS"
  | "LANGUAGES"
  | "VOLUNTEER"
  | "PUBLICATIONS"
  | "INTERNSHIPS"
  | "TRAINING"
  | "INTERESTS"
  | "REFERENCES"
  | "HEADER_REGION"
  | "FOOTER_REGION"
  | "CUSTOM";

export interface IImportedDocxSection {
  _id: string;
  workspaceId: string;
  userId: string;
  sectionType: SectionType;
  sectionTitle: string;          // Raw heading text from document
  detectionConfidence: "HIGH" | "MEDIUM" | "LOW";
  order: number;                 // Position order in document
  fieldCount: number;
  documentPart: string;          // "word/document.xml" | "word/header1.xml" | etc.
  createdAt: Date;
}

const importedDocxSectionSchema = new Schema<IImportedDocxSection>(
  {
    _id: { type: String, default: () => randomUUID() },
    workspaceId: { type: String, ref: "ImportedDocxWorkspace", required: true, index: true },
    userId: { type: String, ref: "User", required: true, index: true },
    sectionType: { type: String, required: true },
    sectionTitle: { type: String, required: true },
    detectionConfidence: { type: String, enum: ["HIGH", "MEDIUM", "LOW"], default: "HIGH" },
    order: { type: Number, required: true },
    fieldCount: { type: Number, default: 0 },
    documentPart: { type: String, default: "word/document.xml" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

importedDocxSectionSchema.index({ workspaceId: 1, order: 1 });

export const ImportedDocxSection = mongoose.model<IImportedDocxSection>(
  "ImportedDocxSection",
  importedDocxSectionSchema
);

// ============================================================
// ImportedDocxField
// One editable text field with its full source mapping.
// The sourceMapping tells the mutation engine EXACTLY which
// XML nodes to target.
// ============================================================

export type FieldType =
  | "text"
  | "bullet"
  | "table_cell"
  | "hyperlink_text"
  | "hyperlink_url"
  | "header_text"
  | "footer_text"
  | "heading";

export interface ISourceMapping {
  documentPart: string;          // "word/document.xml" | "word/header1.xml" etc.
  paragraphIndex: number;        // 0-based index of <w:p> in the document part
  runIndices: number[];          // 0-based indices of <w:r> within the paragraph
  tableIndex?: number;           // 0-based table index (if inside a table)
  rowIndex?: number;
  cellIndex?: number;
  cellParagraphIndex?: number;   // paragraph within the cell
  hyperlinkRelId?: string;       // r:id of <w:hyperlink> for URL edits
  originalRunXmls?: string[];    // snapshot of original <w:r> elements (for mutation)
  paragraphXmlSnapshot?: string; // snapshot of entire <w:p> (for validation)
}

export interface IImportedDocxField {
  _id: string;
  workspaceId: string;
  sectionId: string;
  userId: string;
  fieldKey: string;              // e.g. "name" | "email" | "bullet_0" | "cell_r0c1"
  fieldType: FieldType;
  label: string;                 // Human-readable label for sidebar display
  currentValue: string;          // Current text (starts as originalValue)
  originalValue: string;         // Immutable copy of what was extracted
  sourceMapping: ISourceMapping;
  formattingFingerprint: string; // Hash of run properties (for validation)
  isEditable: boolean;           // false if unsupported element type
  editWarning?: string;          // Warning if partially editable
  order: number;                 // Display order within section
  createdAt: Date;
  updatedAt: Date;
}

const importedDocxFieldSchema = new Schema<IImportedDocxField>(
  {
    _id: { type: String, default: () => randomUUID() },
    workspaceId: { type: String, ref: "ImportedDocxWorkspace", required: true, index: true },
    sectionId: { type: String, ref: "ImportedDocxSection", required: true, index: true },
    userId: { type: String, ref: "User", required: true, index: true },
    fieldKey: { type: String, required: true },
    fieldType: { type: String, required: true },
    label: { type: String, default: "" },
    currentValue: { type: String, default: "" },
    originalValue: { type: String, required: true },
    sourceMapping: { type: Schema.Types.Mixed, required: true },
    formattingFingerprint: { type: String, default: "" },
    isEditable: { type: Boolean, default: true },
    editWarning: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

importedDocxFieldSchema.index({ workspaceId: 1, sectionId: 1, order: 1 });

export const ImportedDocxField = mongoose.model<IImportedDocxField>(
  "ImportedDocxField",
  importedDocxFieldSchema
);

// ============================================================
// ImportedDocxChange
// A pending or applied change operation.
// The original artifact is NEVER touched by changes.
// ============================================================

export type ChangeOperation =
  | "REPLACE_TEXT"
  | "EDIT_HYPERLINK_URL"
  | "EDIT_HYPERLINK_TEXT"
  | "EDIT_TABLE_CELL"
  | "EDIT_BULLET"
  | "EDIT_HEADER"
  | "EDIT_FOOTER";

export type ChangeStatus = "pending" | "applied" | "rejected";

export interface IImportedDocxChange {
  _id: string;
  workspaceId: string;
  fieldId: string;
  userId: string;
  operation: ChangeOperation;
  originalValue: string;
  proposedValue: string;
  status: ChangeStatus;
  sourceMapping: ISourceMapping;  // Snapshot at time of change (for safety)
  appliedInVersionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const importedDocxChangeSchema = new Schema<IImportedDocxChange>(
  {
    _id: { type: String, default: () => randomUUID() },
    workspaceId: { type: String, ref: "ImportedDocxWorkspace", required: true, index: true },
    fieldId: { type: String, ref: "ImportedDocxField", required: true },
    userId: { type: String, ref: "User", required: true, index: true },
    operation: { type: String, required: true },
    originalValue: { type: String, required: true },
    proposedValue: { type: String, required: true },
    status: { type: String, enum: ["pending", "applied", "rejected"], default: "pending" },
    sourceMapping: { type: Schema.Types.Mixed, required: true },
    appliedInVersionId: { type: String },
  },
  { timestamps: true }
);

importedDocxChangeSchema.index({ workspaceId: 1, status: 1 });

export const ImportedDocxChange = mongoose.model<IImportedDocxChange>(
  "ImportedDocxChange",
  importedDocxChangeSchema
);

// ============================================================
// ImportedDocxVersion
// A saved artifact snapshot (generated DOCX with changes applied).
// ============================================================

export interface IImportedDocxVersion {
  _id: string;
  workspaceId: string;
  userId: string;
  versionNumber: number;
  artifactStoragePath: string;   // Path to generated DOCX file
  artifactHash: string;          // sha256 of generated DOCX
  appliedChangeIds: string[];    // Which IImportedDocxChange._ids were applied
  validationResult: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    paragraphCountBefore: number;
    paragraphCountAfter: number;
    tableCountBefore: number;
    tableCountAfter: number;
    headingCountBefore: number;
    headingCountAfter: number;
    imageCountBefore: number;
    imageCountAfter: number;
    textNodesBefore: number;
    textNodesAfter: number;
    changedTextNodes: number;
  };
  changeSummary: string;
  createdAt: Date;
}

const importedDocxVersionSchema = new Schema<IImportedDocxVersion>(
  {
    _id: { type: String, default: () => randomUUID() },
    workspaceId: { type: String, ref: "ImportedDocxWorkspace", required: true, index: true },
    userId: { type: String, ref: "User", required: true, index: true },
    versionNumber: { type: Number, required: true },
    artifactStoragePath: { type: String, required: true },
    artifactHash: { type: String, required: true },
    appliedChangeIds: { type: [String], default: [] },
    validationResult: { type: Schema.Types.Mixed, default: {} },
    changeSummary: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

importedDocxVersionSchema.index({ workspaceId: 1, versionNumber: -1 });

export const ImportedDocxVersion = mongoose.model<IImportedDocxVersion>(
  "ImportedDocxVersion",
  importedDocxVersionSchema
);
