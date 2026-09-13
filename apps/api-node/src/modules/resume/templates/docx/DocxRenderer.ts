import { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType, PageBreak } from "docx";
import { IResumeRenderDocument, IRenderSection, IRenderExperience, IRenderEducation, IRenderProject } from "../renderModel";

export class DocxRenderer {
  static async render(docModel: IResumeRenderDocument, templateId: string, pageSize: "A4" | "Letter"): Promise<Buffer> {
    const children = [];

    // Header
    const { header } = docModel;
    children.push(
      new Paragraph({
        text: header.name,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 }
      })
    );

    if (header.title) {
      children.push(
        new Paragraph({
          text: header.title,
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        })
      );
    }

    const contactParts = [header.email, header.phone, header.location].filter(Boolean);
    const links = [header.linkedin, header.github, header.portfolio, header.website].filter(Boolean);
    
    children.push(
      new Paragraph({
        text: [...contactParts, ...links].join(" | "),
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      })
    );

    // Sections
    for (const section of docModel.sections) {
      children.push(
        new Paragraph({
          text: section.title.toUpperCase(),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 120 },
          border: {
            bottom: { color: "auto", space: 1, style: "single", size: 6 }
          }
        })
      );

      switch (section.type) {
        case "summary":
          children.push(
            new Paragraph({
              text: section.content as string,
              spacing: { after: 120 }
            })
          );
          break;

        case "experience":
          for (const exp of (section.content as IRenderExperience[])) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: exp.role, bold: true }),
                  new TextRun({ text: ` — ${exp.company}`, italics: true })
                ],
                spacing: { before: 120 }
              })
            );
            children.push(
              new Paragraph({
                text: `${exp.dateRange} | ${exp.location}`,
                spacing: { after: 120 }
              })
            );
            for (const bullet of exp.bullets) {
              children.push(
                new Paragraph({
                  text: bullet,
                  bullet: { level: 0 }
                })
              );
            }
          }
          break;

        case "education":
          for (const edu of (section.content as IRenderEducation[])) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: edu.institution, bold: true }),
                ],
                spacing: { before: 120 }
              })
            );
            children.push(
              new Paragraph({
                text: `${edu.degree} | ${edu.dateRange}${edu.gpa ? ` | GPA: ${edu.gpa}` : ""}`,
                spacing: { after: 120 }
              })
            );
          }
          break;

        case "projects":
          for (const proj of (section.content as IRenderProject[])) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: proj.name, bold: true }),
                  ...(proj.technologies ? [new TextRun({ text: ` | ${proj.technologies}`, italics: true })] : [])
                ],
                spacing: { before: 120 }
              })
            );
            for (const bullet of proj.bullets) {
              children.push(
                new Paragraph({
                  text: bullet,
                  bullet: { level: 0 }
                })
              );
            }
          }
          break;

        case "skills":
          for (const skillGroup of (section.content as {category: string, items: string}[])) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `${skillGroup.category}: `, bold: true }),
                  new TextRun({ text: skillGroup.items })
                ]
              })
            );
          }
          break;
          
        case "certifications":
          for (const cert of (section.content as any[])) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: cert.name, bold: true }),
                  new TextRun({ text: ` — ${cert.issuer} (${cert.date})` })
                ]
              })
            );
          }
          break;
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children
        }
      ]
    });

    return await Packer.toBuffer(doc);
  }
}
