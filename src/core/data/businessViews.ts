import { ActiveDataset, SheetMetadata } from "../../types/dataSource";
import { IndexedSpreadsheetStorage } from "../storage/IndexedSpreadsheetStorage";
import { activeDatasetStore } from "./ActiveDatasetStore";
import { RawRow, parseNumericValue } from "./activeDatasetView";
import { getDefaultProjectId, getModuleMapping, ModuleFieldMapping, ModuleName } from "./moduleMapping";

type SheetPattern = string | RegExp;

export interface WorkbookSheetView {
  sheetName: string;
  rowCount: number;
  columnCount: number;
  formulaCount: number;
  classification: string;
  selectedForImport: boolean;
}

export interface GroupedBusinessMetric {
  label: string;
  count: number;
  total: number;
}

export interface NumericBusinessSummary {
  column: string;
  count: number;
  total: number;
  average: number;
}

export interface CommercialBusinessView {
  hasData: boolean;
  sheetName: string | null;
  rows: number;
  valueTotal: number | null;
  fieldsFound: string[];
  missingFields: string[];
  columns: {
    product: string | null;
    seller: string | null;
    client: string | null;
    value: string | null;
    date: string | null;
    category: string | null;
  };
  topProducts: GroupedBusinessMetric[];
  topSellers: GroupedBusinessMetric[];
  topClients: GroupedBusinessMetric[];
  preview: RawRow[];
  availableSheets: string[];
}

export interface PeopleBusinessView {
  hasData: boolean;
  sheetName: string | null;
  rows: number;
  totalPeople: number;
  fieldsFound: string[];
  columns: {
    name: string | null;
    seller: string | null;
    employee: string | null;
    cpf: string | null;
    registration: string | null;
    role: string | null;
    department: string | null;
    commission: string | null;
  };
  people: Array<{
    name: string;
    count: number;
    cpf?: string;
    role?: string;
    department?: string;
    commissionTotal?: number;
  }>;
  preview: RawRow[];
  availableSheets: string[];
}

export interface FinancialBusinessView {
  hasData: boolean;
  sheetName: string | null;
  rows: number;
  totalNumericValue: number;
  financialColumns: string[];
  numericColumns: string[];
  numericSummaries: NumericBusinessSummary[];
  preview: RawRow[];
  availableSheets: string[];
}

export interface DREBusinessView {
  status: "pending";
  message: string;
  candidateSheets: string[];
  candidateColumns: string[];
  financialPreview: FinancialBusinessView;
  preview: RawRow[];
}

export interface WorkbookOverview {
  totalSheets: number;
  totalRows: number;
  totalColumns: number;
  mainSheets: string[];
  formulaSheets: WorkbookSheetView[];
  dataSheets: WorkbookSheetView[];
  reportSheets: WorkbookSheetView[];
  sheets: WorkbookSheetView[];
  moduleSheets: {
    commercial: string | null;
    people: string | null;
    financial: string | null;
    pending: string | null;
    reports: string[];
  };
}

const VIEW_ROW_LIMIT = 1000;
const PREVIEW_ROW_LIMIT = 20;
const TECHNICAL_COLUMNS = new Set(["__sheetName", "__sourceRowNumber"]);

const COMMERCIAL_SHEET_PATTERNS: SheetPattern[] = [
  "IMP_VENDAS_AT",
  "IMP_VENDAS",
  "Importacao_Detalhada",
  "Importação_Detalhada",
];

const PEOPLE_SHEET_PATTERNS: SheetPattern[] = [
  "IMP_VENDEDORES",
  "Cadastros_Vendedores",
  "Cadastros_Funcionários",
  "Cadastros_Funcionarios",
  "Comissão_Vendedores",
  "Comissao_Vendedores",
];

const COMMISSION_SHEET_PATTERNS: SheetPattern[] = [
  "Comissão_Vendedores",
  "Comissao_Vendedores",
];

const PENDING_SHEET_PATTERNS: SheetPattern[] = [
  "IMP_PENDENCIAS",
  "DETALHES_PENDENCIAS",
];

