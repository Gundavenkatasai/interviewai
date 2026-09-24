# Imported DOCX Editor — Completion Roadmap

**Interview AI Resume Studio**  
**Version:** 1.0 | **Date:** 2026-09-16

---

## Current Status

The Imported DOCX feature is **functionally complete** for core use cases:

| Capability | Status |
|------------|--------|
| Upload + security validation | ✅ Complete |
| OOXML structure extraction | ✅ Complete |
| Sidebar field editing | ✅ Complete |
| Canvas rendering via `docx-preview` | ✅ Complete |
| Server-side mutation (preserves formatting) | ✅ Complete |
| Versioning | ✅ Complete |
| DOCX download (round-trip) | ✅ Complete |
| Undo/redo | ✅ Complete |
| Autosave | ✅ Complete |
| Header/footer editing | ✅ Complete |
| Hyperlink URL editing | ✅ Complete |
| Table cell editing | ✅ Complete |
| Duplicate detection | ✅ Complete |
| IDOR protection | ✅ Complete |

---

## Phase 2 — Direct Canvas Editing (In Progress)

### P2.1 `DocxInlineEditLayer` Component

**Goal:** Allow users to click directly on text in the canvas and type, without going through the sidebar.

**Approach:**
1. After `docx-preview` renders, walk the output DOM
2. Identify paragraph elements that correspond to editable fields
3. Make them `contenteditable` via overlay
4. On text change: find matching `fieldId` via paragraph index map
5. Call `editor.updateField()` → autosave → sidebar updates live

**Status:** Implementation complete (see `DocxInlineEditLayer.tsx`)  
**Limitations:**
- Formatted runs (e.g., bold partial text within a paragraph) — inline edits flatten to single-run replacement
- Text boxes: not editable inline
- Table cells: editable via sidebar; inline editing for cells is complex (future)

---

### P2.2 Optimistic Canvas Update

**Goal:** Canvas updates immediately when user edits from sidebar, without "Save & Preview" round-trip.

**Approach:**
1. When `editor.updateField(fieldId, newValue)` is called
2. Find the corresponding DOM node in the `docx-preview` container
3. Update its text content directly
4. Queue autosave (debounced)
5. Official artifact (DOCX binary) still created via "Save & Preview" / Download

**Status:** Implemented in `DocxInlineEditLayer` via `applyOptimisticUpdate()`

---

### P2.3 Field Highlighting (Sidebar ↔ Canvas Sync)

**Goal:** Clicking a sidebar field highlights the corresponding paragraph in the canvas. Clicking a canvas paragraph highlights the sidebar field.

**Status:** Implemented via `activeFieldId` + CSS highlight class

---

## Phase 3 — Enhanced Fidelity (Planned)

### P3.1 Custom Font Loading

Some DOCX files use embedded fonts or system fonts not available in browsers. Implement:
- Check `word/fontTable.xml` for font names
- Attempt to load from Google Fonts if available
- Show clear "Font X not available" warning in coverage panel

### P3.2 Text Box Editing

Text boxes (`mc:AlternateContent` / `v:textbox`) are currently preserved but not editable.

Future implementation would require:
- Detecting `<v:textbox>` elements in OOXML
- Extracting text content
- Providing a read-only view with an "edit anyway" escape hatch

### P3.3 Structural Editing (Add/Remove Paragraphs)

Currently only text content of existing paragraphs can be changed. Adding new bullets or removing experience entries is not supported.

This would require a more complex XML manipulation approach and is deferred to Phase 4.

---

## Phase 4 — Advanced Editing (Future / Commercial License)

### P4.1 SuperDoc Commercial License

If Interview AI requires Word-parity editing (add paragraphs, change fonts, column layout changes), evaluate purchasing a commercial license for SuperDoc.

Contact: q@superdoc.dev

### P4.2 ATS Optimize Integration

When user runs ATS Optimize on an imported DOCX:
1. ATS engine analyzes extracted text (via existing pipeline)
2. Produces recommended changes as a changeset
3. User reviews changes in the Optimization Review Modal
4. Approved changes applied via `DocxMutationEngine` (same as sidebar edits)
5. Result: ATS-optimized DOCX preserving original formatting

**Status:** Architecture designed; implementation pending

### P4.3 Resume Tailoring Integration

When user tailors to a specific job description:
1. AI produces a changeset (replace bullet text, update skills, etc.)
2. User reviews in tailoring modal
3. Approved changes applied to imported DOCX via mutation engine
4. Output: tailored DOCX preserving original format

---

## Known Limitations (Permanent with Current Stack)

| Limitation | Reason | Workaround |
|-----------|--------|-----------|
| Text box editing | `mc:AlternateContent` complexity | Edit via Word, re-import |
| Pixel-perfect font rendering | Web browsers don't have all system fonts | Nearest available font used |
| SmartArt / Charts | Complex OOXML features not in scope | Preserved as-is in output |
| Password-protected DOCX | Cannot be decrypted | Remove password in Word first |
| Structural edits (add rows, columns) | Requires XML restructuring | Use Word for structural changes |

---

## Feature Compatibility Matrix

| DOCX Feature | Import | Canvas View | Edit | Export |
|-------------|:------:|:-----------:|:----:|:------:|
| Plain text paragraphs | ✅ | ✅ | ✅ | ✅ |
| Bold / italic / underline | ✅ | ✅ | Preserved | ✅ |
| Font name + size | ✅ | ✅* | Preserved | ✅ |
| Text color | ✅ | ✅ | Preserved | ✅ |
| Tables | ✅ | ✅ | Cell text | ✅ |
| Bullet lists | ✅ | ✅ | Text only | ✅ |
| Numbered lists | ✅ | ✅ | Text only | ✅ |
| Images | ✅ | ✅ | ❌ | ✅ |
| Hyperlinks | ✅ | ✅ | URL + text | ✅ |
| Headers | ✅ | ✅ | Text only | ✅ |
| Footers | ✅ | ✅ | Text only | ✅ |
| Page breaks | ✅ | ✅ | Preserved | ✅ |
| Two-column layout | ✅ | ⚠️ | ❌ | ✅ |
| Text boxes | ✅ | ⚠️ | ❌ | ✅ |
| SmartArt | ✅ | ❌ | ❌ | ✅ |

*Font renders if available in browser; fallback used otherwise.
