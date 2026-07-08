import { buildMetricInsights } from "../business-intelligence/BusinessInsightEngine";
import { BusinessIntelligenceEngine, BusinessMetric, BusinessMetricName } from "../business-intelligence";
import { parseNumericValue } from "../data/activeDatasetView";
import { ModuleFieldMapping, ModuleName } from "../data/moduleMapping";
import { IndexedSpreadsheetStorage } from "../storage/IndexedSpreadsheetStorage";
import { buildMetricCardBlock, buildPendingConfigBlock, buildRankingBlock, buildTableBlock, formatDashboardValue, buildInsightBlock } from "./DashboardBlockBuilder";
import { buildDashboardDiagnostics } from "./DashboardDiagnostics";
import { buildBlockLineageFromMapping, emptyDashboardLineage, explainDashboardBlock as explainBlock, getDashboardLineage as getBlockLineage } from "./DashboardLineage";
import { DashboardBlock, DashboardBlockExplanation, DashboardEngineContext, DashboardLineage, ExecutiveDashboard } from "./DashboardTypes";

const EXECUTIVE_METRICS: BusinessMetricName[] = [
  "totalVendido",
  "totalComissao",
  "quantidadeVendedores",
  "ticketMedio",
];

const ROLE_PATTERNS: Record<string, RegExp[]> = {
  seller: [/vendedor/i, /consultor/i, /nome/i, /colaborador/i, /funcion/i],
  name: [/nome/i, /vendedor/i, /consultor/i, /colaborador/i, /funcion/i],
  product: [/produto/i, /item/i, /pe[cç]a/i, /c[oó]digo/i, /descri/i],
  client: [/cliente/i, /comprador/i, /cpf/i, /cnpj/i, /unidade/i],
  department: [/setor/i, /departamento/i, /equipe/i],
  store: [/loja/i, /unidade/i, /filial/i, /empresa/i],
  value: [/valor/i, /venda/i, /total/i, /fatur/i, /vlr/i, /bruto/i, /l[ií]quido/i],
  commission: [/comiss/i],
};

const blockRegistry = new Map<string, DashboardBlock>();

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

function findMapping(context: DashboardEngineContext, moduleName: ModuleName): ModuleFieldMapping | null {
  return context.moduleMappings.find(mapping => mapping.moduleName === moduleName) || null;
}

function availableColumns(rows: Record<string, unknown>[], mapping: ModuleFieldMapping | null): string[] {
  const columns = new Set<string>(mapping?.selectedColumns || []);
  rows.slice(0, 50).forEach(row => Object.keys(row).forEach(column => columns.add(column)));
  return Array.from(columns);
}

function roleColumn(mapping: ModuleFieldMapping | null, rows: Record<string, unknown>[], roles: string[]): string | null {
  for (const role of roles) {
    const mapped = mapping?.semanticRoles?.[role];
    if (mapped) return mapped;
  }

  const columns = availableColumns(rows, mapping);
  for (const role of roles) {
    const patterns = ROLE_PATTERNS[role] || [];
    const selected = mapping?.selectedColumns.find(column => patterns.some(pattern => pattern.test(column) || pattern.test(normalize(column))));
    if (selected) return selected;
    const detected = columns.find(column => patterns.some(pattern => pattern.test(column) || pattern.test(normalize(column))));
    if (detected) return detected;
  }

  return null;
}

