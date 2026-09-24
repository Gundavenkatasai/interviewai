export interface Project {
  id: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  detailedOverview: string;
  highlights: string[];
  technologies: string[];
  metrics?: { label: string; value: string }[];
  githubUrl: string;
  liveUrl?: string;
  accentColor: string;
  secondaryColor?: string;
  featured: boolean;
  type: "ai" | "realtime" | "fullstack" | "cv";
}

export interface SkillItem {
  name: string;
  level: "Advanced" | "Proficient" | "Specialized";
  icon?: string;
  description?: string;
}

export interface SkillCategory {
  title: string;
  categoryKey: string;
  description: string;
  skills: SkillItem[];
}

export interface TimelineItem {
  id: string;
  period: string;
  title: string;
  organization: string;
  location?: string;
  grade?: string;
  category: "education" | "achievement" | "certification" | "hackathon";
  description: string;
  highlights: string[];
  credentialUrl?: string;
}

export interface GitHubRepo {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  url: string;
  updated: string;
  tags: string[];
}
