# DOCX Editor License Review
# Interview AI — Legal Assessment

**Date:** 2026-09-16  
**Prepared by:** Engineering Team  
**Status:** FINAL

---

## 1. Summary

This document reviews the licenses of all open-source libraries considered or used for DOCX import, rendering, and editing within Interview AI's Imported Resume feature.

---

## 2. Libraries Reviewed

### 2.1 `docx-preview` — **IN USE (APPROVED)**

| Field | Value |
|-------|-------|
| Package | `docx-preview` |
| npm | https://www.npmjs.com/package/docx-preview |
| Version in use | `^0.4.0` |
| License | **MIT** |
| Purpose | Client-side DOCX rendering to DOM (canvas preview) |
| Bundled in frontend? | Yes |
| Modified? | No |
| Distribution model | JavaScript module bundled into web app |
| Interview AI compatibility | ✅ **COMPATIBLE** |

**MIT License Summary:**  
Permissive open-source license. No copyleft requirements. Can be used in closed-source commercial SaaS without restriction. Attribution in NOTICE/LICENSE file is recommended but not required at runtime.

**Rendering approach:**  
`docx-preview` parses OOXML directly and renders it to the DOM preserving styles, tables, fonts, lists, images, hyperlinks, headers, and footers. It does **not** convert to semantic HTML (unlike Mammoth). It is the correct choice for high-fidelity DOCX canvas display.

---

### 2.2 SuperDoc (`@harbour-enterprises/superdoc` / `@superdoc/react`) — **IN USE (APPROVED)**

| Field | Value |
|-------|-------|
| Package | `superdoc` / `@superdoc/react` |
| Repository | https://github.com/harbour-enterprises/superdoc |
| License | **GNU Affero General Public License v3.0 (AGPLv3)** for open-source; Commercial license required for proprietary use |
| Version | Latest (2024–2026) |
| Purpose | DOCX-native OOXML editor with React integration |
| Bundled in frontend? | Yes |
| Modified? | No |

**AGPLv3 License Analysis:**

The AGPLv3 is a strong copyleft license with a critical "network use" provision:

> "If you run a modified version of the program on a server and let other users communicate with it there, your server must also allow them to download the source code corresponding to the modified version that it's running."

**Decision: APPROVED for current implementation.**
The user has explicitly clarified that this is a free, non-commercial website. Therefore, the use of SuperDoc under the AGPLv3 license has been authorized and approved by the owner. SuperDoc replaces `docx-preview` as the primary rendering and editing engine for high fidelity DOCX editing.

**Attribution Required?**  
Yes — Since SuperDoc is bundled, its AGPLv3 license and source code availability must be provided to end users of the website.

---

### 2.3 `mammoth` — **BACKEND ONLY (APPROVED FOR TEXT EXTRACTION)**

| Field | Value |
|-------|-------|
| Package | `mammoth` |
| npm | https://www.npmjs.com/package/mammoth |
| Version in use | `^1.12.2` |
| License | **MIT** |
| Purpose | Auxiliary: text extraction for ATS analysis and semantic search |
| Bundled in frontend? | No — backend only |
| Modified? | No |
| Interview AI compatibility | ✅ **COMPATIBLE** |

**Critical constraint:**  
Mammoth **must not** be used as the canvas renderer. Its own documentation explicitly states:

> "By design, mammoth only supports a specific subset of features from OOXML documents. Most importantly, mammoth ignores many parts of the document's formatting, so any differences in appearance between the original Word document and your HTML output are expected and intentional."

Mammoth is approved for:
- ATS keyword extraction
- Semantic resume analysis
- Fallback text extraction for AI features

Mammoth is **prohibited** for:
- Canvas rendering
- Visual document preview
- Anything that the user sees as a representation of their document

---

### 2.4 `jszip` — **IN USE (APPROVED)**

| Field | Value |
|-------|-------|
| Package | `jszip` |
| License | **MIT / GPL-3** (dual license — MIT applies for most use cases) |
| Purpose | DOCX ZIP package manipulation (backend mutation engine) |
| Interview AI compatibility | ✅ **COMPATIBLE** (MIT variant) |

---

### 2.5 `docx` — **IN USE (APPROVED)**

| Field | Value |
|-------|-------|
| Package | `docx` |
| License | **MIT** |
| Purpose | Generating DOCX files for normal Resume Studio templates |
| Interview AI compatibility | ✅ **COMPATIBLE** |

---

## 3. Architecture Decision Record

**Decision:** Use `SuperDoc` (AGPLv3) as the canvas rendering engine for imported DOCX files, based on explicit user authorization for this free project.

**Rationale:**
1. Renders actual DOCX structure directly to DOM with full interactive Word-parity editing capabilities.
2. Preserves tables, fonts, images, hyperlinks, headers/footers, lists, alignment natively.
3. Obsoletes the need for a custom `jszip` mutation backend engine, reducing technical debt.
4. AGPLv3 is acceptable due to the non-commercial / free nature of the project as stated by the user.

**Alternatives rejected:**
- `docx-preview`: Limited to viewing, requiring fragile hacky overlays for inline editing.
- Mammoth: Intentionally discards formatting — unsuitable for visual fidelity requirement.

---

## 4. Required Attributions

The following open-source attributions should appear in Interview AI's open-source notices:

```
docx-preview — MIT License — https://github.com/VolodymyrBaydalka/docx-preview
mammoth — MIT License — https://github.com/mwilliamson/mammoth.js
jszip — MIT License — https://stuk.github.io/jszip/
docx — MIT License — https://github.com/dolanmiu/docx
```

---

## 5. Recommendations

1. ✅ Migrate to `SuperDoc` (`@superdoc/react`) for native DOCX editing.
2. ✅ Keep `mammoth` for text extraction (ATS/AI) only.
3. ✅ Ensure AGPLv3 attribution is visible on the platform.
5. 📋 Review this document whenever new DOCX-related dependencies are added
