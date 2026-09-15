import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.mjs");

pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

interface PdfSwapResult {
  modifiedBuffer: Buffer;
  appliedCount: number;
  skippedCount: number;
  originalPageCount: number;
  newPageCount: number;
}

export class PdfEngine {
  static async applySwaps(
    originalBuffer: Buffer,
    swaps: any[]
  ): Promise<PdfSwapResult> {
    const data = new Uint8Array(originalBuffer);
    
    // Analyze text coordinates using pdfjs-dist
    const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
    const originalPageCount = pdfDoc.numPages;
    const pageTextLocs: Record<number, any[]> = {};

    for (let pageNum = 1; pageNum <= originalPageCount; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();

      const items = content.items.map((item: any) => ({
        str: item.str,
        transform: item.transform,
        width: item.width,
        height: item.height,
        x: item.transform[4],
        y: item.transform[5],
      }));
      pageTextLocs[pageNum] = items;
    }

    const modPdf = await PDFDocument.load(originalBuffer);
    const helveticaFont = await modPdf.embedFont(StandardFonts.Helvetica);

    let appliedCount = 0;
    let skippedCount = 0;

    for (const swap of swaps) {
      if (!swap.approved) {
        skippedCount++;
        continue;
      }

      let foundMatch: { startIndex: number, endIndex: number, startItem: any, endItem: any } | null = null;
      let targetPageNum = 1;

      for (let pageNum = 1; pageNum <= originalPageCount; pageNum++) {
        const items = pageTextLocs[pageNum];
        const cleanOriginal = swap.originalText.replace(/\s+/g, "").toLowerCase();
        
        for (let i = 0; i < items.length; i++) {
          let accumulated = "";
          let startItem = items[i];
          let endItem = items[i];

          // Fast path: cleanOriginal is completely inside a single item
          const cleanItemStr = items[i].str.replace(/\s+/g, "").toLowerCase();
          if (cleanItemStr.includes(cleanOriginal)) {
            foundMatch = { startIndex: i, endIndex: i, startItem, endItem };
            break;
          }

          for (let j = i; j < items.length; j++) {
            accumulated += items[j].str.replace(/\s+/g, "").toLowerCase();
            endItem = items[j];

            if (accumulated === cleanOriginal || accumulated.startsWith(cleanOriginal)) {
              foundMatch = { startItem, endItem, startIndex: i, endIndex: j };
              break;
            }
            
            // Break early if we've overshot the target length without a match
            if (accumulated.length > cleanOriginal.length + 15) break;
          }
          if (foundMatch) break;
        }
        
        if (foundMatch) {
          targetPageNum = pageNum;
          break;
        }
      }

      if (foundMatch) {
        const page = modPdf.getPage(targetPageNum - 1);
        const { width: pageWidth } = page.getSize();
        const items = pageTextLocs[targetPageNum];
        
        let originalFontSize = 10;
        for (let k = foundMatch.startIndex; k <= foundMatch.endIndex; k++) {
           const str = items[k].str;
           if (/[a-zA-Z0-9]/.test(str)) {
               originalFontSize = Math.abs(items[k].transform[3]) || 10;
               break;
           }
        }
        if (originalFontSize === 10 && foundMatch.startItem) {
           originalFontSize = Math.abs(foundMatch.startItem.transform[3]) || 10;
        }
        
        const startY = foundMatch.startItem.y - (originalFontSize * 0.2);
        // --- Surgical Prefix Preservation ---
        let remainingProposedClean = swap.proposedText.replace(/\s+/g, "").toLowerCase();
        let textToWrite = swap.proposedText;
        let drawX = foundMatch.startItem.x;
        let preservedUpTo = foundMatch.startIndex - 1;
        
        for (let k = foundMatch.startIndex; k <= foundMatch.endIndex; k++) {
            const itemStr = items[k].str;
            const cleanItemStr = itemStr.replace(/\s+/g, "").toLowerCase();
            
            if (cleanItemStr.length === 0) {
                continue;
            }
            
            const matchIndex = remainingProposedClean.indexOf(cleanItemStr);
            const isFirstMatch = preservedUpTo < foundMatch.startIndex;
            const allowedJunk = isFirstMatch ? 5 : 0;
            
            if (matchIndex >= 0 && matchIndex <= allowedJunk) {
                remainingProposedClean = remainingProposedClean.substring(matchIndex + cleanItemStr.length);
                
                let regexStr = isFirstMatch ? "^[\\s\\S]{0,5}?" : "^\\s*";
                for (let c = 0; c < itemStr.length; c++) {
                    const char = itemStr[c];
                    if (char.trim() === '') {
                        regexStr += "\\s*";
                    } else {
                        const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        regexStr += escaped + "\\s*";
                    }
                }
                const match = textToWrite.match(new RegExp(regexStr, "i"));
                if (match) {
                    textToWrite = textToWrite.substring(match[0].length);
                    preservedUpTo = k;
                    if (k < foundMatch.endIndex) {
                        drawX = items[k+1].x;
                    } else {
                        drawX = items[k].x + items[k].width;
                    }
                    continue;
                }
            }
            
            // If we are at the very beginning of the match and the PDF item is short/non-alphanumeric (like a weird bullet)
            // but the AI used a different bullet, we can safely ignore the mismatch and try to preserve the actual label next!
            const isFirstMatchAttempt = preservedUpTo < foundMatch.startIndex;
            const isBulletOrShort = cleanItemStr.length <= 2 || !/[a-z0-9]/i.test(cleanItemStr);
            if (isFirstMatchAttempt && isBulletOrShort) {
                continue; 
            }
            
            break;
        }
        
        // Ensure drawX is shifted past any space items in the PDF so we don't accidentally overwrite the gap
        let actualNextItemIdx = preservedUpTo + 1;
        while (actualNextItemIdx <= foundMatch.endIndex && items[actualNextItemIdx].str.trim() === '') {
            actualNextItemIdx++;
        }
        if (actualNextItemIdx <= foundMatch.endIndex) {
             drawX = items[actualNextItemIdx].x;
        }

        textToWrite = textToWrite.trimStart();
        
        // If we preserved the entire string (e.g. AI made no actual changes to this block), we do nothing!
        if (textToWrite.length === 0) {
            appliedCount++;
            continue;
        }
        
        const safeRightMargin = pageWidth - 40; 
        
        // --- 1. Multi-Line Erasure ---
        // Group items to be erased by their y coordinate (baseline)
        const lineGroups: Record<string, { minX: number, maxX: number, y: number }> = {};
        const yTolerance = originalFontSize * 0.5;

        for (let k = preservedUpTo + 1; k <= foundMatch.endIndex; k++) {
            const item = items[k];
            if (item.str.trim() === '') continue; // Skip empty space items

            let groupY = item.y;
            // Find existing group within tolerance
            for (const key in lineGroups) {
                if (Math.abs(lineGroups[key].y - item.y) <= yTolerance) {
                    groupY = lineGroups[key].y;
                    break;
                }
            }

            if (!lineGroups[groupY]) {
                lineGroups[groupY] = { minX: item.x, maxX: item.x + item.width, y: groupY };
            } else {
                lineGroups[groupY].minX = Math.min(lineGroups[groupY].minX, item.x);
                lineGroups[groupY].maxX = Math.max(lineGroups[groupY].maxX, item.x + item.width);
            }
        }

        // Draw exact white rectangles over each line's bounding box
        for (const key in lineGroups) {
            const group = lineGroups[key];
            
            // Calculate starting erase X: if it's the first line and we preserved a prefix, start exactly at drawX.
            let lineEraseX = group.minX;
            let lineMaxX = group.maxX;
            
            // A bit of padding for complete erasure
            lineEraseX -= 2;
            lineMaxX += 4;
            
            // if this is the top line where we preserved text, don't erase the prefix!
            if (Math.abs(group.y - foundMatch.startItem.y) <= yTolerance) {
                if (preservedUpTo >= foundMatch.startIndex) {
                     lineEraseX = Math.max(lineEraseX, drawX - 1);
                }
            }

            // Box width calculates erasure from lineEraseX to the end of the text on that line
            let boxWidth = lineMaxX - lineEraseX;
            // Expand slightly to ensure we wipe trailing punctuation
            boxWidth += 5;

            const boxHeight = originalFontSize * 1.5; 
            const boxStartY = group.y - (originalFontSize * 0.2);

            page.drawRectangle({
              x: lineEraseX,
              y: boxStartY,
              width: boxWidth,
              height: boxHeight,
              color: rgb(1, 1, 1)
            });
        }
        
        // --- 2. Intelligent Word Wrapping & Vertical Constraint ---
        
        // Close gap if the new text starts with punctuation (and we preserved some text)
        if (preservedUpTo >= foundMatch.startIndex && /^[,.]/.test(textToWrite)) {
            drawX -= 3;
        }

        // Find the absolute left margin of the bullet block for wrapping
        let wrapMarginX = foundMatch.startItem.x;
        if (foundMatch.endIndex > foundMatch.startIndex) {
           const firstStr = items[foundMatch.startIndex].str.trim();
           if (firstStr.length <= 2 && !/[a-z0-9]/i.test(firstStr)) {
               wrapMarginX = items[foundMatch.startIndex + 1].x;
           }
        }

        const words = textToWrite.split(' ');
        const originalLineCount = Math.max(1, Object.keys(lineGroups).length);
        
        let finalFontSize = originalFontSize;
        let wrapSimulation: { text: string, x: number, y: number }[] = [];

        // Try fitting words into originalLineCount. If it fails, shrink font and try again.
        while (finalFontSize > 5) {
            wrapSimulation = [];
            const finalLineHeight = finalFontSize * 1.3;
            let simX = drawX;
            let simY = startY + (originalFontSize * 0.2); // starting Y is fixed to original baseline
            let simCurrentLine = '';
            let simLineCount = 1;

            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const testLine = simCurrentLine ? simCurrentLine + ' ' + word : word;
                const testWidth = helveticaFont.widthOfTextAtSize(testLine, finalFontSize);
                const maxAvailableWidth = safeRightMargin - simX;

                if (testWidth > maxAvailableWidth && simCurrentLine !== '') {
                    wrapSimulation.push({ text: simCurrentLine, x: simX, y: simY });
                    simCurrentLine = word;
                    simX = wrapMarginX;
                    simY -= finalLineHeight;
                    simLineCount++;
                } else {
                    simCurrentLine = testLine;
                }
            }

            if (simCurrentLine) {
                wrapSimulation.push({ text: simCurrentLine, x: simX, y: simY });
            }

            // If we fit within the original line count, break!
            if (simLineCount <= originalLineCount) {
                break;
            } else {
                finalFontSize -= 0.5;
            }
        }

        // Render using the simulation results
        for (const line of wrapSimulation) {
            page.drawText(line.text, {
                x: line.x,
                y: line.y,
                size: finalFontSize,
                font: helveticaFont,
                color: rgb(0, 0, 0)
            });
        }

        appliedCount++;
      } else {
        throw new Error(`FORMAT_PRESERVATION_UNSUPPORTED: Could not reliably locate target text "${swap.originalText.substring(0, 30)}..." in the original PDF. Modifications aborted to protect layout.`);
      }
    }

    const modifiedBytes = await modPdf.save();
    
    return {
      modifiedBuffer: Buffer.from(modifiedBytes),
      appliedCount,
      skippedCount,
      originalPageCount,
      newPageCount: modPdf.getPageCount()
    };
  }
}
