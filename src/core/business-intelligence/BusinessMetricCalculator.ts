import { ModuleFieldMapping, ModuleName } from "../data/moduleMapping";
import { parseNumericValue } from "../data/activeDatasetView";
import { IndexedSpreadsheetStorage } from "../storage/IndexedSpreadsheetStorage";
import { buildMetricLineage } from "./BusinessLineage";
import { buildBusinessMetric, buildDiagnostics } from "./BusinessMetricBuilder";
import {
  BusinessIntelligenceContext,
  BusinessMetric,
  BusinessMetricLineage,
  BusinessMetricName,
  MetricRowsResult,
} from "./BusinessMetricTypes";

const DEFAULT_MAX_ROWS = 100000;

const METRIC_MODULES: Record<BusinessMetricName, ModuleName[]> = {
  totalVendido: ["Comercial"],
  totalComissao: ["Comissão"],
  quantidadeVendedores: ["Pessoas", "Comissão", "Comercial"],
  quantidadeClientes: ["Comercial"],
  quantidadeProdutos: ["Comercial"],
  ticketMedio: ["Comercial"],
  margemCandidata: ["Financeiro", "DRE", "Comercial"],
  receitaCandidata: ["DRE", "Financeiro", "Comercial"],
  custoCandidato: ["DRE", "Financeiro", "Comercial"],
};

const ROLE_PATTERNS: Record<string, RegExp[]> = {
  seller: [/vendedor/i, /consultor/i, /nome/i, /colaborador/i, /funcion/i],
  product: [/produto/i, /item/i, /pe[cç]a/i, /codigo/i, /c[oó]digo/i, /descri/i],
  client: [/cliente/i, /comprador/i, /cpf/i, /cnpj/i],
  value: [/valor/i, /venda/i, /total/i, /fatur/i, /vlr/i, /pe[cç]as/i, /bruto/i, /liquido/i, /l[ií]quido/i],
  commission: [/comiss/i],
  base: [/base/i, /valor/i, /venda/i, /total/i, /fatur/i],
  amount: [/comiss/i],
  revenue: [/receita/i, /venda/i, /fatur/i, /valor/i, /total/i],
  cost: [/custo/i, /despesa/i, /cmv/i, /cpv/i],
  margin: [/margem/i, /lucro/i, /rentabilidade/i],
};

