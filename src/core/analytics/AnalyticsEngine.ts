/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { metricEngine, MetricEngine } from "./MetricEngine";
import { insightEngine, InsightEngine, BusinessInsight } from "./InsightEngine";
import { LancamentoFinanceiro, MetricasConsolidadas } from "../../types";

export class AnalyticsEngine {
  private static instance: AnalyticsEngine;

  private constructor() {}

  public static getInstance(): AnalyticsEngine {
    if (!AnalyticsEngine.instance) {
      AnalyticsEngine.instance = new AnalyticsEngine();
    }
    return AnalyticsEngine.instance;
  }

  public getMetricsEngine(): MetricEngine {
    return metricEngine;
  }

  public getInsightEngine(): InsightEngine {
    return insightEngine;
  }

  /**
   * Generates a full analytical suite of metrics and executive findings.
   */
  public analyze(records: LancamentoFinanceiro[]): {
    metrics: MetricasConsolidadas;
    insights: BusinessInsight[];
  } {
    return {
      metrics: metricEngine.calculateMetrics(records),
      insights: insightEngine.generateInsights(records)
    };
  }
}

export const analyticsEngine = AnalyticsEngine.getInstance();
export default analyticsEngine;
