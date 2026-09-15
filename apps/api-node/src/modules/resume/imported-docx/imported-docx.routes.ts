import { FastifyInstance } from "fastify";
import { ImportedDocxController } from "./imported-docx.controller";
import { authenticate } from "../../../middleware/auth";

export async function importedDocxRoutes(app: FastifyInstance) {
  // Import a new DOCX file
  // @ts-ignore
  app.post("/import", { preValidation: [authenticate] }, ImportedDocxController.importDocx);

  // List all workspaces for user
  // @ts-ignore
  app.get("/", { preValidation: [authenticate] }, ImportedDocxController.listWorkspaces);

  // Get workspace with sections + fields
  // @ts-ignore
  app.get("/:id", { preValidation: [authenticate] }, ImportedDocxController.getWorkspace);

  // Save a field change
  // @ts-ignore
  app.post("/:id/changes", { preValidation: [authenticate] }, ImportedDocxController.saveChange);

  // Get all pending changes
  // @ts-ignore
  app.get("/:id/changes", { preValidation: [authenticate] }, ImportedDocxController.getChanges);

  // Apply changes + generate output DOCX
  // @ts-ignore
  app.post("/:id/render", { preValidation: [authenticate] }, ImportedDocxController.renderDocx);

  // Download a specific version
  // @ts-ignore
  app.get("/:id/download/:versionId", { preValidation: [authenticate] }, ImportedDocxController.downloadVersion);

  // Download original immutable file
  // @ts-ignore
  app.get("/:id/download/original", { preValidation: [authenticate] }, ImportedDocxController.downloadOriginal);

  // Get version history
  // @ts-ignore
  app.get("/:id/versions", { preValidation: [authenticate] }, ImportedDocxController.getVersions);

  // Get preview (base64 DOCX for mammoth.js rendering)
  // @ts-ignore
  app.get("/:id/preview", { preValidation: [authenticate] }, ImportedDocxController.getPreview);

  // Delete workspace
  // @ts-ignore
  app.delete("/:id", { preValidation: [authenticate] }, ImportedDocxController.deleteWorkspace);
}
