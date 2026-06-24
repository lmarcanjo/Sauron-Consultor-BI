/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LancamentoFinanceiro } from "../../types";
import { CostCenter, Account, KPI } from "./businessObjects";
import { BUSINESS_RULES } from "./businessRules";

export class BusinessEngine {
  private static instance: BusinessEngine;

  private constructor() {}

  public static getInstance(): BusinessEngine {
    if (!BusinessEngine.instance) {
      BusinessEngine.instance = new BusinessEngine();
    }
    return BusinessEngine.instance;
  }

  /**
   * Normalizes financial records with reliable default values and calculated profitability metrics.
   */
  public normalizeRecords(records: LancamentoFinanceiro[]): LancamentoFinanceiro[] {
    return records.map(r => {
      const rec = { ...r };
      
      // Enforce default values to prevent undefined math errors
      rec.Receita = rec.Receita !== undefined ? Number(rec.Receita) : 0;
      rec.Custo = rec.Custo !== undefined ? Number(rec.Custo) : 0;
      rec.Despesa = rec.Despesa !== undefined ? Number(rec.Despesa) : 0;
      
      // If Valor exists, populate appropriate financial categories if unassigned
      if (rec.Valor !== undefined && rec.Receita === 0 && rec.Custo === 0 && rec.Despesa === 0) {
        const value = Number(rec.Valor);
        if (value > 0) {
          rec.Receita = value;
        } else {
          // Negative values indicate outflows
          rec.Custo = Math.abs(value);
        }
      }

      rec.Lucro = rec.Receita - rec.Custo - rec.Despesa;
      rec.Margem = BUSINESS_RULES.calculateMargin(rec.Lucro, rec.Receita) * 100; // stored as percentage e.g. 15.5 for 15.5%

      // Ensure segment/department tags are assigned
      if (!rec.CentroDeCusto) {
        rec.CentroDeCusto = "Administrativo";
      }

      return rec;
    });
  }

  /**
   * Generates segment-specific cost centers.
   */
  public getCostCenters(segment: "automotivo" | "agro" | "servicos" | "industria"): CostCenter[] {
    switch (segment) {
      case "automotivo":
        return [
          { id: "cc_vn", code: "VN", name: "Veículos Novos", segment: "automotivo" },
          { id: "cc_vs", code: "VS", name: "Seminovos", segment: "automotivo" },
          { id: "cc_vf", code: "VF", name: "Venda Frotista", segment: "automotivo" },
          { id: "cc_pe", code: "PE", name: "Peças", segment: "automotivo" },
          { id: "cc_ac", code: "AC", name: "Acessórios", segment: "automotivo" },
          { id: "cc_me", code: "ME", name: "Mecânica", segment: "automotivo" },
          { id: "cc_fu", code: "FU", name: "Funilaria", segment: "automotivo" },
          { id: "cc_co", code: "CO", name: "Consórcio", segment: "automotivo" },
          { id: "cc_fi", code: "FI", name: "F&I/FNA", segment: "automotivo" },
          { id: "cc_ad", code: "AD", name: "Administrativo", segment: "automotivo" },
          { id: "cc_fn", code: "FN", name: "Financeiro", segment: "automotivo" },
          { id: "cc_di", code: "DI", name: "Diretoria", segment: "automotivo" }
        ];
      case "agro":
        return [
          { id: "cc_soja", code: "SOJA", name: "Cultivo de Soja", segment: "agro" },
          { id: "cc_milho", code: "MILHO", name: "Cultivo de Milho", segment: "agro" },
          { id: "cc_insumos", code: "INSUMOS", name: "Insumos Aplicados", segment: "agro" },
          { id: "cc_maq", code: "MAQUINAS", name: "Custo Maquinário", segment: "agro" },
          { id: "cc_log", code: "LOG", name: "Logística e Escoamento", segment: "agro" }
        ];
      case "servicos":
        return [
          { id: "cc_consultoria", code: "CONS", name: "Consultoria Executiva", segment: "servicos" },
          { id: "cc_suporte", code: "SUPP", name: "Suporte Operacional", segment: "servicos" },
          { id: "cc_marketing", code: "MKT", name: "Marketing Digital", segment: "servicos" }
        ];
      case "industria":
        return [
          { id: "cc_prod", code: "PROD", name: "Linha de Produção", segment: "industria" },
          { id: "cc_manut", code: "MANUT", name: "Manutenção Industrial", segment: "industria" },
          { id: "cc_qualidade", code: "QUAL", name: "Controle de Qualidade", segment: "industria" }
        ];
      default:
        return [];
    }
  }

  /**
   * Organizes financial records into a DRE matrix structure.
   */
  public generateDRE(records: LancamentoFinanceiro[]): {
    receitaBruta: number;
    impostos: number;
    receitaLiquida: number;
    custoVendas: number;
    lucroBruto: number;
    despesasOperacionais: number;
    ebitda: number;
    margemEbitda: number;
  } {
    let receitaBruta = 0;
    let custoVendas = 0;
    let despesasOperacionais = 0;

    records.forEach(r => {
      receitaBruta += r.Receita || 0;
      custoVendas += r.Custo || 0;
      despesasOperacionais += r.Despesa || 0;
    });

    const impostos = receitaBruta * 0.05; // standard simulated 5% corporate tax
    const receitaLiquida = receitaBruta - impostos;
    const lucroBruto = receitaLiquida - custoVendas;
    const ebitda = lucroBruto - despesasOperacionais;
    const margemEbitda = receitaLiquida > 0 ? (ebitda / receitaLiquida) * 100 : 0;

    return {
      receitaBruta,
      impostos,
      receitaLiquida,
      custoVendas,
      lucroBruto,
      despesasOperacionais,
      ebitda,
      margemEbitda
    };
  }
}

export const businessEngine = BusinessEngine.getInstance();