async function readRows(context: DashboardEngineContext, mapping: ModuleFieldMapping | null, limit = 1000): Promise<{
  rows: Record<string, unknown>[];
  strategy: DashboardLineage["rowAccess"]["strategy"];
}> {
  if (!mapping) return { rows: [], strategy: "none" };

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

async function calculateMetrics(context: DashboardEngineContext, metricNames: BusinessMetricName[]): Promise<BusinessMetric[]> {
  const engine = new BusinessIntelligenceEngine(context);
  const metrics: BusinessMetric[] = [];
  for (const metricName of metricNames) {
    metrics.push(await engine.calculateMetric(metricName));
  }
  return metrics;
}

async function calculateModuleMetrics(context: DashboardEngineContext, moduleName: ModuleName): Promise<BusinessMetric[]> {
  const engine = new BusinessIntelligenceEngine(context);
  return engine.calculateModuleMetrics(moduleName);
}

function metricBlocks(metrics: BusinessMetric[], context: DashboardEngineContext): DashboardBlock[] {
  return metrics.map(metric => buildMetricCardBlock(metric, context));
}

function pendingBlocksFromMetrics(moduleName: ModuleName | "Executive", metrics: BusinessMetric[], context: DashboardEngineContext): DashboardBlock[] {
  return metrics
    .filter(metric => metric.status !== "ready")
    .slice(0, 2)
    .map(metric => buildPendingConfigBlock({
      id: `dashboard-block:pending:${context.activeDataset?.datasetId || "no-dataset"}:${moduleName}:${metric.name}`,
      title: `${metric.label}: configuração pendente`,
      context,
      moduleName,
      message: metric.diagnostics.warnings[0] || "Fonte real ativa. Configure os campos deste módulo para gerar análises.",
      requiredMappings: metric.diagnostics.missingMappings,
      requiredColumns: metric.diagnostics.missingColumns,
      sourceMetrics: [metric],
    }));
}

function insightBlocks(metrics: BusinessMetric[], context: DashboardEngineContext, moduleName: ModuleName | "Executive"): DashboardBlock[] {
  return buildMetricInsights(metrics).slice(0, 3).map((insight, index) => {
    const sourceMetrics = metrics.filter(metric => metric.id === insight.metricId);
    return buildInsightBlock({
      id: `dashboard-block:insight:${context.activeDataset?.datasetId || "no-dataset"}:${moduleName}:${index}`,
      title: "Insight auditável",
      context,
      data: insight,
      sourceMetrics,
    });
  });
}

function buildRankingItems(rows: Record<string, unknown>[], labelColumn: string | null, valueColumn: string | null): {
  items: Array<{ label: string; count: number; value: number | null; formattedValue?: string | null; sourceRowCount: number }>;
  columns: string[];
} {
  if (!labelColumn) return { items: [], columns: [] };

  const grouped = new Map<string, { label: string; count: number; value: number; sourceRowCount: number }>();
  rows.forEach(row => {
    const label = compact(row[labelColumn]);
    if (!label) return;

    const key = normalize(label);
    const current = grouped.get(key) || { label, count: 0, value: 0, sourceRowCount: 0 };
    current.count += 1;
    current.sourceRowCount += 1;
    if (valueColumn) current.value += parseNumericValue(row[valueColumn]) || 0;
    grouped.set(key, current);
  });

  return {
    items: Array.from(grouped.values())
      .sort((a, b) => valueColumn && b.value !== a.value ? b.value - a.value : b.count - a.count)
      .slice(0, 10)
      .map(item => ({
        label: item.label,
        count: item.count,
        value: valueColumn ? item.value : null,
        formattedValue: valueColumn ? formatDashboardValue(item.value, "currency") : null,
        sourceRowCount: item.sourceRowCount,
      })),
    columns: [labelColumn, valueColumn].filter((column): column is string => Boolean(column)),
  };
}

async function buildMappedTableBlock(context: DashboardEngineContext, moduleName: ModuleName, metrics: BusinessMetric[]): Promise<DashboardBlock | null> {
  const mapping = findMapping(context, moduleName);
  const { rows, strategy } = await readRows(context, mapping, 20);
  if (!mapping && rows.length === 0) return null;

  const columns = mapping?.selectedColumns.length
    ? mapping.selectedColumns
    : Array.from(new Set(rows.flatMap(row => Object.keys(row)))).slice(0, 10);
  const tableRows = rows.slice(0, 20).map(row => Object.fromEntries(columns.map(column => [column, row[column]])));
  const lineage = buildBlockLineageFromMapping({
    context,
    mapping,
    moduleName,
    columns,
    rowsRead: rows.length,
    rowsSampled: tableRows.length,
    strategy,
    transformations: [`Preview tabular de ${tableRows.length} linha(s) reais.`],
    sourceMetrics: metrics,
  });

  return buildTableBlock({
    id: `dashboard-block:table:${context.activeDataset?.datasetId || "no-dataset"}:${moduleName}`,
    title: `Prévia real de ${moduleName}`,
    data: {
      columns,
      rows: tableRows,
      sheetName: mapping?.sheetName || null,
      rowCount: rows.length,
    },
    sourceMetrics: metrics,
    lineage,
  });
}

async function buildModuleRankingBlocks(context: DashboardEngineContext, moduleName: ModuleName, metrics: BusinessMetric[]): Promise<DashboardBlock[]> {
  const mapping = findMapping(context, moduleName);
  const { rows, strategy } = await readRows(context, mapping, 5000);
  if (!mapping) return [];

  const specs: Array<{ id: string; title: string; labelRoles: string[]; valueRoles: string[] }> = [];
  if (moduleName === "Comercial") {
    specs.push(
      { id: "sellers", title: "Top vendedores", labelRoles: ["seller", "name"], valueRoles: ["value"] },
      { id: "products", title: "Top produtos/itens", labelRoles: ["product"], valueRoles: ["value"] },
      { id: "clients", title: "Top clientes", labelRoles: ["client"], valueRoles: ["value"] },
    );
  }
  if (moduleName === "Pessoas") {
    specs.push(
      { id: "people", title: "Pessoas reais", labelRoles: ["name", "seller"], valueRoles: ["commission"] },
      { id: "departments", title: "Pessoas por setor", labelRoles: ["department", "store"], valueRoles: [] },
    );
  }
  if (moduleName === "Comissão") {
    specs.push({ id: "commission-sellers", title: "Comissões por vendedor", labelRoles: ["seller", "name"], valueRoles: ["commission", "value"] });
  }

  return specs.map(spec => {
    const labelColumn = roleColumn(mapping, rows, spec.labelRoles);
    const valueColumn = roleColumn(mapping, rows, spec.valueRoles);
    const ranking = buildRankingItems(rows, labelColumn, valueColumn);
    const lineage = buildBlockLineageFromMapping({
      context,
      mapping,
      moduleName,
      columns: ranking.columns,
      rowsRead: rows.length,
      rowsSampled: rows.length,
      strategy,
      transformations: [`Ranking ${spec.title} agrupado por ${labelColumn || "coluna não configurada"}.`],
      sourceMetrics: metrics,
    });

    return buildRankingBlock({
      id: `dashboard-block:ranking:${context.activeDataset?.datasetId || "no-dataset"}:${moduleName}:${spec.id}`,
      title: spec.title,
      status: ranking.items.length > 0 ? "ready" : "pending",
      items: ranking.items,
      sourceMetrics: metrics,
      lineage,
      warnings: ranking.items.length > 0 ? [] : ["Configuração pendente: escolha a coluna necessária para este ranking."],
      missingColumns: labelColumn ? [] : spec.labelRoles,
    });
  });
}

function registerDashboard(dashboard: ExecutiveDashboard): ExecutiveDashboard {
  dashboard.blocks.forEach(block => blockRegistry.set(block.id, block));
  return dashboard;
}

function buildDashboard(params: {
  context: DashboardEngineContext;
  moduleName: ModuleName | "Executive";
  blocks: DashboardBlock[];
}): ExecutiveDashboard {
  const diagnostics = buildDashboardDiagnostics(params.blocks);
  const lineage = params.blocks.length > 0
    ? {
      ...emptyDashboardLineage(params.context, params.context.moduleMappings),
      inputSheets: Array.from(new Set(params.blocks.flatMap(block => block.lineage.inputSheets))),
      inputColumns: Array.from(new Set(params.blocks.flatMap(block => block.lineage.inputColumns))),
      metricIds: Array.from(new Set(params.blocks.flatMap(block => block.lineage.metricIds))),
      knowledgeGraphNodes: Array.from(new Set(params.blocks.flatMap(block => block.lineage.knowledgeGraphNodes))),
      businessRules: Array.from(new Set(params.blocks.flatMap(block => block.lineage.businessRules))),
      transformations: Array.from(new Set(params.blocks.flatMap(block => block.lineage.transformations))),
      rowAccess: {
        strategy: params.blocks.find(block => block.lineage.rowAccess.strategy !== "none")?.lineage.rowAccess.strategy || "none",
        rowsRead: params.blocks.reduce((sum, block) => sum + block.lineage.rowAccess.rowsRead, 0),
        rowsSampled: params.blocks.reduce((sum, block) => sum + block.lineage.rowAccess.rowsSampled, 0),
      },
    }
    : emptyDashboardLineage(params.context, params.context.moduleMappings);

  return registerDashboard({
    dashboardId: `executive-dashboard:${params.context.activeDataset?.datasetId || "no-dataset"}:${params.moduleName}`,
    moduleName: params.moduleName,
    datasetId: params.context.activeDataset?.datasetId || null,
    sourceName: params.context.activeDataset?.sourceName || null,
    blocks: params.blocks,
    diagnostics,
    lineage,
    createdAt: new Date().toISOString(),
  });
}

export async function buildExecutiveDashboard(context: DashboardEngineContext): Promise<ExecutiveDashboard> {
  if (!context.activeDataset) {
    const block = buildPendingConfigBlock({
      id: "dashboard-block:pending:no-dataset:Executive",
      title: "Nenhuma fonte de dados ativa",
      context,
      moduleName: "Executive",
      message: "Nenhuma fonte de dados ativa.",
    });
    return buildDashboard({ context, moduleName: "Executive", blocks: [block] });
  }

  const metrics = await calculateMetrics(context, EXECUTIVE_METRICS);
  const blocks = [
    ...metricBlocks(metrics, context),
    ...pendingBlocksFromMetrics("Executive", metrics, context),
    ...insightBlocks(metrics, context, "Executive"),
  ];
  const commercialRankings = await buildModuleRankingBlocks(context, "Comercial", metrics);
  const peopleRankings = await buildModuleRankingBlocks(context, "Pessoas", metrics);
  blocks.push(...commercialRankings.slice(0, 1), ...peopleRankings.slice(0, 1));

  return buildDashboard({ context, moduleName: "Executive", blocks });
}

export async function buildModuleDashboard(moduleName: ModuleName, context: DashboardEngineContext): Promise<ExecutiveDashboard> {
  if (!context.activeDataset) {
    const block = buildPendingConfigBlock({
      id: `dashboard-block:pending:no-dataset:${moduleName}`,
      title: "Nenhuma fonte de dados ativa",
      context,
      moduleName,
      message: "Nenhuma fonte de dados ativa.",
    });
    return buildDashboard({ context, moduleName, blocks: [block] });
  }

  const metrics = await calculateModuleMetrics(context, moduleName);
  const blocks = [
    ...metricBlocks(metrics, context),
    ...pendingBlocksFromMetrics(moduleName, metrics, context),
    ...await buildModuleRankingBlocks(context, moduleName, metrics),
  ];
  const tableBlock = await buildMappedTableBlock(context, moduleName, metrics);
  if (tableBlock) blocks.push(tableBlock);
  blocks.push(...insightBlocks(metrics, context, moduleName));

  if (blocks.length === 0) {
    blocks.push(buildPendingConfigBlock({
      id: `dashboard-block:pending:${context.activeDataset.datasetId}:${moduleName}:empty`,
      title: "Configuração pendente",
      context,
      moduleName,
      message: "Fonte real ativa. Configure os campos deste módulo para gerar análises.",
      requiredMappings: [moduleName],
    }));
  }

  return buildDashboard({ context, moduleName, blocks });
}

export function explainDashboardBlock(blockId: string, dashboard?: ExecutiveDashboard): DashboardBlockExplanation {
  if (dashboard) return explainBlock(blockId, dashboard.blocks);
  const block = blockRegistry.get(blockId);
  return explainBlock(blockId, block ? [block] : []);
}

export function getDashboardLineage(blockId: string, dashboard?: ExecutiveDashboard): DashboardLineage | null {
  if (dashboard) return getBlockLineage(blockId, dashboard.blocks);
  const block = blockRegistry.get(blockId);
  return block?.lineage || null;
}

export class ExecutiveDashboardEngine {
  constructor(private readonly context: DashboardEngineContext) {}

  buildExecutiveDashboard(): Promise<ExecutiveDashboard> {
    return buildExecutiveDashboard(this.context);
  }

  buildModuleDashboard(moduleName: ModuleName): Promise<ExecutiveDashboard> {
    return buildModuleDashboard(moduleName, this.context);
  }

  explainDashboardBlock(blockId: string, dashboard?: ExecutiveDashboard): DashboardBlockExplanation {
    return explainDashboardBlock(blockId, dashboard);
  }

  getDashboardLineage(blockId: string, dashboard?: ExecutiveDashboard): DashboardLineage | null {
    return getDashboardLineage(blockId, dashboard);
  }
}
