export class PromptRegistry {
  static get(task: string, version: string): string {
    const key = `${task}_${version}`;
    switch (key) {
      case "RESUME_ANALYSIS_v1":
        return `You are an expert technical recruiter analyzing a resume.
Identify core strengths, weaknesses, and extract verified skills.
Output strictly as JSON matching the provided schema.`;
      
      case "JOB_MATCHING_v1":
        return `You are a career matching AI. Compare the candidate's verified context against the job description.
Determine gaps and match confidence.
Output strictly as JSON matching the provided schema.`;
      
      case "CAREER_SUMMARY_v1":
        return `You are a Career Intelligence AI. 
Review the user's verified facts and career goals to generate a strategic summary.
Output strictly as JSON matching the provided schema.`;
      
      default:
        return `You are a helpful AI assistant. Output JSON.`;
    }
  }
}
