import { ModuleName } from "../data/moduleMapping";
import {
  BusinessIntelligenceContext,
  BusinessMetric,
  BusinessMetricDiagnostics,
  BusinessMetricLineage,
  BusinessMetricName,
  BusinessMetricSource,
  BusinessMetricStatus,
} from "./BusinessMetricTypes";
import { businessDomainEngine } from "../business-domains/BusinessDomainEngine";

const METRIC_LABELS: Record<BusinessMetricName, string> = {
  totalVendido: "Total vendido",
  totalComissao: "Total de comissão",
  quantidadeVendedores: "Quantidade de vendedores",
  quantidadeClientes: "Quantidade de clientes",
  quantidadeProdutos: "Quantidade de produtos",
  ticketMedio: "Ticket médio",
  margemCandidata: "Margem candidata",
  receitaCandidata: "Receita candidata",
  custoCandidato: "Custo candidato",
};

export function metricLabel(metricName: BusinessMetricName): string {
  return businessDomainEngine.translateToDomain(METRIC_LABELS[metricName]);
}

export function buildMetricId(context: BusinessIntelligenceContext, metricName: BusinessMetricName, moduleName?: ModuleName | null): string {
  return `metric:${context.activeDataset?.datasetId || "no-dataset"}:${moduleName || "global"}:${metricName}`;
}

export function buildMetricSource(params: {
  context: BusinessIntelligenceContext;
  moduleName?: ModuleName | null;
  mappingId?: string | null;
  ruleIds?: string[];
}): BusinessMetricSource {
  return {
    datasetId: params.context.activeDataset?.datasetId || null,
    sourceName: params.context.activeDataset?.sourceName || null,
    workbookId: params.context.workbookCatalog?.id || null,
    moduleName: params.moduleName || null,
    mappingId: params.mappingId || null,
    ruleIds: params.ruleIds || [],
  };
}

export function buildDiagnostics(params: Partial<BusinessMetricDiagnostics>): BusinessMetricDiagnostics {
  return {
    confidence: params.confidence ?? 0,
    warnings: params.warnings || [],
    errors: params.errors || [],
    missingMappings: params.missingMappings || [],
    missingColumns: params.missingColumns || [],
    rowsRead: params.rowsRead || 0,
    calculation: params.calculation || "Nenhum cálculo executado.",
  };
}

export function buildBusinessMetric(params: {
  context: BusinessIntelligenceContext;
  metricName: BusinessMetricName;
  status: BusinessMetricStatus;
  value: number | null;
  moduleName?: ModuleName | null;
  sheetName?: string | null;
  columnsUsed?: string[];
  rowsSampled?: number;
  lineage: BusinessMetricLineage;
  diagnostics: BusinessMetricDiagnostics;
  mappingId?: string | null;
  ruleIds?: string[];
}): BusinessMetric {
  return {
    id: buildMetricId(params.context, params.metricName, params.moduleName),
    name: params.metricName,
    label: metricLabel(params.metricName),
    value: params.value,
    status: params.status,
    source: buildMetricSource({
      context: params.context,
      moduleName: params.moduleName,
      mappingId: params.mappingId,
      ruleIds: params.ruleIds,
    }),
    sheetName: params.sheetName || null,
    columnsUsed: params.columnsUsed || [],
    rowsSampled: params.rowsSampled || 0,
    lineage: params.lineage,
    diagnostics: params.diagnostics,
  };
}
