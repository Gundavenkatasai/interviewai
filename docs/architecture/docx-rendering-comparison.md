# DOCX Rendering Engine Comparison

**Interview AI — Architecture Decision Record**  
**Date:** 2026-09-16

---

## The Core Question

> When a user uploads a `.docx` resume, what technology should render it in the canvas?

---

## Candidates Evaluated

### 1. `docx-preview` — ✅ **CHOSEN**

**What it does:** Parses OOXML directly and renders it to the browser DOM, attempting to visually replicate the original document's appearance.

**License:** MIT — fully compatible with proprietary SaaS.

**Rendering approach:**
- Reads `word/document.xml`, `word/styles.xml`, `word/numbering.xml`, header/footer XML
- Applies CSS to match OOXML formatting (fonts, spacing, alignment, colors)
- Renders images via `word/media/` files
- Preserves table structure as HTML `<table>` elements
- Supports page breaks and pagination
- Does **not** convert to semantic HTML — aims for visual fidelity

**What is preserved:**
| Feature | Preserved? |
|---------|-----------|
| Font family | ✅ (with web font fallback) |
| Font size | ✅ |
| Bold / italic / underline | ✅ |
| Text color | ✅ |
| Paragraph alignment | ✅ |
| Line spacing | ✅ |
| Tables | ✅ |
| Images | ✅ |
| Hyperlinks | ✅ |
| Bullets / numbered lists | ✅ |
| Headers / footers | ✅ |
| Page breaks | ✅ |
| Two-column layout | ⚠️ Partial |
| Text boxes | ⚠️ Partial |
| SmartArt / charts | ❌ |

**Verdict:** Best available MIT-licensed option for high-fidelity DOCX preview. The canvas shows the actual document, not a reconstruction.

---

### 2. SuperDoc (`@harbour-enterprises/superdoc`) — ❌ **REJECTED (License)**

**What it does:** DOCX-native OOXML editor — reads and writes DOCX directly, no HTML conversion step. Supports direct editing, pagination, sections, headers, footers, tables.

**License:** AGPLv3 (open-source) / Commercial license required for proprietary SaaS.

**Why rejected:**  
AGPLv3 requires that all software using SuperDoc in a networked SaaS context be released under AGPLv3. Interview AI is a proprietary commercial application. A commercial license from Harbour Enterprises would be required.

**Technical capability (if licensed):**  
SuperDoc would provide true Word-parity inline editing with direct OOXML manipulation. It is architecturally superior to `docx-preview` for editing use cases. However, the license barrier makes it unavailable without negotiation.

**Revisit if:** Interview AI decides to invest in a commercial license for full inline DOCX editing.

---

### 3. `mammoth.js` — ❌ **REJECTED (Wrong tool for canvas)**

**What it does:** Converts DOCX to semantic HTML. Intentionally ignores most visual formatting.

**License:** MIT.

**Why rejected for canvas use:**  
Mammoth's own documentation states:

> "By design, mammoth only supports a specific subset of features from OOXML documents. Most importantly, mammoth ignores many parts of the document's formatting, so any differences in appearance between the original Word document and your HTML output are expected and intentional."

Using Mammoth as the canvas renderer would produce exactly the bug this feature is trying to fix — a document that looks different from the original.

**Where Mammoth IS acceptable:**  
- Backend text extraction for ATS keyword analysis
- Fallback for AI/semantic features that only need text content
- Search indexing

Mammoth must **never** be used as the primary visual renderer for the imported resume canvas.

---

### 4. Commercial SDKs (Nutrient / PSPDFKit / Apryse) — ❌ **Not evaluated**

Enterprise-grade document SDKs that provide near-perfect Word fidelity and inline editing. Significant cost. Not evaluated as out-of-scope for current implementation phase.

---

## Decision Matrix

| Criterion | docx-preview | SuperDoc | mammoth |
|-----------|:---:|:---:|:---:|
| MIT License | ✅ | ❌ (AGPLv3) | ✅ |
| Visual fidelity | ✅ | ✅✅ | ❌ |
| Tables preserved | ✅ | ✅ | ⚠️ |
| Images preserved | ✅ | ✅ | ❌ |
| Headers/footers | ✅ | ✅ | ❌ |
| Inline editing | ❌ | ✅ | N/A |
| React integration | ✅ | ✅ | N/A |
| No server round-trip | ✅ | ✅ | N/A |
| Available today | ✅ | ✅ | ✅ |

---

## Final Decision

**Use `docx-preview` for canvas rendering.**

- Compatible license for Interview AI's commercial SaaS model
- Renders the actual DOCX binary — not a reconstructed approximation
- Preserves the critical formatting properties (tables, images, fonts, headers, footers)
- Already integrated and functional in Interview AI

**Inline editing strategy:**  
Since `docx-preview` is read-only, inline editing is implemented via `DocxInlineEditLayer` — a post-render DOM patch that makes identified paragraph elements `contenteditable` and maps changes back to the OOXML field model.

This is architecturally sound: `docx-preview` handles the visual rendering with full fidelity, and `DocxInlineEditLayer` handles the edit interaction layer.
