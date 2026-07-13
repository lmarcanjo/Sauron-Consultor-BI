import { BusinessMetric } from "../business-intelligence";
import { ModuleName } from "../data/moduleMapping";
import { buildBlockDiagnostics, buildDiagnosticsFromMetrics } from "./DashboardDiagnostics";
import {
  DashboardBlock,
  DashboardBlockStatus,
  DashboardEngineContext,
  DashboardInsightData,
  DashboardLineage,
  DashboardMetricCardData,
  DashboardPendingConfigData,
  DashboardRankingItem,
  DashboardTableData,
} from "./DashboardTypes";
import { buildBlockLineageFromMetrics, emptyDashboardLineage } from "./DashboardLineage";
import { businessDomainEngine } from "../business-domains/BusinessDomainEngine";

const CURRENCY_METRICS = new Set<BusinessMetric["name"]>([
  "totalVendido",
  "totalComissao",
  "ticketMedio",
  "margemCandidata",
  "receitaCandidata",
  "custoCandidato",
]);

function statusFromMetric(metric: BusinessMetric): DashboardBlockStatus {
  if (metric.status === "ready") return "ready";
  if (metric.status === "pending") return "pending";
  return "empty";
}

function formatNumber(value: number | null, unit: DashboardMetricCardData["unit"]): string {
  if (value === null || !Number.isFinite(value)) return "Configuração pendente";
  if (unit === "currency") {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }
  if (unit === "integer") {
    return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
  }
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
}

export function formatDashboardValue(value: number | null, unit: DashboardMetricCardData["unit"] = "number"): string {
  return formatNumber(value, unit);
}

export function buildMetricCardBlock(metric: BusinessMetric, context: DashboardEngineContext): DashboardBlock<DashboardMetricCardData> {
  const unit: DashboardMetricCardData["unit"] = CURRENCY_METRICS.has(metric.name)
    ? "currency"
    : metric.name.startsWith("quantidade")
      ? "integer"
      : "number";

  const translatedLabel = businessDomainEngine.translateToDomain(metric.label);

  return {
    id: `dashboard-block:${metric.id}`,
    title: translatedLabel,
    type: "MetricCard",
    status: statusFromMetric(metric),
    data: {
      metricName: metric.name,
      label: translatedLabel,
      value: metric.value,
      formattedValue: formatNumber(metric.value, unit),
      unit,
      sheetName: metric.sheetName,
      columnsUsed: metric.columnsUsed,
    },
    sourceMetrics: [metric],
    lineage: buildBlockLineageFromMetrics([metric], context),
    diagnostics: buildDiagnosticsFromMetrics([metric]),
  };
}

export function buildPendingConfigBlock(params: {
  id: string;
  title: string;
  context: DashboardEngineContext;
  moduleName: ModuleName | "Executive";
  message: string;
  requiredMappings?: ModuleName[];
  requiredColumns?: string[];
  sourceMetrics?: BusinessMetric[];
}): DashboardBlock<DashboardPendingConfigData> {
  const metrics = params.sourceMetrics || [];

  return {
    id: params.id,
    title: businessDomainEngine.translateToDomain(params.title),
    type: "PendingConfigBlock",
    status: "pending",
    data: {
      moduleName: params.moduleName,
      message: params.message,
      requiredMappings: params.requiredMappings || [],
      requiredColumns: params.requiredColumns || [],
      availableSheets: (params.context.activeDataset?.sheets || []).map(sheet => typeof sheet === "string" ? sheet : sheet.sheetName),
    },
    sourceMetrics: metrics,
    lineage: metrics.length > 0 ? buildBlockLineageFromMetrics(metrics, params.context) : emptyDashboardLineage(params.context, params.context.moduleMappings),
    diagnostics: buildBlockDiagnostics({
      confidence: 0,
      warnings: [params.message],
      missingMappings: params.requiredMappings || [],
      missingColumns: params.requiredColumns || [],
    }),
  };
}

export function buildInsightBlock(params: {
  id: string;
  title: string;
  context: DashboardEngineContext;
  data: DashboardInsightData;
  sourceMetrics?: BusinessMetric[];
}): DashboardBlock<DashboardInsightData> {
  const metrics = params.sourceMetrics || [];

  return {
    id: params.id,
    title: businessDomainEngine.translateToDomain(params.title),
    type: "InsightBlock",
    status: params.data.severity === "critical" ? "error" : "ready",
    data: params.data,
    sourceMetrics: metrics,
    lineage: metrics.length > 0 ? buildBlockLineageFromMetrics(metrics, params.context) : emptyDashboardLineage(params.context, params.context.moduleMappings),
    diagnostics: buildBlockDiagnostics({
      confidence: 0.7,
      warnings: params.data.severity === "warning" ? [params.data.message] : [],
      errors: params.data.severity === "critical" ? [params.data.message] : [],
    }),
  };
}

export function buildRankingBlock(params: {
  id: string;
  title: string;
  status: DashboardBlockStatus;
  items: DashboardRankingItem[];
  sourceMetrics: BusinessMetric[];
  lineage: DashboardLineage;
  warnings?: string[];
  missingColumns?: string[];
}): DashboardBlock<{ items: DashboardRankingItem[] }> {
  return {
    id: params.id,
    title: businessDomainEngine.translateToDomain(params.title),
    type: "RankingBlock",
    status: params.status,
    data: { items: params.items },
    sourceMetrics: params.sourceMetrics,
    lineage: params.lineage,
    diagnostics: buildBlockDiagnostics({
      confidence: params.items.length > 0 ? 0.8 : 0.2,
      warnings: params.warnings || [],
      missingColumns: params.missingColumns || [],
      source: "ModuleMapping",
    }),
  };
}

export function buildTableBlock(params: {
  id: string;
  title: string;
  data: DashboardTableData;
  status?: DashboardBlockStatus;
  sourceMetrics: BusinessMetric[];
  lineage: DashboardLineage;
  warnings?: string[];
}): DashboardBlock<DashboardTableData> {
  return {
    id: params.id,
    title: businessDomainEngine.translateToDomain(params.title),
    type: "TableBlock",
    status: params.status || (params.data.rows.length > 0 ? "ready" : "empty"),
    data: params.data,
    sourceMetrics: params.sourceMetrics,
    lineage: params.lineage,
    diagnostics: buildBlockDiagnostics({
      confidence: params.data.rows.length > 0 ? 0.75 : 0.1,
      warnings: params.warnings || [],
      source: "ActiveDataset",
    }),
  };
}
