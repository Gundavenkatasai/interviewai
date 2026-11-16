import { Profile, IProfile } from "./profile.model";
import { Resume, ResumeVersion, IResume } from "../resume/resume.model";

export interface VerifiedCandidateContext {
  userId: string;
  hasProfile: boolean;
  hasResume: boolean;
  personal: {
    name?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    headline?: string;
    bio?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  skills: {
    verified: string[];
    selfReported: string[];
    all: string[];
  };
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    grade?: string;
    isVerified: boolean;
  }>;
  experience: Array<{
    company: string;
    title: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    bullets: string[];
    achievements: string[];
    isVerified: boolean;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    bullets: string[];
    url?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date?: string;
  }>;
  preferences: {
    preferredRoles: string[];
    preferredLocations: string[];
    preferredWorkModes: string[];
    preferredSalary?: any;
    targetExperienceLevel?: string;
  };
  resumeMetadata?: {
    resumeId: string;
    latestVersionId?: string;
    versionNumber: number;
    filename: string;
    atsScore?: number;
    updatedAt: Date;
  };
}

export class CandidateContextService {
  /**
   * Retrieves the authoritative, single-source-of-truth candidate context
   * by aggregating the verified Profile record and the latest Resume version.
   */
  static async getCandidateContext(userId: string): Promise<VerifiedCandidateContext> {
    if (!userId) {
      throw new Error("CandidateContextService: userId is required");
    }

    // 1. Fetch Profile and latest Resume in parallel
    const [profile, latestResume] = await Promise.all([
      Profile.findOne({ userId }),
      Resume.findOne({ userId }).sort({ updatedAt: -1 }),
    ]);

    const hasProfile = !!profile;
    const hasResume = !!latestResume;

    // Fetch latest resume version if resume exists
    let latestVersion: any = null;
    if (latestResume) {
      latestVersion = await ResumeVersion.findOne({
        resumeId: latestResume._id,
        userId,
      }).sort({ versionNumber: -1 });
    }

    // 2. Personal Information Synthesis
    const pData: any = latestResume?.profileData?.personal || {};
    const personal = {
      name: profile?.personal?.fullName || profile?.personal?.name || pData.fullName || "",
      fullName: profile?.personal?.fullName || profile?.personal?.name || pData.fullName || "",
      email: profile?.personal?.email || pData.email || "",
      phone: profile?.personal?.phone || pData.phone || "",
      location: profile?.personal?.location || pData.location || "",
      headline: profile?.headline || pData.professionalTitle || "",
      bio: profile?.personal?.bio || "",
      linkedin: (profile as any)?.linkedin || pData.linkedin || "",
      github: (profile as any)?.github || pData.github || "",
      portfolio: (profile as any)?.portfolio || pData.portfolio || pData.website || "",
    };

    // 3. Skills Synthesis & Verification Categorization
    const verifiedSkillsSet = new Set<string>();
    const selfReportedSkillsSet = new Set<string>();

    // From Profile
    if (profile?.skills && Array.isArray(profile.skills)) {
      for (const s of profile.skills) {
        const skillName = typeof s === "string" ? String(s).trim() : (s?.name || "").trim();
        if (!skillName) continue;
        const isVerified = (s as any)?.provenance?.status === "VERIFIED" || (s as any)?.verified_status === "VERIFIED";
        if (isVerified) {
          verifiedSkillsSet.add(skillName);
        } else {
          selfReportedSkillsSet.add(skillName);
        }
      }
    }

    // From Resume ProfileData (IResumeSkills has arrays technical, languages, frameworks, etc.)
    const resumeSkillsObj: any = latestResume?.profileData?.skills || {};
    const skillBuckets = [
      resumeSkillsObj.technical,
      resumeSkillsObj.languages,
      resumeSkillsObj.frameworks,
      resumeSkillsObj.databases,
      resumeSkillsObj.cloud,
      resumeSkillsObj.tools,
    ];
    for (const bucket of skillBuckets) {
      if (Array.isArray(bucket)) {
        for (const item of bucket) {
          if (typeof item === "string" && item.trim()) {
            verifiedSkillsSet.add(item.trim());
          }
        }
      }
    }

    if (Array.isArray(resumeSkillsObj.structured)) {
      for (const item of resumeSkillsObj.structured) {
        const name = (item.normalized || item.raw || "").trim();
        if (name) verifiedSkillsSet.add(name);
      }
    }

    const verifiedSkills = Array.from(verifiedSkillsSet);
    const selfReportedSkills = Array.from(selfReportedSkillsSet).filter(s => !verifiedSkillsSet.has(s));
    const allSkills = [...verifiedSkills, ...selfReportedSkills];

    // 4. Education Synthesis
    const educationMap = new Map<string, any>();
    if (profile?.education && Array.isArray(profile.education)) {
      for (const edu of profile.education) {
        const key = `${edu.institution}_${edu.degree}`.toLowerCase();
        educationMap.set(key, {
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field,
          startDate: edu.startDate,
          endDate: edu.endDate,
          isVerified: (edu as any)?.provenance?.status === "VERIFIED" || (edu as any)?.verified_status === "VERIFIED",
        });
      }
    }
    if (latestResume?.profileData?.education && Array.isArray(latestResume.profileData.education)) {
      for (const edu of latestResume.profileData.education) {
        const key = `${edu.institution}_${edu.degree}`.toLowerCase();
        if (!educationMap.has(key)) {
          educationMap.set(key, {
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field,
            startDate: edu.startDate,
            endDate: edu.endDate,
            grade: edu.gpa,
            isVerified: true,
          });
        }
      }
    }

    // 5. Work Experience Synthesis
    const experienceList: any[] = [];
    const seenExp = new Set<string>();

    if (profile?.experience && Array.isArray(profile.experience)) {
      for (const exp of profile.experience) {
        const key = `${exp.company}_${exp.title}`.toLowerCase();
        if (!seenExp.has(key)) {
          seenExp.add(key);
          experienceList.push({
            company: exp.company,
            title: exp.title,
            location: exp.location,
            startDate: exp.startDate,
            endDate: exp.endDate,
            current: exp.current,
            bullets: exp.bullets || (exp.description ? [exp.description] : []),
            achievements: exp.achievements || [],
            isVerified: (exp as any)?.provenance?.status === "VERIFIED" || (exp as any)?.verified_status === "VERIFIED",
          });
        }
      }
    }

    if (latestResume?.profileData?.experience && Array.isArray(latestResume.profileData.experience)) {
      for (const exp of latestResume.profileData.experience) {
        const expTitle = exp.role || (exp as any).title || "Software Engineer";
        const key = `${exp.company}_${expTitle}`.toLowerCase();
        if (!seenExp.has(key)) {
          seenExp.add(key);
          experienceList.push({
            company: exp.company,
            title: expTitle,
            location: exp.location,
            startDate: exp.startDate,
            endDate: exp.endDate,
            current: exp.current,
            bullets: exp.bullets || [],
            achievements: exp.achievements ? [exp.achievements] : [],
            isVerified: true,
          });
        }
      }
    }

    // 6. Projects Synthesis
    const projectsList: any[] = [];
    const seenProj = new Set<string>();

    if (profile?.projects && Array.isArray(profile.projects)) {
      for (const proj of profile.projects) {
        const key = (proj.name || "").toLowerCase();
        if (key && !seenProj.has(key)) {
          seenProj.add(key);
          projectsList.push({
            name: proj.name,
            description: proj.description || "",
            technologies: proj.technologies || [],
            bullets: proj.bullets || [],
            url: proj.url,
          });
        }
      }
    }

    if (latestResume?.profileData?.projects && Array.isArray(latestResume.profileData.projects)) {
      for (const proj of latestResume.profileData.projects) {
        const key = (proj.name || "").toLowerCase();
        if (key && !seenProj.has(key)) {
          seenProj.add(key);
          projectsList.push({
            name: proj.name,
            description: proj.description || "",
            technologies: proj.technologies || [],
            bullets: proj.bullets || [],
            url: proj.url,
          });
        }
      }
    }

    // 7. Certifications
    const certificationsList: any[] = [];
    if (profile?.certifications && Array.isArray(profile.certifications)) {
      for (const cert of profile.certifications) {
        certificationsList.push({
          name: cert.name,
          issuer: cert.issuer,
          date: cert.date,
        });
      }
    }
    if (latestResume?.profileData?.certifications && Array.isArray(latestResume.profileData.certifications)) {
      for (const cert of latestResume.profileData.certifications) {
        if (!certificationsList.some(c => c.name.toLowerCase() === cert.name?.toLowerCase())) {
          certificationsList.push({
            name: cert.name,
            issuer: cert.issuer || "",
            date: cert.date,
          });
        }
      }
    }

    // 8. Preferences
    const preferences = {
      preferredRoles: profile?.preferredRoles || [],
      preferredLocations: profile?.preferredLocations || [],
      preferredWorkModes: profile?.preferredWorkMode || [],
      preferredSalary: profile?.preferredSalary,
      targetExperienceLevel: profile?.targetExperienceLevel,
    };

    // 9. Resume Metadata
    let resumeMetadata: any = undefined;
    if (latestResume) {
      resumeMetadata = {
        resumeId: latestResume._id.toString(),
        latestVersionId: latestVersion?._id?.toString() || latestResume._id.toString(),
        versionNumber: latestVersion?.versionNumber || latestResume.version || 1,
        filename: latestResume.filename || "Resume",
        atsScore: latestResume.atsScore,
        updatedAt: latestResume.updatedAt,
      };
    }

    return {
      userId,
      hasProfile,
      hasResume,
      personal,
      skills: {
        verified: verifiedSkills,
        selfReported: selfReportedSkills,
        all: allSkills,
      },
      education: Array.from(educationMap.values()),
      experience: experienceList,
      projects: projectsList,
      certifications: certificationsList,
      preferences,
      resumeMetadata,
    };
  }

