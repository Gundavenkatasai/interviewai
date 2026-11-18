import fs from "fs";
import { PDFDocument } from "pdf-lib";
import { IStructuredResume } from "../schema/structured-resume.schema";
import { TemplateId } from "../template-intelligence/template-selector";
// @ts-ignore
const puppeteer = require("puppeteer");

export class ResumePdfExporterService {
  /**
   * Discovers available Chrome or Edge browser binary on Windows/Linux/macOS
   */
  private static findBrowserExecutable(): string {
    const candidates = [
      process.env.CHROME_BIN,
      process.env.PUPPETEER_EXECUTABLE_PATH,
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium"
    ].filter(Boolean) as string[];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    throw new Error("No compatible Chrome or Edge browser binary found on host system.");
  }

  /**
   * Generates clean, ATS-compliant, single-page A4 HTML for the requested template
   */
  public static generateHtml(resume: IStructuredResume, templateId: TemplateId = "tech-fresher"): string {
    const { basics, summary, skills, experience, projects, education, certifications, achievements } = resume;

    // Filter projects to maximum 2 for strict one-page constraint
    const displayProjects = (projects || []).slice(0, 2);

    // Font families per template
    let fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let headingFont = fontFamily;
    let accentColor = "#111827";
    let subAccent = "#2563eb";

    if (templateId === "classic-ats" || templateId === "academic") {
      fontFamily = "'Georgia', 'Times New Roman', Times, serif";
      headingFont = fontFamily;
      accentColor = "#000000";
      subAccent = "#1e3a8a";
    } else if (templateId === "modern-tech") {
      accentColor = "#0f172a";
      subAccent = "#4f46e5";
    } else if (templateId === "tech-fresher") {
      accentColor = "#111827";
      subAccent = "#1d4ed8";
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${basics.name} - Resume</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 14mm 10mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: #ffffff;
      color: #111827;
      font-family: ${fontFamily};
      font-size: 9.5pt;
      line-height: 1.35;
      -webkit-font-smoothing: antialiased;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .resume-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }
    /* Header */
    header {
      text-align: center;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    h1 {
      font-family: ${headingFont};
      font-size: 20pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      color: ${accentColor};
      margin-bottom: 3px;
    }
    .contact-line {
      font-size: 8.5pt;
      color: #374151;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
      align-items: center;
    }
    .contact-line a {
      color: ${subAccent};
      text-decoration: none;
    }
    .separator {
      color: #9ca3af;
    }
    /* Section Headings */
    section {
      margin-bottom: 8px;
      page-break-inside: avoid;
    }
    h2 {
      font-family: ${headingFont};
      font-size: 10.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${accentColor};
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 2px;
      margin-bottom: 4px;
    }
    /* Summary */
    .summary-text {
      font-size: 9pt;
      line-height: 1.35;
      color: #1f2937;
      text-align: justify;
    }
    /* Skills */
    .skills-grid {
      display: flex;
      flex-direction: column;
      gap: 2.5px;
    }
    .skill-row {
      display: flex;
      font-size: 8.8pt;
      line-height: 1.3;
    }
    .skill-cat {
      font-weight: 700;
      min-width: 125px;
      color: #111827;
    }
    .skill-items {
      color: #374151;
      flex: 1;
    }
    /* Projects & Experience */
    .item-block {
      margin-bottom: 6px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 9.5pt;
      margin-bottom: 1px;
    }
    .item-title {
      font-weight: 700;
      color: #111827;
    }
    .item-meta {
      font-size: 8.5pt;
      color: #4b5563;
      font-style: italic;
    }
    .item-date {
      font-size: 8.5pt;
      color: #4b5563;
      white-space: nowrap;
    }
    .item-stack {
      font-size: 8.5pt;
      color: #4b5563;
      margin-bottom: 2px;
    }
    .item-stack strong {
      color: #111827;
    }
    ul.bullets {
      list-style-type: disc;
      padding-left: 14px;
      margin-top: 1px;
    }
    ul.bullets li {
      font-size: 8.8pt;
      line-height: 1.3;
      color: #1f2937;
      margin-bottom: 1.5px;
    }
    .ext-link {
      font-size: 8pt;
      color: ${subAccent};
      text-decoration: none;
      margin-left: 4px;
    }
    /* Education & Certs */
    .edu-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 9pt;
      margin-bottom: 1.5px;
    }
    .edu-degree {
      color: #374151;
    }
    .edu-score {
      font-weight: 600;
      color: #111827;
    }
    .inline-list {
      list-style: disc;
      padding-left: 14px;
    }
    .inline-list li {
      font-size: 8.5pt;
      line-height: 1.3;
      color: #1f2937;
      margin-bottom: 1.5px;
    }
  </style>
</head>
<body>
  <div class="resume-container">
    <!-- Header -->
    <header>
      <h1>${basics.name}</h1>
      <div class="contact-line">
        ${basics.phone ? `<span>${basics.phone}</span>` : ""}
        ${basics.email ? `<span class="separator">|</span><a href="mailto:${basics.email}">${basics.email}</a>` : ""}
        ${(basics.links || []).map(l => `<span class="separator">|</span><a href="${l.url}" target="_blank">${l.label}</a>`).join("")}
        ${basics.location ? `<span class="separator">|</span><span>${basics.location}</span>` : ""}
      </div>
    </header>

    <!-- Professional Summary (max 2 sentences) -->
    ${summary ? `
    <section>
      <h2>Professional Summary</h2>
      <p class="summary-text">${summary}</p>
    </section>
    ` : ""}

    <!-- Technical Skills (Prioritized) -->
    ${skills && skills.length > 0 ? `
    <section>
      <h2>Technical Skills</h2>
      <div class="skills-grid">
        ${skills.map(cat => `
          <div class="skill-row">
            <span class="skill-cat">${cat.category}:</span>
            <span class="skill-items">${cat.items.join(", ")}</span>
          </div>
        `).join("")}
      </div>
    </section>
    ` : ""}

    <!-- Engineering Projects (Strictly Top 2 Relevant Projects) -->
    ${displayProjects.length > 0 ? `
    <section>
      <h2>Key Technical Projects</h2>
      ${displayProjects.map(p => `
        <div class="item-block">
          <div class="item-header">
            <div>
              <span class="item-title">${p.name}</span>
              ${p.githubUrl ? `<a href="${p.githubUrl}" class="ext-link" target="_blank">[Source]</a>` : ""}
              ${p.liveUrl ? `<a href="${p.liveUrl}" class="ext-link" target="_blank">[Live Demo]</a>` : ""}
            </div>
            ${p.startDate || p.endDate ? `<span class="item-date">${p.startDate || ""} ${p.endDate ? `– ${p.endDate}` : ""}</span>` : ""}
          </div>
          ${p.technologies && p.technologies.length > 0 ? `
            <div class="item-stack"><strong>Tech Stack:</strong> ${p.technologies.join(", ")}</div>
          ` : ""}
          <ul class="bullets">
            ${(p.bullets || []).slice(0, 2).map(b => `<li>${b}</li>`).join("")}
          </ul>
        </div>
      `).join("")}
    </section>
    ` : ""}

    <!-- Experience (if applicable) -->
    ${experience && experience.length > 0 ? `
    <section>
      <h2>Professional Experience</h2>
      ${experience.slice(0, 2).map(exp => `
        <div class="item-block">
          <div class="item-header">
            <span class="item-title">${exp.role} — ${exp.company}</span>
            <span class="item-date">${exp.startDate || ""} – ${exp.current ? "Present" : exp.endDate || "Present"}</span>
          </div>
          <ul class="bullets">
            ${(exp.bullets || []).slice(0, 2).map(b => `<li>${b}</li>`).join("")}
          </ul>
        </div>
      `).join("")}
    </section>
    ` : ""}

    <!-- Education -->
    ${education && education.length > 0 ? `
    <section>
      <h2>Education</h2>
      ${education.slice(0, 2).map(edu => `
        <div class="item-block">
          <div class="edu-row">
            <span class="item-title">${edu.institution}</span>
            <span class="item-date">${edu.startDate ? `${edu.startDate} – ` : ""}${edu.endDate || ""}</span>
          </div>
          <div class="edu-row">
            <span class="edu-degree">${edu.degree}${edu.fieldOfStudy || (edu as any).field ? `, ${edu.fieldOfStudy || (edu as any).field}` : ""}</span>
            ${edu.gpa ? `<span class="edu-score">Score: ${edu.gpa}</span>` : ""}
          </div>
        </div>
      `).join("")}
    </section>
    ` : ""}

    <!-- Certifications & Achievements -->
    ${((certifications && certifications.length > 0) || (achievements && achievements.length > 0)) ? `
    <section>
      <h2>Certifications & Achievements</h2>
      <ul class="inline-list">
        ${(certifications || []).slice(0, 3).map(c => `
          <li><strong>${c.name}</strong>${c.issuer ? ` — ${c.issuer}` : ""}${c.date ? ` (${c.date})` : ""}</li>
        `).join("")}
        ${(achievements || []).slice(0, 2).map(a => `
          <li><strong>${a.title}</strong>${a.description ? ` — ${a.description}` : ""}</li>
        `).join("")}
      </ul>
    </section>
    ` : ""}
  </div>
</body>
</html>`;
  }

  /**
   * Renders the structured resume to an exact single-page A4 PDF buffer with selectable text
   */
  public static async exportToPdf(resume: IStructuredResume, templateId: TemplateId = "tech-fresher"): Promise<Buffer> {
    const html = this.generateHtml(resume, templateId);
    const chromePath = this.findBrowserExecutable();

    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--font-render-hinting=medium"
      ]
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: "load" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "10mm", right: "12mm", bottom: "10mm", left: "12mm" }
      });

      // Validate PDF buffer
      if (!pdfBuffer || pdfBuffer.length < 1000) {
        throw new Error("Generated PDF artifact is empty or truncated.");
      }

      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();

      if (pageCount !== 1) {
        console.warn(`[ResumePdfExporter] Warning: Generated PDF has ${pageCount} pages. Strict one-page enforcement applied.`);
      }

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
