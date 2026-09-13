import { FastifyRequest, FastifyReply } from "fastify";
import { Profile } from "../profile/profile.model";

export class PortfolioController {
  static async getPortfolio(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.sub;
    let profile = await Profile.findOne({ userId });
    
    if (!profile) {
      profile = await Profile.create({
        userId,
        personal: { fullName: "Developer", title: "Software Engineer", bio: "Passionate developer building modern web applications." },
        skills: [
          { name: "JavaScript", verified_status: "UNVERIFIED", source: "USER_INPUT" },
          { name: "TypeScript", verified_status: "UNVERIFIED", source: "USER_INPUT" },
          { name: "React", verified_status: "UNVERIFIED", source: "USER_INPUT" },
          { name: "Node.js", verified_status: "UNVERIFIED", source: "USER_INPUT" },
          { name: "System Design", verified_status: "UNVERIFIED", source: "USER_INPUT" }
        ],
        projects: [
          { title: "Interview AI", description: "AI-powered job discovery and interview preparation platform.", technologies: ["React", "TypeScript", "Fastify", "MongoDB"] }
        ],
        experience: [
          { title: "Software Engineer", company: "Tech Systems", duration: "2023 - Present", description: "Developed scalable APIs and responsive frontends.", verified_status: "UNVERIFIED" }
        ],
        education: [
          { degree: "B.S. in Computer Science", institution: "University", year: "2023", verified_status: "UNVERIFIED" }
        ],
      });
    }

    const portfolio = {
      personal: profile.personal || { fullName: "Developer", title: "Software Engineer", bio: "Passionate developer building modern web applications." },
      projects: profile.projects || [],
      experience: profile.experience || [],
      education: profile.education || [],
      skills: profile.skills || [
        { name: "TypeScript", verified_status: "UNVERIFIED", source: "USER_INPUT" },
        { name: "React", verified_status: "UNVERIFIED", source: "USER_INPUT" },
        { name: "Node.js", verified_status: "UNVERIFIED", source: "USER_INPUT" }
      ],
      links: {
        linkedin: profile.linkedin || "",
        github: profile.github || "",
        portfolioUrl: profile.portfolio || "",
      }
    };

    return { success: true, data: portfolio, portfolio };
  }
}

