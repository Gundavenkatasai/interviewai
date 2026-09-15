import { FastifyRequest, FastifyReply } from "fastify";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { randomUUID } from "crypto";

import {
  ImportedDocxWorkspace,
  ImportedDocxSection,
  ImportedDocxField,
  ImportedDocxChange,
  ImportedDocxVersion,
  IImportedDocxField,
  SectionType,
  FieldType
} from "./imported-docx.model";
import { ResumeDocument } from "../resume.model";
import { DocxInspector } from "./docx-inspector";
import { DocxStructureExtractor, DocxNodeTree, DocxParagraph, DocxTable } from "./docx-structure-extractor";
import { DocxSectionDetector, DetectedSection } from "./docx-section-detector";
import { DocxCoverageReporter } from "./docx-coverage-reporter";
import { DocxMutationEngine } from "./docx-mutation-engine";
import { DocxOutputValidator } from "./docx-output-validator";

const UPLOADS_BASE = path.join(__dirname, "../../../uploads");
const ARTIFACTS_BASE = path.join(__dirname, "../../../artifacts/imported-docx");

export class ImportedDocxController {

  // ============================================================
  // POST /api/resume/imported-docx/import
  // ============================================================
  static async importDocx(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    if (!userId) return reply.status(401).send({ success: false, message: "Unauthorized" });

    const file = await request.file();
    if (!file) return reply.status(400).send({ success: false, message: "No file provided." });

    const filename = file.filename || "resume.docx";
    const buffer = await file.toBuffer();

    // 1. Validate MIME + magic bytes
    const mime = file.mimetype || "";
    const isDocxMime = mime.includes("wordprocessingml") || mime.includes("msword") || mime === "application/zip";
    if (!isDocxMime && !filename.toLowerCase().endsWith(".docx")) {
      return reply.status(400).send({ success: false, message: "Only .docx files are supported." });
    }

    // 2. Inspect (validate + unpack)
    const inspection = await DocxInspector.inspect(buffer, filename);
    if (!inspection.valid) {
      return reply.status(400).send({ success: false, message: inspection.errors.join(" ") });
    }
    const pkg = inspection.package!;

    // 3. Hash for duplicate detection
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");

    // 4. Check for existing workspace with same hash for this user
    const existing = await ImportedDocxWorkspace.findOne({ userId, originalHash: hash });
    if (existing) {
      return reply.status(200).send({
        success: true,
        duplicate: true,
        workspaceId: existing._id,
        name: existing.name || filename,
        coverage: existing.extractionCoverage,
        warnings: existing.warnings || [],
        totalSections: existing.totalSections,
        totalFields: existing.totalEditableFields,
        message: "You have already imported this file. Opening existing workspace."
      });
    }

    // 5. Store immutable original
    const userUploadDir = path.join(UPLOADS_BASE, userId);
    fs.mkdirSync(userUploadDir, { recursive: true });
    const storagePath = path.join(userUploadDir, `${hash}_${filename}`);
    await fs.promises.writeFile(storagePath, buffer);

    // Check if ResumeDocument already exists for this hash/user
    let resumeDoc = await ResumeDocument.findOne({ userId, hash });
    if (!resumeDoc) {
      resumeDoc = await ResumeDocument.create({
        userId,
        filename,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        hash,
        storagePath,
        parserVersion: "1.0",
        schemaVersion: "1.0"
      });
    }

    // 6. Create workspace record (status = processing)
    const workspace = await ImportedDocxWorkspace.create({
      userId,
      originalDocumentId: resumeDoc._id,
      originalHash: hash,
      originalFilename: filename,
      status: "processing",
      name: filename.replace(/\.docx$/i, "").replace(/_/g, " ") || "Imported Resume"
    });

    try {
      // 7. Extract structure from main document
      const mainTree = DocxStructureExtractor.extract(pkg.documentXml, "word/document.xml", pkg);

      // Extract header/footer trees
      const headerTrees: DocxNodeTree[] = [];
      const footerTrees: DocxNodeTree[] = [];
      for (const [partName, xml] of Object.entries(pkg.headers)) {
        headerTrees.push(DocxStructureExtractor.extract(xml, partName, pkg));
      }
      for (const [partName, xml] of Object.entries(pkg.footers)) {
        footerTrees.push(DocxStructureExtractor.extract(xml, partName, pkg));
      }

      // 8. Detect sections
      const detectedSections = DocxSectionDetector.detectSections(mainTree);

      // Also detect header/footer sections
      const allTrees = [
        ...headerTrees.map(t => ({ tree: t, isHeader: true, isFooter: false })),
        ...footerTrees.map(t => ({ tree: t, isHeader: false, isFooter: true }))
      ];

      // 9. Build coverage report
      const coverage = DocxCoverageReporter.buildCoverage(mainTree, headerTrees, footerTrees);

      // 10. Persist sections and fields
      let totalFields = 0;
      const sectionDocs = [];

      for (const detected of detectedSections) {
        const sectionDoc = await ImportedDocxSection.create({
          workspaceId: workspace._id,
          userId,
          sectionType: detected.sectionType,
          sectionTitle: detected.sectionTitle,
          detectionConfidence: detected.detectionConfidence,
          order: detected.order,
          documentPart: detected.documentPart,
          fieldCount: 0
        });

        const fields = await ImportedDocxController.buildFieldsForSection(
          detected, mainTree, workspace._id, sectionDoc._id, userId
        );

        if (fields.length > 0) {
          await ImportedDocxField.insertMany(fields);
          await ImportedDocxSection.updateOne({ _id: sectionDoc._id }, { fieldCount: fields.length });
          totalFields += fields.length;
        }
        sectionDocs.push(sectionDoc);
      }

      // 11. Create header/footer sections
      for (const { tree, isHeader, isFooter } of allTrees) {
        const sType: SectionType = isHeader ? "HEADER_REGION" : "FOOTER_REGION";
        const sTitle = isHeader ? `Header (${tree.documentPart})` : `Footer (${tree.documentPart})`;
        const sectionDoc = await ImportedDocxSection.create({
          workspaceId: workspace._id,
          userId,
          sectionType: sType,
          sectionTitle: sTitle,
          detectionConfidence: "HIGH",
          order: detectedSections.length + (isHeader ? 0 : headerTrees.length),
          documentPart: tree.documentPart,
          fieldCount: 0
        });

        const hfDetected: DetectedSection = {
          sectionType: sType,
          sectionTitle: sTitle,
          detectionConfidence: "HIGH",
          order: sectionDoc.order,
          documentPart: tree.documentPart,
          nodeIndices: tree.nodes.map((_, i) => i)
        };
        const fields = await ImportedDocxController.buildFieldsForSection(
          hfDetected, tree, workspace._id, sectionDoc._id, userId
        );
        if (fields.length > 0) {
          await ImportedDocxField.insertMany(fields);
          await ImportedDocxSection.updateOne({ _id: sectionDoc._id }, { fieldCount: fields.length });
          totalFields += fields.length;
        }
      }

      // 12. Update workspace to ready
      await ImportedDocxWorkspace.updateOne({ _id: workspace._id }, {
        status: "ready",
        extractionCoverage: coverage,
        warnings: [...inspection.warnings, ...coverage.warnings],
        hasHeaders: headerTrees.length > 0,
        hasFooters: footerTrees.length > 0,
        hasImages: coverage.imagesDetected > 0,
        hasTables: coverage.tablesDetected > 0,
        hasHyperlinks: coverage.hyperlinksDetected > 0,
        hasTextBoxes: coverage.textBoxesDetected > 0,
        totalEditableFields: totalFields,
        totalSections: detectedSections.length + allTrees.length
      });

      console.log(`[ImportedDocx] resume_import_completed userId=${userId} workspaceId=${workspace._id} fields=${totalFields} coverage=${DocxCoverageReporter.summarize(coverage)}`);

      return reply.status(201).send({
        success: true,
        workspaceId: workspace._id,
        name: workspace.name,
        totalSections: detectedSections.length,
        totalFields,
        coverage,
        warnings: [...inspection.warnings, ...coverage.warnings]
      });

    } catch (err: any) {
      console.error(`[ImportedDocx] resume_import_failed userId=${userId} err=${err.message}`);
      await ImportedDocxWorkspace.updateOne({ _id: workspace._id }, { status: "error" });
      return reply.status(500).send({
        success: false,
        message: "We couldn't read this DOCX. The file appears corrupted or uses an unsupported structure."
      });
    }
  }

