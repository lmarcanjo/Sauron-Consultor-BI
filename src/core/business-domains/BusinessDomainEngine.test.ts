import { describe, expect, it } from "vitest";
import { businessDomainEngine } from "./BusinessDomainEngine";
import { businessDomainRegistry } from "./BusinessDomainRegistry";
import { WorkbookCatalog } from "../workbook/WorkbookTypes";

// Ensure packs are registered
import "./index";

describe("BusinessDomainEngine Unit Tests", () => {
  it("verifies all standard packs are registered automatically", () => {
    const packs = businessDomainRegistry.list();
    expect(packs.length).toBe(9); // shared + 8 specific segments
    expect(packs.map(p => p.manifest.id)).toContain("shared");
    expect(packs.map(p => p.manifest.id)).toContain("automotive");
    expect(packs.map(p => p.manifest.id)).toContain("agribusiness");
  });

  it("detects agribusiness domain from workbook column profile", () => {
    const mockWorkbook: Partial<WorkbookCatalog> = {
      metadata: {
        id: "wb_agro_1",
        name: "Producao_Safra_2026.xlsx",
        extension: ".xlsx",
        importedAt: new Date().toISOString(),
        hash: "some_hash",
        sheetCount: 1,
        rowCount: 10,
        columnCount: 3,
        cellCount: 30
      },
      columns: [
        { sheetName: "Planilha1", columnIndex: 0, columnLetter: "A", originalName: "Fazenda", alias: "", inferredType: "text", valueCount: 10, emptyCount: 0, uniqueCount: 5, duplicateCount: 5, fillRate: 1, minValue: null, maxValue: null, examples: [], textPattern: null, numericPattern: null, possibleDates: 0, possibleCpfs: 0, possibleCnpjs: 0, possiblePhones: 0, possibleCeps: 0, possibleCodes: 0, possibleIds: 0 },
        { sheetName: "Planilha1", columnIndex: 1, columnLetter: "B", originalName: "Talhão", alias: "", inferredType: "text", valueCount: 10, emptyCount: 0, uniqueCount: 5, duplicateCount: 5, fillRate: 1, minValue: null, maxValue: null, examples: [], textPattern: null, numericPattern: null, possibleDates: 0, possibleCpfs: 0, possibleCnpjs: 0, possiblePhones: 0, possibleCeps: 0, possibleCodes: 0, possibleIds: 0 },
        { sheetName: "Planilha1", columnIndex: 2, columnLetter: "C", originalName: "Safra", alias: "", inferredType: "text", valueCount: 10, emptyCount: 0, uniqueCount: 5, duplicateCount: 5, fillRate: 1, minValue: null, maxValue: null, examples: [], textPattern: null, numericPattern: null, possibleDates: 0, possibleCpfs: 0, possibleCnpjs: 0, possiblePhones: 0, possibleCeps: 0, possibleCodes: 0, possibleIds: 0 }
      ],
      sheets: [
        { id: "s1", name: "Safra Milho", index: 0, visibility: "visible", rowCount: 10, columnCount: 3, usedRange: null, preview: [], hasFormulas: false, hasCharts: false, hasPivot: false, hasTables: false, hasMergedCells: false, hasConditionalFormatting: false, hasNamedRanges: false, hasHiddenRows: false, hasHiddenColumns: false }
      ]
    };

    const domain = businessDomainEngine.detectDomain(mockWorkbook as WorkbookCatalog);
    expect(domain).toBe("agribusiness");
  });

  it("detects automotive domain from workbook sheets and headers", () => {
    const mockWorkbook: Partial<WorkbookCatalog> = {
      metadata: {
        id: "wb_auto_1",
        name: "Dealers.xlsx",
        extension: ".xlsx",
        importedAt: new Date().toISOString(),
        hash: "some_hash",
        sheetCount: 1,
        rowCount: 10,
        columnCount: 3,
        cellCount: 30
      },
      columns: [
        { sheetName: "Planilha1", columnIndex: 0, columnLetter: "A", originalName: "Concessionária", alias: "", inferredType: "text", valueCount: 10, emptyCount: 0, uniqueCount: 5, duplicateCount: 5, fillRate: 1, minValue: null, maxValue: null, examples: [], textPattern: null, numericPattern: null, possibleDates: 0, possibleCpfs: 0, possibleCnpjs: 0, possiblePhones: 0, possibleCeps: 0, possibleCodes: 0, possibleIds: 0 },
        { sheetName: "Planilha1", columnIndex: 1, columnLetter: "B", originalName: "Oficina", alias: "", inferredType: "text", valueCount: 10, emptyCount: 0, uniqueCount: 5, duplicateCount: 5, fillRate: 1, minValue: null, maxValue: null, examples: [], textPattern: null, numericPattern: null, possibleDates: 0, possibleCpfs: 0, possibleCnpjs: 0, possiblePhones: 0, possibleCeps: 0, possibleCodes: 0, possibleIds: 0 }
      ]
    };

    const domain = businessDomainEngine.detectDomain(mockWorkbook as WorkbookCatalog);
    expect(domain).toBe("automotive");
  });

  it("detects subdomain correctly", () => {
    const mockWorkbook: Partial<WorkbookCatalog> = {
      metadata: {
        id: "wb_auto_2",
        name: "Workshop_Sales.xlsx",
        extension: ".xlsx",
        importedAt: new Date().toISOString(),
        hash: "some_hash",
        sheetCount: 1,
        rowCount: 10,
        columnCount: 3,
        cellCount: 30
      },
      columns: [
        { sheetName: "Planilha1", columnIndex: 0, columnLetter: "A", originalName: "Oficina", alias: "", inferredType: "text", valueCount: 10, emptyCount: 0, uniqueCount: 5, duplicateCount: 5, fillRate: 1, minValue: null, maxValue: null, examples: [], textPattern: null, numericPattern: null, possibleDates: 0, possibleCpfs: 0, possibleCnpjs: 0, possiblePhones: 0, possibleCeps: 0, possibleCodes: 0, possibleIds: 0 }
      ]
    };

    const sub = businessDomainEngine.detectSubDomain(mockWorkbook as WorkbookCatalog);
    expect(sub).toBe("oficina");
  });

  it("retrieves templates and configurations properly", () => {
    const kpis = businessDomainEngine.getKPIs("healthcare");
    expect(kpis.some(k => k.code === "OCCUPANCY_RATE")).toBe(true);

    const hierarchy = businessDomainEngine.getHierarchy("retail");
    expect(hierarchy?.levels).toContain("Loja");

    const meeting = businessDomainEngine.getMeetingTemplate("construction");
    expect(meeting?.mandatoryKpis).toContain("SCHEDULE_DAYS");

    const pres = businessDomainEngine.getPresentationTemplate("services");
    expect(pres?.cards).toContain("PROJECT_HOURS");
  });
});
