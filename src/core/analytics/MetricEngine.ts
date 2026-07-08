/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LancamentoFinanceiro, MetricasConsolidadas } from "../../types";
import { buildSellerRanking } from "../../utils/calculations";

export class MetricEngine {
  private static instance: MetricEngine;

  private constructor() {}

  public static getInstance(): MetricEngine {
    if (!MetricEngine.instance) {
      MetricEngine.instance = new MetricEngine();
    }
    return MetricEngine.instance;
  }

  /**
   * Consolidates a set of financial records into high-level performance metrics.
   */
  public calculateMetrics(records: LancamentoFinanceiro[]): MetricasConsolidadas {
    let receitaTotal = 0;
    let custoTotal = 0;
    let despesaTotal = 0;

    const porMarcaMap: Record<string, { receita: number; lucro: number }> = {};
    const porCnpjMap: Record<string, { empresa: string; receita: number; lucro: number }> = {};
    const porRazaoMap: Record<string, number> = {};
    const porMesMap: Record<string, { lucro: number; receita: number; ordem: number }> = {};

    const mesesOrdem: Record<string, number> = {
      "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4, "Maio": 5, "Junho": 6,
      "Julho": 7, "Agosto": 8, "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12,
      "jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6,
      "jul": 7, "ago": 8, "set": 9, "out": 10, "nov": 11, "dez": 12
    };

    records.forEach(r => {
      const rec = r.Receita || 0;
      const cst = r.Custo || 0;
      const dsp = r.Despesa || 0;
      const luc = rec - cst - dsp;

      receitaTotal += rec;
      custoTotal += cst;
      despesaTotal += dsp;

      // Group by Brand
      const marca = r.Marca || "Geral";
      if (!porMarcaMap[marca]) porMarcaMap[marca] = { receita: 0, lucro: 0 };
      porMarcaMap[marca].receita += rec;
      porMarcaMap[marca].lucro += luc;

      // Group by CNPJ
      const cnpj = r.CNPJ || "00.000.000/0001-00";
      const emp = r.Empresa || "Empresa Geral";
      if (!porCnpjMap[cnpj]) porCnpjMap[cnpj] = { empresa: emp, receita: 0, lucro: 0 };
      porCnpjMap[cnpj].receita += rec;
      porCnpjMap[cnpj].lucro += luc;

      // Group by Reason / Cost Class
      const razao = r.Razão || "Outros";
      porRazaoMap[razao] = (porRazaoMap[razao] || 0) + dsp;

      // Group by Month
      const mes = r.Mês || r.Mes || "Janeiro";
      const ordem = mesesOrdem[mes.toLowerCase()] || 99;
      if (!porMesMap[mes]) porMesMap[mes] = { lucro: 0, receita: 0, ordem };
      porMesMap[mes].lucro += luc;
      porMesMap[mes].receita += rec;
    });

    const lucroTotal = receitaTotal - custoTotal - despesaTotal;
    const margemMedia = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0;

    const porMarca = Object.entries(porMarcaMap).map(([marca, v]) => ({
      marca,
      receita: v.receita,
      lucro: v.lucro,
      margem: v.receita > 0 ? (v.lucro / v.receita) * 100 : 0
    }));

    const porCnpj = Object.entries(porCnpjMap).map(([cnpj, v]) => ({
      cnpj,
      empresa: v.empresa,
      receita: v.receita,
      lucro: v.lucro,
      margem: v.receita > 0 ? (v.lucro / v.receita) * 100 : 0
    }));

    const porRazao = Object.entries(porRazaoMap).map(([razao, despesa]) => ({
      razao,
      despesa,
      participacao: despesaTotal > 0 ? (despesa / despesaTotal) * 100 : 0
    }));

    const porMes = Object.entries(porMesMap).map(([mes, v]) => ({
      mes,
      lucro: v.lucro,
      receita: v.receita,
      ordem: v.ordem
    })).sort((a, b) => a.ordem - b.ordem);

    return {
      receitaTotal,
      custoTotal,
      despesaTotal,
      lucroTotal,
      margemMedia,
      porMarca,
      porCnpj,
      porRazao,
      porMes
    };
  }

  /**
   * Generates ranking of top-performing sales representatives.
   */
  public getSellersRanking(records: LancamentoFinanceiro[]) {
    return buildSellerRanking(records);
  }
}

export const metricEngine = MetricEngine.getInstance();