  // ============================================================
  // GET /api/resume/imported-docx
  // List all workspaces for user
  // ============================================================
  static async listWorkspaces(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    if (!userId) return reply.status(401).send({ success: false, message: "Unauthorized" });

    const workspaces = await ImportedDocxWorkspace.find({ userId }).sort({ createdAt: -1 });
    return { success: true, workspaces };
  }

  // ============================================================
  // GET /api/resume/imported-docx/:id
  // Get workspace with sections and fields
  // ============================================================
  static async getWorkspace(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    const { id } = request.params;

    const workspace = await ImportedDocxWorkspace.findOne({ _id: id, userId });
    if (!workspace) return reply.status(404).send({ success: false, message: "Workspace not found." });

    const sections = await ImportedDocxSection.find({ workspaceId: id }).sort({ order: 1 });
    const fields = await ImportedDocxField.find({ workspaceId: id }).sort({ order: 1 });

    // Group fields by section
    const fieldsBySection: Record<string, IImportedDocxField[]> = {};
    for (const f of fields) {
      if (!fieldsBySection[f.sectionId]) fieldsBySection[f.sectionId] = [];
      fieldsBySection[f.sectionId].push(f as any);
    }

    return {
      success: true,
      workspace,
      sections: sections.map(s => ({
        ...s.toObject(),
        fields: fieldsBySection[s._id] || []
      }))
    };
  }

