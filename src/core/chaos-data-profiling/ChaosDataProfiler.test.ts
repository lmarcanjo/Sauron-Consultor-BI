import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildActiveDatasetProfilingInput, buildWorkbookCatalogProfilingInput, profileChaosSource, profileDatabaseSample, profileDatabasePagedSample, compareChaosSources } from "./index";
import { WorkbookEngine } from "../workbook/WorkbookEngine";
import type { ChaosSourceInput } from "./ChaosDataTypes";
import type { SpreadsheetStoragePort } from "../storage/SpreadsheetStoragePort";
import { vi } from "vitest";

function chaoticSource(id = "source-chaos"): ChaosSourceInput {
  return {
    sourceId: id,
    sourceType: "csv",
    groupId: "group-1",
    sourceName: "operacao.csv",
    physicalContainers: [{
      id: "sheet-1",
      name: "Dados",
      type: "sheet",
      rowCount: 8,
      columns: ["Grupo", "Revenda", "Empresa", "Valor", "Data"],
      records: [
        { rowIndex: 0, values: { Grupo: "Resumo operacional" } },
        { rowIndex: 1, values: { Grupo: "Grupo", Revenda: "Revenda", Empresa: "Empresa", Valor: "Valor", Data: "Data" } },
        { rowIndex: 2, values: { Grupo: 4629617, Revenda: 3, Empresa: "YAMAHA_FABERGE_CARAGUA", Valor: "38,073", Data: "21/07/2026" } },
        { rowIndex: 3, values: { Grupo: 4629617, Revenda: 3, Empresa: "YAMAHA_FABERGE_CARAGUA", Valor: "1,904", Data: "22/07/2026" } },
        { rowIndex: 4, values: { Grupo: "4629617", Revenda: "3", Empresa: "YAMAHA_FABERGE_CARAGUA", Valor: "quarenta", Data: "não informado" } },
        { rowIndex: 5, values: { Grupo: null, Revenda: null, Empresa: null, Valor: null, Data: null } },
        { rowIndex: 6, values: { Grupo: "Grupo", Revenda: "Revenda", Empresa: "Empresa", Valor: "Valor", Data: "Data" } },
        { rowIndex: 7, values: { Grupo: "Total", Revenda: null, Empresa: null, Valor: "39,977", Data: null } },
      ],
    }],
  };
}

