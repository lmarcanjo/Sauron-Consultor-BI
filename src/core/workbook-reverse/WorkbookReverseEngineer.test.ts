import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { WorkbookEngine } from "../workbook";
import { workbookReverseEngineer } from "./WorkbookReverseEngineer";

function createSyntheticWorkbook(): ArrayBuffer {
  const workbook = XLSX.utils.book_new();

  const sales = XLSX.utils.aoa_to_sheet([
    ["Vendedor", "Produto", "Valor"],
    ["Amanda", "Filtro", 100],
    ["Bruno", "Óleo", 80],
    ["Amanda", "Pneu", 120],
  ]);
  XLSX.utils.book_append_sheet(workbook, sales, "IMP_VENDAS");

  const sellers = XLSX.utils.aoa_to_sheet([
    ["Nome", "CPF", "Setor"],
    ["Amanda", "12345678901", "Peças"],
    ["Bruno", "98765432100", "Acessórios"],
  ]);
  XLSX.utils.book_append_sheet(workbook, sellers, "Cadastros_Vendedores");

  const commission = XLSX.utils.aoa_to_sheet([
    ["Vendedor", "Total Vendido", "Comissão"],
    ["Amanda", null, null],
    ["Bruno", null, null],
  ]);
  commission.B2 = { t: "n", v: 220, f: "SOMASE(IMP_VENDAS!A:A,A2,IMP_VENDAS!C:C)" };
  commission.C2 = { t: "n", v: 11, f: "SEERRO(B2*0.05,0)" };
  commission.B3 = { t: "n", v: 80, f: "SOMASE(IMP_VENDAS!A:A,A3,IMP_VENDAS!C:C)" };
  commission.C3 = { t: "n", v: 4, f: "SEERRO(B3*0.05,0)" };
  commission["!ref"] = "A1:C3";
  XLSX.utils.book_append_sheet(workbook, commission, "Comissão_Vendedores");

  const report = XLSX.utils.aoa_to_sheet([
    ["Indicador", "Valor"],
    ["Total vendido", null],
    ["Vendedores", null],
  ]);
  report.B2 = { t: "n", v: 300, f: "SOMA(IMP_VENDAS!C:C)" };
  report.B3 = { t: "n", v: 2, f: "CONT.SE(IMP_VENDAS!A:A,\"*\")" };
  report["!ref"] = "A1:B3";
  XLSX.utils.book_append_sheet(workbook, report, "RVD_Pecas");

  const dre = XLSX.utils.aoa_to_sheet([
    ["Receita", "Custo", "Lucro"],
    [null, 150, null],
  ]);
  dre.A2 = { t: "n", v: 300, f: "RVD_Pecas!B2" };
  dre.C2 = { t: "n", v: 150, f: "A2-B2" };
  dre["!ref"] = "A1:C2";
  XLSX.utils.book_append_sheet(workbook, dre, "DRE");

  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

describe("WorkbookReverseEngineer", () => {
  it("reverse engineers sheet roles, formula patterns and candidates without calculating formulas", async () => {
    const engine = new WorkbookEngine();
    const catalog = await engine.catalogArrayBuffer(createSyntheticWorkbook(), {
      sourceName: "reverse-synthetic.xlsx",
      previewRowsPerSheet: 5,
      profileRowsPerSheetLimit: 20,
    });

    const report = workbookReverseEngineer.generateReport(catalog);
    const roles = new Map(report.sheetRoles.map(sheet => [sheet.sheetName, sheet]));

    expect(roles.get("IMP_VENDAS")?.primaryRole).toBe("entrada");
    expect(roles.get("Cadastros_Vendedores")?.primaryRole).toBe("cadastro");
    expect(roles.get("Comissão_Vendedores")?.primaryRole).toBe("comissao");
    expect(roles.get("RVD_Pecas")?.roles.some(role => role.role === "relatorio")).toBe(true);
    expect(roles.get("DRE")?.primaryRole).toBe("dre");

    expect(report.formulaPatterns.totalFormulas).toBe(8);
    expect(report.formulaPatterns.repeatedPatterns.some(pattern => pattern.type === "SOMASE" && pattern.occurrences === 2)).toBe(true);
    expect(report.formulaPatterns.repeatedPatterns.some(pattern => pattern.type === "SEERRO" && pattern.occurrences === 2)).toBe(true);
    expect(report.dependencySummary.some(item => item.from === "Comissão_Vendedores" && item.to === "IMP_VENDAS")).toBe(true);
    expect(report.businessRuleCandidates.some(candidate => candidate.category === "commission")).toBe(true);
    expect(report.businessRuleCandidates.some(candidate => candidate.category === "aggregation")).toBe(true);
    expect(report.kpiCandidates.some(candidate => candidate.category === "commission")).toBe(true);
    expect(report.kpiCandidates.some(candidate => candidate.category === "dre")).toBe(true);
    expect(JSON.stringify(report)).toContain("SOMASE");
    expect(JSON.stringify(report)).not.toContain("mock");
    expect(JSON.stringify(report)).not.toContain("demo");
  });
});
