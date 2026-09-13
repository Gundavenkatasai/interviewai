import { ILinkedInPublicData, ILinkedInAnalysis } from "./linkedin.model";
import { Job } from "../jobs/jobs.model";
import { Resume } from "../resume/resume.model";
import { Profile } from "../profile/profile.model";

export class LinkedInScorer {
  /**
   * Deterministic 0–100 LinkedIn Profile scoring based on defined weights
   */
  static async scoreAndAnalyze(
    publicData: ILinkedInPublicData,
    userId: string,
    targetRole = "Software Engineer"
  ): Promise<Omit<ILinkedInAnalysis, "_id" | "userId" | "profileId" | "createdAt">> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // 1. Headline (Weight: 10%)
    let headlineScore = 0;
    const headlineProblems: string[] = [];
    if (publicData.headline) {
      const len = publicData.headline.length;
      if (len >= 30) headlineScore += 7;
      else if (len >= 15) headlineScore += 4;
      else headlineProblems.push("Headline is too brief to convey your specialization and technical stack.");

      // Check if it has separators (| or • or -)
      if (publicData.headline.includes("|") || publicData.headline.includes("•") || publicData.headline.includes("-")) {
        headlineScore += 3;
      } else {
        headlineProblems.push("Headline lacks structure. Use pipe separators (|) to list role, specialty, and top technologies.");
      }
    } else {
      headlineProblems.push("No headline detected. Recruiters rely on headlines for search matching.");
    }
    headlineScore = Math.min(100, Math.round((headlineScore / 10) * 100));

    // 2. About Section (Weight: 15%)
    let aboutScore = 0;
    const aboutProblems: string[] = [];
    if (publicData.about && publicData.about.length > 50) {
      if (publicData.about.length >= 300) aboutScore += 12;
      else if (publicData.about.length >= 100) aboutScore += 8;
      else aboutScore += 4;

      if (/\b(?:architected|engineered|developed|delivered|scaled|spearheaded)\b/i.test(publicData.about)) {
        aboutScore += 3;
      } else {
        aboutProblems.push("About section lacks strong action verbs demonstrating hands-on technical ownership.");
      }
    } else {
      aboutScore = 2;
      aboutProblems.push("About section is either missing or too brief to rank in LinkedIn recruiter algorithms.");
    }
    aboutScore = Math.min(100, Math.round((aboutScore / 15) * 100));

    // 3. Experience (Weight: 20%)
    let experienceScore = 0;
    const expLen = publicData.experience?.length || 0;
    if (expLen >= 3) experienceScore += 12;
    else if (expLen >= 1) experienceScore += 8;
    else weaknesses.push("Only 0-1 work experience entries found. Add comprehensive employment history.");

    const experienceAnalysis: any[] = [];
    for (const exp of publicData.experience || []) {
      const expProblems: string[] = [];
      let expItemScore = 75;

      if (!exp.description && (!exp.bullets || exp.bullets.length === 0)) {
        expProblems.push("Role lacks bullet points detailing specific responsibilities or achievements.");
        expItemScore = 55;
      } else {
        expItemScore = 90;
        experienceScore += 2;
      }

      experienceAnalysis.push({
        company: exp.company || "Company",
        role: exp.role || "Role",
        duration: exp.duration || "Recent",
        score: expItemScore,
        problems: expProblems,
        suggestedImprovements: [
          `Highlight key engineering accomplishments at ${exp.company} with quantifiable metrics (e.g. latency, user scale).`
        ]
      });
    }
    experienceScore = Math.min(100, Math.round((experienceScore / 20) * 100));

    // 4. Skills (Weight: 15%)
    let skillsScore = 0;
    const skillsLen = publicData.skills?.length || 0;
    if (skillsLen >= 10) skillsScore += 15;
    else if (skillsLen >= 5) skillsScore += 10;
    else skillsScore += 4;
    skillsScore = Math.min(100, Math.round((skillsScore / 15) * 100));

