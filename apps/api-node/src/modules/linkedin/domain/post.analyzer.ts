export interface PostAnalysisResult {
  overallPostScore: number; // 0 - 100
  hookScore: number;
  readabilityScore: number;
  structureScore: number;
  ctaScore: number;
  technicalDepthScore: number;
  estimatedReadingTimeSeconds: number;
  characterCount: number;
  wordCount: number;
  contentPillarDetected: string;
  strengths: string[];
  improvements: string[];
}

export class PostAnalyzer {
  static analyze(postText: string): PostAnalysisResult {
    const text = postText.trim();
    const characters = text.length;
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const paragraphs = text.split(/\n+/).filter(Boolean);

    const strengths: string[] = [];
    const improvements: string[] = [];

    // 1. Hook evaluation (First 1-2 lines)
    const firstLine = paragraphs[0] || "";
    let hookScore = 60;
    if (firstLine.length >= 20 && firstLine.length <= 120) {
      hookScore += 25;
      strengths.push("Hook line length is optimized for mobile feed truncation.");
    } else if (firstLine.length > 150) {
      hookScore -= 20;
      improvements.push("First line is too long (> 150 chars). Break before the mobile 'see more' fold.");
    }

    if (/\d/.test(firstLine)) {
      hookScore += 15;
      strengths.push("Hook contains specific numerical data.");
    }

    hookScore = Math.min(100, Math.max(10, hookScore));

    // 2. Structure & Readability
    let structureScore = 70;
    if (paragraphs.length >= 3) {
      structureScore += 20;
      strengths.push("Well-spaced paragraphs make the post scannable on mobile.");
    } else {
      structureScore -= 20;
      improvements.push("Avoid solid text blocks. Break post into 1-2 sentence paragraphs.");
    }

    // 3. CTA
    const lastParagraph = paragraphs[paragraphs.length - 1] || "";
    let ctaScore = 50;
    if (/\?/.test(lastParagraph) || /share|thoughts|comment|perspective/i.test(lastParagraph)) {
      ctaScore = 90;
      strengths.push("Includes an engaging question or call-to-action closing.");
    } else {
      ctaScore = 40;
      improvements.push("Add a closing question to prompt peer discussions in the comment section.");
    }

    // 4. Technical Depth & Pillar
    let technicalDepthScore = 50;
    let detectedPillar = "Career Journey";

    if (/architecture|database|latency|cache|microservices|distributed|docker|kubernetes|api|sql|concurrency/i.test(text)) {
      technicalDepthScore = 90;
      detectedPillar = "Technical Architecture";
      strengths.push("Demonstrates concrete systems engineering knowledge.");
    } else if (/interview|hiring|recruiter|offer|resume/i.test(text)) {
      detectedPillar = "Interview & Career";
      technicalDepthScore = 70;
    } else if (/lesson|mistake|growth|learning/i.test(text)) {
      detectedPillar = "Engineering Mindset";
      technicalDepthScore = 65;
    }

    // Overall Score
    const overallPostScore = Math.round(
      hookScore * 0.35 + structureScore * 0.25 + ctaScore * 0.2 + technicalDepthScore * 0.2
    );

    return {
      overallPostScore,
      hookScore,
      readabilityScore: 85,
      structureScore,
      ctaScore,
      technicalDepthScore,
      estimatedReadingTimeSeconds: Math.ceil((wordCount / 200) * 60),
      characterCount: characters,
      wordCount,
      contentPillarDetected: detectedPillar,
      strengths,
      improvements,
    };
  }
}
