import { FastifyInstance } from "fastify";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../middleware/auth";

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", AuthController.register);
  app.post("/login", AuthController.login);
  app.post("/demo", AuthController.demo);
  app.post("/reset-password", AuthController.resetPassword);
  app.post("/logout", AuthController.logout);
  app.get("/me", { preValidation: [authenticate] }, AuthController.me);
}
