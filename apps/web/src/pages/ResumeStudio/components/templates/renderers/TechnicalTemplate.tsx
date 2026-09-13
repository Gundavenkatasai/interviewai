import React from "react";

interface TemplateProps {
  resume: any;
  paperSize?: "a4" | "letter";
}

export const TechnicalTemplate: React.FC<TemplateProps> = ({ resume }) => {
  const p = resume?.profileData || {};
  const personal = p.personal || {};

  return (
    <div className="w-full text-slate-900 font-sans leading-normal p-8 sm:p-12 text-xs bg-white">
      {/* Header */}
      <div className="border-b border-slate-900 pb-4 mb-5">
        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-slate-950">
              {personal.fullName || "Candidate Name"}
            </h1>
            {personal.professionalTitle && (
              <p className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
                $ {personal.professionalTitle}
              </p>
            )}
          </div>
          <div className="text-right text-[11px] font-mono text-slate-600 space-y-0.5">
            {personal.email && <div>{personal.email}</div>}
            {personal.phone && <div>{personal.phone}</div>}
            {personal.location && <div>{personal.location}</div>}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] font-mono text-slate-700 mt-2">
          {personal.github && <span>github: {personal.github}</span>}
          {personal.linkedin && <span>linkedin: {personal.linkedin}</span>}
          {personal.portfolio && <span>web: {personal.portfolio}</span>}
        </div>
      </div>

      {/* Summary */}
      {p.summary && (
        <section className="mb-5">
          <h2 className="text-xs font-mono font-bold uppercase text-slate-900 mb-1.5 flex items-center gap-1.5">
            <span className="text-emerald-600">&gt;</span> OVERVIEW
          </h2>
          <p className="text-xs text-slate-800 leading-relaxed font-sans">{p.summary}</p>
        </section>
      )}

      {/* Technical Skills - Highlighted First */}
      {p.skills && (
        <section className="mb-5">
          <h2 className="text-xs font-mono font-bold uppercase text-slate-900 mb-2 flex items-center gap-1.5">
            <span className="text-emerald-600">&gt;</span> TECH_STACK &amp; PROFICIENCIES
          </h2>
          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[11px] font-mono space-y-1 text-slate-800">
            {p.skills.languages && p.skills.languages.length > 0 && (
              <div><span className="text-emerald-800 font-bold">languages:</span> [{p.skills.languages.join(", ")}]</div>
            )}
            {p.skills.frameworks && p.skills.frameworks.length > 0 && (
              <div><span className="text-emerald-800 font-bold">frameworks:</span> [{p.skills.frameworks.join(", ")}]</div>
            )}
            {p.skills.databases && p.skills.databases.length > 0 && (
              <div><span className="text-emerald-800 font-bold">databases:</span> [{p.skills.databases.join(", ")}]</div>
            )}
            {p.skills.cloud && p.skills.cloud.length > 0 && (
              <div><span className="text-emerald-800 font-bold">cloud_devops:</span> [{p.skills.cloud.join(", ")}]</div>
            )}
            {p.skills.tools && p.skills.tools.length > 0 && (
              <div><span className="text-emerald-800 font-bold">tools:</span> [{p.skills.tools.join(", ")}]</div>
            )}
          </div>
        </section>
      )}

      {/* Experience */}
      {p.experience && p.experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-mono font-bold uppercase text-slate-900 mb-2 flex items-center gap-1.5">
            <span className="text-emerald-600">&gt;</span> PROFESSIONAL_EXPERIENCE
          </h2>
          <div className="space-y-4">
            {p.experience.map((exp: any, idx: number) => (
              <div key={exp.id || idx}>
                <div className="flex justify-between items-baseline font-mono text-xs font-bold text-slate-950">
                  <span>{exp.role} <span className="text-emerald-700 font-semibold">@ {exp.company}</span></span>
                  <span className="text-[10px] text-slate-500 font-normal">{exp.startDate} - {exp.endDate || (exp.current ? "Present" : "")}</span>
                </div>
                {exp.description && <p className="text-xs text-slate-700 mt-1">{exp.description}</p>}
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-1 text-xs text-slate-700 font-sans">
                    {exp.bullets.map((b: string, bIdx: number) => (
                      <li key={bIdx} className="leading-relaxed pl-1">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {p.projects && p.projects.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-mono font-bold uppercase text-slate-900 mb-2 flex items-center gap-1.5">
            <span className="text-emerald-600">&gt;</span> FEATURED_PROJECTS
          </h2>
          <div className="space-y-3">
            {p.projects.map((proj: any, idx: number) => (
              <div key={proj.id || idx}>
                <div className="flex justify-between items-baseline font-mono text-xs font-bold">
                  <span>{proj.name} {proj.technologies && <span className="text-slate-500 text-[10px] font-normal">[{proj.technologies.join(", ")}]</span>}</span>
                  {proj.url && <span className="text-[10px] text-indigo-600 font-normal">{proj.url}</span>}
                </div>
                {proj.description && <p className="text-xs text-slate-700 mt-0.5">{proj.description}</p>}
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-xs text-slate-700 font-sans">
                    {proj.bullets.map((b: string, bIdx: number) => (
                      <li key={bIdx} className="leading-relaxed pl-1">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {p.education && p.education.length > 0 && (
        <section>
          <h2 className="text-xs font-mono font-bold uppercase text-slate-900 mb-2 flex items-center gap-1.5">
            <span className="text-emerald-600">&gt;</span> EDUCATION
          </h2>
          <div className="space-y-1.5 font-mono text-xs">
            {p.education.map((edu: any, idx: number) => (
              <div key={edu.id || idx} className="flex justify-between text-slate-800">
                <span>{edu.degree} in {edu.field || "CS"} - {edu.institution}</span>
                <span className="text-slate-500 text-[10px]">{edu.endDate}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
