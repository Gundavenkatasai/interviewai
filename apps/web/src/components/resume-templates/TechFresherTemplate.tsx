import React from "react";
import { IStructuredResume } from "../../types/resume-schema";

interface Props {
  resume: IStructuredResume;
}

export const TechFresherTemplate: React.FC<Props> = ({ resume }) => {
  const { basics, summary, skills, projects, education, certifications, achievements, training } = resume;

  const displayProjects = (projects || []).slice(0, 2);
  const displayEducation = (education || []).slice(0, 2);
  const displayCerts = (certifications || []).slice(0, 3);
  const displayAchievements = (achievements || []).slice(0, 2);

  return (
    <div className="w-full bg-white text-[#111827] font-sans text-[9.5pt] leading-snug p-6 sm:p-8 print:p-0 print:text-[9.5pt] max-w-4xl mx-auto space-y-3">
      {/* ── Header ── */}
      <header className="text-center border-b border-gray-300 pb-2 space-y-1">
        <h1 className="text-2xl font-serif font-bold tracking-tight text-gray-900 uppercase">
          {basics.name}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-xs text-gray-700 font-mono">
          {basics.phone && <span>{basics.phone}</span>}
          {basics.email && (
            <>
              <span className="text-gray-400">|</span>
              <a href={`mailto:${basics.email}`} className="text-blue-700 hover:underline">
                {basics.email}
              </a>
            </>
          )}
          {basics.links?.map((link, idx) => (
            <React.Fragment key={idx}>
              <span className="text-gray-400">|</span>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                {link.label}
              </a>
            </React.Fragment>
          ))}
          {basics.location && (
            <>
              <span className="text-gray-400">|</span>
              <span>{basics.location}</span>
            </>
          )}
        </div>
      </header>

      {/* ── Summary ── */}
      {summary && (
        <section className="space-y-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5">
            Professional Summary
          </h2>
          <p className="text-[9pt] leading-normal text-gray-800 text-justify">{summary}</p>
        </section>
      )}

      {/* ── Technical Skills (Front-Loaded for Freshers) ── */}
      {skills?.length > 0 && (
        <section className="space-y-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5">
            Technical Skills
          </h2>
          <div className="text-[9pt] text-gray-800 space-y-0.5 pt-0.5">
            {skills.map((cat, idx) => (
              <div key={idx} className="flex flex-wrap items-baseline gap-1">
                <span className="font-bold text-gray-900 min-w-[125px]">{cat.category}:</span>
                <span className="text-gray-800">{cat.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Key Technical Projects (Strictly Top 2 Relevant Projects) ── */}
      {displayProjects.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5">
            Key Technical Projects
          </h2>
          <div className="space-y-2">
            {displayProjects.map((proj, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex flex-wrap items-baseline justify-between text-xs gap-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-[10pt]">{proj.name}</span>
                    {proj.githubUrl && (
                      <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-blue-700 font-mono text-[10px] hover:underline">
                        [Source]
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-blue-700 font-mono text-[10px] hover:underline">
                        [Live Demo]
                      </a>
                    )}
                  </div>
                  {(proj.startDate || proj.endDate) && (
                    <span className="font-mono text-[10px] text-gray-600 shrink-0">
                      {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ""}
                    </span>
                  )}
                </div>

                {proj.technologies?.length > 0 && (
                  <div className="text-[8.5pt] font-mono text-gray-600">
                    <span className="font-semibold text-gray-800">Stack:</span> {proj.technologies.join(", ")}
                  </div>
                )}

                {proj.bullets?.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-gray-800 leading-snug">
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5">
            Education
          </h2>
          <div className="space-y-1.5">
            {displayEducation.map((edu, idx) => (
              <div key={idx} className="space-y-0.5 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-gray-900">{edu.institution}</span>
                  <span className="font-mono text-[10px] text-gray-600">
                    {edu.startDate ? `${edu.startDate} – ` : ""}{edu.endDate || ""}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-gray-700 italic text-[9pt]">
                  <span>{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}</span>
                  {edu.gpa && <span className="font-mono text-[9pt] not-italic text-gray-900 font-semibold">Score: {edu.gpa}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Certifications & Technical Training ── */}
      {((displayCerts.length > 0) || (training && training.length > 0)) && (
        <section className="space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5">
            Certifications & Technical Training
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-gray-800">
            {displayCerts.map((c, idx) => (
              <li key={`cert-${idx}`}>
                <span className="font-semibold text-gray-900">{c.name}</span> — <span>{c.issuer}</span>
                {c.date && <span className="font-mono text-gray-600 text-[8.5pt]"> ({c.date})</span>}
              </li>
            ))}
            {training?.slice(0, 1).map((t, idx) => (
              <li key={`trn-${idx}`}>
                <span className="font-semibold text-gray-900">{t.title}</span>
                {t.bullets?.length > 0 && (
                  <span className="text-gray-700"> — {t.bullets.slice(0, 2).join("; ")}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Honors & Achievements ── */}
      {displayAchievements.length > 0 && (
        <section className="space-y-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-0.5">
            Honors & Achievements
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-gray-800">
            {displayAchievements.map((ach, idx) => (
              <li key={idx}>
                <span className="text-gray-900">{ach.description || ach.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
