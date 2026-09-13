import crypto from "crypto";
import { Job } from "../jobs/jobs.model";
import { Resume, ResumeVersion } from "../resume/resume.model";
import { InterviewIntelligence, IInterviewIntelligence, IPrepPriority } from "./intelligence.model";
import { AIService } from "../../ai/ai.service";
import { InterviewIntelligenceResultSchema, INTERVIEW_INTELLIGENCE_PROMPT } from "../../ai/prompts/intelligence.prompts";

export class IntelligenceEngine {
  
  static generateFingerprint(jobSnapshotId: string, resumeVersionId: string, interviewType: string): string {
    const data = `${jobSnapshotId}:${resumeVersionId}:${interviewType}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  static calculateReadiness(topics: any[], gaps: string[]): { score: number, breakdown: any, state: string } {
    let technicalScore = 100;
    let behavioralScore = 100;
    let resumeDefensibility = 100;
    let roleUnderstanding = 100;

    // Penalty for weak topics
    for (const t of topics) {
      if (t.candidateStrength === "WEAK") {
        if (t.category === "TECHNICAL") technicalScore -= 15;
        if (t.category === "BEHAVIORAL") behavioralScore -= 15;
      }
      if (t.candidateStrength === "UNKNOWN") {
        if (t.category === "TECHNICAL") technicalScore -= 10;
        if (t.category === "BEHAVIORAL") behavioralScore -= 10;
      }
    }

    // Penalty for gaps
    resumeDefensibility -= (gaps.length * 10);

    // Floor at 0
    technicalScore = Math.max(0, technicalScore);
    behavioralScore = Math.max(0, behavioralScore);
    resumeDefensibility = Math.max(0, resumeDefensibility);
    roleUnderstanding = Math.max(0, 100 - (gaps.length * 5));

    const totalScore = Math.round((technicalScore * 0.4) + (behavioralScore * 0.3) + (resumeDefensibility * 0.2) + (roleUnderstanding * 0.1));

    let state = "UNKNOWN";
    if (totalScore >= 90) state = "STRONGLY_READY";
    else if (totalScore >= 75) state = "READY";
    else if (totalScore >= 60) state = "PARTIALLY_READY";
    else if (totalScore >= 40) state = "NEEDS_PREPARATION";
    else state = "NOT_READY";

    return {
      score: totalScore,
      breakdown: {
        technical: technicalScore,
        behavioral: behavioralScore,
        resumeDefensibility,
        roleUnderstanding,
        evidenceCoverage: 100
      },
      state
    };
  }

  static generatePriorities(topics: any[], questions: any[], cheatSheet: any): IPrepPriority[] {
    const priorities: IPrepPriority[] = [];

    // Top weak topics
    const weakTopics = topics.filter(t => t.candidateStrength === "WEAK" || t.candidateStrength === "UNKNOWN");
    for (const t of weakTopics) {
      priorities.push({
        priorityLevel: t.importance === "HIGH" ? "CRITICAL" : "HIGH",
        reason: `Your strength in ${t.topic} is marked as ${t.candidateStrength.toLowerCase()}, but it is a ${t.importance.toLowerCase()} importance topic.`,
        recommendedAction: `Review ${t.topic} fundamentals and practice 2 questions.`,
        sourceType: "GAP",
        evidenceIds: t.evidenceIds || [],
        estimatedMinutes: 20
      });
    }

    // Top claims to defend
    if (cheatSheet?.resumeClaims?.length > 0) {
      priorities.push({
        priorityLevel: "HIGH",
        reason: "You have strong claims on your resume that will likely be probed.",
        recommendedAction: "Prepare STAR stories for your key resume claims.",
        sourceType: "RESUME",
        evidenceIds: [],
        estimatedMinutes: 15
      });
    }

    // High priority questions
    const topQuestions = questions.filter(q => q.priority === "CRITICAL" || q.priority === "HIGH").slice(0, 3);
    for (const q of topQuestions) {
      priorities.push({
        priorityLevel: q.priority,
        reason: q.whyLikely,
        recommendedAction: "Practice answering this question out loud.",
        sourceType: "JD",
        evidenceIds: q.evidenceIds || [],
        estimatedMinutes: 10
      });
    }

    // Deduplicate and sort
    return priorities.sort((a, b) => {
      const order = { "CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3 };
      return order[a.priorityLevel] - order[b.priorityLevel];
    });
  }

  static async generateIntelligence(
    userId: string,
    jobId: string,
    resumeVersionId: string,
    interviewType: string = "GENERAL"
  ): Promise<IInterviewIntelligence> {
    const job = await Job.findOne({ _id: jobId, userId });
    if (!job) throw new Error("Job not found or access denied");

    const resumeVersion = await ResumeVersion.findOne({ _id: resumeVersionId, userId });
    if (!resumeVersion) throw new Error("Resume Version not found or access denied");

    const resume = await Resume.findOne({ _id: resumeVersion.resumeId, userId });
    if (!resume) throw new Error("Resume not found or access denied");

    const inputFingerprint = this.generateFingerprint(job._id.toString(), resumeVersion._id.toString(), interviewType);

    // Idempotency Check
    let intel = await InterviewIntelligence.findOne({ inputFingerprint });
    if (intel && (intel.status === "COMPLETED" || intel.status === "GENERATING")) {
      return intel;
    }

    if (!intel) {
      intel = new InterviewIntelligence({
        userId,
        jobId: job._id,
        jobSnapshotId: job._id, // Ideally a snapshot, using live job for simplicity if snapshot unsupported in schema currently
        resumeVersionId,
        interviewType,
        targetRole: job.title,
        seniority: job.seniority || "Unknown",
        inputFingerprint,
        status: "GENERATING"
      });
      await intel.save();
    } else {
      intel.status = "GENERATING";
      await intel.save();
    }

    try {
      // Prepare Inputs for AI
      const jobDescription = [job.title, job.description, ...(job.skills || [])].join("\n");
      const resumeText = JSON.stringify(resume.profileData);

      const promptText = INTERVIEW_INTELLIGENCE_PROMPT
        .replace("{{targetRole}}", job.title)
        .replace("{{seniority}}", job.seniority || "Unknown")
        .replace("{{interviewType}}", interviewType)
        .replace("{{jobDescription}}", jobDescription)
        .replace("{{resumeText}}", resumeText);

      // Call AIService with structured output
      const aiResponse = await AIService.generateStructured<any>(
        [{ role: "user", content: promptText }],
        InterviewIntelligenceResultSchema,
        {
          task: "INTERVIEW_INTELLIGENCE",
          temperature: 0.3
        }
      );

      // Deterministic Scoring
      const readiness = this.calculateReadiness(aiResponse.topics, aiResponse.cheatSheet.gaps);
      const priorities = this.generatePriorities(aiResponse.topics, aiResponse.likelyQuestions, aiResponse.cheatSheet);

      // Deduplicate questions deterministically
      const seenQuestions = new Set();
      const uniqueQuestions = aiResponse.likelyQuestions.filter((q: any) => {
        const normalized = q.question.toLowerCase().trim();
        if (seenQuestions.has(normalized)) return false;
        seenQuestions.add(normalized);
        return true;
      });

      // Update Intelligence Doc
      intel.topics = aiResponse.topics;
      intel.likelyQuestions = uniqueQuestions;
      intel.interviewerQuestions = aiResponse.interviewerQuestions;
      intel.cheatSheet = aiResponse.cheatSheet;
      intel.priorities = priorities;
      intel.readinessScore = readiness.score;
      intel.readinessState = readiness.state as any;
      intel.readinessBreakdown = readiness.breakdown;
      intel.status = "COMPLETED";

      await intel.save();
      return intel;

    } catch (error: any) {
      intel.status = "FAILED";
      intel.error = { message: error.message };
      await intel.save();
      throw error;
    }
  }
}
