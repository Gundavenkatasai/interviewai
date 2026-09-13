import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  TabStopType,
  Tab,
  BorderStyle,
  Packer
} from "docx";

export interface IDocItem {
  type: "bullet" | "entry_header" | "tech" | "paragraph";
  rawText: string;
  leftText?: string;
  rightText?: string;
  label?: string;
  value?: string;
}

export interface IDocSection {
  heading: string;
  items: IDocItem[];
}

export interface IDocumentAST {
  name: string;
  contactLines: string[];
  sections: IDocSection[];
}

export class StructurePreservingDocxGenerator {
  private static KNOWN_SECTIONS = [
    "SKILLS",
    "TECHNICAL SKILLS",
    "CORE COMPETENCIES",
    "PROJECTS",
    "KEY PROJECTS",
    "ACADEMIC PROJECTS",
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "PROFESSIONAL EXPERIENCE",
    "EMPLOYMENT HISTORY",
    "TRAINING",
    "TRAININGS",
    "TRAINING & WORKSHOPS",
    "CERTIFICATIONS",
    "CERTIFICATES",
    "LICENSES & CERTIFICATIONS",
    "ACHIEVEMENTS",
    "HONORS & AWARDS",
    "AWARDS",
    "EDUCATION",
    "ACADEMIC BACKGROUND",
    "SUMMARY",
    "PROFESSIONAL SUMMARY",
    "PROFILE",
    "PUBLICATIONS",
    "VOLUNTEER",
    "LANGUAGES",
    "INTERESTS"
  ];

