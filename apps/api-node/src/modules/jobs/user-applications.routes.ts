import { FastifyInstance } from "fastify";
import { UserApplicationsController } from "./user-applications.controller";
import { optionalAuthenticate } from "../../middleware/auth";

export async function userApplicationsRoutes(app: FastifyInstance) {
  // GET /api/user/saved-jobs
  app.get("/saved-jobs", { preValidation: [optionalAuthenticate] }, UserApplicationsController.getSavedJobs);

  // POST /api/user/applications
  app.post("/applications", { preValidation: [optionalAuthenticate] }, UserApplicationsController.trackApplication);

  // GET /api/user/applications
  app.get("/applications", { preValidation: [optionalAuthenticate] }, UserApplicationsController.getApplications);

  // User preferences
  app.get("/preferences", { preValidation: [optionalAuthenticate] }, UserApplicationsController.getPreferences);
  app.post("/preferences", { preValidation: [optionalAuthenticate] }, UserApplicationsController.savePreferences);
}

