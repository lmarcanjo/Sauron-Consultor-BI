import { getSheetRows, getWorkbookSheets } from "./businessViews";
import { activeDatasetStore } from "./ActiveDatasetStore";
import { parseNumericValue, RawRow } from "./activeDatasetView";
import { getDefaultProjectId, getModuleMapping, ModuleFieldMapping } from "./moduleMapping";
import { buildSellerStatement, SellerStatement } from "./sellerStatement";

export interface CommissionMappingValidation {
  hasActiveDataset: boolean;
  isReady: boolean;
  peopleMapping: ModuleFieldMapping | null;
  commissionMapping: ModuleFieldMapping | null;
  availableCommissionSheets: string[];
  missing: string[];
  message: string;
}

export interface CommissionSeller {
  name: string;
  unit: string | null;
  period: string | null;
  recordCount: number;
  totalSold: number | null;
  commission: number | null;
  hasCommissionRule: boolean;
  incomplete: boolean;
}

export interface CommissionClosingFilters {
  commissionSheetName?: string;
  period?: string;
  unit?: string;
  managerName?: string;
}

export interface CommissionClosingTotals {
  sellerCount: number;
  totalSold: number;
  totalCommission: number;
  sellersWithoutRule: number;
  sellersWithIncompleteData: number;
}

