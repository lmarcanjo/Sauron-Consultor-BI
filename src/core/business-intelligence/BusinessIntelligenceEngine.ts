import { ModuleName } from "../data/moduleMapping";
import { explainMetric, getMetricLineage } from "./BusinessLineage";
import { calculateMetric, calculateModuleMetrics } from "./BusinessMetricCalculator";
import {
  BusinessIntelligenceContext,
  BusinessMetric,
  BusinessMetricExplanation,
  BusinessMetricLineage,
  BusinessMetricName,
} from "./BusinessMetricTypes";
import { ActiveDataset } from "../../types/dataSource";
import { ModuleFieldMapping } from "../data/moduleMapping";
import { buildPresentationMetricValues, PresentationMetricValues } from "./PresentationMetricContext";

export class BusinessIntelligenceEngine {
  private readonly metrics = new Map<string, BusinessMetric>();

  constructor(private readonly context: BusinessIntelligenceContext) {}

  async calculateMetric(metricName: BusinessMetricName): Promise<BusinessMetric> {
    const metric = await calculateMetric(metricName, this.context);
    this.metrics.set(metric.id, metric);
    return metric;
  }

  async calculateModuleMetrics(moduleName: ModuleName): Promise<BusinessMetric[]> {
    const metrics = await calculateModuleMetrics(moduleName, this.context);
    metrics.forEach(metric => this.metrics.set(metric.id, metric));
    return metrics;
  }

  listMetrics(): BusinessMetric[] {
    return Array.from(this.metrics.values());
  }

  explainMetric(metricId: string): BusinessMetricExplanation {
    return explainMetric(metricId, this.listMetrics());
  }

  getMetricLineage(metricId: string): BusinessMetricLineage | null {
    return getMetricLineage(metricId, this.listMetrics());
  }
}

export async function calculatePresentationMetricValues(params: {
  activeDataset: ActiveDataset;
  rows: Record<string, unknown>[];
  moduleMappings?: ModuleFieldMapping[];
}): Promise<{ values: PresentationMetricValues; metrics: BusinessMetric[]; mappings: ModuleFieldMapping[] }> {
  // Presentation metrics are only valid after the consultant has saved a
  // mapping. Pattern matching belongs to the suggestion UI, never to a live
  // executive artifact.
  const mappings = params.moduleMappings || [];
  const engine = new BusinessIntelligenceEngine({
    activeDataset: params.activeDataset,
    moduleMappings: mappings,
    rowProvider: async (_sheetName, limit) => params.rows.slice(0, limit),
  });
  const names: BusinessMetricName[] = [
    "totalVendido",
    "receitaCandidata",
    "custoCandidato",
    "despesaCandidata",
    "resultadoLiquido",
    "totalComissao",
    "quantidadeVendedores",
    "ticketMedio",
    "margemCandidata",
  ];
  const metrics = await Promise.all(names.map(name => engine.calculateMetric(name)));
  return {
    values: buildPresentationMetricValues(metrics, params.rows, mappings),
    metrics,
    mappings,
  };
}

export { calculateMetric, calculateModuleMetrics, explainMetric, getMetricLineage };
