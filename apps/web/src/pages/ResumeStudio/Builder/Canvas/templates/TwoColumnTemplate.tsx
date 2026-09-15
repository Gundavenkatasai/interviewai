import React from "react";
import { ResumeRenderProps } from "../../../registry/TemplateRegistry";

const DEMO: any = {
  fullName: "Alex Johnson",
  professionalTitle: "Senior Software Engineer",
  email: "alex.johnson@email.com",
  phone: "+1 (555) 234-5678",
  location: "San Francisco, CA",
  linkedin: "linkedin.com/in/alexjohnson",
  github: "github.com/alexjohnson",
  summary: "Results-driven Software Engineer with 6+ years of experience building scalable web applications and distributed systems. Proven track record of reducing latency by 40% and increasing system reliability.",
  experience: [
    {
      id: "1",
      role: "Senior Software Engineer",
      company: "Acme Corp",
      location: "San Francisco, CA",
      startDate: "Jan 2021",
      endDate: "Present",
      current: true,
      description: "",
      bullets: [
        "Led a team of 5 engineers to redesign the core checkout pipeline, reducing payment failures by 32%.",
        "Architected a real-time event streaming system using Kafka processing 50M+ events/day.",
      ],
    },
    {
      id: "2",
      role: "Software Engineer II",
      company: "Beta Technologies",
      location: "Remote",
      startDate: "Jun 2019",
      endDate: "Dec 2020",
      current: false,
      description: "",
      bullets: [
        "Built a microservices authentication layer serving 2M+ daily active users.",
        "Reduced API response times by 45% through intelligent caching with Redis.",
      ],
    },
  ],
  education: [
    {
      id: "1",
      institution: "UC Berkeley",
      degree: "B.S.",
      field: "Computer Science",
      startDate: "2015",
      endDate: "2019",
      gpa: "3.8/4.0",
    },
  ],
  skills: {
    technical: ["TypeScript", "Python", "Go", "SQL"],
    frameworks: ["React", "Node.js", "FastAPI"],
    tools: ["Docker", "Kubernetes", "AWS"],
    soft: [],
    languages: [],
  },
  projects: [
    {
      id: "1",
      name: "Open-Source CLI",
      description: "A terminal-based productivity dashboard.",
      technologies: ["Go", "BubbleTea"],
      bullets: [],
    },
  ],
  certifications: [
    { id: "1", name: "AWS Solutions Architect", issuer: "AWS", date: "2022" },
  ],
};

const d = (val: any, fallback: any) => (val && (Array.isArray(val) ? val.length > 0 : String(val).trim() !== "")) ? val : fallback;

