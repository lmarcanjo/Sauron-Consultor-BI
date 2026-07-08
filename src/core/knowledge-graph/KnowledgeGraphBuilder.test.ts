import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { ModuleFieldMapping } from "../data/moduleMapping";
import { WorkbookEngine } from "../workbook";
import { workbookReverseEngineer } from "../workbook-reverse";
import {
  buildKnowledgeGraph,
  explainNode,
  findConsumers,
  findModuleInputs,
  findNodesByType,
  sheetNodeId,
} from "./index";
import { ActiveDataset } from "../../types/dataSource";

function createWorkbook(): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  const sales = XLSX.utils.aoa_to_sheet([
    ["Vendedor", "Produto", "Cliente", "Valor"],
    ["Amanda", "Filtro", "Cliente A", 100],
    ["Bruno", "Óleo", "Cliente B", 80],
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
    ["Amanda", null, null],
    ["Bruno", null, null],
  ]);
  commission.B2 = { t: "n", v: 100, f: "SOMASE(IMP_VENDAS!A:A,A2,IMP_VENDAS!D:D)" };
  commission.C2 = { t: "n", v: 5, f: "SEERRO(B2*0.05,0)" };
  commission.B3 = { t: "n", v: 80, f: "SOMASE(IMP_VENDAS!A:A,A3,IMP_VENDAS!D:D)" };
  commission.C3 = { t: "n", v: 4, f: "SEERRO(B3*0.05,0)" };
  commission["!ref"] = "A1:C3";
  XLSX.utils.book_append_sheet(workbook, commission, "Comissão_Vendedores");

  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

function activeDataset(datasetId: string): ActiveDataset {
  return {
    datasetId,
    sourceType: "SPREADSHEET_DATA",
    sourceName: "kg-synthetic.xlsx",
    importedAt: "2026-07-08T00:00:00.000Z",
    rowCount: 8,
    columnCount: 4,
    sheets: ["IMP_VENDAS", "Cadastros_Vendedores", "Comissão_Vendedores"],
    activeSheet: "IMP_VENDAS",
    previewRows: [],
    columnProfiles: [],
    importProfile: null,
    rawStorageRef: "indexeddb:kg-synthetic",
    status: "ACTIVE",
  };
}

function mappings(datasetId: string): ModuleFieldMapping[] {
  return [
    {
      projectId: "project-kg",
      datasetId,
      moduleName: "Comercial",
      sheetName: "IMP_VENDAS",
      selectedColumns: ["Vendedor", "Produto", "Cliente", "Valor"],
      semanticRoles: {
        seller: "Vendedor",
        product: "Produto",
        client: "Cliente",
        value: "Valor",
      },
      updatedAt: "2026-07-08T00:00:00.000Z",
    },
    {
      projectId: "project-kg",
      datasetId,
      moduleName: "Pessoas",
      sheetName: "Cadastros_Vendedores",
      selectedColumns: ["Nome", "CPF", "Setor"],
      semanticRoles: {
        name: "Nome",
        cpf: "CPF",
        department: "Setor",
      },
      updatedAt: "2026-07-08T00:00:00.000Z",
    },
    {
      projectId: "project-kg",
      datasetId,
      moduleName: "Comissão",
      sheetName: "Comissão_Vendedores",
      selectedColumns: ["Vendedor", "Total Vendido", "Comissão"],
      semanticRoles: {
        seller: "Vendedor",
        base: "Total Vendido",
        amount: "Comissão",
      },
      updatedAt: "2026-07-08T00:00:00.000Z",
    },
  ];
}

describe("Enterprise Knowledge Graph", () => {
  it("builds and queries a business graph without calculating formulas", async () => {
    const catalog = await new WorkbookEngine().catalogArrayBuffer(createWorkbook(), {
      sourceName: "kg-synthetic.xlsx",
      previewRowsPerSheet: 5,
      profileRowsPerSheetLimit: 20,
    });
    const reverseReport = workbookReverseEngineer.generateReport(catalog);
    const dataset = activeDataset("dataset-kg");
    const graph = buildKnowledgeGraph({
      workbookCatalog: catalog,
      reverseReport,
      activeDataset: dataset,
      moduleMappings: mappings(dataset.datasetId),
    });

    expect(findNodesByType(graph, "Workbook")).toHaveLength(1);
    expect(findNodesByType(graph, "Sheet").map(node => node.label)).toEqual(expect.arrayContaining([
      "IMP_VENDAS",
      "Cadastros_Vendedores",
      "Comissão_Vendedores",
    ]));
    expect(findNodesByType(graph, "Formula")).toHaveLength(4);
    expect(findNodesByType(graph, "BusinessRuleCandidate").length).toBeGreaterThan(0);
    expect(findNodesByType(graph, "KpiCandidate").length).toBeGreaterThan(0);
    expect(findNodesByType(graph, "ModuleMapping")).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "Mapeamento Comercial" }),
      expect.objectContaining({ label: "Mapeamento Pessoas" }),
      expect.objectContaining({ label: "Mapeamento Comissão" }),
    ]));

    const commercialInputs = findModuleInputs(graph, "Comercial");
    expect(commercialInputs.sheets.map(node => node.label)).toContain("IMP_VENDAS");
    expect(commercialInputs.columns.map(node => node.label)).toEqual(expect.arrayContaining(["Produto", "Cliente", "Valor"]));
    expect(commercialInputs.semanticConcepts.map(node => node.type)).toEqual(expect.arrayContaining(["Seller", "Product", "Customer", "Revenue"]));

    const peopleInputs = findModuleInputs(graph, "Pessoas");
    expect(peopleInputs.sheets.map(node => node.label)).toContain("Cadastros_Vendedores");

    const commissionConcept = findNodesByType(graph, "Commission")[0];
    const commissionExplanation = explainNode(graph, commissionConcept.id);
    expect(commissionExplanation.summary).toContain("Commission");
    expect(commissionExplanation.consumers.length + commissionExplanation.dependencies.length).toBeGreaterThan(0);

    const salesSheetId = sheetNodeId(catalog.id, "IMP_VENDAS");
    const salesConsumers = findConsumers(graph, salesSheetId);
    expect(salesConsumers.some(node => node.type === "Formula")).toBe(true);
    expect(JSON.stringify(graph)).not.toContain("Grupo Alpha");
    expect(JSON.stringify(graph)).not.toContain("Topázio");
  });
});
