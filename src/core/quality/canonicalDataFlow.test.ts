import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(process.cwd(), "src/components");
const canonicalBoundaryConsumers = new Set([
  "src/components/CentralDadosTab.tsx",
  "src/components/EnterpriseCenter.tsx",
  "src/components/EnterpriseDigitalTwinTab.tsx",
  "src/components/spreadsheet/SimpleSpreadsheetImporter.tsx",
]);
const forbiddenPatterns = [
  /IndexedSpreadsheetStorage(?:Adapter)?/,
  /SpreadsheetStoragePort/,
  /DataActivation/,
  /workbook-library["']/,
];

function listFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(filePath);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name) ? [filePath] : [];
  });
}

describe("canonical data flow boundary", () => {
  it("keeps physical storage and activation imports limited to explicit boundary screens", () => {
    const violations = listFiles(sourceRoot)
      .map(filePath => ({
        relative: path.relative(process.cwd(), filePath).replaceAll(path.sep, "/"),
        source: fs.readFileSync(filePath, "utf8"),
      }))
      .filter(({ relative, source }) => forbiddenPatterns.some(pattern => pattern.test(source)) && !canonicalBoundaryConsumers.has(relative))
      .map(({ relative }) => relative);

    expect(violations).toEqual([]);
  });
});
