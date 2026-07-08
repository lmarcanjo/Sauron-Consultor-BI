import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { ModuleFieldMapping } from "../data/moduleMapping";
import { buildKnowledgeGraph } from "../knowledge-graph";
import { WorkbookEngine } from "../workbook";
import { workbookReverseEngineer } from "../workbook-reverse";
import { classifyFormula, parseFormula, RuleEngine } from "./index";

function createWorkbook(): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  const sales = XLSX.utils.aoa_to_sheet([
    ["Vendedor", "Produto", "Cliente", "Valor"],
    ["Amanda", "Filtro", "Cliente A", 100],
    ["Bruno", "Óleo", "Cliente B", 80],
  ]);
  XLSX.utils.book_append_sheet(workbook, sales, "IMP_VENDAS");

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

function mappings(datasetId: string): ModuleFieldMapping[] {
  return [
    {
      projectId: "rule-engine",
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
      projectId: "rule-engine",
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

describe("Formula & Rule Engine", () => {
  it("parses and classifies formulas without executing them", () => {
    const parsed = parseFormula("SEERRO(PROCV(A2,IMP_VENDAS!A:D,4,FALSO),0)");

    expect(parsed.mainFunction).toBe("SEERRO");
    expect(parsed.internalFunctions).toContain("PROCV");
    expect(parsed.referencedSheets).toContain("IMP_VENDAS");
    expect(parsed.ranges.some(range => range.raw === "IMP_VENDAS!A:D")).toBe(true);
    expect(parsed.constants.map(item => item.raw)).toEqual(expect.arrayContaining(["4", "FALSO", "0"]));
    expect(classifyFormula(parsed).classification).toBe("errorHandling");
    expect(classifyFormula(parseFormula("SOMASE(IMP_VENDAS!A:A,A2,IMP_VENDAS!D:D)")).classification).toBe("aggregation");
    expect(classifyFormula(parseFormula("PROCV(A2,Cadastro!A:D,4,FALSO)")).classification).toBe("lookup");
    expect(classifyFormula(parseFormula("SE(A2>0,\"ok\",\"não\")")).classification).toBe("conditional");
    expect(classifyFormula(parseFormula("A2*0.05")).classification).toBe("arithmetic");
  });

  it("extracts reusable business rules and explains commission", async () => {
    const catalog = await new WorkbookEngine().catalogArrayBuffer(createWorkbook(), {
      sourceName: "rule-engine.xlsx",
      previewRowsPerSheet: 5,
      profileRowsPerSheetLimit: 20,
    });
    const reverseReport = workbookReverseEngineer.generateReport(catalog);
    const graph = buildKnowledgeGraph({
      workbookCatalog: catalog,
      reverseReport,
      moduleMappings: mappings(catalog.id),
    });
    const engine = new RuleEngine({ workbookCatalog: catalog, reverseReport, knowledgeGraph: graph });
    const rules = engine.listRules();
    const commissionRule = rules.find(rule => rule.category === "commission");

    expect(commissionRule).toBeTruthy();
    expect(rules.some(rule => rule.formulas.some(formula => formula.classification === "aggregation"))).toBe(true);
    expect(rules.some(rule => rule.formulas.some(formula => formula.classification === "errorHandling"))).toBe(true);
    expect(commissionRule?.formulas.length).toBeGreaterThan(0);
    expect(commissionRule?.impactedModules).toEqual(expect.arrayContaining(["Comissão"]));

    const explanation = engine.explainRule(commissionRule?.id || "");
    expect(explanation.summary).toContain("commission");
    expect(explanation.inputs.some(input => input.label === "IMP_VENDAS")).toBe(true);
    expect(explanation.diagnostics?.requiresConsultantReview).toBe(true);
    expect(JSON.stringify(explanation)).not.toContain("Grupo Alpha");
    expect(JSON.stringify(explanation)).not.toContain("Topázio");
  });
});
