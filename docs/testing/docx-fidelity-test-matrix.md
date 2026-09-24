# DOCX Fidelity Test Matrix

**Interview AI — Imported DOCX Feature**  
**Version:** 1.0 | **Date:** 2026-09-16

---

## Purpose

This document defines the test fixtures and acceptance criteria for verifying that the imported DOCX canvas accurately renders the original document across all supported resume types.

The primary success criterion is:

> **"If I compare the uploaded DOCX opened in Microsoft Word with the resume shown in the Interview AI canvas, does the canvas represent the same document?"**

---

## Test Fixtures

### Fixture A — Simple One-Column Resume

**Description:** Standard single-column resume with name, contact, summary, experience, education, skills sections. Created in Microsoft Word.

**File:** `tests/fixtures/fixture-a-simple-one-column.docx`

**Verification checklist:**
- [ ] Name displayed correctly at top
- [ ] Contact information (email, phone, location) visible
- [ ] Section headings styled (bold, larger font)
- [ ] Bullet points in experience section preserved
- [ ] Font matches original (no fallback font visible if named font available)
- [ ] Spacing between sections matches original
- [ ] No Interview AI template styling applied

**Edit test:**
- [ ] Edit name field in sidebar → "Save & Preview" → name updated in canvas
- [ ] Download DOCX → reopen in Word → name updated, all other formatting preserved

---

### Fixture B — Two-Column Resume

**Description:** Resume with two-column layout (e.g., left column: contact/skills, right column: experience/education). Common in modern resume designs.

**File:** `tests/fixtures/fixture-b-two-column.docx`

**Verification checklist:**
- [ ] Two-column layout visible in canvas (not collapsed to one column)
- [ ] Left column content (skills, contact) appears on the left
- [ ] Right column content (experience, education) appears on the right
- [ ] Column widths approximately match original
- [ ] Text does not overflow between columns

**Known limitation:** `docx-preview` may partially render complex column layouts. Document any discrepancy in coverage report.

---

### Fixture C — Table-Based Resume

**Description:** Resume using Word tables for alignment (e.g., dates in right cell, job title/company in left cell). Very common in professional resume formats.

**File:** `tests/fixtures/fixture-c-table-based.docx`

**Verification checklist:**
- [ ] Tables rendered as HTML tables (not converted to divs)
- [ ] Table borders/no-border styling matches original
- [ ] Cell content correctly positioned (left vs right columns)
- [ ] Table spanning preserved (merged cells)
- [ ] Editing a table cell in sidebar updates the correct cell text

**Edit test:**
- [ ] Find table cell field in sidebar → edit → "Save & Preview" → cell updated
- [ ] Verify adjacent cells unchanged

---

### Fixture D — Resume with Profile Image

**Description:** Resume with a circular/square profile photo embedded in the header or left column.

**File:** `tests/fixtures/fixture-d-with-image.docx`

**Verification checklist:**
- [ ] Image visible in canvas (not replaced by placeholder)
- [ ] Image position approximately matches original
- [ ] Image not distorted
- [ ] Download DOCX → image still present in output

**Important:** Images are preserved but not directly editable. The coverage report should show `imagesPreserved: 1`.

---

### Fixture E — Resume with Header and Footer

**Description:** Resume with document-level header (e.g., candidate name + page number) and/or footer (e.g., "Page 1 of 2", contact info).

**File:** `tests/fixtures/fixture-e-header-footer.docx`

**Verification checklist:**
- [ ] Header content visible in canvas at top of each page
- [ ] Footer content visible at bottom of each page
- [ ] Header/footer text can be edited via HEADER_REGION / FOOTER_REGION fields in sidebar
- [ ] "Save & Preview" → header/footer updated in canvas
- [ ] Download DOCX → header/footer present in output

**Coverage check:**
- `headersDetected > 0`
- `headersMapped > 0`
- `footersDetected > 0`
- `footersMapped > 0`

---

### Fixture F — Resume with Custom Styling

**Description:** Resume using custom Word styles (not default Normal/Heading styles), custom fonts (e.g., Calibri Light, Lato, Garamond), custom color scheme (e.g., teal headings, dark body).

**File:** `tests/fixtures/fixture-f-custom-styling.docx`

**Verification checklist:**
- [ ] Custom font names visible in canvas (or clear fallback documented)
- [ ] Heading colors match original (e.g., teal headings → teal in canvas)
- [ ] Custom paragraph styles (spacing, indentation) preserved
- [ ] Body text color correct
- [ ] Underline/small-caps/other formatting preserved

