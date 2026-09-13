import { FastifyInstance } from "fastify";
import { PortfolioController } from "./portfolio.controller";
import { authenticate } from "../../middleware/auth";

export async function portfolioRoutes(app: FastifyInstance) {
  app.get("/", { preValidation: [authenticate] }, PortfolioController.getPortfolio);
}
