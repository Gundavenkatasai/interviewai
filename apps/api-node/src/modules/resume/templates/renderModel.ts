import { IResumeProfileData, IResumeSectionConfig } from "../resume.model";

export interface IRenderHeader {
  name: string;
  title?: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  website?: string;
}

export interface IRenderExperience {
  id: string;
  company: string;
  role: string;
  location: string;
  dateRange: string;
  bullets: string[];
}

export interface IRenderEducation {
  id: string;
  institution: string;
  degree: string;
  dateRange: string;
  gpa?: string;
}

export interface IRenderProject {
  id: string;
  name: string;
  url?: string;
  technologies: string;
  bullets: string[];
}

export interface IRenderSection {
  id: string;
  type: "summary" | "experience" | "education" | "projects" | "skills" | "certifications" | "custom";
  title: string;
  content: any; // Context-dependent
}

export interface IResumeRenderDocument {
  header: IRenderHeader;
  sections: IRenderSection[];
}

export function buildRenderDocument(
  profileData: IResumeProfileData,
  sectionConfigs: IResumeSectionConfig[]
): IResumeRenderDocument {
  // 1. Build Header
  const basics = profileData.personal;
  const header: IRenderHeader = {
    name: basics?.fullName || "Name Not Provided",
    title: basics?.professionalTitle,
    email: basics?.email || "",
    phone: basics?.phone || "",
    location: basics?.location || "",
    linkedin: basics?.linkedin,
    github: basics?.github,
    portfolio: basics?.portfolio,
    website: basics?.website
  };

  // 2. Build Sections
  const renderSections: IRenderSection[] = [];

  // Sort configs by order
  const sortedConfigs = [...(sectionConfigs || [])]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  // Helper to format dates
  const formatDate = (start?: string, end?: string) => {
    if (!start && !end) return "";
    if (start && !end) return `${start} - Present`;
    if (!start && end) return end;
    return `${start} - ${end}`;
  };

  for (const config of sortedConfigs) {
    if (config.id === "summary" && profileData.summary) {
      renderSections.push({
        id: "summary",
        type: "summary",
        title: config.name || "Professional Summary",
        content: profileData.summary
      });
    }

    if (config.id === "experience" && profileData.experience?.length > 0) {
      const expContent: IRenderExperience[] = profileData.experience.map((e) => ({
        id: e.id,
        company: e.company,
        role: e.role,
        location: e.location || "",
        dateRange: formatDate(e.startDate, e.endDate || (e.current ? "Present" : "")),
        bullets: e.bullets || []
      }));
      renderSections.push({
        id: "experience",
        type: "experience",
        title: config.name || "Experience",
        content: expContent
      });
    }

    if (config.id === "education" && profileData.education?.length > 0) {
      const eduContent: IRenderEducation[] = profileData.education.map((e) => ({
        id: e.id,
        institution: e.institution,
        degree: `${e.degree} in ${e.field}`,
        dateRange: formatDate(e.startDate, e.endDate),
        gpa: e.gpa
      }));
      renderSections.push({
        id: "education",
        type: "education",
        title: config.name || "Education",
        content: eduContent
      });
    }

    if (config.id === "projects" && profileData.projects?.length > 0) {
      const projContent: IRenderProject[] = profileData.projects.map((p) => ({
        id: p.id,
        name: p.name,
        url: p.url,
        technologies: (p.technologies || []).join(", "),
        bullets: p.bullets || []
      }));
      renderSections.push({
        id: "projects",
        type: "projects",
        title: config.name || "Projects",
        content: projContent
      });
    }

    if (config.id === "skills" && profileData.skills) {
      const skillsMap = [];
      const s = profileData.skills;
      if (s.languages?.length) skillsMap.push({ category: "Languages", items: s.languages.join(", ") });
      if (s.frameworks?.length) skillsMap.push({ category: "Frameworks", items: s.frameworks.join(", ") });
      if (s.databases?.length) skillsMap.push({ category: "Databases", items: s.databases.join(", ") });
      if (s.tools?.length) skillsMap.push({ category: "Tools", items: s.tools.join(", ") });
      if (s.cloud?.length) skillsMap.push({ category: "Cloud", items: s.cloud.join(", ") });
      
      // Fallback for unstructured technical
      if (s.technical?.length && skillsMap.length === 0) {
        skillsMap.push({ category: "Technical", items: s.technical.join(", ") });
      }

      if (skillsMap.length > 0) {
        renderSections.push({
          id: "skills",
          type: "skills",
          title: config.name || "Skills",
          content: skillsMap
        });
      }
    }

    if (config.id === "certifications" && profileData.certifications?.length > 0) {
      const certContent = profileData.certifications.map((c) => ({
        id: c.id,
        name: c.name,
        issuer: c.issuer,
        date: c.date
      }));
      renderSections.push({
        id: "certifications",
        type: "certifications",
        title: config.name || "Certifications",
        content: certContent
      });
    }
  }

  // If no sections config exist, fallback to default order
  if (renderSections.length === 0) {
    if (profileData.summary) renderSections.push({ id: "summary", type: "summary", title: "Professional Summary", content: profileData.summary });
    if (profileData.experience?.length) {
      renderSections.push({
        id: "experience", type: "experience", title: "Experience",
        content: profileData.experience.map(e => ({
          id: e.id, company: e.company, role: e.role, location: e.location,
          dateRange: formatDate(e.startDate, e.endDate || (e.current ? "Present" : "")), bullets: e.bullets
        }))
      });
    }
    // ... add more fallbacks if needed
  }

  return {
    header,
    sections: renderSections
  };
}
