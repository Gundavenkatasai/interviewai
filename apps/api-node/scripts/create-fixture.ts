import fs from "fs";
import { Document, Paragraph, TextRun, Packer, Table, TableRow, TableCell, HeadingLevel } from "docx";
import path from "path";

async function createFixture() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "JOHN DOE",
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            text: "john.doe@example.com | (555) 123-4567 | San Francisco, CA",
          }),
          new Paragraph({
            text: "PROFESSIONAL SUMMARY",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: "Experienced software engineer with a strong background in backend development.",
          }),
          new Paragraph({
            text: "EXPERIENCE",
            heading: HeadingLevel.HEADING_1,
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Senior Software Engineer | ", bold: true }),
                          new TextRun({ text: "Tech Corp", italics: true }),
                        ]
                      }),
                      new Paragraph({
                        text: "Developed and maintained highly scalable microservices architecture.",
                        bullet: { level: 0 }
                      }),
                      new Paragraph({
                        children: [
                          new TextRun("Optimized database queries resulting in a "),
                          new TextRun({ text: "40% performance increase", bold: true }),
                          new TextRun(" across the main API."),
                        ],
                        bullet: { level: 0 }
                      }),
                      new Paragraph({
                        text: "Spearheaded the migration to Kubernetes.",
                        bullet: { level: 0 }
                      })
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ text: "Jan 2020 - Present", alignment: "right" })
                    ],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({
            text: "EDUCATION",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: "B.S. in Computer Science | University of California, Berkeley",
            bullet: { level: 0 }
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, "../tests/fixtures/real-resume-table-based.docx");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buffer);
  console.log("Fixture created at", outPath);
}

createFixture().catch(console.error);