const REPORT_SHEET_PATTERNS: SheetPattern[] = [
  /^RVD_/i,
  "RVD_AC",
  /^AN_/i,
  "AN_Acessórios",
  "AN_Acessorios",
];

const FINANCIAL_SHEET_PATTERNS: SheetPattern[] = [
  "IMP_VENDAS_AT",
  "IMP_VENDAS",
  /^RVD_/i,
  "RVD_AC",
  "Importacao_Detalhada",
  "Importação_Detalhada",
];

const commercialColumnPatterns = {
  product: [/produto/i, /item/i, /pe[cç]a/i, /c[oó]digo/i, /\bcod\b/i, /descri[cç][aã]o/i],
  seller: [/vendedor/i, /consultor/i, /colaborador/i],
  client: [/cliente/i, /comprador/i, /contato/i, /empresa/i, /cpf/i, /cnpj/i],
  value: [/valor/i, /venda/i, /total/i, /mercadoria/i, /fatur/i, /vlr/i, /l[ií]quido/i, /bruto/i],
  date: [/\bdata\b/i, /emiss[aã]o/i, /\bdt\b/i, /m[eê]s/i],
  category: [/marca/i, /grupo/i, /fam[ií]lia/i, /categoria/i, /departamento/i, /linha/i],
};

const peopleColumnPatterns = {
  name: [/nome/i, /colaborador/i, /funcion[aá]rio/i, /consultor/i, /vendedor/i],
  seller: [/vendedor/i, /consultor/i],
  employee: [/funcion[aá]rio/i, /colaborador/i],
  cpf: [/cpf/i],
  registration: [/matr[ií]cula/i, /\bmat\b/i, /registro/i],
  role: [/cargo/i, /fun[cç][aã]o/i],
  department: [/setor/i, /departamento/i, /equipe/i],
  commission: [/comiss/i],
};

const financialColumnPatterns = [
  /valor/i,
  /venda/i,
  /custo/i,
  /lucro/i,
  /margem/i,
  /rentabilidade/i,
  /total/i,
  /comiss/i,
  /receita/i,
  /despesa/i,
  /fatur/i,
  /vlr/i,
];

const dreExplicitPatterns = [/receita/i, /custo/i, /despesa/i, /cmv/i, /cpv/i];

