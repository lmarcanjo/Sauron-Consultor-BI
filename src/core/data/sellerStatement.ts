import { ActiveDataset, SheetMetadata } from "../../types/dataSource";
import { IndexedSpreadsheetStorage } from "../storage/IndexedSpreadsheetStorage";
import { activeDatasetStore } from "./ActiveDatasetStore";
import { parseNumericValue, RawRow } from "./activeDatasetView";
import { getDefaultProjectId, getModuleMapping, ModuleFieldMapping } from "./moduleMapping";

export interface SellerStatementSource {
  fileName: string;
  datasetId: string;
  peopleSheetName: string | null;
  commissionSheetName: string | null;
  columnsUsed: string[];
  rowsRead: number;
}

export interface SellerStatement {
  generatedAt: string;
  sellerName: string;
  cpf: string | null;
  registration: string | null;
  department: string | null;
  store: string | null;
  period: string | null;
  totalSold: number | null;
  recordCount: number;
  commission: {
    configured: boolean;
    value: number | null;
    calculation: "amount_column" | "base_times_rate" | "not_configured";
    message: string;
  };
  managerName: string | null;
  observations: string[];
  source: SellerStatementSource;
}

export interface BuildSellerStatementOptions {
  sellerName: string;
  managerName?: string;
  commissionSheetName?: string;
  period?: string;
  unit?: string;
}

