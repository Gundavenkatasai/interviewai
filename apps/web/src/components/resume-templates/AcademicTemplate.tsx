import React from "react";
import { IStructuredResume } from "../../types/resume-schema";

interface Props {
  resume: IStructuredResume;
}

export const AcademicTemplate: React.FC<Props> = ({ resume }) => {
  const { basics, summary, skills, education, projects, publications, certifications, achievements, experience } = resume;

  const displayProjects = (projects || []).slice(0, 2);
  const displayEducation = (education || []).slice(0, 2);
  const displayCerts = (certifications || []).slice(0, 3);
  const displayAchievements = (achievements || []).slice(0, 2);

  return (
    <div className="w-full bg-white text-slate-900 font-serif text-[9.5pt] leading-snug p-6 sm:p-8 print:p-0 print:text-[9.5pt] max-w-4xl mx-auto space-y-3">
      {/* ── Header ── */}
      <header className="text-center border-b border-slate-400 pb-2 space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
          {basics.name}
        </h1>
        {basics.title && (
          <p className="text-xs font-sans italic text-slate-700">
            {basics.title}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-2 text-xs font-sans text-slate-700 pt-0.5">
          {basics.location && <span>{basics.location}</span>}
          {basics.phone && (
            <>
              <span>•</span>
              <span>{basics.phone}</span>
            </>
          )}
          {basics.email && (
            <>
              <span>•</span>
              <a href={`mailto:${basics.email}`} className="text-blue-900 hover:underline">
                {basics.email}
              </a>
            </>
          )}
          {basics.links?.map((link, idx) => (
            <React.Fragment key={idx}>
              <span>•</span>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline">
                {link.label}
              </a>
            </React.Fragment>
          ))}
        </div>
      </header>

      {/* ── Research Summary / Objective ── */}
      {summary && (
        <section className="space-y-0.5">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Research Interests & Objective
          </h2>
          <p className="text-[9pt] leading-normal text-slate-800 text-justify">{summary}</p>
        </section>
      )}

      {/* ── Education (Front-Loaded for Academic) ── */}
      {displayEducation.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Education & Academic Credentials
          </h2>
          <div className="space-y-1.5">
            {displayEducation.map((edu, idx) => (
              <div key={idx} className="space-y-0.5 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">{edu.institution}</span>
                  <span className="font-sans text-[9pt] text-slate-600">
                    {edu.startDate ? `${edu.startDate} – ` : ""}{edu.endDate || ""}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-slate-800 italic text-[9pt]">
                  <span>{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}</span>
                  {edu.gpa && (
                    <span className="font-sans font-bold not-italic text-slate-900">
                      Score: {edu.gpa}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Publications (if present) ── */}
      {publications && publications.length > 0 && (
        <section className="space-y-0.5">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Publications & Papers
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-slate-800">
            {publications.slice(0, 2).map((pub: any, idx: number) => (
              <li key={idx}>
                <span className="font-bold">{pub.title}</span>.{" "}
                <span className="italic">{pub.publisher || pub.journal}</span>
                {pub.date && <span> ({pub.date})</span>}.
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Key Technical Projects (Strictly Top 2) ── */}
      {displayProjects.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Research & Technical Projects
          </h2>
          <div className="space-y-2">
            {displayProjects.map((proj, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex flex-wrap items-baseline justify-between text-xs gap-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-[10pt]">{proj.name}</span>
                    {proj.githubUrl && (
                      <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-blue-900 font-sans text-[8.5pt] underline">
                        [Repository]
                      </a>
                    )}
                  </div>
                  {(proj.startDate || proj.endDate) && (
                    <span className="font-sans text-[9pt] text-slate-600 shrink-0">
                      {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ""}
                    </span>
                  )}
                </div>

                {proj.technologies?.length > 0 && (
                  <div className="text-[8.5pt] font-sans text-slate-700">
                    <span className="font-semibold text-slate-900">Methodology & Tooling: </span>
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

      {/* ── Technical Skills ── */}
      {skills?.length > 0 && (
        <section className="space-y-0.5">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Technical & Research Proficiencies
          </h2>
          <div className="text-[9pt] text-slate-800 space-y-0.5 font-sans">
            {skills.map((cat, idx) => (
              <div key={idx} className="flex flex-wrap items-baseline gap-1">
                <span className="font-bold text-slate-900 min-w-[125px]">{cat.category}:</span>
                <span>{cat.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Experience (if any) ── */}
      {experience?.length > 0 && (
        <section className="space-y-1.5">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Experience
          </h2>
          <div className="space-y-1.5">
            {experience.slice(0, 1).map((exp, idx) => (
              <div key={idx} className="space-y-0.5 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">{exp.role}</span>
                  <span className="font-sans text-[9pt] text-slate-600">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                  </span>
                </div>
                <div className="italic text-slate-700 text-[9pt]">{exp.company}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Certifications ── */}
      {displayCerts.length > 0 && (
        <section className="space-y-0.5">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Certifications & Training
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-slate-800 font-sans">
            {displayCerts.map((cert, idx) => (
              <li key={idx}>
                <span className="font-bold text-slate-900">{cert.name}</span>
                {cert.issuer && <span> — {cert.issuer}</span>}
                {cert.date && <span className="text-slate-600 text-[8.5pt]"> ({cert.date})</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Honors & Achievements ── */}
      {displayAchievements.length > 0 && (
        <section className="space-y-0.5">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Honors & Fellowships
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-slate-800 font-sans">
            {displayAchievements.map((ach, idx) => (
              <li key={idx}>
                <span className="font-bold text-slate-900">{ach.title}</span>
                {ach.description && <span> — {ach.description}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
