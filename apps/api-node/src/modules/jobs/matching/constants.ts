export const MATCH_ENGINE_VERSION = "v2.0.0";
export const TRUST_ENGINE_VERSION = "v1.0.0";

// Six configurable scoring dimensions (as specified in Master Build Requirements: 30%, 20%, 20%, 10%, 10%, 10% = 100%)
export const MATCH_WEIGHTS = {
  TECHNICAL_SKILLS: 30,
  REQUIRED_QUALIFICATIONS: 20,
  PROJECTS_AND_EXPERIENCE: 20,
  EDUCATION_AND_ELIGIBILITY: 10,
  RESPONSIBILITIES_ALIGNMENT: 10,
  LOCATION_AND_PREFERENCES: 10,

  // Backward-compatible aliases for legacy callers
  SKILLS: 30,
  ROLE: 20,
  EXPERIENCE: 20,
  LOCATION: 10,
  WORK_MODE: 0,
};

// Trust Engine constants
export const TRUST_WEIGHTS = {
  ATS_DOMAIN: 30,
  EXACT_DATE: 20,
  COMPLETE_JD: 20,
  HAS_SALARY: 10,
  VALID_COMPANY: 20
};
