import { z } from "zod";

export const ResumeBasicsSchema = z.object({
  name: z.string().min(1),
  professionalTitle: z.string().optional().default(""),
  email: z.string().email().or(z.literal("")),
  phone: z.string().optional().default(""),
  location: z.string().optional().default(""),
  links: z.array(z.object({
    label: z.string(),
    url: z.string()
  })).optional().default([])
});

export const ResumeSkillCategorySchema = z.object({
  category: z.string(),
  items: z.array(z.string())
});

export const ResumeExperienceItemSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default("Present"),
  current: z.boolean().optional().default(false),
  bullets: z.array(z.string()).default([])
});

export const ResumeProjectItemSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional().default("Developer"),
  technologies: z.array(z.string()).default([]),
  description: z.string().optional().default(""),
  bullets: z.array(z.string()).default([]),
  githubUrl: z.string().optional(),
  liveUrl: z.string().optional(),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default("")
});

export const ResumeEducationItemSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  fieldOfStudy: z.string().optional().default(""),
  location: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  gpa: z.string().optional().default(""),
  coursework: z.array(z.string()).optional().default([])
});

export const ResumeCertificationItemSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().min(1),
  date: z.string().optional().default(""),
  url: z.string().optional()
});

export const ResumeAchievementItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
  date: z.string().optional().default("")
});

export const ResumeTrainingItemSchema = z.object({
  title: z.string().min(1),
  bullets: z.array(z.string()).default([])
});

export const ResumePublicationItemSchema = z.object({
  title: z.string().min(1),
  publisher: z.string().optional().default(""),
  date: z.string().optional().default(""),
  url: z.string().optional()
});

export const ResumeLanguageItemSchema = z.object({
  language: z.string().min(1),
  proficiency: z.string().optional().default("Professional")
});

export const ResumeCustomSectionSchema = z.object({
  title: z.string().min(1),
  items: z.array(z.string()).default([])
});

export const StructuredResumeSchema = z.object({
  basics: ResumeBasicsSchema,
  summary: z.string().optional().default(""),
  skills: z.array(ResumeSkillCategorySchema).default([]),
  experience: z.array(ResumeExperienceItemSchema).default([]),
  internships: z.array(ResumeExperienceItemSchema).optional().default([]),
  projects: z.array(ResumeProjectItemSchema).default([]),
  education: z.array(ResumeEducationItemSchema).default([]),
  certifications: z.array(ResumeCertificationItemSchema).optional().default([]),
  achievements: z.array(ResumeAchievementItemSchema).optional().default([]),
  training: z.array(ResumeTrainingItemSchema).optional().default([]),
  publications: z.array(ResumePublicationItemSchema).optional().default([]),
  languages: z.array(ResumeLanguageItemSchema).optional().default([]),
  customSections: z.array(ResumeCustomSectionSchema).optional().default([])
});

export type IStructuredResume = z.infer<typeof StructuredResumeSchema>;
export type IResumeBasics = z.infer<typeof ResumeBasicsSchema>;
export type IResumeSkillCategory = z.infer<typeof ResumeSkillCategorySchema>;
export type IResumeExperienceItem = z.infer<typeof ResumeExperienceItemSchema>;
export type IResumeProjectItem = z.infer<typeof ResumeProjectItemSchema>;
export type IResumeEducationItem = z.infer<typeof ResumeEducationItemSchema>;
export type IResumeCertificationItem = z.infer<typeof ResumeCertificationItemSchema>;
export type IResumeAchievementItem = z.infer<typeof ResumeAchievementItemSchema>;
export type IResumeTrainingItem = z.infer<typeof ResumeTrainingItemSchema>;
