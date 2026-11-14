import { FastifyInstance } from "fastify";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../middleware/auth";

export async function authRoutes(app: FastifyInstance) {
  const strictRateLimit = {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: "1 minute",
      },
    },
  };

  app.post("/register", strictRateLimit, AuthController.register);
  app.post("/login", strictRateLimit, AuthController.login);
  app.post("/google", strictRateLimit, AuthController.googleAuth);
  app.get("/google/config", async () => ({
    clientId: process.env.GOOGLE_CLIENT_ID || "684513696427-eo6ditdc0icb9d25quoi87qcgr4kt9to.apps.googleusercontent.com",
    configured: Boolean(process.env.GOOGLE_CLIENT_ID),
  }));
  app.post("/demo", AuthController.demo);
  app.post("/reset-password", strictRateLimit, AuthController.resetPassword);
  app.post("/logout", AuthController.logout);
  app.get("/me", { preValidation: [authenticate] }, AuthController.me);
}