export interface CommissionBatchResult {
  statements: SellerStatement[];
  totals: CommissionClosingTotals;
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function compact(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text ? text : null;
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

function getPeriodKey(row: RawRow, dateColumn: string | undefined): string | null {
  if (!dateColumn) return null;
  const date = parseDateValue(row[dateColumn]);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function rowMatchesFilters(row: RawRow, filters: CommissionClosingFilters, dateColumn?: string, unitColumn?: string): boolean {
  if (filters.period && getPeriodKey(row, dateColumn) !== filters.period) return false;
  if (filters.unit && unitColumn && normalizeText(row[unitColumn]) !== normalizeText(filters.unit)) return false;
  return true;
}

function resolveCommissionMapping(filters: CommissionClosingFilters, mapping: ModuleFieldMapping | null): ModuleFieldMapping | null {
  if (!mapping) return null;
  return filters.commissionSheetName ? { ...mapping, sheetName: filters.commissionSheetName } : mapping;
}

function getCommissionColumns(mapping: ModuleFieldMapping | null) {
  return {
    seller: getRoleColumn(mapping, "seller", [/^nome$/i, /vendedor/i, /consultor/i, /colaborador/i, /funcion/i]) || mapping?.selectedColumns[0],
    base: getRoleColumn(mapping, "base", [/venda/i, /fatur/i, /base/i, /valor/i]),
    amount: getRoleColumn(mapping, "amount", [/comiss/i]),
    unit: getRoleColumn(mapping, "unit", [/unidade/i, /loja/i, /filial/i, /empresa/i]),
    date: getRoleColumn(mapping, "date", [/data/i, /\bdt\b/i, /mes/i]),
  };
}

export function validateCommissionMappings(): CommissionMappingValidation {
  const dataset = activeDatasetStore.getActiveDataset();
  const availableCommissionSheets = getWorkbookSheets()
    .map(sheet => sheet.sheetName)
    .filter(sheetName => /comiss|vendedor/i.test(sheetName));

  if (!dataset) {
    return {
      hasActiveDataset: false,
      isReady: false,
      peopleMapping: null,
      commissionMapping: null,
      availableCommissionSheets,
      missing: ["ActiveDataset"],
      message: "Nenhuma fonte de dados ativa.",
    };
  }

  const projectId = getDefaultProjectId(dataset);
  const peopleMapping = getModuleMapping("Pessoas", dataset.datasetId, projectId);
  const commissionMapping = getModuleMapping("Comissão", dataset.datasetId, projectId);
  const missing: string[] = [];
  if (!peopleMapping) missing.push("Pessoas");
  if (!commissionMapping) missing.push("Comissão");

  return {
    hasActiveDataset: true,
    isReady: missing.length === 0,
    peopleMapping,
    commissionMapping,
    availableCommissionSheets,
    missing,
    message: missing.length === 0
      ? "Mapeamentos de Pessoas e Comissão prontos."
      : `Configuração pendente: configure ${missing.join(" e ")}.`,
  };
}

export async function listCommissionSellers(filters: CommissionClosingFilters = {}): Promise<CommissionSeller[]> {
  const validation = validateCommissionMappings();
  const commissionMapping = resolveCommissionMapping(filters, validation.commissionMapping);
  if (!validation.isReady || !commissionMapping) return [];

  const rows = await getSheetRows(commissionMapping.sheetName, 100000);
  const columns = getCommissionColumns(commissionMapping);
  if (!columns.seller) return [];

  const grouped = new Map<string, CommissionSeller>();
  rows
    .filter(row => rowMatchesFilters(row, filters, columns.date, columns.unit))
    .forEach(row => {
      const sellerName = compact(row[columns.seller as string]);
      if (!sellerName || /^0+$/.test(sellerName)) return;

      const current = grouped.get(sellerName) || {
        name: sellerName,
        unit: columns.unit ? compact(row[columns.unit]) : null,
        period: getPeriodKey(row, columns.date),
        recordCount: 0,
        totalSold: columns.base ? 0 : null,
        commission: columns.amount ? 0 : null,
        hasCommissionRule: Boolean(columns.amount),
        incomplete: false,
      };

      current.recordCount += 1;
      if (!current.unit && columns.unit) current.unit = compact(row[columns.unit]);
      if (!current.period) current.period = getPeriodKey(row, columns.date);
      if (columns.base) current.totalSold = (current.totalSold || 0) + (parseNumericValue(row[columns.base]) || 0);
      if (columns.amount) current.commission = (current.commission || 0) + (parseNumericValue(row[columns.amount]) || 0);
      current.incomplete = current.totalSold === null || !current.hasCommissionRule;
      grouped.set(sellerName, current);
    });

  return Array.from(grouped.values())
    .sort((a, b) => {
      const totalDiff = (b.totalSold || 0) - (a.totalSold || 0);
      return totalDiff !== 0 ? totalDiff : a.name.localeCompare(b.name);
    });
}

export async function generateSellerStatementsBatch(
  sellerNames?: string[],
  filters: CommissionClosingFilters = {},
): Promise<CommissionBatchResult> {
  const sellers = sellerNames && sellerNames.length > 0
    ? sellerNames
    : (await listCommissionSellers(filters)).map(seller => seller.name);

  const statements = await Promise.all(sellers.map(sellerName => buildSellerStatement({
    sellerName,
    managerName: filters.managerName,
    commissionSheetName: filters.commissionSheetName,
    period: filters.period,
    unit: filters.unit,
  })));

  return {
    statements,
    totals: calculateClosingTotals(statements),
  };
}

export function calculateClosingTotals(statements: SellerStatement[]): CommissionClosingTotals {
  return {
    sellerCount: statements.length,
    totalSold: statements.reduce((sum, statement) => sum + (statement.totalSold || 0), 0),
    totalCommission: statements.reduce((sum, statement) => sum + (statement.commission.value || 0), 0),
    sellersWithoutRule: statements.filter(statement => !statement.commission.configured).length,
    sellersWithIncompleteData: statements.filter(statement => (
      statement.totalSold === null ||
      statement.recordCount === 0 ||
      statement.observations.some(observation => /não configurad|não foi localizado/i.test(observation))
    )).length,
  };
}

export function calculateCommissionSellerTotals(sellers: CommissionSeller[]): CommissionClosingTotals {
  return {
    sellerCount: sellers.length,
    totalSold: sellers.reduce((sum, seller) => sum + (seller.totalSold || 0), 0),
    totalCommission: sellers.reduce((sum, seller) => sum + (seller.commission || 0), 0),
    sellersWithoutRule: sellers.filter(seller => !seller.hasCommissionRule).length,
    sellersWithIncompleteData: sellers.filter(seller => seller.incomplete).length,
  };
}

export function getCommissionClosingFilterOptions(sellers: CommissionSeller[]) {
  return {
    periods: unique(sellers.map(seller => seller.period).filter((period): period is string => Boolean(period))),
    units: unique(sellers.map(seller => seller.unit).filter((unit): unit is string => Boolean(unit))),
  };
}
