import React from "react";

interface TemplateProps {
  resume: any;
  paperSize?: "a4" | "letter";
}

export const ATSModernTemplate: React.FC<TemplateProps> = ({ resume }) => {
  const p = resume?.profileData || {};
  const personal = p.personal || {};
  const basics = p.basics || {};

  const fullName = personal.fullName || basics.name || "Your Full Name";
  const title = personal.professionalTitle || basics.label || "";
  const email = personal.email || basics.email || "";
  const phone = personal.phone || basics.phone || "";
  const location =
    personal.location ||
    (typeof basics.location === "string"
      ? basics.location
      : basics.location?.city
      ? `${basics.location.city}${basics.location.region ? `, ${basics.location.region}` : ""}`
      : "");
  const linkedin = personal.linkedin || basics.profiles?.find((pr: any) => pr.network?.toLowerCase() === "linkedin")?.url || "";
  const github = personal.github || basics.profiles?.find((pr: any) => pr.network?.toLowerCase() === "github")?.url || "";
  const portfolio = personal.portfolio || basics.url || "";

  const experienceList = p.experience || p.work || [];
  const educationList = p.education || [];
  const projectsList = p.projects || [];
  const certsList = p.certifications || p.certificates || [];

  return (
    <div className="w-full text-slate-800 font-sans leading-normal p-8 sm:p-11 text-sm bg-white print:p-0">
      {/* Header */}
      <header className="border-b-2 border-indigo-600 pb-4 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {fullName}
          </h1>
          {title && (
            <span className="text-xs sm:text-sm font-semibold text-indigo-700 tracking-wide uppercase mt-1 sm:mt-0">
              {title}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-2.5">
          {email && (
            <span className="font-medium text-slate-700">
              <span className="text-slate-400 mr-1">✉</span> {email}
            </span>
          )}
          {phone && (
            <span>
              <span className="text-slate-400 mr-1">☎</span> {phone}
            </span>
          )}
          {location && (
            <span>
              <span className="text-slate-400 mr-1">📍</span> {location}
            </span>
          )}
          {linkedin && (
            <span>
              <span className="text-indigo-600 font-medium">LinkedIn:</span> {linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}
            </span>
          )}
          {github && (
            <span>
              <span className="text-indigo-600 font-medium">GitHub:</span> {github.replace(/^https?:\/\/(www\.)?github\.com\//, "")}
            </span>
          )}
          {portfolio && (
            <span>
              <span className="text-indigo-600 font-medium">Portfolio:</span> {portfolio.replace(/^https?:\/\//, "")}
            </span>
          )}
        </div>
      </header>

      {/* Summary */}
      {p.summary && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-100 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed text-justify">{p.summary}</p>
        </section>
      )}

      {/* Skills */}
      {p.skills && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-100 pb-1 mb-2.5">
            Technical Skills & Core Competencies
          </h2>
          {Array.isArray(p.skills) ? (
            <div className="flex flex-wrap gap-1.5 text-xs">
              {p.skills.map((s: any, sIdx: number) => (
                <span
                  key={sIdx}
                  className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-medium border border-slate-200 text-[11px]"
                >
                  {typeof s === "string" ? s : s.name}
                  {s.keywords && s.keywords.length > 0 ? `: ${s.keywords.join(", ")}` : ""}
                </span>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5 text-xs text-slate-800">
              {p.skills.languages && p.skills.languages.length > 0 && (
                <p>
                  <span className="font-semibold text-slate-900">Languages:</span>{" "}
                  {p.skills.languages.join(", ")}
                </p>
              )}
              {p.skills.frameworks && p.skills.frameworks.length > 0 && (
                <p>
                  <span className="font-semibold text-slate-900">Frameworks & Libraries:</span>{" "}
                  {p.skills.frameworks.join(", ")}
                </p>
              )}
              {p.skills.cloud && p.skills.cloud.length > 0 && (
                <p>
                  <span className="font-semibold text-slate-900">Cloud & Infrastructure:</span>{" "}
                  {p.skills.cloud.join(", ")}
                </p>
              )}
              {p.skills.databases && p.skills.databases.length > 0 && (
                <p>
                  <span className="font-semibold text-slate-900">Databases & Storage:</span>{" "}
                  {p.skills.databases.join(", ")}
                </p>
              )}
              {p.skills.tools && p.skills.tools.length > 0 && (
                <p>
                  <span className="font-semibold text-slate-900">Developer Tools:</span>{" "}
                  {p.skills.tools.join(", ")}
                </p>
              )}
              {p.skills.technical && p.skills.technical.length > 0 && (
                <p>
                  <span className="font-semibold text-slate-900">Engineering Methodologies:</span>{" "}
                  {p.skills.technical.join(", ")}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Experience */}
      {experienceList.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-100 pb-1 mb-3">
            Work Experience
          </h2>
          <div className="space-y-4">
            {experienceList.map((exp: any, idx: number) => {
              const role = exp.role || exp.position || "Role Title";
              const company = exp.company || exp.name || "Company";
              const dateRange =
                exp.startDate || exp.endDate
                  ? `${exp.startDate || ""} – ${exp.endDate || (exp.current ? "Present" : "")}`
                  : "";

              return (
                <div key={exp.id || idx}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 text-[13px]">{role}</span>
                      <span className="font-semibold text-indigo-700"> • {company}</span>
                      {exp.location && <span className="text-slate-500 text-[11px]"> ({exp.location})</span>}
                    </div>
                    {dateRange && (
                      <span className="text-[11px] font-medium text-slate-600 sm:text-right">
                        {dateRange}
                      </span>
                    )}
                  </div>
                  {exp.description && (
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{exp.description}</p>
                  )}
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-1.5 space-y-1 text-xs text-slate-700">
                      {exp.bullets.map((b: string, bIdx: number) => (
                        <li key={bIdx} className="leading-relaxed pl-0.5">{b}</li>
                      ))}
                    </ul>
                  )}
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-1.5 space-y-1 text-xs text-slate-700">
                      {exp.highlights.map((h: string, hIdx: number) => (
                        <li key={hIdx} className="leading-relaxed pl-0.5">{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Projects */}
      {projectsList.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-100 pb-1 mb-3">
            Key Projects
          </h2>
          <div className="space-y-3">
            {projectsList.map((proj: any, idx: number) => (
              <div key={proj.id || idx}>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{proj.name || "Project Title"}</span>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <span className="text-slate-500 text-[11px] ml-1.5 font-mono">
                        [{proj.technologies.join(", ")}]
                      </span>
                    )}
                  </div>
                  {proj.url && (
                    <span className="text-[11px] text-indigo-600 underline font-mono truncate max-w-[200px]">
                      {proj.url}
                    </span>
                  )}
                </div>
                {proj.description && (
                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{proj.description}</p>
                )}
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-1 text-xs text-slate-700">
                    {proj.bullets.map((b: string, bIdx: number) => (
                      <li key={bIdx} className="leading-relaxed pl-0.5">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {educationList.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-100 pb-1 mb-2.5">
            Education
          </h2>
          <div className="space-y-2">
            {educationList.map((edu: any, idx: number) => (
              <div key={edu.id || idx} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">
                    {edu.degree || edu.studyType || "Degree"}
                    {edu.field || edu.area ? ` in ${edu.field || edu.area}` : ""}
                  </span>
                  <span className="text-slate-700"> — {edu.institution || "Institution"}</span>
                  {edu.gpa && <span className="text-slate-500 text-[11px]"> (GPA: {edu.gpa})</span>}
                </div>
                <span className="text-[11px] font-medium text-slate-600 sm:text-right">
                  {edu.endDate || edu.year || ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certsList.length > 0 && (
        <section className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-100 pb-1 mb-2">
            Certifications & Licenses
          </h2>
          <div className="space-y-1 text-xs text-slate-800">
            {certsList.map((cert: any, idx: number) => (
              <div key={cert.id || idx} className="flex justify-between">
                <span>
                  <span className="font-semibold">{cert.name}</span>
                  {cert.issuer && <span className="text-slate-600"> — {cert.issuer}</span>}
                </span>
                <span className="text-slate-500 text-[11px]">{cert.date}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