function getActiveDataset(): ActiveDataset | null {
  return activeDatasetStore.getActiveDataset();
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function patternMatches(value: string, pattern: SheetPattern): boolean {
  if (pattern instanceof RegExp) {
    return pattern.test(value) || pattern.test(normalizeText(value));
  }

  const normalizedValue = normalizeText(value);
  const normalizedPattern = normalizeText(pattern);
  return normalizedValue === normalizedPattern || normalizedValue.includes(normalizedPattern);
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function stripTechnicalColumns(row: RawRow): RawRow {
  return Object.fromEntries(
    Object.entries(row).filter(([key]) => !TECHNICAL_COLUMNS.has(key))
  );
}

function stripRows(rows: RawRow[]): RawRow[] {
  return rows.map(stripTechnicalColumns);
}

function sheetToView(sheet: string | SheetMetadata, dataset: ActiveDataset): WorkbookSheetView {
  if (typeof sheet === "string") {
    const previewRows = dataset.previewRows.filter(row => normalizeText(row.metadata.sheetName) === normalizeText(sheet));
    const previewColumns = new Set<string>();
    previewRows.forEach(row => {
      Object.keys(row.raw).forEach(key => {
        if (!TECHNICAL_COLUMNS.has(key)) previewColumns.add(key);
      });
    });

    return {
      sheetName: sheet,
      rowCount: previewRows.length,
      columnCount: previewColumns.size || dataset.columnCount,
      formulaCount: 0,
      classification: "Não classificada",
      selectedForImport: true,
    };
  }

  return {
    sheetName: sheet.sheetName,
    rowCount: sheet.rowCount,
    columnCount: sheet.columnCount,
    formulaCount: sheet.formulaCount,
    classification: sheet.classification,
    selectedForImport: sheet.selectedForImport,
  };
}

function getFirstRowsForSheetFallback(dataset: ActiveDataset, sheetName: string, limit: number): RawRow[] {
  const normalizedSheetName = normalizeText(sheetName);
  const previewRows = dataset.previewRows
    .filter(row => normalizeText(row.metadata.sheetName) === normalizedSheetName)
    .map(row => row.raw)
    .slice(0, limit);

  if (previewRows.length > 0) return previewRows;

  return (activeDatasetStore.getActiveRows() as RawRow[])
    .filter(row => normalizeText(row.__sheetName || row.aba || row.nome_aba) === normalizedSheetName)
    .slice(0, limit);
}

function collectColumns(rows: RawRow[]): string[] {
  const columns = new Set<string>();
  rows.slice(0, 100).forEach(row => {
    Object.keys(row).forEach(key => {
      if (!TECHNICAL_COLUMNS.has(key)) columns.add(key);
    });
  });
  return Array.from(columns);
}

function findColumn(columns: string[], patterns: RegExp[]): string | null {
  return columns.find(column => patterns.some(pattern => pattern.test(column) || pattern.test(normalizeText(column)))) || null;
}

function numericColumnsFromRows(rows: RawRow[], columns = collectColumns(rows)): string[] {
  return columns.filter(column => {
    const checked = rows.slice(0, 100);
    const numericCount = checked.reduce((count, row) => count + (parseNumericValue(row[column]) !== null ? 1 : 0), 0);
    return numericCount > 0;
  });
}

function summarizeColumns(rows: RawRow[], columns: string[], limit = 8): NumericBusinessSummary[] {
  return columns.slice(0, limit).map(column => {
    const values = rows
      .map(row => parseNumericValue(row[column]))
      .filter((value): value is number => value !== null);
    const total = values.reduce((sum, value) => sum + value, 0);

    return {
      column,
      count: values.length,
      total,
      average: values.length > 0 ? total / values.length : 0,
    };
  }).filter(summary => summary.count > 0);
}

function rankCandidateSheets(patterns: SheetPattern[]): WorkbookSheetView[] {
  const sheets = getWorkbookSheets().filter(sheet => sheet.rowCount > 0);
  const ranked: WorkbookSheetView[] = [];

  patterns.forEach(pattern => {
    const exact = sheets.find(sheet => normalizeText(sheet.sheetName) === normalizeText(String(pattern)));
    if (exact && !ranked.some(sheet => sheet.sheetName === exact.sheetName)) ranked.push(exact);

    const partial = sheets.find(sheet => patternMatches(sheet.sheetName, pattern));
    if (partial && !ranked.some(sheet => sheet.sheetName === partial.sheetName)) ranked.push(partial);
  });

  sheets.forEach(sheet => {
    if (!ranked.some(existing => existing.sheetName === sheet.sheetName)) ranked.push(sheet);
  });

  return ranked;
}

function getMatchedFields<T extends Record<string, string | null>>(columns: T): string[] {
  return Object.values(columns).filter((column): column is string => !!column);
}

function getActiveModuleMapping(moduleName: ModuleName): ModuleFieldMapping | null {
  const dataset = getActiveDataset();
  if (!dataset) return null;
  return getModuleMapping(moduleName, dataset.datasetId, getDefaultProjectId(dataset));
}

function getMappedColumns(mapping: ModuleFieldMapping | null, detectedColumns: string[]): string[] {
  if (!mapping) return detectedColumns;
  const available = new Set(detectedColumns);
  const selected = mapping.selectedColumns.filter(column => available.has(column));
  return selected.length > 0 ? selected : detectedColumns;
}

function getMappedRoleColumn(
  mapping: ModuleFieldMapping | null,
  role: string,
  columns: string[],
  patterns: RegExp[],
): string | null {
  const mappedColumn = mapping?.semanticRoles?.[role];
  if (mappedColumn && columns.includes(mappedColumn)) return mappedColumn;
  return findColumn(columns, patterns);
}

function pickColumns(row: RawRow, columns: string[]): RawRow {
  if (columns.length === 0) return stripTechnicalColumns(row);
  return Object.fromEntries(columns.map(column => [column, row[column]]));
}

function pickRows(rows: RawRow[], columns: string[]): RawRow[] {
  return rows.map(row => pickColumns(row, columns));
}

async function getApiPreviewRows(rawStorageRef: string, sheetName: string, limit: number): Promise<RawRow[]> {
  if (!rawStorageRef.startsWith("api:")) return [];
  const jobId = rawStorageRef.slice("api:".length);
  if (!jobId || typeof fetch === "undefined") return [];

  const baseUrl = String(((import.meta as any).env || {}).VITE_IMPORT_API_BASE_URL || "").replace(/\/$/, "");
  const params = new URLSearchParams({
    sheetName,
    page: "1",
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

function buildTopList(rows: RawRow[], labelColumn: string | null, valueColumn: string | null, limit = 8): GroupedBusinessMetric[] {
  if (!labelColumn) return [];

  const grouped = new Map<string, GroupedBusinessMetric>();
  rows.forEach(row => {
    const label = String(row[labelColumn] ?? "").trim();
    if (!label) return;

    const current = grouped.get(label) || { label, count: 0, total: 0 };
    current.count += 1;
    if (valueColumn) {
      current.total += parseNumericValue(row[valueColumn]) || 0;
    }
    grouped.set(label, current);
  });

  return Array.from(grouped.values())
    .sort((a, b) => {
      if (valueColumn && b.total !== a.total) return b.total - a.total;
      return b.count - a.count;
    })
    .slice(0, limit);
}

export function getWorkbookSheets(): WorkbookSheetView[] {
  const dataset = getActiveDataset();
  if (!dataset) return [];
  return dataset.sheets.map(sheet => sheetToView(sheet, dataset));
}

export async function getSheetRows(sheetName: string, limit = VIEW_ROW_LIMIT): Promise<RawRow[]> {
  const dataset = getActiveDataset();
  if (!dataset || !sheetName) return [];

  if (dataset.rawStorageRef?.startsWith("api:")) {
    const rows = await getApiPreviewRows(dataset.rawStorageRef, sheetName, limit);
    if (rows.length > 0) return rows;
  }

  if (typeof indexedDB !== "undefined") {
    const sourceIds = dataset.sourceDatasetIds?.length
      ? dataset.sourceDatasetIds
      : [dataset.rawStorageRef];
    const rows: RawRow[] = [];
    for (const sourceId of sourceIds) {
      if (!sourceId || sourceId.startsWith("api:")) continue;
      const remaining = Math.max(limit - rows.length, 0);
      if (remaining === 0) break;
      rows.push(...await IndexedSpreadsheetStorage.getRowsPaged(sourceId, sheetName, 0, remaining));
    }
    if (rows.length > 0) return rows.slice(0, limit);
  }

  return getFirstRowsForSheetFallback(dataset, sheetName, limit);
}

export function findBestSheet(patterns: SheetPattern[]): WorkbookSheetView | null {
  return rankCandidateSheets(patterns)[0] || null;
}

export async function buildCommercialView(): Promise<CommercialBusinessView> {
  const availableSheets = getWorkbookSheets().map(sheet => sheet.sheetName);
  const mapping = getActiveModuleMapping("Comercial");
  const candidateSheets = mapping
    ? rankCandidateSheets([mapping.sheetName]).filter(sheet => normalizeText(sheet.sheetName) === normalizeText(mapping.sheetName)).slice(0, 1)
    : rankCandidateSheets(COMMERCIAL_SHEET_PATTERNS).slice(0, 8);
  let bestView: CommercialBusinessView | null = null;
  let bestScore = -1;

  for (const sheet of candidateSheets) {
    const rows = await getSheetRows(sheet.sheetName);
    const detectedColumns = collectColumns(rows);
    const columns = getMappedColumns(mapping, detectedColumns);
    const detected = {
      product: getMappedRoleColumn(mapping, "product", columns, commercialColumnPatterns.product),
      seller: getMappedRoleColumn(mapping, "seller", columns, commercialColumnPatterns.seller),
      client: getMappedRoleColumn(mapping, "client", columns, commercialColumnPatterns.client),
      value: getMappedRoleColumn(mapping, "value", columns, commercialColumnPatterns.value),
      date: getMappedRoleColumn(mapping, "date", columns, commercialColumnPatterns.date),
      category: getMappedRoleColumn(mapping, "category", columns, commercialColumnPatterns.category),
    };
    const fieldsFound = unique([...getMatchedFields(detected), ...(mapping ? columns : [])]);
    const score = fieldsFound.length + (detected.value ? 2 : 0) + (detected.product || detected.seller ? 1 : 0) + (mapping ? 10 : 0);
    const valueTotal = detected.value
      ? rows.reduce((sum, row) => sum + (parseNumericValue(row[detected.value as string]) || 0), 0)
      : null;

    const view: CommercialBusinessView = {
      hasData: mapping ? rows.length > 0 && columns.length > 0 : fieldsFound.length > 0,
      sheetName: sheet.sheetName,
      rows: sheet.rowCount || rows.length,
      valueTotal,
      fieldsFound,
      missingFields: Object.entries(detected)
        .filter(([, column]) => !column)
        .map(([field]) => field),
      columns: detected,
      topProducts: buildTopList(rows, detected.product, detected.value),
      topSellers: buildTopList(rows, detected.seller, detected.value),
      topClients: buildTopList(rows, detected.client, detected.value),
      preview: mapping ? pickRows(rows.slice(0, PREVIEW_ROW_LIMIT), columns) : stripRows(rows.slice(0, PREVIEW_ROW_LIMIT)),
      availableSheets,
    };

    if (score > bestScore) {
      bestScore = score;
      bestView = view;
    }
  }

  return bestView || {
    hasData: false,
    sheetName: null,
    rows: 0,
    valueTotal: null,
    fieldsFound: [],
    missingFields: Object.keys(commercialColumnPatterns),
    columns: { product: null, seller: null, client: null, value: null, date: null, category: null },
    topProducts: [],
    topSellers: [],
    topClients: [],
    preview: [],
    availableSheets,
  };
}

export async function buildPeopleView(): Promise<PeopleBusinessView> {
  const availableSheets = getWorkbookSheets().map(sheet => sheet.sheetName);
  const mapping = getActiveModuleMapping("Pessoas");
  const candidateSheets = mapping
    ? rankCandidateSheets([mapping.sheetName]).filter(sheet => normalizeText(sheet.sheetName) === normalizeText(mapping.sheetName)).slice(0, 1)
    : rankCandidateSheets([...PEOPLE_SHEET_PATTERNS, ...COMMISSION_SHEET_PATTERNS]).slice(0, 8);
  let bestView: PeopleBusinessView | null = null;
  let bestScore = -1;

  for (const sheet of candidateSheets) {
    const rows = await getSheetRows(sheet.sheetName);
    const detectedColumns = collectColumns(rows);
    const columns = getMappedColumns(mapping, detectedColumns);
    const detected = {
      name: getMappedRoleColumn(mapping, "name", columns, peopleColumnPatterns.name),
      seller: getMappedRoleColumn(mapping, "seller", columns, peopleColumnPatterns.seller),
      employee: getMappedRoleColumn(mapping, "employee", columns, peopleColumnPatterns.employee),
      cpf: getMappedRoleColumn(mapping, "cpf", columns, peopleColumnPatterns.cpf),
      registration: getMappedRoleColumn(mapping, "registration", columns, peopleColumnPatterns.registration),
      role: getMappedRoleColumn(mapping, "role", columns, peopleColumnPatterns.role),
      department: getMappedRoleColumn(mapping, "department", columns, peopleColumnPatterns.department),
      commission: getMappedRoleColumn(mapping, "commission", columns, peopleColumnPatterns.commission),
    };
    const keyColumn = detected.name || detected.seller || detected.employee || detected.cpf || (mapping ? columns[0] : null);
    const peopleMap = new Map<string, {
      name: string;
      count: number;
      cpf?: string;
      role?: string;
      department?: string;
      commissionTotal?: number;
    }>();

    if (keyColumn) {
      rows.forEach(row => {
        const name = String(row[keyColumn] ?? "").trim();
        if (!name) return;

        const current = peopleMap.get(name) || { name, count: 0, commissionTotal: 0 };
        current.count += 1;
        if (!current.cpf && detected.cpf) {
          const cpf = String(row[detected.cpf] ?? "").trim();
          if (cpf) current.cpf = cpf;
        }
        if (!current.role && detected.role) {
          const role = String(row[detected.role] ?? "").trim();
          if (role) current.role = role;
        }
        if (!current.department && detected.department) {
          const department = String(row[detected.department] ?? "").trim();
          if (department) current.department = department;
        }
        if (detected.commission) current.commissionTotal = (current.commissionTotal || 0) + (parseNumericValue(row[detected.commission]) || 0);
        peopleMap.set(name, current);
      });
    }

    const fieldsFound = unique([...getMatchedFields(detected), ...(mapping ? columns : [])]);
    const people = Array.from(peopleMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 100);
    const score = fieldsFound.length + people.length + (mapping ? 10 : 0);

    const view: PeopleBusinessView = {
      hasData: people.length > 0,
      sheetName: sheet.sheetName,
      rows: sheet.rowCount || rows.length,
      totalPeople: people.length,
      fieldsFound,
      columns: detected,
      people,
      preview: mapping ? pickRows(rows.slice(0, PREVIEW_ROW_LIMIT), columns) : stripRows(rows.slice(0, PREVIEW_ROW_LIMIT)),
      availableSheets,
    };

    if (score > bestScore) {
      bestScore = score;
      bestView = view;
    }
  }

  return bestView || {
    hasData: false,
    sheetName: null,
    rows: 0,
    totalPeople: 0,
    fieldsFound: [],
    columns: { name: null, seller: null, employee: null, cpf: null, registration: null, role: null, department: null, commission: null },
    people: [],
    preview: [],
    availableSheets,
  };
}

export async function buildFinancialView(): Promise<FinancialBusinessView> {
  const availableSheets = getWorkbookSheets().map(sheet => sheet.sheetName);
  const mapping = getActiveModuleMapping("Financeiro");
  const candidateSheets = mapping
    ? rankCandidateSheets([mapping.sheetName]).filter(sheet => normalizeText(sheet.sheetName) === normalizeText(mapping.sheetName)).slice(0, 1)
    : rankCandidateSheets(FINANCIAL_SHEET_PATTERNS).slice(0, 8);
  let bestView: FinancialBusinessView | null = null;
  let bestScore = -1;

  for (const sheet of candidateSheets) {
    const rows = await getSheetRows(sheet.sheetName);
    const detectedColumns = collectColumns(rows);
    const columns = getMappedColumns(mapping, detectedColumns);
    const numericColumns = numericColumnsFromRows(rows, columns);
    const mappedFinancialColumns = mapping
      ? unique(Object.values(mapping.semanticRoles).filter(column => numericColumns.includes(column)))
      : [];
    const financialColumns = mappedFinancialColumns.length > 0
      ? mappedFinancialColumns
      : numericColumns.filter(column => financialColumnPatterns.some(pattern => pattern.test(column) || pattern.test(normalizeText(column))));
    const columnsToSummarize = financialColumns.length > 0 ? financialColumns : numericColumns;
    const numericSummaries = summarizeColumns(rows, columnsToSummarize, 10);
    const totalNumericValue = numericSummaries.reduce((sum, item) => sum + item.total, 0);
    const score = numericSummaries.length + financialColumns.length * 2 + (mapping ? 10 : 0);

    const view: FinancialBusinessView = {
      hasData: mapping ? rows.length > 0 && columns.length > 0 : numericSummaries.length > 0,
      sheetName: sheet.sheetName,
      rows: sheet.rowCount || rows.length,
      totalNumericValue,
      financialColumns,
      numericColumns,
      numericSummaries,
      preview: mapping ? pickRows(rows.slice(0, PREVIEW_ROW_LIMIT), columns) : stripRows(rows.slice(0, PREVIEW_ROW_LIMIT)),
      availableSheets,
    };

    if (score > bestScore) {
      bestScore = score;
      bestView = view;
    }
  }

  return bestView || {
    hasData: false,
    sheetName: null,
    rows: 0,
    totalNumericValue: 0,
    financialColumns: [],
    numericColumns: [],
    numericSummaries: [],
    preview: [],
    availableSheets,
  };
}

export async function buildDREView(): Promise<DREBusinessView> {
  const financialPreview = await buildFinancialView();
  const mapping = getActiveModuleMapping("DRE");

  if (mapping) {
    const rows = await getSheetRows(mapping.sheetName);
    const detectedColumns = collectColumns(rows);
    const selectedColumns = getMappedColumns(mapping, detectedColumns);
    const candidateColumns = selectedColumns.length > 0 ? selectedColumns : unique([
      ...Object.values(mapping.semanticRoles),
      ...financialPreview.financialColumns,
      ...financialPreview.numericColumns,
    ]);
    const hasExplicitDreRoles = ["revenue", "cost", "expense"].some(role => Boolean(mapping.semanticRoles[role]));

    return {
      status: "pending",
      message: hasExplicitDreRoles
        ? "Mapeamento salvo. Revise os papéis de Receita, Custo e Despesa antes de fechar o DRE."
        : "Configuração pendente: escolha explicitamente quais colunas representam Receita, Custo e Despesa.",
      candidateSheets: [mapping.sheetName],
      candidateColumns,
      financialPreview,
      preview: pickRows(rows.slice(0, PREVIEW_ROW_LIMIT), selectedColumns),
    };
  }

  const candidateSheets = rankCandidateSheets(FINANCIAL_SHEET_PATTERNS)
    .slice(0, 8)
    .map(sheet => sheet.sheetName);
  const candidateColumns = unique([
    ...financialPreview.financialColumns,
    ...financialPreview.numericColumns.filter(column => dreExplicitPatterns.some(pattern => pattern.test(column) || pattern.test(normalizeText(column)))),
    ...financialPreview.numericSummaries.map(summary => summary.column),
  ]);

  return {
    status: "pending",
    message: "Configuração pendente: escolha explicitamente quais colunas representam Receita, Custo e Despesa.",
    candidateSheets,
    candidateColumns,
    financialPreview,
    preview: financialPreview.preview,
  };
}

export function buildWorkbookOverview(): WorkbookOverview {
  const dataset = getActiveDataset();
  const sheets = getWorkbookSheets();
  const commercialSheet = findBestSheet(COMMERCIAL_SHEET_PATTERNS);
  const peopleSheet = findBestSheet(PEOPLE_SHEET_PATTERNS);
  const financialSheet = findBestSheet(FINANCIAL_SHEET_PATTERNS);
  const pendingSheet = findBestSheet(PENDING_SHEET_PATTERNS);
  const reports = rankCandidateSheets(REPORT_SHEET_PATTERNS)
    .filter(sheet => REPORT_SHEET_PATTERNS.some(pattern => patternMatches(sheet.sheetName, pattern)))
    .map(sheet => sheet.sheetName);

  const formulaSheets = sheets.filter(sheet => sheet.formulaCount > 0 || normalizeText(sheet.classification).includes("formula"));
  const reportSheets = sheets.filter(sheet => normalizeText(sheet.classification).includes("relatorio") || reports.includes(sheet.sheetName));
  const dataSheets = sheets.filter(sheet => {
    const normalizedClass = normalizeText(sheet.classification);
    const normalizedName = normalizeText(sheet.sheetName);
    return normalizedClass.includes("base") ||
      normalizedClass.includes("cadastro") ||
      normalizedName.startsWith("imp_") ||
      normalizedName.includes("cadastro");
  });

  const mainSheets = unique([
    commercialSheet?.sheetName,
    peopleSheet?.sheetName,
    financialSheet?.sheetName,
    pendingSheet?.sheetName,
    ...reports.slice(0, 3),
  ].filter((sheetName): sheetName is string => !!sheetName));

  return {
    totalSheets: sheets.length,
    totalRows: dataset?.rowCount || sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0),
    totalColumns: sheets.reduce((sum, sheet) => sum + sheet.columnCount, 0),
    mainSheets,
    formulaSheets,
    dataSheets,
    reportSheets,
    sheets,
    moduleSheets: {
      commercial: commercialSheet?.sheetName || null,
      people: peopleSheet?.sheetName || null,
      financial: financialSheet?.sheetName || null,
      pending: pendingSheet?.sheetName || null,
      reports,
    },
  };
}
