import { IProfile } from "../profile/profile.model";
import { IJob } from "./jobs.model";
import { MATCH_ENGINE_VERSION, MATCH_WEIGHTS } from "./matching/constants";
import { HardConstraintEngine } from "./matching/hard-constraints.engine";
import { SkillMatchEngine } from "./matching/skill-match.engine";
import { RoleAlignmentEngine } from "./matching/role-alignment.engine";
import { ExperienceEngine } from "./matching/experience.engine";
import { LocationEngine } from "./matching/location.engine";

export class MatchEngine {
  /**
   * Deterministically calculates a match score and breakdown between a candidate and a job.
   */
  static calculateMatch(profile: IProfile, job: Partial<IJob>) {
    if (!profile || !job) {
      throw new Error("Missing profile or job data to compute match.");
    }

    // 1. Hard Constraints
    const constraints = HardConstraintEngine.evaluate(profile, job);
    const blockers = constraints.filter(c => c.status === "BLOCKER");

    if (blockers.length > 0) {
      return {
        matchScore: 0,
        status: "BLOCKER",
        breakdown: {},
        matchedSkills: [],
        missingSkills: [],
        unknownSignals: [],
        hardConstraints: blockers,
        engineVersion: MATCH_ENGINE_VERSION,
        candidateVersion: "v1", // stub
        jobVersion: "v1" // stub
      };
    }

    // 2. Sub-Engines
    const roleResult = RoleAlignmentEngine.evaluate(profile, job);
    const skillResult = SkillMatchEngine.evaluate(profile, job);
    const expResult = ExperienceEngine.evaluate(profile, job);
    const locResult = LocationEngine.evaluate(profile, job);

    // 3. Aggregate Score
    let totalScore = 0;
    let maxPossible = 0;

    // Role
    if (roleResult.alignment !== "UNKNOWN") {
      totalScore += roleResult.score * (MATCH_WEIGHTS.ROLE / 100);
      maxPossible += MATCH_WEIGHTS.ROLE;
    }

    // Skills
    if (skillResult.unknowns.length === 0) {
      totalScore += skillResult.score * (MATCH_WEIGHTS.SKILLS / 100);
      maxPossible += MATCH_WEIGHTS.SKILLS;
    }

    // Experience
    if (expResult.status !== "UNKNOWN") {
      totalScore += expResult.score * (MATCH_WEIGHTS.EXPERIENCE / 100);
      maxPossible += MATCH_WEIGHTS.EXPERIENCE;
    }

    // Location/WorkMode
    if (locResult.status !== "UNKNOWN") {
      totalScore += locResult.score * ((MATCH_WEIGHTS.LOCATION + MATCH_WEIGHTS.WORK_MODE) / 100);
      maxPossible += (MATCH_WEIGHTS.LOCATION + MATCH_WEIGHTS.WORK_MODE);
    }

    // Normalize final score
    let finalScore = maxPossible === 0 ? 50 : Math.round((totalScore / maxPossible) * 100);
    
    // Label
    let status = "WEAK";
    if (finalScore >= 80) status = "STRONG";
    else if (finalScore >= 65) status = "GOOD";
    else if (finalScore >= 50) status = "PARTIAL";

    return {
      matchScore: finalScore,
      status,
      breakdown: {
        role: roleResult,
        skills: { score: skillResult.score },
        experience: expResult,
        location: locResult
      },
      matchedSkills: skillResult.matchedSkills,
      missingSkills: skillResult.missingSkills,
      unknownSignals: [...skillResult.unknowns, 
                       ...(expResult.status === "UNKNOWN" ? ["Experience requirements"] : []),
                       ...(locResult.status === "UNKNOWN" ? ["Location/Work Mode preferences"] : [])],
      hardConstraints: constraints,
      engineVersion: MATCH_ENGINE_VERSION,
      candidateVersion: "v1",
      jobVersion: "v1"
    };
  }
}