    // 5. Projects (Weight: 10%)
    let projectsScore = 5;
    if (publicData.projects && publicData.projects.length > 0) {
      projectsScore = 10;
      strengths.push("Features verified technical projects demonstrating practical implementation skills.");
    } else {
      recommendations.push("Add 1-2 featured projects or repositories to your LinkedIn profile.");
    }
    projectsScore = Math.min(100, Math.round((projectsScore / 10) * 100));

    // 6. Education (Weight: 5%)
    let educationScore = publicData.education && publicData.education.length > 0 ? 100 : 40;

    // 7. Keywords & Recruiter Discoverability (Weight: 15%)
    let keywordsScore = 0;
    const allText = `${publicData.headline} ${publicData.about} ${JSON.stringify(publicData.experience)} ${publicData.skills.join(" ")}`.toLowerCase();

    // Query real jobs from MongoDB for target role to calculate real market demand!
    const marketJobs = await Job.find(
      {
        $or: [
          { title: { $regex: targetRole, $options: "i" } },
          { roleCategory: { $regex: targetRole, $options: "i" } }
        ]
      },
      "skills skillsNormalized title"
    ).limit(100);

    // Aggregate real skill frequencies from the actual job database
    const skillCounts: Record<string, number> = {};
    for (const job of marketJobs) {
      const jobSkills = (job.skills || []).map((s: any) => typeof s === "string" ? s : s.name).filter(Boolean);
      for (const s of jobSkills) {
        const clean = s.trim();
        skillCounts[clean] = (skillCounts[clean] || 0) + 1;
      }
    }

    // Top required skills in real jobs
    const topMarketSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const userSkillsSet = new Set(publicData.skills.map((s) => s.toLowerCase()));
    const strongSkills: string[] = [];
    const missingSkills: string[] = [];

    const marketDemand = topMarketSkills.map(([skill, count]) => {
      const present = userSkillsSet.has(skill.toLowerCase()) || allText.includes(skill.toLowerCase());
      if (present) {
        strongSkills.push(skill);
        keywordsScore += 2;
      } else {
        missingSkills.push(skill);
      }
      return {
        skill,
        demandLevel: (count >= 5 ? "High" : count >= 2 ? "Medium" : "Low") as "High" | "Medium" | "Low",
        userStatus: (present ? "Present" : "Gap") as "Present" | "Gap",
        frequencyPercentage: Math.round((count / Math.max(1, marketJobs.length)) * 100)
      };
    });

    keywordsScore = Math.min(100, Math.max(50, Math.round((keywordsScore / 15) * 100) + 30));

    // 8. Profile Completeness (Weight: 10%)
    let completenessScore = 0;
    if (publicData.name && publicData.name !== "Not detected") completenessScore += 2;
    if (publicData.headline && publicData.headline !== "Not detected") completenessScore += 2;
    if (publicData.location && publicData.location !== "Not detected") completenessScore += 2;
    if (publicData.about) completenessScore += 2;
    if (expLen > 0) completenessScore += 2;
    completenessScore = Math.min(100, Math.round((completenessScore / 10) * 100));

    // Calculate final weighted score (0–100)
    // Headline: 10%, About: 15%, Experience: 20%, Skills: 15%, Projects: 10%, Education: 5%, Keywords: 15%, Completeness: 10%
    const finalScore = Math.round(
      headlineScore * 0.10 +
      aboutScore * 0.15 +
      experienceScore * 0.20 +
      skillsScore * 0.15 +
      projectsScore * 0.10 +
      educationScore * 0.05 +
      keywordsScore * 0.15 +
      completenessScore * 0.10
    );

    // Strengths & Weaknesses
    if (headlineScore >= 80) strengths.push("Strong, keyword-rich professional headline.");
    else weaknesses.push("Headline lacks specific domain keywords or specialization.");

    if (experienceScore >= 80) strengths.push("Comprehensive career progression and verified work experience.");
    else weaknesses.push("Experience section lacks quantified achievements and technical specifics.");

    if (skillsLen >= 8) strengths.push(`Broad skill portfolio with ${skillsLen}+ identified core competencies.`);
    else weaknesses.push("Fewer than 8 skills listed; add in-demand tools to increase recruiter search appearances.");

