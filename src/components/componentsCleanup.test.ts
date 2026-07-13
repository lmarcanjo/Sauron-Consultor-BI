/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

// Polyfill localStorage in test environment
beforeAll(() => {
  if (typeof globalThis.localStorage === "undefined") {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
      key: (index: number) => Array.from(store.keys())[index] || null,
      length: store.size,
    } as any;
  }
});

import { pluginEngine } from "../core/plugins/PluginEngine";
import { ClientFilterManager } from "../services/clientFilterManager";
import { dataSourceManager } from "../services/dataSourceManager";

// Register plugins
import "../core/plugins/automotive/AutomotivePlugin";
import "../core/plugins/agro/AgroPlugin";
import "../core/plugins/industry/IndustryPlugin";
import "../core/plugins/services/ServicesPlugin";

describe("Sauron React Components and Data Cleanup Unit Tests", () => {

  // Test 1: Scan for forbidden terms in src/components/
  it("verifies that no React component files contain forbidden terms (static analysis scan)", () => {
    const componentsDir = path.resolve(__dirname); // This is in src/components/
    const forbiddenTerms = ["Grupo Topázio", "Topázio", "Regiao", "Região", "Safra"];

    // Ensure we are reading files in components directory
    const files = fs.readdirSync(componentsDir);
    const tsxFiles = files.filter(f => f.endsWith(".tsx") && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"));

    tsxFiles.forEach(file => {
      const filePath = path.join(componentsDir, file);
      const content = fs.readFileSync(filePath, "utf-8");

      forbiddenTerms.forEach(term => {
        // We match with a clean approach to make sure the term is not hardcoded in the TSX body.
        // We allow terms if they are in comments, but for maximum safety we check the whole file content.
        const hasTerm = content.includes(term);
        if (hasTerm) {
          console.error(`Forbidden term "${term}" found in component file "${file}"`);
        }
        expect(hasTerm).toBe(false);
      });
    });
  });

  // Test 2: Core Segment Suggestions should come from PluginEngine
  it("verifies segment suggestions and mappings come directly from PluginEngine", () => {
    const agroPlugin = pluginEngine.getPlugin("agro");
    expect(agroPlugin).not.toBeNull();
    
    // Test that the suggested mappings are present and return correct values
    const agroMappings = agroPlugin?.getSuggestedMappings?.();
    expect(agroMappings).toBeDefined();
    expect(agroMappings?.Grupo).toBe("Fazenda");
    expect(agroMappings?.Razão).toBe("Safra");

    const autoPlugin = pluginEngine.getPlugin("automotivo");
    expect(autoPlugin).not.toBeNull();
    const autoMappings = autoPlugin?.getSuggestedMappings?.();
    expect(autoMappings?.Empresa).toBe("Loja");
  });

  // Test 3: Filters should not appear unless configured
  it("ensures default dashboard/sidebar filters are clean and do not create custom filters without consultant setup", () => {
    const activeFilters = ClientFilterManager.getActiveFilters();
    
    // Ensure all default active filters are core/standard keys only, no segment specific ones
    const activeColumns = activeFilters.map(f => f.column);
    const forbiddenColumns = ["Regiao", "Vendedor", "Safra", "Cidade", "Canal"];
    
    forbiddenColumns.forEach(col => {
      expect(activeColumns.includes(col)).toBe(false);
    });
  });

  // Test 4: Demo data must not appear in the production data flow
  it("guarantees demo/mock data does not appear in the production data flow", () => {
    // Save original state
    const originalSource = dataSourceManager.getActiveSource();
    
    try {
      // 1. When SPREADSHEET_DATA is active, demo data must be empty or filtered out
      dataSourceManager.setActiveSource("SPREADSHEET_DATA");
      const records = dataSourceManager.getActiveRecords();
      
      // Since workspace has no active files in the fresh test environment, SPREADSHEET_DATA should return empty list
      expect(records.length).toBe(0);

      // 2. DEMO_DATA is a legacy source type and must not surface records in the normal product flow
      dataSourceManager.setActiveSource("DEMO_DATA");
      const demoRecords = dataSourceManager.getActiveRecords();
      expect(demoRecords.length).toBe(0);
      
    } finally {
      // Restore state
      dataSourceManager.setActiveSource(originalSource);
    }
  });

  // Test 5: Verify dataGenerator.ts is fully clean and only does CSV exports
  it("verifies that src/utils/dataGenerator.ts is clean and contains no mock generation logic or forbidden terms", () => {
    const generatorPath = path.resolve(__dirname, "../utils/dataGenerator.ts");
    const content = fs.readFileSync(generatorPath, "utf-8");
    
    const forbiddenTerms = ["Grupo Topázio", "Topázio", "gerarDadosSimulados"];
    
    forbiddenTerms.forEach(term => {
      expect(content.includes(term)).toBe(false);
    });

    // It should have exportToCSV
    expect(content.includes("exportToCSV")).toBe(true);
  });

  // Test 6: Verify no React component in src/components/ imports demo or mock data directly
  it("verifies that no React component in src/components/ directly imports demoData, gerarDadosSimulados, generateDemoSpreadsheetRows, mockData, or sampleData", () => {
    const componentsDir = path.resolve(__dirname); // This is in src/components/
    const forbiddenImports = [
      "demoData",
      "gerarDadosSimulados",
      "generateDemoSpreadsheetRows",
      "mockData",
      "sampleData"
    ];

    const files = fs.readdirSync(componentsDir);
    const tsxFiles = files.filter(f => f.endsWith(".tsx") && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"));

    tsxFiles.forEach(file => {
      const filePath = path.join(componentsDir, file);
      const content = fs.readFileSync(filePath, "utf-8");

      // Check imports using regex or simple substring on lines starting with 'import'
      const lines = content.split("\n");
      lines.forEach(line => {
        if (line.trim().startsWith("import")) {
          forbiddenImports.forEach(term => {
            const hasForbiddenImport = line.includes(term);
            if (hasForbiddenImport) {
              console.error(`Direct mock/demo data import found in component file "${file}" on line: "${line.trim()}"`);
            }
            expect(hasForbiddenImport).toBe(false);
          });
        }
      });
    });
  });

  // Test 7: Architectural validation of CaseHub.tsx size limit
  it("enforces CaseHub.tsx does not exceed 350 lines", () => {
    const caseHubPath = path.resolve(__dirname, "./CaseHub.tsx");
    const content = fs.readFileSync(caseHubPath, "utf-8");
    const lines = content.split("\n");
    expect(lines.length).toBeLessThanOrEqual(350);
  });

  // Test 8: Architectural validation of MeetingModePage.tsx size limit
  it("enforces MeetingModePage.tsx does not exceed 450 lines", () => {
    const meetingModePath = path.resolve(__dirname, "./MeetingModePage.tsx");
    const content = fs.readFileSync(meetingModePath, "utf-8");
    const lines = content.split("\n");
    expect(lines.length).toBeLessThanOrEqual(450);
  });

  // Test 9: Prevention of non-deterministic math random functions outside of demoData.ts
  it("ensures Math.random() is never called outside of the official demo data layer (src/data/demoData.ts)", () => {
    const srcDir = path.resolve(__dirname, "../");
    const violations: string[] = [];

    const scanDirectory = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          // Skip node_modules and output dirs
          if (entry.name !== "node_modules" && entry.name !== "dist" && entry.name !== ".vite" && entry.name !== "build") {
            scanDirectory(fullPath);
          }
        } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
          // Skip the test files and the allowed demoData file
          if (
            entry.name.endsWith(".test.ts") ||
            entry.name.endsWith(".test.tsx") ||
            fullPath.endsWith("src/data/demoData.ts") ||
            entry.name === "componentsCleanup.test.ts"
          ) {
            continue;
          }

          const content = fs.readFileSync(fullPath, "utf-8");
          if (content.includes("Math.random()")) {
            violations.push(path.relative(srcDir, fullPath));
          }
        }
      }
    };

    scanDirectory(srcDir);
    if (violations.length > 0) {
      console.error("Architecture Violation: Math.random() detected outside demoData.ts in files:", violations);
    }
    expect(violations.length).toBe(0);
  });

  // Test 10: CTO-directed absolute cleanup and prohibition checks
  it("enforces complete absence of legacy importer imports and unrequested/forbidden terms in normal code", () => {
    const srcDir = path.resolve(__dirname); // src/components/
    const forbiddenImports = ["ImportacaoPlanilhasTab", "SpreadsheetSteps"];
    const forbiddenTerms = [
      "Grupo Alpha",
      "Topázio",
      "Simular Planilha",
      "Schema Mapping",
      "Grupo obrigatório",
      "CNPJ obrigatório",
      "Receita obrigatória"
    ];

    const scanForLegacy = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && entry.name !== "dist" && entry.name !== ".vite" && entry.name !== "build") {
            scanForLegacy(fullPath);
          }
        } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
          // Skip test files
          if (
            fullPath.includes("test") ||
            entry.name.includes("test")
          ) {
            continue;
          }

          const content = fs.readFileSync(fullPath, "utf-8");

          // Check forbidden imports
          forbiddenImports.forEach(term => {
            const hasForbiddenImport = content.includes(`import`) && content.includes(term);
            if (hasForbiddenImport) {
              console.error(`Legacy importer component/utility "${term}" imported in "${fullPath}"`);
              expect(hasForbiddenImport).toBe(false);
            }
          });

          // Check forbidden terms
          forbiddenTerms.forEach(term => {
            if (content.includes(term)) {
              console.error(`Forbidden legacy term "${term}" found in normal application file "${fullPath}"`);
              expect(content.includes(term)).toBe(false);
            }
          });
        }
      }
    };

    scanForLegacy(srcDir);

    // Also explicitly scan App.tsx
    const appPath = path.resolve(__dirname, "../App.tsx");
    const appContent = fs.readFileSync(appPath, "utf-8");
    forbiddenTerms.forEach(term => {
      if (appContent.includes(term)) {
        console.error(`Forbidden legacy term "${term}" found in App.tsx`);
        expect(appContent.includes(term)).toBe(false);
      }
    });
  });
});
