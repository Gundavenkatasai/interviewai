import JSZip from "jszip";
import { IBulletPosition, IDocxStructureMap, ISwapItem, ISwapResult } from "./docx.types";

export class DocxEngine {
  /**
   * Escape XML entities
   */
  public static escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Unescape XML entities
   */
  public static unescapeXml(str: string): string {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  /**
   * Check if a word looks like a technical skill or tool
   * (CamelCase, acronyms like AWS/GCP/CI/CD, dot notation like Node.js)
   */
  public static looksLikeTechTerm(word: string): boolean {
    if (/^[A-Z]{2,8}$/.test(word)) return true; // AWS, GCP, REST, SQL, CI/CD, K8S
    if (/^[A-Z][a-z]+([A-Z][a-z]*)+/.test(word)) return true; // TypeScript, JavaScript, MongoDB, PyTorch
    if (/^[A-Z][a-zA-Z0-9]*\.[a-zA-Z]+/.test(word)) return true; // Node.js, Next.js, Vue.js
    if (/^[a-z]+([A-Z][a-z]+)+/.test(word)) return true; // iOS, macOS, iPadOS
    const KNOWN_TOOLS = new Set([
      "Docker", "Kubernetes", "Python", "React", "Linux", "Redis", "Kafka", "Jenkins",
      "Git", "GitHub", "GitLab", "Ansible", "Terraform", "Nginx", "Apache", "Java",
      "Rust", "Golang", "Kotlin", "Swift", "Scala", "FastAPI", "Webpack", "Vite"
    ]);
    if (KNOWN_TOOLS.has(word)) return true;
    return false;
  }

  /**
   * Extract all <w:p> tags from document.xml in order
   */
  public static extractParagraphXmls(documentXml: string): string[] {
    const paragraphs: string[] = [];
    const pRegex = /<w:p\b[\s\S]*?<\/w:p>/g;
    let match: RegExpExecArray | null;
    while ((match = pRegex.exec(documentXml)) !== null) {
      paragraphs.push(match[0]);
    }
    return paragraphs;
  }

  /**
   * Extract plain text from a <w:p> XML fragment
   */
  public static extractTextFromParagraph(paraXml: string): string {
    let fullText = "";
    const tokenRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>/g;
    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(paraXml)) !== null) {
      if (match[1] !== undefined) {
        fullText += this.unescapeXml(match[1]);
      } else {
        fullText += " ";
      }
    }
    return fullText.trim();
  }

  /**
   * Extract plain text from a XML fragment without trimming spaces
   */
  public static extractExactTextFromRun(xmlStr: string): string {
    let fullText = "";
    const tokenRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>/g;
    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(xmlStr)) !== null) {
      if (match[1] !== undefined) {
        fullText += this.unescapeXml(match[1]);
      } else {
        fullText += " ";
      }
    }
    return fullText;
  }

  /**
   * Check if a run XML has bold formatting (<w:b/> or <w:b w:val="true"/> or <w:bCs/>)
   */
  public static isRunBold(runXml: string): boolean {
    const rPrMatch = runXml.match(/<w:rPr\b[\s\S]*?<\/w:rPr>/);
    if (!rPrMatch) return false;
    const rPr = rPrMatch[0];
    if (/<w:b\b(?!\s*w:val="(?:0|false)")/i.test(rPr)) return true;
    if (/<w:bCs\b(?!\s*w:val="(?:0|false)")/i.test(rPr)) return true;
    return false;
  }

  /**
   * Build bold vocabulary by scanning all bold runs across all paragraphs
   */
  public static buildBoldVocabulary(documentXml: string): string[] {
    const vocab = new Set<string>();
    const runRegex = /<w:r\b[\s\S]*?<\/w:r>/g;
    let match: RegExpExecArray | null;

    while ((match = runRegex.exec(documentXml)) !== null) {
      const runXml = match[0];
      if (this.isRunBold(runXml)) {
        const text = this.extractTextFromParagraph(runXml).trim();
        if (text.length > 1) {
          vocab.add(text);
          // Split on comma, semicolon, slash to capture separated items
          text.split(/[,;/]/).forEach((part) => {
            const clean = part.trim();
            if (clean.length > 1) vocab.add(clean);
          });
        }
      }
    }

    // Sort by length descending so multi-word phrases match before substrings
    return Array.from(vocab).sort((a, b) => b.length - a.length);
  }

  /**
   * Paragraph classification: Heading
   */
  public static isHeading(paraXml: string, text: string): boolean {
    if (!text) return false;
    // Check style name
    if (/<w:pStyle\b[^>]*w:val="[^"]*Heading[^"]*"/i.test(paraXml)) return true;
    if (/<w:pStyle\b[^>]*w:val="[^"]*Title[^"]*"/i.test(paraXml)) return true;

    // Short all-caps text
    if (text.length < 50 && text === text.toUpperCase() && /[A-Z]/.test(text)) {
      return true;
    }

    // Standard section names
    const commonHeadings = [
      "experience", "work experience", "professional experience", "employment history",
      "education", "academic background", "skills", "technical skills", "projects",
      "certifications", "achievements", "summary", "professional summary"
    ];
    if (commonHeadings.includes(text.toLowerCase())) {
      return true;
    }

    return false;
  }

  /**
   * Paragraph classification: Role Header (e.g. "Senior Software Engineer | Google | 2021 - Present")
   */
  public static isRoleHeader(paraXml: string, text: string): boolean {
    if (!text || text.length > 130) return false;
    if (this.isBullet(paraXml, text)) return false;

    // Look for separator or year range
    const hasSeparator = /[|·•—–,]/.test(text);
    const hasYear = /\b(19|20)\d{2}\b/.test(text);

    // If text has year and role-like keywords
    if (hasYear && (hasSeparator || /\b(?:developer|engineer|manager|lead|architect|intern|analyst|specialist)\b/i.test(text))) {
      return true;
    }

    return false;
  }

  /**
   * Paragraph classification: Bullet Point
   */
  /**
   * Paragraph classification: Bullet Point
   */
  public static isBullet(paraXml: string, text: string): boolean {
    if (!text) return false;

    // Check for Word native list / numbering properties
    if (/<w:numPr\b[\s\S]*?<\/w:numPr>/i.test(paraXml)) return true;

    // Check paragraph style
    if (/<w:pStyle\b[^>]*w:val="[^"]*List[^"]*"/i.test(paraXml)) return true;
    if (/<w:pStyle\b[^>]*w:val="[^"]*Bullet[^"]*"/i.test(paraXml)) return true;

    // Check indentation
    if (/<w:ind\b[^>]*w:left="[1-9]\d*"/i.test(paraXml)) return true;

    // Check starting bullet characters
    if (/^[•·\*\-–—▪▫◦✦➢]\s*/.test(text)) return true;

    return false;
  }

  /**
   * Build complete document structure map
   */
  public static buildStructureMap(documentXml: string): IDocxStructureMap {
    const paragraphs = this.extractParagraphXmls(documentXml);
    const boldVocabulary = this.buildBoldVocabulary(documentXml);
    const headings: string[] = [];
    const bullets: IBulletPosition[] = [];

    let currentSection = "Experience";
    let currentRole = -1;
    let currentBullet = -1;

    for (let idx = 0; idx < paragraphs.length; idx++) {
      const paraXml = paragraphs[idx];
      const text = this.extractTextFromParagraph(paraXml);
      if (!text) continue;

      if (this.isHeading(paraXml, text)) {
        currentSection = text;
        headings.push(text);
        currentRole = -1;
        currentBullet = -1;
        continue;
      }

      if (this.isRoleHeader(paraXml, text)) {
        currentRole += 1;
        currentBullet = -1;
        continue;
      }

      if (this.isBullet(paraXml, text)) {
        currentBullet += 1;
        bullets.push({
          paraIndex: idx,
          section: currentSection,
          roleIndex: Math.max(currentRole, 0),
          bulletIndex: currentBullet,
          text,
          originalXml: paraXml
        });
      }
    }

    return {
      bullets,
      headings,
      boldVocabulary,
      totalParagraphs: paragraphs.length,
      bulletCount: bullets.length
    };
  }

  /**
   * Split text into segments with bold flags using bold vocabulary + tech terms heuristic
   */
  public static segmentTextWithBold(text: string, vocab: string[]): Array<{ text: string; bold: boolean }> {
    const lowerText = text.toLowerCase();
    const matches: Array<{ start: number; end: number; term: string }> = [];

    // 1. Match vocabulary terms on word boundaries
    for (const term of vocab) {
      const lowerTerm = term.toLowerCase();
      let start = 0;
      while (true) {
        const idx = lowerText.indexOf(lowerTerm, start);
        if (idx === -1) break;
        const end = idx + term.length;

        const beforeOk = idx === 0 || !/[a-zA-Z0-9]/.test(text[idx - 1]);
        const afterOk = end >= text.length || !/[a-zA-Z0-9]/.test(text[end]);

        if (beforeOk && afterOk) {
          matches.push({ start: idx, end, term: text.substring(idx, end) });
        }
        start = idx + 1;
      }
    }

    // Sort matches: earliest first, then longest
    matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    // Deduplicate overlaps
    const cleanMatches: Array<{ start: number; end: number; term: string }> = [];
    let lastEnd = 0;
    for (const m of matches) {
      if (m.start >= lastEnd) {
        cleanMatches.push(m);
        lastEnd = m.end;
      }
    }

    // 2. Build segments with heuristic fallback
    const segments: Array<{ text: string; bold: boolean }> = [];
    let pos = 0;

    for (const m of cleanMatches) {
      if (pos < m.start) {
        const nonBold = text.substring(pos, m.start);
        segments.push(...this.heuristicSegments(nonBold));
      }
      segments.push({ text: m.term, bold: true });
      pos = m.end;
    }

    if (pos < text.length) {
      segments.push(...this.heuristicSegments(text.substring(pos)));
    }

    // Merge adjacent segments with identical bold state to minimize XML run count
    const merged: Array<{ text: string; bold: boolean }> = [];
    for (const seg of segments) {
      if (!seg.text) continue;
      if (merged.length > 0 && merged[merged.length - 1].bold === seg.bold) {
        merged[merged.length - 1].text += seg.text;
      } else {
        merged.push({ ...seg });
      }
    }

    return merged;
  }

  /**
   * Apply tech-term heuristic to non-vocabulary text
   */
  private static heuristicSegments(text: string): Array<{ text: string; bold: boolean }> {
    if (!text) return [];
    const segments: Array<{ text: string; bold: boolean }> = [];
    const tokens = text.split(/(\s+|[,;:()\[\]"'])/);

    for (const token of tokens) {
      if (!token) continue;
      const word = token.replace(/^[.,;:()\[\]"'\s]+|[.,;:()\[\]"'\s]+$/g, "");
      if (word && this.looksLikeTechTerm(word)) {
        const idx = token.indexOf(word);
        const prefix = token.substring(0, idx);
        const suffix = token.substring(idx + word.length);
        if (prefix) segments.push({ text: prefix, bold: false });
        segments.push({ text: word, bold: true });
        if (suffix) segments.push({ text: suffix, bold: false });
      } else {
        segments.push({ text: token, bold: false });
      }
    }

    return segments;
  }

  /**
   * Extract base <w:rPr> from a paragraph (prefers first non-bold run, falls back to first run)
   */
  public static getBaseRunProperties(paraXml: string): string {
    const runs = paraXml.match(/<w:r\b[\s\S]*?<\/w:r>/g) || [];
    for (const r of runs) {
      if (!this.isRunBold(r)) {
        const rPrMatch = r.match(/<w:rPr\b[\s\S]*?<\/w:rPr>/);
        if (rPrMatch) return rPrMatch[0];
      }
    }
    // Fall back to first run's rPr
    const firstRun = runs[0];
    if (firstRun) {
      const rPrMatch = firstRun.match(/<w:rPr\b[\s\S]*?<\/w:rPr>/);
      if (rPrMatch) return rPrMatch[0];
    }
    return "";
  }

  /**
   * Construct a formatted <w:r> XML element
   */
  public static makeRunXml(text: string, baseRPr: string, bold: boolean): string {
    let rPr = baseRPr;

    if (!rPr) {
      rPr = bold ? "<w:rPr><w:b/><w:bCs/></w:rPr>" : "";
    } else if (bold) {
      if (!/<w:b\b/i.test(rPr)) {
        const rStyleMatch = rPr.match(/<w:rStyle\b[^>]*?(?:\/>|<\/w:rStyle>)/i);
        const rFontsMatch = rPr.match(/<w:rFonts\b[^>]*?(?:\/>|<\/w:rFonts>)/i);
        
        const rStyleStr = rStyleMatch ? rStyleMatch[0] : "";
        const rFontsStr = rFontsMatch ? rFontsMatch[0] : "";
        
        let cleanRPr = rPr
          .replace(/<w:rStyle\b[^>]*?(?:\/>|<\/w:rStyle>)/i, "")
          .replace(/<w:rFonts\b[^>]*?(?:\/>|<\/w:rFonts>)/i, "");
          
        rPr = cleanRPr.replace(/<w:rPr[^>]*>/i, (match) => {
          return match + rStyleStr + rFontsStr + "<w:b/><w:bCs/>";
        });
      }
    } else {
      rPr = rPr
        .replace(/<w:b\b[^>]*\/>/gi, "")
        .replace(/<w:b\b[\s\S]*?<\/w:b>/gi, "")
        .replace(/<w:bCs\b[^>]*\/>/gi, "")
        .replace(/<w:bCs\b[\s\S]*?<\/w:bCs>/gi, "");
    }

    const safeText = this.escapeXml(text);
    return `<w:r>${rPr}<w:t xml:space="preserve">${safeText}</w:t></w:r>`;
  }

  /**
   * Apply swaps to original DOCX buffer preserving all styles, layout, and formatting
   */
  public static async applySwaps(docxBuffer: Buffer, swaps: ISwapItem[]): Promise<ISwapResult> {
    const zip = await JSZip.loadAsync(docxBuffer);
    const documentXmlFile = zip.file("word/document.xml");

    if (!documentXmlFile) {
      throw new Error("Invalid DOCX file: word/document.xml not found.");
    }

    let documentXml = await documentXmlFile.async("string");
    const structureMapBefore = this.buildStructureMap(documentXml);
    const bulletCountBefore = structureMapBefore.bulletCount;

    const applied: { id: string }[] = [];
    const skipped: { id: string; reason: string }[] = [];

    const approvedSwaps = swaps.filter((s) => s.approved !== false && s.proposedText?.trim());

    // Build an indexed inventory of ALL paragraphs in the document
    const rawParagraphXmls = this.extractParagraphXmls(documentXml);
    let activeSection = "Experience";

    interface IDocPara {
      index: number;
      rawXml: string;
      text: string;
      cleanText: string;
      words: string[];
      section: string;
      isBullet: boolean;
      replaced: boolean;
    }

    const docParagraphs: IDocPara[] = [];

    for (let i = 0; i < rawParagraphXmls.length; i++) {
      const pXml = rawParagraphXmls[i];
      const pText = this.extractTextFromParagraph(pXml);

      if (this.isHeading(pXml, pText)) {
        activeSection = pText;
      }

      const cleanText = pText
        .replace(/^[•·\*\-–—▪▫◦✦➢\d+\.\)\s]+/g, "")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      const words = cleanText.split(" ").filter((w) => w.length >= 3);

      docParagraphs.push({
        index: i,
        rawXml: pXml,
        text: pText,
        cleanText,
        words,
        section: activeSection,
        isBullet: this.isBullet(pXml, pText),
        replaced: false
      });
    }

    for (const swap of approvedSwaps) {
      const swapId = swap.id || "swap";
      let newText = swap.proposedText.trim();

      const swapOrigClean = (swap.originalText || "")
        .replace(/^[•·\*\-–—▪▫◦✦➢\d+\.\)\s]+/g, "")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      const swapWords = swapOrigClean.split(" ").filter((w) => w.length >= 3);

      // Locate target paragraph by searching ALL paragraphs in document
      let bestPara: IDocPara | null = null;
      let highestScore = 0;

      // 1. StructureMap match (if exact section + roleIndex + bulletIndex was mapped)
      if (swap.section !== undefined && swap.roleIndex !== undefined && swap.bulletIndex !== undefined) {
        const smMatch = structureMapBefore.bullets.find(
          (b: IBulletPosition) =>
            b.section.toLowerCase() === swap.section?.toLowerCase() &&
            b.roleIndex === swap.roleIndex &&
            b.bulletIndex === swap.bulletIndex
        );
        if (smMatch) {
          const foundInDoc = docParagraphs.find((p) => p.rawXml === smMatch.originalXml && !p.replaced);
          if (foundInDoc) {
            bestPara = foundInDoc;
            highestScore = 2000;
          }
        }
      }

      // 2. Full document scoring across all paragraphs
      if (highestScore < 1000) {
        for (const p of docParagraphs) {
          if (p.replaced || !p.cleanText) continue;

          let score = 0;

          // Exact clean text match
          if (p.cleanText === swapOrigClean) {
            score = 1000;
          }
          // Substring inclusion (either direction)
          else if (p.cleanText.includes(swapOrigClean) || swapOrigClean.includes(p.cleanText)) {
            score = 800 + Math.min(p.cleanText.length, 100);
          }
          // Significant prefix match (first 25 characters)
          else if (swapOrigClean.length >= 20 && p.cleanText.startsWith(swapOrigClean.slice(0, 25))) {
            score = 700;
          }
          // Keyword overlap
          else if (swapWords.length >= 2) {
            const matched = swapWords.filter((w) => p.words.includes(w) || p.cleanText.includes(w)).length;
            const ratio = matched / swapWords.length;
            if (ratio >= 0.5) {
              score = 400 + Math.round(ratio * 200);
            }
          }

          // Section affinity bonus
          if (score > 0 && swap.section && p.section.toLowerCase().includes(swap.section.toLowerCase())) {
            score += 50;
          }

          if (score > highestScore) {
            highestScore = score;
            bestPara = p;
          }
        }
      }

      if (!bestPara || highestScore < 300) {
        skipped.push({ id: swapId, reason: "Target bullet paragraph not found in document structure." });
        continue;
      }

      // Match bullet presence exactly to the original text in the XML runs
      const rawOrigTextTrimmed = bestPara.text; // already trimmed
      const origBulletMatch = rawOrigTextTrimmed.match(/^([•·\*\-–—▪▫◦✦➢]\s*)/);
      
      // Strip any bullet from newText first to normalize
      let cleanNewText = newText.trimStart().replace(/^[•·\*\-–—▪▫◦✦➢]\s*/, "");
      
      // If original had a typed bullet, restore it
      if (origBulletMatch) {
          cleanNewText = origBulletMatch[1] + cleanNewText;
      }
      
      // If original had leading spaces before the text, restore them so character matching aligns
      const rawOrigExact = this.extractExactTextFromRun(bestPara.rawXml);
      const leadingSpaceMatch = rawOrigExact.match(/^(\s+)/);
      if (leadingSpaceMatch) {
          cleanNewText = leadingSpaceMatch[1] + cleanNewText.trimStart();
      }

      const targetParaXml = bestPara.rawXml;
      
      // Generate the new formatted runs using the heuristic segmenter
      let newRunsXml = "";
      const baseRPr = this.getBaseRunProperties(targetParaXml);
      const segments = this.segmentTextWithBold(cleanNewText, structureMapBefore.boldVocabulary);
      for (const seg of segments) {
          newRunsXml += this.makeRunXml(seg.text, baseRPr, seg.bold);
      }

      // Safely preserve the original paragraph structure (including bookmarks, proofErr, etc.)
      // by stripping only the text content, and appending the new text runs at the end.
      let preservedParaXml = targetParaXml
        .replace(/<w:t\b[^>]*>[\s\S]*?<\/w:t>/g, "")
        .replace(/<w:t\b[^>]*\/>/g, "")
        .replace(/<w:tab\/>/g, "")
        .replace(/<w:br\b[^>]*\/>/g, "");

      const modifiedParaXml = preservedParaXml.replace(/<\/w:p>$/, `${newRunsXml}</w:p>`);

      // Replace in documentXml in-place
      if (documentXml.includes(targetParaXml)) {
        documentXml = documentXml.replace(targetParaXml, modifiedParaXml);
        applied.push({ id: swapId });
        bestPara.replaced = true;
        bestPara.rawXml = modifiedParaXml;
        bestPara.text = newText;
      } else {
        skipped.push({ id: swapId, reason: "Target paragraph string was modified or missing in document XML" });
      }
    }

    // Validate bullet count after replacement
    const structureMapAfter = this.buildStructureMap(documentXml);
    const bulletCountAfter = structureMapAfter.bulletCount;

    // Save modified document.xml back into the ORIGINAL zip package
    zip.file("word/document.xml", documentXml);
    const modifiedBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    return {
      applied,
      skipped,
      bulletCountBefore,
      bulletCountAfter,
      modifiedBuffer
    };
  }
}