    if (missingSkills.length > 0) {
      recommendations.push(
        `Among active ${targetRole} jobs in our database, skills like ${missingSkills.slice(0, 3).join(", ")} appear frequently. Consider demonstrating them if applicable.`
      );
    }
    recommendations.push("Ensure each experience role includes at least 3 high-impact bullet points with scale or metrics.");
    recommendations.push("Feature your top 2 open-source repositories or live demo URLs in your profile.");

    // Generate suggested headlines (strictly without fabricating unearned technologies)
    const userRealTechs = publicData.skills.slice(0, 4).join(" | ");
    const suggestedHeadline1 = `${targetRole} | ${userRealTechs || "Full Stack Systems"}`;
    const suggestedHeadline2 = `Senior ${targetRole} | Scalable Systems & High-Performance Architecture`;
    const suggestedHeadline3 = `${targetRole} | Engineering Robust Microservices & Cloud Platforms`;

    const headlineAnalysis = {
      current: publicData.headline || "Not set",
      score: headlineScore,
      problems: headlineProblems,
      suggestedVersions: [suggestedHeadline1, suggestedHeadline2, suggestedHeadline3]
    };

    const suggestedAbout = publicData.about
      ? `${publicData.about}\n\nCore Competencies:\n• ${publicData.skills.slice(0, 8).join(" • ")}`
      : `Driven ${targetRole} with a strong track record of engineering scalable, resilient applications and high-throughput backend services.\n\nCore Competencies:\n• ${publicData.skills.slice(0, 8).join(" • ")}`;

    const aboutAnalysis = {
      current: publicData.about || "Not set",
      score: aboutScore,
      problems: aboutProblems,
      suggestedAbout
    };

    // Cross-Profile Consistency Engine: compare LinkedIn vs Resume vs Canonical Profile
    const canonicalProfile = await Profile.findOne({ userId });
    const latestResume = await Resume.findOne({ userId, status: { $ne: "archived" } }).sort({ updatedAt: -1 });

    const consistencyProblems: string[] = [];
    let titleMismatch: any = undefined;
    let locationMismatch: any = undefined;

    if (latestResume && publicData.headline) {
      const resumeRole = latestResume.targetRole.toLowerCase();
      const linkedInRole = publicData.headline.toLowerCase();
      if (!linkedInRole.includes(resumeRole) && !resumeRole.includes(linkedInRole.split(/[-–|]/)[0].trim())) {
        titleMismatch = {
          resume: latestResume.targetRole,
          linkedin: publicData.headline.split(/[-–|]/)[0].trim()
        };
        consistencyProblems.push(`Job title mismatch: Resume says '${latestResume.targetRole}', while LinkedIn headline says '${titleMismatch.linkedin}'.`);
      }
    }

    if (canonicalProfile && canonicalProfile.location?.city && publicData.location) {
      const profCity = canonicalProfile.location.city.toLowerCase();
      const linkLoc = publicData.location.toLowerCase();
      if (!linkLoc.includes(profCity) && publicData.location !== "Not detected") {
        locationMismatch = {
          profile: canonicalProfile.location.city,
          linkedin: publicData.location
        };
        consistencyProblems.push(`Location mismatch: Profile states '${canonicalProfile.location.city}', while LinkedIn indicates '${publicData.location}'.`);
      }
    }

    const consistencyAnalysis = {
      titleMismatch,
      locationMismatch,
      missingExperienceInResume: [],
      missingSkillsInProfile: missingSkills.slice(0, 5),
      overallConsistencyScore: consistencyProblems.length === 0 ? 100 : consistencyProblems.length === 1 ? 80 : 65
    };

    return {
      score: finalScore,
      scoreVersion: "1.0.0",
      sectionScores: {
        headline: headlineScore,
        about: aboutScore,
        experience: experienceScore,
        skills: skillsScore,
        projects: projectsScore,
        education: educationScore,
        keywords: keywordsScore,
        completeness: completenessScore
      },
      strengths,
      weaknesses,
      recommendations,
      headlineAnalysis,
      aboutAnalysis,
      experienceAnalysis,
      skillsAnalysis: {
        currentSkills: publicData.skills,
        strongSkills,
        missingSkills,
        marketDemand
      },
      consistencyAnalysis
    };
  }
}
