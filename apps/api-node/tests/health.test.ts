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
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });
});
