export class LinkedInMapper {
  /**
   * Map LinkedIn Interviewer STAR output into canonical Interview AI InterviewStory model shape
   */
  public static mapToInterviewStory(data: {
    userId: string;
    title: string;
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
    reflection?: string;
    metrics?: string[];
    role?: string;
    company?: string;
    tags?: string[];
  }) {
    return {
      userId: data.userId,
      title: data.title,
      situation: data.situation || "UNKNOWN",
      task: data.task || "UNKNOWN",
      action: data.action || "UNKNOWN",
      result: data.result || "UNKNOWN",
      reflection: data.reflection || "UNKNOWN",
      situationCompleteness: (data.situation && data.situation !== "UNKNOWN" ? "COMPLETE" : "INCOMPLETE") as "COMPLETE" | "INCOMPLETE",
      taskCompleteness: (data.task && data.task !== "UNKNOWN" ? "COMPLETE" : "INCOMPLETE") as "COMPLETE" | "INCOMPLETE",
      actionCompleteness: (data.action && data.action !== "UNKNOWN" ? "COMPLETE" : "INCOMPLETE") as "COMPLETE" | "INCOMPLETE",
      resultCompleteness: (data.result && data.result !== "UNKNOWN" ? "COMPLETE" : "INCOMPLETE") as "COMPLETE" | "INCOMPLETE",
      tags: data.tags || ["linkedin-interviewer", "career-evidence"],
      origin: "INTERVIEW_ANSWER",
      status: "VERIFIED",
      userVerified: true,
      versions: [
        {
          changedBy: "LINKEDIN_INTERVIEWER",
          changedAt: new Date(),
          changeReason: "Captured via LinkedIn Interviewer Skill",
          data,
        },
      ],
    };
  }

  /**
   * Normalize an Engager profile from Apify/manual data into canonical LinkedInEngager format
   */
  public static mapToEngager(raw: any, userId: string) {
    return {
      userId,
      name: raw.name || raw.authorName || "Unknown Contact",
      headline: raw.headline || raw.authorHeadline || "Unknown Headline",
      profileUrl: raw.profileUrl || raw.url || "https://www.linkedin.com/",
      company: raw.company || "Unknown Company",
      role: raw.role || raw.title || "Unknown Role",
      icpCategory: raw.icpCategory || "PEER",
      relevanceScore: typeof raw.relevanceScore === "number" ? raw.relevanceScore : 70,
      actionRecommendation: raw.actionRecommendation || "Connect and engage on recent post",
      source: "APIFY_ENGAGER_ANALYTICS",
    };
  }
}
