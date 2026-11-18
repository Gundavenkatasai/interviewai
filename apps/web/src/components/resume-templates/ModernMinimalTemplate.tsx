import React from "react";
import { IStructuredResume, LayoutDensity } from "../../types/resume-schema";
import { computeLayoutDensity, getDensityStyles } from "./density-config";

interface Props {
  resume: IStructuredResume;
  density?: LayoutDensity;
}

export const ModernMinimalTemplate: React.FC<Props> = ({ resume, density }) => {
  const { basics, summary, skills, experience, projects, education, certifications, achievements } = resume;

  const activeDensity = density || computeLayoutDensity(resume);
  const styles = getDensityStyles(activeDensity);

  const displayProjects = (projects || []).slice(0, 2);
  const displayEducation = (education || []).slice(0, 2);
  const displayCerts = (certifications || []).slice(0, 3);
  const displayAchievements = (achievements || []).slice(0, 2);

  return (
    <div
      className={`w-full h-full bg-white text-zinc-900 font-sans box-border flex flex-col justify-between ${styles.pagePadding}`}
    >
      {/* ── Top & Main Content Block ── */}
      <div className={styles.sectionGap}>
        {/* ── Header ── */}
        <header className={`border-b border-zinc-200 ${styles.headerBorder}`}>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <div>
              <h1 className={`font-bold tracking-tight text-zinc-900 ${styles.headerName}`}>
                {basics.name}
              </h1>
              {basics.title && (
                <p className={`font-medium text-zinc-600 tracking-wide ${styles.headerTitle}`}>
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

          <div className={`flex flex-wrap items-center text-zinc-600 ${styles.headerContact}`}>
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
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-zinc-900 hover:underline">
                  {link.label}
                </a>
              </React.Fragment>
            ))}
          </div>
        </header>

        {/* ── Summary ── */}
        {summary && (
          <section>
            <h2 className={`font-semibold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 ${styles.sectionTitle}`}>
              About
            </h2>
            <p className={`text-zinc-700 text-justify ${styles.summaryText}`}>{summary}</p>
          </section>
        )}

        {/* ── Experience (if present) ── */}
        {experience?.length > 0 && (
          <section>
            <h2 className={`font-semibold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 ${styles.sectionTitle}`}>
              Experience
            </h2>
            <div className={styles.projectGap}>
              {experience.slice(0, 2).map((exp, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className={`font-semibold text-zinc-900 ${styles.projectTitle}`}>{exp.role}</span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs text-zinc-600">
                    <span>{exp.company}</span>
                    {exp.location && <span>{exp.location}</span>}
                  </div>
                  {exp.bullets?.length > 0 && (
                    <ul className={`list-disc list-outside text-zinc-700 ${styles.projectBullets}`}>
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

        {/* ── Skills ── */}
        {skills?.length > 0 && (
          <section>
            <h2 className={`font-semibold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 ${styles.sectionTitle}`}>
              Core Competencies
            </h2>
            <div className={`text-zinc-800 ${styles.skillsContainer}`}>
              {skills.map((cat, idx) => (
                <div key={idx} className="flex flex-wrap items-baseline gap-1.5">
                  <span className={`text-zinc-900 font-medium ${styles.skillCategory}`}>{cat.category}:</span>
                  <span className="text-zinc-600">{cat.items.join(", ")}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Projects (Strictly Top 2) ── */}
        {displayProjects.length > 0 && (
          <section>
            <h2 className={`font-semibold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 ${styles.sectionTitle}`}>
              Projects
            </h2>
            <div className={styles.projectGap}>
              {displayProjects.map((proj, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex flex-wrap justify-between items-baseline gap-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`font-semibold text-zinc-900 ${styles.projectTitle}`}>{proj.name}</span>
                      {proj.githubUrl && (
                        <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-zinc-600 font-mono text-[10px] hover:underline">
                          [Code]
                        </a>
                      )}
                      {proj.liveUrl && (
                        <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-zinc-600 font-mono text-[10px] hover:underline">
                          [Link]
                        </a>
                      )}
                    </div>
                    {(proj.startDate || proj.endDate) && (
                      <span className="font-mono text-[10px] text-zinc-500 shrink-0">
                        {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ""}
                      </span>
                    )}
                  </div>

                  {proj.technologies?.length > 0 && (
                    <div className={`font-mono text-zinc-500 ${styles.projectStack}`}>
                      <span>Stack:</span> {proj.technologies.join(", ")}
                    </div>
                  )}

                  {proj.bullets?.length > 0 && (
                    <ul className={`list-disc list-outside text-zinc-700 ${styles.projectBullets}`}>
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
            <h2 className={`font-semibold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 ${styles.sectionTitle}`}>
              Education
            </h2>
            <div className={styles.educationGap}>
              {displayEducation.map((edu, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className={`font-semibold text-zinc-900 ${styles.educationTitle}`}>{edu.institution}</span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {edu.startDate ? `${edu.startDate} – ` : ""}{edu.endDate || ""}
                    </span>
                  </div>
                  <div className={`flex justify-between items-baseline text-zinc-600 italic ${styles.educationSubtitle}`}>
                    <span>{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}</span>
                    {edu.gpa && <span className="font-mono not-italic text-zinc-900 font-semibold">GPA: {edu.gpa}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Footer Block (Certifications & Achievements) ── */}
      {((displayCerts.length > 0) || (displayAchievements.length > 0)) && (
        <div className="space-y-2 pt-1 border-t border-zinc-200">
          {displayCerts.length > 0 && (
            <section>
              <h2 className={`font-semibold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 ${styles.sectionTitle}`}>
                Certifications
              </h2>
              <ul className={`list-disc list-outside text-zinc-700 ${styles.certsList}`}>
                {displayCerts.map((c, idx) => (
                  <li key={`cert-${idx}`}>
                    <span className="font-medium text-zinc-900">{c.name}</span> — <span>{c.issuer}</span>
                    {c.date && <span className="font-mono text-zinc-500 text-[8.5pt]"> ({c.date})</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {displayAchievements.length > 0 && (
            <section>
              <h2 className={`font-semibold uppercase tracking-wider text-zinc-900 border-b border-zinc-200 ${styles.sectionTitle}`}>
                Key Achievements
              </h2>
              <ul className={`list-disc list-outside text-zinc-700 ${styles.achievementsList}`}>
                {displayAchievements.map((ach, idx) => (
                  <li key={idx}>
                    <span className="text-zinc-900">{ach.description || ach.title}</span>
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
