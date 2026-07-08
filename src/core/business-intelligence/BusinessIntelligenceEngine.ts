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

export { calculateMetric, calculateModuleMetrics, explainMetric, getMetricLineage };
