import { AIService } from "../../ai/ai.service";
import { AIContextEngine } from "../../ai/context.engine";
import { Profile } from "../profile/profile.model";
import { Job } from "../jobs/jobs.model";
import { InterviewSession } from "../interview/interview.model";
import { CareerContact } from "./contact.model";
import { z } from "zod";

const DraftResponseSchema = z.object({
  subject: z.string(),
  body: z.string(),
  metadata: z.object({
    tone: z.string(),
    primaryReference: z.string().optional()
  })
});

export class CommunicationEngine {
  
  static async generateDraft(params: {
    userId: string;
    type: string;
    tone: string;
    jobId?: string;
    interviewId?: string;
    contactId?: string;
  }) {
    const { userId, type, tone, jobId, interviewId, contactId } = params;

    const profile = await Profile.findOne({ userId });
    let jobContext = "";
    if (jobId) {
      const job = await Job.findOne({ _id: jobId, userId });
      if (job) jobContext = AIContextEngine.buildJobContext(job);
    }

    let interviewContext = "";
    if (interviewId) {
      const interview = await InterviewSession.findOne({ _id: interviewId, userId });
      if (interview) {
        interviewContext = `Interview completed for role ${interview.role}. Topics included ${interview.technologies.join(", ")}.`;
      }
    }

    let contactContext = "";
    if (contactId) {
      const contact = await CareerContact.findOne({ _id: contactId, userId });
      if (contact) {
        contactContext = `Recipient: ${contact.name || contact.firstName || "Hiring Team"} (${contact.relationshipType})`;
      }
    }

    const candidateContext = profile ? `Candidate: ${profile.personal?.fullName || "Candidate"}. Skills: ${profile.skills?.join(", ")}` : "Candidate";

    const prompt = `
You are an expert career strategist generating a draft for a ${type.replace("_", " ")}.
Tone: ${tone}

Context about candidate:
${candidateContext}

Context about job:
${jobContext}

Context about contact:
${contactContext}

Context about interview:
${interviewContext}

Instructions:
1. Write a professional, personalized message.
2. If this is an INTERVIEW_THANK_YOU, specifically reference the topics discussed in the interview.
3. Be concise and actionable.
4. DO NOT invent skills, facts, or claims that are not in the provided context.
5. Return output as a JSON object matching the provided schema.
`;

    // Make an AI call using JSON output mode
    const systemInstruction = "You are a communication drafting engine. Return exactly matching the JSON schema: { subject: string, body: string, metadata: { tone: string, primaryReference?: string } }";
    
    let rawResult = "";
    try {
      rawResult = await AIService.generate([
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ]);
      
      // Attempt to parse json
      const start = rawResult.indexOf("{");
      const end = rawResult.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        const jsonStr = rawResult.substring(start, end + 1);
        const parsed = JSON.parse(jsonStr);
        const validated = DraftResponseSchema.parse(parsed);
        return { success: true, draft: validated };
      }
    } catch (err) {
      console.error("AI Generation Failed:", err);
    }

    // Fallback if AI fails or formatting fails
    const fallbackDraft = this.getFallbackDraft(type, profile, contactContext, interviewContext);
    return { success: true, draft: fallbackDraft };
  }

  private static getFallbackDraft(type: string, profile: any, contact: string, interview: string) {
    const candidateName = profile?.personal?.fullName || "Candidate";
    if (type === "INTERVIEW_THANK_YOU") {
      return {
        subject: "Thank you for the interview",
        body: `Hi there,\n\nThank you for taking the time to speak with me today. I really enjoyed our conversation about the role and am very excited about the opportunity to join the team.\n\nPlease let me know if you need any additional information from me.\n\nBest,\n${candidateName}`,
        metadata: { tone: "professional" }
      };
    }
    
    return {
      subject: "Following up on my application",
      body: `Hello,\n\nI am writing to follow up on my recent application. I remain very interested in the position and would welcome the chance to discuss how my background aligns with your team's goals.\n\nBest,\n${candidateName}`,
      metadata: { tone: "professional" }
    };
  }

}