  /**
   * Formats candidate context as a clean prompt string for AI tasks
   */
  static formatForPrompt(context: VerifiedCandidateContext, mode: "short" | "full" = "full"): string {
    if (!context.hasProfile && !context.hasResume) {
      return "Candidate Dossier: No verified candidate profile or resume uploaded yet.";
    }

    let text = `=== VERIFIED CANDIDATE PROFILE ===\n`;
    if (context.personal.fullName) {
      text += `Candidate: ${context.personal.fullName}\n`;
    }
    if (context.personal.headline) {
      text += `Headline: ${context.personal.headline}\n`;
    }
    if (context.personal.location) {
      text += `Location: ${context.personal.location}\n`;
    }

    if (context.skills.verified.length > 0) {
      text += `Verified Technical Skills: ${context.skills.verified.join(", ")}\n`;
    }
    if (context.skills.selfReported.length > 0 && mode === "full") {
      text += `Self-Reported Skills: ${context.skills.selfReported.join(", ")}\n`;
    }

    if (context.experience.length > 0) {
      text += `\nProfessional Experience:\n`;
      const exps = mode === "short" ? context.experience.slice(0, 2) : context.experience;
      for (const exp of exps) {
        text += `- ${exp.title} at ${exp.company} (${exp.startDate || "N/A"} - ${exp.endDate || (exp.current ? "Present" : "N/A")})\n`;
        if (exp.bullets && exp.bullets.length > 0) {
          const bullets = mode === "short" ? exp.bullets.slice(0, 2) : exp.bullets;
          for (const b of bullets) {
            text += `  * ${b}\n`;
          }
        }
      }
    }

    if (context.projects.length > 0) {
      text += `\nKey Technical Projects:\n`;
      const projs = mode === "short" ? context.projects.slice(0, 2) : context.projects;
      for (const p of projs) {
        text += `- ${p.name}: ${p.description}\n`;
        if (p.technologies && p.technologies.length > 0) {
          text += `  Tech: ${p.technologies.join(", ")}\n`;
        }
        if (p.bullets && p.bullets.length > 0 && mode === "full") {
          for (const b of p.bullets) {
            text += `  * ${b}\n`;
          }
        }
      }
    }

    if (context.education.length > 0) {
      text += `\nEducation:\n`;
      for (const edu of context.education) {
        text += `- ${edu.degree} in ${edu.field || "Engineering"} from ${edu.institution}${edu.endDate ? ` (${edu.endDate})` : ""}\n`;
      }
    }

    return text.trim();
  }
}
