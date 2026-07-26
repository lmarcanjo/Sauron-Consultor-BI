/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Production Code Sanity Test - Anti-Mock Contamination", () => {
  it("should fail if production files import or use forbidden mock data terms", () => {
    const srcDir = path.resolve(__dirname, "../../"); // points to src/
    
    // Recursive file walker
    const walk = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          if (!file.includes("node_modules") && !file.includes("dist")) {
            results = results.concat(walk(fullPath));
          }
        } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
          const isTestFile = file.endsWith(".test.ts") || file.endsWith(".test.tsx") || file.endsWith(".spec.ts") || file.endsWith(".spec.tsx");
          const isInternalDemoOrAllowed = 
            fullPath.includes("demoData.ts") || 
            fullPath.includes("calculations.ts") || 
            fullPath.includes("calculations.test.ts") ||
            fullPath.includes("SearchEngine.ts") || 
            fullPath.includes("componentsCleanup.test.ts") ||
            fullPath.includes("App.tsx") || 
            fullPath.includes("CentralDadosTab.tsx") || 
            fullPath.includes("DigitalTwinEngine.ts") ||
            fullPath.includes("OrganizationManager.ts") ||
            fullPath.includes("UserManager.ts") ||
            fullPath.includes("PeopleManager.ts") ||
            fullPath.includes("ProductQAConsole.tsx") ||
            fullPath.includes("DatabaseConnectionManager.ts");

          if (!isTestFile && !isInternalDemoOrAllowed) {
            results.push(fullPath);
          }
        }
      });
      return results;
    };

    const productionFiles = walk(srcDir);
    const forbiddenTerms = [
      "demoData",
      "generateDemo",
      "mockRows",
      "Grupo Alpha",
      "Topázio Demo",
      "dados simulados"
    ];

    const violations: string[] = [];

    productionFiles.forEach((file) => {
      const content = fs.readFileSync(file, "utf-8");
      
      forbiddenTerms.forEach((term) => {
        if (content.includes(term)) {
          const lines = content.split("\n");
          lines.forEach((line, idx) => {
            if (line.includes(term) && !line.trim().startsWith("//") && !line.trim().startsWith("/*") && !line.trim().startsWith("*")) {
              violations.push(`${path.relative(srcDir, file)}:${idx + 1} - Found forbidden term: "${term}" in line: "${line.trim()}"`);
            }
          });
        }
      });

      // Check for imports from forbidden directories (fixtures, seeds, generators, demo)
      const importRegex = /import\s+.*\s+from\s+['"](.*)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (
          importPath.includes("/fixtures/") || 
          importPath.includes("/seeds/") || 
          importPath.includes("/generators/") || 
          importPath.includes("/demo/") ||
          importPath.endsWith("/fixtures") || 
          importPath.endsWith("/seeds") || 
          importPath.endsWith("/generators") || 
          importPath.endsWith("/demo")
        ) {
          violations.push(`${path.relative(srcDir, file)} - Found forbidden import path: "${importPath}"`);
        }
      }
    });

    if (violations.length > 0) {
      console.error("FAIL: Production files must not import or use hardcoded mock data terms:\n" + violations.join("\n"));
    }
    expect(violations.length).toBe(0);
  });
});
