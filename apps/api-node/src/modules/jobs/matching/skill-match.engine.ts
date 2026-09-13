import { IProfile } from "../../profile/profile.model";
import { IJob } from "../jobs.model";

export interface SkillMatchResult {
  score: number; // 0-100
  matchedSkills: string[];
  missingSkills: string[];
  unknowns: string[];
}

export class SkillMatchEngine {
  static evaluate(candidate: IProfile, job: Partial<IJob>): SkillMatchResult {
    // Basic heuristic: Extract skills from job description if skillsNormalized is empty
    let jobSkills: string[] = job.skillsNormalized || [];
    
    if (jobSkills.length === 0 && job.description) {
      // Very basic keyword extraction fallback (In a real system, use an NLP service or the LLM ingestion output)
      const commonTech = ["python", "java", "react", "node", "aws", "docker", "kubernetes", "typescript", "javascript", "sql", "mongodb", "fastapi", "golang", "c++", "c#", "azure", "gcp"];
      const descLower = job.description.toLowerCase();
      jobSkills = commonTech.filter(tech => descLower.includes(tech));
    }

    if (jobSkills.length === 0) {
      return { score: 100, matchedSkills: [], missingSkills: [], unknowns: ["Job skills not specified"] }; // Can't penalize if we don't know
    }

    // Extract candidate verified skills
    const candidateSkills = (candidate.skills || [])
      // Favor verified/user_provided over ai_suggested for strong match, but we'll include all for now 
      // and weight them if needed. For this MVP, we treat them all as strings.
      .map(s => s.name.toLowerCase());

    const matched: string[] = [];
    const missing: string[] = [];

    for (const req of jobSkills) {
      if (candidateSkills.includes(req.toLowerCase())) {
        matched.push(req);
      } else {
        missing.push(req);
      }
    }

    const score = jobSkills.length > 0 ? (matched.length / jobSkills.length) * 100 : 100;

    return {
      score: Math.round(score),
      matchedSkills: matched,
      missingSkills: missing,
      unknowns: []
    };
  }
}
