import React from "react";

interface TemplateProps {
  resume: any;
  paperSize?: "a4" | "letter";
}

export const MinimalTemplate: React.FC<TemplateProps> = ({ resume }) => {
  const p = resume?.profileData || {};
  const personal = p.personal || {};

  return (
    <div className="w-full text-slate-800 font-sans leading-relaxed p-10 sm:p-14 text-xs bg-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light tracking-tight text-slate-950">
          {personal.fullName || "Your Full Name"}
        </h1>
        {personal.professionalTitle && (
          <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">
            {personal.professionalTitle}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-3">
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.location && <span>{personal.location}</span>}
          {personal.linkedin && <span>{personal.linkedin}</span>}
          {personal.github && <span>{personal.github}</span>}
        </div>
      </div>

      {/* Summary */}
      {p.summary && (
        <section className="mb-7">
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{p.summary}</p>
        </section>
      )}

      {/* Experience */}
      {p.experience && p.experience.length > 0 && (
        <section className="mb-7">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
            Experience
          </h2>
          <div className="space-y-5">
            {p.experience.map((exp: any, idx: number) => (
              <div key={exp.id || idx}>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-medium text-slate-900">
                    {exp.role} <span className="text-slate-500">· {exp.company}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {exp.startDate} — {exp.endDate || (exp.current ? "Present" : "")}
                  </span>
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                    {exp.bullets.map((b: string, bIdx: number) => (
                      <li key={bIdx} className="leading-relaxed flex items-start gap-2">
                        <span className="text-slate-300 select-none">—</span>
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

      {/* Projects */}
      {p.projects && p.projects.length > 0 && (
        <section className="mb-7">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
            Projects
          </h2>
          <div className="space-y-4">
            {p.projects.map((proj: any, idx: number) => (
              <div key={proj.id || idx}>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-medium text-slate-900">{proj.name}</span>
                  {proj.url && <span className="text-[10px] text-slate-400">{proj.url}</span>}
                </div>
                {proj.technologies && proj.technologies.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-0.5">{proj.technologies.join(" · ")}</p>
                )}
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    {proj.bullets.map((b: string, bIdx: number) => (
                      <li key={bIdx} className="leading-relaxed flex items-start gap-2">
                        <span className="text-slate-300 select-none">—</span>
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

      {/* Skills */}
      {p.skills && (
        <section className="mb-7">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            Skills
          </h2>
          <div className="space-y-1 text-xs text-slate-600">
            {p.skills.languages && p.skills.languages.length > 0 && (
              <p><span className="text-slate-900 font-medium">Languages:</span> {p.skills.languages.join(", ")}</p>
            )}
            {p.skills.frameworks && p.skills.frameworks.length > 0 && (
              <p><span className="text-slate-900 font-medium">Frameworks:</span> {p.skills.frameworks.join(", ")}</p>
            )}
            {p.skills.databases && p.skills.databases.length > 0 && (
              <p><span className="text-slate-900 font-medium">Databases & Cloud:</span> {[...(p.skills.databases || []), ...(p.skills.cloud || [])].join(", ")}</p>
            )}
          </div>
        </section>
      )}

      {/* Education */}
      {p.education && p.education.length > 0 && (
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            Education
          </h2>
          <div className="space-y-2 text-xs">
            {p.education.map((edu: any, idx: number) => (
              <div key={edu.id || idx} className="flex justify-between items-baseline">
                <span className="font-medium text-slate-900">{edu.degree} in {edu.field || "Computer Science"} · <span className="text-slate-600 font-normal">{edu.institution}</span></span>
                <span className="text-[10px] text-slate-400">{edu.endDate}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
