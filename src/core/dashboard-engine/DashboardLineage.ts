import { BusinessIntelligenceContext, BusinessMetric } from "../business-intelligence";
import { ModuleFieldMapping, ModuleName } from "../data/moduleMapping";
import { DashboardBlock, DashboardBlockExplanation, DashboardLineage } from "./DashboardTypes";

function unique(values: string[]): string[] {
  return values.filter((value, index, all) => value && all.indexOf(value) === index);
}

function mappingLineage(mapping: ModuleFieldMapping) {
  return {
    moduleName: mapping.moduleName,
    sheetName: mapping.sheetName,
    selectedColumns: mapping.selectedColumns,
    semanticRoles: mapping.semanticRoles,
  };
}

export function emptyDashboardLineage(context: BusinessIntelligenceContext, moduleMappings: ModuleFieldMapping[] = []): DashboardLineage {
  return {
    datasetId: context.activeDataset?.datasetId || null,
    workbookId: context.workbookCatalog?.id || null,
    sourceName: context.activeDataset?.sourceName || null,
    inputSheets: [],
    inputColumns: [],
    moduleMappings: moduleMappings.map(mappingLineage),
    metricIds: [],
    knowledgeGraphNodes: [],
    businessRules: [],
    transformations: [],
    rowAccess: {
      strategy: "none",
      rowsRead: 0,
      rowsSampled: 0,
    },
  };
}

export function buildBlockLineageFromMetrics(metrics: BusinessMetric[], context: BusinessIntelligenceContext): DashboardLineage {
  if (metrics.length === 0) return emptyDashboardLineage(context, context.moduleMappings);

  const rowsRead = metrics.reduce((sum, metric) => sum + metric.lineage.rowAccess.rowsRead, 0);
  const rowsSampled = metrics.reduce((sum, metric) => sum + metric.lineage.rowAccess.rowsSampled, 0);
  const strategy = metrics.find(metric => metric.lineage.rowAccess.strategy !== "none")?.lineage.rowAccess.strategy || "none";

  return {
    datasetId: context.activeDataset?.datasetId || null,
    workbookId: context.workbookCatalog?.id || null,
    sourceName: context.activeDataset?.sourceName || null,
    inputSheets: unique(metrics.flatMap(metric => metric.lineage.inputSheets)),
    inputColumns: unique(metrics.flatMap(metric => metric.lineage.inputColumns)),
    moduleMappings: metrics.flatMap(metric => metric.lineage.moduleMappings)
      .filter((mapping, index, all) => all.findIndex(item => item.moduleName === mapping.moduleName && item.sheetName === mapping.sheetName) === index),
    metricIds: metrics.map(metric => metric.id),
    knowledgeGraphNodes: unique(metrics.flatMap(metric => metric.lineage.knowledgeGraphNodes)),
    businessRules: unique(metrics.flatMap(metric => metric.lineage.businessRules)),
    transformations: unique(metrics.flatMap(metric => metric.lineage.transformations)),
    rowAccess: {
      strategy,
      rowsRead,
      rowsSampled,
    },
  };
}

export function buildBlockLineageFromMapping(params: {
  context: BusinessIntelligenceContext;
  mapping: ModuleFieldMapping | null;
  moduleName: ModuleName;
  columns: string[];
  rowsRead: number;
  rowsSampled: number;
  strategy: DashboardLineage["rowAccess"]["strategy"];
  transformations: string[];
  sourceMetrics?: BusinessMetric[];
}): DashboardLineage {
  const metricLineage = buildBlockLineageFromMetrics(params.sourceMetrics || [], params.context);
  const mapping = params.mapping ? mappingLineage(params.mapping) : null;

  return {
    ...metricLineage,
    inputSheets: unique([...metricLineage.inputSheets, params.mapping?.sheetName || ""]),
    inputColumns: unique([...metricLineage.inputColumns, ...params.columns]),
    moduleMappings: mapping
      ? [...metricLineage.moduleMappings, mapping].filter((item, index, all) => all.findIndex(existing => existing.moduleName === item.moduleName && existing.sheetName === item.sheetName) === index)
      : metricLineage.moduleMappings,
    transformations: unique([...metricLineage.transformations, ...params.transformations]),
    rowAccess: {
      strategy: params.strategy,
      rowsRead: params.rowsRead,
      rowsSampled: params.rowsSampled,
    },
  };
}

export function getDashboardLineage(blockId: string, blocks: DashboardBlock[] = []): DashboardLineage | null {
  return blocks.find(block => block.id === blockId)?.lineage || null;
}

export function explainDashboardBlock(blockId: string, blocks: DashboardBlock[] = []): DashboardBlockExplanation {
  const block = blocks.find(item => item.id === blockId) || null;

  if (!block) {
    return {
      block: null,
      summary: `Bloco ${blockId} não encontrado.`,
      lineage: null,
      diagnostics: null,
      evidence: [],
    };
  }

  const evidence = [
    `Status: ${block.status}.`,
    block.lineage.inputSheets.length > 0 ? `Abas: ${block.lineage.inputSheets.join(", ")}.` : "Nenhuma aba calculável definida.",
    block.lineage.inputColumns.length > 0 ? `Colunas: ${block.lineage.inputColumns.join(", ")}.` : "Nenhuma coluna calculável definida.",
    `Linhas lidas: ${block.lineage.rowAccess.rowsRead}.`,
    ...block.lineage.transformations,
    ...block.diagnostics.warnings,
    ...block.diagnostics.errors,
  ];

  return {
    block,
    summary: `${block.title}: ${block.status}.`,
    lineage: block.lineage,
    diagnostics: block.diagnostics,
    evidence,
  };
}
