import React from "react";
import { IStructuredResume, LayoutDensity } from "../../types/resume-schema";
import { computeLayoutDensity, getDensityStyles } from "./density-config";

interface Props {
  resume: IStructuredResume;
  density?: LayoutDensity;
}

export const AcademicTemplate: React.FC<Props> = ({ resume, density }) => {
  const { basics, summary, skills, education, projects, publications, certifications, achievements } = resume;

  const activeDensity = density || computeLayoutDensity(resume);
  const styles = getDensityStyles(activeDensity);

  const displayProjects = (projects || []).slice(0, 2);
  const displayEducation = (education || []).slice(0, 2);
  const displayPubs = (publications || []).slice(0, 2);
  const displayCerts = (certifications || []).slice(0, 3);
  const displayAchievements = (achievements || []).slice(0, 2);

  return (
    <div
      className={`w-full h-full bg-white text-slate-900 font-serif box-border flex flex-col justify-between ${styles.pagePadding}`}
    >
      {/* ── Top & Main Content Block ── */}
      <div className={styles.sectionGap}>
        {/* ── Formal Academic Header ── */}
        <header className={`text-center border-b border-slate-400 ${styles.headerBorder}`}>
          <h1 className={`font-bold tracking-normal text-slate-900 uppercase ${styles.headerName}`}>
            {basics.name}
          </h1>
          {basics.title && (
            <p className={`font-sans text-slate-700 italic ${styles.headerTitle}`}>
              {basics.title}
            </p>
          )}
          <div className={`flex flex-wrap items-center justify-center font-sans text-slate-700 ${styles.headerContact}`}>
            {basics.location && <span>{basics.location}</span>}
            {basics.phone && (
              <>
                <span className="text-slate-400">•</span>
                <span>{basics.phone}</span>
              </>
            )}
            {basics.email && (
              <>
                <span className="text-slate-400">•</span>
                <a href={`mailto:${basics.email}`} className="text-slate-900 underline">
                  {basics.email}
                </a>
              </>
            )}
            {basics.links?.map((link, idx) => (
              <React.Fragment key={idx}>
                <span className="text-slate-400">•</span>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-slate-900 underline">
                  {link.label}
                </a>
              </React.Fragment>
            ))}
          </div>
        </header>

        {/* ── Research & Profile Statement ── */}
        {summary && (
          <section>
            <h2 className={`font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 ${styles.sectionTitle}`}>
              Research Profile & Summary
            </h2>
            <p className={`text-slate-800 text-justify ${styles.summaryText}`}>{summary}</p>
          </section>
        )}

        {/* ── Education (Primary for Academic) ── */}
        {displayEducation.length > 0 && (
          <section>
            <h2 className={`font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 ${styles.sectionTitle}`}>
              Education & Academic Background
            </h2>
            <div className={styles.educationGap}>
              {displayEducation.map((edu, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className={`font-bold text-slate-900 ${styles.educationTitle}`}>{edu.institution}</span>
                    <span className="font-sans text-[10px] text-slate-600">
                      {edu.startDate ? `${edu.startDate} – ` : ""}{edu.endDate || ""}
                    </span>
                  </div>
                  <div className={`flex justify-between items-baseline text-slate-700 italic ${styles.educationSubtitle}`}>
                    <span>{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}</span>
                    {edu.gpa && <span className="font-sans not-italic text-slate-900 font-semibold">Honors/GPA: {edu.gpa}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Publications & Research Output ── */}
        {displayPubs.length > 0 && (
          <section>
            <h2 className={`font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 ${styles.sectionTitle}`}>
              Publications & Scholarly Works
            </h2>
            <div className={styles.projectGap}>
              {displayPubs.map((pub, idx) => (
                <div key={idx} className="space-y-0.5 text-xs">
                  <div className="font-bold text-slate-900">{pub.title}</div>
                  <div className="text-slate-700 italic">
                    {pub.journal || pub.publisher} {pub.date ? `(${pub.date})` : ""}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Technical Skills ── */}
        {skills?.length > 0 && (
          <section>
            <h2 className={`font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 ${styles.sectionTitle}`}>
              Technical Skills & Methodologies
            </h2>
            <div className={`text-slate-800 font-sans ${styles.skillsContainer}`}>
              {skills.map((cat, idx) => (
                <div key={idx} className="flex flex-wrap items-baseline gap-1.5">
                  <span className={`text-slate-900 font-bold ${styles.skillCategory}`}>{cat.category}:</span>
                  <span className="text-slate-700">{cat.items.join(", ")}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Key Technical Projects (Strictly Top 2) ── */}
        {displayProjects.length > 0 && (
          <section>
            <h2 className={`font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 ${styles.sectionTitle}`}>
              Key Research & Technical Projects
            </h2>
            <div className={styles.projectGap}>
              {displayProjects.map((proj, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex flex-wrap justify-between items-baseline gap-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`font-bold text-slate-900 ${styles.projectTitle}`}>{proj.name}</span>
                      {proj.githubUrl && (
                        <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-blue-900 font-sans text-[10px] underline">
                          [Repository]
                        </a>
                      )}
                      {proj.liveUrl && (
                        <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-blue-900 font-sans text-[10px] underline">
                          [Demo]
                        </a>
                      )}
                    </div>
                    {(proj.startDate || proj.endDate) && (
                      <span className="font-sans text-[10px] text-slate-600 shrink-0">
                        {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ""}
                      </span>
                    )}
                  </div>

                  {proj.technologies?.length > 0 && (
                    <div className={`font-sans text-slate-700 ${styles.projectStack}`}>
                      <span className="font-semibold text-slate-900">Stack:</span> {proj.technologies.join(", ")}
                    </div>
                  )}

                  {proj.bullets?.length > 0 && (
                    <ul className={`list-disc list-outside text-slate-800 ${styles.projectBullets}`}>
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
      </div>

      {/* ── Footer Block (Certifications & Academic Honors) ── */}
      {((displayCerts.length > 0) || (displayAchievements.length > 0)) && (
        <div className="space-y-2 pt-1 border-t border-slate-300">
          {displayCerts.length > 0 && (
            <section>
              <h2 className={`font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 ${styles.sectionTitle}`}>
                Certifications & Professional Credentials
              </h2>
              <ul className={`list-disc list-outside text-slate-800 ${styles.certsList}`}>
                {displayCerts.map((c, idx) => (
                  <li key={`cert-${idx}`}>
                    <span className="font-semibold text-slate-900">{c.name}</span> — <span>{c.issuer}</span>
                    {c.date && <span className="font-sans text-slate-600 text-[8.5pt]"> ({c.date})</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {displayAchievements.length > 0 && (
            <section>
              <h2 className={`font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 ${styles.sectionTitle}`}>
                Academic Honors & Fellowships
              </h2>
              <ul className={`list-disc list-outside text-slate-800 ${styles.achievementsList}`}>
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
