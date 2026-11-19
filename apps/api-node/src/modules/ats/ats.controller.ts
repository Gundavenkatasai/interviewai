import { FastifyRequest, FastifyReply } from "fastify";
import { ResumeParser } from "../resume/resume.parser";
import { AtsScoringService } from "./ats-scoring.service";
import { AtsAiService } from "./ats-ai.service";
import { ResumeAnalysisModel } from "./ats-analysis.model";
import { Job } from "../jobs/jobs.model";
import { AIService } from "../../ai/ai.service";

export class AtsController {
  /**
   * 1. POST /api/ats/upload
   * Validate and extract text & sections from uploaded PDF or DOCX file
   */
  static async upload(request: FastifyRequest, reply: FastifyReply) {
    const file = await request.file();
    if (!file) {
      return reply.status(400).send({ success: false, message: "No resume file uploaded." });
    }

    const filename = file.filename || "resume.pdf";
    const ext = filename.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "doc", "txt"].includes(ext || "")) {
      return reply.status(400).send({
        success: false,
        message: "Unsupported file format. Please upload a standard PDF or DOCX document.",
      });
    }

    const buffer = await file.toBuffer();
    if (!buffer || buffer.length === 0) {
      return reply.status(400).send({
        success: false,
        message: "The uploaded file is empty or corrupted.",
      });
    }

    if (buffer.length > 10 * 1024 * 1024) {
      return reply.status(400).send({
        success: false,
        message: "File exceeds the 10MB maximum size limit.",
      });
    }

    try {
      const { text, isScanned, warnings } = await ResumeParser.extractRawText(buffer, file.mimetype || filename);

      if (!text || text.trim().length < 15) {
        return reply.status(400).send({
          success: false,
          isScanned: true,
          message:
            "Could not extract readable text layer from this document. It may be a scanned image or password-protected. Please upload a text-searchable PDF or DOCX.",
          warnings,
        });
      }

      const { profileData, confidence, confidenceMessage } = ResumeParser.parseTextToResume(text, filename);

      return {
        success: true,
        fileName: filename,
        fileSize: buffer.length,
        fileType: ext,
        text,
        profileData,
        isScanned,
        warnings,
        confidence,
        confidenceMessage,
      };
    } catch (err: any) {
      request.log.error(err, "[AtsController.upload] Error processing resume stream");
      return reply.status(500).send({
        success: false,
        message: `Failed to parse document: ${err.message || "Unknown parser error"}`,
      });
    }
  }

  /**
   * 2. POST /api/ats/analyze
   * Run deterministic ATS evaluation & AI semantic analysis, then persist report
   */
  static async analyze(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    const body = (request.body as any) || {};

    const {
      fileName = "Uploaded_Resume.pdf",
      fileSize = 0,
      fileType = "pdf",
      text,
      profileData,
      mode = "GENERAL",
      targetRole: requestedRole,
      jobId,
      jdText: rawJdText,
      previousAnalysisId,
    } = body;

    if (!text || text.trim().length < 20) {
      return reply.status(400).send({
        success: false,
        message: "Resume text content is required for ATS analysis.",
      });
    }

    let jdText = rawJdText || "";
    let linkedJob: any = null;

    if (jobId) {
      linkedJob = await Job.findById(jobId).lean();
      if (linkedJob && linkedJob.description) {
        jdText = linkedJob.description;
      }
    }

    const detectedRole = requestedRole || (linkedJob?.title) || AtsScoringService.detectTargetRole(text, profileData);

    // 1. Run Deterministic ATS Evaluation Rubric
    const evaluation = AtsScoringService.evaluate(text, profileData, {
      mode: mode === "JOB_SPECIFIC" ? "JOB_SPECIFIC" : "GENERAL",
      targetRole: detectedRole,
      jdText,
      fileName,
    });

    // 2. Enrich with semantic AI feedback if available
    try {
      const aiEnrichment = await AtsAiService.enrichAnalysis(text, detectedRole, profileData, evaluation.issues);
      if (aiEnrichment.additionalStrengths.length > 0) {
        evaluation.strengths = Array.from(new Set([...evaluation.strengths, ...aiEnrichment.additionalStrengths]));
      }
    } catch (e) {
      // AI enrichment non-blocking
    }

    // 3. Before vs After comparison
    let beforeScore: number | undefined;
    let afterScore: number | undefined;

    if (previousAnalysisId) {
      const prevDoc = await ResumeAnalysisModel.findOne({ _id: previousAnalysisId, userId }).lean();
      if (prevDoc) {
        beforeScore = prevDoc.overallScore;
        afterScore = evaluation.overallScore;
      }
    }

    // 4. Save analysis report to MongoDB
    const reportDoc = await ResumeAnalysisModel.create({
      userId,
      jobId: jobId || undefined,
      fileName,
      fileSize,
      fileType,
      analysisMode: mode === "JOB_SPECIFIC" ? "JOB_SPECIFIC" : "GENERAL",
      targetRole: detectedRole,
      jobDescriptionText: jdText ? jdText.slice(0, 10000) : undefined,
      overallScore: evaluation.overallScore,
      scoreBand: evaluation.scoreBand,
      candidateClassification: evaluation.candidateClassification,
      ruleLedger: evaluation.ruleLedger,
      categoryScores: evaluation.categoryScores,
      strengths: evaluation.strengths,
      issues: evaluation.issues,
      keywordAnalysis: evaluation.keywordAnalysis,
      sectionAnalysis: evaluation.sectionAnalysis,
      improvementRoadmap: evaluation.improvementRoadmap,
      extractedResumeData: profileData || {},
      rawText: text,
      previousAnalysisId: previousAnalysisId || undefined,
      beforeScore,
      afterScore,
      scoringVersion: "3.0-deterministic",
    });

    return {
      success: true,
      analysis: reportDoc,
    };
  }

  /**
   * 3. GET /api/ats/analysis/:id
   */
  static async getAnalysis(request: FastifyRequest<any>, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    const { id } = request.params as { id: string };

    const analysis = await ResumeAnalysisModel.findOne({ _id: id, userId });
    if (!analysis) {
      return reply.status(404).send({ success: false, message: "Analysis report not found." });
    }

    return { success: true, analysis };
  }

  /**
   * 4. GET /api/ats/history
   * Retrieve all previous ATS scans for this user
   */
  static async getHistory(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user?.sub;

    const history = await ResumeAnalysisModel.find({ userId })
      .select("_id fileName overallScore scoreBand analysisMode targetRole createdAt beforeScore afterScore")
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return { success: true, history };
  }

  /**
   * 5. POST /api/ats/analysis/:id/improve
   * Generate proposed improvements side-by-side based on actual resume data
   */
  static async improve(request: FastifyRequest<any>, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    const { id } = request.params as { id: string };

    const analysis = await ResumeAnalysisModel.findOne({ _id: id, userId });
    if (!analysis) {
      return reply.status(404).send({ success: false, message: "Analysis report not found." });
    }

    const improvements = await AtsAiService.generateImprovements(
      analysis.rawText,
      analysis.extractedResumeData,
      analysis.issues,
      analysis.targetRole,
      analysis.jobDescriptionText
    );

    return { success: true, improvements };
  }

  /**
   * 6. POST /api/ats/analysis/:id/improve-section
   * Improve a specific individual bullet or section
   */
  static async improveSection(request: FastifyRequest<any>, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = (request.body as any) || {};
    const { section, currentText, instruction } = body;

    if (!currentText || !currentText.trim()) {
      return reply.status(400).send({ success: false, message: "Current text is required." });
    }

    try {
      const prompt = `
You are an expert ATS Resume Optimization Specialist.
Improve this ${section || "bullet point"} from a technical resume.

CRITICAL CONSTRAINTS:
1. Do not invent unverified metrics, tools, or companies.
2. Convert passive phrasing into high-impact active voice starting with a strong past-tense action verb.
3. Make it concise and punchy for ATS readability.

Current text: "${currentText.trim()}"
${instruction ? `Instruction: ${instruction}` : ""}

Provide ONLY the revised text string, with no quotes, commentary, or markdown formatting.
`;

      const improved = await AIService.generate(
        [
          { role: "system", content: "You are an ATS resume improvement tool. Output only the improved text." },
          { role: "user", content: prompt },
        ],
        { task: "RESUME_OPTIMIZATION", temperature: 0.2 }
      );

      return { success: true, improvedText: improved.trim().replace(/^["']|["']$/g, "") };
    } catch (err: any) {
      // Deterministic fallback
      const cleaned = currentText.replace(/^(?:responsible for|worked on|helped with)\s+/i, "");
      const fallback = `Engineered ${cleaned}, adhering to modern architecture standards and ensuring high operational reliability.`;
      return { success: true, improvedText: fallback };
    }
  }

  /**
   * 7. GET /api/ats/analysis/:id/report
   */
  static async getReport(request: FastifyRequest<any>, reply: FastifyReply) {
    return AtsController.getAnalysis(request, reply);
  }

  /**
   * 8. GET /api/ats/analysis/:id/download
   * Generates and downloads a formatted ATS Audit Report
   */
  static async downloadReport(request: FastifyRequest<any>, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    const { id } = request.params as { id: string };

    const analysis = await ResumeAnalysisModel.findOne({ _id: id, userId });
    if (!analysis) {
      return reply.status(404).send({ success: false, message: "Analysis report not found." });
    }

    const lines: string[] = [
      "================================================================================",
      "                  INTERVIEWAI — ATS RESUME AUDIT CERTIFICATE",
      "================================================================================",
      `Document:       ${analysis.fileName}`,
      `Date Evaluated: ${new Date(analysis.createdAt).toLocaleDateString()} ${new Date(analysis.createdAt).toLocaleTimeString()}`,
      `Scan Mode:      ${analysis.analysisMode === "JOB_SPECIFIC" ? "Job-Specific Requisition Match" : "General Industry Scan"}`,
      `Target Role:    ${analysis.targetRole}`,
      `Candidate Level:${(analysis as any).candidateClassification?.experienceLevel || "GENERAL"} (${(analysis as any).candidateClassification?.appliedScoringPolicy || "Standard Policy"})`,
      `Evidence Count: Full-Time: ${(analysis as any).candidateClassification?.verifiedEmploymentCount ?? 0} | Internships: ${(analysis as any).candidateClassification?.verifiedInternshipCount ?? 0} | Projects: ${(analysis as any).candidateClassification?.projectCount ?? 0}`,
      `Scoring Engine: InterviewAI Calibrated ATS Rubric (${analysis.scoringVersion})`,
      "--------------------------------------------------------------------------------",
      `OVERALL SCORE:  ${analysis.overallScore} / 100  [${analysis.scoreBand.toUpperCase()}]`,
      analysis.beforeScore != null
        ? `BEFORE/AFTER:   Initial: ${analysis.beforeScore}  -->  Current: ${analysis.afterScore} (+${(analysis.afterScore || 0) - (analysis.beforeScore || 0)} pts)`
        : "",
      "================================================================================",
      "",
      "--------------------------------------------------------------------------------",
      "1. CATEGORY SCORE BREAKDOWN",
      "--------------------------------------------------------------------------------",
      `• Keywords & Skills Relevance:        ${analysis.categoryScores.keywordsSkills.score} / ${analysis.categoryScores.keywordsSkills.maxScore} (${analysis.categoryScores.keywordsSkills.percentage}%)`,
      `  Summary: ${analysis.categoryScores.keywordsSkills.summary}`,
      "",
      `• Resume Structure & Sections:        ${analysis.categoryScores.resumeStructure.score} / ${analysis.categoryScores.resumeStructure.maxScore} (${analysis.categoryScores.resumeStructure.percentage}%)`,
      `  Summary: ${analysis.categoryScores.resumeStructure.summary}`,
      "",
      `• Work Experience & Project Quality:  ${analysis.categoryScores.experienceProjects.score} / ${analysis.categoryScores.experienceProjects.maxScore} (${analysis.categoryScores.experienceProjects.percentage}%)`,
      `  Sub-Scores: Full-Time Roles: ${(analysis.categoryScores.experienceProjects as any).professionalEmploymentScore ?? "N/A"} | Projects: ${(analysis.categoryScores.experienceProjects as any).projectScore ?? 0} | Internships: ${(analysis.categoryScores.experienceProjects as any).internshipScore ?? "N/A"}`,
      `  Policy:     ${(analysis.categoryScores.experienceProjects as any).appliedPolicy || "Standard"}`,
      `  Summary:    ${analysis.categoryScores.experienceProjects.summary}`,
      "",
      `• Formatting & ATS Readability:       ${analysis.categoryScores.formattingReadability.score} / ${analysis.categoryScores.formattingReadability.maxScore} (${analysis.categoryScores.formattingReadability.percentage}%)`,
      `  Summary: ${analysis.categoryScores.formattingReadability.summary}`,
      "",
      `• Education & Certifications:         ${analysis.categoryScores.educationCertifications.score} / ${analysis.categoryScores.educationCertifications.maxScore} (${analysis.categoryScores.educationCertifications.percentage}%)`,
      `  Summary: ${analysis.categoryScores.educationCertifications.summary}`,
      "",
      `• Contact Details & Links:            ${analysis.categoryScores.contactInfo.score} / ${analysis.categoryScores.contactInfo.maxScore} (${analysis.categoryScores.contactInfo.percentage}%)`,
      `  Summary: ${analysis.categoryScores.contactInfo.summary}`,
      "",
      `• Grammar, Clarity & Content Quality: ${analysis.categoryScores.grammarClarity.score} / ${analysis.categoryScores.grammarClarity.maxScore} (${analysis.categoryScores.grammarClarity.percentage}%)`,
      `  Summary: ${analysis.categoryScores.grammarClarity.summary}`,
      "",
      "--------------------------------------------------------------------------------",
      "2. VERIFIED RESUME STRENGTHS",
      "--------------------------------------------------------------------------------",
      ...(analysis.strengths.length
        ? analysis.strengths.map((s: string) => `  [✓] ${s}`)
        : ["  [✓] Standard baseline resume structure detected."]),
      "",
      "--------------------------------------------------------------------------------",
      "3. DETECTED ISSUES & ACTIONABLE FIXES",
      "--------------------------------------------------------------------------------",
    ];

    if (analysis.issues.length === 0) {
      lines.push("  No critical ATS compliance issues detected. Resume is in competitive shape.");
    } else {
      analysis.issues.forEach((iss: any, idx: number) => {
        lines.push(`Issue #${idx + 1} [${iss.severity}]: ${iss.title}`);
        lines.push(`  • Section:    ${iss.affectedSection}`);
        lines.push(`  • Evidence:   ${iss.evidence}`);
        lines.push(`  • Why Matters:${iss.description}`);
        lines.push(`  • How to Fix: ${iss.recommendation}`);
        if (iss.beforeExample && iss.afterExample) {
          lines.push(`    - Before:   "${iss.beforeExample}"`);
          lines.push(`    - After:    "${iss.afterExample}"`);
        }
        lines.push("");
      });
    }

    lines.push(
      "--------------------------------------------------------------------------------",
      "4. STRATEGIC IMPROVEMENT ROADMAP",
      "--------------------------------------------------------------------------------"
    );

    analysis.improvementRoadmap.forEach((item: any) => {
      lines.push(`Priority ${item.priority}: ${item.title}`);
      lines.push(`  • Action: ${item.action}`);
      lines.push("");
    });

    lines.push(
      "================================================================================",
      "Notice: This score is calculated using InterviewAI's calibrated ATS evaluation rubric",
      "based on empirical ATS parsing benchmarks (Taleo, Workday, Greenhouse). It is an",
      "educational diagnostic tool and not an endorsement from any single employer.",
      "================================================================================"
    );

    const reportText = lines.join("\n");
    reply.header("Content-Type", "text/plain; charset=utf-8");
    reply.header("Content-Disposition", `attachment; filename="ATS_Audit_Report_${analysis.fileName.replace(/\.[^/.]+$/, "")}.txt"`);
    return reply.send(reportText);
  }
}
