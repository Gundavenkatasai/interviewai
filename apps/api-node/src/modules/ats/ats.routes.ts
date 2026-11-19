import { FastifyInstance } from "fastify";
import { authenticate } from "../../middleware/auth";
import { AtsController } from "./ats.controller";

export async function atsRoutes(app: FastifyInstance) {
  // 1. Resume Document Upload & Text Extraction (PDF / DOCX)
  app.post("/upload", { preValidation: [authenticate] }, AtsController.upload);

  // 2. Full Deterministic ATS Analysis + AI Semantic Check
  app.post("/analyze", { preValidation: [authenticate] }, AtsController.analyze);

  // 3. User ATS Historical Scans
  app.get("/history", { preValidation: [authenticate] }, AtsController.getHistory);

  // 4. Retrieve Specific Analysis by ID
  app.get("/analysis/:id", { preValidation: [authenticate] }, AtsController.getAnalysis);

  // 5. Formatted Report Object
  app.get("/analysis/:id/report", { preValidation: [authenticate] }, AtsController.getReport);

  // 6. Download Formatted Text / Certificate Report
  app.get("/analysis/:id/download", { preValidation: [authenticate] }, AtsController.downloadReport);

  // 7. Proposed Improvements Side-by-Side
  app.post("/analysis/:id/improve", { preValidation: [authenticate] }, AtsController.improve);

  // 8. Improve Specific Section or Bullet
  app.post("/analysis/:id/improve-section", { preValidation: [authenticate] }, AtsController.improveSection);
}
