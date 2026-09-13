import { AIService } from "../../ai/ai.service";
import { InterviewSession, InterviewQuestion } from "./interview.model";

export class QuestionEngine {
  static async generateNextQuestion(sessionId: string) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error("Session not found");

    const previousQuestions = await InterviewQuestion.find({ sessionId }).sort({ questionOrder: 1 });
    
    // Construct prompt based on session profile, role, and history
    const prompt = `You are an AI technical interviewer. The candidate is applying for ${session.role}. 
    Experience: ${session.experienceLevel}.
    Generate the next interview question. Ensure it doesn't repeat previous questions.
    `;

    const nextQText = await AIService.generate([{ role: "user", content: prompt }]);

    const newQuestion = await InterviewQuestion.create({
      sessionId: session._id,
      questionOrder: previousQuestions.length + 1,
      questionText: nextQText,
      category: "technical",
    });

    session.questionCount += 1;
    await session.save();

    return newQuestion;
  }
}
