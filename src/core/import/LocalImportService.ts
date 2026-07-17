import { ActiveDataset, ActiveDatasetRow, ActiveWorkbookDataset, SheetMetadata } from "../../types/dataSource";
import { IndexedSpreadsheetStorage } from "../storage/IndexedSpreadsheetStorage";
import type { ImportService } from "./ImportService";
import { ImportJob, ImportJobProgress, ImportPreviewPage, UploadedSheetMetadata } from "./ImportJobTypes";
import { withSourceIdentity } from "../data/sourceIdentity";

type Workbook = {
  SheetNames: string[];
  Sheets: Record<string, any>;
};

interface LocalJobState {
  file: File;
  workbook: Workbook;
  job: ImportJob;
}

const localJobs = new Map<string, LocalJobState>();
let fallbackJobIdCounter = 0;

const progress = (
  status: ImportJob["status"],
  step: string,
  message: string,
  percent: number
): ImportJobProgress => ({
  status,
  step,
  message,
  percent,
});

export function normalizeHeaderName(value: any, fallback: string) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

export function makeUniqueHeaders(headers: string[]) {
  const seen = new Map<string, number>();
  return headers.map((header, index) => {
    const base = normalizeHeaderName(header, `Coluna ${index + 1}`);
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

export function rowHasValues(row: any[]) {
  return row.some(cell => String(cell ?? "").trim() !== "");
}

export function detectHeaderRowIndex(matrix: any[][]) {
  const maxRows = Math.min(matrix.length, 40);
  let bestIndex = 0;
  let bestScore = -1;

  for (let idx = 0; idx < maxRows; idx++) {
    const row = matrix[idx] || [];
    const values = row.map(cell => String(cell ?? "").trim()).filter(Boolean);
    if (values.length === 0) continue;

    const nextValues = (matrix[idx + 1] || []).map(cell => String(cell ?? "").trim()).filter(Boolean);
    const textCount = values.filter(value => /[A-Za-zÀ-ÿ]/.test(value)).length;
    const uniqueCount = new Set(values.map(value => value.toLowerCase())).size;
    const emptyPenalty = row.filter(cell => String(cell ?? "").trim() === "").length / Math.max(row.length, 1);
    const score = values.length * 2 + textCount * 3 + uniqueCount + Math.min(nextValues.length, values.length) - emptyPenalty;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = idx;
    }
  }

  return bestIndex;
}

export function parseWorksheetRows(worksheet: any, xlsxUtils: any, sheetName: string) {
  const matrix = xlsxUtils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false }) as any[][];
  const headerRowIndex = detectHeaderRowIndex(matrix);
  const headers = makeUniqueHeaders(matrix[headerRowIndex] || []);
  const rows = matrix
    .slice(headerRowIndex + 1)
    .filter(rowHasValues)
    .map((row, rowIndex) => {
      const parsed: Record<string, any> = {};
      headers.forEach((header, colIndex) => {
        parsed[header] = row[colIndex] ?? "";
      });
      parsed.__sheetName = sheetName;
      parsed.__sourceRowNumber = headerRowIndex + rowIndex + 2;
      return parsed;
    });

  return { headers, rows, headerRowIndex };
}

export function choosePrimaryDataSheet<T extends { sheetName: string; rowCount: number }>(sheets: T[]) {
  const preferredNames = ["Importacao_Detalhada", "IMP_VENDAS", "IMP_VENDAS_AT"];
  return (
    preferredNames
      .map(name => sheets.find(sheet => sheet.sheetName.toLowerCase() === name.toLowerCase()))
      .find(Boolean) ||
    sheets.find(sheet => sheet.rowCount > 0 && !["menu", "instrucoes", "config"].includes(sheet.sheetName.toLowerCase())) ||
    sheets[0]
  );
}

