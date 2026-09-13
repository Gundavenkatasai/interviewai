import { GitHubProfile, GitHubRepository } from "./resume.model";

export class ResumeGitHub {
  /**
   * Fetch public GitHub repositories and profile metadata using public GitHub API
   */
  static async fetchUserRepos(userId: string, username: string): Promise<{
    profile: any;
    repositories: any[];
    suggestedProjects: any[];
  }> {
    const cleanUsername = username.trim().replace(/^@/, "");
    if (!cleanUsername) {
      throw new Error("GitHub username is required");
    }

    // 1. Fetch Profile
    const profileRes = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}`, {
      headers: {
        "User-Agent": "InterviewAI-ResumeStudio/1.0",
        Accept: "application/vnd.github.v3+json"
      }
    });

    if (!profileRes.ok) {
      if (profileRes.status === 404) {
        throw new Error(`GitHub user '${cleanUsername}' was not found`);
      }
      throw new Error(`GitHub API returned status ${profileRes.status}`);
    }

    const profileData = await profileRes.json();

    // Upsert cached profile
    await GitHubProfile.findOneAndUpdate(
      { userId, username: cleanUsername },
      {
        userId,
        username: cleanUsername,
        name: profileData.name || cleanUsername,
        bio: profileData.bio || "",
        publicRepos: profileData.public_repos || 0,
        avatarUrl: profileData.avatar_url || "",
        htmlUrl: profileData.html_url || `https://github.com/${cleanUsername}`,
        cachedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // 2. Fetch Public Repositories (sort by updated)
    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?sort=updated&per_page=15`,
      {
        headers: {
          "User-Agent": "InterviewAI-ResumeStudio/1.0",
          Accept: "application/vnd.github.v3+json"
        }
      }
    );

    let reposData: any[] = [];
    if (reposRes.ok) {
      reposData = await reposRes.json();
    }

    const repositories: any[] = [];
    const suggestedProjects: any[] = [];

    for (const repo of reposData) {
      if (repo.fork) continue; // prioritize original repositories

      const languages = repo.language ? [repo.language] : [];
      const topics = repo.topics || [];
      const allTechs = Array.from(new Set([...languages, ...topics]));

      const repoDoc = {
        name: repo.name,
        description: repo.description || "Public software repository on GitHub",
        language: repo.language || "",
        languages: allTechs,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        topics,
        htmlUrl: repo.html_url,
        updatedAtGitHub: repo.updated_at
      };

      repositories.push(repoDoc);

      // Create pre-formatted project ready for one-click import into resume
      suggestedProjects.push({
        name: repo.name.replace(/[-_]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        description: repo.description || `Engineered and open-sourced ${repo.name} repository.`,
        technologies: allTechs.length > 0 ? allTechs : ["TypeScript", "Node.js"],
        url: repo.html_url,
        bullets: [
          `Architected and deployed open-source codebase for ${repo.name} with ${allTechs.join(", ") || "modern standards"}.`,
          `Maintained code quality, documentation, and continuous integration workflows on GitHub.`
        ]
      });

      // Save to cache
      await GitHubRepository.findOneAndUpdate(
        { userId, username: cleanUsername, name: repo.name },
        {
          userId,
          username: cleanUsername,
          ...repoDoc
        },
        { upsert: true }
      );
    }

    return {
      profile: profileData,
      repositories,
      suggestedProjects
    };
  }
}
