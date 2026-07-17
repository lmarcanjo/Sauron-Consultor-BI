/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * F15.1 — Enterprise Consolidation & Context Navigation
 * EnterpriseConsolidation.test.ts — Testes unitários para consolidação organizacional e isolamento.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localStorage globalmente para o ambiente Node.js de testes
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("window", {
  localStorage: localStorageMock,
  dispatchEvent: () => {}
});

import { enterpriseRepository, Company, BusinessGroup, Unit } from "../persistence/EnterpriseRepository";
import { workbookRepository } from "../workbook/WorkbookRepository";
import { activeDatasetStore } from "../data/ActiveDatasetStore";
import {
  setEnterpriseContext,
  getEnterpriseContext,
  clearEnterpriseContext,
  enterpriseConsolidationService,
  EnterpriseContext
} from "./index";
import { LancamentoFinanceiro } from "../../types";

describe("Enterprise Consolidation & Context Navigation", () => {
  beforeEach(async () => {
    localStorageMock.clear();
    // Limpar repositórios e contextos
    await enterpriseRepository.clear();
    workbookRepository.clear();
    activeDatasetStore.clearActiveDataset();
    clearEnterpriseContext();

    // 1. Cadastrar Grupo Agro sintético
    const group: BusinessGroup = {
      id: "group_agro_1",
      name: "Grupo Agro",
      type: "Grupo",
      segment: "agribusiness",
      companyIds: [],
      workbookIds: []
    };
    await enterpriseRepository.save(group);

    // 2. Cadastrar Múltiplas Empresas (Empresa A e Empresa B)
    const companyA: Company = {
      id: "comp_farmers_a",
      parentId: "group_agro_1",
      unitIds: [],
      name: "Farmers A",
      type: "Empresa",
      segment: "agribusiness",
      workbookIds: ["wb_farmers_a_financeiro"],
      contacts: []
    };
    const companyB: Company = {
      id: "comp_farmers_b",
      parentId: "group_agro_1",
      unitIds: [],
      name: "Farmers B",
      type: "Empresa",
      segment: "agribusiness",
      workbookIds: ["wb_farmers_b_financeiro"],
      contacts: []
    };
    await enterpriseRepository.save(companyA);
    await enterpriseRepository.save(companyB);

    // 3. Cadastrar Unidade da Empresa A
    const unitA1: Unit = {
      id: "unit_farmers_a1",
      parentId: "comp_farmers_a",
      name: "Fazenda A1",
      type: "Unidade",
      segment: "agribusiness",
      workbookIds: ["wb_farmers_a1_financeiro"],
      contacts: []
    };
    await enterpriseRepository.save(unitA1);

    // 4. Cadastrar planilhas correspondentes na biblioteca
    workbookRepository.save({
      id: "wb_farmers_a_financeiro",
      name: "Farmers_A_Q2.xlsx",
      sheets: [{ sheetName: "Dados", rowCount: 2 }],
      columns: [{ name: "Receita", type: "number" }, { name: "Custo", type: "number" }, { name: "Despesa", type: "number" }],
      metadata: { importedAt: new Date().toISOString(), size: 1024 },
      createdAt: new Date().toISOString()
    } as any);

    workbookRepository.save({
      id: "wb_farmers_b_financeiro",
      name: "Farmers_B_Q2.xlsx",
      sheets: [{ sheetName: "Dados", rowCount: 2 }],
      columns: [{ name: "Receita", type: "number" }, { name: "Custo", type: "number" }, { name: "Despesa", type: "number" }],
      metadata: { importedAt: new Date().toISOString(), size: 1024 },
      createdAt: new Date().toISOString()
    } as any);

    workbookRepository.save({
      id: "wb_farmers_a1_financeiro",
      name: "Farmers_A1_Local.xlsx",
      sheets: [{ sheetName: "Dados", rowCount: 1 }],
      columns: [{ name: "Receita", type: "number" }, { name: "Custo", type: "number" }, { name: "Despesa", type: "number" }],
      metadata: { importedAt: new Date().toISOString(), size: 512 },
      createdAt: new Date().toISOString()
    } as any);

    // 5. Injetar dados financeiros sintéticos no store ativo
    const fakeRows: any[] = [
      {
        id: "r1",
        Grupo: "Grupo Agro",
        Empresa: "Farmers A",
        Filial: "Fazenda A1",
        Receita: 100000,
        Custo: 60000,
        Despesa: 20000,
        Mês: "2026-04"
      },
      {
        id: "r2",
        Grupo: "Grupo Agro",
        Empresa: "Farmers A",
        Filial: "Fazenda A2",
        Receita: 80000,
        Custo: 40000,
        Despesa: 15000,
        Mês: "2026-04"
      },
      {
        id: "r3",
        Grupo: "Grupo Agro",
        Empresa: "Farmers B",
        Filial: "Fazenda B1",
        Receita: 200000,
        Custo: 120000,
        Despesa: 30000,
        Mês: "2026-04"
      }
    ];

    activeDatasetStore.setActiveDataset({
      datasetId: "combined_agro_dataset",
      sourceName: "Agro Combined Data",
      importedAt: new Date().toISOString(),
      importedBy: "Test Suite",
      status: "ACTIVE",
      sheets: [{ id: "s1", fileId: "combined_agro_dataset", sheetName: "Dados", rows: fakeRows, columns: [] }],
      rowCount: fakeRows.length,
      columnCount: 8,
      sourceType: "LOCAL",
      columnProfiles: [],
      previewRows: []
    } as any, fakeRows);
  });

  it("deve carregar o contexto ativo do local storage e sincronizar chaves antigas", () => {
    const context: EnterpriseContext = {
      groupId: "group_agro_1",
      companyId: "comp_farmers_a",
      workbookIds: ["wb_farmers_a_financeiro"],
      datasetIds: [],
      scope: "COMPANY"
    };

    setEnterpriseContext(context);
    expect(getEnterpriseContext().scope).toBe("COMPANY");
    expect(getEnterpriseContext().companyId).toBe("comp_farmers_a");
    
    // O contexto atual é a única fonte persistida; chaves antigas são migradas
    // apenas durante a inicialização e não voltam a ser gravadas.
    const persistedContext = JSON.parse(localStorage.getItem("sauron_active_enterprise_context") || "{}");
    expect(persistedContext.companyId).toBe("comp_farmers_a");
    expect(localStorage.getItem("sauron_active_company_id")).toBeNull();
  });

  it("grupo consolidado não perde workbooks", async () => {
    const context: EnterpriseContext = {
      groupId: "group_agro_1",
      workbookIds: [],
      datasetIds: [],
      scope: "GROUP"
    };

    const sources = await enterpriseConsolidationService.getSourcesForContext(context);
    expect(sources.length).toBeGreaterThanOrEqual(2);
  });

  it("empresa A não recebe registros de dados da empresa B", async () => {
    const context: EnterpriseContext = {
      companyId: "comp_farmers_a",
      workbookIds: ["wb_farmers_a_financeiro"],
      datasetIds: [],
      scope: "COMPANY"
    };

    const { records } = await enterpriseConsolidationService.getRecordsForContext(context);
    
    // Devem existir apenas registros de "Farmers A"
    expect(records.length).toBe(2);
    records.forEach(r => {
      expect(r.Empresa).toBe("Farmers A");
      expect(r.Empresa).not.toBe("Farmers B");
    });
  });

  it("unidade não recebe registros de outra unidade", async () => {
    const context: EnterpriseContext = {
      unitId: "unit_farmers_a1",
      workbookIds: ["wb_farmers_a1_financeiro"],
      datasetIds: [],
      scope: "UNIT"
    };

    const { records } = await enterpriseConsolidationService.getRecordsForContext(context);
    
    // Apenas registros correspondentes à Fazenda A1
    expect(records.length).toBe(1);
    expect(records[0].Filial).toBe("Fazenda A1");
  });

  it("deve calcular métricas consolidadas reais para o grupo sem somas cegas", async () => {
    const context: EnterpriseContext = {
      groupId: "group_agro_1",
      workbookIds: [],
      datasetIds: [],
      scope: "GROUP"
    };

    const metrics = await enterpriseConsolidationService.calculateConsolidatedMetrics(context);
    
    // Receita: 100.000 + 80.000 + 200.000 = 380.000
    expect(metrics.receita).toBe(380000);
    // Custo: 60.000 + 40.000 + 120.000 = 220.000
    expect(metrics.custo).toBe(220000);
    // Lucro: 380.000 - 220.000 - 65.000 (despesas: 20k + 15k + 30k = 65k) = 95.000
    expect(metrics.lucro).toBe(95000);
    // Margem: (95.000 / 380.000) * 100 = 25%
    expect(metrics.margem).toBeCloseTo(25, 1);
  });

  it("deve validar compatibilidade semântica de colunas", async () => {
    const context: EnterpriseContext = {
      groupId: "group_agro_1",
      workbookIds: [],
      datasetIds: [],
      scope: "GROUP"
    };

    const compatibility = await enterpriseConsolidationService.getConsolidationCompatibility(context);
    expect(compatibility.compatible).toBe(true);
  });
});
