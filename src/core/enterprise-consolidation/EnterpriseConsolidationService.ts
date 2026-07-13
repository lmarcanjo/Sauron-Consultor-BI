/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * F15.1 — Enterprise Consolidation & Context Navigation
 * EnterpriseConsolidationService.ts — Lógica de negócios de consolidação de dados organizacionais.
 */

import { EnterpriseContext, ConsolidationCompatibility, ContextLineage } from "./EnterpriseContextTypes";
import { enterpriseRepository, Enterprise, Company, Unit, BusinessGroup } from "../persistence/EnterpriseRepository";
import { workbookRepository } from "../workbook/WorkbookRepository";
import { activeDatasetStore } from "../data/ActiveDatasetStore";
import { LancamentoFinanceiro } from "../../types";

export class EnterpriseConsolidationService {
  private cache: Record<string, any> = {};

  private getContextHash(context: EnterpriseContext): string {
    const dataset = activeDatasetStore.getActiveDataset();
    const datasetVersion = dataset ? `${dataset.datasetId}_${dataset.importedAt}` : "no-dataset";
    return `${JSON.stringify(context)}_${datasetVersion}`;
  }

  /**
   * Retorna os workbooks catalogados válidos para o contexto selecionado.
   */
  public async getSourcesForContext(context: EnterpriseContext): Promise<any[]> {
    const hash = this.getContextHash(context) + "_sources";
    if (this.cache[hash]) return this.cache[hash];

    const allEnterprises = await enterpriseRepository.getAll();
    const allWorkbooks = workbookRepository.list();

    let workbookIds: string[] = [];

    if (context.scope === "GROUP" && context.groupId) {
      // Obter empresas vinculadas ao grupo
      const group = allEnterprises.find(e => e.id === context.groupId) as BusinessGroup;
      if (group) {
        const childCompanies = allEnterprises.filter(e => e.type === "Empresa" && e.parentId === group.id) as Company[];
        childCompanies.forEach(c => {
          if ((c as any).workbookIds) workbookIds.push(...((c as any).workbookIds || []));
          // Pegar unidades da empresa
          const childUnits = allEnterprises.filter(e => e.type === "Unidade" && e.parentId === c.id) as Unit[];
          childUnits.forEach(u => {
            if ((u as any).workbookIds) workbookIds.push(...((u as any).workbookIds || []));
          });
        });
      }
    } else if (context.scope === "COMPANY" && context.companyId) {
      const company = allEnterprises.find(e => e.id === context.companyId) as Company;
      if (company) {
        if ((company as any).workbookIds) workbookIds.push(...((company as any).workbookIds || []));
        // Pegar unidades
        const childUnits = allEnterprises.filter(e => e.type === "Unidade" && e.parentId === company.id) as Unit[];
        childUnits.forEach(u => {
          if ((u as any).workbookIds) workbookIds.push(...((u as any).workbookIds || []));
        });
      }
    } else if (context.scope === "UNIT" && context.unitId) {
      const unit = allEnterprises.find(e => e.id === context.unitId) as Unit;
      if (unit && (unit as any).workbookIds) {
        workbookIds.push(...((unit as any).workbookIds || []));
      }
    }

    // Filtrar workbooks correspondentes
    const matched = allWorkbooks.filter(w => workbookIds.includes(w.id));
    
    // Se nenhum workbook foi associado explicitamente pelo Twin, fallback para o ativo
    if (matched.length === 0 && allWorkbooks.length > 0) {
      const activeDataset = activeDatasetStore.getActiveDataset();
      const fallback = allWorkbooks.find(w => w.id === activeDataset?.datasetId);
      if (fallback) matched.push(fallback);
    }

    this.cache[hash] = matched;
    return matched;
  }

