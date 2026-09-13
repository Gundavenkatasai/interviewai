import React from "react";

interface TemplateProps {
  resume: any;
  paperSize?: "a4" | "letter";
}

export const ModernDevTemplate: React.FC<TemplateProps> = ({ resume }) => {
  const p = resume?.profileData || {};
  const personal = p.personal || {};

  return (
    <div className="w-full text-slate-900 font-sans leading-relaxed p-8 sm:p-12 text-xs bg-white">
      {/* Header */}
      <div className="border-b-2 border-indigo-600 pb-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              {personal.fullName || "Your Full Name"}
            </h1>
            {personal.professionalTitle && (
              <p className="text-sm font-bold text-indigo-600 mt-0.5 tracking-wide">
                {personal.professionalTitle}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:items-end text-[11px] text-slate-600 space-y-0.5">
            {personal.email && <span>{personal.email}</span>}
            {personal.phone && <span>{personal.phone}</span>}
            {personal.location && <span>{personal.location}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-700 mt-3 pt-2 border-t border-slate-100 font-mono">
          {personal.linkedin && <span className="text-indigo-600">{personal.linkedin}</span>}
          {personal.github && <span>• {personal.github}</span>}
          {personal.portfolio && <span>• {personal.portfolio}</span>}
        </div>
      </div>

      {/* Summary */}
      {p.summary && (
        <section className="mb-6">
          <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-900 flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
            Profile Summary
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed pl-4 border-l-2 border-slate-200">{p.summary}</p>
        </section>
      )}

      {/* Experience */}
      {p.experience && p.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-900 flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
            Experience
          </h2>
          <div className="space-y-4 pl-4 border-l-2 border-slate-200">
            {p.experience.map((exp: any, idx: number) => (
              <div key={exp.id || idx} className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs font-bold text-slate-900">
                  <span className="text-slate-950 font-bold">
                    {exp.role || "Role"} <span className="text-indigo-600 font-semibold">@ {exp.company || "Company"}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-normal">
                    {exp.startDate || ""} – {exp.endDate || (exp.current ? "Present" : "")}
                  </span>
                </div>
                {exp.location && <div className="text-[10px] text-slate-500 font-medium">{exp.location}</div>}
                {exp.description && <p className="text-xs text-slate-700 leading-relaxed">{exp.description}</p>}
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-3.5 space-y-1 text-xs text-slate-700">
                    {exp.bullets.map((b: string, bIdx: number) => (
                      <li key={bIdx} className="leading-relaxed pl-0.5">{b}</li>
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
        <section className="mb-6">
          <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-900 flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
            Projects
          </h2>
          <div className="space-y-3.5 pl-4 border-l-2 border-slate-200">
            {p.projects.map((proj: any, idx: number) => (
              <div key={proj.id || idx} className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs font-bold text-slate-900">
                  <span className="text-slate-950">{proj.name || "Project Name"}</span>
                  {proj.url && <span className="text-[10px] text-indigo-600 font-mono">{proj.url}</span>}
                </div>
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {proj.technologies.map((t: string, tIdx: number) => (
                      <span key={tIdx} className="text-[9px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {proj.description && <p className="text-xs text-slate-700 leading-relaxed mt-1">{proj.description}</p>}
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-3.5 space-y-0.5 text-xs text-slate-700">
                    {proj.bullets.map((b: string, bIdx: number) => (
                      <li key={bIdx} className="leading-relaxed pl-0.5">{b}</li>
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
        <section className="mb-6">
          <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-900 flex items-center gap-2 mb-2.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
            Technical Stack
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800 pl-4 border-l-2 border-slate-200">
            {p.skills.languages && p.skills.languages.length > 0 && (
              <div><span className="font-bold text-slate-900">Languages:</span> {p.skills.languages.join(", ")}</div>
            )}
            {p.skills.frameworks && p.skills.frameworks.length > 0 && (
              <div><span className="font-bold text-slate-900">Frameworks:</span> {p.skills.frameworks.join(", ")}</div>
            )}
            {p.skills.databases && p.skills.databases.length > 0 && (
              <div><span className="font-bold text-slate-900">Databases:</span> {p.skills.databases.join(", ")}</div>
            )}
            {p.skills.cloud && p.skills.cloud.length > 0 && (
              <div><span className="font-bold text-slate-900">Cloud/DevOps:</span> {p.skills.cloud.join(", ")}</div>
            )}
          </div>
        </section>
      )}

      {/* Education */}
      {p.education && p.education.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-900 flex items-center gap-2 mb-2.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
            Education
          </h2>
          <div className="space-y-2 pl-4 border-l-2 border-slate-200">
            {p.education.map((edu: any, idx: number) => (
              <div key={edu.id || idx} className="flex justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{edu.degree || "Degree"} {edu.field ? `in ${edu.field}` : ""}</span>
                  <span className="text-slate-600"> — {edu.institution || "Institution"}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">{edu.endDate || ""}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
