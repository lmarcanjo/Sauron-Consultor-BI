import { activeDatasetStore } from "./ActiveDatasetStore";
import { spreadsheetStorageAdapter } from "../storage/IndexedSpreadsheetStorageAdapter";

export type RawRow = Record<string, any>;

export interface ModuleStatus {
  moduleName: string;
  hasActiveDataset: boolean;
  mapped: boolean;
  availableColumns: string[];
  matchedColumns: string[];
  missingPatterns: string[];
  message: string;
}

const TECHNICAL_COLUMNS = new Set(["__sheetName", "__sourceRowNumber"]);

const normalizeText = (value: any) => String(value ?? "").trim();

export function parseNumericValue(value: any): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = normalizeText(value);
  if (!text) return null;

  const cleaned = text
    .replace(/\s/g, "")
    .replace(/R\$/gi, "")
    .replace(/[^\d,.-]/g, "");

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  let normalized = cleaned;

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    const commaThousands = /^-?\d{1,3}(,\d{3})+$/.test(cleaned);
    normalized = commaThousands ? cleaned.replace(/,/g, "") : cleaned.replace(",", ".");
  } else if (hasDot) {
    const dotThousands = /^-?\d{1,3}(\.\d{3})+$/.test(cleaned);
    normalized = dotThousands ? cleaned.replace(/\./g, "") : cleaned;
  }

  if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getActiveRawRows(): RawRow[] {
  const rows = activeDatasetStore.getActiveRows() as RawRow[];
  if (rows.length > 0) return rows;

  const dataset = activeDatasetStore.getActiveDataset();
  return dataset ? dataset.previewRows.map(row => row.raw) : [];
}

export function getPreviewRows(limit = 20): RawRow[] {
  return getActiveRawRows().slice(0, limit);
}

/** Reads one bounded page from the active source without hydrating the store. */
export async function getActiveRowsPage(page = 0, pageSize = 100, sheetName?: string): Promise<RawRow[]> {
  const dataset = activeDatasetStore.getActiveDataset();
  if (!dataset || pageSize <= 0) return [];

  const selectedSheet = sheetName || dataset.activeSheet || (typeof dataset.sheets[0] === "string" ? dataset.sheets[0] : dataset.sheets[0]?.sheetName);
  if (!selectedSheet) return page === 0 ? getPreviewRows(pageSize) : [];

  const sourceIds = dataset.sourceDatasetIds?.length
    ? dataset.sourceDatasetIds
    : [dataset.rawStorageRef || dataset.datasetId];
  const offset = Math.max(0, page) * pageSize;
  const rows: RawRow[] = [];
  for (const sourceId of sourceIds) {
    if (!sourceId || sourceId.startsWith("api:")) continue;
    const sourceRows = await spreadsheetStorageAdapter.getRowsPaged(sourceId, selectedSheet, offset, pageSize);
    rows.push(...sourceRows);
    if (rows.length >= pageSize) break;
  }
  return rows.slice(0, pageSize);
}

export interface ActiveDistinctValuesOptions {
  limit?: number;
  pageSize?: number;
  maxRows?: number;
  signal?: AbortSignal;
}

/**
 * Produces filter options from bounded storage pages. The result is a small
 * value set, never a copy of the active records.
 */
export async function getActiveDistinctValues(column: string, options: ActiveDistinctValuesOptions = {}): Promise<string[]> {
  const dataset = activeDatasetStore.getActiveDataset();
  if (!dataset || !column) return [];

  const limit = Math.max(1, options.limit || 500);
  const pageSize = Math.max(1, Math.min(options.pageSize || 500, 1000));
  const maxRows = Math.max(pageSize, options.maxRows || dataset.rowCount || pageSize);
  const values = new Set<string>();
  let scanned = 0;
  let page = 0;

  while (scanned < maxRows && values.size < limit) {
    if (options.signal?.aborted) return Array.from(values).sort();
    const rows = await getActiveRowsPage(page, pageSize);
    if (rows.length === 0) break;
    for (const row of rows) {
      const value = row[column];
      if (value !== undefined && value !== null && String(value).trim() !== "") values.add(String(value));
      if (values.size >= limit) break;
    }
    scanned += rows.length;
    page += 1;
    if (rows.length < pageSize) break;
  }

  return Array.from(values).sort();
}

export function getActiveColumns(): string[] {
  const columns = new Set<string>();
  getPreviewRows(100).forEach(row => {
    Object.keys(row).forEach(key => {
      if (!TECHNICAL_COLUMNS.has(key)) columns.add(key);
    });
  });
  return Array.from(columns);
}

export function inferNumericColumns(rows: RawRow[]): string[] {
  const columns = new Set<string>();
  rows.slice(0, 100).forEach(row => {
    Object.entries(row).forEach(([key, value]) => {
      if (TECHNICAL_COLUMNS.has(key)) return;
      if (parseNumericValue(value) !== null) columns.add(key);
    });
  });
  return Array.from(columns);
}

export function inferTextColumns(rows: RawRow[]): string[] {
  const columns = new Set<string>();
  rows.slice(0, 100).forEach(row => {
    Object.entries(row).forEach(([key, value]) => {
      if (TECHNICAL_COLUMNS.has(key)) return;
      const text = normalizeText(value);
      if (text && parseNumericValue(value) === null) columns.add(key);
    });
  });
  return Array.from(columns);
}

export function findColumnByPatterns(columns: string[], patterns: RegExp[]): string | null {
  return columns.find(column => patterns.some(pattern => pattern.test(column))) || null;
}

export function buildModuleStatus(moduleName: string, requiredPatterns: RegExp[][]): ModuleStatus {
  const dataset = activeDatasetStore.getActiveDataset();
  const availableColumns = getActiveColumns();
  const matchedColumns: string[] = [];
  const missingPatterns: string[] = [];

  requiredPatterns.forEach(patternGroup => {
    const found = findColumnByPatterns(availableColumns, patternGroup);
    if (found) {
      matchedColumns.push(found);
    } else {
      missingPatterns.push(patternGroup.map(pattern => pattern.source).join(" ou "));
    }
  });

  const mapped = !!dataset && missingPatterns.length === 0;

  return {
    moduleName,
    hasActiveDataset: !!dataset,
    mapped,
    availableColumns,
    matchedColumns,
    missingPatterns,
    message: dataset
      ? "Fonte real ativa. Configure os campos deste módulo para gerar análises."
      : "Nenhuma fonte de dados ativa.",
  };
}

export function summarizeNumericColumns(rows: RawRow[], columns: string[], limit = 5) {
  return columns.slice(0, limit).map(column => {
    const values = rows.map(row => parseNumericValue(row[column])).filter((value): value is number => value !== null);
    const total = values.reduce((sum, value) => sum + value, 0);
    return {
      column,
      count: values.length,
      total,
      average: values.length > 0 ? total / values.length : 0,
    };
  });
}
