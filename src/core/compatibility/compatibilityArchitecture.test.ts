import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { LEGACY_IMPORT_ALLOWLIST, LEGACY_MODULE_PATTERNS } from "./legacyImportAllowlist";

const sourceRoot = path.resolve(process.cwd(), "src");
const ignoredSuffixes = [".test.ts", ".test.tsx"];

function listSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(filePath);
    if (!/\.(ts|tsx)$/.test(entry.name) || ignoredSuffixes.some(suffix => entry.name.endsWith(suffix))) return [];
    return [filePath];
  });
}

describe("legacy compatibility boundary", () => {
  it("does not allow a new production consumer without an explicit migration note", () => {
    const violations = listSourceFiles(sourceRoot)
      .map(filePath => ({
        relative: path.relative(process.cwd(), filePath).replaceAll(path.sep, "/"),
        source: fs.readFileSync(filePath, "utf8"),
      }))
      .filter(({ relative, source }) => {
        if (relative.startsWith("src/core/compatibility/")) return false;
        if (relative.startsWith("src/core/quality/")) return false;
        return LEGACY_MODULE_PATTERNS.some(pattern => pattern.test(source)) && !LEGACY_IMPORT_ALLOWLIST[relative];
      })
      .map(({ relative }) => relative);

    expect(violations).toEqual([]);
  });

  it("keeps the removed compatibility family out of production", () => {
    expect(LEGACY_IMPORT_ALLOWLIST).toEqual({});
  });
});
