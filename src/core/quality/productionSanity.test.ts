import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const productionRoot = path.resolve(process.cwd(), "src");
const allowedDomainRoot = `${path.sep}core${path.sep}business-domains${path.sep}`;
const forbiddenProductionTokens = [
  "DEMO_DATA",
  "demoData",
  "generateDemo",
  "mockRows",
  "Grupo Alpha",
  "Topázio",
  "MOCK DATA",
];

function productionFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return productionFiles(fullPath);
    if (!/\.(ts|tsx)$/.test(entry.name) || /\.test\.(ts|tsx)$/.test(entry.name)) return [];
    if (fullPath.includes(`${path.sep}tests${path.sep}`) || fullPath.includes(allowedDomainRoot)) return [];
    return [fullPath];
  });
}

describe("production sanity", () => {
  it("does not reintroduce demo/mock identifiers into production modules", () => {
    const violations: string[] = [];
    for (const file of productionFiles(productionRoot)) {
      const source = fs.readFileSync(file, "utf8");
      for (const token of forbiddenProductionTokens) {
        if (source.includes(token)) violations.push(`${path.relative(process.cwd(), file)} -> ${token}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not create or consume temporary up_file identifiers in production flow", () => {
    const compatibilityFiles = new Set([
      path.resolve(productionRoot, "core/data/sourceIdentity.ts"),
      path.resolve(productionRoot, "core/migrations/LegacyCompatibilityMigration.ts"),
      path.resolve(productionRoot, "core/migrations/LegacyLocalStateRepairService.ts"),
    ]);
    const violations = productionFiles(productionRoot)
      .filter(file => !compatibilityFiles.has(file))
      .filter(file => fs.readFileSync(file, "utf8").includes("up_file_"))
      .map(file => path.relative(process.cwd(), file));

    expect(violations).toEqual([]);
  });
});
