import fs from "fs";
import path from "path";

export interface ILinkedInSkillMetadata {
  skillName: string;
  displayName: string;
  description: string;
  category: "CONTENT" | "ENGAGEMENT" | "OPTIMIZATION" | "STRATEGY" | "ADVOCACY" | "INTERVIEW";
  enabled: boolean;
  requiredReadLayer: "NONE" | "OPTIONAL" | "REQUIRED";
  requiredWriteLayer: "NONE" | "OPTIONAL" | "REQUIRED";
  requiredImageLayer: "NONE" | "OPTIONAL" | "REQUIRED";
  supportsDraft: boolean;
  supportsApproval: boolean;
  supportsPublish: boolean;
  supportsBackgroundExecution: boolean;
  skillPath: string;
  referencesPath: string;
}

export class LinkedInRegistry {
  private static cachedSkills: Map<string, ILinkedInSkillMetadata> = new Map();
  private static lastScanned: number = 0;
  private static CACHE_TTL_MS = 60 * 1000; // 1 minute

  private static getSkillsDirectory(): string {
    // Look for services/linkedin-skills/skills relative to project root or workspace
    const possiblePaths = [
      path.resolve(process.cwd(), "../../services/linkedin-skills/skills"),
      path.resolve(process.cwd(), "services/linkedin-skills/skills"),
      path.resolve(process.cwd(), "../services/linkedin-skills/skills"),
      path.resolve(__dirname, "../../../../../services/linkedin-skills/skills"),
      path.resolve(__dirname, "../../../../services/linkedin-skills/skills"),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    return possiblePaths[0];
  }

  /**
   * Parse YAML frontmatter from a SKILL.md file
   */
  private static parseFrontmatter(content: string): { name?: string; description?: string } {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return {};
    const yamlBlock = match[1];

    let name: string | undefined;
    let description: string | undefined;

    const nameMatch = yamlBlock.match(/^name:\s*(.+)$/m);
    if (nameMatch) {
      name = nameMatch[1].trim().replace(/^["']|["']$/g, "");
    }

    const descMatch = yamlBlock.match(/^description:\s*(.+)$/m);
    if (descMatch) {
      description = descMatch[1].trim().replace(/^["']|["']$/g, "");
    }

    return { name, description };
  }

  /**
   * Infer skill capabilities and layers based on skillName
   */
  private static inferMetadata(skillName: string, description: string, skillPath: string): ILinkedInSkillMetadata {
    const displayName = skillName
      .replace(/^linkedin-/, "")
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    let category: ILinkedInSkillMetadata["category"] = "CONTENT";
    let requiredReadLayer: ILinkedInSkillMetadata["requiredReadLayer"] = "NONE";
    let requiredWriteLayer: ILinkedInSkillMetadata["requiredWriteLayer"] = "NONE";
    let requiredImageLayer: ILinkedInSkillMetadata["requiredImageLayer"] = "NONE";
    let supportsDraft = true;
    let supportsApproval = true;
    let supportsPublish = false;
    let supportsBackgroundExecution = false;

    switch (skillName) {
      case "linkedin-post-writer":
        category = "CONTENT";
        requiredWriteLayer = "OPTIONAL";
        requiredImageLayer = "OPTIONAL";
        supportsPublish = true;
        break;

      case "linkedin-comment-drafter":
        category = "ENGAGEMENT";
        requiredReadLayer = "OPTIONAL";
        requiredWriteLayer = "OPTIONAL";
        supportsPublish = true;
        break;

      case "linkedin-reply-handler":
        category = "ENGAGEMENT";
        requiredReadLayer = "OPTIONAL";
        requiredWriteLayer = "OPTIONAL";
        supportsPublish = true;
        break;

      case "linkedin-humanizer":
        category = "CONTENT";
        supportsPublish = false;
        break;

      case "linkedin-hook-extractor":
        category = "CONTENT";
        requiredReadLayer = "OPTIONAL";
        supportsPublish = false;
        break;

      case "linkedin-content-planner":
        category = "STRATEGY";
        supportsPublish = false;
        break;

      case "linkedin-thread-monitor":
        category = "ENGAGEMENT";
        requiredReadLayer = "OPTIONAL";
        supportsBackgroundExecution = true;
        break;

      case "linkedin-engager-analytics":
        category = "STRATEGY";
        requiredReadLayer = "OPTIONAL";
        supportsBackgroundExecution = true;
        break;

      case "linkedin-profile-optimizer":
        category = "OPTIMIZATION";
        requiredReadLayer = "OPTIONAL";
        supportsPublish = false;
        break;

      case "linkedin-employee-advocacy":
        category = "ADVOCACY";
        requiredWriteLayer = "OPTIONAL";
        supportsPublish = true;
        break;

      case "linkedin-repurposer":
        category = "CONTENT";
        requiredWriteLayer = "OPTIONAL";
        supportsPublish = true;
        break;

      case "linkedin-interviewer":
        category = "INTERVIEW";
        supportsPublish = false;
        break;
    }

    const referencesPath = path.resolve(skillPath, "../../references");

    return {
      skillName,
      displayName,
      description: description || `LinkedIn ${displayName} Skill`,
      category,
      enabled: skillName === "linkedin-employee-advocacy" 
        ? process.env.LINKEDIN_EMPLOYEE_ADVOCACY === "true" 
        : true,
      requiredReadLayer,
      requiredWriteLayer,
      requiredImageLayer,
      supportsDraft,
      supportsApproval,
      supportsPublish,
      supportsBackgroundExecution,
      skillPath,
      referencesPath,
    };
  }

  /**
   * Discover and parse all skills dynamically from services/linkedin-skills/skills/
   */
  public static discoverSkills(forceRefresh: boolean = false): ILinkedInSkillMetadata[] {
    const now = Date.now();
    if (!forceRefresh && this.cachedSkills.size > 0 && now - this.lastScanned < this.CACHE_TTL_MS) {
      return Array.from(this.cachedSkills.values());
    }

    const skillsDir = this.getSkillsDirectory();
    this.cachedSkills.clear();

    if (!fs.existsSync(skillsDir)) {
      console.warn(`[LinkedInRegistry] Skills directory not found: ${skillsDir}`);
      return [];
    }

    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = path.join(skillsDir, entry.name);
        const skillMdPath = path.join(skillPath, "SKILL.md");

        if (fs.existsSync(skillMdPath)) {
          try {
            const content = fs.readFileSync(skillMdPath, "utf-8");
            const { name, description } = this.parseFrontmatter(content);
            const resolvedName = name || entry.name;
            const metadata = this.inferMetadata(resolvedName, description || "", skillPath);
            this.cachedSkills.set(resolvedName, metadata);
          } catch (err) {
            console.error(`[LinkedInRegistry] Error parsing ${skillMdPath}:`, err);
          }
        }
      }
    }

    this.lastScanned = now;
    return Array.from(this.cachedSkills.values());
  }

  public static getSkill(name: string): ILinkedInSkillMetadata | undefined {
    this.discoverSkills();
    return this.cachedSkills.get(name);
  }

  public static getSkillInstructions(name: string): string {
    const skill = this.getSkill(name);
    if (!skill) {
      throw new Error(`Skill ${name} not found in registry`);
    }
    const skillMdPath = path.join(skill.skillPath, "SKILL.md");
    if (!fs.existsSync(skillMdPath)) {
      throw new Error(`SKILL.md not found at ${skillMdPath}`);
    }
    return fs.readFileSync(skillMdPath, "utf-8");
  }

  public static getReference(name: string): string {
    const skillsDir = this.getSkillsDirectory();
    const refPath = path.resolve(skillsDir, "../references", name.endsWith(".md") ? name : `${name}.md`);
    if (fs.existsSync(refPath)) {
      return fs.readFileSync(refPath, "utf-8");
    }
    return "";
  }
}
