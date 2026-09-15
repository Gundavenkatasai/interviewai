import { DocxPackage } from "./docx-inspector";
import { ISourceMapping, FieldType } from "./imported-docx.model";
import crypto from "crypto";

// ============================================================
// DocxStructureExtractor
// Walks OOXML DOM using regex-based parsing and produces a
// typed node tree with full source mappings.
// This is intentionally NOT using high-level libraries so that
// unsupported structures are preserved, not silently dropped.
// ============================================================

export interface DocxRun {
  runIndex: number;
  text: string;
  rawXml: string;
  rPr: string;             // <w:rPr> XML
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  color?: string;
  fontName?: string;
  fontSize?: number;
}

export interface DocxParagraph {
  paragraphIndex: number; // Global 0-based index within the document part
  rawXml: string;
  plainText: string;
  runs: DocxRun[];
  pPr: string;            // <w:pPr> XML (paragraph properties)
  styleId?: string;
  numId?: string;
  numIlvl?: number;
  isHeading: boolean;
  isBullet: boolean;
  isListItem: boolean;
  indentLeft?: number;
  alignment?: string;
  hyperlinks: DocxHyperlink[];
  documentPart: string;
}

export interface DocxHyperlink {
  relId: string;
  displayText: string;
  url?: string;          // Resolved from relationships
  runIndices: number[];
}

export interface DocxTableCell {
  cellIndex: number;
  rawXml: string;
  paragraphs: DocxParagraph[];
  colspan?: number;        // w:gridSpan
  isVMerged?: boolean;     // w:vMerge
  cellPr?: string;
}

export interface DocxTableRow {
  rowIndex: number;
  rawXml: string;
  cells: DocxTableCell[];
}

export interface DocxTable {
  tableIndex: number;
  rawXml: string;
  rows: DocxTableRow[];
  tblPr?: string;
  documentPart: string;
}

export interface DocxNode {
  nodeType: "paragraph" | "table" | "textbox";
  paragraph?: DocxParagraph;
  table?: DocxTable;
  textboxContent?: string;  // Raw XML of text box — preserved but not directly editable
  isEditable: boolean;
  editWarning?: string;
}

export interface DocxNodeTree {
  documentPart: string;
  nodes: DocxNode[];
  totalParagraphs: number;
  totalRuns: number;
  totalTables: number;
  totalHyperlinks: number;
  totalImages: number;
  totalTextBoxes: number;
}

export interface HyperlinkRelationships {
  [relId: string]: string; // relId → URL
}

export class DocxStructureExtractor {

  // --------------------------------------------------------
  // Main entry: extract node tree from one document part
  // --------------------------------------------------------
  static extract(xml: string, documentPart: string, pkg: DocxPackage): DocxNodeTree {
    const relationships = this.parseRelationships(pkg.relationships);
    const body = this.extractBody(xml);

    const nodes: DocxNode[] = [];
    let totalParagraphs = 0;
    let totalRuns = 0;
    let totalTables = 0;
    let totalHyperlinks = 0;
    let totalImages = 0;
    let totalTextBoxes = 0;

    // Split body into top-level elements (paragraphs, tables, sectPr)
    // We process them in order to maintain document sequence
    const elements = this.splitBodyElements(body);
    let paragraphGlobalIndex = 0;
    let tableGlobalIndex = 0;

    for (const el of elements) {
      if (el.tag === "w:p") {
        const para = this.extractParagraph(el.xml, paragraphGlobalIndex, documentPart, relationships);
        nodes.push({ nodeType: "paragraph", paragraph: para, isEditable: para.runs.length > 0 || para.plainText.length > 0 });
        paragraphGlobalIndex++;
        totalParagraphs++;
        totalRuns += para.runs.length;
        totalHyperlinks += para.hyperlinks.length;
      } else if (el.tag === "w:tbl") {
        const table = this.extractTable(el.xml, tableGlobalIndex, paragraphGlobalIndex, documentPart, relationships);
        nodes.push({ nodeType: "table", table, isEditable: true });
        tableGlobalIndex++;
        totalTables++;
        // Count paragraphs inside table cells (but don't add to global paragraph index
        // because they're in nested context)
        for (const row of table.rows) {
          for (const cell of row.cells) {
            totalParagraphs += cell.paragraphs.length;
            for (const cp of cell.paragraphs) {
              totalRuns += cp.runs.length;
              totalHyperlinks += cp.hyperlinks.length;
            }
          }
        }
      } else if (el.tag === "mc:AlternateContent" || el.tag === "w:drawing" || el.tag === "v:shape") {
        // Check if it contains a text box
        if (el.xml.includes("w:txbxContent") || el.xml.includes("v:txbx")) {
          totalTextBoxes++;
          nodes.push({
            nodeType: "textbox",
            textboxContent: el.xml,
            isEditable: false,
            editWarning: "Text box content is preserved but cannot be directly edited in this version."
          });
        } else if (el.xml.includes("a:blip") || el.xml.includes("v:imagedata")) {
          totalImages++;
          // Images are embedded — don't create a node but count them
        }
      }
    }

    // Count images from media files
    if (documentPart === "word/document.xml") {
      totalImages += pkg.mediaFiles.length;
    }

    return {
      documentPart,
      nodes,
      totalParagraphs,
      totalRuns,
      totalTables,
      totalHyperlinks,
      totalImages: documentPart === "word/document.xml" ? totalImages : 0,
      totalTextBoxes
    };
  }

