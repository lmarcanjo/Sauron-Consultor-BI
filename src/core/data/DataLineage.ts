/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataLineageRecord } from "../business/businessObjects";
import { LancamentoFinanceiro } from "../../types";

export class DataLineage {
  private static instance: DataLineage;

  private constructor() {}

  public static getInstance(): DataLineage {
    if (!DataLineage.instance) {
      DataLineage.instance = new DataLineage();
    }
    return DataLineage.instance;
  }

  /**
   * Builds an explicit lineage record for any calculated KPI value.
   */
  public createKpiLineage(
    kpiCode: string,
    value: number,
    records: LancamentoFinanceiro[],
    formula?: string
  ): DataLineageRecord {
    const firstRowWithMeta = records.find(r => r.arquivo || r.nome_arquivo);
    
    return {
      id: `lineage_${kpiCode}_${Date.now()}`,
      targetKpi: kpiCode,
      value,
      sourceType: firstRowWithMeta ? "SPREADSHEET" : "UNMAPPED",
      fileId: firstRowWithMeta?.arquivo || firstRowWithMeta?.nome_arquivo || "fonte_nao_identificada",
      sheetName: firstRowWithMeta?.aba || firstRowWithMeta?.nome_aba || "aba_nao_identificada",
      rowIndices: records.map((_, idx) => idx).slice(0, 10), // Truncate for size limits
      formulaApplied: formula || "SUM([Receita])",
      calculatedAt: new Date().toISOString(),
      responsibleUser: firstRowWithMeta?.usuario || firstRowWithMeta?.usuário || "System"
    };
  }
}

export const dataLineage = DataLineage.getInstance();
