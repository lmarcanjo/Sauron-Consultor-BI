/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * F15.1 — Enterprise Consolidation & Context Navigation
 * EnterpriseConsolidationService.ts — Lógica de negócios de consolidação de dados organizacionais.
 */

import { EnterpriseContext, ConsolidationCompatibility, ContextLineage } from "./EnterpriseContextTypes";
import { enterpriseRepository, Company, Unit, BusinessGroup } from "../persistence/EnterpriseRepository";
import { workbookRepository } from "../workbook/WorkbookRepository";
import { workbookRepository as libraryWorkbookRepository } from "../workbook-library/WorkbookRepository";
import { activeDatasetStore } from "../data/ActiveDatasetStore";
import { IndexedSpreadsheetStorage } from "../storage/IndexedSpreadsheetStorage";
import { parseNumericValue } from "../data/activeDatasetView";
import { LancamentoFinanceiro } from "../../types";
import { activeSourceSelectionStore } from "../data/ActiveSourceSelectionStore";
import { registerEnterpriseContextResolver } from "./EnterpriseContextStore";
import { ActiveDataset } from "../../types/dataSource";

type ResolvedSource = {
  id: string;
  datasetId: string;
  activeDataset?: ActiveDataset;
  [key: string]: any;
};

async function readRowsFromDatasets(datasets: ActiveDataset[]): Promise<LancamentoFinanceiro[]> {
  if (typeof indexedDB === "undefined") {
    return activeDatasetStore.getActiveRows() as LancamentoFinanceiro[];
  }

  const rows: LancamentoFinanceiro[] = [];
  const pageSize = 1000;
  const seen = new Set<string>();

  for (const dataset of datasets) {
    const sourceId = dataset.sourceIdentity?.storageRowsKey || dataset.rawStorageRef || dataset.datasetId;
    if (!sourceId || sourceId.startsWith("api:") || seen.has(sourceId)) continue;
    seen.add(sourceId);
    const sheetNames = dataset.sheets
      .filter(sheet => typeof sheet === "string" || sheet.selectedForImport !== false)
      .map(sheet => typeof sheet === "string" ? sheet : sheet.sheetName);
    for (const sheetName of Array.from(new Set(sheetNames.length ? sheetNames : [dataset.activeSheet]))) {
      let offset = 0;
      while (true) {
        const page = await IndexedSpreadsheetStorage.getRowsPaged(sourceId, sheetName, offset, pageSize);
        rows.push(...page as LancamentoFinanceiro[]);
        if (page.length < pageSize) break;
        offset += page.length;
      }
    }
  }

  return rows;
}

export class EnterpriseConsolidationService {
  private cache: Record<string, any> = {};
  private activeDatasetRefreshSequence = 0;

  private getContextHash(context: EnterpriseContext): string {
    const dataset = activeDatasetStore.getActiveDataset();
    const datasetVersion = dataset ? `${dataset.datasetId}_${dataset.importedAt}` : "no-dataset";
    return `${JSON.stringify(context)}_${datasetVersion}`;
  }