**Note:** Web font availability may cause fallback. Document the specific font used and whether it renders correctly.

---

### Fixture G — Multi-Page Resume

**Description:** A 2-3 page resume with page breaks at appropriate locations.

**File:** `tests/fixtures/fixture-g-multi-page.docx`

**Verification checklist:**
- [ ] Multiple pages visible in canvas (separated by visual page breaks)
- [ ] Content on page 2 is on page 2 (not merged into page 1)
- [ ] Page dimensions match (A4 or Letter)
- [ ] Scroll through all pages works smoothly
- [ ] Zoom controls work across all pages

---

### Fixture H — Resume with Hyperlinks

**Description:** Resume containing clickable hyperlinks (LinkedIn URL, GitHub URL, portfolio website, email mailto:).

**File:** `tests/fixtures/fixture-h-hyperlinks.docx`

**Verification checklist:**
- [ ] Hyperlinks rendered with link styling (underlined, colored)
- [ ] Hyperlink text correct
- [ ] Hyperlink URLs editable via `hyperlink_url` field type in sidebar
- [ ] Edit URL → "Save & Preview" → new URL correct
- [ ] Download DOCX → hyperlink target updated in output file

**Coverage check:**
- `hyperlinksDetected > 0`
- `hyperlinksMapped > 0`

---

## Round-Trip Test Protocol

For each fixture (A–H):

```
1. Upload fixture.docx
2. Wait for import to complete (status: ready)
3. Open canvas — SNAPSHOT the canvas rendering
4. Compare SNAPSHOT vs original.docx in Word — document discrepancies
5. Edit one field from each major section (name, one experience bullet, one skill)
6. Click "Save & Preview" — verify canvas updates
7. Click "Download DOCX"
8. Open downloaded file in Microsoft Word
9. Verify:
   a. Edited fields contain new values
   b. Formatting matches original (fonts, colors, spacing)
   c. Tables intact
   d. Images intact
   e. Hyperlinks intact
   f. Page structure intact
10. PASS / FAIL + notes
```

---

## Structural Integrity Checks

After round-trip, verify these counts match between original and output:

| Metric | How to check |
|--------|-------------|
| Page count | Open in Word → page count |
| Paragraph count | `DocxOutputValidator.paragraphCountBefore == paragraphCountAfter` |
| Table count | `tableCountBefore == tableCountAfter` |
| Image RelIDs | `imageRelIdsBefore == imageRelIdsAfter` |
| Numbering XML | Must be unchanged (never modified) |
| Styles XML | Must be unchanged (never modified) |
| Heading count | Must be unchanged |

---

## Known Unsupported Features

Document these in the UI via coverage warnings:

| Feature | Status | Message shown |
|---------|--------|--------------|
| Text boxes | ❌ Read-only | "Text box content is preserved but cannot be edited" |
| SmartArt | ❌ Preserved as-is | "SmartArt graphics are preserved but not editable" |
| Embedded Excel tables | ❌ Preserved | "Embedded objects are preserved but not editable" |
| Tracked changes | ⚠️ Preserved | "Document contains tracked changes. Accepting/rejecting not supported" |
| Password protection | ❌ Rejected | "Cannot open password-protected documents" |
| Macros | ❌ Stripped | "Macros are not supported and have been removed" |

---

## Automated Test Commands

```bash
# Run existing DOCX preservation tests
cd apps/api-node
npm test -- tests/docx-preservation.test.ts

# Run structure preservation tests
npm test -- tests/structure-preservation.test.ts

# Run all DOCX-related tests
npm test -- tests/docx-preservation.test.ts tests/structure-preservation.test.ts tests/critical-e2e-preservation.test.ts
```

---

## Acceptance Criteria — PASS/FAIL

| Test | Pass Condition |
|------|---------------|
| Fixture A renders | Canvas shows recognizable one-column resume layout |
| Fixture B renders | Two-column layout visible |
| Fixture C renders | Table structure visible, cells in correct positions |
| Fixture D renders | Image visible in canvas |
| Fixture E renders | Header/footer visible in canvas |
| Fixture F renders | Custom styling applied (colors/fonts) |
| Fixture G renders | Multiple pages visible and scrollable |
| Fixture H renders | Hyperlinks visible |
| Round-trip A | Downloaded DOCX opens in Word with edit applied |
| Round-trip H | Hyperlink URL updated in downloaded DOCX |
| No template applied | No Interview AI purple/rounded-card styling in canvas |
| Mammoth not used | Canvas renders via `docx-preview` (confirmed in source) |
