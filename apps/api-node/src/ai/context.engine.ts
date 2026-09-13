export class AIContextEngine {
  static buildCandidateContext(profile: any, format: "short" | "full" = "full"): string {
    if (!profile) return "Candidate Profile: Unknown";
    
    let context = `Candidate Profile:\n`;
    
    if (profile.personal?.firstName || profile.personal?.lastName) {
      context += `- Name: ${profile.personal.firstName || ""} ${profile.personal.lastName || ""}\n`;
    }
    
    if (profile.skills && profile.skills.length > 0) {
      const verifiedSkills = profile.skills.filter((s: any) => s.verified_status === "VERIFIED");
      const unverifiedSkills = profile.skills.filter((s: any) => s.verified_status !== "VERIFIED");
      context += `- Verified Skills: ${verifiedSkills.map((s: any) => s.name).join(", ")}\n`;
      if (unverifiedSkills.length > 0 && format === "full") {
        context += `- Self-Reported Skills: ${unverifiedSkills.map((s: any) => s.name).join(", ")}\n`;
      }
    }

    if (profile.experience && profile.experience.length > 0) {
      context += `- Experience:\n`;
      profile.experience.slice(0, format === "short" ? 2 : undefined).forEach((exp: any) => {
        context += `  * ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || "Present"})\n`;
      });
    }

    if (profile.education && profile.education.length > 0) {
      context += `- Education:\n`;
      profile.education.forEach((edu: any) => {
        context += `  * ${edu.degree} from ${edu.institution}\n`;
      });
    }

    return context;
  }

  static buildJobContext(job: any): string {
    if (!job) return "Target Job: Unknown";
    
    let context = `Target Job Configuration:\n`;
    context += `- Title: ${job.title}\n`;
    context += `- Company: ${job.company}\n`;
    context += `- Location: ${job.location || "Remote"}\n`;
    
    if (job.description) {
      // Limit to 3000 chars to save tokens if it's very long
      const desc = job.description.length > 3000 ? job.description.substring(0, 3000) + "..." : job.description;
      context += `- Job Description:\n${desc}\n`;
    }

    return context;
  }

  static buildCompanyContext(company: any): string {
    if (!company) return "";
    let context = `Company Intelligence:\n`;
    context += `- Name: ${company.name}\n`;
    context += `- Industry: ${company.industry || "Unknown"}\n`;
    context += `- Overview: ${company.overview || "Unknown"}\n`;
    return context;
  }
}
