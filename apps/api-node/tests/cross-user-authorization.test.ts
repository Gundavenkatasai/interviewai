import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app";
import { FastifyInstance } from "fastify";
import mongoose from "mongoose";
import { User } from "../src/modules/users/users.model";
import { Resume } from "../src/modules/resume/resume.model";
import { InterviewSession } from "../src/modules/interview/interview.model";

describe("Cross-User Authorization & Anti-IDOR Security Suite", () => {
  let app: FastifyInstance;
  let tokenUserA: string;
  let tokenUserB: string;
  let userAId: string;
  let userBId: string;
  let resumeAId: string;
  let sessionAId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Register User A
    const resA = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: `user-a-${Date.now()}@test.security`,
        password: "Password123!",
        fullName: "User A Security",
      },
    });
    const bodyA = JSON.parse(resA.payload);
    tokenUserA = bodyA.token;
    userAId = bodyA.user._id;

    // Register User B
    const resB = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: `user-b-${Date.now()}@test.security`,
        password: "Password123!",
        fullName: "User B Security",
      },
    });
    const bodyB = JSON.parse(resB.payload);
    tokenUserB = bodyB.token;
    userBId = bodyB.user._id;

    // User A creates a Resume
    const resumeRes = await app.inject({
      method: "POST",
      url: "/api/resumes",
      headers: { Authorization: `Bearer ${tokenUserA}` },
      payload: {
        name: "User A Confidential Resume",
        targetRole: "Security Engineer",
      },
    });
    const resumeBody = JSON.parse(resumeRes.payload);
    resumeAId = resumeBody.resume._id;

    // User A creates an Interview Session
    const sessionRes = await app.inject({
      method: "POST",
      url: "/api/interviews",
      headers: { Authorization: `Bearer ${tokenUserA}` },
      payload: {
        role: "Security Engineer",
        interviewType: "technical",
        difficulty: "hard",
      },
    });
    const sessionBody = JSON.parse(sessionRes.payload);
    sessionAId = sessionBody.session?.id || sessionBody.session?._id;
  });

  afterAll(async () => {
    if (userAId) await User.deleteOne({ _id: userAId });
    if (userBId) await User.deleteOne({ _id: userBId });
    if (resumeAId) await Resume.deleteOne({ _id: resumeAId });
    if (sessionAId) await InterviewSession.deleteOne({ _id: sessionAId });
    await app.close();
    await mongoose.disconnect();
  });

  describe("Resume Isolation", () => {
    it("User A can access their own resume", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/resumes/${resumeAId}`,
        headers: { Authorization: `Bearer ${tokenUserA}` },
      });
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.payload);
      expect(data.resume.name).toBe("User A Confidential Resume");
    });

    it("User B CANNOT read User A's resume (IDOR Protection)", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/resumes/${resumeAId}`,
        headers: { Authorization: `Bearer ${tokenUserB}` },
      });
      expect([403, 404]).toContain(res.statusCode);
      const data = JSON.parse(res.payload);
      expect(data.resume).toBeUndefined();
    });

    it("User B CANNOT modify User A's resume", async () => {
      const res = await app.inject({
        method: "PUT",
        url: `/api/resumes/${resumeAId}`,
        headers: { Authorization: `Bearer ${tokenUserB}` },
        payload: { name: "Hacked Resume Title" },
      });
      expect([403, 404]).toContain(res.statusCode);

      // Verify User A's resume remains unmodified
      const original = await Resume.findById(resumeAId);
      expect(original?.name).toBe("User A Confidential Resume");
    });

    it("User B CANNOT delete User A's resume", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/resumes/${resumeAId}`,
        headers: { Authorization: `Bearer ${tokenUserB}` },
      });
      expect([400, 403, 404]).toContain(res.statusCode);

      // Verify resume still exists
      const original = await Resume.findById(resumeAId);
      expect(original).not.toBeNull();
    });
  });

  describe("Interview Session & Report Isolation", () => {
    it("User A can access their own interview session", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/interviews/${sessionAId}`,
        headers: { Authorization: `Bearer ${tokenUserA}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it("User B CANNOT access User A's interview session", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/interviews/${sessionAId}`,
        headers: { Authorization: `Bearer ${tokenUserB}` },
      });
      expect([403, 404]).toContain(res.statusCode);
    });

    it("User B CANNOT submit answers to User A's session", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/interviews/${sessionAId}/answers`,
        headers: { Authorization: `Bearer ${tokenUserB}` },
        payload: {
          questionId: "q-1",
          transcript: "Injected Malicious Answer",
        },
      });
      expect([403, 404]).toContain(res.statusCode);
    });

    it("User B CANNOT generate or access User A's interview report", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/interviews/${sessionAId}/report`,
        headers: { Authorization: `Bearer ${tokenUserB}` },
      });
      expect([403, 404]).toContain(res.statusCode);
    });

    it("User B CANNOT delete User A's interview session", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/interviews/${sessionAId}`,
        headers: { Authorization: `Bearer ${tokenUserB}` },
      });
      expect([403, 404]).toContain(res.statusCode);

      const session = await InterviewSession.findById(sessionAId);
      expect(session).not.toBeNull();
    });
  });
});
