# Imported DOCX Native Editor — Architecture

**Version:** 2.0  
**Last updated:** 2026-09-16

---

## 1. Overview

Interview AI's Imported DOCX feature allows users to upload their own `.docx` resume and edit it while preserving the original document's exact formatting, typography, layout, tables, images, hyperlinks, and pagination.

This document describes the complete technical architecture.

---

## 2. Design Principles

1. **Original DOCX is immutable.** The uploaded file is stored as a hash-addressed artifact and never modified.
2. **Native OOXML as source of truth.** The document model is the OOXML XML, not a reconstructed Resume JSON.
3. **DOCX-native rendering.** The canvas uses `docx-preview` to render the actual DOCX binary, not an HTML reconstruction.
4. **Targeted mutation only.** Edits are applied as surgical XML replacements to a copy of the original — all unrelated parts remain byte-for-byte identical.
5. **Separate paths for imported DOCX vs. normal Resume Studio.** The template engine path is never used for imported documents.

---

## 3. Architecture Diagram

```
User uploads resume.docx
        │
        ▼
┌───────────────────────────────────────────────────────┐
│                  DocxInspector                        │
│  • Magic bytes validation (ZIP/PK)                    │
│  • ZIP bomb guard (50MB uncompressed limit)            │
│  • DOCTYPE/XXE protection                             │
│  • OOXML well-formedness check (w:body required)      │
│  • SHA-256 hash for deduplication                     │
└───────────────────────┬───────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│                Immutable Original Store                │
│  uploads/{userId}/{hash}_{filename}.docx              │
│  ResumeDocument MongoDB record                        │
│  ImportedDocxWorkspace MongoDB record                 │
└───────────────────────┬───────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│             DocxStructureExtractor                    │
│  • Walks OOXML DOM (paragraphs, tables, runs)         │
│  • Extracts plaintext, formatting fingerprints        │
│  • Resolves hyperlink RelIDs → URLs                   │
│  • Identifies headers/footers, list structures        │
│  • Builds source mappings (para index, table coords)  │
└───────────────────────┬───────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│              DocxSectionDetector                      │
│  • Classifies paragraphs into resume sections         │
│  • PERSONAL_INFO, EXPERIENCE, EDUCATION, SKILLS, ...  │
│  • HEADER_REGION, FOOTER_REGION                       │
│  • Confidence scoring: HIGH / MEDIUM / LOW            │
└───────────────────────┬───────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│           MongoDB: Sections + Fields                  │
│  ImportedDocxSection: sectionType, documentPart       │
│  ImportedDocxField:                                   │
│    • fieldType: text|bullet|table_cell|hyperlink...   │
│    • currentValue / originalValue                     │
│    • sourceMapping: {documentPart, paraIndex, ...}    │
│    • formattingFingerprint (run-level rPr hash)       │
└───────────────────────────────────────────────────────┘

                 CANVAS RENDERING PATH
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│         GET /api/resume/imported-docx/:id/preview     │
│  Returns: { docxBase64: "..." }                       │
│  Source: original immutable DOCX (or latest version)  │
└───────────────────────┬───────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│          Frontend: docx.renderAsync()                  │
│  Library: docx-preview (MIT)                          │
│  Input: ArrayBuffer of DOCX binary                    │
│  Output: DOM nodes rendered into <div>                │
│  Preserves: fonts, spacing, colors, tables, images,   │
│             headers, footers, hyperlinks, bullets,    │
│             columns, margins, page size               │
└───────────────────────────────────────────────────────┘

                  EDIT PATH (Sidebar)
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│         User edits field in left sidebar              │
│  → POST /api/resume/imported-docx/:id/changes         │
│  → ImportedDocxChange saved {fieldId, proposedValue,  │
│                               sourceMapping}          │
│  → Autosaved (debounced 1500ms)                       │
└───────────────────────┬───────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│       "Save & Preview" → POST .../render              │
│  → DocxMutationEngine.applyChanges(originalBuffer)    │
│  → JSZip: clone original package                      │
│  → For each change: find paragraph by XML snapshot    │
│  → Replace text in runs (preserve w:rPr formatting)   │
│  → All other parts: byte-for-byte identical           │
│  → JSZip.generateAsync() → new buffer                 │
│  → DocxOutputValidator: structural integrity check    │
│  → Save as ImportedDocxVersion artifact               │
└───────────────────────┬───────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│  Canvas re-renders new version via GET .../preview    │
│  docx-preview re-renders updated DOCX                 │
└───────────────────────────────────────────────────────┘

                  DIRECT CANVAS EDIT PATH (new)
                        │
                        ▼
┌───────────────────────────────────────────────────────┐
│         DocxInlineEditLayer (new component)           │
│  • Wraps docx-preview rendered container              │
│  • After render: walks DOM for paragraph elements     │
│  • Makes them contenteditable                         │
│  • Maps paragraph DOM index → fieldId                 │
│  • On blur: calls editor.updateField()                │
│  • Sidebar syncs immediately (live)                   │
│  • Canvas text updates immediately (no round-trip)    │
└───────────────────────────────────────────────────────┘
```

