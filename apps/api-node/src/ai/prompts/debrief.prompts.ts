import { z } from "zod";

export const AnswerDebriefSchema = z.object({
  score: z.number().min(0).max(10).describe("Score from 0 to 10 based on structure and correctness"),
  strengths: z.array(z.string()).describe("Specific strong elements of the candidate's answer"),
  weaknesses: z.array(z.string()).describe("Specific weaknesses or missing elements"),
  missingElements: z.array(z.string()).describe("What should have been included but wasn't (e.g. 'Did not specify outcome')"),
  suggestedImprovement: z.string().describe("A concise, actionable recommendation to improve this specific answer next time")
});

export const InterviewDebriefResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  whatWentWell: z.array(z.string()).describe("Top 2-3 overall themes the candidate did well"),
  whatToImprove: z.array(z.string()).describe("Top 2-3 overall themes the candidate must improve"),
  questionReviews: z.array(z.object({
    questionId: z.string(),
    review: AnswerDebriefSchema
  })),
  nextPracticeItems: z.array(z.object({
    why: z.string(),
    action: z.string(),
    priority: z.enum(["CRITICAL", "HIGH", "MEDIUM"])
  }))
});

export const INTERVIEW_DEBRIEF_PROMPT = `
You are an expert technical interviewer evaluating a completed interview session.

IMPORTANT RULES:
1. NO PSYCHOANALYSIS: Do not judge the candidate's personality (e.g. "You sounded nervous"). Evaluate the content and structure of their answers.
2. NO HALLUCINATION: Base your feedback entirely on the provided transcript and answer data. Do not invent missing facts.
3. BE CONCRETE: "Add the specific scale of your API requests" is better than "Be more specific."

INPUTS:
---
Target Role: {{targetRole}}
Interview Type: {{interviewType}}

QUESTIONS & ANSWERS (Reference Data):
{{qnaData}}
---

TASK:
Generate a structured, constructive debrief for this interview. Evaluate each question individually and then provide a summarized overall performance review and actionable next steps.
`;
