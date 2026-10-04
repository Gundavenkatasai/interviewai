import { randomUUID } from "crypto";

export function createMockUser(overrides: Record<string, any> = {}) {
  return {
    _id: randomUUID(),
    email: `test-${Date.now()}@example.com`,
    name: "Test Engineer",
    role: "USER",
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockJob(overrides: Record<string, any> = {}) {
  return {
    _id: randomUUID(),
    title: "Senior Full Stack Engineer",
    company: "Acme Tech Inc",
    location: "San Francisco, CA",
    workMode: "REMOTE",
    description: "Looking for an experienced TypeScript and React engineer.",
    skills: ["TypeScript", "React", "Node.js"],
    source: "greenhouse",
    sourceUrl: "https://boards.greenhouse.io/acme/jobs/123",
    postedAt: new Date(),
    ...overrides,
  };
}

export function createMockInterviewSession(overrides: Record<string, any> = {}) {
  return {
    _id: randomUUID(),
    userId: randomUUID(),
    jobRole: "Senior Frontend Engineer",
    interviewType: "TECHNICAL",
    status: "SETUP",
    stateVersion: 1,
    currentQuestionIndex: 0,
    totalQuestions: 5,
    startedAt: new Date(),
    ...overrides,
  };
}
