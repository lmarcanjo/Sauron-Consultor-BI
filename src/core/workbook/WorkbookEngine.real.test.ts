import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { WorkbookEngine } from "./WorkbookEngine";
import { listFormulaTypes, summarizeWorkbook } from "./WorkbookInspector";
import { WorkbookRepository } from "./WorkbookRepository";

const REAL_WORKBOOK_PATH = "/home/natalicorreia/Downloads/Teste_Automação_Peças Honda Faberge Mogi~06.26 Veiculo ativou.xlsx";
const runWithRealWorkbook = fs.existsSync(REAL_WORKBOOK_PATH) ? it : it.skip;

describe("WorkbookEngine with the real consultant workbook", () => {
  runWithRealWorkbook("catalogs the Honda workbook structure and survives reload", async () => {
    const buffer = fs.readFileSync(REAL_WORKBOOK_PATH);
    const engine = new WorkbookEngine();
    const catalog = await engine.catalogArrayBuffer(buffer, {
      sourceName: path.basename(REAL_WORKBOOK_PATH),
      sourceSizeBytes: buffer.byteLength,
      previewRowsPerSheet: 5,
      profileRowsPerSheetLimit: 500,
    });

    const overview = summarizeWorkbook(catalog);
    const formulaTypes = listFormulaTypes(catalog);

    expect(overview.sheetCount).toBeGreaterThanOrEqual(18);
    expect(overview.rowCount).toBeGreaterThanOrEqual(37741);
    expect(overview.columnCount).toBeGreaterThanOrEqual(180);
    expect(catalog.sheets.map(sheet => sheet.name)).toEqual(expect.arrayContaining([
      "IMP_VENDAS_AT",
      "Comissão_Vendedores",
      "Importacao_Detalhada",
      "Cadastros_Vendedores",
    ]));
    expect(catalog.tables.length).toBeGreaterThan(0);
    expect(catalog.namedRanges.length).toBeGreaterThan(0);
    expect(catalog.formulas.length).toBeGreaterThan(0);
    expect(formulaTypes.length).toBeGreaterThan(0);
    expect(catalog.mergedCells.length).toBeGreaterThan(0);
    expect(catalog.diagnostics.performance.pagedReading).toBe(true);
    expect(catalog.diagnostics.performance.profilingRowsPerSheetLimit).toBe(500);
    expect(catalog.charts.length).toBeGreaterThanOrEqual(0);
    expect(catalog.pivotTables.length).toBeGreaterThanOrEqual(0);

    const repository = new WorkbookRepository();
    repository.save(catalog);
    const reloaded = repository.get(catalog.id);

    expect(reloaded?.metadata.hash).toBe(catalog.metadata.hash);
    expect(reloaded?.sheets.length).toBe(catalog.sheets.length);
    expect(reloaded?.metadata.rowCount).toBe(catalog.metadata.rowCount);
  }, 60000);
});
