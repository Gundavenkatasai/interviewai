import { describe, it, expect, vi } from "vitest";
import { LinkedInRegistry } from "../src/integrations/linkedin/linkedin.registry";
import { LinkedInRunner } from "../src/integrations/linkedin/linkedin.runner";
import { LinkedInPolicy } from "../src/integrations/linkedin/linkedin.policy";
import { LinkedInMapper } from "../src/integrations/linkedin/linkedin.mapper";
import { ManualPublishProvider } from "../src/integrations/linkedin/providers/publish.provider";

describe("LinkedIn Skills Dynamic Discovery (Phase 3)", () => {
  it("should dynamically discover all 12 skills from skills/*/SKILL.md", () => {
    const skills = LinkedInRegistry.discoverSkills(true);
    expect(skills.length).toBeGreaterThanOrEqual(12);

    const skillNames = skills.map(s => s.skillName);
    expect(skillNames).toContain("linkedin-post-writer");
    expect(skillNames).toContain("linkedin-comment-drafter");
    expect(skillNames).toContain("linkedin-reply-handler");
    expect(skillNames).toContain("linkedin-humanizer");
    expect(skillNames).toContain("linkedin-hook-extractor");
    expect(skillNames).toContain("linkedin-content-planner");
    expect(skillNames).toContain("linkedin-thread-monitor");
    expect(skillNames).toContain("linkedin-engager-analytics");
    expect(skillNames).toContain("linkedin-profile-optimizer");
    expect(skillNames).toContain("linkedin-employee-advocacy");
    expect(skillNames).toContain("linkedin-repurposer");
    expect(skillNames).toContain("linkedin-interviewer");
  });

  it("should parse skill metadata, categories, and instruction layers", () => {
    const postWriter = LinkedInRegistry.getSkill("linkedin-post-writer");
    expect(postWriter).toBeDefined();
    expect(postWriter?.category).toBe("CONTENT");
    expect(postWriter?.supportsPublish).toBe(true);
    expect(postWriter?.displayName).toBe("Post Writer");

    const instructions = LinkedInRegistry.getSkillInstructions("linkedin-post-writer");
    expect(instructions).toContain("LinkedIn Post Writer");
    expect(instructions).toContain("Platform Risk Anaphora");
  });

  it("should load upstream references (e.g. hook formulas)", () => {
    const formulas = LinkedInRegistry.getReference("hook-formulas.md");
    expect(formulas).toBeDefined();
    expect(formulas.length).toBeGreaterThan(100);
    expect(formulas).toContain("Odd-Precision");
  });
});

describe("Python Runtime Bridge (Phase 2 & 4)", () => {
  it("should execute active-backend check and return structured JSON with Apify detected", async () => {
    const backendStatus = await LinkedInRunner.getActiveBackend();
    expect(backendStatus.success).toBe(true);
    expect(backendStatus.backend).toBeDefined();
    expect(["manual", "publora", "diy"]).toContain(backendStatus.backend);
    expect(backendStatus.providers).toBeDefined();
    expect(backendStatus.providers.apify.configured).toBe(true);
  });

  it("should parse LinkedIn post and comment URLs into structured URNs", async () => {
    const postUrl = "https://www.linkedin.com/feed/update/urn:li:activity:7123456789012345678/";
    const parsed = await LinkedInRunner.parseUrl(postUrl);
    expect(parsed.post_activity_id).toBe("7123456789012345678");
    expect(parsed.post_urn).toBe("urn:li:activity:7123456789012345678");
    expect(parsed.url_type).toBe("post");
  });

  it("should parse 2-level comment thread URLs", async () => {
    const commentUrl = "https://www.linkedin.com/feed/update/urn:li:activity:7448387840113184768?commentUrn=urn%3Ali%3Acomment%3A%28activity%3A7448387840113184768%2C7449095071892672512%29";
    const parsed = await LinkedInRunner.parseUrl(commentUrl);
    expect(parsed.url_type).toBe("comment");
    expect(parsed.comment_id).toBe("7449095071892672512");
    expect(parsed.post_activity_id).toBe("7448387840113184768");
  });

  it("should gracefully handle manual publishing mode without API keys", async () => {
    const manualProvider = new ManualPublishProvider();
    const result = await manualProvider.publishPost({
      kind: "post",
      draftText: "Scaling Node.js microservices to 10k RPS",
      targetUrl: "https://www.linkedin.com/feed/",
    });
    expect(result.mode).toBe("manual");
    expect(result.copyReadyText).toBe("Scaling Node.js microservices to 10k RPS");
    expect(result.url).toBe("https://www.linkedin.com/feed/");
    expect(result.message).toContain("Copy the text below");
  });

  it("should generate quote cards with fallback when Pixfaro key is absent", async () => {
    const card = await LinkedInRunner.generateQuoteCard("Proven hook formula", "@InterviewAI");
    expect(card.success).toBe(true);
    expect(card.data).toBeDefined();
  });
});

