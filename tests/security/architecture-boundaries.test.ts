import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const rootDir = path.resolve(__dirname, "../../");
const webSrcDir = path.join(rootDir, "apps", "web", "src");
const packagesDir = path.join(rootDir, "packages");
const workerSrcDir = path.join(rootDir, "apps", "worker", "src");

function getAllTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === "node_modules" || file === "dist" || file === ".git") continue;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(getAllTsFiles(full));
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

describe("Architectural Boundary Rules (Phase 30)", () => {
  it("RULE 1: Frontend MUST NOT import backend or database models directly", () => {
    const webFiles = getAllTsFiles(webSrcDir);
    const violations: string[] = [];

    for (const file of webFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("from 'mongoose'") || content.includes('from "mongoose"')) {
        violations.push(`Mongoose imported in web: ${file}`);
      }
      if (content.includes("from 'fastify'") || content.includes('from "fastify"')) {
        violations.push(`Fastify imported in web: ${file}`);
      }
      if (content.includes("apps/api-node") || content.includes("apps/api/")) {
        violations.push(`Direct API backend import in web: ${file}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("RULE 2: Shared packages MUST NOT import application code", () => {
    const pkgFiles = getAllTsFiles(packagesDir);
    const violations: string[] = [];

    for (const file of pkgFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (
        content.includes("apps/web") ||
        content.includes("apps/api") ||
        content.includes("apps/worker")
      ) {
        violations.push(`Package imports app: ${file}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("RULE 3: Worker MUST NOT import frontend code", () => {
    const workerFiles = getAllTsFiles(workerSrcDir);
    const violations: string[] = [];

    for (const file of workerFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("apps/web") || content.includes("react")) {
        violations.push(`Worker imports frontend: ${file}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
