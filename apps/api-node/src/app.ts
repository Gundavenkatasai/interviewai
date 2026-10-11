import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "./config/env";
import { connectDB } from "./db/mongo";
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import multipart from "@fastify/multipart";
import fastifyWebsocket from "@fastify/websocket";
import { authRoutes } from "./modules/auth/auth.routes";
import { profileRoutes } from "./modules/profile/profile.routes";
import { resumeRoutes } from "./modules/resume/resume.routes";
import { tailoringRoutes } from "./modules/resume/tailoring/tailoring.routes";
import { interviewRoutes } from "./modules/interview/interview.routes";
import { jobsRoutes } from "./modules/jobs/jobs.routes";
import { linkedinRoutes } from "./modules/linkedin/linkedin.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import intelligenceRoutes from "./modules/interview-intelligence/intelligence.routes";
import storyRoutes from "./modules/story-bank/story.routes";
import debriefRoutes from "./modules/interview-debrief/debrief.routes";
import { websocketRoutes } from "./websocket/handlers";
import { importedDocxRoutes } from "./modules/resume/imported-docx/imported-docx.routes";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    requestIdHeader: "x-request-id",
    genReqId: (req) => (req.headers["x-request-id"] as string) || randomUUID(),
    trustProxy: process.env.NODE_ENV === "production",
    logger: {
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    },
  });

  // Inject correlation ID header in all responses
  app.addHook("onSend", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });

  // Register Helmet with Content Security Policy, Frameguard, and HSTS
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "https:", "wss:", "ws:"],
        frameAncestors: ["'none'"],
      },
    },
    frameguard: { action: "deny" },
    hsts:
      process.env.NODE_ENV === "production"
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    noSniff: true,
  });

  // Global Rate Limiting with user/ip key generator
  await app.register(fastifyRateLimit, {
    global: true,
    max: process.env.NODE_ENV === "production" ? 1500 : 10000,
    timeWindow: "1 minute",
    keyGenerator: (req) => {
      return (req as any).user?.sub || (req as any).user?.id || req.ip;
    },
    allowList: ["/health", "/healthz", "/health/live", "/health/ready", "/docs"],
  });

  // Restrictive CORS Allowlist
  const allowedOrigins = (env.FRONTEND_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || process.env.NODE_ENV !== "production") {
        return cb(null, true);
      }
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("CORS policy violation: Origin not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
    exposedHeaders: ["x-request-id"],
  });

  // Allow empty JSON bodies (Fastify 5 rejects Content-Type: application/json with no body)
  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    function (req, body: string, done) {
      if (!body || body.trim() === "") {
        done(null, {});
        return;
      }
      try {
        done(null, JSON.parse(body));
      } catch (err: any) {
        err.statusCode = 400;
        done(err, undefined);
      }
    }
  );

  await app.register(cookie, {
    secret: env.JWT_SECRET,
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: "token",
      signed: false,
    },
  });

  // Swagger docs
  await app.register(swagger, {
    openapi: {
      info: {
        title: "INTERVIEW AI API",
        description: "Node.js/Fastify Backend API for INTERVIEW AI",
        version: "2.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  await app.register(fastifyWebsocket);

  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  // Error Handler
  app.setErrorHandler((error: any, request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode || 500;
    const message =
      statusCode === 500 && process.env.NODE_ENV === "production"
        ? "An internal server error occurred"
        : error.message || "Internal Server Error";

    reply.status(statusCode).send({
      success: false,
      error: {
        code: statusCode === 500 ? "INTERNAL_ERROR" : "API_ERROR",
        message,
        requestId: request.id,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
    });
  });

  // 404 Handler for unknown routes
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${request.method} ${request.url} not found`,
        requestId: request.id,
      },
    });
  });

  // Liveness Probes
  app.get("/healthz", async () => {
    return { status: "live", timestamp: new Date().toISOString() };
  });
  app.get("/health/live", async () => {
    return { status: "live", timestamp: new Date().toISOString() };
  });

  // Readiness Probe
  app.get("/health/ready", async (request, reply) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (!isDbConnected) {
      return reply.status(503).send({
        status: "unready",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      });
    }
    return {
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString(),
    };
  });

  // Overall Health Check
  app.get("/health", async () => {
    const isDbConnected = mongoose.connection.readyState === 1;
    return {
      status: isDbConnected ? "ok" : "degraded",
      database: isDbConnected ? "connected" : "disconnected",
      uptime: process.uptime(),
      version: "2.0.0",
      timestamp: new Date().toISOString(),
    };
  });

  // Initialize DB Connection
  await connectDB(app);

  // Register Routes
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(profileRoutes, { prefix: "/api/profile" });
  app.register(resumeRoutes, { prefix: "/api/resumes" });
  app.register(interviewRoutes, { prefix: "/api/interviews" });
  app.register(jobsRoutes, { prefix: "/api/jobs" });
  app.register(linkedinRoutes, { prefix: "/api/linkedin" });
  app.register(dashboardRoutes, { prefix: "/api/dashboard" });
  app.register(intelligenceRoutes, { prefix: "/api/interview-intelligence" });
  app.register(storyRoutes, { prefix: "/api/interview-stories" });
  app.register(debriefRoutes, { prefix: "/api/interview-debriefs" });
  app.register(importedDocxRoutes, { prefix: "/api/resume/imported-docx" });
  app.register(websocketRoutes);

  return app;
}
