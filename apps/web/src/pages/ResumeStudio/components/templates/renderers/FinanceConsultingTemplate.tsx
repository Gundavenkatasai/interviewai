import React from "react";

interface TemplateProps {
  resume: any;
  paperSize?: "a4" | "letter";
}

export const FinanceConsultingTemplate: React.FC<TemplateProps> = ({ resume }) => {
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

  const experienceList = p.experience || p.work || [];
  const educationList = p.education || [];
  const projectsList = p.projects || [];
  const certsList = p.certifications || p.certificates || [];

  return (
    <div className="w-full text-slate-900 font-serif leading-normal p-8 sm:p-12 text-sm bg-white print:p-0">
      {/* Header */}
      <div className="text-center border-b border-black pb-3 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-black">
          {fullName}
        </h1>
        {title && (
          <p className="text-xs uppercase tracking-widest text-slate-700 font-semibold mt-0.5">
            {title}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-xs text-slate-700 mt-1 font-sans">
          {location && <span>{location}</span>}
          {phone && <span>• {phone}</span>}
          {email && <span>• {email}</span>}
          {linkedin && <span>• {linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}</span>}
        </div>
      </div>

      {/* Summary */}
      {p.summary && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5 font-sans">
            Executive Profile
          </h2>
          <p className="text-xs text-slate-900 leading-relaxed text-justify">{p.summary}</p>
        </section>
      )}

      {/* Education */}
      {educationList.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-2 font-sans">
            Education
          </h2>
          <div className="space-y-2">
            {educationList.map((edu: any, idx: number) => (
              <div key={edu.id || idx}>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs">
                  <span className="font-bold text-black uppercase">
                    {edu.institution || "Institution Name"}
                  </span>
                  <span className="text-[11px] font-medium text-black sm:text-right font-sans">
                    {edu.endDate || edu.year || ""}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs italic text-slate-800">
                  <span>
                    {edu.degree || edu.studyType || "Degree"}
                    {edu.field || edu.area ? ` in ${edu.field || edu.area}` : ""}
                    {edu.gpa ? `, GPA: ${edu.gpa}` : ""}
                  </span>
                  {edu.location && <span className="font-sans not-italic text-[11px]">{edu.location}</span>}
                </div>
                {edu.honors && (
                  <p className="text-xs text-slate-700 mt-0.5">{edu.honors}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Professional Experience */}
      {experienceList.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-2 font-sans">
            Professional Experience
          </h2>
          <div className="space-y-3.5">
            {experienceList.map((exp: any, idx: number) => {
              const role = exp.role || exp.position || "Title";
              const company = exp.company || exp.name || "Organization";
              const dateRange =
                exp.startDate || exp.endDate
                  ? `${exp.startDate || ""} – ${exp.endDate || (exp.current ? "Present" : "")}`
                  : "";

              return (
                <div key={exp.id || idx}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs">
                    <span className="font-bold text-black uppercase">{company}</span>
                    <span className="text-[11px] font-sans font-medium text-black sm:text-right">
                      {dateRange}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs italic text-slate-800">
                    <span>{role}</span>
                    {exp.location && <span className="font-sans not-italic text-[11px] text-slate-700">{exp.location}</span>}
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-xs text-slate-800">
                      {exp.bullets.map((b: string, bIdx: number) => (
                        <li key={bIdx} className="leading-relaxed pl-0.5">{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Selected Projects / Engagements */}
      {projectsList.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-2 font-sans">
            Selected Transactions & Strategic Projects
          </h2>
          <div className="space-y-2.5">
            {projectsList.map((proj: any, idx: number) => (
              <div key={proj.id || idx}>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs">
                  <span className="font-bold text-black">{proj.name || "Transaction Title"}</span>
                  {proj.url && <span className="text-[11px] font-sans text-slate-600">{proj.url}</span>}
                </div>
                {proj.description && (
                  <p className="text-xs text-slate-800 italic mt-0.5">{proj.description}</p>
                )}
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-xs text-slate-800">
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

      {/* Skills & Certifications */}
      {(p.skills || certsList.length > 0) && (
        <section className="mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1.5 font-sans">
            Skills & Credentials
          </h2>
          <div className="space-y-1 text-xs text-slate-800 font-sans">
            {p.skills && (
              <>
                {Array.isArray(p.skills) ? (
                  <p>
                    <span className="font-bold font-serif text-black">Core Competencies:</span>{" "}
                    {p.skills.map((s: any) => (typeof s === "string" ? s : s.name)).join(", ")}
                  </p>
                ) : (
                  <>
                    {p.skills.technical && p.skills.technical.length > 0 && (
                      <p>
                        <span className="font-bold font-serif text-black">Financial & Strategic Analysis:</span>{" "}
                        {p.skills.technical.join(", ")}
                      </p>
                    )}
                    {p.skills.tools && p.skills.tools.length > 0 && (
                      <p>
                        <span className="font-bold font-serif text-black">Tools & Modeling:</span>{" "}
                        {p.skills.tools.join(", ")}
                      </p>
                    )}
                    {p.skills.languages && p.skills.languages.length > 0 && (
                      <p>
                        <span className="font-bold font-serif text-black">Languages:</span>{" "}
                        {p.skills.languages.join(", ")}
                      </p>
                    )}
                  </>
                )}
              </>
            )}
            {certsList.length > 0 && (
              <p>
                <span className="font-bold font-serif text-black">Certifications:</span>{" "}
                {certsList.map((c: any) => `${c.name}${c.issuer ? ` (${c.issuer})` : ""}`).join("; ")}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