  /**
   * Retorna os workbooks catalogados válidos para o contexto selecionado.
   */
  public async getSourcesForContext(context: EnterpriseContext): Promise<ResolvedSource[]> {
    const bindings = await enterpriseRepository.listSourceBindings();
    const allEnterprises = await enterpriseRepository.getAll();
    const groupId = context.groupId;
    const companyId = context.companyId;
    const unitId = context.unitId;
    const childCompanyIds = new Set(
      allEnterprises.filter(entity => entity.type === "Empresa" && entity.parentId === groupId).map(entity => entity.id)
    );
    const childUnitIds = new Set(
      allEnterprises
        .filter(entity => entity.type === "Unidade")
        .filter(entity => context.scope === "GROUP"
          ? childCompanyIds.has((entity as Unit).parentId || "")
          : context.scope === "COMPANY"
            ? (entity as Unit).parentId === companyId
            : (entity as Unit).parentId === companyId)
        .map(entity => entity.id)
    );

    const selectedBindings = bindings.filter(binding => {
      if (context.scope === "WORKBOOK") return context.workbookIds.includes(binding.workbookId);
      if (context.scope === "UNIT") return Boolean(unitId && binding.unitId === unitId);
      if (context.scope === "COMPANY") {
        return Boolean(companyId && (binding.companyId === companyId || (binding.unitId && childUnitIds.has(binding.unitId))));
      }
      if (context.scope === "GROUP") {
        return Boolean(groupId && (
          binding.groupId === groupId ||
          (binding.companyId && childCompanyIds.has(binding.companyId)) ||
          (binding.unitId && childUnitIds.has(binding.unitId))
        ));
      }
      return false;
    });

    const selectedIds = new Set(
      selectedBindings.flatMap(binding => [binding.workbookId, binding.sourceId, binding.datasetId])
    );
    if (context.scope === "WORKBOOK") context.workbookIds.forEach(id => selectedIds.add(id));

    const librarySources: ResolvedSource[] = libraryWorkbookRepository
      .listWorkbooks({ includeArchived: false })
      .map(workbook => {
        const version = libraryWorkbookRepository.getCurrentVersion(workbook.id);
        return {
          ...workbook,
          id: workbook.id,
          datasetId: version?.activeDataset?.datasetId || workbook.id,
          activeDataset: version?.activeDataset,
          columns: version?.activeDataset?.columnProfiles || [],
        };
      });
    const fallbackCatalogs = workbookRepository.list().map(catalog => ({
      ...catalog,
      id: catalog.id,
      datasetId: catalog.id,
    } as ResolvedSource));
    const allSources = librarySources.length ? librarySources : fallbackCatalogs;

    return allSources.filter(source => selectedIds.has(source.id) || selectedIds.has(source.datasetId));
  }

