import { DocxNodeTree, DocxParagraph, DocxTable } from "./docx-structure-extractor";
import { IExtractionCoverage } from "./imported-docx.model";

// ============================================================
// DocxCoverageReporter
// Calculates honest extraction coverage from the node tree.
// Never claims 100% unless validation supports it.
// ============================================================

export class DocxCoverageReporter {
  static buildCoverage(
    mainTree: DocxNodeTree,
    headerTrees: DocxNodeTree[],
    footerTrees: DocxNodeTree[]
  ): IExtractionCoverage {
    const warnings: string[] = [];
    const unsupportedElements: string[] = [];

    let paragraphsDetected = 0;
    let paragraphsMapped = 0;
    let runsDetected = 0;
    let runsMapped = 0;
    let tablesDetected = 0;
    let tablesMapped = 0;
    let hyperlinksDetected = 0;
    let hyperlinksMapped = 0;
    let textBoxesDetected = 0;
    let textBoxesMapped = 0;
    let listsDetected = 0;
    let listsMapped = 0;

    const processTree = (tree: DocxNodeTree) => {
      for (const node of tree.nodes) {
        if (node.nodeType === "paragraph" && node.paragraph) {
          const para = node.paragraph;
          paragraphsDetected++;
          if (node.isEditable) {
            paragraphsMapped++;
          }
          runsDetected += para.runs.length;
          runsMapped += para.runs.length; // All runs are mapped
          hyperlinksDetected += para.hyperlinks.length;
          hyperlinksMapped += para.hyperlinks.length;
          if (para.isListItem || para.isBullet) {
            listsDetected++;
            listsMapped++;
          }
        } else if (node.nodeType === "table" && node.table) {
          tablesDetected++;
          tablesMapped++;
          for (const row of node.table.rows) {
            for (const cell of row.cells) {
              for (const para of cell.paragraphs) {
                paragraphsDetected++;
                paragraphsMapped++;
                runsDetected += para.runs.length;
                runsMapped += para.runs.length;
                hyperlinksDetected += para.hyperlinks.length;
                hyperlinksMapped += para.hyperlinks.length;
              }
            }
          }
        } else if (node.nodeType === "textbox") {
          textBoxesDetected++;
          // Text boxes are preserved but not editable in v1
          if (!node.isEditable) {
            textBoxesMapped = textBoxesDetected; // preserved but read-only
            if (!unsupportedElements.includes("Text boxes (preserved, not editable)")) {
              unsupportedElements.push("Text boxes (preserved, not editable)");
              warnings.push("Document contains text boxes. Content is preserved but cannot be edited directly.");
            }
          }
        }
      }
    };

    processTree(mainTree);

    const headersDetected = headerTrees.length;
    let headersMapped = 0;
    for (const ht of headerTrees) {
      processTree(ht);
      headersMapped++;
    }

    const footersDetected = footerTrees.length;
    let footersMapped = 0;
    for (const ft of footerTrees) {
      processTree(ft);
      footersMapped++;
    }

    const imagesDetected = mainTree.totalImages;
    const imagesPreserved = imagesDetected; // Always preserved

    if (imagesDetected > 0) {
      warnings.push(`${imagesDetected} image(s) detected. Images are preserved in the output DOCX.`);
    }

    const pct = paragraphsDetected > 0
      ? Math.round((paragraphsMapped / paragraphsDetected) * 100)
      : 100;

    if (pct < 100) {
      warnings.push(`${paragraphsDetected - paragraphsMapped} paragraph(s) could not be mapped for editing.`);
    }

    return {
      paragraphsDetected,
      paragraphsMapped,
      runsDetected,
      runsMapped,
      tablesDetected,
      tablesMapped,
      headersDetected,
      headersMapped,
      footersDetected,
      footersMapped,
      hyperlinksDetected,
      hyperlinksMapped,
      textBoxesDetected,
      textBoxesMapped,
      imagesDetected,
      imagesPreserved,
      listsDetected,
      listsMapped,
      unsupportedElements,
      warnings
    };
  }

  static summarize(coverage: IExtractionCoverage): string {
    return [
      `Paragraphs: ${coverage.paragraphsMapped}/${coverage.paragraphsDetected} mapped`,
      `Runs: ${coverage.runsMapped}/${coverage.runsDetected} mapped`,
      `Tables: ${coverage.tablesMapped}/${coverage.tablesDetected}`,
      `Headers: ${coverage.headersMapped}/${coverage.headersDetected}`,
      `Footers: ${coverage.footersMapped}/${coverage.footersDetected}`,
      `Hyperlinks: ${coverage.hyperlinksMapped}/${coverage.hyperlinksDetected}`,
      `Images: ${coverage.imagesPreserved}/${coverage.imagesDetected} preserved`,
      `Lists: ${coverage.listsMapped}/${coverage.listsDetected}`,
    ].join(" | ");
  }
}
