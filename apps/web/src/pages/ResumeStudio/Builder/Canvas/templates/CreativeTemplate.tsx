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

export const CreativeTemplate: React.FC<ResumeRenderProps> = ({ resume }) => {
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
      className="w-full h-full text-left"
      style={{
        fontFamily: theme.fontFamily,
        fontSize: `${theme.fontSize}px`,
        lineHeight: theme.lineHeight,
        color: theme.textColor,
        letterSpacing: `${theme.letterSpacing}px`,
      }}
    >
      {/* Creative Header */}
      <header 
        style={{ 
          backgroundColor: theme.primaryColor,
          color: '#ffffff',
          padding: `${layout.margins.top}px ${layout.margins.right}px 32px ${layout.margins.left}px`,
          position: 'relative'
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
          <div>
            <h1 className="font-extrabold uppercase tracking-tight leading-none mb-1" style={{ fontSize: `${theme.fontSize * 2.8}px` }}>
              {name}
            </h1>
            <p className="font-bold tracking-widest uppercase opacity-90" style={{ fontSize: `${theme.fontSize * 1.1}px` }}>
              {title}
            </p>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-1 text-sm opacity-90 text-right">
            {email && <span>{email}</span>}
            {phone && <span>{phone}</span>}
            {location && <span>{location}</span>}
            {linkedin && <span>{linkedin}</span>}
            {github && <span>{github}</span>}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div 
        style={{
          padding: `32px ${layout.margins.right}px ${layout.margins.bottom}px ${layout.margins.left}px`
        }}
      >
        {summary && (
          <section style={{ marginBottom: `${layout.sectionSpacing}px` }}>
            <p className="whitespace-pre-wrap font-medium text-lg leading-relaxed italic opacity-80 border-l-4 pl-4" style={{ borderColor: theme.primaryColor }}>
              "{summary}"
            </p>
          </section>
        )}

        {experience && experience.length > 0 && (
          <section style={{ marginBottom: `${layout.sectionSpacing}px` }}>
            <div className="flex items-center gap-4 mb-5">
              <h2 className="font-bold uppercase tracking-widest text-lg" style={{ color: theme.primaryColor }}>
                Experience
              </h2>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            
            <div className="space-y-6">
              {experience.map((exp: any, i: number) => (
                <div key={i} className="relative pl-6 border-l-2" style={{ borderColor: `${theme.primaryColor}30` }}>
                  <div 
                    className="absolute w-3 h-3 rounded-full -left-[7px] top-1.5" 
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <div className="flex flex-col md:flex-row md:justify-between md:items-baseline mb-1">
                    <h3 className="font-bold text-lg" style={{ color: theme.headingColor }}>{exp.role}</h3>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                    </span>
                  </div>
                  <div className="text-sm font-semibold mb-2" style={{ color: theme.primaryColor }}>
                    {exp.company} <span className="text-gray-400 font-normal ml-1">{exp.location && `• ${exp.location}`}</span>
                  </div>
                  {exp.description && <p className="mb-2 text-sm">{exp.description}</p>}
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="list-none space-y-1 text-sm">
                      {exp.bullets.map((b: string, j: number) => (
                        <li key={j} className="flex gap-2 items-start">
                          <span style={{ color: theme.primaryColor }}>▸</span> 
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {education && education.length > 0 && (
              <section style={{ marginBottom: `${layout.sectionSpacing}px` }}>
                <div className="flex items-center gap-4 mb-5">
                  <h2 className="font-bold uppercase tracking-widest text-lg" style={{ color: theme.primaryColor }}>
                    Education
                  </h2>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="space-y-4">
                  {education.map((edu: any, i: number) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-bold text-base mb-1" style={{ color: theme.headingColor }}>{edu.institution}</h3>
                      <div className="text-sm font-medium mb-1">{edu.degree} in {edu.field}</div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{edu.startDate} – {edu.endDate}</span>
                        {edu.gpa && <span className="font-bold bg-white px-2 py-1 rounded border border-gray-200">GPA: {edu.gpa}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {certifications && certifications.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-5">
                  <h2 className="font-bold uppercase tracking-widest text-lg" style={{ color: theme.primaryColor }}>
                    Certificates
                  </h2>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="space-y-3">
                  {certifications.map((cert: any, i: number) => (
                    <div key={i} className="flex flex-col bg-gray-50 p-3 rounded-lg border-l-2" style={{ borderColor: theme.primaryColor }}>
                      <span className="font-bold">{cert.name}</span>
                      <div className="flex justify-between items-center text-xs mt-1 text-gray-500">
                        <span>{cert.issuer}</span>
                        <span>{cert.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div>
            {(techSkills.length > 0 || frameworkSkills.length > 0 || toolSkills.length > 0) && (
              <section style={{ marginBottom: `${layout.sectionSpacing}px` }}>
                <div className="flex items-center gap-4 mb-5">
                  <h2 className="font-bold uppercase tracking-widest text-lg" style={{ color: theme.primaryColor }}>
                    Skills
                  </h2>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="space-y-4">
                  {techSkills.length > 0 && (
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Technical</div>
                      <div className="flex flex-wrap gap-2">
                        {techSkills.map((s: string) => (
                          <span key={s} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full border border-gray-200">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {frameworkSkills.length > 0 && (
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Frameworks</div>
                      <div className="flex flex-wrap gap-2">
                        {frameworkSkills.map((s: string) => (
                          <span key={s} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full border border-gray-200">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {toolSkills.length > 0 && (
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Tools</div>
                      <div className="flex flex-wrap gap-2">
                        {toolSkills.map((s: string) => (
                          <span key={s} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full border border-gray-200">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {projects && projects.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-5">
                  <h2 className="font-bold uppercase tracking-widest text-lg" style={{ color: theme.primaryColor }}>
                    Projects
                  </h2>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="space-y-4">
                  {projects.map((proj: any, i: number) => (
                    <div key={i}>
                      <h3 className="font-bold text-base mb-1" style={{ color: theme.headingColor }}>{proj.name}</h3>
                      {proj.technologies?.length > 0 && (
                        <div className="text-xs font-medium mb-2 opacity-70">{proj.technologies.join(" • ")}</div>
                      )}
                      {proj.description && <p className="text-sm mb-2">{proj.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
