import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../../..");
const FORBIDDEN_IMPORTS = ["DEMO_DATA", "demoData", "generateDemo", "mockRows"];

function walkProductionFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", "coverage"].includes(entry.name)) return [];
      return walkProductionFiles(fullPath);
    }

    if (!/\.(ts|tsx)$/.test(entry.name)) return [];
    if (/\.(test|spec)\.(ts|tsx)$/.test(entry.name)) return [];
    return [fullPath];
  });
}

describe("real data production sanity", () => {
  it("does not import demo or mock row generators in production files", () => {
    const violations = walkProductionFiles(path.join(ROOT, "src")).flatMap(filePath => {
      const source = fs.readFileSync(filePath, "utf8");
      return source
        .split("\n")
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => /^\s*import\s/.test(line) || /\brequire\s*\(/.test(line))
        .filter(({ line }) => FORBIDDEN_IMPORTS.some(term => line.includes(term)))
        .map(({ line, index }) => `${path.relative(ROOT, filePath)}:${index + 1}: ${line.trim()}`);
    });

    expect(violations).toEqual([]);
  });
});