  private static DATE_REGEX =
    /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z’']*\s*\d{2,4}\s*[-–—]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z’']*\s*\d{2,4}|Present)|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z’']*\s*\d{2,4}))$/i;

  /**
   * Check if a line is a section heading
   */
  public static isHeading(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const upper = trimmed.toUpperCase();

    // Direct match against known section names
    if (this.KNOWN_SECTIONS.includes(upper)) return true;

    // Check if entire line is uppercase, short, without bullets or links
    if (
      trimmed === upper &&
      trimmed.length >= 3 &&
      trimmed.length <= 35 &&
      !trimmed.includes("•") &&
      !trimmed.includes("@") &&
      !trimmed.includes("HTTP") &&
      !trimmed.includes("/") &&
      !/\d/.test(trimmed)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Parse raw text into structured Document AST preserving exact original section order
   */
  public static parse(rawText: string): IDocumentAST {
    const rawLines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const lines = rawLines.filter((l) => !l.includes("-- 1 of") && !l.includes("Page "));

    const headerLines: string[] = [];
    const sections: IDocSection[] = [];
    let currentSec: IDocSection | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (this.isHeading(line)) {
        currentSec = { heading: line.toUpperCase(), items: [] };
        sections.push(currentSec);
      } else if (currentSec) {
        currentSec.items.push(this.classifyItem(line));
      } else {
        headerLines.push(line);
      }
    }

    const name = headerLines[0] || "Candidate Name";
    const contactLines = headerLines.slice(1);

    return {
      name,
      contactLines,
      sections
    };
  }

  /**
   * Classify a line within a section
   */
  private static classifyItem(line: string): IDocItem {
    const isBullet = /^[•·\*\-–—▪▫◦✦➢]\s*/.test(line);
    const isTech = /^(?:[•·\*\-–—▪▫◦✦➢]\s*)?(?:Tech|Technologies|Toolstack):\s*/i.test(line);

    if (isTech) {
      const cleanTech = line.replace(/^(?:[•·\*\-–—▪▫◦✦➢]\s*)?(?:Tech|Technologies|Toolstack):\s*/i, "").trim();
      return {
        type: "tech",
        rawText: line,
        label: "Tech:",
        value: cleanTech
      };
    }

    if (isBullet) {
      const cleanBullet = line.replace(/^[•·\*\-–—▪▫◦✦➢]\s*/, "").trim();
      const catMatch = cleanBullet.match(/^([A-Za-z0-9\s/&-]+:)\s*(.*)/);
      if (catMatch && catMatch[1].length < 30) {
        return {
          type: "bullet",
          rawText: cleanBullet,
          label: catMatch[1],
          value: catMatch[2]
        };
      }
      return {
        type: "bullet",
        rawText: cleanBullet
      };
    }

    // Check if line has a date at the end (Entry Header / Project / Degree)
    const dateMatch = line.match(this.DATE_REGEX);
    if (dateMatch) {
      const leftText = line.slice(0, dateMatch.index).trim();
      const rightText = dateMatch[0].trim();
      return {
        type: "entry_header",
        rawText: line,
        leftText,
        rightText
      };
    }

    return {
      type: "paragraph",
      rawText: line
    };
  }

  /**
   * Apply approved text swaps to the Document AST in place
   */
  public static applySwaps(
    ast: IDocumentAST,
    swaps: Array<{ originalText: string; proposedText: string }>
  ): IDocumentAST {
    const approvedSwaps = swaps.filter((s) => s.proposedText && s.proposedText.trim());

    for (const swap of approvedSwaps) {
      const origClean = swap.originalText.replace(/^[•·\*\-–—▪▫◦✦➢]\s*/, "").trim().toLowerCase();
      const propClean = swap.proposedText.replace(/^[•·\*\-–—▪▫◦✦➢]\s*/, "").trim();

      let matched = false;

      // 1. Search all section items for exact or partial match
      for (const sec of ast.sections) {
        for (const item of sec.items) {
          const itemText = (item.rawText || "").toLowerCase();

          if (itemText === origClean || itemText.includes(origClean) || origClean.includes(itemText)) {
            item.rawText = propClean;
            if (item.value) {
              item.value = propClean;
            }
            matched = true;
            break;
          }

          // Fallback: match first 30 chars
          if (origClean.length > 20 && itemText.includes(origClean.substring(0, 30))) {
            item.rawText = propClean;
            if (item.value) item.value = propClean;
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    }

    return ast;
  }

  /**
   * Render the AST into a professional, format-preserving DOCX buffer
   */
  public static async generateDocx(ast: IDocumentAST): Promise<Buffer> {
    const docChildren: Paragraph[] = [];

    // 1. Name Header (Centered, 17pt, Bold, Dark Slate)
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [
          new TextRun({
            text: ast.name,
            bold: true,
            size: 34, // 17pt
            font: "Calibri",
            color: "1E293B"
          })
        ]
      })
    );

    // 2. Contact Lines (Centered, 9.5pt, Slate)
    for (const cLine of ast.contactLines) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 30 },
          children: [
            new TextRun({
              text: cLine,
              size: 19, // 9.5pt
              font: "Calibri",
              color: "475569"
            })
          ]
        })
      );
    }

    // 3. Sections in EXACT sequential order
    for (const sec of ast.sections) {
      // Section Heading
      docChildren.push(
        new Paragraph({
          spacing: { before: 140, after: 50 },
          children: [
            new TextRun({
              text: sec.heading.toUpperCase(),
              bold: true,
              size: 22, // 11pt
              font: "Calibri",
              color: "0F172A"
            })
          ]
        })
      );

      for (const item of sec.items) {
        if (item.type === "tech") {
          docChildren.push(
            new Paragraph({
              spacing: { before: 20, after: 50 },
              children: [
                new TextRun({
                  text: "Tech: ",
                  bold: true,
                  size: 19,
                  font: "Calibri",
                  color: "1E293B"
                }),
                new TextRun({
                  text: item.value || item.rawText,
                  size: 19,
                  font: "Calibri",
                  color: "334155"
                })
              ]
            })
          );
        } else if (item.type === "bullet") {
          if (item.label && item.value) {
            docChildren.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 20, after: 30 },
                children: [
                  new TextRun({
                    text: item.label + " ",
                    bold: true,
                    size: 19,
                    font: "Calibri",
                    color: "1E293B"
                  }),
                  new TextRun({
                    text: item.value,
                    size: 19,
                    font: "Calibri",
                    color: "334155"
                  })
                ]
              })
            );
          } else {
            docChildren.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 20, after: 30 },
                children: [
                  new TextRun({
                    text: item.rawText,
                    size: 19,
                    font: "Calibri",
                    color: "334155"
                  })
                ]
              })
            );
          }
        } else if (item.type === "entry_header" && item.leftText && item.rightText) {
          docChildren.push(
            new Paragraph({
              spacing: { before: 70, after: 20 },
              tabStops: [{ type: TabStopType.RIGHT, position: 9600 }],
              children: [
                new TextRun({
                  text: item.leftText,
                  bold: true,
                  size: 20,
                  font: "Calibri",
                  color: "1E293B"
                }),
                new TextRun({
                  children: [new Tab(), item.rightText],
                  size: 19,
                  font: "Calibri",
                  color: "475569"
                })
              ]
            })
          );
        } else {
          docChildren.push(
            new Paragraph({
              spacing: { before: 40, after: 20 },
              children: [
                new TextRun({
                  text: item.rawText,
                  bold: !item.rawText.startsWith("•"),
                  size: 19,
                  font: "Calibri",
                  color: "1E293B"
                })
              ]
            })
          );
        }
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 720, bottom: 720, left: 720, right: 720 }
            }
          },
          children: docChildren
        }
      ]
    });

    return await Packer.toBuffer(doc);
  }
}