function normalize(value: unknown): string {
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

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function mappingId(mapping: ModuleFieldMapping | null): string | null {
  return mapping ? `${mapping.projectId}:${mapping.datasetId}:${mapping.moduleName}` : null;
}

function findMapping(context: BusinessIntelligenceContext, moduleNames: ModuleName[]): ModuleFieldMapping | null {
  return moduleNames.map(moduleName => context.moduleMappings.find(mapping => mapping.moduleName === moduleName) || null).find(Boolean) || null;
}

function columnMatches(column: string, patterns: RegExp[]): boolean {
  const normalized = normalize(column);
  return patterns.some(pattern => pattern.test(column) || pattern.test(normalized));
}

function availableColumns(rows: Record<string, any>[], mapping: ModuleFieldMapping): string[] {
  const columns = new Set<string>(mapping.selectedColumns);
  rows.slice(0, 50).forEach(row => Object.keys(row).forEach(column => columns.add(column)));
  return Array.from(columns);
}

function findRoleColumn(mapping: ModuleFieldMapping, rows: Record<string, any>[], roles: string[], patterns: RegExp[]): string | null {
  for (const role of roles) {
    const semantic = mapping.semanticRoles[role];
    if (semantic) return semantic;
  }

  const selected = mapping.selectedColumns.find(column => columnMatches(column, patterns));
  if (selected) return selected;

  return availableColumns(rows, mapping).find(column => columnMatches(column, patterns)) || null;
}

async function readRows(context: BusinessIntelligenceContext, mapping: ModuleFieldMapping | null): Promise<MetricRowsResult> {
  if (!mapping) return { rows: [], strategy: "none" };
  const limit = context.maxRowsPerMetric || DEFAULT_MAX_ROWS;

  if (context.rowProvider) {
    return { rows: await context.rowProvider(mapping.sheetName, limit), strategy: "rowProvider" };
  }

  const dataset = context.activeDataset;
  if (!dataset) return { rows: [], strategy: "none" };

  if (dataset.rawStorageRef?.startsWith("api:") && typeof fetch !== "undefined") {
    const jobId = dataset.rawStorageRef.slice("api:".length);
    const baseUrl = String(((import.meta as any).env || {}).VITE_IMPORT_API_BASE_URL || "").replace(/\/$/, "");
    const params = new URLSearchParams({ sheetName: mapping.sheetName, page: "1", pageSize: String(limit) });
    try {
      const response = await fetch(`${baseUrl}/api/v1/imports/${encodeURIComponent(jobId)}/preview?${params.toString()}`);
      if (response.ok) {
        const page = await response.json();
        return { rows: Array.isArray(page?.rows) ? page.rows : [], strategy: "api" };
      }
    } catch {
      return { rows: [], strategy: "api" };
    }
  }

  if (dataset.rawStorageRef && typeof indexedDB !== "undefined") {
    const rows = await IndexedSpreadsheetStorage.getRowsPaged(dataset.rawStorageRef, mapping.sheetName, 0, limit);
    if (rows.length > 0) return { rows, strategy: "indexedDB" };
  }

  return {
    rows: dataset.previewRows
      .filter(row => normalize(row.metadata.sheetName) === normalize(mapping.sheetName))
      .map(row => row.raw)
      .slice(0, limit),
    strategy: "preview",
  };
}

function sumNumericColumn(rows: Record<string, any>[], column: string): { total: number; count: number } {
  return rows.reduce<{ total: number; count: number }>((acc, row) => {
    const value = parseNumericValue(row[column]);
    if (value === null) return acc;
    return { total: acc.total + value, count: acc.count + 1 };
  }, { total: 0, count: 0 });
}

function countDistinct(rows: Record<string, any>[], column: string): number {
  const values = new Set<string>();
  rows.forEach(row => {
    const value = compact(row[column]);
    if (value && !/^0+$/.test(value)) values.add(normalize(value));
  });
  return values.size;
}

function rulesForMetric(context: BusinessIntelligenceContext, categories: string[]): string[] {
  return (context.rules || [])
    .filter(rule => categories.includes(rule.category))
    .slice(0, 10)
    .map(rule => rule.id);
}

function pendingMetric(params: {
  metricName: BusinessMetricName;
  context: BusinessIntelligenceContext;
  moduleNames: ModuleName[];
  missingMappings: ModuleName[];
  message: string;
}): BusinessMetric {
  const lineage = buildMetricLineage({
    context: params.context,
    moduleNames: params.moduleNames,
    inputSheets: [],
    inputColumns: [],
    rowsRead: 0,
    rowsSampled: 0,
    strategy: "none",
    transformations: [params.message],
  });

  return buildBusinessMetric({
    context: params.context,
    metricName: params.metricName,
    status: "pending",
    value: null,
    moduleName: params.moduleNames[0],
    lineage,
    diagnostics: buildDiagnostics({
      confidence: 0,
      warnings: [params.message],
      missingMappings: params.missingMappings,
      calculation: "Métrica pendente por falta de mapeamento.",
    }),
  });
}

function insufficientMetric(params: {
  metricName: BusinessMetricName;
  context: BusinessIntelligenceContext;
  moduleNames: ModuleName[];
  mapping: ModuleFieldMapping;
  rows: Record<string, any>[];
  strategy: BusinessMetricLineage["rowAccess"]["strategy"];
  columnsUsed: string[];
  missingColumns?: string[];
  message: string;
}): BusinessMetric {
  const lineage = buildMetricLineage({
    context: params.context,
    moduleNames: params.moduleNames,
    inputSheets: [params.mapping.sheetName],
    inputColumns: params.columnsUsed,
    rowsRead: params.rows.length,
    rowsSampled: params.rows.length,
    strategy: params.strategy,
    transformations: [params.message],
  });

  return buildBusinessMetric({
    context: params.context,
    metricName: params.metricName,
    status: "insufficient_data",
    value: null,
    moduleName: params.mapping.moduleName,
    sheetName: params.mapping.sheetName,
    columnsUsed: params.columnsUsed,
    rowsSampled: params.rows.length,
    lineage,
    diagnostics: buildDiagnostics({
      confidence: 0.2,
      warnings: [params.message],
      missingColumns: params.missingColumns || [],
      rowsRead: params.rows.length,
      calculation: "Dados insuficientes para calcular a métrica.",
    }),
    mappingId: mappingId(params.mapping),
  });
}

function readyMetric(params: {
  metricName: BusinessMetricName;
  context: BusinessIntelligenceContext;
  moduleNames: ModuleName[];
  mapping: ModuleFieldMapping;
  value: number;
  rows: Record<string, any>[];
  strategy: BusinessMetricLineage["rowAccess"]["strategy"];
  columnsUsed: string[];
  transformations: string[];
  ruleCategories?: string[];
}): BusinessMetric {
  const ruleIds = rulesForMetric(params.context, params.ruleCategories || []);
  const lineage = buildMetricLineage({
    context: params.context,
    moduleNames: params.moduleNames,
    inputSheets: [params.mapping.sheetName],
    inputColumns: params.columnsUsed,
    rowsRead: params.rows.length,
    rowsSampled: params.rows.length,
    strategy: params.strategy,
    transformations: params.transformations,
    ruleCategories: params.ruleCategories,
  });

  return buildBusinessMetric({
    context: params.context,
    metricName: params.metricName,
    status: "ready",
    value: params.value,
    moduleName: params.mapping.moduleName,
    sheetName: params.mapping.sheetName,
    columnsUsed: params.columnsUsed,
    rowsSampled: params.rows.length,
    lineage,
    diagnostics: buildDiagnostics({
      confidence: 0.85,
      rowsRead: params.rows.length,
      calculation: params.transformations.join(" "),
    }),
    mappingId: mappingId(params.mapping),
    ruleIds,
  });
}

async function calculateSumMetric(params: {
  metricName: BusinessMetricName;
  context: BusinessIntelligenceContext;
  moduleNames: ModuleName[];
  roles: string[];
  patterns: RegExp[];
  ruleCategories: string[];
}): Promise<BusinessMetric> {
  const mapping = findMapping(params.context, params.moduleNames);
  if (!mapping) {
    return pendingMetric({
      metricName: params.metricName,
      context: params.context,
      moduleNames: params.moduleNames,
      missingMappings: params.moduleNames,
      message: `Configuração pendente: mapeie ${params.moduleNames.join(" ou ")}.`,
    });
  }

  const { rows, strategy } = await readRows(params.context, mapping);
  if (rows.length === 0) {
    return insufficientMetric({
      metricName: params.metricName,
      context: params.context,
      moduleNames: params.moduleNames,
      mapping,
      rows,
      strategy,
      columnsUsed: [],
      message: `Nenhuma linha real encontrada na aba ${mapping.sheetName}.`,
    });
  }

  const column = findRoleColumn(mapping, rows, params.roles, params.patterns);
  if (!column) {
    return insufficientMetric({
      metricName: params.metricName,
      context: params.context,
      moduleNames: params.moduleNames,
      mapping,
      rows,
      strategy,
      columnsUsed: [],
      missingColumns: params.roles,
      message: `Coluna necessária não encontrada para ${params.metricName}.`,
    });
  }

  const summary = sumNumericColumn(rows, column);
  if (summary.count === 0) {
    return insufficientMetric({
      metricName: params.metricName,
      context: params.context,
      moduleNames: params.moduleNames,
      mapping,
      rows,
      strategy,
      columnsUsed: [column],
      message: `Coluna ${column} não possui valores numéricos suficientes.`,
    });
  }

  return readyMetric({
    metricName: params.metricName,
    context: params.context,
    moduleNames: params.moduleNames,
    mapping,
    value: summary.total,
    rows,
    strategy,
    columnsUsed: [column],
    transformations: [`Soma de ${summary.count} valor(es) numéricos da coluna ${column}.`],
    ruleCategories: params.ruleCategories,
  });
}

async function calculateDistinctMetric(params: {
  metricName: BusinessMetricName;
  context: BusinessIntelligenceContext;
  moduleNames: ModuleName[];
  roles: string[];
  patterns: RegExp[];
  ruleCategories: string[];
}): Promise<BusinessMetric> {
  const mapping = findMapping(params.context, params.moduleNames);
  if (!mapping) {
    return pendingMetric({
      metricName: params.metricName,
      context: params.context,
      moduleNames: params.moduleNames,
      missingMappings: params.moduleNames,
      message: `Configuração pendente: mapeie ${params.moduleNames.join(" ou ")}.`,
    });
  }

  const { rows, strategy } = await readRows(params.context, mapping);
  const column = findRoleColumn(mapping, rows, params.roles, params.patterns);
  if (!column) {
    return insufficientMetric({
      metricName: params.metricName,
      context: params.context,
      moduleNames: params.moduleNames,
      mapping,
      rows,
      strategy,
      columnsUsed: [],
      missingColumns: params.roles,
      message: `Coluna de contagem distinta não encontrada para ${params.metricName}.`,
    });
  }

  const count = countDistinct(rows, column);
  if (count === 0) {
    return insufficientMetric({
      metricName: params.metricName,
      context: params.context,
      moduleNames: params.moduleNames,
      mapping,
      rows,
      strategy,
      columnsUsed: [column],
      message: `Coluna ${column} não possui valores distintos suficientes.`,
    });
  }

  return readyMetric({
    metricName: params.metricName,
    context: params.context,
    moduleNames: params.moduleNames,
    mapping,
    value: count,
    rows,
    strategy,
    columnsUsed: [column],
    transformations: [`Contagem distinta de valores não vazios da coluna ${column}.`],
    ruleCategories: params.ruleCategories,
  });
}

async function calculateTicketMedio(context: BusinessIntelligenceContext): Promise<BusinessMetric> {
  const mapping = findMapping(context, ["Comercial"]);
  if (!mapping) {
    return pendingMetric({
      metricName: "ticketMedio",
      context,
      moduleNames: ["Comercial"],
      missingMappings: ["Comercial"],
      message: "Configuração pendente: mapeie Comercial.",
    });
  }

  const { rows, strategy } = await readRows(context, mapping);
  const valueColumn = findRoleColumn(mapping, rows, ["value", "revenue"], ROLE_PATTERNS.value);
  if (!valueColumn) {
    return insufficientMetric({
      metricName: "ticketMedio",
      context,
      moduleNames: ["Comercial"],
      mapping,
      rows,
      strategy,
      columnsUsed: [],
      missingColumns: ["value"],
      message: "Coluna de valor não encontrada para ticket médio.",
    });
  }

  const summary = sumNumericColumn(rows, valueColumn);
  if (summary.count === 0) {
    return insufficientMetric({
      metricName: "ticketMedio",
      context,
      moduleNames: ["Comercial"],
      mapping,
      rows,
      strategy,
      columnsUsed: [valueColumn],
      message: `Coluna ${valueColumn} não possui valores numéricos suficientes.`,
    });
  }

  return readyMetric({
    metricName: "ticketMedio",
    context,
    moduleNames: ["Comercial"],
    mapping,
    value: summary.total / summary.count,
    rows,
    strategy,
    columnsUsed: [valueColumn],
    transformations: [`Soma da coluna ${valueColumn} dividida por ${summary.count} registro(s) com valor numérico.`],
    ruleCategories: ["sales", "aggregation"],
  });
}

async function calculateMargin(context: BusinessIntelligenceContext): Promise<BusinessMetric> {
  const mapping = findMapping(context, ["Financeiro", "DRE", "Comercial"]);
  if (!mapping) {
    return pendingMetric({
      metricName: "margemCandidata",
      context,
      moduleNames: ["Financeiro", "DRE", "Comercial"],
      missingMappings: ["Financeiro", "DRE", "Comercial"],
      message: "Configuração pendente: mapeie Financeiro, DRE ou Comercial.",
    });
  }

  const { rows, strategy } = await readRows(context, mapping);
  const marginColumn = findRoleColumn(mapping, rows, ["margin"], ROLE_PATTERNS.margin);
  if (marginColumn) {
    const summary = sumNumericColumn(rows, marginColumn);
    if (summary.count > 0) {
      return readyMetric({
        metricName: "margemCandidata",
        context,
        moduleNames: ["Financeiro", "DRE", "Comercial"],
        mapping,
        value: summary.total,
        rows,
        strategy,
        columnsUsed: [marginColumn],
        transformations: [`Soma de ${summary.count} valor(es) da coluna candidata de margem ${marginColumn}.`],
        ruleCategories: ["margin"],
      });
    }
  }

  const revenueColumn = findRoleColumn(mapping, rows, ["revenue", "value"], ROLE_PATTERNS.revenue);
  const costColumn = findRoleColumn(mapping, rows, ["cost", "expense"], ROLE_PATTERNS.cost);
  if (!revenueColumn || !costColumn) {
    return insufficientMetric({
      metricName: "margemCandidata",
      context,
      moduleNames: ["Financeiro", "DRE", "Comercial"],
      mapping,
      rows,
      strategy,
      columnsUsed: unique([revenueColumn, costColumn].filter((item): item is string => Boolean(item))),
      missingColumns: ["revenue", "cost"].filter((role, index) => ![revenueColumn, costColumn][index]),
      message: "Margem candidata exige coluna de margem ou receita e custo mapeados.",
    });
  }

  const revenue = sumNumericColumn(rows, revenueColumn);
  const cost = sumNumericColumn(rows, costColumn);
  if (revenue.count === 0 || cost.count === 0) {
    return insufficientMetric({
      metricName: "margemCandidata",
      context,
      moduleNames: ["Financeiro", "DRE", "Comercial"],
      mapping,
      rows,
      strategy,
      columnsUsed: [revenueColumn, costColumn],
      message: "Receita ou custo sem valores numéricos suficientes.",
    });
  }

  return readyMetric({
    metricName: "margemCandidata",
    context,
    moduleNames: ["Financeiro", "DRE", "Comercial"],
    mapping,
    value: revenue.total - cost.total,
    rows,
    strategy,
    columnsUsed: [revenueColumn, costColumn],
    transformations: [`Receita candidata (${revenueColumn}) menos custo candidato (${costColumn}).`],
    ruleCategories: ["margin"],
  });
}

export async function calculateMetric(metricName: BusinessMetricName, context: BusinessIntelligenceContext): Promise<BusinessMetric> {
  if (!context.activeDataset) {
    return pendingMetric({
      metricName,
      context,
      moduleNames: METRIC_MODULES[metricName],
      missingMappings: [],
      message: "Nenhuma fonte de dados ativa.",
    });
  }

  if (metricName === "totalVendido") {
    return calculateSumMetric({ metricName, context, moduleNames: ["Comercial"], roles: ["value", "revenue"], patterns: ROLE_PATTERNS.value, ruleCategories: ["sales", "aggregation"] });
  }
  if (metricName === "totalComissao") {
    return calculateSumMetric({ metricName, context, moduleNames: ["Comissão"], roles: ["amount", "commission"], patterns: ROLE_PATTERNS.commission, ruleCategories: ["commission"] });
  }
  if (metricName === "quantidadeVendedores") {
    return calculateDistinctMetric({ metricName, context, moduleNames: ["Pessoas", "Comissão", "Comercial"], roles: ["name", "seller", "employee"], patterns: ROLE_PATTERNS.seller, ruleCategories: ["registry", "commission"] });
  }
  if (metricName === "quantidadeClientes") {
    return calculateDistinctMetric({ metricName, context, moduleNames: ["Comercial"], roles: ["client", "customer"], patterns: ROLE_PATTERNS.client, ruleCategories: ["sales"] });
  }
  if (metricName === "quantidadeProdutos") {
    return calculateDistinctMetric({ metricName, context, moduleNames: ["Comercial"], roles: ["product"], patterns: ROLE_PATTERNS.product, ruleCategories: ["sales"] });
  }
  if (metricName === "ticketMedio") return calculateTicketMedio(context);
  if (metricName === "margemCandidata") return calculateMargin(context);
  if (metricName === "receitaCandidata") {
    return calculateSumMetric({ metricName, context, moduleNames: ["DRE", "Financeiro", "Comercial"], roles: ["revenue", "value"], patterns: ROLE_PATTERNS.revenue, ruleCategories: ["dre", "sales"] });
  }
  if (metricName === "custoCandidato") {
    return calculateSumMetric({ metricName, context, moduleNames: ["DRE", "Financeiro", "Comercial"], roles: ["cost", "expense"], patterns: ROLE_PATTERNS.cost, ruleCategories: ["dre", "margin"] });
  }

  return pendingMetric({
    metricName,
    context,
    moduleNames: METRIC_MODULES[metricName],
    missingMappings: [],
    message: `Métrica ${metricName} não implementada.`,
  });
}

export async function calculateModuleMetrics(moduleName: ModuleName, context: BusinessIntelligenceContext): Promise<BusinessMetric[]> {
  const metricsByModule: Record<ModuleName, BusinessMetricName[]> = {
    Comercial: ["totalVendido", "quantidadeClientes", "quantidadeProdutos", "ticketMedio", "receitaCandidata", "custoCandidato", "margemCandidata"],
    Pessoas: ["quantidadeVendedores"],
    Comissão: ["totalComissao", "quantidadeVendedores"],
    Financeiro: ["receitaCandidata", "custoCandidato", "margemCandidata"],
    DRE: ["receitaCandidata", "custoCandidato", "margemCandidata"],
  };

  return Promise.all((metricsByModule[moduleName] || []).map(metric => calculateMetric(metric, context)));
}
