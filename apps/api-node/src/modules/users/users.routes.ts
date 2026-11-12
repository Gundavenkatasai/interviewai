import { FastifyInstance } from "fastify";
import { UsersController } from "./users.controller";
import { authenticate } from "../../middleware/auth";

export async function usersRoutes(app: FastifyInstance) {
  app.delete("/me/data", { preValidation: [authenticate] }, UsersController.deleteUserData);
}

