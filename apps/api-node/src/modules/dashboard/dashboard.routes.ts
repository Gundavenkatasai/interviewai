import { FastifyInstance } from "fastify";
import { DashboardController } from "./dashboard.controller";
import { authenticate } from "../../middleware/auth";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get("/stats", { preValidation: [authenticate] }, DashboardController.getStats);
}
