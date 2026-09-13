import React from "react";

interface TemplateProps {
  resume: any;
  paperSize?: "a4" | "letter";
}

export const ATSMinimalTemplate: React.FC<TemplateProps> = ({ resume }) => {
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
    <div className="w-full text-slate-900 font-sans leading-snug p-7 sm:p-10 text-[13px] bg-white print:p-0">
      {/* Header */}
      <div className="text-center pb-3 mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {fullName}
        </h1>
        {title && (
          <p className="text-xs font-medium text-slate-600 mt-0.5 tracking-wider uppercase">
            {title}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-xs text-slate-600 mt-1.5">
          {email && <span>{email}</span>}
          {phone && <span>• {phone}</span>}
          {location && <span>• {location}</span>}
          {linkedin && <span>• {linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}</span>}
          {github && <span>• {github.replace(/^https?:\/\/(www\.)?github\.com\//, "")}</span>}
          {portfolio && <span>• {portfolio.replace(/^https?:\/\//, "")}</span>}
        </div>
      </div>

      {/* Summary */}
      {p.summary && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-0.5 mb-1.5">
            Summary
          </h2>
          <p className="text-xs text-slate-800 leading-relaxed text-justify">{p.summary}</p>
        </section>
      )}

      {/* Education */}
      {educationList.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-0.5 mb-1.5">
            Education
          </h2>
          <div className="space-y-1.5">
            {educationList.map((edu: any, idx: number) => (
              <div key={edu.id || idx} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">
                    {edu.degree || edu.studyType || "Degree"}
                    {edu.field || edu.area ? ` in ${edu.field || edu.area}` : ""}
                  </span>
                  <span className="text-slate-700">, {edu.institution || "Institution"}</span>
                  {edu.gpa && <span className="text-slate-600 text-[11px]"> (GPA: {edu.gpa})</span>}
                </div>
                <span className="text-[11px] text-slate-600 sm:text-right font-medium">
                  {edu.endDate || edu.year || ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {p.skills && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-0.5 mb-1.5">
            Skills
          </h2>
          {Array.isArray(p.skills) ? (
            <p className="text-xs text-slate-800">
              {p.skills.map((s: any) => (typeof s === "string" ? s : s.name)).join(", ")}
            </p>
          ) : (
            <div className="space-y-0.5 text-xs text-slate-800">
              {p.skills.languages && p.skills.languages.length > 0 && (
                <p>
                  <span className="font-bold">Languages:</span> {p.skills.languages.join(", ")}
                </p>
              )}
              {p.skills.frameworks && p.skills.frameworks.length > 0 && (
                <p>
                  <span className="font-bold">Technologies:</span> {p.skills.frameworks.join(", ")}
                </p>
              )}
              {p.skills.cloud && p.skills.cloud.length > 0 && (
                <p>
                  <span className="font-bold">Cloud & Infra:</span> {p.skills.cloud.join(", ")}
                </p>
              )}
              {p.skills.databases && p.skills.databases.length > 0 && (
                <p>
                  <span className="font-bold">Databases:</span> {p.skills.databases.join(", ")}
                </p>
              )}
              {p.skills.tools && p.skills.tools.length > 0 && (
                <p>
                  <span className="font-bold">Tools:</span> {p.skills.tools.join(", ")}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Experience */}
      {experienceList.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-0.5 mb-2">
            Experience
          </h2>
          <div className="space-y-3">
            {experienceList.map((exp: any, idx: number) => {
              const role = exp.role || exp.position || "Role";
              const company = exp.company || exp.name || "Company";
              const dateRange =
                exp.startDate || exp.endDate
                  ? `${exp.startDate || ""} – ${exp.endDate || (exp.current ? "Present" : "")}`
                  : "";

              return (
                <div key={exp.id || idx}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{role}</span>
                      <span className="font-medium text-slate-700">, {company}</span>
                      {exp.location && <span className="text-slate-500 text-[11px]"> — {exp.location}</span>}
                    </div>
                    {dateRange && (
                      <span className="text-[11px] text-slate-600 sm:text-right font-medium">
                        {dateRange}
                      </span>
                    )}
                  </div>
                  {exp.description && (
                    <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{exp.description}</p>
                  )}
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-xs text-slate-700">
                      {exp.bullets.map((b: string, bIdx: number) => (
                        <li key={bIdx} className="leading-snug pl-0.5">{b}</li>
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
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-0.5 mb-2">
            Projects
          </h2>
          <div className="space-y-2.5">
            {projectsList.map((proj: any, idx: number) => (
              <div key={proj.id || idx}>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{proj.name || "Project"}</span>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <span className="text-slate-500 text-[11px] ml-1">
                        ({proj.technologies.join(", ")})
                      </span>
                    )}
                  </div>
                  {proj.url && (
                    <span className="text-[11px] text-slate-600 underline truncate max-w-[200px]">
                      {proj.url}
                    </span>
                  )}
                </div>
                {proj.description && (
                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{proj.description}</p>
                )}
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-xs text-slate-700">
                    {proj.bullets.map((b: string, bIdx: number) => (
                      <li key={bIdx} className="leading-snug pl-0.5">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certsList.length > 0 && (
        <section className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-0.5 mb-1.5">
            Certifications
          </h2>
          <div className="space-y-0.5 text-xs text-slate-800">
            {certsList.map((cert: any, idx: number) => (
              <div key={cert.id || idx} className="flex justify-between">
                <span>
                  <span className="font-semibold">{cert.name}</span>
                  {cert.issuer && <span className="text-slate-600">, {cert.issuer}</span>}
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
