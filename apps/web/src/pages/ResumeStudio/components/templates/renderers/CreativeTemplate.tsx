import React from "react";

interface TemplateProps {
  resume: any;
  paperSize?: "a4" | "letter";
}

export const CreativeTemplate: React.FC<TemplateProps> = ({ resume }) => {
  const p = resume?.profileData || {};
  const personal = p.personal || {};

  return (
    <div className="w-full text-slate-800 font-sans leading-normal p-8 sm:p-12 text-xs bg-white relative">
      {/* Top Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      {/* Header */}
      <div className="mb-6 pt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              {personal.fullName || "Candidate Name"}
            </h1>
            {personal.professionalTitle && (
              <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mt-1">
                {personal.professionalTitle}
              </p>
            )}
          </div>
          <div className="text-left sm:text-right text-[11px] text-slate-500 space-y-0.5 font-medium">
            {personal.email && <div>{personal.email}</div>}
            {personal.phone && <div>{personal.phone}</div>}
            {personal.location && <div>{personal.location}</div>}
            {personal.portfolio && <div className="text-purple-600 font-semibold">{personal.portfolio}</div>}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] text-slate-600 mt-2 font-medium">
          {personal.linkedin && <span>LinkedIn: {personal.linkedin}</span>}
          {personal.github && <span>• GitHub: {personal.github}</span>}
        </div>
      </div>

      {/* Summary */}
      {p.summary && (
        <section className="mb-6">
          <p className="text-xs text-slate-700 leading-relaxed italic bg-purple-50/60 p-3 rounded-lg border border-purple-100">
            "{p.summary}"
          </p>
        </section>
      )}

      {/* Experience */}
      {p.experience && p.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-purple-600 rounded-sm inline-block" />
            Experience
          </h2>
          <div className="space-y-4">
            {p.experience.map((exp: any, idx: number) => (
              <div key={exp.id || idx} className="pl-3.5 border-l border-purple-200">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-slate-950">
                    {exp.role} <span className="text-purple-700 font-semibold">@ {exp.company}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {exp.startDate} – {exp.endDate || (exp.current ? "Present" : "")}
                  </span>
                </div>
                {exp.description && <p className="text-xs text-slate-600 mt-1">{exp.description}</p>}
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1.5 space-y-1 text-xs text-slate-700">
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
        <section className="mb-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-purple-600 rounded-sm inline-block" />
            Projects
          </h2>
          <div className="space-y-3">
            {p.projects.map((proj: any, idx: number) => (
              <div key={proj.id || idx} className="pl-3.5 border-l border-purple-200">
                <div className="flex justify-between items-baseline text-xs font-bold text-slate-900">
                  <span>{proj.name}</span>
                  {proj.url && <span className="text-[10px] text-purple-600">{proj.url}</span>}
                </div>
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {proj.technologies.map((t: string, ti: number) => (
                      <span key={ti} className="bg-slate-100 text-slate-700 text-[9px] px-1.5 py-0.5 rounded font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-xs text-slate-700">
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

      {/* Skills */}
      {p.skills && (
        <section className="mb-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2.5 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-purple-600 rounded-sm inline-block" />
            Skills & Stack
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
            {p.skills.languages && p.skills.languages.length > 0 && (
              <p><strong className="text-slate-900">Languages:</strong> {p.skills.languages.join(", ")}</p>
            )}
            {p.skills.frameworks && p.skills.frameworks.length > 0 && (
              <p><strong className="text-slate-900">Frameworks:</strong> {p.skills.frameworks.join(", ")}</p>
            )}
            {p.skills.databases && p.skills.databases.length > 0 && (
              <p><strong className="text-slate-900">Databases:</strong> {p.skills.databases.join(", ")}</p>
            )}
            {p.skills.cloud && p.skills.cloud.length > 0 && (
              <p><strong className="text-slate-900">Cloud/DevOps:</strong> {p.skills.cloud.join(", ")}</p>
            )}
          </div>
        </section>
      )}

      {/* Education */}
      {p.education && p.education.length > 0 && (
        <section>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-purple-600 rounded-sm inline-block" />
            Education
          </h2>
          <div className="space-y-1.5 text-xs text-slate-700">
            {p.education.map((edu: any, idx: number) => (
              <div key={edu.id || idx} className="flex justify-between">
                <span><strong>{edu.degree}</strong> in {edu.field || "Computer Science"} — {edu.institution}</span>
                <span className="text-slate-500 text-[10px]">{edu.endDate}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
