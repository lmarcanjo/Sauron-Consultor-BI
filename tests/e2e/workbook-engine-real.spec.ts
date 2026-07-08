import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { WorkbookEngine, WorkbookRepository } from "../../src/core/workbook";

const REAL_WORKBOOK_PATH = "/home/natalicorreia/Downloads/Teste_Automação_Peças Honda Faberge Mogi~06.26 Veiculo ativou.xlsx";

test.describe("Workbook Engine F8.1 real workbook", () => {
  test.skip(!fs.existsSync(REAL_WORKBOOK_PATH), "Real consultant workbook is not available in this environment.");

  test("catalogs, persists and reloads the real workbook structure", async () => {
    const buffer = fs.readFileSync(REAL_WORKBOOK_PATH);
    const repository = new WorkbookRepository();
    const engine = new WorkbookEngine(undefined, repository);
    const catalog = await engine.catalogAndSaveArrayBuffer(buffer, {
      sourceName: path.basename(REAL_WORKBOOK_PATH),
      sourceSizeBytes: buffer.byteLength,
      previewRowsPerSheet: 5,
      profileRowsPerSheetLimit: 500,
    });
    const reloaded = repository.get(catalog.id);

    expect(catalog.sheets.length).toBeGreaterThanOrEqual(18);
    expect(catalog.metadata.rowCount).toBeGreaterThanOrEqual(37741);
    expect(catalog.metadata.columnCount).toBeGreaterThanOrEqual(180);
    expect(catalog.formulas.length).toBeGreaterThan(0);
    expect(catalog.namedRanges.length).toBeGreaterThan(0);
    expect(catalog.tables.length).toBeGreaterThan(0);
    expect(catalog.diagnostics.performance.pagedReading).toBe(true);
    expect(reloaded?.metadata.hash).toBe(catalog.metadata.hash);
    expect(reloaded?.sheets.length).toBe(catalog.sheets.length);
  });
});