  // ============================================================
  // POST /api/resume/imported-docx/:id/changes
  // Save a field change
  // ============================================================
  static async saveChange(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    const { id } = request.params;
    const body = (request.body as any) || {};

    // IDOR check
    const workspace = await ImportedDocxWorkspace.findOne({ _id: id, userId });
    if (!workspace) return reply.status(404).send({ success: false, message: "Workspace not found." });

    const { fieldId, proposedValue, operation } = body;
    if (!fieldId || proposedValue === undefined) {
      return reply.status(400).send({ success: false, message: "fieldId and proposedValue are required." });
    }

    // Verify field belongs to this workspace
    const field = await ImportedDocxField.findOne({ _id: fieldId, workspaceId: id, userId });
    if (!field) return reply.status(404).send({ success: false, message: "Field not found." });

    if (!field.isEditable) {
      return reply.status(400).send({ success: false, message: field.editWarning || "This field is not editable." });
    }

    // Cancel any existing pending change for this field
    await ImportedDocxChange.updateMany(
      { fieldId, workspaceId: id, status: "pending" },
      { status: "rejected" }
    );

    // Create new change
    const change = await ImportedDocxChange.create({
      workspaceId: id,
      fieldId,
      userId,
      operation: operation || "REPLACE_TEXT",
      originalValue: field.originalValue,
      proposedValue: String(proposedValue),
      status: "pending",
      sourceMapping: field.sourceMapping
    });

    // Update field currentValue
    await ImportedDocxField.updateOne({ _id: fieldId }, { currentValue: String(proposedValue) });

    return { success: true, change };
  }

  // ============================================================
  // GET /api/resume/imported-docx/:id/changes
  // ============================================================
  static async getChanges(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    const { id } = request.params;

    const workspace = await ImportedDocxWorkspace.findOne({ _id: id, userId });
    if (!workspace) return reply.status(404).send({ success: false, message: "Workspace not found." });

    const changes = await ImportedDocxChange.find({ workspaceId: id, status: "pending" }).sort({ createdAt: 1 });
    return { success: true, changes };
  }