  /**
   * Retorna os registros financeiros filtrados e paginados para o contexto.
   */
  public async getRecordsForContext(
    context: EnterpriseContext,
    page = 1,
    pageSize = 50
  ): Promise<{ records: LancamentoFinanceiro[]; totalCount: number }> {
    const sources = await this.getSourcesForContext(context);
    const sourceDatasets = sources
      .map(source => source.activeDataset)
      .filter(Boolean) as ActiveDataset[];
    const hasContextSources = sourceDatasets.length > 0;
    const allRecords = hasContextSources
      ? await readRowsFromDatasets(sourceDatasets)
      : activeDatasetStore.getActiveRows() as LancamentoFinanceiro[];
    if (allRecords.length === 0) return { records: [], totalCount: 0 };

    const allEnterprises = await enterpriseRepository.getAll();

    // When source storage is available, ownership is already guaranteed by the
    // canonical binding. Row-label filtering is only a compatibility fallback
    // for old catalogs/tests that have no paginated dataset metadata.
    let filtered = [...allRecords];

    if (!hasContextSources && context.scope === "GROUP" && context.groupId) {
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
    } else if (!hasContextSources && context.scope === "COMPANY" && context.companyId) {
      const company = allEnterprises.find(e => e.id === context.companyId) as Company;
      if (company) {
        const companyName = company.name.toLowerCase();
        filtered = allRecords.filter(row => {
          const rCompany = (row.Empresa || row["empresa"] || "").toLowerCase();
          return rCompany.includes(companyName);
        });
      }
    } else if (!hasContextSources && context.scope === "UNIT" && context.unitId) {
      const unit = allEnterprises.find(e => e.id === context.unitId) as Unit;
      if (unit) {
        const unitName = unit.name.toLowerCase();
        filtered = allRecords.filter(row => {
          const rUnit = (row.Filial || row["filial"] || row.Unidade || row["unidade"] || "").toLowerCase();
          return rUnit.includes(unitName);
        });
      }
    }

    // Filtro de período se disponível.
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
      receita += parseNumericValue(row.Receita || row["receita"]) || 0;
      custo += parseNumericValue(row.Custo || row["custo"]) || 0;
      despesa += parseNumericValue(row.Despesa || row["despesa"]) || 0;
      comissao += parseNumericValue(row.Comissão || row["comissão"] || row["Comissao"]) || 0;
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

  /**
   * Rebuilds the bounded ActiveDataset view after a context switch. Complete
   * rows remain in IndexedDB; only metadata and a small preview are published.
   */
  public async refreshActiveDatasetForContext(context: EnterpriseContext): Promise<void> {
    const refreshSequence = ++this.activeDatasetRefreshSequence;
    const sources = await this.getSourcesForContext(context);
    if (refreshSequence !== this.activeDatasetRefreshSequence) return;
    const datasets = sources.map(source => source.activeDataset).filter(Boolean) as ActiveDataset[];
    if (sources.length === 0) {
      activeDatasetStore.clearActiveDataset();
      return;
    }
    if (datasets.length === 0) return;

    const previewRows = [] as ActiveDataset["previewRows"];
    for (const dataset of datasets) {
      const sourceId = dataset.sourceIdentity?.storageRowsKey || dataset.rawStorageRef || dataset.datasetId;
      const sheetName = dataset.activeSheet || (typeof dataset.sheets[0] === "string" ? dataset.sheets[0] : dataset.sheets[0]?.sheetName);
      let rows = dataset.previewRows || [];
      if (rows.length === 0 && sourceId && sheetName && typeof indexedDB !== "undefined") {
        const paged = await IndexedSpreadsheetStorage.getRowsPaged(sourceId, sheetName, 0, 20);
        rows = paged.map((raw, index) => ({
          raw,
          normalized: raw,
          metadata: { rowIndex: index + 1, sheetName, fileName: dataset.sourceName },
        }));
      }
      if (refreshSequence !== this.activeDatasetRefreshSequence) return;
      previewRows.push(...rows.slice(0, 20));
    }

    if (refreshSequence !== this.activeDatasetRefreshSequence) return;

    const sourceWorkbookIds = sources.map(source => source.id);
    const sourceDatasetIds = datasets.map(dataset => dataset.datasetId);
    const first = datasets[0];
    const profiles = [] as ActiveDataset["columnProfiles"];
    const seenColumns = new Set<string>();
    datasets.forEach(dataset => dataset.columnProfiles.forEach(profile => {
      if (!seenColumns.has(profile.name)) {
        seenColumns.add(profile.name);
        profiles.push(profile);
      }
    }));

    const nextDataset: ActiveDataset = datasets.length === 1
      ? {
          ...first,
          sourceDatasetIds,
          sourceWorkbookIds,
          previewRows: previewRows.slice(0, 20),
        }
      : {
          datasetId: `combined_${sourceDatasetIds.slice().sort().join("_")}`,
          sourceType: "SPREADSHEET_DATA",
          sourceName: datasets.map(dataset => dataset.sourceName).join(", "),
          importedAt: new Date().toISOString(),
          rowCount: datasets.reduce((sum, dataset) => sum + dataset.rowCount, 0),
          columnCount: Math.max(...datasets.map(dataset => dataset.columnCount)),
          sheets: datasets.flatMap(dataset => dataset.sheets),
          activeSheet: first.activeSheet,
          previewRows: previewRows.slice(0, 20),
          columnProfiles: profiles,
          importProfile: null,
          rawStorageRef: first.rawStorageRef,
          sourceDatasetIds,
          sourceWorkbookIds,
          status: "ACTIVE",
        };

    if (context.scope !== "WORKBOOK") {
      const scopeId = context.scope === "GROUP" ? context.groupId : context.scope === "COMPANY" ? context.companyId : context.unitId;
      if (scopeId) {
        activeSourceSelectionStore.setForScope({
          tenantId: "local",
          workspaceId: context.workspaceId || first.sourceIdentity?.workspaceId || "workspace_default",
          scopeType: context.scope,
          scopeId,
        }, sourceWorkbookIds);
      }
    }
    activeDatasetStore.setActiveDataset(nextDataset);
  }

  public getContextLineage(context: EnterpriseContext): ContextLineage {
    const dataset = activeDatasetStore.getActiveDataset();
    const sheets = dataset ? dataset.sheets.map(s => typeof s === "string" ? s : s.sheetName) : [];

    return {
      scope: context.scope,
      sources: dataset ? [{
        workbookId: dataset.datasetId,
        name: dataset.sourceName,
        enterpriseId: context.companyId || context.unitId || context.groupId || dataset.sourceIdentity?.enterpriseId || dataset.datasetId,
        enterpriseName: context.scope === "GROUP"
          ? "Grupo selecionado"
          : context.scope === "COMPANY"
            ? "Empresa selecionada"
            : context.scope === "UNIT"
              ? "Unidade selecionada"
              : "Fonte selecionada",
        rowCount: dataset.rowCount
      }] : [],
      mappedColumns: dataset ? dataset.columnProfiles.map(p => p.name) : []
    };
  }
}

export const enterpriseConsolidationService = new EnterpriseConsolidationService();
registerEnterpriseContextResolver(context => enterpriseConsolidationService.refreshActiveDatasetForContext(context));
