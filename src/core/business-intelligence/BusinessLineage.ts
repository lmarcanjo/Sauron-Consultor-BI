import { ModuleName } from "../data/moduleMapping";
import { findModuleInputs } from "../knowledge-graph";
import {
  BusinessIntelligenceContext,
  BusinessMetric,
  BusinessMetricExplanation,
  BusinessMetricLineage,
} from "./BusinessMetricTypes";

function unique(values: string[]): string[] {
  return values.filter((value, index, all) => value && all.indexOf(value) === index);
}

export function buildMetricLineage(params: {
  context: BusinessIntelligenceContext;
  moduleNames: ModuleName[];
  inputSheets: string[];
  inputColumns: string[];
  rowsRead: number;
  rowsSampled: number;
  strategy: BusinessMetricLineage["rowAccess"]["strategy"];
  transformations: string[];
  ruleCategories?: string[];
}): BusinessMetricLineage {
  const mappings = params.context.moduleMappings
    .filter(mapping => params.moduleNames.includes(mapping.moduleName))
    .map(mapping => ({
      moduleName: mapping.moduleName,
      sheetName: mapping.sheetName,
      selectedColumns: mapping.selectedColumns,
      semanticRoles: mapping.semanticRoles,
    }));
  const graphNodes: string[] = [];

  if (params.context.knowledgeGraph) {
    params.moduleNames.forEach(moduleName => {
      const inputs = findModuleInputs(params.context.knowledgeGraph as any, moduleName);
      graphNodes.push(
        ...inputs.mappingNodes.map(node => node.id),
        ...inputs.sheets.map(node => node.id),
        ...inputs.columns.map(node => node.id),
        ...inputs.semanticConcepts.map(node => node.id),
      );
    });
  }

  const businessRules = (params.context.rules || [])
    .filter(rule => (
      params.moduleNames.some(moduleName => rule.impactedModules.includes(moduleName)) ||
      (params.ruleCategories || []).includes(rule.category)
    ))
    .slice(0, 20)
    .map(rule => rule.id);

  return {
    datasetId: params.context.activeDataset?.datasetId || null,
    workbookId: params.context.workbookCatalog?.id || undefined,
    inputSheets: unique(params.inputSheets),
    inputColumns: unique(params.inputColumns),
    moduleMappings: mappings,
    knowledgeGraphNodes: unique(graphNodes).slice(0, 100),
    businessRules,
    transformations: params.transformations,
    rowAccess: {
      strategy: params.strategy,
      rowsRead: params.rowsRead,
      rowsSampled: params.rowsSampled,
    },
  };
}

export function getMetricLineage(metricId: string, metrics: BusinessMetric[]): BusinessMetricLineage | null {
  return metrics.find(metric => metric.id === metricId)?.lineage || null;
}

export function explainMetric(metricId: string, metrics: BusinessMetric[]): BusinessMetricExplanation {
  const metric = metrics.find(item => item.id === metricId) || null;
  if (!metric) {
    return {
      metric: null,
      summary: `Métrica ${metricId} não encontrada.`,
      source: null,
      lineage: null,
      diagnostics: null,
      evidence: [],
    };
  }

  const evidence = [
    `Status: ${metric.status}.`,
    metric.sheetName ? `Aba usada: ${metric.sheetName}.` : "Nenhuma aba calculável definida.",
    metric.columnsUsed.length > 0 ? `Colunas usadas: ${metric.columnsUsed.join(", ")}.` : "Nenhuma coluna calculável definida.",
    `Linhas amostradas: ${metric.rowsSampled}.`,
    ...metric.lineage.transformations,
    ...metric.diagnostics.warnings,
    ...metric.diagnostics.errors,
  ];

  return {
    metric,
    summary: `${metric.label}: ${metric.status === "ready" ? `valor ${metric.value}` : metric.status}.`,
    source: metric.source,
    lineage: metric.lineage,
    diagnostics: metric.diagnostics,
    evidence,
  };
}
