export type CandidateExperienceLevel =
  | "FRESHER"
  | "INTERNSHIP_ONLY"
  | "EXPERIENCED"
  | "MIXED"
  | "UNKNOWN";

export interface ICandidateClassification {
  experienceLevel: CandidateExperienceLevel;
  verifiedEmploymentCount: number;
  verifiedInternshipCount: number;
  projectCount: number;
  educationCount: number;
  statedYearsOfExperience: number;
  classificationConfidence: "HIGH" | "MEDIUM" | "LOW";
  classificationEvidence: string;
  appliedScoringPolicy: string;
}

export class CandidateClassifierService {
  /**
   * Classify candidate experience based strictly on verified resume evidence
   */
  public static classify(
    resumeText: string,
    profileData: any
  ): ICandidateClassification {
    const rawExperience = Array.isArray(profileData?.experience) ? profileData.experience : [];
    const rawInternships = Array.isArray(profileData?.internships) ? profileData.internships : [];
    const rawProjects = Array.isArray(profileData?.projects) ? profileData.projects : [];
    const rawEducation = Array.isArray(profileData?.education) ? profileData.education : [];

    // Filter verified employment records (excluding internships incorrectly placed in experience)
    const verifiedEmployment: any[] = [];
    const detectedInternships: any[] = [...rawInternships];

    rawExperience.forEach((exp: any) => {
      const roleStr = (exp.role || "").toLowerCase();
      const compStr = (exp.company || "").toLowerCase();

      // Check if this experience is actually an internship
      const isInternship =
        roleStr.includes("intern") ||
        roleStr.includes("trainee") ||
        roleStr.includes("fellow") ||
        compStr.includes("internship");

      if (isInternship) {
        detectedInternships.push(exp);
      } else if (
        exp.company &&
        exp.company.trim().length >= 2 &&
        !exp.company.toLowerCase().includes("project") &&
        !exp.company.toLowerCase().includes("academic")
      ) {
        // Must have company and role to be classified as employment
        verifiedEmployment.push(exp);
      }
    });

    // Check stated years of experience in summary or top header
    let statedYears = 0;
    const yearsMatch = resumeText.match(/(\d+)\+?\s*years?(?:\s*of)?\s*(?:professional|industry|software|technical)?\s*experience/i);
    if (yearsMatch) {
      statedYears = parseInt(yearsMatch[1], 10);
    }

    const verifiedEmploymentCount = verifiedEmployment.length;
    const verifiedInternshipCount = detectedInternships.length;
    const projectCount = rawProjects.length;
    const educationCount = rawEducation.length;

    let experienceLevel: CandidateExperienceLevel = "UNKNOWN";
    let classificationConfidence: "HIGH" | "MEDIUM" | "LOW" = "HIGH";
    let classificationEvidence = "";
    let appliedScoringPolicy = "";

    if (verifiedEmploymentCount > 0 && verifiedInternshipCount > 0) {
      experienceLevel = "MIXED";
      classificationEvidence = `Detected ${verifiedEmploymentCount} verified full-time employment position(s) and ${verifiedInternshipCount} internship record(s).`;
      appliedScoringPolicy = "Mixed Career Policy: Professional Experience (8 pts) + Internships (3 pts) + Projects (4 pts).";
    } else if (verifiedEmploymentCount > 0) {
      experienceLevel = "EXPERIENCED";
      classificationEvidence = `Detected ${verifiedEmploymentCount} verified full-time employment position(s).`;
      appliedScoringPolicy = "Experienced Professional Policy: Professional Experience (10 pts) + Key Projects (5 pts).";
    } else if (verifiedInternshipCount > 0) {
      experienceLevel = "INTERNSHIP_ONLY";
      classificationEvidence = `Detected ${verifiedInternshipCount} internship record(s) with 0 full-time employment records.`;
      appliedScoringPolicy = "Internship-Focused Policy: Verified Internships (10 pts) + Technical Projects (5 pts).";
    } else if (projectCount > 0 || educationCount > 0) {
      experienceLevel = "FRESHER";
      classificationEvidence = `Candidate has ${educationCount} education record(s) and ${projectCount} project(s) with 0 verified employment positions.`;
      appliedScoringPolicy = "Fresher Policy: Professional Employment is marked NOT APPLICABLE. Project Quality evaluated independently (15 pts max).";
    } else {
      experienceLevel = "UNKNOWN";
      classificationConfidence = "LOW";
      classificationEvidence = "Insufficient structured evidence detected in resume sections.";
      appliedScoringPolicy = "Baseline General Evaluation Policy.";
    }

    // Sanity check: If candidate explicitly claims 3+ years experience, but 0 employment records were parsed
    if (statedYears >= 3 && verifiedEmploymentCount === 0) {
      classificationConfidence = "MEDIUM";
      classificationEvidence += ` (Warning: Candidate summary mentions ${statedYears}+ years of experience, but 0 structured employment records were extracted).`;
    }

    return {
      experienceLevel,
      verifiedEmploymentCount,
      verifiedInternshipCount,
      projectCount,
      educationCount,
      statedYearsOfExperience: statedYears,
      classificationConfidence,
      classificationEvidence,
      appliedScoringPolicy,
    };
  }
}
