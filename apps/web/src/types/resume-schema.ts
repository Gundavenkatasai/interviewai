export type TemplateId =
  | "classic-ats"
  | "tech-fresher"
  | "modern-minimal"
  | "experienced-prof"
  | "academic"
  | "modern-tech";

export interface IResumeBasics {
  name: string;
  professionalTitle?: string;
  title?: string;
  email: string;
  phone?: string;
  location?: string;
  links?: { label: string; url: string }[];
}

export interface IResumeSkillCategory {
  category: string;
  items: string[];
}

export interface IResumeExperienceItem {
  company: string;
  role: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  bullets: string[];
}

export interface IResumeProjectItem {
  name: string;
  role?: string;
  technologies: string[];
  description?: string;
  bullets: string[];
  githubUrl?: string;
  liveUrl?: string;
  startDate?: string;
  endDate?: string;
}

export interface IResumeEducationItem {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  field?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  coursework?: string[];
  highlights?: string[];
}

export interface IResumeCertificationItem {
  name: string;
  issuer: string;
  date?: string;
  url?: string;
}

export interface IResumeAchievementItem {
  title: string;
  description?: string;
  date?: string;
}

export interface IResumeTrainingItem {
  title: string;
  bullets: string[];
}

export interface IResumeLanguageItem {
  language: string;
  proficiency?: string;
}

export interface IResumePublicationItem {
  title: string;
  publisher?: string;
  journal?: string;
  date?: string;
  url?: string;
}

export interface IStructuredResume {
  basics: IResumeBasics;
  summary?: string;
  skills: IResumeSkillCategory[];
  experience: IResumeExperienceItem[];
  internships?: IResumeExperienceItem[];
  projects: IResumeProjectItem[];
  education: IResumeEducationItem[];
  certifications?: IResumeCertificationItem[];
  achievements?: IResumeAchievementItem[];
  training?: IResumeTrainingItem[];
  languages?: IResumeLanguageItem[];
  publications?: IResumePublicationItem[];
  customSections?: { title: string; items: string[] }[];
}
