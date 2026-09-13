import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from "docx";
import { IResumeProfileData } from "./resume.model";

export class ResumeExporter {
  /**
   * Generates a Microsoft Word DOCX buffer from structured resume profile data
   */
  static async generateDocx(profileData: IResumeProfileData, resumeName = "Resume"): Promise<Buffer> {
    const { personal, summary, experience, education, projects, skills } = profileData;

    const children: Paragraph[] = [];

    // Name Header
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.TITLE,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: personal.fullName || "Candidate Name",
            bold: true,
            size: 32, // 16pt
            font: "Calibri",
            color: "1E293B"
          })
        ]
      })
    );

    // Contact Subheader
    const contactParts = [
      personal.email,
      personal.phone,
      personal.location,
      personal.linkedin,
      personal.github
    ].filter(Boolean);

    if (contactParts.length > 0) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: contactParts.join("  |  "),
              size: 20, // 10pt
              font: "Calibri",
              color: "475569"
            })
          ]
        })
      );
    }

    // Professional Summary
    if (summary) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 150, after: 80 },
          children: [
            new TextRun({
              text: "PROFESSIONAL SUMMARY",
              bold: true,
              size: 24,
              font: "Calibri",
              color: "0F172A"
            })
          ]
        })
      );
      children.push(
        new Paragraph({
          spacing: { after: 180 },
          children: [
            new TextRun({
              text: summary,
              size: 21,
              font: "Calibri",
              color: "334155"
            })
          ]
        })
      );
    }

    // Work Experience
    if (experience && experience.length > 0) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 150, after: 80 },
          children: [
            new TextRun({
              text: "EXPERIENCE",
              bold: true,
              size: 24,
              font: "Calibri",
              color: "0F172A"
            })
          ]
        })
      );

      for (const exp of experience) {
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 40 },
            children: [
              new TextRun({
                text: exp.role || "Role",
                bold: true,
                size: 22,
                font: "Calibri",
                color: "1E293B"
              }),
              new TextRun({
                text: `  —  ${exp.company || ""}`,
                size: 22,
                font: "Calibri",
                color: "475569"
              }),
              new TextRun({
                text: ` (${exp.startDate || ""} - ${exp.endDate || (exp.current ? "Present" : "")})`,
                size: 20,
                font: "Calibri",
                italics: true,
                color: "64748B"
              })
            ]
          })
        );

        if (exp.description) {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: exp.description,
                  size: 20,
                  font: "Calibri",
                  color: "334155"
                })
              ]
            })
          );
        }

        for (const bullet of exp.bullets || []) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: bullet,
                  size: 20,
                  font: "Calibri",
                  color: "334155"
                })
              ]
            })
          );
        }
      }
    }

    // Projects
    if (projects && projects.length > 0) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 80 },
          children: [
            new TextRun({
              text: "PROJECTS",
              bold: true,
              size: 24,
              font: "Calibri",
              color: "0F172A"
            })
          ]
        })
      );

      for (const proj of projects) {
        children.push(
          new Paragraph({
            spacing: { before: 80, after: 40 },
            children: [
              new TextRun({
                text: proj.name || "Project",
                bold: true,
                size: 22,
                font: "Calibri",
                color: "1E293B"
              }),
              proj.technologies && proj.technologies.length > 0
                ? new TextRun({
                    text: ` | Technologies: ${proj.technologies.join(", ")}`,
                    size: 20,
                    italics: true,
                    font: "Calibri",
                    color: "64748B"
                  })
                : new TextRun({ text: "" })
            ]
          })
        );

        if (proj.description) {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: proj.description,
                  size: 20,
                  font: "Calibri",
                  color: "334155"
                })
              ]
            })
          );
        }

        for (const bullet of proj.bullets || []) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: bullet,
                  size: 20,
                  font: "Calibri",
                  color: "334155"
                })
              ]
            })
          );
        }
      }
    }

    // Skills
    const allSkills = [
      skills.languages && skills.languages.length > 0 ? `Languages: ${skills.languages.join(", ")}` : null,
      skills.frameworks && skills.frameworks.length > 0 ? `Frameworks: ${skills.frameworks.join(", ")}` : null,
      skills.databases && skills.databases.length > 0 ? `Databases: ${skills.databases.join(", ")}` : null,
      skills.cloud && skills.cloud.length > 0 ? `Cloud & Tools: ${skills.cloud.join(", ")}` : null,
      skills.technical && skills.technical.length > 0 ? `Technical: ${skills.technical.join(", ")}` : null
    ].filter(Boolean) as string[];

    if (allSkills.length > 0) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 80 },
          children: [
            new TextRun({
              text: "TECHNICAL SKILLS",
              bold: true,
              size: 24,
              font: "Calibri",
              color: "0F172A"
            })
          ]
        })
      );

      for (const skillLine of allSkills) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: skillLine,
                size: 20,
                font: "Calibri",
                color: "334155"
              })
            ]
          })
        );
      }
    }

    // Education
    if (education && education.length > 0) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 80 },
          children: [
            new TextRun({
              text: "EDUCATION",
              bold: true,
              size: 24,
              font: "Calibri",
              color: "0F172A"
            })
          ]
        })
      );

      for (const edu of education) {
        children.push(
          new Paragraph({
            spacing: { before: 80, after: 40 },
            children: [
              new TextRun({
                text: `${edu.degree || "Degree"} in ${edu.field || "Computer Science"}`,
                bold: true,
                size: 22,
                font: "Calibri",
                color: "1E293B"
              }),
              new TextRun({
                text: `  —  ${edu.institution || ""}`,
                size: 22,
                font: "Calibri",
                color: "475569"
              }),
              new TextRun({
                text: ` (${edu.startDate || ""} - ${edu.endDate || ""})`,
                size: 20,
                italics: true,
                font: "Calibri",
                color: "64748B"
              })
            ]
          })
        );
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720, // 0.5 in
                right: 720,
                bottom: 720,
                left: 720
              }
            }
          },
          children
        }
      ]
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * Generates clean plain text (TXT) ATS-formatted resume string
   */
  static generateTxt(profileData: IResumeProfileData): string {
    const { personal, summary, experience, education, projects, skills } = profileData;
    const lines: string[] = [];

    // Header
    lines.push(personal.fullName.toUpperCase());
    const contacts = [
      personal.email,
      personal.phone,
      personal.location,
      personal.linkedin,
      personal.github,
      personal.portfolio
    ].filter(Boolean);
    if (contacts.length) lines.push(contacts.join(" | "));
    lines.push("");

    // Summary
    if (summary) {
      lines.push("PROFESSIONAL SUMMARY");
      lines.push("-".repeat(40));
      lines.push(summary);
      lines.push("");
    }

    // Skills
    const allSkills = [
      ...(skills?.technical || []),
      ...(skills?.languages || []),
      ...(skills?.frameworks || []),
      ...(skills?.databases || []),
      ...(skills?.cloud || []),
      ...(skills?.tools || [])
    ];
    if (allSkills.length) {
      lines.push("SKILLS & TECHNOLOGIES");
      lines.push("-".repeat(40));
      if (skills?.languages?.length) lines.push(`Languages: ${skills.languages.join(", ")}`);
      if (skills?.frameworks?.length) lines.push(`Frameworks: ${skills.frameworks.join(", ")}`);
      if (skills?.databases?.length) lines.push(`Databases: ${skills.databases.join(", ")}`);
      if (skills?.cloud?.length) lines.push(`Cloud & DevOps: ${skills.cloud.join(", ")}`);
      if (skills?.technical?.length) lines.push(`Core: ${skills.technical.join(", ")}`);
      lines.push("");
    }

    // Experience
    if (experience?.length) {
      lines.push("WORK EXPERIENCE");
      lines.push("-".repeat(40));
      for (const exp of experience) {
        lines.push(`${exp.role} - ${exp.company} (${exp.startDate || ""} - ${exp.endDate || ""})`);
        if (exp.location) lines.push(exp.location);
        for (const b of exp.bullets || []) {
          lines.push(`* ${b}`);
        }
        lines.push("");
      }
    }

    // Projects
    if (projects?.length) {
      lines.push("PROJECTS");
      lines.push("-".repeat(40));
      for (const proj of projects) {
        lines.push(`${proj.name}${proj.technologies?.length ? ` [${proj.technologies.join(", ")}]` : ""}`);
        if (proj.url) lines.push(proj.url);
        for (const b of proj.bullets || []) {
          lines.push(`* ${b}`);
        }
        lines.push("");
      }
    }

    // Education
    if (education?.length) {
      lines.push("EDUCATION");
      lines.push("-".repeat(40));
      for (const edu of education) {
        lines.push(`${edu.degree || "Degree"} in ${edu.field || "Field"} - ${edu.institution}`);
        lines.push(`${edu.startDate || ""} - ${edu.endDate || ""}`);
        lines.push("");
      }
    }

    return lines.join("\n");
  }

  /**
   * Generates structured canonical JSON
   */
  static generateJson(profileData: IResumeProfileData): string {
    return JSON.stringify(profileData, null, 2);
  }
}