function createJobId(file: File) {
  const safeName = file.name.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "") || "workbook";
  const unique = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}_${fallbackJobIdCounter++}`;
  return `workbook_${safeName}_${unique}`;
}

function classifySheet(rowCount: number, colCount: number, formulaCount: number): UploadedSheetMetadata["classification"] {
  if (rowCount === 0) return "Vazia";
  if (formulaCount > rowCount * 2) return "Cálculo/Fórmulas";
  if (colCount < 5 && rowCount > 100) return "Cadastro";
  if (rowCount > 1000) return "Base de dados";
  if (formulaCount > 0) return "Relatório";
  return "Não classificada";
}

function updateJob(job: ImportJob, partial: Partial<ImportJob>) {
  Object.assign(job, partial, { updatedAt: new Date().toISOString() });
}

function getColumns(rows: Record<string, unknown>[]) {
  return Array.from(new Set(rows.flatMap(row => Object.keys(row).filter(key => !key.startsWith("__")))));
}

export class LocalImportService implements ImportService {
  async startSpreadsheetImport(file: File): Promise<ImportJob> {
    const now = new Date().toISOString();
    const jobId = createJobId(file);
    const job: ImportJob = {
      jobId,
      fileName: file.name,
      fileSize: file.size,
      status: "UPLOADING",
      progress: progress("UPLOADING", "Enviando arquivo", "Preparando leitura local da planilha.", 10),
      createdAt: now,
      updatedAt: now,
      mode: "local",
    };

    localJobs.set(jobId, { file, workbook: { SheetNames: [], Sheets: {} }, job });

    try {
      updateJob(job, {
        status: "EXTRACTING_METADATA",
        progress: progress("EXTRACTING_METADATA", "Lendo estrutura", "Extraindo abas, dimensões e fórmulas.", 35),
      });

      const XLSX = await import("xlsx");
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array", cellFormula: true }) as Workbook;
      const sheets: UploadedSheetMetadata[] = workbook.SheetNames.map((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const formulaCount = Object.keys(worksheet || {}).filter(key => worksheet[key]?.f).length;
        const range = XLSX.utils.decode_range(worksheet?.["!ref"] || "A1:A1");
        const rowCount = range.e.r + 1;
        const columnCount = range.e.c + 1;

        return {
          sheetName,
          rowCount,
          columnCount,
          formulaCount,
          storageRef: `ref_${file.name}_${sheetName}`,
          classification: classifySheet(rowCount, columnCount, formulaCount),
          selectedForImport: false,
        };
      });

      const primarySheet = choosePrimaryDataSheet(sheets);
      updateJob(job, {
        status: "READY",
        progress: progress("READY", "Pronto", "Estrutura da planilha disponível para prévia e ativação.", 100),
        metadata: {
          workbookId: jobId,
          fileName: file.name,
          fileSize: file.size,
          sheetCount: sheets.length,
          totalRows: sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0),
          totalColumns: primarySheet?.columnCount || 0,
          formulaCount: sheets.reduce((sum, sheet) => sum + sheet.formulaCount, 0),
          activeSheet: primarySheet?.sheetName || sheets[0]?.sheetName || "",
          sheets,
          importedAt: now,
        },
      });

      localJobs.set(jobId, { file, workbook, job });
      return job;
    } catch (error: any) {
      updateJob(job, {
        status: "FAILED",
        progress: progress("FAILED", "Erro", "Falha ao ler a estrutura da planilha.", 100),
        error: {
          code: "LOCAL_IMPORT_METADATA_FAILED",
          message: error?.message || "Falha ao ler a planilha.",
          details: error,
          recoverable: true,
        },
      });
      throw error;
    }
  }

  async getImportJob(jobId: string): Promise<ImportJob> {
    const state = localJobs.get(jobId);
    if (!state) throw new Error(`Import job not found: ${jobId}`);
    return state.job;
  }

  async getImportPreview(jobId: string, sheetName: string, page: number, pageSize: number): Promise<ImportPreviewPage> {
    const state = localJobs.get(jobId);
    if (!state) throw new Error(`Import job not found: ${jobId}`);

    const XLSX = await import("xlsx");
    const worksheet = state.workbook.Sheets[sheetName];
    if (!worksheet) throw new Error(`Sheet not found: ${sheetName}`);

    const parsed = parseWorksheetRows(worksheet, XLSX.utils, sheetName);
    const start = Math.max(page - 1, 0) * pageSize;
    const rows = parsed.rows.slice(start, start + pageSize);

    return {
      jobId,
      sheetName,
      page,
      pageSize,
      totalRows: parsed.rows.length,
      columns: getColumns(rows),
      rows,
    };
  }

  async activateImport(jobId: string, selectedSheets: string[]): Promise<ActiveDataset> {
    const state = localJobs.get(jobId);
    if (!state) throw new Error(`Import job not found: ${jobId}`);
    if (selectedSheets.length === 0) throw new Error("Selecione ao menos uma aba.");

    const job = state.job;
    updateJob(job, {
      status: "SAVING_ROWS",
      progress: progress("SAVING_ROWS", "Salvando dados", "Gravando abas selecionadas no IndexedDB.", 70),
    });

    const XLSX = await import("xlsx");
    const selectedMetadata: SheetMetadata[] = [];

    for (const sheetName of selectedSheets) {
      const worksheet = state.workbook.Sheets[sheetName];
      if (!worksheet) continue;

      const rows = parseWorksheetRows(worksheet, XLSX.utils, sheetName).rows;
      await IndexedSpreadsheetStorage.saveSheetRows(jobId, sheetName, rows);

      const formulaCount = Object.keys(worksheet).filter(key => worksheet[key]?.f).length;
      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");

      selectedMetadata.push({
        sheetName,
        rowCount: rows.length,
        columnCount: range.e.c + 1,
        formulaCount,
        storageRef: `ref_${jobId}_${sheetName}`,
        classification: "Base de dados",
        selectedForImport: true,
      });
    }

    const primarySheet = choosePrimaryDataSheet(selectedMetadata);
    if (!primarySheet) throw new Error("Nenhuma aba válida foi encontrada para ativação.");

    updateJob(job, {
      status: "PROCESSING",
      progress: progress("PROCESSING", "Gerando prévia", "Preparando ActiveDataset com prévia paginada.", 90),
    });

    const previewDatasetRows: ActiveDatasetRow[] = (await IndexedSpreadsheetStorage.getRowsPaged(jobId, primarySheet.sheetName, 0, 100)).map((row, idx) => ({
      raw: row,
      normalized: row,
      metadata: {
        rowIndex: idx + 1,
        sheetName: primarySheet.sheetName,
        fileName: state.file.name,
      },
    }));

    let workspaceId = "workspace_default";
    if (typeof localStorage !== "undefined") {
      try {
        const raw = localStorage.getItem("sauron_workspace_registry");
        if (raw) {
          const registry = JSON.parse(raw);
          if (registry.currentWorkspaceId) {
            workspaceId = registry.currentWorkspaceId;
          }
        }
      } catch {}
    }

    const activeWorkbook: ActiveWorkbookDataset = withSourceIdentity({
      datasetId: jobId,
      workbookId: jobId,
      sourceType: "SPREADSHEET_DATA",
      sourceName: state.file.name,
      importedAt: new Date().toISOString(),
      rowCount: selectedMetadata.reduce((sum, sheet) => sum + sheet.rowCount, 0),
      columnCount: primarySheet.columnCount,
      sheets: selectedMetadata,
      activeSheet: primarySheet.sheetName,
      previewRows: previewDatasetRows,
      columnProfiles: [],
      importProfile: null,
      rawStorageRef: jobId,
      formulaCount: selectedMetadata.reduce((sum, sheet) => sum + sheet.formulaCount, 0),
      status: "ACTIVE",
    } as ActiveDataset) as ActiveWorkbookDataset;
    activeWorkbook.sourceIdentity = {
      ...activeWorkbook.sourceIdentity!,
      importJobId: jobId,
      workspaceId,
      fileName: state.file.name,
      originalFileName: state.file.name,
    };

    await IndexedSpreadsheetStorage.saveMetadata(jobId, {
      id: jobId,
      fileName: state.file.name,
      sheets: selectedMetadata.map(sheet => ({
        sheetName: sheet.sheetName,
        rowCount: sheet.rowCount,
        columns: [],
        previewRows: [],
      })),
      uploadedAt: new Date().toISOString(),
    });

    updateJob(job, {
      status: "READY",
      progress: progress("READY", "Pronto", "Planilha ativada no projeto.", 100),
      activeDataset: activeWorkbook,
    });

    return activeWorkbook;
  }

  async cancelImport(jobId: string): Promise<void> {
    const state = localJobs.get(jobId);
    if (!state) return;
    updateJob(state.job, {
      status: "CANCELLED",
      progress: progress("CANCELLED", "Cancelado", "Importação local cancelada.", 100),
    });
  }
}
