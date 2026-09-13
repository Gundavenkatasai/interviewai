import { InterviewStory, IInterviewStory } from "./story.model";
import { AIService } from "../../ai/ai.service";
import { STORY_EXTRACTION_PROMPT, StoryExtractionSchema } from "../../ai/prompts/story.prompts";
import { Profile } from "../profile/profile.model";

export class StoryEngine {
  /**
   * Extract a STAR story from raw evidence text (e.g. a resume bullet).
   */
  static async extractStory(userId: string, evidenceText: string, sourceEvidenceId?: string): Promise<IInterviewStory> {
    const promptText = STORY_EXTRACTION_PROMPT.replace("{{text}}", evidenceText);

    const aiResult = await AIService.generateStructured<any>(
      [{ role: "user", content: promptText }],
      StoryExtractionSchema,
      {
        task: "INTERVIEW_STORY_EXTRACTION",
        temperature: 0.1
      }
    );

    // Calculate deterministic quality score
    let score = 0;
    if (aiResult.situationCompleteness === "COMPLETE") score += 20;
    if (aiResult.taskCompleteness === "COMPLETE") score += 20;
    if (aiResult.actionCompleteness === "COMPLETE") score += 40;
    if (aiResult.resultCompleteness === "COMPLETE") score += 20;

    // Partial scores
    if (aiResult.situationCompleteness === "PARTIAL") score += 10;
    if (aiResult.taskCompleteness === "PARTIAL") score += 10;
    if (aiResult.actionCompleteness === "PARTIAL") score += 20;
    if (aiResult.resultCompleteness === "PARTIAL") score += 10;

    const story = new InterviewStory({
      userId,
      title: aiResult.title,
      sourceEvidenceIds: sourceEvidenceId ? [sourceEvidenceId] : [],
      
      situation: aiResult.situation,
      task: aiResult.task,
      action: aiResult.action,
      result: aiResult.result,
      reflection: aiResult.reflection,

      situationCompleteness: aiResult.situationCompleteness,
      taskCompleteness: aiResult.taskCompleteness,
      actionCompleteness: aiResult.actionCompleteness,
      resultCompleteness: aiResult.resultCompleteness,

      tags: aiResult.tags,
      competencyIds: aiResult.competencyIds,
      
      qualityScore: score,
      status: score >= 80 ? "AI_DRAFTED" : "NEEDS_USER_INPUT",
      origin: "RESUME"
    });

    await story.save();
    return story;
  }

  /**
   * Deterministic matching of a question to a story
   */
  static async matchStoryToQuestion(userId: string, questionText: string, questionCompetency: string): Promise<IInterviewStory | null> {
    // 1. Fetch all stories for user
    const stories = await InterviewStory.find({ userId, status: { $in: ["USER_REVIEWED", "VERIFIED", "AI_DRAFTED"] } });
    
    if (!stories.length) return null;

    const normalizedQuestion = questionText.toLowerCase();

    // 2. Score each story
    const scoredStories = stories.map(story => {
      let matchScore = 0;

      // Primary heuristic: Competency match
      if (story.competencyIds.includes(questionCompetency)) {
        matchScore += 50;
      }

      // Secondary heuristic: Tag overlap in question text
      for (const tag of story.tags) {
        if (normalizedQuestion.includes(tag.toLowerCase())) {
          matchScore += 10;
        }
      }

      // Tertiary heuristic: Story Quality
      matchScore += (story.qualityScore * 0.2); // Up to 20 points for quality

      // Penalty for overused stories
      if (story.timesUsed > 3) {
        matchScore -= (story.timesUsed * 2);
      }

      return { story, matchScore };
    });

    // 3. Sort by score
    scoredStories.sort((a, b) => b.matchScore - a.matchScore);

    // Return the best match if score > threshold
    if (scoredStories[0].matchScore >= 40) {
      return scoredStories[0].story;
    }

    return null;
  }
}