---

## 4. Key Components

### 4.1 Backend

#### `DocxInspector` (`docx-inspector.ts`)
- Validates DOCX security before any parsing
- Checks: file size (10MB), magic bytes (PK), ZIP bomb (50MB uncompressed), DOCTYPE/XXE, `w:body` presence

#### `DocxStructureExtractor` (`docx-structure-extractor.ts`)
- Pure OOXML parser using regex-based XML walking
- Intentionally low-level to avoid dropping unsupported structures
- Produces: `DocxNodeTree` with paragraphs, tables, textboxes
- Builds `ISourceMapping` per field: `documentPart`, `paragraphIndex`, `runIndices`, `paragraphXmlSnapshot`

#### `DocxSectionDetector` (`docx-section-detector.ts`)
- Classifies nodes into resume sections using heading text heuristics
- Returns: `DetectedSection[]` with `sectionType`, `nodeIndices`, confidence

#### `DocxMutationEngine` (`docx-mutation-engine.ts`)
- Takes original immutable buffer + list of `IImportedDocxChange`
- Strategy:
  1. Load original with JSZip
  2. Find target paragraph by `paragraphXmlSnapshot` (exact match) or soft fallback (text search)
  3. Replace text inside `<w:t>` nodes while preserving all `<w:rPr>` formatting
  4. Write back to cloned ZIP — all other parts untouched
- Returns: new buffer + applied/skipped list + structural validation stats

#### `DocxOutputValidator` (`docx-output-validator.ts`)
- Verifies output DOCX structural integrity
- Checks: paragraph count, table count, image relIds preserved, numbering/styles unchanged

### 4.2 Frontend

#### `DocxXeroxWorkspace` (`DocxXeroxWorkspace.tsx`)
- Three-panel editor:
  - Left: Section list + field editors (sidebar)
  - Center: `docx-preview` canvas
  - Right: Coverage/info panel
- Renders DOCX via `docx.renderAsync(buffer, containerDiv, ...)`
- Supports: zoom, refresh, save & preview, download

#### `ImportedDocxEditorPage` (`ImportedDocxEditorPage.tsx`)
- Full-page standalone editor at `/resume/imported/:id`
- Same three-panel layout as `DocxXeroxWorkspace`
- Used when navigating directly to an imported workspace

#### `useImportedDocxEditor` (`useImportedDocxEditor.ts`)
- Central state hook
- Manages: workspace, sections, pendingChanges, saveStatus, versions, undo/redo
- Debounced autosave (1500ms)
- `renderDocx()`: flushes pending changes → calls render API → returns new versionId

#### `DocxInlineEditLayer` (NEW — `DocxInlineEditLayer.tsx`)
- Wraps the `docx-preview` container div
- Post-render DOM walker: identifies editable paragraph nodes
- Makes them `contenteditable`
- Maps DOM position → `fieldId` via `fieldsByParagraphIndex` map
- Propagates changes to `useImportedDocxEditor`

---

## 5. Data Models

