import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { LEGACY_COMPATIBILITY_BOUNDARIES } from "./CompatibilityPolicy";

const root = path.resolve(process.cwd());

describe("legacy adapter boundary", () => {
  it("keeps every compatibility boundary explicitly deprecated or documented", () => {
    LEGACY_COMPATIBILITY_BOUNDARIES.forEach(boundary => {
      const source = fs.readFileSync(path.resolve(root, boundary.module), "utf8");
      expect(source.includes("@deprecated") || boundary.disposition === "KEEP_TEMPORARILY").toBe(true);
    });
  });

  it("does not leave removed legacy engines in production code", () => {
    const sourceRoot = path.resolve(root, "src");
    const files: string[] = [];
    const visit = (directory: string) => {
      fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
        const filePath = path.join(directory, entry.name);
        if (entry.isDirectory()) return visit(filePath);
        if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) files.push(filePath);
      });
    };
    visit(sourceRoot);

    const consumers = files
      .filter(filePath => !filePath.includes(`${path.sep}compatibility${path.sep}`))
      .filter(filePath => !filePath.includes(`${path.sep}quality${path.sep}`))
      .filter(filePath => /WorkspaceDNAEngine|CompensationEngine|SpreadsheetWorkspaceManager/.test(fs.readFileSync(filePath, "utf8")));

    expect(consumers).toEqual([]);
  });
});
