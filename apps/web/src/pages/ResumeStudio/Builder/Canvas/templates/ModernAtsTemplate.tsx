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
    tools: ["Docker", "Kubernetes", "AWS", "Git"],
    soft: ["Technical Leadership", "System Design"],
    languages: [],
  },
  projects: [
    {
      id: "1",
      name: "Open-Source CLI Dashboard",
      description: "A terminal-based developer productivity dashboard with real-time metrics.",
      technologies: ["Go", "BubbleTea"],
      bullets: ["2.3k GitHub stars", "Packaged via Homebrew."],
    },
  ],
  certifications: [
    { id: "1", name: "AWS Certified Solutions Architect – Associate", issuer: "Amazon Web Services", date: "2022" },
  ],
};

const d = (val: any, fallback: any) => (val && (Array.isArray(val) ? val.length > 0 : String(val).trim() !== "")) ? val : fallback;

export const ModernAtsTemplate: React.FC<ResumeRenderProps> = ({ resume }) => {
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
  const softSkills = d(skills?.soft, DEMO.skills.soft);
  const langSkills = d(skills?.languages, []);

  const sectionStyle = {
    color: theme.headingColor,
    fontSize: `${theme.fontSize * 1.15}px`,
    borderBottomColor: `${theme.primaryColor}60`,
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
      <header className="mb-5 pb-4 border-b-2" style={{ borderColor: theme.primaryColor }}>
        <h1
          className="font-bold uppercase tracking-wider"
          style={{ fontSize: `${theme.fontSize * 2}px`, color: theme.headingColor }}
        >
          {name}
        </h1>
        {title && (
          <p className="mt-1 font-semibold tracking-widest uppercase text-xs" style={{ color: theme.primaryColor }}>
            {title}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3" style={{ fontSize: `${theme.fontSize * 0.85}px` }}>
          {email && <span>{email}</span>}
          {phone && <span>• {phone}</span>}
          {location && <span>• {location}</span>}
          {linkedin && <span>• {linkedin}</span>}
          {github && <span>• {github}</span>}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section style={{ marginBottom: `${layout.sectionSpacing}px` }}>
          <div className="pl-4 border-l-4 italic" style={{ borderColor: theme.primaryColor }}>
            {summary}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section style={{ marginBottom: `${layout.sectionSpacing}px` }}>
          <h2
            className="font-bold uppercase tracking-widest border-b pb-1 mb-4"
            style={sectionStyle}
          >
            Professional Experience
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: `${layout.paragraphSpacing * 2 + 4}px` }}>
            {experience.map((exp: any, i: number) => (
              <div key={exp.id || i}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-bold text-base" style={{ color: theme.headingColor }}>{exp.role}</h3>
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    {exp.startDate}{exp.startDate ? " – " : ""}{exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                <div className="flex justify-between items-baseline mb-2 text-sm font-medium" style={{ color: theme.primaryColor }}>
                  <span>{exp.company}</span>
                  <span>{exp.location}</span>
                </div>
                {exp.description && <p className="mb-2 text-sm">{exp.description}</p>}
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {exp.bullets.map((b: string, j: number) => (
                      <li key={j} className="leading-relaxed">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section style={{ marginBottom: `${layout.sectionSpacing}px` }}>
          <h2 className="font-bold uppercase tracking-widest border-b pb-1 mb-4" style={sectionStyle}>
            Projects
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: `${layout.paragraphSpacing * 2}px` }}>
            {projects.map((proj: any, i: number) => (
              <div key={proj.id || i}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-bold text-sm" style={{ color: theme.headingColor }}>{proj.name}</h3>
                  {proj.technologies?.length > 0 && (
                    <span className="text-xs italic" style={{ color: theme.primaryColor }}>{proj.technologies.join(", ")}</span>
                  )}
                </div>
                {proj.description && <p className="text-sm mb-1">{proj.description}</p>}
                {proj.bullets?.length > 0 && (
                  <ul className="list-disc pl-5 space-y-0.5 text-sm">
                    {proj.bullets.map((b: string, j: number) => <li key={j}>{b}</li>)}
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
          <h2 className="font-bold uppercase tracking-widest border-b pb-1 mb-4" style={sectionStyle}>
            Education
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: `${layout.paragraphSpacing}px` }}>
            {education.map((edu: any, i: number) => (
              <div key={edu.id || i}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold" style={{ color: theme.headingColor }}>{edu.institution}</h3>
                  <span className="text-sm font-medium opacity-70">{edu.startDate} – {edu.endDate}</span>
                </div>
                <div className="flex justify-between items-baseline text-sm" style={{ color: theme.primaryColor }}>
                  <span>{edu.degree} in {edu.field}</span>
                  {edu.gpa && <span>GPA: {edu.gpa}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {(techSkills.length > 0 || frameworkSkills.length > 0 || toolSkills.length > 0) && (
        <section style={{ marginBottom: `${layout.sectionSpacing}px` }}>
          <h2 className="font-bold uppercase tracking-widest border-b pb-1 mb-4" style={sectionStyle}>
            Skills &amp; Expertise
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {techSkills.length > 0 && (
              <div><span className="font-bold block mb-0.5" style={{ color: theme.headingColor }}>Technical</span>{techSkills.join(", ")}</div>
            )}
            {frameworkSkills.length > 0 && (
              <div><span className="font-bold block mb-0.5" style={{ color: theme.headingColor }}>Frameworks</span>{frameworkSkills.join(", ")}</div>
            )}
            {toolSkills.length > 0 && (
              <div><span className="font-bold block mb-0.5" style={{ color: theme.headingColor }}>Tools</span>{toolSkills.join(", ")}</div>
            )}
            {langSkills.length > 0 && (
              <div><span className="font-bold block mb-0.5" style={{ color: theme.headingColor }}>Languages</span>{langSkills.join(", ")}</div>
            )}
            {softSkills.length > 0 && (
              <div className="col-span-2"><span className="font-bold block mb-0.5" style={{ color: theme.headingColor }}>Soft Skills</span>{softSkills.join(", ")}</div>
            )}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <section>
          <h2 className="font-bold uppercase tracking-widest border-b pb-1 mb-3" style={sectionStyle}>
            Certifications
          </h2>
          {certifications.map((cert: any, i: number) => (
            <div key={cert.id || i} className="flex justify-between items-baseline text-sm mb-1">
              <span><span className="font-semibold">{cert.name}</span>{cert.issuer ? ` — ${cert.issuer}` : ""}</span>
              {cert.date && <span className="opacity-70">{cert.date}</span>}
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
