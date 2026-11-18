import React from "react";
import { IStructuredResume } from "../../types/resume-schema";

interface Props {
  resume: IStructuredResume;
}

export const ClassicAtsTemplate: React.FC<Props> = ({ resume }) => {
  const { basics, summary, skills, experience, projects, education, certifications, achievements } = resume;

  const displayProjects = (projects || []).slice(0, 2);
  const displayEducation = (education || []).slice(0, 2);
  const displayCerts = (certifications || []).slice(0, 3);
  const displayAchievements = (achievements || []).slice(0, 2);

  return (
    <div className="w-full bg-white text-black font-serif text-[9.5pt] leading-snug p-6 sm:p-8 print:p-0 print:text-[9.5pt] max-w-4xl mx-auto space-y-3">
      {/* ── Classic Centered Header ── */}
      <header className="text-center border-b-2 border-black pb-1.5 space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight uppercase text-black">
          {basics.name}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-x-2 text-xs font-sans text-gray-800">
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
              <a href={`mailto:${basics.email}`} className="text-black underline">
                {basics.email}
              </a>
            </>
          )}
          {basics.links?.map((link, idx) => (
            <React.Fragment key={idx}>
              <span>•</span>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-black underline">
                {link.label}
              </a>
            </React.Fragment>
          ))}
        </div>
      </header>

      {/* ── Summary ── */}
      {summary && (
        <section className="space-y-0.5">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
            Professional Summary
          </h2>
          <p className="text-[9pt] leading-normal text-gray-900 text-justify">{summary}</p>
        </section>
      )}

      {/* ── Experience (if present) ── */}
      {experience?.length > 0 && (
        <section className="space-y-1.5">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
            Professional Experience
          </h2>
          <div className="space-y-1.5">
            {experience.slice(0, 2).map((exp, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-black">{exp.role}</span>
                  <span className="text-gray-700 italic font-sans text-[9pt]">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs text-gray-800 italic">
                  <span>{exp.company}</span>
                  {exp.location && <span>{exp.location}</span>}
                </div>
                {exp.bullets?.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-gray-900 leading-snug">
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

      {/* ── Technical Skills ── */}
      {skills?.length > 0 && (
        <section className="space-y-0.5">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
            Technical Skills
          </h2>
          <div className="text-[9pt] text-gray-900 space-y-0.5 font-sans">
            {skills.map((cat, idx) => (
              <div key={idx} className="flex flex-wrap items-baseline gap-1">
                <span className="font-bold text-black min-w-[125px]">{cat.category}:</span>
                <span>{cat.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Key Technical Projects (Strictly Top 2 Relevant Projects) ── */}
      {displayProjects.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
            Technical Projects
          </h2>
          <div className="space-y-2">
            {displayProjects.map((proj, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-xs">
                  <div>
                    <span className="font-bold text-black text-[10pt]">{proj.name}</span>
                    {proj.githubUrl && (
                      <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-blue-900 font-sans text-[8.5pt] ml-1.5 underline">
                        [Source]
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-blue-900 font-sans text-[8.5pt] ml-1 underline">
                        [Demo]
                      </a>
                    )}
                  </div>
                  {(proj.startDate || proj.endDate) && (
                    <span className="text-gray-700 italic font-sans text-[9pt]">
                      {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ""}
                    </span>
                  )}
                </div>

                {proj.technologies?.length > 0 && (
                  <div className="text-[8.5pt] font-sans text-gray-700">
                    <span className="font-semibold text-black">Technologies:</span> {proj.technologies.join(", ")}
                  </div>
                )}

                {proj.bullets?.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-gray-900 leading-snug">
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
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
            Education
          </h2>
          <div className="space-y-1.5">
            {displayEducation.map((edu, idx) => (
              <div key={idx} className="space-y-0.5 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-black">{edu.institution}</span>
                  <span className="text-gray-700 italic font-sans text-[9pt]">
                    {edu.startDate ? `${edu.startDate} – ` : ""}{edu.endDate || ""}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-gray-800 text-[9pt]">
                  <span>{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}</span>
                  {edu.gpa && <span className="font-sans font-bold text-black">Score: {edu.gpa}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Certifications & Awards ── */}
      {displayCerts.length > 0 && (
        <section className="space-y-0.5">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
            Certifications
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-gray-900">
            {displayCerts.map((c, idx) => (
              <li key={idx}>
                <span className="font-bold">{c.name}</span> — <span>{c.issuer}</span>
                {c.date && <span className="font-sans text-[8.5pt] text-gray-600"> ({c.date})</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Achievements ── */}
      {displayAchievements.length > 0 && (
        <section className="space-y-0.5">
          <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-black border-b border-black pb-0.5">
            Achievements
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-0.5 text-[9pt] text-gray-900">
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