  /**
   * Retorna os registros financeiros filtrados e paginados para o contexto.
   */
  public async getRecordsForContext(
    context: EnterpriseContext,
    page = 1,
    pageSize = 50
  ): Promise<{ records: LancamentoFinanceiro[]; totalCount: number }> {
    const allRecords = activeDatasetStore.getActiveRows() as LancamentoFinanceiro[];
    if (allRecords.length === 0) return { records: [], totalCount: 0 };

    const allEnterprises = await enterpriseRepository.getAll();

    // 1. Filtrar registros conforme o escopo e hierarquia
    let filtered = [...allRecords];

    if (context.scope === "GROUP" && context.groupId) {
      const group = allEnterprises.find(e => e.id === context.groupId) as BusinessGroup;
      if (group) {
        const childCompanies = allEnterprises.filter(e => e.type === "Empresa" && e.parentId === group.id) as Company[];
        const companyNames = childCompanies.map(c => c.name.toLowerCase());
        const groupName = group.name.toLowerCase();

        filtered = allRecords.filter(row => {
          const rGroup = (row.Grupo || row["grupo"] || "").toLowerCase();
          const rCompany = (row.Empresa || row["empresa"] || "").toLowerCase();
          
          return rGroup.includes(groupName) || companyNames.some(name => rCompany.includes(name));
        });
      }
    } else if (context.scope === "COMPANY" && context.companyId) {
      const company = allEnterprises.find(e => e.id === context.companyId) as Company;
      if (company) {
        const companyName = company.name.toLowerCase();
        filtered = allRecords.filter(row => {
          const rCompany = (row.Empresa || row["empresa"] || "").toLowerCase();
          return rCompany.includes(companyName);
        });
      }
    } else if (context.scope === "UNIT" && context.unitId) {
      const unit = allEnterprises.find(e => e.id === context.unitId) as Unit;
      if (unit) {
        const unitName = unit.name.toLowerCase();
        filtered = allRecords.filter(row => {
          const rUnit = (row.Filial || row["filial"] || row.Unidade || row["unidade"] || "").toLowerCase();
          return rUnit.includes(unitName);
        });
      }
    }

    // Filtro de período se disponível
    if (context.period?.start) {
      filtered = filtered.filter(row => {
        const mes = (row.Mês || row["mês"] || row["Mes"] || "");
        return mes >= context.period!.start!;
      });
    }

    const totalCount = filtered.length;
    const startIdx = (page - 1) * pageSize;
    const paginatedRecords = filtered.slice(startIdx, startIdx + pageSize);

    return { records: paginatedRecords, totalCount };
  }

  /**
   * Calcula as métricas consolidadas reais sem mockar.
   */
  public async calculateConsolidatedMetrics(context: EnterpriseContext): Promise<any> {
    const hash = this.getContextHash(context) + "_metrics";
    if (this.cache[hash]) return this.cache[hash];

    const { records } = await this.getRecordsForContext(context, 1, 1000000);
    
    let receita = 0;
    let custo = 0;
    let despesa = 0;
    let comissao = 0;

    records.forEach(row => {
      receita += Number(row.Receita || row["receita"] || 0);
      custo += Number(row.Custo || row["custo"] || 0);
      despesa += Number(row.Despesa || row["despesa"] || 0);
      comissao += Number(row.Comissão || row["comissão"] || row["Comissao"] || 0);
    });

    const lucro = receita - custo - despesa;
    const margem = receita > 0 ? (lucro / receita) * 100 : 0;
    
    const uniqueSellers = new Set(records.map(r => r.Vendedor || r["vendedor"] || "").filter(Boolean));
    const ticketMedio = uniqueSellers.size > 0 ? receita / uniqueSellers.size : 0;

    const metrics = {
      receita,
      custo,
      despesa,
      lucro,
      margem,
      comissao,
      ticketAvg: ticketMedio,
      sellersCount: uniqueSellers.size,
      recordsCount: records.length
    };

    this.cache[hash] = metrics;
    return metrics;
  }

  /**
   * Analisa a compatibilidade semântica de colunas dos workbooks selecionados.
   */
  public async getConsolidationCompatibility(context: EnterpriseContext): Promise<ConsolidationCompatibility> {
    const sources = await this.getSourcesForContext(context);
    if (sources.length <= 1) {
      return {
        compatible: true,
        message: "Operando em fonte única ou sem fontes associadas. Consistência garantida.",
        incompatibleSources: [],
        sharedColumns: []
      };
    }

    // Pegar todas as colunas de cada fonte e comparar
    const sourceColumns = sources.map(s => s.columns?.map((c: any) => c.name) || []);
    const intersection = sourceColumns.reduce((a, b) => a.filter((c: string) => b.includes(c)));

    const requiredFields = ["Receita", "Custo", "Despesa"];
    const missingInSome = requiredFields.filter(f => !intersection.includes(f));

    if (missingInSome.length > 0) {
      return {
        compatible: false,
        message: `Mapeamentos divergentes. Estas fontes precisam de configuração para serem consolidadas. (Faltam colunas: ${missingInSome.join(", ")})`,
        incompatibleSources: sources.map(s => s.metadata?.name || s.id),
        sharedColumns: intersection
      };
    }

    return {
      compatible: true,
      message: "Todas as fontes possuem mapeamentos e colunas financeiras compatíveis para consolidação.",
      incompatibleSources: [],
      sharedColumns: intersection
    };
  }

  public getContextLineage(context: EnterpriseContext): ContextLineage {
    const dataset = activeDatasetStore.getActiveDataset();
    const sheets = dataset ? dataset.sheets.map(s => typeof s === "string" ? s : s.sheetName) : [];

    return {
      scope: context.scope,
      sources: dataset ? [{
        workbookId: dataset.datasetId,
        name: dataset.sourceName,
        enterpriseId: context.companyId || context.groupId || "ws_primary",
        enterpriseName: "Sauron Workspace",
        rowCount: dataset.rowCount
      }] : [],
      mappedColumns: dataset ? dataset.columnProfiles.map(p => p.name) : []
    };
  }
}

export const enterpriseConsolidationService = new EnterpriseConsolidationService();
