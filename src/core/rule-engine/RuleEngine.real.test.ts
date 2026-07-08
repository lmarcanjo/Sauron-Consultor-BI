import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ModuleFieldMapping, ModuleName } from "../data/moduleMapping";
import { buildKnowledgeGraph } from "../knowledge-graph";
import { WorkbookCatalog, WorkbookEngine } from "../workbook";
import { workbookReverseEngineer } from "../workbook-reverse";
import { RuleEngine } from "./RuleEngine";

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
  return found?.originalName || catalog.columns.find(column => column.sheetName === sheetName && column.originalName)?.originalName || "Coluna não encontrada";
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
    projectId: "honda-rule-engine",
    datasetId: params.datasetId,
    moduleName: params.moduleName,
    sheetName: params.sheetName,
    selectedColumns: unique(Object.values(params.semanticRoles)),
    semanticRoles: params.semanticRoles,
    updatedAt: "2026-07-08T00:00:00.000Z",
  };
}

function buildMappings(catalog: WorkbookCatalog): ModuleFieldMapping[] {
  return [
    mapping({
      datasetId: catalog.id,
      moduleName: "Comercial",
      sheetName: "IMP_VENDAS_AT",
      semanticRoles: {
        seller: findColumn(catalog, "IMP_VENDAS_AT", [/vendedor/, /consultor/]),
        product: findColumn(catalog, "IMP_VENDAS_AT", [/produto/, /item/, /peca/, /codigo/, /descricao/]),
        client: findColumn(catalog, "IMP_VENDAS_AT", [/cliente/, /comprador/, /cpf/, /cnpj/]),
        value: findColumn(catalog, "IMP_VENDAS_AT", [/valor/, /venda/, /total/, /bruto/, /liquido/]),
      },
    }),
    mapping({
      datasetId: catalog.id,
      moduleName: "Pessoas",
      sheetName: "Cadastros_Vendedores",
      semanticRoles: {
        name: findColumn(catalog, "Cadastros_Vendedores", [/nome/, /vendedor/, /consultor/, /funcionario/]),
        cpf: findColumn(catalog, "Cadastros_Vendedores", [/cpf/]),
        department: findColumn(catalog, "Cadastros_Vendedores", [/setor/, /departamento/, /cargo/, /funcao/]),
      },
    }),
    mapping({
      datasetId: catalog.id,
      moduleName: "Comissão",
      sheetName: "Comissão_Vendedores",
      semanticRoles: {
        seller: findColumn(catalog, "Comissão_Vendedores", [/nome/, /vendedor/, /consultor/]),
        base: findColumn(catalog, "Comissão_Vendedores", [/base/, /valor/, /venda/, /total/, /fatur/]),
        amount: findColumn(catalog, "Comissão_Vendedores", [/comissao/, /comiss/]),
      },
    }),
  ];
}

describe("Formula & Rule Engine with the real Honda workbook", () => {
  runWithRealWorkbook("extracts and explains formula-backed business rules", async () => {
    const buffer = fs.readFileSync(REAL_WORKBOOK_PATH);
    const catalog = await new WorkbookEngine().catalogArrayBuffer(buffer, {
      sourceName: path.basename(REAL_WORKBOOK_PATH),
      sourceSizeBytes: buffer.byteLength,
      previewRowsPerSheet: 5,
      profileRowsPerSheetLimit: 500,
    });
    const reverseReport = workbookReverseEngineer.generateReport(catalog);
    const knowledgeGraph = buildKnowledgeGraph({
      workbookCatalog: catalog,
      reverseReport,
      moduleMappings: buildMappings(catalog),
    });
    const engine = new RuleEngine({ workbookCatalog: catalog, reverseReport, knowledgeGraph });
    const rules = engine.listRules();
    const commissionRule = rules.find(rule => rule.category === "commission");
    const lookupRules = rules.filter(rule => rule.formulas.some(formula => formula.classification === "lookup"));
    const conditionalRules = rules.filter(rule => rule.formulas.some(formula => formula.classification === "conditional" || formula.classification === "errorHandling"));
    const vendasRules = rules.filter(rule => rule.category === "sales" || rule.category === "aggregation");
    const impVendasRules = rules.filter(rule => rule.dependencies.some(dep => dep.type === "sheet" && dep.label === "IMP_VENDAS"));

    expect(commissionRule).toBeTruthy();
    expect(commissionRule?.formulas.length).toBeGreaterThan(0);
    expect(commissionRule?.impactedModules).toEqual(expect.arrayContaining(["Comissão"]));
    expect(vendasRules.length).toBeGreaterThan(0);
    expect(lookupRules.length).toBeGreaterThan(0);
    expect(conditionalRules.length).toBeGreaterThan(0);
    expect(impVendasRules.length).toBeGreaterThan(0);

    const explanation = engine.explainRule(commissionRule?.id || "");
    expect(explanation.summary).toMatch(/commission|comissão/i);
    expect(explanation.formulas.length).toBeGreaterThan(0);
    expect(explanation.impactedModules).toEqual(expect.arrayContaining(["Comissão"]));
    expect(explanation.evidence.join(" ")).toMatch(/Comissão|comissão|formula|fórmula/i);
    expect(JSON.stringify(rules)).not.toContain("Grupo Alpha");
    expect(JSON.stringify(rules)).not.toContain("Topázio");
  }, 90000);
});