### `ImportedDocxWorkspace`
```typescript
{
  userId: string;
  originalDocumentId: ObjectId;  // → ResumeDocument
  originalHash: string;          // SHA-256 of original file
  originalFilename: string;
  status: "processing" | "ready" | "error";
  extractionCoverage: IExtractionCoverage;
  hasHeaders: boolean;
  hasFooters: boolean;
  hasImages: boolean;
  hasTables: boolean;
  hasHyperlinks: boolean;
  hasTextBoxes: boolean;
  totalSections: number;
  totalEditableFields: number;
  warnings: string[];
}
```

### `ImportedDocxField`
```typescript
{
  workspaceId: ObjectId;
  sectionId: ObjectId;
  userId: string;
  fieldKey: string;
  fieldType: "text" | "bullet" | "table_cell" | "hyperlink_text" | "hyperlink_url" | "header_text" | "footer_text" | "heading";
  label: string;
  currentValue: string;
  originalValue: string;
  sourceMapping: {
    documentPart: string;         // "word/document.xml"
    paragraphIndex: number;       // 0-based global para index
    runIndices: number[];
    paragraphXmlSnapshot: string; // exact XML of paragraph at import time
    tableIndex?: number;
    rowIndex?: number;
    cellIndex?: number;
    hyperlinkRelId?: string;
  };
  formattingFingerprint: string;  // hash of rPr XML
  isEditable: boolean;
  editWarning?: string;
  order: number;
}
```

### `ImportedDocxVersion`
```typescript
{
  workspaceId: ObjectId;
  userId: string;
  versionNumber: number;          // 1 = original, 2+ = edited
  artifactStoragePath: string;    // artifacts/imported-docx/{id}_v{n}.docx
  artifactHash: string;           // SHA-256 of artifact
  appliedChangeIds: ObjectId[];
  validationResult: { valid, errors, warnings, overflowRisk };
  changeSummary: string;
  createdAt: Date;
}
```

---

## 6. What Is Preserved vs. What Is Editable

### Preserved (always):
- Font family, size, color, bold, italic, underline (all `w:rPr`)
- Paragraph alignment, indentation, spacing (`w:pPr`)
- Table structure (rows, cells, merges, borders, widths)
- Image positions and binaries (media files in ZIP)
- Hyperlink targets (unless explicitly changed via `hyperlink_url` field)
- Numbered list structure (numbering.xml — never touched)
- Styles (`styles.xml` — never touched)
- Section breaks, page dimensions, margins (`w:sectPr`)
- Headers and footers (unless explicitly edited via HEADER_REGION fields)

### Editable via sidebar:
- Paragraph text (within existing run structure)
- Table cell text
- Bullet text
- Header/footer text
- Hyperlink display text
- Hyperlink URL (via relationship file edit)

### Not yet editable:
- Text boxes (`mc:AlternateContent` / `v:textbox`) — preserved read-only
- Structural changes (add/remove paragraphs, tables, rows)
- Font changes
- Layout changes

---

## 7. Security Properties

| Threat | Mitigation |
|--------|-----------|
| Malicious ZIP | Magic bytes check + JSZip parse error handling |
| ZIP bomb | 10MB compressed, 50MB uncompressed limit |
| XXE / DOCTYPE | Explicit `<!DOCTYPE` rejection before parsing |
| Path traversal | JSZip internal path handling only — no filesystem path from OOXML |
| IDOR | Every DB query includes `userId` filter |
| Macro execution | No macro engine — OOXML is parsed as text/XML only |
| Remote resource fetch | docx-preview runs client-side sandboxed; no network calls from document |
| Oversized files | 10MB limit enforced before JSZip |

---

## 8. Known Limitations

| Feature | Status | Notes |
|---------|--------|-------|
| Text box editing | ❌ Read-only | `mc:AlternateContent` complexity; preserved in output |
| Direct canvas typing | ⚠️ Partial | DocxInlineEditLayer adds contenteditable; complex formatting may not sync perfectly |
| Add/remove paragraphs | ❌ Not supported | Only text replacement within existing structure |
| Column layout | ✅ Preserved (render) | Two-column layouts visible in canvas; not directly editable |
| Complex shapes (SmartArt, charts) | ❌ Preserved as-is | No visual editing; content preserved in output |
| Password-protected DOCX | ❌ Rejected | Inspector detects and rejects |
| Tracked changes (revisions) | ⚠️ Partially supported | Original revision XML preserved; not surfaced in UI |
