/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LancamentoFinanceiro } from "../../types";
import { KPI } from "../business/businessObjects";

export interface BusinessInsight {
  type: "warning" | "opportunity" | "info";
  title: string;
  description: string;
  impact?: string;
  recommendation: string;
}

export class InsightEngine {
  private static instance: InsightEngine;

  private constructor() {}

  public static getInstance(): InsightEngine {
    if (!InsightEngine.instance) {
      InsightEngine.instance = new InsightEngine();
    }
    return InsightEngine.instance;
  }

  /**
   * Scans consolidated records for anomalies, trends, and business opportunities.
   */
  public generateInsights(records: LancamentoFinanceiro[]): BusinessInsight[] {
    const insights: BusinessInsight[] = [];
    if (records.length === 0) return insights;

    let totalRevenue = 0;
    let totalCost = 0;
    let totalExpense = 0;

    records.forEach(r => {
      totalRevenue += r.Receita || 0;
      totalCost += r.Custo || 0;
      totalExpense += r.Despesa || 0;
    });

    const totalProfit = totalRevenue - totalCost - totalExpense;
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) : 0;

    // Rule 1: High Cost Ratio
    if (totalRevenue > 0 && (totalCost / totalRevenue) > 0.6) {
      insights.push({
        type: "warning",
        title: "Custo de Mercadorias Elevado",
        description: `O custo operacional representa ${( (totalCost / totalRevenue) * 100 ).toFixed(1)}% do faturamento total.`,
        impact: "Redução drástica na margem bruta, limitando a lucratividade líquida.",
        recommendation: "Renegociar com fornecedores chave ou reavaliar a precificação dos produtos."
      });
    }

    // Rule 2: Exceptionally Low Margins
    if (margin < 0.05) {
      insights.push({
        type: "warning",
        title: "Margem de Lucro Crítica",
        description: `A margem operacional consolidada está em ${(margin * 100).toFixed(1)}%, abaixo do patamar de segurança de 8.0%.`,
        impact: "Risco elevado de insolvência perante oscilações sazonais de mercado.",
        recommendation: "Congelar custos fixos e estruturar auditoria imediata sobre centros de despesa administrativa."
      });
    } else if (margin >= 0.15) {
      insights.push({
        type: "opportunity",
        title: "Excelente Eficiência Operacional",
        description: `Margem de lucro robusta de ${(margin * 100).toFixed(1)}%.`,
        impact: "Geração de caixa livre para expansão e reinvestimento estratégico.",
        recommendation: "Avaliar canais para reinvestir excedente operacional em expansão de portfólio."
      });
    }

    return insights;
  }
}

export const insightEngine = InsightEngine.getInstance();