  // ============================================================
  // POST /api/resume/imported-docx/:id/render
  // Apply changes + generate output DOCX
  // ============================================================
  static async renderDocx(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    const { id } = request.params;
    const body = (request.body as any) || {};

    const workspace = await ImportedDocxWorkspace.findOne({ _id: id, userId });
    if (!workspace) return reply.status(404).send({ success: false, message: "Workspace not found." });

    // Load original immutable file
    const resumeDoc = await ResumeDocument.findOne({ _id: workspace.originalDocumentId, userId });
    if (!resumeDoc) return reply.status(404).send({ success: false, message: "Original document not found." });

    const originalBuffer = await fs.promises.readFile(resumeDoc.storagePath);

    // Verify hash integrity
    const currentHash = crypto.createHash("sha256").update(originalBuffer).digest("hex");
    if (currentHash !== workspace.originalHash) {
      return reply.status(500).send({
        success: false,
        message: "Original file integrity check failed. Cannot safely generate output."
      });
    }

    // Load pending changes
    const changes = await ImportedDocxChange.find({ workspaceId: id, status: "pending" });

    if (changes.length === 0) {
      // If a version already exists, return the latest version without failing
      const latestVersion = await ImportedDocxVersion.findOne({ workspaceId: id }).sort({ versionNumber: -1 });
      if (latestVersion) {
        return reply.send({
          success: true,
          versionId: latestVersion._id,
          versionNumber: latestVersion.versionNumber,
          applied: 0,
          skipped: 0,
          validation: latestVersion.validationResult || { valid: true, errors: [], warnings: [] },
          warnings: []
        });
      }

      // If no version exists yet, create version 1 directly from the immutable original buffer
      fs.mkdirSync(ARTIFACTS_BASE, { recursive: true });
      const versionNumber = 1;
      const artifactFilename = `${id}_v1.docx`;
      const artifactPath = path.join(ARTIFACTS_BASE, artifactFilename);
      await fs.promises.writeFile(artifactPath, originalBuffer);

      const version = await ImportedDocxVersion.create({
        workspaceId: id,
        userId,
        versionNumber,
        artifactStoragePath: artifactPath,
        artifactHash: currentHash,
        appliedChangeIds: [],
        validationResult: { valid: true, errors: [], warnings: [] },
        changeSummary: "Initial version (unmodified original)"
      });

      return reply.send({
        success: true,
        versionId: version._id,
        versionNumber: 1,
        applied: 0,
        skipped: 0,
        validation: { valid: true, errors: [], warnings: [] },
        warnings: []
      });
    }

    console.log(`[ImportedDocx] docx_generation_started userId=${userId} workspaceId=${id} changes=${changes.length}`);

    // Apply mutations
    let mutationResult;
    try {
      mutationResult = await DocxMutationEngine.applyChanges(originalBuffer, changes as any);
    } catch (err: any) {
      console.error(`[ImportedDocx] docx_generation_failed userId=${userId} err=${err.message}`);
      return reply.status(500).send({
        success: false,
        message: "We couldn't safely generate the edited DOCX. Your original resume is unchanged."
      });
    }

    // Validate
    const validation = DocxOutputValidator.validate(mutationResult);

    if (!validation.valid) {
      console.warn(`[ImportedDocx] docx_validation_failed userId=${userId} errors=${validation.errors.join("; ")}`);
      return reply.status(422).send({
        success: false,
        message: "Document validation failed: " + validation.errors.join(" "),
        validation
      });
    }

    // Save artifact
    fs.mkdirSync(ARTIFACTS_BASE, { recursive: true });
    const versionNumber = (await ImportedDocxVersion.countDocuments({ workspaceId: id })) + 1;
    const artifactFilename = `${id}_v${versionNumber}.docx`;
    const artifactPath = path.join(ARTIFACTS_BASE, artifactFilename);
    await fs.promises.writeFile(artifactPath, mutationResult.buffer);

    const artifactHash = crypto.createHash("sha256").update(mutationResult.buffer).digest("hex");

    // Mark changes as applied
    const appliedIds = mutationResult.applied;
    await ImportedDocxChange.updateMany(
      { _id: { $in: appliedIds } },
      { status: "applied" }
    );

    // Create version record
    const version = await ImportedDocxVersion.create({
      workspaceId: id,
      userId,
      versionNumber,
      artifactStoragePath: artifactPath,
      artifactHash,
      appliedChangeIds: appliedIds,
      validationResult: validation,
      changeSummary: `Version ${versionNumber}: ${appliedIds.length} change(s) applied`
    });

    console.log(`[ImportedDocx] docx_generation_completed userId=${userId} workspaceId=${id} version=${versionNumber} hash=${artifactHash}`);

    return {
      success: true,
      versionId: version._id,
      versionNumber,
      applied: appliedIds.length,
      skipped: mutationResult.skipped.length,
      validation,
      warnings: validation.warnings
    };
  }

  // ============================================================
  // GET /api/resume/imported-docx/:id/download/:versionId
  // ============================================================
  static async downloadVersion(
    request: FastifyRequest<{ Params: { id: string; versionId: string } }>,
    reply: FastifyReply
  ) {
    const userId = (request as any).user?.sub;
    const { id, versionId } = request.params;

    const workspace = await ImportedDocxWorkspace.findOne({ _id: id, userId });
    if (!workspace) return reply.status(404).send({ success: false, message: "Workspace not found." });

    const version = await ImportedDocxVersion.findOne({ _id: versionId, workspaceId: id, userId });
    if (!version) return reply.status(404).send({ success: false, message: "Version not found." });

    if (!fs.existsSync(version.artifactStoragePath)) {
      return reply.status(404).send({ success: false, message: "Artifact file not found." });
    }

    const buffer = await fs.promises.readFile(version.artifactStoragePath);
    const downloadName = workspace.originalFilename.replace(/\.docx$/i, "_edited.docx");

    reply.header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    reply.header("Content-Disposition", `attachment; filename="${downloadName}"`);
    reply.header("Content-Length", buffer.length);
    return reply.send(buffer);
  }

