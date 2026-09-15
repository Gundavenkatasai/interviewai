export type ResumeTemplateId =
  | "ats_classic"
  | "ats_modern"
  | "ats_minimal"
  | "modern_dev"
  | "software_eng"
  | "student"
  | "fresh_grad"
  | "experienced_pro"
  | "minimal"
  | "two_column"
  | "academic"
  | "executive"
  | "technical"
  | "creative"
  | "finance_consulting";

export interface IResumeTheme {
  primaryColor: string;
  textColor: string;
  headingColor: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

export interface IResumeLayout {
  pageSize: "A4" | "Letter";
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  sectionSpacing: number;
  paragraphSpacing: number;
  columnGap: number;
}

export interface IResumeSectionConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

// These are mirrors of the backend interfaces needed for the frontend store
export interface IResumePersonal {
  fullName: string;
  professionalTitle?: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  website?: string;
}

export interface IResumeExperience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements?: string;
  bullets: string[];
}

export interface IResumeEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface IResumeProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  role?: string;
  outcome?: string;
  url?: string;
  bullets: string[];
}

export interface IResumeSkills {
  technical: string[];
  languages: string[];
  frameworks: string[];
  databases: string[];
  cloud: string[];
  tools: string[];
  soft: string[];
}

export interface IResumeCertification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface IResumeProfileData {
  personal: IResumePersonal;
  summary: string;
  experience: IResumeExperience[];
  education: IResumeEducation[];
  projects: IResumeProject[];
  skills: IResumeSkills;
  certifications: IResumeCertification[];
  achievements: any[];
  internships: any[];
  publications: any[];
  volunteer: any[];
  languages: any[];
  interests: string[];
  customSections: any[];
}

export interface IResume {
  _id: string;
  name: string;
  targetRole: string;
  profileData: IResumeProfileData;
  sections: IResumeSectionConfig[];
  template: ResumeTemplateId;
  theme: IResumeTheme;
  layout: IResumeLayout;
  atsScore: number;
  updatedAt: string;
  /** Set when this resume was imported from an uploaded file */
  fileType?: "pdf" | "docx" | "txt";
  /** True when the original raw text is stored on the backend (imported resume) */
  hasRawText?: boolean;
  /** Filename of the original uploaded document */
  filename?: string;
}
