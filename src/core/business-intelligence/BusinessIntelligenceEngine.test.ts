import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { ModuleFieldMapping } from "../data/moduleMapping";
import { buildKnowledgeGraph } from "../knowledge-graph";
import { RuleEngine } from "../rule-engine";
import { WorkbookEngine } from "../workbook";
import { workbookReverseEngineer } from "../workbook-reverse";
import { BusinessIntelligenceEngine, calculateMetric } from "./index";
import { ActiveDataset } from "../../types/dataSource";

function createWorkbook(): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  const sales = XLSX.utils.aoa_to_sheet([
    ["Vendedor", "Produto", "Cliente", "Valor", "Custo"],
    ["Amanda", "Filtro", "Cliente A", 100, 60],
    ["Bruno", "Óleo", "Cliente B", 80, 50],
    ["Amanda", "Pneu", "Cliente A", 120, 70],
  ]);
  XLSX.utils.book_append_sheet(workbook, sales, "IMP_VENDAS");

  const people = XLSX.utils.aoa_to_sheet([
    ["Nome", "CPF", "Setor"],
    ["Amanda", "12345678901", "Peças"],
    ["Bruno", "98765432100", "Acessórios"],
  ]);
  XLSX.utils.book_append_sheet(workbook, people, "Cadastros_Vendedores");

  const commission = XLSX.utils.aoa_to_sheet([
    ["Vendedor", "Total Vendido", "Comissão"],
    ["Amanda", 220, 11],
    ["Bruno", 80, 4],
  ]);
  XLSX.utils.book_append_sheet(workbook, commission, "Comissão_Vendedores");

  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

function activeDataset(datasetId: string): ActiveDataset {
  return {
    datasetId,
    sourceType: "SPREADSHEET_DATA",
    sourceName: "bi-synthetic.xlsx",
    importedAt: "2026-07-08T00:00:00.000Z",
    rowCount: 8,
    columnCount: 5,
    sheets: ["IMP_VENDAS", "Cadastros_Vendedores", "Comissão_Vendedores"],
    activeSheet: "IMP_VENDAS",
    previewRows: [],
    columnProfiles: [],
    importProfile: null,
    rawStorageRef: "test:bi",
    status: "ACTIVE",
  };
}

function mappings(datasetId: string): ModuleFieldMapping[] {
  return [
    {
      projectId: "bi",
      datasetId,
      moduleName: "Comercial",
      sheetName: "IMP_VENDAS",
      selectedColumns: ["Vendedor", "Produto", "Cliente", "Valor", "Custo"],
      semanticRoles: { seller: "Vendedor", product: "Produto", client: "Cliente", value: "Valor", cost: "Custo" },
      updatedAt: "2026-07-08T00:00:00.000Z",
    },
    {
      projectId: "bi",
      datasetId,
      moduleName: "Pessoas",
      sheetName: "Cadastros_Vendedores",
      selectedColumns: ["Nome", "CPF", "Setor"],
      semanticRoles: { name: "Nome", cpf: "CPF", department: "Setor" },
      updatedAt: "2026-07-08T00:00:00.000Z",
    },
    {
      projectId: "bi",
      datasetId,
      moduleName: "Comissão",
      sheetName: "Comissão_Vendedores",
      selectedColumns: ["Vendedor", "Total Vendido", "Comissão"],
      semanticRoles: { seller: "Vendedor", base: "Total Vendido", amount: "Comissão" },
      updatedAt: "2026-07-08T00:00:00.000Z",
    },
  ];
}

describe("Business Intelligence Engine", () => {
  it("calculates auditable metrics from real mapped rows", async () => {
    const catalog = await new WorkbookEngine().catalogArrayBuffer(createWorkbook(), {
      sourceName: "bi-synthetic.xlsx",
      profileRowsPerSheetLimit: 20,
    });
    const reverseReport = workbookReverseEngineer.generateReport(catalog);
    const dataset = activeDataset(catalog.id);
    const moduleMappings = mappings(dataset.datasetId);
    const knowledgeGraph = buildKnowledgeGraph({ workbookCatalog: catalog, reverseReport, activeDataset: dataset, moduleMappings });
    const rules = new RuleEngine({ workbookCatalog: catalog, reverseReport, knowledgeGraph }).listRules();
    const rowsBySheet: Record<string, Record<string, any>[]> = {
      IMP_VENDAS: [
        { Vendedor: "Amanda", Produto: "Filtro", Cliente: "Cliente A", Valor: 100, Custo: 60 },
        { Vendedor: "Bruno", Produto: "Óleo", Cliente: "Cliente B", Valor: 80, Custo: 50 },
        { Vendedor: "Amanda", Produto: "Pneu", Cliente: "Cliente A", Valor: 120, Custo: 70 },
      ],
      Cadastros_Vendedores: [
        { Nome: "Amanda", CPF: "12345678901", Setor: "Peças" },
        { Nome: "Bruno", CPF: "98765432100", Setor: "Acessórios" },
      ],
      Comissão_Vendedores: [
        { Vendedor: "Amanda", "Total Vendido": 220, Comissão: 11 },
        { Vendedor: "Bruno", "Total Vendido": 80, Comissão: 4 },
      ],
    };
    const context = {
      activeDataset: dataset,
      moduleMappings,
      workbookCatalog: catalog,
      reverseReport,
      knowledgeGraph,
      rules,
      rowProvider: async (sheetName: string) => rowsBySheet[sheetName] || [],
    };

    const totalVendido = await calculateMetric("totalVendido", context);
    const totalComissao = await calculateMetric("totalComissao", context);
    const vendedores = await calculateMetric("quantidadeVendedores", context);
    const clientes = await calculateMetric("quantidadeClientes", context);
    const produtos = await calculateMetric("quantidadeProdutos", context);
    const ticket = await calculateMetric("ticketMedio", context);
    const margem = await calculateMetric("margemCandidata", context);

    expect(totalVendido).toMatchObject({ status: "ready", value: 300, sheetName: "IMP_VENDAS", columnsUsed: ["Valor"] });
    expect(totalComissao).toMatchObject({ status: "ready", value: 15, sheetName: "Comissão_Vendedores", columnsUsed: ["Comissão"] });
    expect(vendedores.value).toBe(2);
    expect(clientes.value).toBe(2);
    expect(produtos.value).toBe(3);
    expect(ticket.value).toBe(100);
    expect(margem.value).toBe(120);
    expect(totalVendido.lineage.inputSheets).toContain("IMP_VENDAS");
    expect(totalVendido.lineage.inputColumns).toContain("Valor");

    const engine = new BusinessIntelligenceEngine(context);
    const moduleMetrics = await engine.calculateModuleMetrics("Comercial");
    const explanation = engine.explainMetric(moduleMetrics.find(metric => metric.name === "totalVendido")?.id || "");
    expect(explanation.evidence.join(" ")).toContain("Aba usada: IMP_VENDAS");
    expect(JSON.stringify(moduleMetrics)).not.toContain("Grupo Alpha");
    expect(JSON.stringify(moduleMetrics)).not.toContain("Topázio");
  });

  it("marks metrics pending when mapping is missing", async () => {
    const metric = await calculateMetric("totalVendido", {
      activeDataset: activeDataset("dataset-no-mapping"),
      moduleMappings: [],
    });

    expect(metric.status).toBe("pending");
    expect(metric.diagnostics.missingMappings).toContain("Comercial");
  });
});
