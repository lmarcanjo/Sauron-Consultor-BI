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

  // Test 4: Demo data is only available when activeDataSource = DEMO_DATA
  it("guarantees demo/mock data only appears when DEMO_DATA is the active source", () => {
    // Save original state
    const originalSource = dataSourceManager.getActiveSource();
    
    try {
      // 1. When SPREADSHEET_DATA is active, demo data must be empty or filtered out
      dataSourceManager.setActiveSource("SPREADSHEET_DATA");
      const records = dataSourceManager.getActiveRecords();
      
      // Since workspace has no active files in the fresh test environment, SPREADSHEET_DATA should return empty list
      expect(records.length).toBe(0);

      // 2. When DEMO_DATA is active, records are populated
      dataSourceManager.setActiveSource("DEMO_DATA");
      const demoRecords = dataSourceManager.getActiveRecords();
      expect(demoRecords.length).toBeGreaterThan(0);
      
    } finally {
      // Restore state
      dataSourceManager.setActiveSource(originalSource);
    }
  });
});
