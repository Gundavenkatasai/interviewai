import { IStructuredResume, LayoutDensity } from "../../types/resume-schema";

export function computeLayoutDensity(resume: IStructuredResume): LayoutDensity {
  const summaryLength = resume.summary?.length || 0;
  const skillsCount = resume.skills?.reduce((acc, c) => acc + (c.items?.length || 0), 0) || 0;
  const projects = (resume.projects || []).slice(0, 2);
  const projectBulletsCount = projects.reduce(
    (acc, p) => acc + (p.bullets?.slice(0, 2).length || 0),
    0
  );
  const experiences = (resume.experience || []).slice(0, 2);
  const expBulletsCount = experiences.reduce(
    (acc, e) => acc + (e.bullets?.slice(0, 2).length || 0),
    0
  );
  const eduCount = (resume.education || []).slice(0, 2).length;
  const certsCount = (resume.certifications || []).slice(0, 3).length;
  const achCount = (resume.achievements || []).slice(0, 2).length;

  const totalLines =
    (summaryLength > 220 ? 4 : summaryLength > 80 ? 2 : 1) +
    Math.ceil(skillsCount / 4) * 1.5 +
    projects.length * 2 +
    projectBulletsCount * 1.5 +
    experiences.length * 2.5 +
    expBulletsCount * 1.5 +
    eduCount * 2 +
    certsCount * 1.2 +
    achCount * 1;

  if (totalLines > 26) return "compact";
  if (totalLines > 19) return "balanced";
  return "spacious";
}

export function getDensityStyles(density: LayoutDensity) {
  switch (density) {
    case "spacious":
      return {
        pagePadding: "p-[14mm_18mm]",
        sectionGap: "space-y-4",
        headerName: "text-[23pt] tracking-tight",
        headerTitle: "text-[11pt]",
        headerContact: "text-[9.5pt] py-1 gap-x-3 gap-y-1",
        headerBorder: "pb-2 mb-2",
        sectionTitle: "text-[11pt] pb-1 mb-2",
        summaryText: "text-[10pt] leading-[1.55]",
        skillsContainer: "space-y-1.5 text-[9.8pt]",
        skillCategory: "min-w-[135px] font-bold",
        projectGap: "space-y-3",
        projectTitle: "text-[10.5pt] font-bold",
        projectStack: "text-[9pt] pt-0.5",
        projectBullets: "space-y-1 pl-4 text-[9.5pt] leading-[1.5]",
        educationGap: "space-y-2 text-[9.8pt]",
        educationTitle: "text-[10pt] font-bold",
        educationSubtitle: "text-[9.5pt] leading-[1.45]",
        certsList: "space-y-1 pl-4 text-[9.5pt] leading-[1.45]",
        achievementsList: "space-y-1 pl-4 text-[9.5pt] leading-[1.45]",
      };
    case "compact":
      return {
        pagePadding: "p-[10mm_14mm]",
        sectionGap: "space-y-2.5",
        headerName: "text-[19pt] tracking-tight",
        headerTitle: "text-[10pt]",
        headerContact: "text-[8.5pt] py-0.5 gap-x-2 gap-y-0.5",
        headerBorder: "pb-1 mb-1",
        sectionTitle: "text-[10pt] pb-0.5 mb-1",
        summaryText: "text-[8.8pt] leading-[1.35]",
        skillsContainer: "space-y-0.5 text-[8.8pt]",
        skillCategory: "min-w-[115px] font-bold",
        projectGap: "space-y-1.5",
        projectTitle: "text-[9.5pt] font-bold",
        projectStack: "text-[8.2pt] pt-0",
        projectBullets: "space-y-0.5 pl-3.5 text-[8.6pt] leading-[1.32]",
        educationGap: "space-y-1 text-[8.8pt]",
        educationTitle: "text-[9.2pt] font-bold",
        educationSubtitle: "text-[8.5pt] leading-[1.3]",
        certsList: "space-y-0.5 pl-3.5 text-[8.6pt] leading-[1.3]",
        achievementsList: "space-y-0.5 pl-3.5 text-[8.6pt] leading-[1.3]",
      };
    case "balanced":
    default:
      return {
        pagePadding: "p-[12mm_16mm]",
        sectionGap: "space-y-3.5",
        headerName: "text-[21pt] tracking-tight",
        headerTitle: "text-[10.5pt]",
        headerContact: "text-[9pt] py-0.5 gap-x-2.5 gap-y-0.5",
        headerBorder: "pb-1.5 mb-1.5",
        sectionTitle: "text-[10.5pt] pb-0.5 mb-1.5",
        summaryText: "text-[9.4pt] leading-[1.45]",
        skillsContainer: "space-y-1 text-[9.3pt]",
        skillCategory: "min-w-[125px] font-bold",
        projectGap: "space-y-2.5",
        projectTitle: "text-[10pt] font-bold",
        projectStack: "text-[8.6pt] pt-0.5",
        projectBullets: "space-y-0.5 pl-4 text-[9pt] leading-[1.42]",
        educationGap: "space-y-1.5 text-[9.3pt]",
        educationTitle: "text-[9.6pt] font-bold",
        educationSubtitle: "text-[9pt] leading-[1.38]",
        certsList: "space-y-0.5 pl-4 text-[9pt] leading-[1.38]",
        achievementsList: "space-y-0.5 pl-4 text-[9pt] leading-[1.38]",
      };
  }
}
