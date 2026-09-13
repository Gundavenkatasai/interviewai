import React from "react";

interface TemplateProps {
  resume: any;
  paperSize?: "a4" | "letter";
}

export const ExecutiveTemplate: React.FC<TemplateProps> = ({ resume }) => {
  const p = resume?.profileData || {};
  const personal = p.personal || {};

  return (
    <div className="w-full text-slate-900 font-sans leading-normal p-0 text-xs bg-white">
      {/* Header Band */}
      <div className="bg-slate-900 text-white p-8 sm:p-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase">
              {personal.fullName || "Candidate Name"}
            </h1>
            {personal.professionalTitle && (
              <p className="text-xs tracking-widest text-indigo-300 uppercase mt-1 font-semibold">
                {personal.professionalTitle}
              </p>
            )}
          </div>
          <div className="text-right text-[11px] text-slate-300 space-y-0.5 sm:border-l sm:border-slate-700 sm:pl-6">
            {personal.email && <div>{personal.email}</div>}
            {personal.phone && <div>{personal.phone}</div>}
            {personal.location && <div>{personal.location}</div>}
            {personal.linkedin && <div className="text-indigo-300">{personal.linkedin}</div>}
          </div>
        </div>
      </div>

      <div className="p-8 sm:p-10 space-y-6">
        {/* Executive Summary */}
        {p.summary && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 pb-1 mb-2 border-b-2 border-slate-900">
              Executive Profile
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed text-justify">{p.summary}</p>
          </section>
        )}

        {/* Experience */}
        {p.experience && p.experience.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 pb-1 mb-3 border-b-2 border-slate-900">
              Professional Leadership & Experience
            </h2>
            <div className="space-y-4">
              {p.experience.map((exp: any, idx: number) => (
                <div key={exp.id || idx}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-950">
                      {exp.role} <span className="font-semibold text-indigo-800">| {exp.company}</span>
                    </span>
                    <span className="text-[11px] font-medium text-slate-600">
                      {exp.startDate} – {exp.endDate || (exp.current ? "Present" : "")}
                    </span>
                  </div>
                  {exp.location && <p className="text-[10px] text-slate-500">{exp.location}</p>}
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
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 pb-1 mb-3 border-b-2 border-slate-900">
              Key Strategic Projects & Deliverables
            </h2>
            <div className="space-y-3">
              {p.projects.map((proj: any, idx: number) => (
                <div key={proj.id || idx}>
                  <div className="flex justify-between items-baseline text-xs font-bold text-slate-900">
                    <span>{proj.name}</span>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <span className="text-[10px] text-slate-600 font-normal">Tech: {proj.technologies.join(", ")}</span>
                    )}
                  </div>
                  {proj.description && <p className="text-xs text-slate-700 mt-0.5">{proj.description}</p>}
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

        {/* Core Competencies */}
        {p.skills && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 pb-1 mb-2 border-b-2 border-slate-900">
              Core Competencies & Technology Architecture
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
                <p><strong className="text-slate-900">Cloud/Platforms:</strong> {p.skills.cloud.join(", ")}</p>
              )}
            </div>
          </section>
        )}

        {/* Education */}
        {p.education && p.education.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 pb-1 mb-2 border-b-2 border-slate-900">
              Education & Credentials
            </h2>
            <div className="space-y-1.5 text-xs text-slate-700">
              {p.education.map((edu: any, idx: number) => (
                <div key={edu.id || idx} className="flex justify-between">
                  <span><strong>{edu.degree}</strong> {edu.field ? `in ${edu.field}` : ""} — {edu.institution}</span>
                  <span className="text-slate-500">{edu.endDate}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
