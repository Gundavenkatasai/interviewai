import { IProfile } from "../profile/profile.model";
import { IJob } from "./jobs.model";
import { MATCH_ENGINE_VERSION, MATCH_WEIGHTS } from "./matching/constants";
import { HardConstraintEngine } from "./matching/hard-constraints.engine";
import { SkillMatchEngine } from "./matching/skill-match.engine";
import { RoleAlignmentEngine } from "./matching/role-alignment.engine";
import { ExperienceEngine } from "./matching/experience.engine";
import { LocationEngine } from "./matching/location.engine";

export interface JobMatchResult {
  matchScore: number;
  score: number;
  status: "STRONG" | "GOOD" | "PARTIAL" | "WEAK" | "BLOCKER";
  explanation: string;
  breakdown: {
    technicalSkills: { score: number; weight: number; matched: string[]; missing: string[] };
    requiredQualifications: { score: number; weight: number; details: string };
    projectsAndExperience: { score: number; weight: number; status: string };
    educationAndEligibility: { score: number; weight: number; status: string };
    responsibilitiesAlignment: { score: number; weight: number; status: string };
    locationAndPreferences: { score: number; weight: number; status: string };
    // Backward compatibility
    role?: any;
    skills?: any;
    experience?: any;
    location?: any;
  };
  matchedSkills: string[];
  partiallyMatchedSkills: string[];
  missingSkills: string[];
  unknownSignals: string[];
  hardConstraints: any[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  educationCompatibility: "MEETS" | "PARTIAL" | "NOT_SPECIFIED" | "BELOW_REQUIREMENT";
  experienceCompatibility: "MEETS" | "EXCEEDS" | "ENTRY_LEVEL_COMPATIBLE" | "BELOW_REQUIREMENT";
  locationCompatibility: "COMPATIBLE" | "REMOTE_MATCH" | "RELOCATION_NEEDED" | "UNKNOWN";
  engineVersion: string;
  candidateVersion: string;
  jobVersion: string;
}

export class MatchEngine {
  /**
   * Deterministically calculates an explainable match score and detailed breakdown
   * between a candidate profile and an exact job description.
   *
   * Scoring weights:
   * 1. Technical Skills: 30%
   * 2. Required Qualifications: 20%
   * 3. Relevant Projects & Experience: 20%
   * 4. Education & Eligibility: 10%
   * 5. Responsibilities Alignment: 10%
   * 6. Location & Job Preferences: 10%
   * Total: 100%
   */
  static calculateMatch(profile: IProfile, job: Partial<IJob>): JobMatchResult {
    if (!profile || !job) {
      throw new Error("Missing profile or job data to compute match.");
    }

    // 1. Hard Constraints check
    const constraints = HardConstraintEngine.evaluate(profile, job);
    const blockers = constraints.filter(c => c.status === "BLOCKER");

    if (blockers.length > 0) {
      return {
        matchScore: 0,
        score: 0,
        status: "BLOCKER",
        explanation: `Application blocked by eligibility criteria: ${blockers.map(b => b.reason || b.field).join("; ")}`,
        breakdown: {
          technicalSkills: { score: 0, weight: MATCH_WEIGHTS.TECHNICAL_SKILLS, matched: [], missing: [] },
          requiredQualifications: { score: 0, weight: MATCH_WEIGHTS.REQUIRED_QUALIFICATIONS, details: "Blocked by mandatory constraint" },
          projectsAndExperience: { score: 0, weight: MATCH_WEIGHTS.PROJECTS_AND_EXPERIENCE, status: "BLOCKED" },
          educationAndEligibility: { score: 0, weight: MATCH_WEIGHTS.EDUCATION_AND_ELIGIBILITY, status: "BLOCKED" },
          responsibilitiesAlignment: { score: 0, weight: MATCH_WEIGHTS.RESPONSIBILITIES_ALIGNMENT, status: "BLOCKED" },
          locationAndPreferences: { score: 0, weight: MATCH_WEIGHTS.LOCATION_AND_PREFERENCES, status: "BLOCKED" },
        },
        matchedSkills: [],
        partiallyMatchedSkills: [],
        missingSkills: (job.skills || []).filter((s): s is string => typeof s === "string"),
        unknownSignals: [],
        hardConstraints: blockers,
        strengths: [],
        weaknesses: blockers.map(b => String(b.reason || b.field || "Mandatory blocker")),
        recommendations: ["Review mandatory eligibility criteria before submitting an application."],
        educationCompatibility: "BELOW_REQUIREMENT",
        experienceCompatibility: "BELOW_REQUIREMENT",
        locationCompatibility: "UNKNOWN",
        engineVersion: MATCH_ENGINE_VERSION,
        candidateVersion: "v2",
        jobVersion: "v2",
      };
    }

    // 2. Evaluate Dimension Sub-Engines
    const skillResult = SkillMatchEngine.evaluate(profile, job);
    const roleResult = RoleAlignmentEngine.evaluate(profile, job);
    const expResult = ExperienceEngine.evaluate(profile, job);
    const locResult = LocationEngine.evaluate(profile, job);

    // 3. Education & Eligibility evaluation
    let eduScore = 80; // default baseline
    let eduCompatibility: JobMatchResult["educationCompatibility"] = "NOT_SPECIFIED";

    const candidateEducation = profile.education || [];
    const hasDegree = candidateEducation.length > 0;
    const requiredEducation = ((job as any).education_requirements || (job as any).educationRequirements || (job as any).education || "").toLowerCase();

    if (requiredEducation) {
      if (hasDegree) {
        eduScore = 95;
        eduCompatibility = "MEETS";
      } else {
        eduScore = 50;
        eduCompatibility = "BELOW_REQUIREMENT";
      }
    } else if (hasDegree) {
      eduScore = 90;
      eduCompatibility = "MEETS";
    }

    // 4. Responsibilities Alignment
    let respScore = 75;
    const desc = (job.description || "").toLowerCase();
    const candidateExperience = profile.experience || [];
    const candidateProjects = profile.projects || [];

    // Check project tech overlap with description
    const matchedSkills = skillResult.matchedSkills || [];
    const missingSkills = skillResult.missingSkills || [];
    const partiallyMatchedSkills: string[] = [];

    let projectEvidenceCount = 0;
    for (const proj of candidateProjects) {
      const projTech = (proj.technologies || []).map(t => t.toLowerCase());
      if (projTech.some(t => matchedSkills.map(s => s.toLowerCase()).includes(t))) {
        projectEvidenceCount++;
      }
    }

    if (projectEvidenceCount > 0 || candidateExperience.length > 0) {
      respScore = Math.min(100, 70 + (projectEvidenceCount * 10) + (candidateExperience.length * 5));
    }

    // 5. Aggregate 6-Dimensional Score
    const techSkillWeight = MATCH_WEIGHTS.TECHNICAL_SKILLS / 100;
    const qualWeight = MATCH_WEIGHTS.REQUIRED_QUALIFICATIONS / 100;
    const expWeight = MATCH_WEIGHTS.PROJECTS_AND_EXPERIENCE / 100;
    const eduWeight = MATCH_WEIGHTS.EDUCATION_AND_ELIGIBILITY / 100;
    const respWeight = MATCH_WEIGHTS.RESPONSIBILITIES_ALIGNMENT / 100;
    const locWeight = MATCH_WEIGHTS.LOCATION_AND_PREFERENCES / 100;

    const weightedScore =
      (skillResult.score * techSkillWeight) +
      (roleResult.score * qualWeight) +
      (expResult.score * expWeight) +
      (eduScore * eduWeight) +
      (respScore * respWeight) +
      (locResult.score * locWeight);

    const finalScore = Math.round(Math.max(0, Math.min(100, weightedScore)));

    // 6. Qualitative Status Tier
    let status: JobMatchResult["status"] = "WEAK";
    if (finalScore >= 80) status = "STRONG";
    else if (finalScore >= 65) status = "GOOD";
    else if (finalScore >= 50) status = "PARTIAL";

    // 7. Strengths & Weaknesses compilation
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    if (matchedSkills.length > 0) {
      strengths.push(`Direct alignment on ${matchedSkills.length} key technical competencies: ${matchedSkills.slice(0, 4).join(", ")}.`);
    }
    if (expResult.score >= 80) {
      strengths.push("Candidate experience level matches or exceeds the stated requirement.");
    }
    if (eduScore >= 80) {
      strengths.push("Academic background meets stated education expectations.");
    }
    if (locResult.score >= 90) {
      strengths.push("Work arrangement and location directly match candidate preferences.");
    }

    if (missingSkills.length > 0) {
      weaknesses.push(`Missing key target requirements: ${missingSkills.slice(0, 4).join(", ")}.`);
      recommendations.push(`Familiarize yourself with ${missingSkills.slice(0, 3).join(", ")} prior to technical interview rounds.`);
    }
    if (expResult.score < 60) {
      weaknesses.push("Experience gap: position may expect additional verified domain tenure.");
      recommendations.push("Emphasize relevant project architecture and problem-solving ownership to offset tenure gap.");
    }
    if (locResult.score < 60) {
      weaknesses.push("Location mismatch: position is located outside preferred geography.");
    }

    if (recommendations.length === 0) {
      recommendations.push("Strong baseline profile. Practice JD-specific mock technical interview rounds to test live delivery.");
    }

    // 8. Experience & Location Compatibility
    let expCompatibility: JobMatchResult["experienceCompatibility"] = "ENTRY_LEVEL_COMPATIBLE";
    if (expResult.score >= 90) expCompatibility = "EXCEEDS";
    else if (expResult.score >= 70) expCompatibility = "MEETS";
    else if (expResult.score < 50) expCompatibility = "BELOW_REQUIREMENT";

    let locCompatibility: JobMatchResult["locationCompatibility"] = "COMPATIBLE";
    if (locResult.status === "UNKNOWN") locCompatibility = "UNKNOWN";
    else if (locResult.score < 60) locCompatibility = "RELOCATION_NEEDED";
    else if (((job as any).workMode || (job as any).work_mode || "").toLowerCase() === "remote") locCompatibility = "REMOTE_MATCH";

    const explanation = matchedSkills.length > 0
      ? `InterviewAI Match Score: ${finalScore}/100. Matched skills: ${matchedSkills.slice(0, 5).join(", ")}.`
      : `InterviewAI Match Score: ${finalScore}/100 based on role requirements and background profile.`;

    return {
      matchScore: finalScore,
      score: finalScore,
      status,
      explanation,
      breakdown: {
        technicalSkills: {
          score: skillResult.score,
          weight: MATCH_WEIGHTS.TECHNICAL_SKILLS,
          matched: matchedSkills,
          missing: missingSkills,
        },
        requiredQualifications: {
          score: roleResult.score,
          weight: MATCH_WEIGHTS.REQUIRED_QUALIFICATIONS,
          details: (roleResult as any).details || (roleResult as any).alignment || "Role alignment evaluated",
        },
        projectsAndExperience: {
          score: expResult.score,
          weight: MATCH_WEIGHTS.PROJECTS_AND_EXPERIENCE,
          status: expResult.status,
        },
        educationAndEligibility: {
          score: eduScore,
          weight: MATCH_WEIGHTS.EDUCATION_AND_ELIGIBILITY,
          status: eduCompatibility,
        },
        responsibilitiesAlignment: {
          score: respScore,
          weight: MATCH_WEIGHTS.RESPONSIBILITIES_ALIGNMENT,
          status: "EVALUATED",
        },
        locationAndPreferences: {
          score: locResult.score,
          weight: MATCH_WEIGHTS.LOCATION_AND_PREFERENCES,
          status: locCompatibility,
        },
        // Backward compatibility
        role: roleResult,
        skills: { score: skillResult.score },
        experience: expResult,
        location: locResult,
      },
      matchedSkills,
      partiallyMatchedSkills,
      missingSkills,
      unknownSignals: [
        ...skillResult.unknowns,
        ...(expResult.status === "UNKNOWN" ? ["Experience requirements"] : []),
        ...(locResult.status === "UNKNOWN" ? ["Location/Work Mode preferences"] : []),
      ],
      hardConstraints: constraints,
      strengths,
      weaknesses,
      recommendations,
      educationCompatibility: eduCompatibility,
      experienceCompatibility: expCompatibility,
      locationCompatibility: locCompatibility,
      engineVersion: MATCH_ENGINE_VERSION,
      candidateVersion: "v2",
      jobVersion: "v2",
    };
  }
}
