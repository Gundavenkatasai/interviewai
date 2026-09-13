import { describe, it, expect } from "vitest";
import { DocxEngine } from "../src/modules/resume/docx-engine/docx.engine";
import { DocxValidator } from "../src/modules/resume/docx-engine/docx.validator";
import JSZip from "jszip";

/**
 * Helper to build a minimal valid DOCX buffer fixture with bold runs and bullet list
 */
async function createTestDocxBuffer(): Promise<Buffer> {
  const zip = new JSZip();

  // [Content_Types].xml
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  // _rels/.rels
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // word/document.xml with custom styling, bold tokens, margins, and 2 bullets
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="28"/><w:rFonts w:ascii="Calibri"/></w:rPr>
        <w:t>WORK EXPERIENCE</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
        <w:ind w:left="720" w:hanging="360"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Calibri"/><w:sz w:val="22"/></w:rPr>
        <w:t xml:space="preserve">• Worked on REST APIs using </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:bCs/><w:rFonts w:ascii="Calibri"/><w:sz w:val="22"/></w:rPr>
        <w:t>Node.js</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Calibri"/><w:sz w:val="22"/></w:rPr>
        <w:t xml:space="preserve"> and </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:bCs/><w:rFonts w:ascii="Calibri"/><w:sz w:val="22"/></w:rPr>
        <w:t>Express</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Calibri"/><w:sz w:val="22"/></w:rPr>
        <w:t> for core services.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>
        <w:ind w:left="720" w:hanging="360"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Calibri"/><w:sz w:val="22"/></w:rPr>
        <w:t xml:space="preserve">• Assisted with database optimization using </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/><w:bCs/><w:rFonts w:ascii="Calibri"/><w:sz w:val="22"/></w:rPr>
        <w:t>PostgreSQL</w:t>
      </w:r>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Calibri"/><w:sz w:val="22"/></w:rPr>
        <w:t> queries.</w:t>
      </w:r>
    </w:p>
    <w:sectPr>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file("word/document.xml", docXml);
  return zip.generateAsync({ type: "nodebuffer" });
}

describe("Format-Preserving DOCX Engine", () => {
  it("should extract bold vocabulary and map document structure with bullets", async () => {
    const buffer = await createTestDocxBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const docXml = await zip.file("word/document.xml")!.async("string");

    const structure = DocxEngine.buildStructureMap(docXml);

    expect(structure.headings).toContain("WORK EXPERIENCE");
    expect(structure.bulletCount).toBe(2);
    expect(structure.boldVocabulary).toContain("Node.js");
    expect(structure.boldVocabulary).toContain("Express");
    expect(structure.boldVocabulary).toContain("PostgreSQL");
  });

  it("should preserve bold formatting on vocabulary terms and tech terms when segmenting replacement text", () => {
    const vocab = ["Node.js", "Express", "PostgreSQL"];
    const newText = "Engineered scalable REST APIs using Node.js and Express deployed to AWS with Docker.";

    const segments = DocxEngine.segmentTextWithBold(newText, vocab);

    // Node.js and Express must be bold (from vocab)
    const nodeSeg = segments.find((s) => s.text === "Node.js");
    const expressSeg = segments.find((s) => s.text === "Express");
    expect(nodeSeg).toBeDefined();
    expect(nodeSeg?.bold).toBe(true);
    expect(expressSeg).toBeDefined();
    expect(expressSeg?.bold).toBe(true);

    // AWS and Docker must be bold (from tech term heuristic: acronyms & CamelCase)
    const awsSeg = segments.find((s) => s.text.includes("AWS"));
    const dockerSeg = segments.find((s) => s.text.includes("Docker"));
    expect(awsSeg?.bold).toBe(true);
    expect(dockerSeg?.bold).toBe(true);

    // Plain text like 'Engineered scalable REST APIs using ' should NOT be bold
    const plainSeg = segments.find((s) => s.text.includes("Engineered scalable"));
    expect(plainSeg?.bold).toBe(false);
  });

  it("should apply swaps in-place, preserving <w:pPr>, <w:numPr>, indentation, and margins", async () => {
    const buffer = await createTestDocxBuffer();

    const swapResult = await DocxEngine.applySwaps(buffer, [
      {
        id: "swap-1",
        section: "WORK EXPERIENCE",
        roleIndex: 0,
        bulletIndex: 0,
        originalText: "Worked on REST APIs",
        proposedText: "Engineered scalable REST APIs using Node.js and Express to improve backend reliability.",
        approved: true
      }
    ]);

    expect(swapResult.applied.length).toBe(1);
    expect(swapResult.bulletCountBefore).toBe(2);
    expect(swapResult.bulletCountAfter).toBe(2);

    // Verify modified XML
    const modifiedZip = await JSZip.loadAsync(swapResult.modifiedBuffer);
    const modXml = await modifiedZip.file("word/document.xml")!.async("string");

    // Margins must still be intact
    expect(modXml).toContain('<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>');

    // Paragraph indentation <w:ind> must be intact
    expect(modXml).toContain('<w:ind w:left="720" w:hanging="360"/>');

    // Bullet numbering <w:numPr> must be intact
    expect(modXml).toContain('<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>');

    // Target text must have updated content (REST is in a separate bold run)
    expect(modXml).toContain("Engineered scalable");
    expect(modXml).toContain("REST");
    expect(modXml).toContain("backend reliability");

    // Also verify plain text extracted from paragraph matches completely
    const modStructure = DocxEngine.buildStructureMap(modXml);
    expect(modStructure.bullets[0].text).toContain("Engineered scalable REST APIs using Node.js and Express to improve backend reliability.");

    // Bold tags must be preserved on Node.js and Express
    expect(modXml).toMatch(/<w:r><w:rPr>[\s\S]*?<w:b\/>[\s\S]*?<\/w:rPr><w:t[^>]*>Node\.js<\/w:t><\/w:r>/);
    expect(modXml).toMatch(/<w:r><w:rPr>[\s\S]*?<w:b\/>[\s\S]*?<\/w:rPr><w:t[^>]*>Express<\/w:t><\/w:r>/);
  });

  it("should validate that bullet count and section headings are strictly preserved", async () => {
    const buffer = await createTestDocxBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const docXml = await zip.file("word/document.xml")!.async("string");

    const mapBefore = DocxEngine.buildStructureMap(docXml);
    const mapAfter = DocxEngine.buildStructureMap(docXml);

    const validation = DocxValidator.validatePreservation(
      mapBefore,
      mapAfter,
      "Original resume text content here",
      "Optimized resume text content here"
    );

    expect(validation.valid).toBe(true);
    expect(validation.bulletCountMatch).toBe(true);
    expect(validation.sectionOrderMatch).toBe(true);
    expect(validation.errors.length).toBe(0);
  });
});
