import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app";
import { FastifyInstance } from "fastify";
import mongoose from "mongoose";

describe("Health API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Avoid connecting to real DB in simple tests or mock it
    // For this simple test, we can stub connectDB if needed,
    // but building the app connects to DB.
    // So we'll let it connect to the test DB.
    process.env.MONGODB_URI = "mongodb://localhost:27017/applyhustle_test";
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await mongoose.disconnect();
  });

  it("should return 200 on /health", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBeDefined();
    expect(body.timestamp).toBeDefined();
    expect(response.headers["x-request-id"]).toBeDefined();
  });

  it("should return 200 on /healthz and /health/live", async () => {
    const res1 = await app.inject({ method: "GET", url: "/healthz" });
    expect(res1.statusCode).toBe(200);
    const body1 = JSON.parse(res1.payload);
    expect(body1.status).toBe("live");

    const res2 = await app.inject({ method: "GET", url: "/health/live" });
    expect(res2.statusCode).toBe(200);
  });

  it("should return 200 on /health/ready when database is connected", async () => {
    const response = await app.inject({ method: "GET", url: "/health/ready" });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe("ready");
  });

  it("should return 404 structured JSON on unknown route", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/non-existent-api-route",
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.requestId).toBeDefined();
  });
});
