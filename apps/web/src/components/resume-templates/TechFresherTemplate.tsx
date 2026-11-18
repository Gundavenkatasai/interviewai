import React from "react";
import { IStructuredResume, LayoutDensity } from "../../types/resume-schema";
import { computeLayoutDensity, getDensityStyles } from "./density-config";

interface Props {
  resume: IStructuredResume;
  density?: LayoutDensity;
}

export const TechFresherTemplate: React.FC<Props> = ({ resume, density }) => {
  const { basics, summary, skills, projects, education, certifications, achievements, training } = resume;

  const activeDensity = density || computeLayoutDensity(resume);
  const styles = getDensityStyles(activeDensity);

  const displayProjects = (projects || []).slice(0, 2);
  const displayEducation = (education || []).slice(0, 2);
  const displayCerts = (certifications || []).slice(0, 3);
  const displayAchievements = (achievements || []).slice(0, 2);

  return (
    <div
      className={`w-full h-full bg-white text-[#111827] font-sans box-border flex flex-col justify-between ${styles.pagePadding}`}
    >
      {/* ── Top & Main Content Block ── */}
      <div className={styles.sectionGap}>
        {/* ── Header ── */}
        <header className={`text-center border-b border-gray-300 ${styles.headerBorder}`}>
          <h1 className={`font-serif font-bold text-gray-900 uppercase ${styles.headerName}`}>
            {basics.name}
          </h1>
          {basics.title && (
            <p className={`font-mono font-semibold text-blue-700 tracking-wide ${styles.headerTitle}`}>
              {basics.title}
            </p>
          )}
          <div className={`flex flex-wrap items-center justify-center text-gray-700 font-mono ${styles.headerContact}`}>
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
          <section>
            <h2 className={`font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 ${styles.sectionTitle}`}>
              Professional Summary
            </h2>
            <p className={`text-gray-800 text-justify ${styles.summaryText}`}>{summary}</p>
          </section>
        )}

        {/* ── Technical Skills ── */}
        {skills?.length > 0 && (
          <section>
            <h2 className={`font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 ${styles.sectionTitle}`}>
              Technical Skills & Toolchain
            </h2>
            <div className={`text-gray-800 ${styles.skillsContainer}`}>
              {skills.map((cat, idx) => (
                <div key={idx} className="flex flex-wrap items-baseline gap-1.5">
                  <span className={`text-gray-900 ${styles.skillCategory}`}>{cat.category}:</span>
                  <span className="text-gray-800">{cat.items.join(", ")}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Key Technical Projects (Strictly Top 2) ── */}
        {displayProjects.length > 0 && (
          <section>
            <h2 className={`font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 ${styles.sectionTitle}`}>
              Key Technical Projects
            </h2>
            <div className={styles.projectGap}>
              {displayProjects.map((proj, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`text-gray-900 ${styles.projectTitle}`}>{proj.name}</span>
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
                    <div className={`font-mono text-gray-600 ${styles.projectStack}`}>
                      <span className="font-semibold text-gray-800">Stack:</span> {proj.technologies.join(", ")}
                    </div>
                  )}

                  {proj.bullets?.length > 0 && (
                    <ul className={`list-disc list-outside text-gray-800 ${styles.projectBullets}`}>
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
            <h2 className={`font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 ${styles.sectionTitle}`}>
              Education
            </h2>
            <div className={styles.educationGap}>
              {displayEducation.map((edu, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className={`text-gray-900 ${styles.educationTitle}`}>{edu.institution}</span>
                    <span className="font-mono text-[10px] text-gray-600">
                      {edu.startDate ? `${edu.startDate} – ` : ""}{edu.endDate || ""}
                    </span>
                  </div>
                  <div className={`flex justify-between items-baseline text-gray-700 italic ${styles.educationSubtitle}`}>
                    <span>{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}</span>
                    {edu.gpa && <span className="font-mono not-italic text-gray-900 font-semibold">Score: {edu.gpa}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Footer Block (Certifications, Training & Achievements) ── */}
      {((displayCerts.length > 0) || (training && training.length > 0) || (displayAchievements.length > 0)) && (
        <div className="space-y-2 pt-1 border-t border-gray-200">
          {/* Certifications */}
          {((displayCerts.length > 0) || (training && training.length > 0)) && (
            <section>
              <h2 className={`font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 ${styles.sectionTitle}`}>
                Certifications & Training
              </h2>
              <ul className={`list-disc list-outside text-gray-800 ${styles.certsList}`}>
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

          {/* Honors & Achievements */}
          {displayAchievements.length > 0 && (
            <section>
              <h2 className={`font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 ${styles.sectionTitle}`}>
                Honors & Key Milestones
              </h2>
              <ul className={`list-disc list-outside text-gray-800 ${styles.achievementsList}`}>
                {displayAchievements.map((ach, idx) => (
                  <li key={idx}>
                    <span className="text-gray-900">{ach.description || ach.title}</span>
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
