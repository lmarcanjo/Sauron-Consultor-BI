/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { dataSourceManager } from "./dataSourceManager";
import { isQueryReadOnly } from "../utils/calculations";

// Standard key-value storage mock for Node.js headless testing
let store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => { store[key] = value.toString(); },
  clear: () => { store = {}; },
  removeItem: (key: string) => { delete store[key]; }
};
vi.stubGlobal("localStorage", localStorageMock);

describe("Sauron Data Source Manager Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    dataSourceManager.setActiveSource("DEMO_DATA");
  });

  it("checks activeDataSource switches to SPREADSHEET_DATA on import and locks out mock data", () => {
    expect(dataSourceManager.getActiveSource()).toBe("SPREADSHEET_DATA");
    expect(dataSourceManager.isDemoMode()).toBe(false);

    // Mock importing a real spreadsheet file
    const sampleFile = {
      id: "real_file_123",
      fileName: "DRE_Real_Maio_2026.xlsx",
      importedAt: new Date().toISOString(),
      importedBy: "Lennon Marcanjo",
      status: "ACTIVE" as const,
      totalRows: 2,
      totalColumns: 2,
      sheets: [
        {
          id: "sheet_01",
          fileId: "real_file_123",
          sheetName: "Maio",
          rows: [
            { id: "1", Grupo: "Grupo Amigos Real S/A", CNPJ: "99.999.999/0001-99", Marca: "Real Fiat", Empresa: "Real Fiat S/A", Mês: "Maio", Receita: 10000, Custo: 4000, Despesa: 2000, Lucro: 4000, Margem: 40 },
            { id: "sim_02", Grupo: "Grupo Topázio", CNPJ: "11.111.111/0001-11", Marca: "Topázio Fiat", Empresa: "Topázio Fiat S/A", Mês: "Maio", Receita: 5000, Custo: 2000, Despesa: 1000, Lucro: 2000, Margem: 40, __isDemo: true } // fake record mixed in
          ],
          columns: []
        }
      ]
    };

    dataSourceManager.addSpreadsheetFile(sampleFile, "REPLACE");

    // Must automatically transition activeDataSource to SPREADSHEET_DATA
    expect(dataSourceManager.getActiveSource()).toBe("SPREADSHEET_DATA");
    expect(dataSourceManager.isSpreadsheetMode()).toBe(true);

    // Assert that active records returns ONLY the real file records and filters out the 'Grupo Topázio' mock record (No-Contamination Rule)
    const activeRecords = dataSourceManager.getActiveRecords();
    expect(activeRecords.length).toBe(1);
    expect(activeRecords[0].Grupo).toBe("Grupo Amigos Real S/A");
  });

  it("safely blocks __EMPTY or tech columns from becoming Client Filters", () => {
    // Create invalid filter configs
    const techFilter = {
      id: "filt_tech",
      sourceColumn: "__EMPTY_1",
      friendlyName: "Vazio",
      type: "text" as const,
      visibleToConsultant: true,
      visibleToClient: true,
      visibleInReports: true,
      visibleInPresentations: true,
      required: false,
      order: 1
    };

    const validFilter = {
      id: "filt_valid",
      sourceColumn: "Marca",
      friendlyName: "Marca do Veículo",
      type: "multiselect" as const,
      visibleToConsultant: true,
      visibleToClient: true,
      visibleInReports: true,
      visibleInPresentations: true,
      required: false,
      order: 2
    };

    // Attempt registration
    dataSourceManager.registerFilterConfig(techFilter);
    dataSourceManager.registerFilterConfig(validFilter);

    const activeFilters = dataSourceManager.getFilterConfigs();
    const techFilterFound = activeFilters.find(f => f.sourceColumn.startsWith("__EMPTY"));
    const validFilterFound = activeFilters.find(f => f.sourceColumn === "Marca");

    expect(techFilterFound).toBeUndefined(); // __EMPTY is blocked
    expect(validFilterFound).toBeDefined(); // Valid is registered
  });

  it("ensures consultant adjustments are tracked and isolated in a separate state layer", () => {
    dataSourceManager.addConsultantAdjustment({
      type: "meta",
      targetField: "Receita",
      targetFilter: "Marca=Real Fiat",
      value: 120000,
      description: "Meta agressiva para Q2"
    });

    const adjustments = dataSourceManager.getConsultantAdjustments();
    expect(adjustments.length).toBe(1);
    expect(adjustments[0].value).toBe(120000);
    expect(adjustments[0].createdBy).toBe("Lennon Marcanjo");
  });

  it("validates read-only rules block destructive operations but permit SELECT, SHOW, DESCRIBE", () => {
    expect(isQueryReadOnly("SELECT * FROM faturamento_lojas;")).toBe(true);
    expect(isQueryReadOnly("SHOW TABLES;")).toBe(true);
    expect(isQueryReadOnly("DESCRIBE faturamento;")).toBe(true);

    expect(isQueryReadOnly("INSERT INTO faturamento_lojas VALUES (1, 'Vendas')")).toBe(false);
    expect(isQueryReadOnly("DROP TABLE clientes_vpn;")).toBe(false);
    expect(isQueryReadOnly("ALTER TABLE faturamento DROP COLUMN id;")).toBe(false);
  });

  // --- MANDATORY SPRINT TESTS ---
  it("blocks legacy DEMO_DATA as an active production source", () => {
    const manager = dataSourceManager;
    manager.setActiveSource("DEMO_DATA");
    expect(manager.getActiveSource()).toBe("SPREADSHEET_DATA");
    expect(manager.isDemoMode()).toBe(false);
  });

  it("verifies switching active source to SPREADSHEET_DATA", () => {
    const manager = dataSourceManager;
    manager.setActiveSource("SPREADSHEET_DATA");
    expect(manager.getActiveSource()).toBe("SPREADSHEET_DATA");
    expect(manager.isSpreadsheetMode()).toBe(true);
  });

  it("verifies mock data is blocked/filtered when a real source is active", () => {
    const testRecords = [
      { id: "1", Grupo: "Grupo Amigos Real S/A", CNPJ: "99.999.999/0001-99", Marca: "Real Fiat", Empresa: "Real Fiat S/A", Mês: "Maio", Receita: 10000, Custo: 4000, Despesa: 2000 },
      { id: "sim_02", Grupo: "Grupo Topázio", CNPJ: "11.111.111/0001-11", Marca: "Topázio Fiat", Empresa: "Topázio Fiat S/A", Mês: "Maio", Receita: 5000, Custo: 2000, Despesa: 1000, __isDemo: true }
    ] as any[];

    // Using the assertNoMockDataWhenRealSource with signature (activeDataSource, records)
    const filtered = dataSourceManager.assertNoMockDataWhenRealSource("SPREADSHEET_DATA", testRecords);
    expect(filtered.length).toBe(1);
    expect(filtered[0].Grupo).toBe("Grupo Amigos Real S/A");
  });

  it("ensures getActiveRecords never returns legacy demo records", () => {
    dataSourceManager.setActiveSource("DEMO_DATA");
    const activeData = dataSourceManager.getActiveRecords();
    expect(activeData.some((record: any) => record.__isDemo === true || record.id?.startsWith("sim_"))).toBe(false);
  });

  it("ensures fictional 'Grupo Topázio' does not appear with SPREADSHEET_DATA active", () => {
    const sampleFile = {
      id: "real_file_456",
      fileName: "DRE_Real_Julho.xlsx",
      importedAt: new Date().toISOString(),
      importedBy: "Lennon Marcanjo",
      status: "ACTIVE" as const,
      totalRows: 2,
      totalColumns: 2,
      sheets: [
        {
          id: "sheet_02",
          fileId: "real_file_456",
          sheetName: "Julho",
          rows: [
            { id: "1", Grupo: "Empresa Agro-Agua S/A", CNPJ: "88.888.888/0001-88", Marca: "Agro S/A", Empresa: "Fazenda Agua", Mês: "Julho", Receita: 15000 },
            { id: "sim_2", Grupo: "Grupo Topázio", CNPJ: "11.111.111/0001-11", Marca: "Topázio Fiat", Empresa: "Topázio Fiat S/A", Mês: "Julho", Receita: 4500, __isDemo: true }
          ],
          columns: []
        }
      ]
    };

    dataSourceManager.addSpreadsheetFile(sampleFile, "REPLACE");
    expect(dataSourceManager.getActiveSource()).toBe("SPREADSHEET_DATA");

    const activeRecs = dataSourceManager.getActiveRecords();
    expect(activeRecs.length).toBe(1);
    expect(activeRecs[0].Grupo).toBe("Empresa Agro-Agua S/A");
    
    // Check fictional 'Grupo Topázio' is entirely absent
    const hasTopazio = activeRecs.some(r => r.Grupo === "Grupo Topázio" || r.Grupo === "Grupo Topázio Corporativo");
    expect(hasTopazio).toBe(false);
  });
});