  // ============================================================
  // GET /api/resume/imported-docx/:id/download/original
  // Download the original immutable file
  // ============================================================
  static async downloadOriginal(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    const { id } = request.params;

    const workspace = await ImportedDocxWorkspace.findOne({ _id: id, userId });
    if (!workspace) return reply.status(404).send({ success: false, message: "Workspace not found." });

    const resumeDoc = await ResumeDocument.findOne({ _id: workspace.originalDocumentId, userId });
    if (!resumeDoc || !fs.existsSync(resumeDoc.storagePath)) {
      return reply.status(404).send({ success: false, message: "Original file not found." });
    }

    const buffer = await fs.promises.readFile(resumeDoc.storagePath);
    reply.header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    reply.header("Content-Disposition", `attachment; filename="${workspace.originalFilename}"`);
    reply.header("Content-Length", buffer.length);
    return reply.send(buffer);
  }

  // ============================================================
  // GET /api/resume/imported-docx/:id/versions
  // ============================================================
  static async getVersions(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    const { id } = request.params;

    const workspace = await ImportedDocxWorkspace.findOne({ _id: id, userId });
    if (!workspace) return reply.status(404).send({ success: false, message: "Workspace not found." });

    const versions = await ImportedDocxVersion.find({ workspaceId: id }).sort({ versionNumber: -1 });
    return { success: true, versions };
  }

  // ============================================================
  // GET /api/resume/imported-docx/:id/preview
  // Returns the raw DOCX as base64 for client-side mammoth preview
  // ============================================================
  static async getPreview(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    const { id } = request.params;
    const qs = (request.query as any) || {};
    const versionId = qs.versionId;

    const workspace = await ImportedDocxWorkspace.findOne({ _id: id, userId });
    if (!workspace) return reply.status(404).send({ success: false, message: "Workspace not found." });

    let buffer: Buffer;

    if (versionId) {
      const version = await ImportedDocxVersion.findOne({ _id: versionId, workspaceId: id, userId });
      if (!version || !fs.existsSync(version.artifactStoragePath)) {
        return reply.status(404).send({ success: false, message: "Version not found." });
      }
      buffer = await fs.promises.readFile(version.artifactStoragePath);
    } else {
      // Return original
      const resumeDoc = await ResumeDocument.findOne({ _id: workspace.originalDocumentId, userId });
      if (!resumeDoc || !fs.existsSync(resumeDoc.storagePath)) {
        return reply.status(404).send({ success: false, message: "Original file not found." });
      }
      buffer = await fs.promises.readFile(resumeDoc.storagePath);
    }

    return {
      success: true,
      docxBase64: buffer.toString("base64"),
      filename: workspace.originalFilename
    };
  }

  // ============================================================
  // DELETE /api/resume/imported-docx/:id
  // ============================================================
  static async deleteWorkspace(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user?.sub;
    const { id } = request.params;

    const workspace = await ImportedDocxWorkspace.findOne({ _id: id, userId });
    if (!workspace) return reply.status(404).send({ success: false, message: "Workspace not found." });

    // Delete all related data
    await ImportedDocxField.deleteMany({ workspaceId: id });
    await ImportedDocxSection.deleteMany({ workspaceId: id });
    await ImportedDocxChange.deleteMany({ workspaceId: id });

    // Delete artifact files
    const versions = await ImportedDocxVersion.find({ workspaceId: id });
    for (const v of versions) {
      if (fs.existsSync(v.artifactStoragePath)) {
        fs.unlinkSync(v.artifactStoragePath);
      }
    }
    await ImportedDocxVersion.deleteMany({ workspaceId: id });
    await ImportedDocxWorkspace.deleteOne({ _id: id });

    return { success: true, message: "Workspace deleted." };
  }