describe("Approval State Machine & Security (Phase 35, 40)", () => {
  it("should strictly forbid publishing unless approvalStatus is APPROVED", () => {
    expect(LinkedInPolicy.canPublish("DRAFT")).toBe(false);
    expect(LinkedInPolicy.canPublish("REVIEW")).toBe(false);
    expect(LinkedInPolicy.canPublish("USER_EDITED")).toBe(false);
    expect(LinkedInPolicy.canPublish("REJECTED")).toBe(false);
    expect(LinkedInPolicy.canPublish("APPROVED")).toBe(true);
  });

  it("should enforce valid state transitions", () => {
    expect(LinkedInPolicy.validateTransition("DRAFT", "APPROVED")).toBe(true);
    expect(LinkedInPolicy.validateTransition("DRAFT", "USER_EDITED")).toBe(true);
    expect(LinkedInPolicy.validateTransition("APPROVED", "EXECUTING")).toBe(true);
    expect(LinkedInPolicy.validateTransition("COMPLETED", "APPROVED")).toBe(false);
    expect(LinkedInPolicy.validateTransition("APPROVED", "APPROVED")).toBe(true); // Idempotent
  });

  it("should enforce resource ownership and prevent IDOR", () => {
    const userA = "user-123";
    const userB = "user-456";
    expect(() => LinkedInPolicy.enforceOwnership(userA, userA)).not.toThrow();
    expect(() => LinkedInPolicy.enforceOwnership(userA, userB)).toThrow("Access forbidden");
  });
});

describe("Anti-Fabrication & Story Bank Mapping (Phase 7, 24, 39)", () => {
  it("should map Interviewer output into canonical STAR InterviewStory shape", () => {
    const mapped = LinkedInMapper.mapToInterviewStory({
      userId: "user-123",
      title: "Reduced P99 Latency by 35%",
      situation: "High-traffic checkout service experienced slow database queries",
      task: "Optimize query throughput without increasing AWS RDS instance size",
      action: "Introduced Redis caching layer and optimized compound indexes",
      result: "P99 latency decreased from 420ms to 270ms (35% improvement)",
      reflection: "Caching write-through is more maintainable than replica sharding",
      metrics: ["35% reduction in latency", "Zero infrastructure cost increase"],
    });

    expect(mapped.title).toBe("Reduced P99 Latency by 35%");
    expect(mapped.situationCompleteness).toBe("COMPLETE");
    expect(mapped.actionCompleteness).toBe("COMPLETE");
    expect(mapped.resultCompleteness).toBe("COMPLETE");
    expect(mapped.origin).toBe("INTERVIEW_ANSWER");
    expect(mapped.status).toBe("VERIFIED");
  });

  it("should normalize engager profiles marking unknown fields as unknown", () => {
    const raw = {
      authorName: "Jane Doe",
      url: "https://www.linkedin.com/in/janedoe",
      company: null,
      role: undefined,
    };
    const engager = LinkedInMapper.mapToEngager(raw, "user-123");
    expect(engager.name).toBe("Jane Doe");
    expect(engager.company).toBe("Unknown Company");
    expect(engager.role).toBe("Unknown Role");
    expect(engager.icpCategory).toBe("PEER");
  });
});
