import { FastifyInstance } from "fastify";
import { JobsController } from "./jobs.controller";
import { authenticate, optionalAuthenticate } from "../../middleware/auth";

export async function jobsRoutes(app: FastifyInstance) {
  // IMPORTANT: Specific routes must come BEFORE parameterized routes to avoid conflicts
  
  // Filter counts (no auth needed for filter UI)
  app.get("/filter-counts", JobsController.filterCounts);
  
  // Sync & ingestion
  app.post("/sync", { preValidation: [authenticate] }, JobsController.syncJobs);
  
  // New job count
  app.get("/new-count", { preValidation: [authenticate] }, JobsController.getNewCount);
  
  // Day 4: Strict recent feed
  app.get("/recent", { preValidation: [authenticate] }, JobsController.getRecentJobs);
  
  // Day 4: Source Health
  app.get("/source-health", { preValidation: [authenticate] }, JobsController.getSourceHealth);
  
  // Phase 4: Job Sources dynamically from registry
  app.get("/sources", { preValidation: [optionalAuthenticate] }, JobsController.getSources);
  
  // Stats
  app.get("/stats/summary", { preValidation: [optionalAuthenticate] }, JobsController.getStats);

  // Recommended Jobs (Batch matching)
  app.get("/recommended", { preValidation: [authenticate] }, JobsController.getRecommendedJobs);

  // Saved Jobs - must be before /:id
  app.get("/saved", { preValidation: [authenticate] }, JobsController.getSavedJobs);
  
  // Applications list
  app.get("/applications", { preValidation: [authenticate] }, JobsController.getSavedJobs);

  // List jobs (Discovery - optional auth for user-specific match/saved indicators)
  app.get("/", { preValidation: [optionalAuthenticate] }, JobsController.getJobs);
  
  // Single job - MUST be after all specific routes
  // @ts-ignore
  app.get("/:id", { preValidation: [optionalAuthenticate] }, JobsController.getJob);
  
  // @ts-ignore
  app.post("/:id/apply-click", { preValidation: [authenticate] }, JobsController.trackClick);
  // @ts-ignore
  app.post("/:id/click", { preValidation: [authenticate] }, JobsController.trackClick);
  
  // Day 5: Match details, trust, and explanations
  // @ts-ignore
  app.get("/:id/match", { preValidation: [authenticate] }, JobsController.getJobMatch);
  // @ts-ignore
  app.post("/:id/match/recalculate", { preValidation: [authenticate] }, JobsController.getJobMatch);
  // @ts-ignore
  app.get("/:id/trust", { preValidation: [authenticate] }, JobsController.getJob);
  // @ts-ignore
  app.get("/:id/explanation", { preValidation: [authenticate] }, JobsController.getJobExplanation);
  // @ts-ignore
  app.post("/:id/explanation", { preValidation: [authenticate] }, JobsController.getJobExplanation);
  
  // View tracking
  // @ts-ignore
  app.post("/:id/view", { preValidation: [authenticate] }, JobsController.trackView);

  // Idempotent Save/unsave
  // @ts-ignore
  app.post("/:id/save", { preValidation: [authenticate] }, JobsController.saveJob);
  // @ts-ignore
  app.delete("/:id/save", { preValidation: [authenticate] }, JobsController.unsaveJob);
  // @ts-ignore
  app.post("/:id/toggle-save", { preValidation: [authenticate] }, JobsController.toggleSavedJob);
}
