import React from "react";

interface TemplateProps {
  resume: any;
  paperSize?: "a4" | "letter";
}

export const ATSClassicTemplate: React.FC<TemplateProps> = ({ resume }) => {
  const p = resume?.profileData || {};
  const personal = p.personal || {};

  return (
    <div className="w-full text-slate-900 font-serif leading-normal p-8 sm:p-12 text-sm bg-white">
      {/* Header */}
      <div className="text-center border-b border-slate-300 pb-4 mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-slate-900">
          {personal.fullName || "Your Full Name"}
        </h1>
        {personal.professionalTitle && (
          <p className="text-sm font-semibold text-slate-700 mt-1 uppercase tracking-wide">
            {personal.professionalTitle}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-2 font-sans">
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>• {personal.phone}</span>}
          {personal.location && <span>• {personal.location}</span>}
          {personal.linkedin && <span>• {personal.linkedin}</span>}
          {personal.github && <span>• {personal.github}</span>}
          {personal.portfolio && <span>• {personal.portfolio}</span>}
        </div>
      </div>

      {/* Summary */}
      {p.summary && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-xs text-slate-800 leading-relaxed text-justify font-sans">{p.summary}</p>
        </section>
      )}

      {/* Experience */}
      {p.experience && p.experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2.5">
            Professional Experience
          </h2>
          <div className="space-y-4 font-sans">
            {p.experience.map((exp: any, idx: number) => (
              <div key={exp.id || idx}>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs font-bold text-slate-900">
                  <span>
                    {exp.role || "Role"} <span className="font-normal text-slate-700">— {exp.company || "Company"}</span>
                    {exp.location && <span className="font-normal text-slate-500"> ({exp.location})</span>}
                  </span>
                  <span className="text-[11px] font-medium text-slate-600 sm:text-right">
                    {exp.startDate || ""} – {exp.endDate || (exp.current ? "Present" : "")}
                  </span>
                </div>
                {exp.description && (
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">{exp.description}</p>
                )}
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
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2.5">
            Key Projects
          </h2>
          <div className="space-y-3 font-sans">
            {p.projects.map((proj: any, idx: number) => (
              <div key={proj.id || idx}>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs font-bold text-slate-900">
                  <span>
                    {proj.name || "Project Name"}
                    {proj.technologies && proj.technologies.length > 0 && (
                      <span className="font-normal text-slate-600"> [{proj.technologies.join(", ")}]</span>
                    )}
                  </span>
                  {proj.url && (
                    <span className="text-[11px] font-normal text-indigo-700">{proj.url}</span>
                  )}
                </div>
                {proj.description && (
                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{proj.description}</p>
                )}
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-1 text-xs text-slate-700">
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
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
            Technical Skills & Competencies
          </h2>
          <div className="space-y-1 text-xs text-slate-800 font-sans">
            {p.skills.languages && p.skills.languages.length > 0 && (
              <p><span className="font-semibold text-slate-900">Languages:</span> {p.skills.languages.join(", ")}</p>
            )}
            {p.skills.frameworks && p.skills.frameworks.length > 0 && (
              <p><span className="font-semibold text-slate-900">Frameworks & Libraries:</span> {p.skills.frameworks.join(", ")}</p>
            )}
            {p.skills.databases && p.skills.databases.length > 0 && (
              <p><span className="font-semibold text-slate-900">Databases:</span> {p.skills.databases.join(", ")}</p>
            )}
            {p.skills.cloud && p.skills.cloud.length > 0 && (
              <p><span className="font-semibold text-slate-900">Cloud & DevOps:</span> {p.skills.cloud.join(", ")}</p>
            )}
            {p.skills.tools && p.skills.tools.length > 0 && (
              <p><span className="font-semibold text-slate-900">Tools:</span> {p.skills.tools.join(", ")}</p>
            )}
            {p.skills.technical && p.skills.technical.length > 0 && (
              <p><span className="font-semibold text-slate-900">Core Technical:</span> {p.skills.technical.join(", ")}</p>
            )}
          </div>
        </section>
      )}

      {/* Education */}
      {p.education && p.education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2.5">
            Education
          </h2>
          <div className="space-y-2 font-sans">
            {p.education.map((edu: any, idx: number) => (
              <div key={edu.id || idx} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{edu.degree || "Degree"} {edu.field ? `in ${edu.field}` : ""}</span>
                  <span className="text-slate-700"> — {edu.institution || "Institution"}</span>
                  {edu.gpa && <span className="text-slate-500 text-[11px]"> (GPA: {edu.gpa})</span>}
                </div>
                <span className="text-[11px] font-medium text-slate-600 sm:text-right">{edu.endDate || ""}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {p.certifications && p.certifications.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
            Certifications
          </h2>
          <div className="space-y-1 text-xs text-slate-800 font-sans">
            {p.certifications.map((cert: any, idx: number) => (
              <div key={cert.id || idx} className="flex justify-between">
                <span><span className="font-semibold">{cert.name}</span> — {cert.issuer}</span>
                <span className="text-slate-500 text-[11px]">{cert.date}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
