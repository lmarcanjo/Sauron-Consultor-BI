import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ModuleFieldMapping, ModuleName } from "../data/moduleMapping";
import { WorkbookCatalog, WorkbookEngine } from "../workbook";
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

const REAL_WORKBOOK_PATH = "/home/natalicorreia/Downloads/Teste_Automação_Peças Honda Faberge Mogi~06.26 Veiculo ativou.xlsx";
const runWithRealWorkbook = fs.existsSync(REAL_WORKBOOK_PATH) ? it : it.skip;

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function findColumn(catalog: WorkbookCatalog, sheetName: string, patterns: RegExp[]): string {
  const found = catalog.columns.find(column => (
    column.sheetName === sheetName &&
    column.originalName &&
    patterns.some(pattern => pattern.test(normalize(column.originalName)))
  ));
  if (found) return found.originalName;

  const fallback = catalog.columns.find(column => column.sheetName === sheetName && column.originalName);
  return fallback?.originalName || "Coluna não encontrada";
}

function unique(values: string[]): string[] {
  return values.filter((value, index, all) => value && all.indexOf(value) === index);
}

function mapping(params: {
  datasetId: string;
  moduleName: ModuleName;
  sheetName: string;
  semanticRoles: Record<string, string>;
}): ModuleFieldMapping {
  return {
    projectId: "honda-real",
    datasetId: params.datasetId,
    moduleName: params.moduleName,
    sheetName: params.sheetName,
    selectedColumns: unique(Object.values(params.semanticRoles)),
    semanticRoles: params.semanticRoles,
    updatedAt: "2026-07-08T00:00:00.000Z",
  };
}

function activeDatasetFromCatalog(catalog: WorkbookCatalog): ActiveDataset {
  return {
    datasetId: catalog.id,
    sourceType: "SPREADSHEET_DATA",
    sourceName: catalog.metadata.name,
    importedAt: catalog.metadata.importedAt,
    rowCount: catalog.metadata.rowCount,
    columnCount: catalog.metadata.columnCount,
    sheets: catalog.sheets.map(sheet => sheet.name),
    activeSheet: "IMP_VENDAS_AT",
    previewRows: [],
    columnProfiles: [],
    importProfile: null,
    rawStorageRef: `workbook:${catalog.id}`,
    status: "ACTIVE",
  };
}

function buildRealMappings(catalog: WorkbookCatalog): ModuleFieldMapping[] {
  const datasetId = catalog.id;
  const commercialSheet = "IMP_VENDAS_AT";
  const peopleSheet = "Cadastros_Vendedores";
  const commissionSheet = "Comissão_Vendedores";

  return [
    mapping({
      datasetId,
      moduleName: "Comercial",
      sheetName: commercialSheet,
      semanticRoles: {
        seller: findColumn(catalog, commercialSheet, [/vendedor/, /consultor/]),
        product: findColumn(catalog, commercialSheet, [/produto/, /item/, /peca/, /codigo/, /descricao/]),
        client: findColumn(catalog, commercialSheet, [/cliente/, /comprador/, /cpf/, /cnpj/]),
        value: findColumn(catalog, commercialSheet, [/valor/, /venda/, /total/, /bruto/, /liquido/]),
      },
    }),
    mapping({
      datasetId,
      moduleName: "Pessoas",
      sheetName: peopleSheet,
      semanticRoles: {
        name: findColumn(catalog, peopleSheet, [/nome/, /vendedor/, /consultor/, /funcionario/]),
        cpf: findColumn(catalog, peopleSheet, [/cpf/]),
        department: findColumn(catalog, peopleSheet, [/setor/, /departamento/, /cargo/, /funcao/]),
      },
    }),
    mapping({
      datasetId,
      moduleName: "Comissão",
      sheetName: commissionSheet,
      semanticRoles: {
        seller: findColumn(catalog, commissionSheet, [/nome/, /vendedor/, /consultor/]),
        base: findColumn(catalog, commissionSheet, [/base/, /valor/, /venda/, /total/, /fatur/]),
        amount: findColumn(catalog, commissionSheet, [/comissao/, /comiss/]),
      },
    }),
  ];
}

describe("Enterprise Knowledge Graph with the real Honda workbook", () => {
  runWithRealWorkbook("connects workbook, reverse report and module mappings", async () => {
    const buffer = fs.readFileSync(REAL_WORKBOOK_PATH);
    const catalog = await new WorkbookEngine().catalogArrayBuffer(buffer, {
      sourceName: path.basename(REAL_WORKBOOK_PATH),
      sourceSizeBytes: buffer.byteLength,
      previewRowsPerSheet: 5,
      profileRowsPerSheetLimit: 500,
    });
    const reverseReport = workbookReverseEngineer.generateReport(catalog);
    const dataset = activeDatasetFromCatalog(catalog);
    const graph = buildKnowledgeGraph({
      workbookCatalog: catalog,
      reverseReport,
      activeDataset: dataset,
      moduleMappings: buildRealMappings(catalog),
    });

    expect(findNodesByType(graph, "Workbook")).toHaveLength(1);
    expect(findNodesByType(graph, "Sheet").length).toBeGreaterThanOrEqual(18);
    expect(findNodesByType(graph, "Column").length).toBeGreaterThanOrEqual(180);
    expect(findNodesByType(graph, "Formula").length).toBeGreaterThan(100000);
    expect(findNodesByType(graph, "BusinessRuleCandidate").length).toBeGreaterThan(0);
    expect(findNodesByType(graph, "KpiCandidate").length).toBeGreaterThan(0);
    expect(findNodesByType(graph, "ModuleMapping").some(node => node.label === "Mapeamento Comercial")).toBe(true);
    expect(findNodesByType(graph, "ModuleMapping").some(node => node.label === "Mapeamento Pessoas")).toBe(true);
    expect(findNodesByType(graph, "ModuleMapping").some(node => node.label === "Mapeamento Comissão")).toBe(true);
    expect(graph.edges.some(edge => edge.type === "FEEDS_MODULE")).toBe(true);
    expect(graph.edges.some(edge => edge.type === "DEPENDS_ON")).toBe(true);

    const commissionNode = findNodesByType(graph, "Commission")[0];
    const commissionExplanation = explainNode(graph, commissionNode.id);
    expect(commissionExplanation.evidence.join(" ")).toMatch(/Comissão|comissão|commission/i);

    const peopleInputs = findModuleInputs(graph, "Pessoas");
    expect(peopleInputs.sheets.map(node => node.label)).toContain("Cadastros_Vendedores");
    expect(peopleInputs.columns.length).toBeGreaterThan(0);

    const commercialInputs = findModuleInputs(graph, "Comercial");
    expect(commercialInputs.sheets.map(node => node.label)).toContain("IMP_VENDAS_AT");
    expect(commercialInputs.columns.length).toBeGreaterThan(0);

    const vendasSheetId = sheetNodeId(catalog.id, "IMP_VENDAS");
    const vendasConsumers = findConsumers(graph, vendasSheetId);
    expect(vendasConsumers.some(node => node.type === "Formula")).toBe(true);
    expect(graph.diagnostics.warnings.join(" ")).not.toContain("mock");
    expect(graph.diagnostics.warnings.join(" ")).not.toContain("demo");
  }, 90000);
});