export const TwoColumnTemplate: React.FC<ResumeRenderProps> = ({ resume }) => {
  const { theme, layout, profileData } = resume;
  const p = profileData?.personal || {};

  const name = d(p.fullName, DEMO.fullName);
  const title = d(p.professionalTitle, DEMO.professionalTitle);
  const email = d(p.email, DEMO.email);
  const phone = d(p.phone, DEMO.phone);
  const location = d(p.location, DEMO.location);
  const linkedin = d(p.linkedin, DEMO.linkedin);
  const github = d(p.github, DEMO.github);
  const summary = d(profileData?.summary, DEMO.summary);
  const experience = d(profileData?.experience, DEMO.experience);
  const education = d(profileData?.education, DEMO.education);
  const skills = profileData?.skills;
  const projects = d(profileData?.projects, DEMO.projects);
  const certifications = d(profileData?.certifications, DEMO.certifications);

  const techSkills = d(skills?.technical, DEMO.skills.technical);
  const frameworkSkills = d(skills?.frameworks, DEMO.skills.frameworks);
  const toolSkills = d(skills?.tools, DEMO.skills.tools);

  return (
    <div
      className="w-full h-full flex"
      style={{
        fontFamily: theme.fontFamily,
        fontSize: `${theme.fontSize}px`,
        lineHeight: theme.lineHeight,
        color: theme.textColor,
        letterSpacing: `${theme.letterSpacing}px`,
      }}
    >
      {/* Left Sidebar */}
      <div 
        style={{ 
          width: '33%', 
          backgroundColor: theme.primaryColor, 
          color: '#ffffff',
          padding: `${layout.margins.top}px 24px ${layout.margins.bottom}px ${layout.margins.left}px`
        }}
      >
        <div className="mb-8">
          <h1 className="font-bold text-3xl uppercase leading-tight tracking-wider mb-2">{name}</h1>
          <div className="text-sm tracking-widest uppercase opacity-90 font-medium">{title}</div>
        </div>

        <div className="mb-8 space-y-3 text-sm opacity-90">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b border-white/30 pb-1 mb-3">Contact</h2>
          {email && <div className="break-all">{email}</div>}
          {phone && <div>{phone}</div>}
          {location && <div>{location}</div>}
          {linkedin && <div className="break-all">{linkedin}</div>}
          {github && <div className="break-all">{github}</div>}
        </div>

        {education && education.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-white/30 pb-1 mb-3">Education</h2>
            <div className="space-y-4">
              {education.map((edu: any, i: number) => (
                <div key={i}>
                  <div className="font-bold">{edu.institution}</div>
                  <div className="text-sm opacity-90">{edu.degree} in {edu.field}</div>
                  <div className="text-xs opacity-70 mt-0.5">{edu.startDate} – {edu.endDate}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(techSkills.length > 0 || frameworkSkills.length > 0 || toolSkills.length > 0) && (
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-white/30 pb-1 mb-3">Skills</h2>
            <div className="space-y-3 text-sm">
              {techSkills.length > 0 && (
                <div>
                  <div className="font-bold opacity-70 text-xs uppercase mb-1">Technical</div>
                  <div className="leading-relaxed opacity-90">{techSkills.join(", ")}</div>
                </div>
              )}
              {frameworkSkills.length > 0 && (
                <div>
                  <div className="font-bold opacity-70 text-xs uppercase mb-1">Frameworks</div>
                  <div className="leading-relaxed opacity-90">{frameworkSkills.join(", ")}</div>
                </div>
              )}
              {toolSkills.length > 0 && (
                <div>
                  <div className="font-bold opacity-70 text-xs uppercase mb-1">Tools</div>
                  <div className="leading-relaxed opacity-90">{toolSkills.join(", ")}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div 
        style={{ 
          width: '67%',
          padding: `${layout.margins.top}px ${layout.margins.right}px ${layout.margins.bottom}px 32px`
        }}
      >
        {summary && (
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: theme.headingColor }}>Profile</h2>
            <p className="whitespace-pre-wrap">{summary}</p>
          </div>
        )}

        {experience && experience.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: theme.headingColor }}>Work Experience</h2>
            <div className="space-y-6">
              {experience.map((exp: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-base" style={{ color: theme.headingColor }}>{exp.role}</h3>
                    <span className="text-xs font-semibold opacity-70">{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
                  </div>
                  <div className="text-sm font-medium mb-2" style={{ color: theme.primaryColor }}>
                    {exp.company} {exp.location ? `| ${exp.location}` : ""}
                  </div>
                  {exp.description && <p className="mb-2 text-sm">{exp.description}</p>}
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {exp.bullets.map((b: string, j: number) => <li key={j}>{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {projects && projects.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: theme.headingColor }}>Projects</h2>
            <div className="space-y-4">
              {projects.map((proj: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-bold text-sm" style={{ color: theme.headingColor }}>{proj.name}</h3>
                    {proj.technologies?.length > 0 && (
                      <span className="text-xs italic opacity-80">{proj.technologies.join(", ")}</span>
                    )}
                  </div>
                  {proj.description && <p className="text-sm mb-1">{proj.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {certifications && certifications.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: theme.headingColor }}>Certifications</h2>
            <div className="space-y-2 text-sm">
              {certifications.map((cert: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span className="font-medium">{cert.name} <span className="opacity-70 font-normal">({cert.issuer})</span></span>
                  <span className="opacity-70">{cert.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
