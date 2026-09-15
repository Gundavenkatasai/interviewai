# ATS Optimization: Original Document Formatting Preservation Engine

## Overview
This document outlines the architecture for the "ATS Checker -> Optimize" flow in Interview AI. Unlike standard LLM-based resume generation systems that discard the user's styling, this engine specifically mutates the original `.docx` file uploaded by the user, preserving all structural and stylistic elements.

## Core Flow
1. **Upload & ATS Check**: User uploads `Resume.docx`. It is evaluated by `AtsEvaluator`.
2. **AI Tailoring**: The LLM suggests specific improvements (swaps) mapped to exact `originalText`.
3. **Format-Preserving Application (`DocxEngine`)**:
   - Locates target text across all paragraphs and tables using a combination of structure maps and heuristics.
   - Updates text dynamically inside `<w:r>` runs without deleting Word's formatting metadata (`<w:rPr>`).
   - Identifies new technical terms inserted by AI and applies bold formatting if the original text was bold or based on vocabulary.
4. **Validation (Structural Integrity Check)**:
   - Evaluates the document AST after changes. 
   - **Crucial**: Aborts modification if `bulletCountBefore !== bulletCountAfter`.
5. **Re-Scanning (Zero Fake Scores)**: The newly modified `.docx` is physically saved and re-scanned through `AtsEvaluator` to generate the final ATS pass score and the "Before/After" delta report.

## The PSR-94 DocxEngine Port
This logic is deeply inspired by `PSR94/resume-tailor`.
Instead of treating a document as plain text, we parse `word/document.xml`.

### Table Traversal
To support complex templates, `extractParagraphXmls` traverses the XML flatly to locate `<w:p>`. Word represents all text inside `<w:p>`, regardless of whether it is nested in `<w:tc>` (table cell) or flat in the document body.

### Run Formatting (`<w:rPr>`)
A word is split across multiple runs (`<w:r>`). When updating a sentence, the `DocxEngine` aligns the new text prefix with the old text. Where they diverge, it generates new runs utilizing the `baseRPr` (Base Run Properties) of the original paragraph, ensuring font families, sizes, margins, and custom styles are untouched.

## Security & Failure Constraints
- **Idempotency**: Requests map to a `tailoringRunId` hash.
- **Failures**: If target text is not found (due to manual user editing in another app), the swap is cleanly skipped and reported as `TARGET_NOT_FOUND`.
- **Protected Fields**: Name, contact details, and dates are isolated via heuristics (`isRoleHeader`) to prevent accidental AI rewrites of non-experience data.

## Testing Strategy
The suite in `tests/e2e/ats-optimize-preserves-original-format.spec.ts` ensures that AST mutations maintain exact table and bullet-point integrity.