  // ============================================================
  // Private: build editable fields for a detected section
  // ============================================================
  private static async buildFieldsForSection(
    section: DetectedSection,
    tree: DocxNodeTree,
    workspaceId: string,
    sectionId: string,
    userId: string
  ): Promise<Partial<IImportedDocxField>[]> {
    const fields: Partial<IImportedDocxField>[] = [];
    let order = 0;

    const sectionNodes = section.nodeIndices.map(i => tree.nodes[i]).filter(Boolean);

    // Skip the heading node itself (nodeIndices[0] if it's a heading)
    const startOffset = (sectionNodes[0]?.paragraph?.isHeading && section.sectionType !== "PERSONAL_INFO") ? 1 : 0;

    for (let ni = startOffset; ni < sectionNodes.length; ni++) {
      const node = sectionNodes[ni];

      if (node.nodeType === "paragraph" && node.paragraph) {
        const para = node.paragraph;
        if (!para.plainText.trim()) continue; // Skip empty paragraphs

        const fieldType: FieldType = para.isBullet ? "bullet" : para.isHeading ? "heading" : "text";
        const label = this.inferFieldLabel(para, section.sectionType, order);
        const fingerprint = DocxStructureExtractor.buildFormattingFingerprint(para.runs);
        const sourceMapping = DocxStructureExtractor.buildParagraphSourceMapping(para);

        fields.push({
          workspaceId,
          sectionId,
          userId,
          fieldKey: `${fieldType}_${order}`,
          fieldType,
          label,
          currentValue: para.plainText,
          originalValue: para.plainText,
          sourceMapping,
          formattingFingerprint: fingerprint,
          isEditable: true,
          order
        });
        order++;

        // Add hyperlink URL fields
        for (const hl of para.hyperlinks) {
          if (hl.url) {
            fields.push({
              workspaceId,
              sectionId,
              userId,
              fieldKey: `hyperlink_url_${order}`,
              fieldType: "hyperlink_url",
              label: `URL (${hl.displayText.substring(0, 30)})`,
              currentValue: hl.url,
              originalValue: hl.url,
              sourceMapping: {
                ...sourceMapping,
                hyperlinkRelId: hl.relId
              },
              formattingFingerprint: "",
              isEditable: true,
              order
            });
            order++;
          }
        }

      } else if (node.nodeType === "table" && node.table) {
        // Build cell-level fields
        for (const row of node.table.rows) {
          for (const cell of row.cells) {
            for (let pi = 0; pi < cell.paragraphs.length; pi++) {
              const para = cell.paragraphs[pi];
              if (!para.plainText.trim()) continue;

              const fingerprint = DocxStructureExtractor.buildFormattingFingerprint(para.runs);
              const sourceMapping = DocxStructureExtractor.buildParagraphSourceMapping(
                para,
                node.table.tableIndex,
                row.rowIndex,
                cell.cellIndex,
                pi
              );

              fields.push({
                workspaceId,
                sectionId,
                userId,
                fieldKey: `cell_r${row.rowIndex}c${cell.cellIndex}_p${pi}`,
                fieldType: "table_cell",
                label: `Table row ${row.rowIndex + 1}, col ${cell.cellIndex + 1}`,
                currentValue: para.plainText,
                originalValue: para.plainText,
                sourceMapping,
                formattingFingerprint: fingerprint,
                isEditable: true,
                order
              });
              order++;
            }
          }
        }

      } else if (node.nodeType === "textbox") {
        fields.push({
          workspaceId,
          sectionId,
          userId,
          fieldKey: `textbox_${order}`,
          fieldType: "text",
          label: "Text Box (read-only)",
          currentValue: "[Text box — preserved but not editable]",
          originalValue: "[Text box]",
          sourceMapping: {
            documentPart: section.documentPart,
            paragraphIndex: -1,
            runIndices: []
          },
          formattingFingerprint: "",
          isEditable: false,
          editWarning: "Text box content is preserved but cannot be edited in this version.",
          order
        });
        order++;
      }
    }

    return fields;
  }

  private static inferFieldLabel(para: DocxParagraph, sectionType: SectionType, order: number): string {
    const text = para.plainText.trim();

    if (sectionType === "PERSONAL_INFO") {
      if (order === 0) return "Name";
      if (/[@]/.test(text)) return "Email";
      if (/\+?\d[\d\s\-().]{7,}/.test(text)) return "Phone";
      if (/linkedin/i.test(text)) return "LinkedIn";
      if (/github/i.test(text)) return "GitHub";
      if (/^https?:\/\//i.test(text)) return "Website";
      return `Contact ${order}`;
    }

    if (para.isBullet) return `Bullet ${order + 1}`;
    if (para.isHeading) return "Section Heading";

    // Try to classify by content
    if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(text)) return `Date / Role ${order + 1}`;
    return `Line ${order + 1}`;
  }
}
