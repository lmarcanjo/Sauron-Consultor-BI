import { describe, expect, it, vi, beforeEach } from "vitest";
import * as XLSX from "xlsx";
import { WorkbookEngine } from "./WorkbookEngine";
import { listFormulaTypes, summarizeWorkbook } from "./WorkbookInspector";
import { WorkbookRepository } from "./WorkbookRepository";

function createLocalStorageMock() {
  let storage: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      storage = {};
    }),
  };
}

function createWorkbookBuffer(): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["Produto", "Valor", "Total", "Status"],
    ["Filtro", 10, null, "ok"],
    ["Óleo", 20, null, "ok"],
    ["Pneu", 30, null, "pendente"],
  ]);

  worksheet.C2 = { t: "n", v: 60, f: "SOMA(B2:B4)" };
  worksheet.D5 = { t: "s", v: "ok", f: "SEERRO(PROCV(A2,A:B,2,FALSO),0)" };
  worksheet["!ref"] = "A1:D5";
  worksheet["!merges"] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
  workbook.Workbook = {
    Names: [{ Name: "FaixaValores", Ref: "Dados!$B$2:$B$4" }],
  };

  return XLSX.write(workbook, { type: "array", bookType: "xlsx", cellStyles: true });
}

describe("WorkbookEngine", () => {
  const localStorageMock = createLocalStorageMock();

  beforeEach(() => {
    localStorageMock.clear();
    vi.stubGlobal("localStorage", localStorageMock);
  });

  it("catalogs workbook structure without calculating formulas", async () => {
    const engine = new WorkbookEngine();
    const catalog = await engine.catalogArrayBuffer(createWorkbookBuffer(), {
      sourceName: "estrutura.xlsx",
      previewRowsPerSheet: 3,
      profileRowsPerSheetLimit: 20,
    });

    expect(catalog.metadata.name).toBe("estrutura.xlsx");
    expect(catalog.metadata.extension).toBe(".xlsx");
    expect(catalog.sheets).toHaveLength(1);
    expect(catalog.sheets[0]).toMatchObject({
      name: "Dados",
      rowCount: 5,
      columnCount: 4,
      hasFormulas: true,
      hasMergedCells: true,
      hasNamedRanges: true,
    });
    expect(catalog.sheets[0].preview).toHaveLength(3);
    expect(catalog.formulas.map(formula => formula.formula)).toContain("SOMA(B2:B4)");
    expect(catalog.formulas.map(formula => formula.formula)).toContain("SEERRO(PROCV(A2,A:B,2,FALSO),0)");
    expect(listFormulaTypes(catalog).map(item => item.type)).toContain("SOMA");
    expect(catalog.namedRanges[0]).toMatchObject({ name: "FaixaValores" });
    expect(catalog.mergedCells).toHaveLength(1);
    expect(catalog.columns.find(column => column.columnLetter === "B")?.inferredType).toBe("number");
    expect(catalog.diagnostics.performance.pagedReading).toBe(true);
  });

  it("persists and reloads the technical catalog only", async () => {
    const repository = new WorkbookRepository();
    const engine = new WorkbookEngine(undefined, repository);
    const catalog = await engine.catalogArrayBuffer(createWorkbookBuffer(), {
      sourceName: "persistencia.xlsx",
      profileRowsPerSheetLimit: 10,
    });

    repository.save(catalog);

    const reloadedRepository = new WorkbookRepository();
    const reloaded = reloadedRepository.get(catalog.id);

    expect(reloaded?.id).toBe(catalog.id);
    expect(reloaded?.sheets[0].name).toBe("Dados");
    expect(reloaded?.metadata.rowCount).toBe(5);
    expect(JSON.stringify(reloaded)).not.toContain("\"rows\"");
  });

  it("summarizes the catalog for read-only consumers", async () => {
    const engine = new WorkbookEngine();
    const catalog = await engine.catalogArrayBuffer(createWorkbookBuffer(), {
      sourceName: "overview.xlsx",
      profileRowsPerSheetLimit: 10,
    });
    const overview = summarizeWorkbook(catalog);

    expect(overview).toMatchObject({
      name: "overview.xlsx",
      sheetCount: 1,
      rowCount: 5,
      columnCount: 4,
      formulaCount: 2,
      namedRangeCount: 1,
    });
    expect(overview.sheetsWithFormulas).toEqual(["Dados"]);
  });
});
