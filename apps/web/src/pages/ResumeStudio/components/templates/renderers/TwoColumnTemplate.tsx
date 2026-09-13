import React from "react";

interface TemplateProps {
  resume: any;
  paperSize?: "a4" | "letter";
}

export const TwoColumnTemplate: React.FC<TemplateProps> = ({ resume }) => {
  const p = resume?.profileData || {};
  const personal = p.personal || {};

  return (
    <div className="w-full text-slate-800 font-sans leading-normal p-0 text-xs bg-white flex min-h-[297mm]">
      {/* Left Sidebar Column (35%) */}
      <div className="w-[35%] bg-slate-50 border-r border-slate-200 p-6 sm:p-8 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Candidate Name & Title */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight">
              {personal.fullName || "Your Full Name"}
            </h1>
            {personal.professionalTitle && (
              <p className="text-xs font-bold text-indigo-600 mt-1 uppercase tracking-wider">
                {personal.professionalTitle}
              </p>
            )}
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-200 pb-1">
              Contact
            </h3>
            <div className="space-y-1.5 text-[11px] text-slate-600 break-words">
              {personal.email && <div><span className="font-semibold text-slate-800 block text-[9px] uppercase">Email</span>{personal.email}</div>}
              {personal.phone && <div><span className="font-semibold text-slate-800 block text-[9px] uppercase">Phone</span>{personal.phone}</div>}
              {personal.location && <div><span className="font-semibold text-slate-800 block text-[9px] uppercase">Location</span>{personal.location}</div>}
              {personal.linkedin && <div><span className="font-semibold text-slate-800 block text-[9px] uppercase">LinkedIn</span><span className="text-indigo-600">{personal.linkedin}</span></div>}
              {personal.github && <div><span className="font-semibold text-slate-800 block text-[9px] uppercase">GitHub</span>{personal.github}</div>}
            </div>
          </div>

          {/* Skills Column */}
          {p.skills && (
            <div>
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-200 pb-1">
                Skills & Tech
              </h3>
              <div className="space-y-2 text-[11px] text-slate-700">
                {p.skills.languages && p.skills.languages.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-900 block text-[10px]">Languages</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {p.skills.languages.map((l: string, i: number) => (
                        <span key={i} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">{l}</span>
                      ))}
                    </div>
                  </div>
                )}
                {p.skills.frameworks && p.skills.frameworks.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-900 block text-[10px]">Frameworks</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {p.skills.frameworks.map((f: string, i: number) => (
                        <span key={i} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
                {p.skills.databases && p.skills.databases.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-900 block text-[10px]">Databases</span>
                    <p className="text-[10px] text-slate-600">{p.skills.databases.join(", ")}</p>
                  </div>
                )}
                {p.skills.cloud && p.skills.cloud.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-900 block text-[10px]">Cloud & DevOps</span>
                    <p className="text-[10px] text-slate-600">{p.skills.cloud.join(", ")}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Education Column */}
          {p.education && p.education.length > 0 && (
            <div>
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-200 pb-1">
                Education
              </h3>
              <div className="space-y-2 text-[11px]">
                {p.education.map((edu: any, idx: number) => (
                  <div key={edu.id || idx}>
                    <p className="font-bold text-slate-900 leading-tight">{edu.degree} {edu.field ? `in ${edu.field}` : ""}</p>
                    <p className="text-slate-600 text-[10px]">{edu.institution}</p>
                    <p className="text-slate-400 text-[9px]">{edu.endDate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Content Column (65%) */}
      <div className="w-[65%] p-6 sm:p-8 space-y-6">
        {/* Summary */}
        {p.summary && (
          <section>
            <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-2">
              Profile Summary
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">{p.summary}</p>
          </section>
        )}

        {/* Experience */}
        {p.experience && p.experience.length > 0 && (
          <section>
            <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-3">
              Work Experience
            </h2>
            <div className="space-y-4">
              {p.experience.map((exp: any, idx: number) => (
                <div key={exp.id || idx}>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-950">{exp.role} <span className="text-indigo-600">@ {exp.company}</span></span>
                    <span className="text-[10px] text-slate-400">{exp.startDate} – {exp.endDate || (exp.current ? "Present" : "")}</span>
                  </div>
                  {exp.description && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{exp.description}</p>}
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
            <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1 mb-3">
              Projects
            </h2>
            <div className="space-y-3">
              {p.projects.map((proj: any, idx: number) => (
                <div key={proj.id || idx}>
                  <div className="flex justify-between items-baseline text-xs font-bold text-slate-900">
                    <span>{proj.name}</span>
                    {proj.url && <span className="text-[10px] text-indigo-600">{proj.url}</span>}
                  </div>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">[{proj.technologies.join(", ")}]</p>
                  )}
                  {proj.description && <p className="text-xs text-slate-600 mt-0.5">{proj.description}</p>}
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
      </div>
    </div>
  );
};
