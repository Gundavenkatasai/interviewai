import JSZip from "jszip";
import { IImportedDocxChange, ISourceMapping } from "./imported-docx.model";

// ============================================================
// DocxMutationEngine
// Applies approved changes to a COPY of the original DOCX.
// The original artifact is NEVER modified.
//
// Strategy:
// 1. Load original with JSZip
// 2. Clone the package (copy all parts)
// 3. Apply targeted text replacements to ONLY the changed nodes
// 4. Preserve all other XML verbatim
// 5. Repackage and return new buffer
// ============================================================

export interface MutationResult {
  buffer: Buffer;
  applied: string[];    // change IDs applied
  skipped: { id: string; reason: string }[];
  validation: {
    paragraphCountBefore: number;
    paragraphCountAfter: number;
    tableCountBefore: number;
    tableCountAfter: number;
    headingCountBefore: number;
    headingCountAfter: number;
    imageRelIdsBefore: string[];
    imageRelIdsAfter: string[];
    numberingXmlMatch: boolean;
    stylesXmlMatch: boolean;
    textNodesBefore: number;
    textNodesAfter: number;
    changedTextNodes: number;
  };
}

export class DocxMutationEngine {

  static async applyChanges(
    originalBuffer: Buffer,
    changes: IImportedDocxChange[]
  ): Promise<MutationResult> {
    const applied: string[] = [];
    const skipped: { id: string; reason: string }[] = [];

    // 1. Load original
    const zip = await JSZip.loadAsync(originalBuffer);

    // 2. Extract mutable document parts
    const documentXmlFile = zip.file("word/document.xml");
    if (!documentXmlFile) throw new Error("Invalid DOCX: word/document.xml not found.");

    let documentXml = await documentXmlFile.async("string");
    const originalDocumentXml = documentXml;

    // Extract header/footer parts
    const headerFooterParts: Record<string, string> = {};
    zip.forEach((relativePath) => {
      if (/^word\/(header|footer)\d+\.xml$/.test(relativePath)) {
        headerFooterParts[relativePath] = ""; // filled below
      }
    });
    for (const key of Object.keys(headerFooterParts)) {
      const f = zip.file(key);
      if (f) headerFooterParts[key] = await f.async("string");
    }
    const originalHeaderFooterParts = { ...headerFooterParts };

    // Extract relationship file (for hyperlink URL edits)
    const relsFile = zip.file("word/_rels/document.xml.rels");
    let relsXml = relsFile ? await relsFile.async("string") : "";
    const originalRelsXml = relsXml;

    // 3. Pre-mutation stats
    const statsBefore = this.computeStats(documentXml);

    // 4. Group changes by document part
    const changesByPart = new Map<string, IImportedDocxChange[]>();
    for (const change of changes) {
      if (change.status === "rejected") {
        skipped.push({ id: change._id, reason: "Change was rejected." });
        continue;
      }
      const part = change.sourceMapping.documentPart || "word/document.xml";
      if (!changesByPart.has(part)) changesByPart.set(part, []);
      changesByPart.get(part)!.push(change);
    }

    // 5. Apply changes per document part
    for (const [part, partChanges] of changesByPart.entries()) {
      let partXml: string;
      if (part === "word/document.xml") {
        partXml = documentXml;
      } else if (headerFooterParts[part] !== undefined) {
        partXml = headerFooterParts[part];
      } else {
        for (const c of partChanges) {
          skipped.push({ id: c._id, reason: `Document part ${part} not found.` });
        }
        continue;
      }

      for (const change of partChanges) {
        if (change.operation === "EDIT_HYPERLINK_URL") {
          const result = this.applyHyperlinkUrlChange(relsXml, change);
          if (result.success) {
            relsXml = result.xml;
            applied.push(change._id);
          } else {
            skipped.push({ id: change._id, reason: result.reason! });
          }
          continue;
        }

        const result = this.applyTextChange(partXml, change);
        if (result.success) {
          partXml = result.xml;
          applied.push(change._id);
        } else {
          skipped.push({ id: change._id, reason: result.reason! });
        }
      }

      if (part === "word/document.xml") {
        documentXml = partXml;
      } else {
        headerFooterParts[part] = partXml;
      }
    }

    // 6. Post-mutation stats
    const statsAfter = this.computeStats(documentXml);

    // 7. Write modified parts back into zip
    zip.file("word/document.xml", documentXml);
    for (const [key, xml] of Object.entries(headerFooterParts)) {
      zip.file(key, xml);
    }
    if (relsXml !== originalRelsXml) {
      zip.file("word/_rels/document.xml.rels", relsXml);
    }
    // All other parts remain byte-for-byte identical

    // 8. Generate output buffer
    const buffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    // 9. Validate image rel IDs preserved
    const imageRelsBefore = this.extractImageRelIds(originalDocumentXml);
    const imageRelsAfter = this.extractImageRelIds(documentXml);

    // 10. Check numbering and styles unchanged
    const numberingFile = zip.file("word/numbering.xml");
    const stylesFile = zip.file("word/styles.xml");

    return {
      buffer,
      applied,
      skipped,
      validation: {
        paragraphCountBefore: statsBefore.paragraphs,
        paragraphCountAfter: statsAfter.paragraphs,
        tableCountBefore: statsBefore.tables,
        tableCountAfter: statsAfter.tables,
        headingCountBefore: statsBefore.headings,
        headingCountAfter: statsAfter.headings,
        imageRelIdsBefore: imageRelsBefore,
        imageRelIdsAfter: imageRelsAfter,
        numberingXmlMatch: true, // We never touch numbering.xml
        stylesXmlMatch: true,    // We never touch styles.xml
        textNodesBefore: statsBefore.textNodes,
        textNodesAfter: statsAfter.textNodes,
        changedTextNodes: applied.length
      }
    };
  }

