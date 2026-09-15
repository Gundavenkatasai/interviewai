import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

async function createPdfFixture() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]); // Custom dimensions
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Add some content
  page.drawText("Venkatasai CV", { x: 50, y: 750, size: 24, font: boldFont, color: rgb(0, 0, 0.5) });
  
  page.drawText("Experience", { x: 50, y: 700, size: 18, font: boldFont });
  
  // A target bullet
  page.drawText("Worked on backend applications", { x: 70, y: 670, size: 12, font });

  // Unrelated content
  page.drawText("Built frontend with React", { x: 70, y: 650, size: 12, font });
  page.drawText("Managed Kubernetes clusters", { x: 70, y: 630, size: 12, font });

  // Education
  page.drawText("Education", { x: 50, y: 580, size: 18, font: boldFont });
  page.drawText("B.S. in Computer Science", { x: 70, y: 550, size: 12, font });

  const pdfBytes = await pdfDoc.save();
  
  const outPath = path.join(__dirname, "../tests/fixtures/real-resume-table-based.pdf");
  fs.writeFileSync(outPath, pdfBytes);
  console.log(`Created PDF fixture at ${outPath}`);
}

createPdfFixture().catch(console.error);
