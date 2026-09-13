export const MATCH_ENGINE_VERSION = "v1.0.0";
export const TRUST_ENGINE_VERSION = "v1.0.0";

// Weights for the deterministic match aggregator
export const MATCH_WEIGHTS = {
  ROLE: 25,
  SKILLS: 40,
  EXPERIENCE: 20,
  LOCATION: 10,
  WORK_MODE: 5,
};

// Trust Engine constants
export const TRUST_WEIGHTS = {
  ATS_DOMAIN: 30,
  EXACT_DATE: 20,
  COMPLETE_JD: 20,
  HAS_SALARY: 10,
  VALID_COMPANY: 20
};