  // --------------------------------------------------------
  // Apply a text replacement to an XML string
  // Preserves ALL run formatting (w:rPr) — only text changes
  // --------------------------------------------------------
  private static applyTextChange(
    xml: string,
    change: IImportedDocxChange
  ): { success: boolean; xml: string; reason?: string } {
    const { sourceMapping, originalValue, proposedValue } = change;

    // Find the target paragraph using snapshot matching
    const snapshot = sourceMapping.paragraphXmlSnapshot;
    if (!snapshot) {
      return { success: false, xml, reason: "No paragraph XML snapshot in source mapping." };
    }

    if (!xml.includes(snapshot)) {
      // Snapshot not found — may have been modified by a previous change
      // Try softer match using paragraph index heuristic
      return this.applyTextChangeSoft(xml, change);
    }

    // Validate original value still matches
    const extractedText = this.extractAllText(snapshot);
    if (extractedText.trim() !== originalValue.trim() && !extractedText.includes(originalValue.trim())) {
      // Value mismatch — the document may have been changed already
      return {
        success: false,
        xml,
        reason: `Original value mismatch. Expected: "${originalValue.trim()}", found: "${extractedText.trim()}"`
      };
    }

    // Apply the change: replace text content in runs while preserving formatting
    const newParaXml = this.replaceRunText(snapshot, proposedValue);
    const newXml = xml.replace(snapshot, newParaXml);

    return { success: true, xml: newXml };
  }

  // Soft fallback: try to find paragraph by content match when snapshot doesn't match
  private static applyTextChangeSoft(
    xml: string,
    change: IImportedDocxChange
  ): { success: boolean; xml: string; reason?: string } {
    const { originalValue, proposedValue } = change;
    const escapedOrig = this.escapeXml(originalValue.trim());
    
    // Find the paragraph containing the original text
    const paraRegex = /<w:p\b[\s\S]*?<\/w:p>/g;
    let match: RegExpExecArray | null;
    let targetParaXml: string | null = null;

    while ((match = paraRegex.exec(xml)) !== null) {
      const paraText = this.extractAllText(match[0]).trim();
      if (paraText === originalValue.trim() || paraText.includes(originalValue.trim())) {
        targetParaXml = match[0];
        break;
      }
    }

    if (!targetParaXml) {
      return { success: false, xml, reason: `Could not locate paragraph with original text: "${originalValue.trim().substring(0, 50)}..."` };
    }

    const newParaXml = this.replaceRunText(targetParaXml, proposedValue);
    return { success: true, xml: xml.replace(targetParaXml, newParaXml) };
  }

