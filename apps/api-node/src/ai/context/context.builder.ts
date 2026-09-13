import { IProfile } from "../../modules/profile/profile.model";

export class AIContextBuilder {
  /**
   * Builds context from verified facts ONLY.
   * Excludes AI_SUGGESTED or unverified facts from strict tasks.
   */
  static buildVerifiedCandidateContext(profile: IProfile): any {
    const verifiedSkills = (profile.skills || []).filter((s: any) => 
      s.provenance?.status === "VERIFIED" || s.verified_status === "VERIFIED"
    ).map((s: any) => typeof s === 'string' ? s : s.name);

    const verifiedExperience = (profile.experience || []).filter((e: any) => 
      e.provenance?.status === "VERIFIED" || e.verified_status === "VERIFIED"
    );

    return {
      personal: profile.personal,
      skills: verifiedSkills,
      experience: verifiedExperience.map(e => ({ title: e.title, company: e.company, bullets: e.bullets })),
      education: profile.education
    };
  }

  /**
   * Context for optimization that includes goals and unverified facts.
   */
  static buildOptimizationContext(profile: IProfile, jobDescription?: string): string {
    const contextObj = {
      candidate: this.buildVerifiedCandidateContext(profile),
      goals: profile.careerGoals,
      targetJob: jobDescription
    };

    return JSON.stringify(contextObj, null, 2);
  }
}
