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
import multipart from "@fastify/multipart";
import fastifyWebsocket from "@fastify/websocket";
import { authRoutes } from "./modules/auth/auth.routes";
import { profileRoutes } from "./modules/profile/profile.routes";
import { resumeRoutes } from "./modules/resume/resume.routes";
import { tailoringRoutes } from "./modules/resume/tailoring/tailoring.routes";
import { interviewRoutes } from "./modules/interview/interview.routes";
import { jobsRoutes } from "./modules/jobs/jobs.routes";
import { applicationsRoutes } from "./modules/applications/applications.routes";
import { outreachRoutes } from "./modules/outreach/outreach.routes";
import { linkedinRoutes } from "./modules/linkedin/linkedin.routes";
import { portfolioRoutes } from "./modules/portfolio/portfolio.routes";
import { pipelineRoutes } from "./modules/pipeline/pipeline.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { analyticsRoutes } from "./modules/analytics/analytics.routes";
import intelligenceRoutes from "./modules/interview-intelligence/intelligence.routes";
import storyRoutes from "./modules/story-bank/story.routes";
import debriefRoutes from "./modules/interview-debrief/debrief.routes";
import { websocketRoutes } from "./websocket/handlers";
import { importedDocxRoutes } from "./modules/resume/imported-docx/imported-docx.routes";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
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

  // Register plugins
  await app.register(fastifyHelmet);
  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  await app.register(cors, {
    origin: process.env.NODE_ENV === "production" ? env.FRONTEND_URL : true,
    credentials: true,
  });

  // Allow empty JSON bodies (Fastify 5 rejects Content-Type: application/json with no body)
  app.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body: string, done) {
    if (!body || body.trim() === '') {
      done(null, {});
      return;
    }
    try {
      done(null, JSON.parse(body));
    } catch (err: any) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });

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
        version: "1.0.0",
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
    }
  });

  await app.register(fastifyWebsocket);

  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  // Error Handler
  app.setErrorHandler((error: any, request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    reply.status(statusCode).send({
      success: false,
      error: {
        code: statusCode === 500 ? "INTERNAL_ERROR" : "API_ERROR",
        message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
    });
  });

  // Health Check
  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Initialize DB Connection
  await connectDB(app);

  // Register Routes
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(profileRoutes, { prefix: "/api/profile" });
  app.register(resumeRoutes, { prefix: "/api/resumes" });
  app.register(interviewRoutes, { prefix: "/api/interviews" });
  app.register(jobsRoutes, { prefix: "/api/jobs" });
  app.register(applicationsRoutes, { prefix: "/api/applications" });
  app.register(outreachRoutes, { prefix: "/api/outreach" });
  app.register(linkedinRoutes, { prefix: "/api/linkedin" });
  app.register(portfolioRoutes, { prefix: "/api/portfolio" });
  app.register(pipelineRoutes, { prefix: "/api/pipeline" });
  app.register(dashboardRoutes, { prefix: "/api/dashboard" });
  app.register(analyticsRoutes, { prefix: "/api/analytics" });
  app.register(intelligenceRoutes, { prefix: "/api/interview-intelligence" });
  app.register(storyRoutes, { prefix: "/api/interview-stories" });
  app.register(debriefRoutes, { prefix: "/api/interview-debriefs" });
  app.register(importedDocxRoutes, { prefix: "/api/resume/imported-docx" });
  app.register(websocketRoutes);

  return app;
}
