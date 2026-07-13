/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("F15.2 — Identity Production Code Sanity Scanner", () => {
  
  const bannedTerms = [
    "Topazio",
    "Topázio",
    "Grupo Alpha",
    "demoUser",
    "mockUser",
    "seededUser",
    "defaultCompany",
    "defaultOrganization",
    "ws_topazio",
    "@grupotopazio"
  ];

  const isProductionFile = (filePath: string): boolean => {
    const name = path.basename(filePath);
    // Ignore test files
    if (name.includes(".test.") || name.includes(".spec.")) return false;
    // Ignore directories or files with test fixtures
    if (filePath.includes("/__tests__/") || filePath.includes("/tests/") || filePath.includes("/fixtures/")) return false;
    // Ignore documentation files
    if (name.endsWith(".md") || name.endsWith(".txt")) return false;
    return true;
  };

  const getFilesRecursively = (dir: string): string[] => {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFilesRecursively(fullPath));
      } else {
        results.push(fullPath);
      }
    });
    return results;
  };

  it("ensures no banned mock terminology exists in production code files", () => {
    const srcDir = path.resolve(__dirname, "../../"); // Resolves to src/
    const allFiles = getFilesRecursively(srcDir);
    const prodFiles = allFiles.filter(isProductionFile);

    const violations: { file: string; term: string; line: number; content: string }[] = [];

    prodFiles.forEach(filePath => {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      
      lines.forEach((lineText, lineIdx) => {
        bannedTerms.forEach(term => {
          // Check for exact matching, case-insensitive
          if (lineText.toLowerCase().includes(term.toLowerCase())) {
            // Exclude comments that explicitly mention documentation or migration references
            const isHistoricalComment = lineText.includes("documentação histórica") || 
                                        lineText.includes("relatório de migração") ||
                                        lineText.includes("IdentityCleanupMigration");
            if (!isHistoricalComment) {
              violations.push({
                file: path.relative(srcDir, filePath),
                term,
                line: lineIdx + 1,
                content: lineText.trim()
              });
            }
          }
        });
      });
    });

    if (violations.length > 0) {
      console.error("[Sanity Failure] Found banned mock variables in production code:\n", violations);
    }

    expect(violations.length, `Violations found: ${violations.map(v => `${v.file}:${v.line} ('${v.term}')`).join(", ")}`).toBe(0);
  });
});
