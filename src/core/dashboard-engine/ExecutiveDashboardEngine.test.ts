import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { ModuleFieldMapping } from "../data/moduleMapping";
import { buildKnowledgeGraph } from "../knowledge-graph";
import { RuleEngine } from "../rule-engine";
import { WorkbookEngine } from "../workbook";
import { workbookReverseEngineer } from "../workbook-reverse";
import { ActiveDataset } from "../../types/dataSource";
import { buildExecutiveDashboard, buildModuleDashboard, explainDashboardBlock, getDashboardLineage } from "./index";

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
    sourceName: "dashboard-engine-synthetic.xlsx",
    importedAt: "2026-07-08T00:00:00.000Z",
    rowCount: 8,
    columnCount: 5,
    sheets: ["IMP_VENDAS", "Cadastros_Vendedores", "Comissão_Vendedores"],
    activeSheet: "IMP_VENDAS",
    previewRows: [],
    columnProfiles: [],
    importProfile: null,
    rawStorageRef: "test:dashboard-engine",
    status: "ACTIVE",
  };
}

function mappings(datasetId: string): ModuleFieldMapping[] {
  return [
    {
      projectId: "dashboard",
      datasetId,
      moduleName: "Comercial",
      sheetName: "IMP_VENDAS",
      selectedColumns: ["Vendedor", "Produto", "Cliente", "Valor", "Custo"],
      semanticRoles: { seller: "Vendedor", product: "Produto", client: "Cliente", value: "Valor", cost: "Custo" },
      updatedAt: "2026-07-08T00:00:00.000Z",
    },
    {
      projectId: "dashboard",
      datasetId,
      moduleName: "Pessoas",
      sheetName: "Cadastros_Vendedores",
      selectedColumns: ["Nome", "CPF", "Setor"],
      semanticRoles: { name: "Nome", cpf: "CPF", department: "Setor" },
      updatedAt: "2026-07-08T00:00:00.000Z",
    },
    {
      projectId: "dashboard",
      datasetId,
      moduleName: "Comissão",
      sheetName: "Comissão_Vendedores",
      selectedColumns: ["Vendedor", "Total Vendido", "Comissão"],
      semanticRoles: { seller: "Vendedor", base: "Total Vendido", amount: "Comissão" },
      updatedAt: "2026-07-08T00:00:00.000Z",
    },
  ];
}

describe("Executive Dashboard Engine", () => {
  it("builds reusable executive blocks from auditable business metrics", async () => {
    const catalog = await new WorkbookEngine().catalogArrayBuffer(createWorkbook(), {
      sourceName: "dashboard-engine-synthetic.xlsx",
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

    const executive = await buildExecutiveDashboard(context);
    const metricCards = executive.blocks.filter(block => block.type === "MetricCard");
    const totalVendido = metricCards.find(block => (block.data as any).metricName === "totalVendido");
    const totalComissao = metricCards.find(block => (block.data as any).metricName === "totalComissao");
    const vendedores = metricCards.find(block => (block.data as any).metricName === "quantidadeVendedores");
    const ticket = metricCards.find(block => (block.data as any).metricName === "ticketMedio");

    expect(totalVendido?.status).toBe("ready");
    expect((totalVendido?.data as any).value).toBe(300);
    expect(totalComissao?.status).toBe("ready");
    expect((totalComissao?.data as any).value).toBe(15);
    expect((vendedores?.data as any).value).toBe(2);
    expect((ticket?.data as any).value).toBe(100);
    expect(totalVendido?.lineage.inputSheets).toContain("IMP_VENDAS");
    expect(totalVendido?.lineage.inputColumns).toContain("Valor");

    const commercial = await buildModuleDashboard("Comercial", context);
    const sellerRanking = commercial.blocks.find(block => block.type === "RankingBlock" && block.title === "Top vendedores");
    const preview = commercial.blocks.find(block => block.type === "TableBlock");
    expect(sellerRanking?.status).toBe("ready");
    expect(((sellerRanking?.data as any).items || [])[0].label).toBe("Amanda");
    expect(preview?.status).toBe("ready");

    const people = await buildModuleDashboard("Pessoas", context);
    expect(people.blocks.some(block => block.type === "MetricCard" && (block.data as any).metricName === "quantidadeVendedores")).toBe(true);
    expect(people.blocks.some(block => block.type === "RankingBlock" && block.status === "ready")).toBe(true);

    const lineage = getDashboardLineage(totalVendido?.id || "", executive);
    const explanation = explainDashboardBlock(totalVendido?.id || "", executive);
    expect(lineage?.metricIds).toContain("metric:" + dataset.datasetId + ":Comercial:totalVendido");
    expect(explanation.evidence.join(" ")).toContain("Abas: IMP_VENDAS");
  });
});
