import { AIService } from "../../ai/ai.service";
import { z } from "zod";

const ValidationResponseSchema = z.object({
  status: z.enum(["SUPPORTED", "UNSUPPORTED", "AMBIGUOUS", "NEEDS_USER_REVIEW"]),
  reasoning: z.string(),
  flaggedClaims: z.array(z.string()).optional()
});

export class ClaimValidatorEngine {
  
  static async validate(draftBody: string, contextSources: { resume?: string, job?: string, interview?: string }) {
    const prompt = `
You are a strict Claim Validator for career communications.
Your job is to ensure the draft email/message DOES NOT contain fabricated claims.

Context Available:
Resume summary: ${contextSources.resume || "None"}
Job info: ${contextSources.job || "None"}
Interview info: ${contextSources.interview || "None"}

Draft to evaluate:
"""
${draftBody}
"""

Evaluate the draft for the following:
1. Does it claim experience, skills, or metrics not present in the Resume context?
2. Does it claim to have discussed topics not present in the Interview context?
3. Does it make exaggerated claims about the candidate's fit for the Job context?

Return a JSON object exactly matching:
{
  "status": "SUPPORTED" | "UNSUPPORTED" | "AMBIGUOUS" | "NEEDS_USER_REVIEW",
  "reasoning": "brief explanation",
  "flaggedClaims": ["claim 1", "claim 2"]
}
`;

    const systemInstruction = "You are a strict validation engine. Output ONLY valid JSON.";

    try {
      const rawResult = await AIService.generate([
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ]);

      const start = rawResult.indexOf("{");
      const end = rawResult.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        const jsonStr = rawResult.substring(start, end + 1);
        const parsed = JSON.parse(jsonStr);
        return ValidationResponseSchema.parse(parsed);
      }
    } catch (err) {
      console.error("Validation failed", err);
    }
    
    // Default to safe if AI fails
    return {
      status: "NEEDS_USER_REVIEW",
      reasoning: "Validation engine unavailable, human review required."
    };
  }

}