const PAGE_SIZE = 1000;
const MAX_STATEMENT_ROWS = 100000;

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function compact(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function unique(items: Array<string | null | undefined>): string[] {
  return Array.from(new Set(items.filter((item): item is string => Boolean(item))));
}

function sameSeller(a: unknown, b: unknown): boolean {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return left.length >= 4 && right.length >= 4 && (left.includes(right) || right.includes(left));
}

function columnMatches(column: string, patterns: RegExp[]): boolean {
  const normalized = normalizeText(column);
  return patterns.some(pattern => pattern.test(column) || pattern.test(normalized));
}

function findMappedColumn(mapping: ModuleFieldMapping | null, patterns: RegExp[]): string | undefined {
  return mapping?.selectedColumns.find(column => columnMatches(column, patterns));
}

function getRoleColumn(mapping: ModuleFieldMapping | null, role: string, patterns: RegExp[]): string | undefined {
  return mapping?.semanticRoles[role] || findMappedColumn(mapping, patterns);
}

function findSheetMetadata(dataset: ActiveDataset, sheetName: string): SheetMetadata | null {
  const sheet = dataset.sheets.find(item => {
    if (typeof item === "string") return normalizeText(item) === normalizeText(sheetName);
    return normalizeText(item.sheetName) === normalizeText(sheetName);
  });
  return sheet && typeof sheet !== "string" ? sheet : null;
}

async function fetchApiRows(dataset: ActiveDataset, sheetName: string, offset: number, limit: number): Promise<RawRow[]> {
  if (!dataset.rawStorageRef?.startsWith("api:") || typeof fetch === "undefined") return [];

  const jobId = dataset.rawStorageRef.slice("api:".length);
  const baseUrl = String(((import.meta as any).env || {}).VITE_IMPORT_API_BASE_URL || "").replace(/\/$/, "");
  const page = Math.floor(offset / limit) + 1;
  const params = new URLSearchParams({
    sheetName,
    page: String(page),
    pageSize: String(limit),
  });

  try {
    const response = await fetch(`${baseUrl}/api/v1/imports/${encodeURIComponent(jobId)}/preview?${params.toString()}`);
    if (!response.ok) return [];
    const preview = await response.json();
    return Array.isArray(preview?.rows) ? preview.rows : [];
  } catch {
    return [];
  }
}

async function getMappedRows(dataset: ActiveDataset, mapping: ModuleFieldMapping | null): Promise<RawRow[]> {
  if (!mapping?.sheetName) return [];

  const sheetMeta = findSheetMetadata(dataset, mapping.sheetName);
  const expectedRows = Math.min(sheetMeta?.rowCount || MAX_STATEMENT_ROWS, MAX_STATEMENT_ROWS);
  const rows: RawRow[] = [];

  for (let offset = 0; offset < expectedRows; offset += PAGE_SIZE) {
    let page: RawRow[] = [];

    if (dataset.rawStorageRef?.startsWith("api:")) {
      page = await fetchApiRows(dataset, mapping.sheetName, offset, PAGE_SIZE);
    } else if (dataset.rawStorageRef && typeof indexedDB !== "undefined") {
      page = await IndexedSpreadsheetStorage.getRowsPaged(dataset.rawStorageRef, mapping.sheetName, offset, PAGE_SIZE);
    }

    if (page.length === 0) break;
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  if (rows.length > 0) return rows;

  return dataset.previewRows
    .filter(row => normalizeText(row.metadata.sheetName) === normalizeText(mapping.sheetName))
    .map(row => row.raw);
}

function firstValue(row: RawRow | null, columns: string[]): string | null {
  if (!row) return null;
  for (const column of columns) {
    const value = compact(row[column]);
    if (value) return value;
  }
  return null;
}

function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value === "number" && Number.isFinite(value) && value > 1) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    const date = new Date(excelEpoch + value * 24 * 60 * 60 * 1000);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  const text = compact(value);
  if (!text) return null;

  const brDate = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (brDate) {
    const year = Number(brDate[3].length === 2 ? `20${brDate[3]}` : brDate[3]);
    const date = new Date(year, Number(brDate[2]) - 1, Number(brDate[1]));
    return Number.isFinite(date.getTime()) ? date : null;
  }

  const parsed = new Date(text);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function formatPeriod(rows: RawRow[], dateColumn: string | undefined): string | null {
  if (!dateColumn) return null;
  const dates = rows
    .map(row => parseDateValue(row[dateColumn]))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return null;
  const formatter = new Intl.DateTimeFormat("pt-BR");
  const first = formatter.format(dates[0]);
  const last = formatter.format(dates[dates.length - 1]);
  return first === last ? first : `${first} a ${last}`;
}

function getPeriodKey(row: RawRow, dateColumn: string | undefined): string | null {
  if (!dateColumn) return null;
  const date = parseDateValue(row[dateColumn]);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function rowMatchesFilters(row: RawRow, filters: { period?: string; unit?: string; dateColumn?: string; unitColumn?: string }): boolean {
  if (filters.period && getPeriodKey(row, filters.dateColumn) !== filters.period) return false;
  if (filters.unit && filters.unitColumn && normalizeText(row[filters.unitColumn]) !== normalizeText(filters.unit)) return false;
  return true;
}

function calculateBaseTimesRate(row: RawRow, baseColumn: string, rateColumn: string): number {
  const base = parseNumericValue(row[baseColumn]) || 0;
  const rawRate = parseNumericValue(row[rateColumn]);
  if (rawRate === null) return 0;
  const rate = rawRate > 1 ? rawRate / 100 : rawRate;
  return base * rate;
}

export async function buildSellerStatement(options: BuildSellerStatementOptions): Promise<SellerStatement> {
  const dataset = activeDatasetStore.getActiveDataset();
  if (!dataset) {
    throw new Error("Nenhuma fonte de dados ativa.");
  }

  const projectId = getDefaultProjectId(dataset);
  const peopleMapping = getModuleMapping("Pessoas", dataset.datasetId, projectId);
  const savedCommissionMapping = getModuleMapping("Comissão", dataset.datasetId, projectId);
  const commissionMapping = savedCommissionMapping && options.commissionSheetName
    ? { ...savedCommissionMapping, sheetName: options.commissionSheetName }
    : savedCommissionMapping;
  if (!peopleMapping) {
    throw new Error("Configuração pendente: mapeie o módulo Pessoas antes de gerar o resumo do vendedor.");
  }

  const peopleRows = await getMappedRows(dataset, peopleMapping);
  const peopleNameColumn = peopleMapping.semanticRoles.name ||
    peopleMapping.semanticRoles.seller ||
    peopleMapping.semanticRoles.employee ||
    peopleMapping.selectedColumns[0];
  const personRow = peopleRows.find(row => sameSeller(row[peopleNameColumn], options.sellerName)) || null;

  const commissionRows = commissionMapping ? await getMappedRows(dataset, commissionMapping) : [];
  const commissionSellerColumn = getRoleColumn(commissionMapping, "seller", [/^nome$/i, /vendedor/i, /consultor/i, /colaborador/i, /funcion/i]) ||
    commissionMapping?.selectedColumns[0];
  const baseColumn = getRoleColumn(commissionMapping, "base", [/venda/i, /fatur/i, /base/i, /valor/i]);
  const rateColumn = getRoleColumn(commissionMapping, "rate", [/percent/i, /\bperc\b/i, /taxa/i, /aproveit/i]);
  const amountColumn = getRoleColumn(commissionMapping, "amount", [/comiss/i]);
  const dateColumn = commissionMapping?.semanticRoles.date || peopleMapping.semanticRoles.date ||
    findMappedColumn(commissionMapping, [/data/i, /\bdt\b/i, /mes/i]);
  const unitColumn = getRoleColumn(commissionMapping, "unit", [/unidade/i, /loja/i, /filial/i, /empresa/i]);
  const filteredCommissionRows = commissionRows.filter(row => rowMatchesFilters(row, {
    period: options.period,
    unit: options.unit,
    dateColumn,
    unitColumn,
  }));
  const sellerCommissionRows = commissionSellerColumn
    ? filteredCommissionRows.filter(row => sameSeller(row[commissionSellerColumn], options.sellerName))
    : [];
  const rowsForStatement = sellerCommissionRows.length > 0 ? sellerCommissionRows : (personRow ? [personRow] : []);
  const totalSold = baseColumn && sellerCommissionRows.length > 0
    ? sellerCommissionRows.reduce((sum, row) => sum + (parseNumericValue(row[baseColumn]) || 0), 0)
    : null;

  let commissionValue: number | null = null;
  let calculation: SellerStatement["commission"]["calculation"] = "not_configured";
  if (amountColumn && sellerCommissionRows.length > 0) {
    commissionValue = sellerCommissionRows.reduce((sum, row) => sum + (parseNumericValue(row[amountColumn]) || 0), 0);
    calculation = "amount_column";
  } else if (baseColumn && rateColumn && sellerCommissionRows.length > 0) {
    commissionValue = sellerCommissionRows.reduce((sum, row) => sum + calculateBaseTimesRate(row, baseColumn, rateColumn), 0);
    calculation = "base_times_rate";
  }

  const observations: string[] = [];
  if (!commissionMapping) {
    observations.push("Comissão não configurada: mapeie o módulo Comissão para incluir valores no resumo.");
  } else if (calculation === "not_configured") {
    observations.push("Comissão não configurada: escolha uma coluna de comissão ou base + percentual no módulo Comissão.");
  }
  if (totalSold === null) {
    observations.push("Total vendido não configurado: escolha a coluna de base/valor de venda no módulo Comissão.");
  }
  if (sellerCommissionRows.length === 0) {
    observations.push("Nenhum registro de comissão/venda foi localizado para este vendedor na aba mapeada.");
  }

  const columnsUsed = unique([
    peopleNameColumn,
    peopleMapping.semanticRoles.cpf,
    peopleMapping.semanticRoles.registration,
    peopleMapping.semanticRoles.department,
    peopleMapping.semanticRoles.store,
    commissionSellerColumn,
    baseColumn,
    rateColumn,
    amountColumn,
    dateColumn,
  ]);

  return {
    generatedAt: new Date().toISOString(),
    sellerName: options.sellerName,
    cpf: firstValue(personRow, [peopleMapping.semanticRoles.cpf]),
    registration: firstValue(personRow, [peopleMapping.semanticRoles.registration]),
    department: firstValue(personRow, [peopleMapping.semanticRoles.department]),
    store: firstValue(personRow, [peopleMapping.semanticRoles.store]),
    period: formatPeriod(rowsForStatement, dateColumn),
    totalSold,
    recordCount: sellerCommissionRows.length || (personRow ? 1 : 0),
    commission: {
      configured: calculation !== "not_configured",
      value: commissionValue,
      calculation,
      message: calculation === "not_configured" ? "Comissão não configurada" : "Comissão calculada com dados reais mapeados.",
    },
    managerName: compact(options.managerName) || null,
    observations,
    source: {
      fileName: dataset.sourceName,
      datasetId: dataset.datasetId,
      peopleSheetName: peopleMapping.sheetName,
      commissionSheetName: commissionMapping?.sheetName || null,
      columnsUsed,
      rowsRead: peopleRows.length + commissionRows.length,
    },
  };
}