describe("ChaosDataProfiler", () => {
  it("profiles chaotic rows without changing physical values", () => {
    const source = chaoticSource();
    const before = JSON.stringify(source);
    const profile = profileChaosSource(source, { maxRowsPerContainer: 100 });

    expect(JSON.stringify(source)).toBe(before);
    expect(profile.profilingStatus).toBe("READY");
    expect(profile.sampledRecords).toBe(8);
    expect(profile.physicalColumns.find(column => column.physicalName === "Grupo")?.probableCode).toBe(true);
    expect(profile.physicalColumns.find(column => column.physicalName === "Valor")?.probableMetric).toBe(true);
    expect(profile.physicalColumns.find(column => column.physicalName === "Valor")?.mixedTypes).toBe(true);
    expect(profile.physicalContainers[0].rows.map(row => row.classification)).toContain("HEADER");
    expect(profile.physicalContainers[0].rows.map(row => row.classification)).toContain("DATA");
    expect(profile.physicalContainers[0].rows.map(row => row.classification)).toContain("EMPTY");
    expect(profile.physicalContainers[0].rows.map(row => row.classification)).toContain("TOTAL");
    expect(profile.detectedBlocks.length).toBeGreaterThan(0);
    expect(profile.semanticSuggestions.some(suggestion => suggestion.physicalColumns.includes("Revenda"))).toBe(true);
    expect(profile.qualityFindings.some(finding => finding.code === "MIXED_TYPES")).toBe(true);
    expect(profile.qualityFindings.some(finding => finding.code === "HEADER_IN_DATA")).toBe(true);
    expect(profile.rawZone.immutable).toBe(true);
    expect(profile.rawZone.physicalReferences[0].rowIndexes).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("keeps numeric codes as valid values instead of turning them into names", () => {
    const profile = profileChaosSource(chaoticSource());
    const group = profile.physicalColumns.find(column => column.physicalName === "Grupo");
    const reseller = profile.physicalColumns.find(column => column.physicalName === "Revenda");
    expect(group?.examples).toContain(4629617);
    expect(reseller?.examples).toContain(3);
    expect(profile.semanticSuggestions.find(suggestion => suggestion.physicalColumns[0] === "Grupo")?.warnings).toEqual([]);
  });

  it("stops without persisting a profile when the consultant cancels", () => {
    const controller = new AbortController();
    controller.abort();
    expect(() => profileChaosSource(chaoticSource(), { signal: controller.signal })).toThrow(/cancelado/i);
  });

  it("profiles only the requested database sample and rejects unsafe SQL", async () => {
    const source = chaoticSource("db-source");
    const profile = profileDatabaseSample({
      source,
      query: "SELECT Grupo, Valor FROM operacao LIMIT 5",
      container: { id: "operacao", name: "operacao", type: "table", rowCount: 1000, columns: ["Grupo", "Valor"] },
      records: source.physicalContainers[0].records.slice(2, 4),
    });
    expect(profile.sampledRecords).toBe(2);
    expect(() => profileDatabaseSample({
      source,
      query: "UPDATE operacao SET Valor = 1",
      container: { id: "operacao", name: "operacao", type: "table", columns: ["Valor"] },
      records: [],
    })).toThrow(/somente|bloqueio|bloqueada/i);

    let calls = 0;
    const paged = await profileDatabasePagedSample({
      source,
      query: "SHOW TABLES",
      container: { id: "operacao", name: "operacao", type: "table", columns: ["Grupo"] },
      readPage: async (offset, limit) => {
        calls++;
        if (offset > 0) return [];
        return source.physicalContainers[0].records.slice(2, 2 + limit);
      },
    }, { maxRowsPerContainer: 2 });
    expect(paged.sampledRecords).toBe(2);
    expect(calls).toBe(1);
  });

  it("detects exact copies and possible versions without overwriting either profile", () => {
    const left = profileChaosSource({ ...chaoticSource("left"), sourceHash: "hash-a" });
    const exact = profileChaosSource({ ...chaoticSource("right"), sourceHash: "hash-a" });
    const version = profileChaosSource({ ...chaoticSource("version"), sourceHash: "hash-b", sourceName: "operacao-v2.csv" });
    expect(compareChaosSources(left, exact).relation).toBe("EXACT_COPY");
    expect(compareChaosSources(left, version).relation).toBe("POSSIBLE_NEW_VERSION");
  });

  it("reads an active spreadsheet through one bounded page per sheet", async () => {
    const getRowsPaged = vi.fn(async (_datasetId: string, _sheetName: string, offset: number, limit: number) => {
      expect(offset).toBe(0);
      expect(limit).toBe(2);
      return [{ __sourceRowNumber: 7, __sheetName: "Dados", Grupo: 1, Valor: 10 }, { Grupo: 1, Valor: 20 }];
    });
    const storage = { getRowsPaged } as unknown as SpreadsheetStoragePort;
    const input = await buildActiveDatasetProfilingInput({
      datasetId: "dataset-1",
      sourceType: "SPREADSHEET_DATA",
      sourceName: "dados.xlsx",
      importedAt: "2026-07-23T00:00:00.000Z",
      rowCount: 100000,
      columnCount: 2,
      sheets: ["Dados"],
      activeSheet: "Dados",
      previewRows: [],
      columnProfiles: [],
      importProfile: null,
      rawStorageRef: "dataset-1",
      status: "ACTIVE",
    }, { groupId: "group-1" }, { storage, maxRowsPerContainer: 2 });
    expect(input.physicalContainers[0].records[0].values).toEqual({ Grupo: 1, Valor: 10 });
    expect(getRowsPaged).toHaveBeenCalledOnce();
  });
});

describe("Workbook catalog chaos adapter", () => {
  const realPath = "/home/natalicorreia/Downloads/Teste_Automação_Peças Honda Faberge Mogi~06.26 Veiculo ativou.xlsx";
  const realTest = fs.existsSync(realPath) ? it : it.skip;

  realTest("uses physical workbook preview without modifying the original bytes", async () => {
    const before = fs.readFileSync(realPath);
    const catalog = await new WorkbookEngine().catalogArrayBuffer(before, {
      sourceName: path.basename(realPath),
      previewRowsPerSheet: 40,
      profileRowsPerSheetLimit: 100,
    });
    const input = buildWorkbookCatalogProfilingInput(catalog, { groupId: "group-honda" });
    const profile = profileChaosSource(input, { maxRowsPerContainer: 40 });
    const after = fs.readFileSync(realPath);

    expect(Buffer.compare(before, after)).toBe(0);
    expect(profile.profilingStatus).toBe("READY");
    expect(profile.physicalContainers.length).toBeGreaterThan(0);
    expect(profile.physicalColumns.length).toBeGreaterThan(0);
    expect(profile.rawZone.immutable).toBe(true);
  }, 90000);
});
