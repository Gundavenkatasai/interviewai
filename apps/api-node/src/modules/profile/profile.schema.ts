import { z } from "zod";

export const ProvenanceSchema = z.object({
  sourceType: z.enum(["USER_ENTERED", "RESUME", "LINKEDIN", "GITHUB", "PORTFOLIO", "INTERVIEW", "IMPORT", "AI_SUGGESTED", "SYSTEM_DERIVED"]).optional(),
  sourceId: z.string().optional(),
  confidence: z.number().optional(),
  status: z.enum(["VERIFIED", "USER_PROVIDED", "IMPORTED", "DERIVED", "AI_SUGGESTED", "UNVERIFIED", "REJECTED", "CONFLICT"]).optional(),
  extractedAt: z.string().or(z.date()).optional(),
  verifiedAt: z.string().or(z.date()).optional(),
});

export const UpdateProfileSchema = z.object({
  personal: z.record(z.string(), z.any()).optional(),
  location: z.record(z.string(), z.any()).optional(),
  education: z.array(z.any()).optional(),
  experience: z.array(z.any()).optional(),
  projects: z.array(z.any()).optional(),
  skills: z.array(z.any()).optional(),
  certifications: z.array(z.any()).optional(),
  achievements: z.array(z.any()).optional(),
  preferredRoles: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  preferredSalary: z.record(z.string(), z.any()).optional(),
  preferredWorkMode: z.array(z.string()).optional(),
  employmentPreferences: z.array(z.string()).optional(),
  workAuthorization: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  portfolio: z.string().optional(),
  careerGoals: z.object({
    targetDirections: z.array(z.string()).optional(),
    hardConstraints: z.array(z.string()).optional(),
    preferences: z.array(z.string()).optional()
  }).optional()
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const FactVerificationSchema = z.object({
  entityId: z.string(),
  entityType: z.enum(["experience", "education", "skills", "projects", "certifications"]),
  action: z.enum(["VERIFY", "REJECT"])
});

export const ConflictResolutionSchema = z.object({
  conflictId: z.string(),
  resolutionType: z.enum(["USE_A", "USE_B", "MERGED", "REJECT"]),
  mergedData: z.any().optional()
});
