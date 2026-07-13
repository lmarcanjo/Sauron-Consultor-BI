/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { enterpriseRepository } from "../persistence/EnterpriseRepository";
import { executivePresentationEngine } from "../business-intelligence/ExecutivePresentationEngine";
import { ActiveDataset } from "../../types/dataSource";
import { LancamentoFinanceiro } from "../../types";

describe("F11.2 — Raw Mode & Demonstration Flow Test Suite", () => {
  beforeAll(() => {
    if (typeof window === "undefined") {
      const storage: Record<string, string> = {};
      (globalThis as any).window = {
        localStorage: {
          getItem: (key: string) => storage[key] || null,
          setItem: (key: string, value: string) => { storage[key] = value; },
          removeItem: (key: string) => { delete storage[key]; },
          clear: () => {
            for (const key in storage) {
              delete storage[key];
            }
          }
        }
      };
    }
  });

  beforeEach(async () => {
    // Start completely clean (Raw Mode simulation)
    await enterpriseRepository.clear();
  });

  it("1. should start without pre-registered enterprises (empty raw mode)", async () => {
    const list = await enterpriseRepository.getAll();
    expect(list.length).toBe(0);
  });

  it("2. should register a new enterprise (BusinessGroup and Company)", async () => {
    const group = {
      id: "group_agro_123",
      name: "Grupo Agro",
      type: "Grupo" as const,
      companyIds: ["comp_farmers_123", "comp_todd_123"],
    };
    await enterpriseRepository.save(group);

    const list = await enterpriseRepository.getAll();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe("Grupo Agro");
    expect(list[0].type).toBe("Grupo");
  });

  it("3. should handle empty dataset by returning insufficient_data in presentation engine", async () => {
    const res = await executivePresentationEngine.generatePresentation({
      enterpriseId: undefined,
      workspace: null,
      activeDataset: null,
      allRows: [],
    });

    expect(res.status).toBe("insufficient_data");
    expect(res.slides[0].title).toBe("Configuração pendente");
  });

  it("4. should generate presentation slides with real computed metrics when data is present", async () => {
    const dataset: ActiveDataset = {
      datasetId: "ds_agro_1",
      sourceType: "SPREADSHEET_DATA",
      sourceName: "faturamento_agro.xlsx",
      rowCount: 3,
      columnCount: 4,
      importedAt: new Date().toISOString(),
      sheets: ["Safra 2026"],
      activeSheet: "Safra 2026",
      previewRows: [],
      columnProfiles: [
        { name: "Receita", originalName: "Receita", type: "NUMBER", isDRE: true, isKPI: true },
        { name: "Custo", originalName: "Custo", type: "NUMBER", isDRE: true },
        { name: "Despesa", originalName: "Despesa", type: "NUMBER", isDRE: true }
      ],
      importProfile: null,
      rawStorageRef: "",
      status: "ACTIVE",
    };

    const mockRows: LancamentoFinanceiro[] = [
      {
        id: "1",
        Receita: 100000,
        Custo: 40000,
        Despesa: 10000,
        Comissão: 5000,
        Vendedor: "Carlos",
        Empresa: "Farmers",
        Grupo: "Grupo Agro",
        Mês: "Jan/26",
        CNPJ: "00.000.000/0001-00",
        Marca: "Agro",
        Razão: "Farmers S.A.",
        Categoria: "Venda",
        Lucro: 50000,
        Margem: 50
      },
      {
        id: "2",
        Receita: 200000,
        Custo: 80000,
        Despesa: 20000,
        Comissão: 10000,
        Vendedor: "Ana",
        Empresa: "Todd",
        Grupo: "Grupo Agro",
        Mês: "Jan/26",
        CNPJ: "00.000.000/0001-00",
        Marca: "Agro",
        Razão: "Todd Ltda",
        Categoria: "Venda",
        Lucro: 100000,
        Margem: 50
      },
    ];

    // Save linked group
    const group = {
      id: "group_agro_123",
      name: "Grupo Agro",
      type: "Grupo" as const,
      companyIds: ["comp_farmers_123", "comp_todd_123"],
    };
    await enterpriseRepository.save(group);

    // Generate presentation for the group scope
    const res = await executivePresentationEngine.generatePresentation({
      enterpriseId: group.id,
      workspace: null,
      activeDataset: dataset,
      allRows: mockRows,
    });

    expect(res.status).toBe("ready");
    expect(res.targetName).toBe("Grupo Agro");
    expect(res.targetType).toBe("Grupo");
    expect(res.slides.length).toBe(11);

    // Check computed metrics slide (Cover, Summary, KPIs)
    const coverSlide = res.slides.find(s => s.id === "slide_cover");
    expect(coverSlide).toBeDefined();
    expect(coverSlide?.subtitle).toContain("Grupo Agro");
    expect(coverSlide?.subtitle).toContain("Jan/26");

    const sumSlide = res.slides.find(s => s.id === "slide_executive_summary");
    expect(sumSlide).toBeDefined();
    expect(sumSlide?.content.summary).toContain("R$ 300.000,00"); // 100k + 200k receita
    expect(sumSlide?.content.summary).toContain("R$ 120.000,00"); // 40k + 80k custo
    expect(sumSlide?.content.summary).toContain("[Linha de Dados:");

    const improveSlide = res.slides.find(s => s.id === "slide_improvements");
    expect(improveSlide).toBeDefined();
    expect(improveSlide?.content.points?.[0]).toContain("Todd");

    const riskSlide = res.slides.find(s => s.id === "slide_risks");
    expect(riskSlide).toBeDefined();
    expect(riskSlide?.content.points?.[0]).toContain("[Linha de Dados: Coluna Custo]");
  });
});
