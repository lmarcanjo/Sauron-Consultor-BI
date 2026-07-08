import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { WorkbookEngine } from "../workbook";
import { workbookReverseEngineer } from "./WorkbookReverseEngineer";

const REAL_WORKBOOK_PATH = "/home/natalicorreia/Downloads/Teste_Automação_Peças Honda Faberge Mogi~06.26 Veiculo ativou.xlsx";
const runWithRealWorkbook = fs.existsSync(REAL_WORKBOOK_PATH) ? it : it.skip;

function roleSheets(report: ReturnType<typeof workbookReverseEngineer.generateReport>, roleName: string): string[] {
  return report.sheetRoles
    .filter(sheet => sheet.roles.some(role => role.role === roleName && role.confidence >= 0.45))
    .map(sheet => sheet.sheetName);
}

describe("WorkbookReverseEngineer with the real Honda workbook", () => {
  runWithRealWorkbook("identifies operational roles, formulas, dependencies, KPIs and risks", async () => {
    const buffer = fs.readFileSync(REAL_WORKBOOK_PATH);
    const catalog = await new WorkbookEngine().catalogArrayBuffer(buffer, {
      sourceName: path.basename(REAL_WORKBOOK_PATH),
      sourceSizeBytes: buffer.byteLength,
      previewRowsPerSheet: 5,
      profileRowsPerSheetLimit: 500,
    });
    const report = workbookReverseEngineer.generateReport(catalog);
    const entradas = roleSheets(report, "entrada");
    const relatorios = roleSheets(report, "relatorio");
    const calculos = roleSheets(report, "calculo");
    const cadastros = roleSheets(report, "cadastro");
    const comissoes = roleSheets(report, "comissao");

    expect(entradas).toEqual(expect.arrayContaining(["IMP_VENDAS_AT", "IMP_VENDAS", "Importacao_Detalhada"]));
    expect(relatorios).toEqual(expect.arrayContaining(["RVD_Pecas", "RVD_AC", "AN_Pecas"]));
    expect(calculos.length).toBeGreaterThan(5);
    expect(cadastros).toEqual(expect.arrayContaining(["Cadastros_Vendedores"]));
    expect(comissoes).toEqual(expect.arrayContaining(["Comissão_Vendedores"]));
    expect(report.formulaPatterns.totalFormulas).toBeGreaterThan(100000);
    expect(report.formulaPatterns.repeatedPatterns.length).toBeGreaterThan(0);
    expect(report.formulaPatterns.formulaTypeCounts.length).toBeGreaterThan(0);
    expect(report.dependencySummary.length).toBeGreaterThan(0);
    expect(report.dependencySummary[0].importance).toMatch(/high|medium|low/);
    expect(report.businessRuleCandidates.some(candidate => candidate.category === "commission")).toBe(true);
    expect(report.businessRuleCandidates.some(candidate => candidate.category === "aggregation")).toBe(true);
    expect(report.kpiCandidates.some(candidate => candidate.category === "commission")).toBe(true);
    expect(report.kpiCandidates.some(candidate => candidate.category === "sales")).toBe(true);
    expect(report.structuralRisks.some(risk => risk.id === "risk:formula-volume")).toBe(true);
    expect(report.structuralRisks.some(risk => risk.id === "risk:large-workbook")).toBe(true);
    expect(report.recommendations.length).toBeGreaterThan(3);
    expect(JSON.stringify(report)).not.toContain("Grupo Alpha");
    expect(JSON.stringify(report)).not.toContain("Topázio");
  }, 60000);
});
