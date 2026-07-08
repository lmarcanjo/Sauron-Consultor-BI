import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiImportService } from "./ApiImportService";
import { LocalImportService } from "./LocalImportService";

const storageMock = vi.hoisted(() => {
  const sheetRows = new Map<string, any[]>();
  return {
    sheetRows,
    saveSheetRows: vi.fn(async (fileId: string, sheetName: string, rows: any[]) => {
      sheetRows.set(`${fileId}::${sheetName}`, rows);
    }),
    getRowsPaged: vi.fn(async (fileId: string, sheetName: string, offset: number, limit: number) => {
      return (sheetRows.get(`${fileId}::${sheetName}`) || []).slice(offset, offset + limit);
    }),
    saveMetadata: vi.fn(async () => undefined),
  };
});

vi.mock("../storage/IndexedSpreadsheetStorage", () => ({
  IndexedSpreadsheetStorage: {
    saveSheetRows: storageMock.saveSheetRows,
    getRowsPaged: storageMock.getRowsPaged,
    saveMetadata: storageMock.saveMetadata,
  },
}));

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Import services", () => {
  beforeEach(() => {
    storageMock.sheetRows.clear();
    storageMock.saveSheetRows.mockClear();
    storageMock.getRowsPaged.mockClear();
    storageMock.saveMetadata.mockClear();
    vi.restoreAllMocks();
  });

  it("LocalImportService keeps the local spreadsheet flow working", async () => {
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Produto", "Valor"],
      ["Filtro", 10],
      ["Óleo", 20],
    ]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "IMP_VENDAS");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const file = new File([buffer], "local.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const service = new LocalImportService();
    const job = await service.startSpreadsheetImport(file);

    expect(job.status).toBe("READY");
    expect(job.metadata?.sheets.map(sheet => sheet.sheetName)).toEqual(["IMP_VENDAS"]);

    const preview = await service.getImportPreview(job.jobId, "IMP_VENDAS", 1, 10);
    expect(preview.rows).toHaveLength(2);
    expect(preview.columns).toContain("Produto");

    const dataset = await service.activateImport(job.jobId, ["IMP_VENDAS"]);
    expect(dataset.sourceName).toBe("local.xlsx");
    expect(dataset.rowCount).toBe(2);
    expect(dataset.previewRows).toHaveLength(2);
    expect(storageMock.saveSheetRows).toHaveBeenCalledWith(job.jobId, "IMP_VENDAS", expect.any(Array));
    expect(storageMock.saveMetadata).toHaveBeenCalled();
  });

  it("ApiImportService builds the production import requests", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/api/v1/imports/spreadsheets")) {
        expect(init?.method).toBe("POST");
        expect(init?.headers).toMatchObject({
          "X-Sauron-File-Name": "api.xlsx",
          "X-Sauron-File-Size": "3",
        });
        return jsonResponse({
          jobId: "job_1",
          fileName: "api.xlsx",
          fileSize: 3,
          status: "PENDING",
          progress: { status: "PENDING", step: "Aguardando worker", message: "ok", percent: 5 },
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          mode: "api",
        });
      }
      if (url.endsWith("/api/v1/imports/job_1")) {
        return jsonResponse({
          jobId: "job_1",
          fileName: "api.xlsx",
          fileSize: 3,
          status: "READY",
          progress: { status: "READY", step: "Pronto", message: "ok", percent: 100 },
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          mode: "api",
        });
      }
      if (url.includes("/api/v1/imports/job_1/preview")) {
        expect(url).toContain("sheetName=IMP_VENDAS");
        expect(url).toContain("page=2");
        expect(url).toContain("pageSize=25");
        return jsonResponse({ jobId: "job_1", sheetName: "IMP_VENDAS", page: 2, pageSize: 25, totalRows: 0, columns: [], rows: [] });
      }
      if (url.endsWith("/api/v1/imports/job_1/activate")) {
        expect(init?.method).toBe("POST");
        expect(init?.body).toBe(JSON.stringify({ selectedSheets: ["IMP_VENDAS"] }));
        return jsonResponse({
          datasetId: "job_1",
          sourceType: "SPREADSHEET_DATA",
          sourceName: "api.xlsx",
          importedAt: "2026-01-01T00:00:00.000Z",
          rowCount: 0,
          columnCount: 0,
          sheets: [],
          activeSheet: "IMP_VENDAS",
          previewRows: [],
          columnProfiles: [],
          importProfile: null,
          rawStorageRef: "api:job_1",
          status: "ACTIVE",
        });
      }
      if (url.endsWith("/api/v1/imports/job_1/cancel")) {
        expect(init?.method).toBe("POST");
        return jsonResponse({ ok: true });
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);
    const service = new ApiImportService();
    const file = new File(["abc"], "api.xlsx");

    const job = await service.startSpreadsheetImport(file);
    await service.getImportJob(job.jobId);
    await service.getImportPreview(job.jobId, "IMP_VENDAS", 2, 25);
    const dataset = await service.activateImport(job.jobId, ["IMP_VENDAS"]);
    await service.cancelImport(job.jobId);

    expect(dataset.rawStorageRef).toBe("api:job_1");
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("SimpleSpreadsheetImporter uses ImportService instead of direct spreadsheet processing", () => {
    const sourcePath = path.resolve(__dirname, "../../components/spreadsheet/SimpleSpreadsheetImporter.tsx");
    const source = fs.readFileSync(sourcePath, "utf8");

    expect(source).toContain("createImportService");
    expect(source).not.toContain('import("xlsx")');
    expect(source).not.toContain("IndexedSpreadsheetStorage");
  });
});
