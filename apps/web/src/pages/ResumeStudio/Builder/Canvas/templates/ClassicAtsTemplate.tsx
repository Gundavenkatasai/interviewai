import React from "react";
import { ResumeRenderProps } from "../../../registry/TemplateRegistry";

// Demo data shown when resume has empty fields
const DEMO: any = {
  fullName: "Alex Johnson",
  professionalTitle: "Senior Software Engineer",
  email: "alex.johnson@email.com",
  phone: "+1 (555) 234-5678",
  location: "San Francisco, CA",
  linkedin: "linkedin.com/in/alexjohnson",
  github: "github.com/alexjohnson",
  summary: "Results-driven Software Engineer with 6+ years of experience building scalable web applications and distributed systems. Proven track record of reducing latency by 40% and increasing system reliability. Passionate about clean code, developer experience, and mentoring junior engineers.",
  experience: [
    {
      id: "1",
      role: "Senior Software Engineer",
      company: "Acme Corp",
      location: "San Francisco, CA",
      startDate: "Jan 2021",
      endDate: "",
      current: true,
      description: "",
      bullets: [
        "Led a team of 5 engineers to redesign the core checkout pipeline, reducing payment failures by 32%.",
        "Architected a real-time event streaming system using Kafka processing 50M+ events/day.",
        "Mentored 3 junior engineers through bi-weekly 1:1s and code review sessions.",
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
      institution: "University of California, Berkeley",
      degree: "B.S.",
      field: "Computer Science",
      startDate: "2015",
      endDate: "2019",
      gpa: "3.8/4.0",
    },
  ],
  skills: {
    technical: ["TypeScript", "Python", "Go", "SQL"],
    frameworks: ["React", "Node.js", "FastAPI", "gRPC"],
    tools: ["Docker", "Kubernetes", "AWS", "Git", "Terraform"],
    languages: [],
    databases: ["PostgreSQL", "MongoDB", "Redis"],
    cloud: [],
    soft: ["Technical Leadership", "System Design", "Agile / Scrum"],
  },
  projects: [
    {
      id: "1",
      name: "Open-Source CLI Dashboard",
      description: "A terminal-based developer productivity dashboard with real-time metrics.",
      technologies: ["Go", "BubbleTea", "Prometheus"],
      bullets: ["2.3k GitHub stars", "Packaged and distributed via Homebrew."],
    },
  ],
  certifications: [
    { id: "1", name: "AWS Certified Solutions Architect – Associate", issuer: "Amazon Web Services", date: "2022" },
  ],
};

const d = (val: any, fallback: any) => (val && (Array.isArray(val) ? val.length > 0 : String(val).trim() !== "")) ? val : fallback;

export const ClassicAtsTemplate: React.FC<ResumeRenderProps> = ({ resume }) => {
  const { theme, layout, profileData } = resume;
  const p = profileData?.personal || {};
  const summary = d(profileData?.summary, DEMO.summary);
  const experience = d(profileData?.experience, DEMO.experience);
  const education = d(profileData?.education, DEMO.education);
  const skills = profileData?.skills;
  const projects = d(profileData?.projects, DEMO.projects);
  const certifications = d(profileData?.certifications, DEMO.certifications);

  const name = d(p.fullName, DEMO.fullName);
  const title = d(p.professionalTitle, DEMO.professionalTitle);
  const email = d(p.email, DEMO.email);
  const phone = d(p.phone, DEMO.phone);
  const location = d(p.location, DEMO.location);
  const linkedin = d(p.linkedin, DEMO.linkedin);
  const github = d(p.github, DEMO.github);

  const techSkills = d(skills?.technical, DEMO.skills.technical);
  const frameworkSkills = d(skills?.frameworks, DEMO.skills.frameworks);
  const toolSkills = d(skills?.tools, DEMO.skills.tools);
  const softSkills = d(skills?.soft, DEMO.skills.soft);
  const langSkills = d(skills?.languages, []);
  const hasSkills = techSkills.length > 0 || frameworkSkills.length > 0 || toolSkills.length > 0 || softSkills.length > 0 || langSkills.length > 0;

  const sectionH2 = {
    fontFamily: theme.fontFamily,
    fontSize: `${theme.fontSize * 1.1}px`,
    color: theme.headingColor,
    borderBottomColor: theme.headingColor,
    letterSpacing: `${theme.letterSpacing + 1}px`,
  };

  return (
    <div
      className="w-full h-full text-left"
      style={{
        padding: `${layout.margins.top}px ${layout.margins.right}px ${layout.margins.bottom}px ${layout.margins.left}px`,
        fontFamily: theme.fontFamily,
        fontSize: `${theme.fontSize}px`,
        lineHeight: theme.lineHeight,
        color: theme.textColor,
        letterSpacing: `${theme.letterSpacing}px`,
      }}
    >
      {/* Header */}
      <header className="mb-4 text-center">
        <h1
          className="font-bold tracking-wide uppercase"
          style={{ fontSize: `${theme.fontSize * 1.8}px`, color: theme.headingColor }}
        >
          {name}
        </h1>
        {title && (
          <p className="mt-1 font-medium" style={{ color: theme.primaryColor }}>
            {title}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2" style={{ fontSize: `${theme.fontSize * 0.9}px` }}>
          {email && <span>{email}</span>}
          {phone && <><span>|</span><span>{phone}</span></>}
          {location && <><span>|</span><span>{location}</span></>}
          {linkedin && <><span>|</span><span>{linkedin}</span></>}
          {github && <><span>|</span><span>{github}</span></>}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section style={{ marginBottom: `${layout.sectionSpacing}px` }}>
          <h2 className="font-bold border-b-2 uppercase tracking-wider pb-1 mb-2" style={sectionH2}>
            Professional Summary
          </h2>
          <p className="whitespace-pre-wrap">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section style={{ marginBottom: `${layout.sectionSpacing}px` }}>
          <h2 className="font-bold border-b-2 uppercase tracking-wider pb-1 mb-3" style={sectionH2}>
            Work Experience
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: `${layout.paragraphSpacing * 2}px` }}>
            {experience.map((exp: any, i: number) => (
              <div key={exp.id || i}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-bold" style={{ color: theme.headingColor }}>{exp.role}</h3>
                  <span style={{ fontSize: `${theme.fontSize * 0.9}px` }}>{exp.startDate}{exp.startDate ? " – " : ""}{exp.current ? "Present" : exp.endDate}</span>
                </div>
                <div className="flex justify-between items-baseline mb-1" style={{ fontSize: `${theme.fontSize * 0.9}px` }}>
                  <span className="font-medium italic">{exp.company}</span>
                  <span className="italic">{exp.location}</span>
                </div>
                {exp.description && <p className="mb-1">{exp.description}</p>}
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="list-disc pl-5 space-y-0.5">
                    {exp.bullets.map((bullet: string, j: number) => (
                      <li key={j}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section style={{ marginBottom: `${layout.sectionSpacing}px` }}>
          <h2 className="font-bold border-b-2 uppercase tracking-wider pb-1 mb-3" style={sectionH2}>
            Education
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: `${layout.paragraphSpacing}px` }}>
            {education.map((edu: any, i: number) => (
              <div key={edu.id || i}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold" style={{ color: theme.headingColor }}>{edu.institution}</h3>
                  <span style={{ fontSize: `${theme.fontSize * 0.9}px` }}>{edu.startDate} – {edu.endDate}</span>
                </div>
                <div className="flex justify-between items-baseline" style={{ fontSize: `${theme.fontSize * 0.9}px` }}>
                  <span>{edu.degree} in {edu.field}</span>
                  {edu.gpa && <span>GPA: {edu.gpa}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section style={{ marginBottom: `${layout.sectionSpacing}px` }}>
          <h2 className="font-bold border-b-2 uppercase tracking-wider pb-1 mb-3" style={sectionH2}>
            Projects
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: `${layout.paragraphSpacing * 2}px` }}>
            {projects.map((proj: any, i: number) => (
              <div key={proj.id || i}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-bold" style={{ color: theme.headingColor }}>{proj.name}</h3>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <span style={{ fontSize: `${theme.fontSize * 0.85}px` }} className="italic">{proj.technologies.join(", ")}</span>
                  )}
                </div>
                {proj.description && <p className="mb-1">{proj.description}</p>}
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="list-disc pl-5 space-y-0.5">
                    {proj.bullets.map((b: string, j: number) => <li key={j}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {hasSkills && (
        <section style={{ marginBottom: `${layout.sectionSpacing}px` }}>
          <h2 className="font-bold border-b-2 uppercase tracking-wider pb-1 mb-2" style={sectionH2}>
            Skills
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {techSkills.length > 0 && (
              <div><span className="font-bold" style={{ color: theme.headingColor }}>Technical: </span>{techSkills.join(", ")}</div>
            )}
            {frameworkSkills.length > 0 && (
              <div><span className="font-bold" style={{ color: theme.headingColor }}>Frameworks: </span>{frameworkSkills.join(", ")}</div>
            )}
            {toolSkills.length > 0 && (
              <div><span className="font-bold" style={{ color: theme.headingColor }}>Tools: </span>{toolSkills.join(", ")}</div>
            )}
            {langSkills.length > 0 && (
              <div><span className="font-bold" style={{ color: theme.headingColor }}>Languages: </span>{langSkills.join(", ")}</div>
            )}
            {softSkills.length > 0 && (
              <div><span className="font-bold" style={{ color: theme.headingColor }}>Soft Skills: </span>{softSkills.join(", ")}</div>
            )}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <section style={{ marginBottom: `${layout.sectionSpacing}px` }}>
          <h2 className="font-bold border-b-2 uppercase tracking-wider pb-1 mb-2" style={sectionH2}>
            Certifications
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {certifications.map((cert: any, i: number) => (
              <div key={cert.id || i} className="flex justify-between items-baseline">
                <span><span className="font-semibold">{cert.name}</span>{cert.issuer ? ` — ${cert.issuer}` : ""}</span>
                {cert.date && <span style={{ fontSize: `${theme.fontSize * 0.9}px` }}>{cert.date}</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
