/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LancamentoFinanceiro } from "../../types";

export interface ChartConfig {
  type: "bar" | "line" | "pie";
  colors: string[];
  xAxisKey: string;
  yAxisKey: string;
}

export class ChartEngine {
  private static instance: ChartEngine;

  private constructor() {}

  public static getInstance(): ChartEngine {
    if (!ChartEngine.instance) {
      ChartEngine.instance = new ChartEngine();
    }
    return ChartEngine.instance;
  }

  /**
   * Generates a standard visual color palette suited for B2B presentation layers.
   */
  public getThemeColors(): string[] {
    return ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  }

  /**
   * Prepares raw financial records for a bar or line chart.
   */
  public prepareChartData(records: LancamentoFinanceiro[], groupBy: "Marca" | "Mês" | "Empresa"): any[] {
    const agg: Record<string, number> = {};
    records.forEach(r => {
      const key = r[groupBy] || "Outros";
      agg[key] = (agg[key] || 0) + (r.Receita || 0);
    });

    return Object.entries(agg).map(([name, value]) => ({
      name,
      value
    }));
  }
}

export const chartEngine = ChartEngine.getInstance();
export default chartEngine;
