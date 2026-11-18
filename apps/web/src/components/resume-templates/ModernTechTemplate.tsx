import React from "react";
import { IStructuredResume, LayoutDensity } from "../../types/resume-schema";
import { computeLayoutDensity, getDensityStyles } from "./density-config";

interface Props {
  resume: IStructuredResume;
  density?: LayoutDensity;
}

export const ModernTechTemplate: React.FC<Props> = ({ resume, density }) => {
  const { basics, summary, skills, experience, projects, education, certifications, achievements } = resume;

  const activeDensity = density || computeLayoutDensity(resume);
  const styles = getDensityStyles(activeDensity);

  const displayProjects = (projects || []).slice(0, 2);
  const displayEducation = (education || []).slice(0, 2);
  const displayCerts = (certifications || []).slice(0, 3);
  const displayAchievements = (achievements || []).slice(0, 2);

  return (
    <div
      className={`w-full h-full bg-white text-slate-900 font-sans box-border flex flex-col justify-between ${styles.pagePadding}`}
    >
      {/* ── Top & Main Content Block ── */}
      <div className={styles.sectionGap}>
        {/* ── Header ── */}
        <header className={`border-b-2 border-indigo-600 ${styles.headerBorder}`}>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <div>
              <h1 className={`font-extrabold text-slate-900 tracking-tight ${styles.headerName}`}>
                {basics.name}
              </h1>
              {basics.title && (
                <p className={`font-mono font-semibold text-indigo-700 tracking-wide ${styles.headerTitle}`}>
                  {basics.title}
                </p>
              )}
            </div>
            {basics.location && (
              <span className="text-xs text-slate-500 font-mono">
                {basics.location}
              </span>
            )}
          </div>

          <div className={`flex flex-wrap items-center font-mono text-slate-600 ${styles.headerContact}`}>
            {basics.email && (
              <a href={`mailto:${basics.email}`} className="text-indigo-600 hover:underline">
                {basics.email}
              </a>
            )}
            {basics.phone && (
              <>
                <span className="text-slate-300">/</span>
                <span>{basics.phone}</span>
              </>
            )}
            {basics.links?.map((link, idx) => (
              <React.Fragment key={idx}>
                <span className="text-slate-300">/</span>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  {link.label}
                </a>
              </React.Fragment>
            ))}
          </div>
        </header>

        {/* ── Summary ── */}
        {summary && (
          <section>
            <h2 className={`font-bold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-1.5 ${styles.sectionTitle}`}>
              <span className="w-1.5 h-3.5 bg-indigo-600 inline-block rounded-xs"></span>
              Profile Summary
            </h2>
            <p className={`text-slate-700 pl-3 text-justify ${styles.summaryText}`}>{summary}</p>
          </section>
        )}

        {/* ── Experience (if present) ── */}
        {experience?.length > 0 && (
          <section>
            <h2 className={`font-bold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-1.5 ${styles.sectionTitle}`}>
              <span className="w-1.5 h-3.5 bg-indigo-600 inline-block rounded-xs"></span>
              Engineering Experience
            </h2>
            <div className={`pl-3 ${styles.projectGap}`}>
              {experience.slice(0, 2).map((exp, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className={`font-bold text-slate-900 ${styles.projectTitle}`}>{exp.role}</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs text-indigo-700 font-medium">
                    <span>{exp.company}</span>
                    {exp.location && <span className="text-slate-500 font-mono text-[10px]">{exp.location}</span>}
                  </div>
                  {exp.bullets?.length > 0 && (
                    <ul className={`list-disc list-outside text-slate-700 ${styles.projectBullets}`}>
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
          <section>
            <h2 className={`font-bold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-1.5 ${styles.sectionTitle}`}>
              <span className="w-1.5 h-3.5 bg-indigo-600 inline-block rounded-xs"></span>
              Technical Toolchain & Proficiencies
            </h2>
            <div className={`pl-3 text-slate-800 ${styles.skillsContainer}`}>
              {skills.map((cat, idx) => (
                <div key={idx} className="flex flex-wrap items-baseline gap-1.5">
                  <span className={`text-slate-900 font-semibold ${styles.skillCategory}`}>{cat.category}:</span>
                  <span className="text-slate-700">{cat.items.join(", ")}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Featured Engineering Projects (Strictly Top 2) ── */}
        {displayProjects.length > 0 && (
          <section>
            <h2 className={`font-bold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-1.5 ${styles.sectionTitle}`}>
              <span className="w-1.5 h-3.5 bg-indigo-600 inline-block rounded-xs"></span>
              Featured Technical Projects
            </h2>
            <div className={`pl-3 ${styles.projectGap}`}>
              {displayProjects.map((proj, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex flex-wrap justify-between items-baseline gap-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`font-bold text-slate-900 ${styles.projectTitle}`}>{proj.name}</span>
                      {proj.githubUrl && (
                        <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-mono text-[10px] hover:underline">
                          [GitHub]
                        </a>
                      )}
                      {proj.liveUrl && (
                        <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-mono text-[10px] hover:underline">
                          [Live]
                        </a>
                      )}
                    </div>
                    {(proj.startDate || proj.endDate) && (
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">
                        {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ""}
                      </span>
                    )}
                  </div>

                  {proj.technologies?.length > 0 && (
                    <div className={`font-mono text-slate-600 ${styles.projectStack}`}>
                      <span className="font-semibold text-slate-800">Stack:</span> {proj.technologies.join(", ")}
                    </div>
                  )}

                  {proj.bullets?.length > 0 && (
                    <ul className={`list-disc list-outside text-slate-700 ${styles.projectBullets}`}>
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
          <section>
            <h2 className={`font-bold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-1.5 ${styles.sectionTitle}`}>
              <span className="w-1.5 h-3.5 bg-indigo-600 inline-block rounded-xs"></span>
              Education
            </h2>
            <div className={`pl-3 ${styles.educationGap}`}>
              {displayEducation.map((edu, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className={`font-bold text-slate-900 ${styles.educationTitle}`}>{edu.institution}</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {edu.startDate ? `${edu.startDate} – ` : ""}{edu.endDate || ""}
                    </span>
                  </div>
                  <div className={`flex justify-between items-baseline text-slate-600 italic ${styles.educationSubtitle}`}>
                    <span>{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}</span>
                    {edu.gpa && <span className="font-mono not-italic text-slate-900 font-semibold">GPA: {edu.gpa}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Footer Block (Certifications & Achievements) ── */}
      {((displayCerts.length > 0) || (displayAchievements.length > 0)) && (
        <div className="space-y-2 pt-1 border-t border-slate-200">
          {displayCerts.length > 0 && (
            <section>
              <h2 className={`font-bold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-1.5 ${styles.sectionTitle}`}>
                <span className="w-1.5 h-3.5 bg-indigo-600 inline-block rounded-xs"></span>
                Certifications
              </h2>
              <ul className={`list-disc list-outside pl-3 text-slate-700 ${styles.certsList}`}>
                {displayCerts.map((c, idx) => (
                  <li key={`cert-${idx}`}>
                    <span className="font-semibold text-slate-900">{c.name}</span> — <span>{c.issuer}</span>
                    {c.date && <span className="font-mono text-slate-500 text-[8.5pt]"> ({c.date})</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {displayAchievements.length > 0 && (
            <section>
              <h2 className={`font-bold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-1.5 ${styles.sectionTitle}`}>
                <span className="w-1.5 h-3.5 bg-indigo-600 inline-block rounded-xs"></span>
                Key Achievements
              </h2>
              <ul className={`list-disc list-outside pl-3 text-slate-700 ${styles.achievementsList}`}>
                {displayAchievements.map((ach, idx) => (
                  <li key={idx}>
                    <span className="text-slate-900">{ach.description || ach.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