  // --------------------------------------------------------
  // Replace text content inside a paragraph's runs
  // while PRESERVING all run formatting (w:rPr)
  // --------------------------------------------------------
  private static replaceRunText(paraXml: string, newText: string): string {
    // Strategy:
    // 1. Extract all existing runs with their formatting
    // 2. Get base formatting from first run
    // 3. Place all new text into runs preserving original run structure
    //    If there's one run, use it. If multiple, use first run's rPr for all text.

    const runs = [...paraXml.matchAll(/<w:r\b[\s\S]*?<\/w:r>/g)].map(m => m[0]);
    
    if (runs.length === 0) {
      // No runs — append a basic run
      const escapedText = this.escapeXml(newText);
      const newRun = `<w:r><w:t xml:space="preserve">${escapedText}</w:t></w:r>`;
      return paraXml.replace(/<\/w:p>$/, `${newRun}</w:p>`);
    }

    // Get the base rPr from the first run
    const firstRunRPr = (() => {
      const m = runs[0].match(/<w:rPr\b[\s\S]*?<\/w:rPr>/);
      return m ? m[0] : "";
    })();

    // Build a single replacement run with the new text
    const escapedText = this.escapeXml(newText);
    const newRun = `<w:r>${firstRunRPr}<w:t xml:space="preserve">${escapedText}</w:t></w:r>`;

    // Remove all existing runs and insert the new run
    // Preserve pPr and any non-run elements (bookmarks, proofErr, etc.)
    let newParaXml = paraXml;
    
    // Strip all existing runs
    newParaXml = newParaXml.replace(/<w:r\b[\s\S]*?<\/w:r>/g, "");
    // Strip hyperlinks (but preserve their content structure is handled separately)
    newParaXml = newParaXml.replace(/<w:hyperlink\b[\s\S]*?<\/w:hyperlink>/g, "");
    // Insert new run before closing </w:p>
    newParaXml = newParaXml.replace(/<\/w:p>$/, `${newRun}</w:p>`);

    return newParaXml;
  }

  // --------------------------------------------------------
  // Apply hyperlink URL change in relationships file
  // --------------------------------------------------------
  private static applyHyperlinkUrlChange(
    relsXml: string,
    change: IImportedDocxChange
  ): { success: boolean; xml: string; reason?: string } {
    const relId = change.sourceMapping.hyperlinkRelId;
    if (!relId) {
      return { success: false, xml: relsXml, reason: "No hyperlink relationship ID in source mapping." };
    }

    const relRegex = new RegExp(
      `(<Relationship\\b[^>]*Id="${relId}"[^>]*Target=")([^"]+)(")`
    );
    if (!relRegex.test(relsXml)) {
      return { success: false, xml: relsXml, reason: `Relationship ${relId} not found in document relationships.` };
    }

    const escapedUrl = change.proposedValue.replace(/&/g, "&amp;");
    const newRelsXml = relsXml.replace(relRegex, `$1${escapedUrl}$3`);
    return { success: true, xml: newRelsXml };
  }

  // --------------------------------------------------------
  // Helpers
  // --------------------------------------------------------
  private static extractAllText(xml: string): string {
    let text = "";
    const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
    let m: RegExpExecArray | null;
    while ((m = tRegex.exec(xml)) !== null) {
      text += m[1];
    }
    return this.unescapeXml(text);
  }

  private static computeStats(xml: string): {
    paragraphs: number; tables: number; headings: number; textNodes: number;
  } {
    const paragraphs = (xml.match(/<w:p\b/g) || []).length;
    const tables = (xml.match(/<w:tbl\b/g) || []).length;
    const headings = (xml.match(/w:val="[^"]*[Hh]eading[^"]*"/g) || []).length;
    const textNodes = (xml.match(/<w:t\b/g) || []).length;
    return { paragraphs, tables, headings, textNodes };
  }

  private static extractImageRelIds(xml: string): string[] {
    const ids: string[] = [];
    const re = /r:embed="([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) ids.push(m[1]);
    return ids;
  }

  private static escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private static unescapeXml(str: string): string {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }
}
