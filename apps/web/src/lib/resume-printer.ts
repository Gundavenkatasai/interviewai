/**
 * Dedicated A4 Resume Printing Engine
 *
 * Solves browser blank-page print bugs, transform clipping, and website chrome leak
 * by rendering an isolated A4 print frame with document font-readiness guarantees.
 */

export interface PrintValidationResult {
  valid: boolean;
  error?: string;
  isOverflowing?: boolean;
  pageCount: number;
}

/**
 * Pre-print validation: verifies DOM presence, content availability, and single-page fit.
 */
export function validateResumeForPrint(
  elementId = "resume-a4-canvas"
): PrintValidationResult {
  const canvas = document.getElementById(elementId);
  if (!canvas) {
    return {
      valid: false,
      error: "Resume canvas element not found in active DOM.",
      pageCount: 0,
    };
  }

  const text = canvas.textContent?.trim() || "";
  if (text.length < 50) {
    return {
      valid: false,
      error: "Resume content is empty or unrendered.",
      pageCount: 0,
    };
  }

  const { scrollHeight, clientHeight } = canvas;
  const isOverflowing = scrollHeight > clientHeight + 8;
  const estimatedPages = Math.max(1, Math.ceil(scrollHeight / (clientHeight || 1122)));

  return {
    valid: true,
    isOverflowing,
    pageCount: estimatedPages,
  };
}

/**
 * Executes high-fidelity isolated printing of the A4 Resume document.
 */
export async function printResumeDocument(
  elementId = "resume-a4-canvas"
): Promise<{ success: boolean; error?: string }> {
  const validation = validateResumeForPrint(elementId);
  if (!validation.valid) {
    console.error("[ResumePrinter] Validation failed:", validation.error);
    return { success: false, error: validation.error };
  }

  const canvas = document.getElementById(elementId)!;

  // 1. Clone canvas without preview transforms
  const clone = canvas.cloneNode(true) as HTMLElement;
  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.border = "none";
  clone.style.width = "210mm";
  clone.style.height = "297mm";
  clone.style.minHeight = "297mm";
  clone.style.maxHeight = "297mm";
  clone.style.boxSizing = "border-box";
  clone.style.overflow = "hidden";

  // 2. Gather active stylesheets for typography & Tailwind
  let cssText = "";
  for (let i = 0; i < document.styleSheets.length; i++) {
    try {
      const sheet = document.styleSheets[i];
      if (sheet.cssRules) {
        for (let j = 0; j < sheet.cssRules.length; j++) {
          cssText += sheet.cssRules[j].cssText + "\n";
        }
      }
    } catch (_) {
      if (document.styleSheets[i].href) {
        cssText += `@import url("${document.styleSheets[i].href}");\n`;
      }
    }
  }

  // 3. Create isolated hidden print iframe
  const iframe = document.createElement("iframe");
  iframe.id = "resume-isolated-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    window.print();
    return { success: false, error: "Failed to initialize print document context." };
  }

  const title = (clone.querySelector("h1")?.textContent || "Resume").trim();

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title} - A4 Resume</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      max-height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #111827;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      overflow: hidden !important;
    }
    ${cssText}
    #resume-a4-canvas {
      width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      max-height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
      transform: none !important;
      overflow: hidden !important;
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
    }
  </style>
</head>
<body>
  ${clone.outerHTML}
</body>
</html>`);
  doc.close();

  // 4. Await font engine readiness
  try {
    if (doc.fonts) {
      await doc.fonts.ready;
    }
  } catch (_) {}

  // Allow browser layout engine to calculate exact glyph boxes
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 5. Trigger browser print dialog on isolated iframe
  try {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    return { success: true };
  } catch (err: any) {
    console.error("[ResumePrinter] Print failed:", err);
    // Fallback to window.print if iframe print is blocked
    window.print();
    return { success: false, error: err.message };
  } finally {
    setTimeout(() => {
      try {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      } catch (_) {}
    }, 4000);
  }
}