  // --------------------------------------------------------
  // Extract paragraph with all its runs and properties
  // --------------------------------------------------------
  private static extractParagraph(
    paraXml: string,
    paragraphIndex: number,
    documentPart: string,
    relationships: HyperlinkRelationships
  ): DocxParagraph {
    const pPrMatch = paraXml.match(/<w:pPr\b[\s\S]*?<\/w:pPr>/);
    const pPr = pPrMatch ? pPrMatch[0] : "";

    const styleId = this.extractAttr(pPr, /w:pStyle\b[^>]*w:val="([^"]+)"/);
    const numId = this.extractAttr(pPr, /<w:numId\b[^>]*w:val="([^"]+)"/);
    const numIlvlMatch = pPr.match(/<w:ilvl\b[^>]*w:val="([^"]+)"/);
    const numIlvl = numIlvlMatch ? parseInt(numIlvlMatch[1]) : undefined;
    const indentMatch = pPr.match(/<w:ind\b[^>]*w:left="([^"]+)"/);
    const indentLeft = indentMatch ? parseInt(indentMatch[1]) : undefined;
    const alignMatch = pPr.match(/<w:jc\b[^>]*w:val="([^"]+)"/);
    const alignment = alignMatch ? alignMatch[1] : undefined;

    const runs: DocxRun[] = [];
    const hyperlinks: DocxHyperlink[] = [];
    let runIndex = 0;

    // Extract runs, including those inside hyperlinks
    // We need to handle: direct <w:r>, and <w:hyperlink> containing <w:r>
    const contentRegion = paraXml.replace(/<w:pPr[\s\S]*?<\/w:pPr>/, "");

    // Find hyperlinks first so we can track their run indices
    const hyperlinkRegex = /<w:hyperlink\b([\s\S]*?)(<\/w:hyperlink>)/g;
    let hlMatch: RegExpExecArray | null;
    const hyperlinkRanges: { start: number; end: number; relId: string; xml: string }[] = [];
    while ((hlMatch = hyperlinkRegex.exec(contentRegion)) !== null) {
      const relIdMatch = hlMatch[0].match(/r:id="([^"]+)"/);
      if (relIdMatch) {
        hyperlinkRanges.push({
          start: hlMatch.index,
          end: hlMatch.index + hlMatch[0].length,
          relId: relIdMatch[1],
          xml: hlMatch[0]
        });
      }
    }

    // Now extract all runs in order
    const runRegex = /<w:r\b[\s\S]*?<\/w:r>/g;
    let rMatch: RegExpExecArray | null;

    while ((rMatch = runRegex.exec(contentRegion)) !== null) {
      const runXml = rMatch[0];
      const rPrMatch = runXml.match(/<w:rPr\b[\s\S]*?<\/w:rPr>/);
      const rPr = rPrMatch ? rPrMatch[0] : "";

      const text = this.extractRunText(runXml);
      const isBold = /(<w:b\b(?!\s*w:val="(?:0|false)")[^>]*\/>|<w:b\b(?!\s*w:val="(?:0|false)")[^>]*><\/w:b>)/i.test(rPr);
      const isItalic = /(<w:i\b(?!\s*w:val="(?:0|false)")[^>]*\/>|<w:i\b(?!\s*w:val="(?:0|false)")[^>]*><\/w:i>)/i.test(rPr);
      const isUnderline = /<w:u\b[^>]*w:val="(?!none)[^"]*"/.test(rPr);

      const colorMatch = rPr.match(/<w:color\b[^>]*w:val="([^"]+)"/);
      const fontMatch = rPr.match(/<w:rFonts\b[^>]*(?:w:ascii|w:cs)="([^"]+)"/);
      const sizeMatch = rPr.match(/<w:sz\b[^>]*w:val="([^"]+)"/);

      const runPos = rMatch.index;
      // Check if this run is inside a hyperlink
      for (const hl of hyperlinkRanges) {
        if (runPos >= hl.start && runPos < hl.end) {
          // Check if already recorded
          const existing = hyperlinks.find(h => h.relId === hl.relId);
          if (existing) {
            existing.runIndices.push(runIndex);
            existing.displayText += text;
          } else {
            hyperlinks.push({
              relId: hl.relId,
              displayText: text,
              url: relationships[hl.relId],
              runIndices: [runIndex]
            });
          }
          break;
        }
      }

      runs.push({
        runIndex,
        text,
        rawXml: runXml,
        rPr,
        isBold,
        isItalic,
        isUnderline,
        color: colorMatch ? colorMatch[1] : undefined,
        fontName: fontMatch ? fontMatch[1] : undefined,
        fontSize: sizeMatch ? Math.round(parseInt(sizeMatch[1]) / 2) : undefined
      });
      runIndex++;
    }

    const plainText = runs.map(r => r.text).join("");

    const isHeading = this.classifyHeading(styleId, pPr, plainText);
    const isBullet = !!(numId) || /^[•·*\-–—▪▫◦✦➢]\s/.test(plainText);
    const isListItem = !!(numId) || isBullet;

    return {
      paragraphIndex,
      rawXml: paraXml,
      plainText,
      runs,
      pPr,
      styleId: styleId || undefined,
      numId: numId || undefined,
      numIlvl,
      isHeading,
      isBullet,
      isListItem,
      indentLeft,
      alignment,
      hyperlinks,
      documentPart
    };
  }

  // --------------------------------------------------------
  // Extract table with rows and cells
  // --------------------------------------------------------
  private static extractTable(
    tableXml: string,
    tableIndex: number,
    startParagraphIndex: number,
    documentPart: string,
    relationships: HyperlinkRelationships
  ): DocxTable {
    const tblPrMatch = tableXml.match(/<w:tblPr\b[\s\S]*?<\/w:tblPr>/);
    const tblPr = tblPrMatch ? tblPrMatch[0] : "";

    const rows: DocxTableRow[] = [];
    const rowRegex = /<w:tr\b[\s\S]*?<\/w:tr>/g;
    let rowMatch: RegExpExecArray | null;
    let rowIndex = 0;
    let paraOffset = startParagraphIndex;

    while ((rowMatch = rowRegex.exec(tableXml)) !== null) {
      const rowXml = rowMatch[0];
      const cells: DocxTableCell[] = [];

      const cellRegex = /<w:tc\b[\s\S]*?<\/w:tc>/g;
      let cellMatch: RegExpExecArray | null;
      let cellIndex = 0;

      while ((cellMatch = cellRegex.exec(rowXml)) !== null) {
        const cellXml = cellMatch[0];
        const cellPrMatch = cellXml.match(/<w:tcPr\b[\s\S]*?<\/w:tcPr>/);
        const cellPr = cellPrMatch ? cellPrMatch[0] : "";
        const gridSpanMatch = cellPr.match(/<w:gridSpan\b[^>]*w:val="([^"]+)"/);
        const vMergeMatch = cellPr.match(/<w:vMerge\b/);

        const cellParas: DocxParagraph[] = [];
        const paraRegex = /<w:p\b[\s\S]*?<\/w:p>/g;
        let pMatch: RegExpExecArray | null;
        let cellParaIndex = 0;
        while ((pMatch = paraRegex.exec(cellXml)) !== null) {
          const p = this.extractParagraph(pMatch[0], paraOffset, documentPart, relationships);
          // Override paragraph index to be global
          p.paragraphIndex = paraOffset;
          cellParas.push(p);
          paraOffset++;
          cellParaIndex++;
        }

        cells.push({
          cellIndex,
          rawXml: cellXml,
          paragraphs: cellParas,
          colspan: gridSpanMatch ? parseInt(gridSpanMatch[1]) : undefined,
          isVMerged: !!vMergeMatch,
          cellPr
        });
        cellIndex++;
      }

      rows.push({ rowIndex, rawXml: rowXml, cells });
      rowIndex++;
    }

    return {
      tableIndex,
      rawXml: tableXml,
      rows,
      tblPr,
      documentPart
    };
  }

  // --------------------------------------------------------
  // Parse relationship file to get URL map
  // --------------------------------------------------------
  static parseRelationships(relsXml: string): HyperlinkRelationships {
    const map: HyperlinkRelationships = {};
    if (!relsXml) return map;
    const relRegex = /<Relationship\b[^>]*Id="([^"]+)"[^>]*Type="[^"]*hyperlink[^"]*"[^>]*Target="([^"]+)"/gi;
    let m: RegExpExecArray | null;
    while ((m = relRegex.exec(relsXml)) !== null) {
      map[m[1]] = m[2];
    }
    return map;
  }

  // --------------------------------------------------------
  // Helpers
  // --------------------------------------------------------
  private static extractBody(xml: string): string {
    const bodyMatch = xml.match(/<w:body\b[\s\S]*?<\/w:body>/);
    return bodyMatch ? bodyMatch[0] : xml;
  }

  private static splitBodyElements(bodyXml: string): { tag: string; xml: string }[] {
    const elements: { tag: string; xml: string }[] = [];
    // We need to split on top-level w:p, w:tbl, mc:AlternateContent
    // Use a depth-aware approach
    let pos = 0;
    const tagStart = /<(w:p|w:tbl|mc:AlternateContent|w:drawing|v:shape|w:sectPr)\b/g;
    let match: RegExpExecArray | null;

    while ((match = tagStart.exec(bodyXml)) !== null) {
      const tag = match[1];
      if (tag === "w:sectPr") continue;

      const openTag = match[0];
      const closeTag = `</${tag}>`;
      const selfClose = match[0].endsWith("/>");

      if (selfClose) {
        elements.push({ tag, xml: match[0] });
        continue;
      }

      // Find the matching closing tag (depth-aware)
      let depth = 1;
      let searchPos = match.index + openTag.length;
      const openRe = new RegExp(`<${tag}\\b`, "g");
      const closeRe = new RegExp(`<\\/${tag}>`, "g");
      openRe.lastIndex = searchPos;
      closeRe.lastIndex = searchPos;

      let closingPos = -1;
      while (depth > 0) {
        const nextOpen = openRe.exec(bodyXml);
        const nextClose = closeRe.exec(bodyXml);
        if (!nextClose) break;
        if (nextOpen && nextOpen.index < nextClose.index) {
          depth++;
          openRe.lastIndex = nextOpen.index + nextOpen[0].length;
          closeRe.lastIndex = openRe.lastIndex;
        } else {
          depth--;
          if (depth === 0) {
            closingPos = nextClose.index + nextClose[0].length;
          }
          openRe.lastIndex = nextClose.index + nextClose[0].length;
          closeRe.lastIndex = openRe.lastIndex;
        }
      }

      if (closingPos > 0) {
        elements.push({ tag, xml: bodyXml.substring(match.index, closingPos) });
        tagStart.lastIndex = closingPos;
      }
    }

    return elements;
  }

  private static extractRunText(runXml: string): string {
    let text = "";
    const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
    let m: RegExpExecArray | null;
    while ((m = tRegex.exec(runXml)) !== null) {
      text += m[1];
    }
    text += runXml.includes("<w:tab/>") ? "\t" : "";
    return this.unescapeXml(text);
  }

  private static unescapeXml(str: string): string {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  private static extractAttr(xml: string, regex: RegExp): string | null {
    const m = xml.match(regex);
    return m ? m[1] : null;
  }

  private static classifyHeading(styleId: string | null, pPr: string, text: string): boolean {
    if (!text || !text.trim()) return false;
    if (styleId && /heading/i.test(styleId)) return true;
    if (styleId && /title/i.test(styleId)) return true;
    if (text.trim().length < 60 && text.trim() === text.trim().toUpperCase() && /[A-Z]/.test(text)) return true;
    return false;
  }

  // --------------------------------------------------------
  // Build a formatting fingerprint for validation
  // --------------------------------------------------------
  static buildFormattingFingerprint(runs: DocxRun[]): string {
    const sig = runs.map(r => `${r.isBold}|${r.isItalic}|${r.isUnderline}|${r.color || ""}|${r.fontName || ""}|${r.fontSize || ""}`).join(",");
    return crypto.createHash("md5").update(sig).digest("hex").substring(0, 8);
  }

  // --------------------------------------------------------
  // Build source mapping for a paragraph field
  // --------------------------------------------------------
  static buildParagraphSourceMapping(
    para: DocxParagraph,
    tableIndex?: number,
    rowIndex?: number,
    cellIndex?: number,
    cellParagraphIndex?: number
  ): ISourceMapping {
    const mapping: ISourceMapping = {
      documentPart: para.documentPart,
      paragraphIndex: para.paragraphIndex,
      runIndices: para.runs.map(r => r.runIndex),
      originalRunXmls: para.runs.map(r => r.rawXml),
      paragraphXmlSnapshot: para.rawXml
    };
    if (tableIndex !== undefined) {
      mapping.tableIndex = tableIndex;
      mapping.rowIndex = rowIndex;
      mapping.cellIndex = cellIndex;
      mapping.cellParagraphIndex = cellParagraphIndex;
    }
    return mapping;
  }
}
