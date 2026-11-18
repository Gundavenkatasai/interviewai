import React from "react";
import { IStructuredResume } from "../../types/resume-schema";

interface Props {
  resume: IStructuredResume;
}

export const ExperiencedProfTemplate: React.FC<Props> = ({ resume }) => {
  const { basics, summary, skills, experience, projects, education, certifications, achievements } = resume;

  const displayProjects = (projects || []).slice(0, 2);
  const displayEducation = (education || []).slice(0, 2);
  const displayCerts = (certifications || []).slice(0, 3);
  const displayAchievements = (achievements || []).slice(0, 2);

  return (
    <div className="w-full bg-white text-gray-900 font-sans text-[9.5pt] leading-snug p-6 sm:p-8 print:p-0 print:text-[9.5pt] max-w-4xl mx-auto space-y-3">
      {/* ── Header ── */}
      <header className="border-b-2 border-slate-800 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight uppercase">
              {basics.name}
            </h1>
            {basics.title && (
              <p className="text-xs font-semibold text-slate-700 tracking-wider uppercase">
                {basics.title}
              </p>
            )}
          </div>
          <div className="text-xs text-slate-600 sm:text-right font-mono space-y-0.5">
            {basics.location && <div>{basics.location}</div>}
            <div className="flex flex-wrap items-center sm:justify-end gap-x-2">
              {basics.phone && <span>{basics.phone}</span>}
              {basics.email && (
                <>
                  <span className="text-slate-300">|</span>
                  <a href={`mailto:${basics.email}`} className="text-blue-800 hover:underline">
                    {basics.email}
                  </a>
                </>
              )}
            </div>
            {basics.links && basics.links.length > 0 && (
              <div className="flex flex-wrap items-center sm:justify-end gap-x-2 pt-0.5">
                {basics.links.map((link, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-300">|</span>}
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:underline">
                      {link.label}
                    </a>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Executive Summary ── */}
      {summary && (
        <section className="space-y-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Executive Summary
          </h2>
          <p className="text-[9pt] leading-normal text-slate-800 text-justify font-sans">{summary}</p>
        </section>
      )}

      {/* ── Professional Experience ── */}
      {experience?.length > 0 && (
        <section className="space-y-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Professional Experience
          </h2>
          <div className="space-y-1.5">
            {experience.slice(0, 2).map((exp, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-slate-900 text-[10pt]">{exp.role}</span>
                  <span className="font-mono text-[9pt] text-slate-600 shrink-0 font-medium">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs text-slate-700 italic">
                  <span className="font-semibold text-slate-800">{exp.company}</span>
                  {exp.location && <span>{exp.location}</span>}
                </div>
                {exp.bullets?.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-slate-800 leading-snug">
                    {exp.bullets.slice(0, 2).map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Key Technical Projects (Strictly Top 2) ── */}
      {displayProjects.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Key Technical Projects
          </h2>
          <div className="space-y-2">
            {displayProjects.map((proj, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex flex-wrap items-baseline justify-between text-xs gap-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-[10pt]">{proj.name}</span>
                    {proj.githubUrl && (
                      <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-blue-800 font-mono text-[9pt] hover:underline">
                        [Source]
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-blue-800 font-mono text-[9pt] hover:underline">
                        [Demo]
                      </a>
                    )}
                  </div>
                  {(proj.startDate || proj.endDate) && (
                    <span className="font-mono text-[9pt] text-slate-600 shrink-0">
                      {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ""}
                    </span>
                  )}
                </div>

                {proj.technologies?.length > 0 && (
                  <div className="text-[8.5pt] font-mono text-slate-700">
                    <span className="font-semibold text-slate-900">Environment: </span>
                    {proj.technologies.join(", ")}
                  </div>
                )}

                {proj.bullets?.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-slate-800 leading-snug">
                    {proj.bullets.slice(0, 2).map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Core Competencies / Technical Skills ── */}
      {skills?.length > 0 && (
        <section className="space-y-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Core Competencies & Toolchain
          </h2>
          <div className="text-[9pt] text-slate-800 space-y-0.5">
            {skills.map((cat, idx) => (
              <div key={idx} className="flex flex-wrap items-baseline gap-1">
                <span className="font-bold text-slate-900 min-w-[125px]">{cat.category}:</span>
                <span>{cat.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Education ── */}
      {displayEducation.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Education
          </h2>
          <div className="space-y-1">
            {displayEducation.map((edu, idx) => (
              <div key={idx} className="space-y-0.5 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">{edu.institution}</span>
                  <span className="font-mono text-[9pt] text-slate-600">
                    {edu.startDate ? `${edu.startDate} – ` : ""}{edu.endDate || ""}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-slate-700 text-[9pt]">
                  <span>{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}</span>
                  {edu.gpa && (
                    <span className="font-mono text-slate-900 font-bold">
                      Grade: {edu.gpa}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Certifications ── */}
      {displayCerts.length > 0 && (
        <section className="space-y-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Certifications
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-slate-800">
            {displayCerts.map((cert, idx) => (
              <li key={idx}>
                <span className="font-bold text-slate-900">{cert.name}</span>
                {cert.issuer && <span> — {cert.issuer}</span>}
                {cert.date && <span className="font-mono text-[8.5pt] text-slate-600"> ({cert.date})</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Achievements ── */}
      {displayAchievements.length > 0 && (
        <section className="space-y-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Achievements
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-slate-800">
            {displayAchievements.map((ach, idx) => (
              <li key={idx}>
                <span>{ach.description || ach.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
