import React from "react";
import { IStructuredResume } from "../../types/resume-schema";

interface Props {
  resume: IStructuredResume;
}

export const ModernMinimalTemplate: React.FC<Props> = ({ resume }) => {
  const { basics, summary, skills, experience, projects, education, certifications, achievements } = resume;

  const displayProjects = (projects || []).slice(0, 2);
  const displayEducation = (education || []).slice(0, 2);
  const displayCerts = (certifications || []).slice(0, 3);
  const displayAchievements = (achievements || []).slice(0, 2);

  return (
    <div className="w-full bg-white text-zinc-900 font-sans text-[9.5pt] leading-snug p-6 sm:p-8 print:p-0 print:text-[9.5pt] max-w-4xl mx-auto space-y-3">
      {/* ── Header ── */}
      <header className="border-b border-zinc-200 pb-2 space-y-1">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              {basics.name}
            </h1>
            {basics.title && (
              <p className="text-xs font-medium text-zinc-600 tracking-wide">
                {basics.title}
              </p>
            )}
          </div>
          {basics.location && (
            <span className="text-xs text-zinc-500 font-mono">
              {basics.location}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-zinc-600">
          {basics.email && (
            <a href={`mailto:${basics.email}`} className="text-zinc-900 hover:underline">
              {basics.email}
            </a>
          )}
          {basics.phone && (
            <>
              <span className="text-zinc-300">•</span>
              <span>{basics.phone}</span>
            </>
          )}
          {basics.links?.map((link, idx) => (
            <React.Fragment key={idx}>
              <span className="text-zinc-300">•</span>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-zinc-900 hover:underline font-mono text-[11px]">
                {link.label}
              </a>
            </React.Fragment>
          ))}
        </div>
      </header>

      {/* ── Summary ── */}
      {summary && (
        <section className="space-y-0.5">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
            Executive Summary
          </h2>
          <p className="text-[9pt] text-zinc-800 leading-normal text-justify">{summary}</p>
        </section>
      )}

      {/* ── Experience (if present) ── */}
      {experience?.length > 0 && (
        <section className="space-y-1.5">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-200 pb-0.5">
            Professional Experience
          </h2>
          <div className="space-y-1.5">
            {experience.slice(0, 2).map((exp, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex flex-wrap justify-between items-baseline text-xs">
                  <div>
                    <span className="font-bold text-zinc-900">{exp.role}</span>
                    <span className="text-zinc-500"> — {exp.company}</span>
                  </div>
                  <span className="text-zinc-500 font-mono text-[9pt]">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                  </span>
                </div>
                {exp.bullets?.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-zinc-800 leading-snug">
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

      {/* ── Core Competencies / Skills ── */}
      {skills?.length > 0 && (
        <section className="space-y-0.5">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-200 pb-0.5">
            Technical Competencies
          </h2>
          <div className="space-y-0.5 text-[9pt] text-zinc-800">
            {skills.map((cat, idx) => (
              <div key={idx} className="flex flex-wrap items-baseline gap-1">
                <span className="font-semibold text-zinc-900 min-w-[125px]">{cat.category}:</span>
                <span className="text-zinc-700">{cat.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Projects (Strictly Top 2 Relevant Projects) ── */}
      {displayProjects.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-200 pb-0.5">
            Key Projects & Systems
          </h2>
          <div className="space-y-2">
            {displayProjects.map((proj, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex flex-wrap justify-between items-baseline text-xs gap-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-bold text-zinc-900 text-[10pt]">{proj.name}</span>
                    {proj.githubUrl && (
                      <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-black font-mono text-[9pt] underline">
                        code
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-black font-mono text-[9pt] underline">
                        demo
                      </a>
                    )}
                  </div>
                  {(proj.startDate || proj.endDate) && (
                    <span className="font-mono text-[9pt] text-zinc-500 shrink-0">
                      {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ""}
                    </span>
                  )}
                </div>

                {proj.technologies?.length > 0 && (
                  <div className="text-[8.5pt] font-mono text-zinc-600">
                    <span className="font-medium text-zinc-800">Stack: </span>
                    {proj.technologies.join(" • ")}
                  </div>
                )}

                {proj.bullets?.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-zinc-800 leading-snug">
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

      {/* ── Education ── */}
      {displayEducation.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-200 pb-0.5">
            Education
          </h2>
          <div className="space-y-1">
            {displayEducation.map((edu, idx) => (
              <div key={idx} className="space-y-0.5 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-zinc-900">{edu.institution}</span>
                  <span className="text-zinc-500 font-mono text-[9pt]">
                    {edu.startDate ? `${edu.startDate} – ` : ""}{edu.endDate || ""}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-zinc-700 text-[9pt]">
                  <span>{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}</span>
                  {edu.gpa && (
                    <span className="font-mono text-zinc-900 font-semibold">
                      Score: {edu.gpa}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Certifications & Training ── */}
      {displayCerts.length > 0 && (
        <section className="space-y-0.5">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-200 pb-0.5">
            Certifications & Accreditations
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-zinc-800">
            {displayCerts.map((cert, idx) => (
              <li key={idx}>
                <span className="font-semibold text-zinc-900">{cert.name}</span>
                {cert.issuer && <span className="text-zinc-600"> — {cert.issuer}</span>}
                {cert.date && <span className="text-zinc-500 font-mono text-[8.5pt]"> ({cert.date})</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Achievements ── */}
      {displayAchievements.length > 0 && (
        <section className="space-y-0.5">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-200 pb-0.5">
            Key Achievements
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-zinc-800">
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
