import { WorkbookCatalog, WorkbookFormulaCatalogItem } from "../workbook";
import { detectBusinessRuleCandidates } from "./BusinessRuleCandidateDetector";
import { analyzeFormulaPatterns } from "./FormulaPatternAnalyzer";
import { detectKpiCandidates } from "./KpiCandidateDetector";
import { classifyWorkbookSheets } from "./SheetRoleClassifier";
import { analyzeWorkbookRisks } from "./WorkbookRiskAnalyzer";
import {
  SheetDependencySummary,
  SheetRole,
  SheetRoleClassification,
  WorkbookReverseEngineeringReport,
} from "./WorkbookReverseTypes";

function extractSheetName(reference: string): string | null {
  const bang = reference.indexOf("!");
  if (bang === -1) return null;
  return reference.slice(0, bang).replace(/^'/, "").replace(/'$/, "").trim();
}

function dependencyImportance(count: number, formulaTypeCount: number): SheetDependencySummary["importance"] {
  if (count >= 1000 || formulaTypeCount >= 5) return "high";
  if (count >= 100 || formulaTypeCount >= 3) return "medium";
  return "low";
}

function buildDependencySummary(catalog: WorkbookCatalog, limit = 50): SheetDependencySummary[] {
  const groups = new Map<string, {
    from: string;
    to: string;
    count: number;
    formulaTypes: Set<string>;
    sampleEvidence: string[];
  }>();

  function addFormulaDependency(formula: WorkbookFormulaCatalogItem, to: string): void {
    if (!to || to === formula.sheetName) return;
    const key = `${formula.sheetName}::${to}`;
    const current = groups.get(key) || {
      from: formula.sheetName,
      to,
      count: 0,
      formulaTypes: new Set<string>(),
      sampleEvidence: [],
    };
    current.count += 1;
    current.formulaTypes.add(formula.type);
    if (current.sampleEvidence.length < 5) current.sampleEvidence.push(`${formula.cell}: ${formula.formula}`);
    groups.set(key, current);
  }

  catalog.formulas.forEach(formula => {
    formula.dependencies
      .map(extractSheetName)
      .filter((sheetName): sheetName is string => Boolean(sheetName))
      .forEach(sheetName => addFormulaDependency(formula, sheetName));
  });

  catalog.namedRanges.forEach(namedRange => {
    const to = extractSheetName(namedRange.refersTo);
    if (!namedRange.sheetName || !to || namedRange.sheetName === to) return;
    const key = `${namedRange.sheetName}::${to}`;
    const current = groups.get(key) || {
      from: namedRange.sheetName,
      to,
      count: 0,
      formulaTypes: new Set<string>(),
      sampleEvidence: [],
    };
    current.count += 1;
    current.formulaTypes.add("namedRange");
    if (current.sampleEvidence.length < 5) current.sampleEvidence.push(`${namedRange.name}: ${namedRange.refersTo}`);
    groups.set(key, current);
  });

  return Array.from(groups.values())
    .map(group => {
      const formulaTypes = Array.from(group.formulaTypes).sort();
      return {
        from: group.from,
        to: group.to,
        count: group.count,
        formulaTypes,
        sampleEvidence: group.sampleEvidence,
        importance: dependencyImportance(group.count, formulaTypes.length),
      };
    })
    .sort((a, b) => b.count - a.count || b.formulaTypes.length - a.formulaTypes.length)
    .slice(0, limit);
}

function sheetsByRole(sheetRoles: SheetRoleClassification[], role: SheetRole): string[] {
  return sheetRoles
    .filter(sheet => sheet.roles.some(item => item.role === role && item.confidence >= 0.45))
    .map(sheet => sheet.sheetName);
}

function buildRecommendations(params: {
  sheetRoles: SheetRoleClassification[];
  dependencySummary: SheetDependencySummary[];
}): string[] {
  const entrada = sheetsByRole(params.sheetRoles, "entrada");
  const calculo = sheetsByRole(params.sheetRoles, "calculo");
  const relatorio = sheetsByRole(params.sheetRoles, "relatorio");
  const cadastro = sheetsByRole(params.sheetRoles, "cadastro");
  const comissao = sheetsByRole(params.sheetRoles, "comissao");
  const dre = sheetsByRole(params.sheetRoles, "dre");
  const recommendations = [
    "Validar com o consultor quais abas são fonte oficial e quais são derivadas antes de automatizar qualquer regra.",
    "Transformar fórmulas repetidas em candidatos de regra somente após confirmar exceções manuais.",
    "Priorizar dependências de alta importância ao desenhar a futura engine de cálculo.",
  ];

  if (entrada.length > 0) recommendations.push(`Tratar como candidatas a entrada: ${entrada.slice(0, 8).join(", ")}.`);
  if (cadastro.length > 0) recommendations.push(`Conferir cadastros oficiais: ${cadastro.slice(0, 8).join(", ")}.`);
  if (calculo.length > 0) recommendations.push(`Revisar abas de cálculo antes de migrar fórmulas: ${calculo.slice(0, 8).join(", ")}.`);
  if (relatorio.length > 0) recommendations.push(`Usar relatórios como validação de saída, não como fonte primária: ${relatorio.slice(0, 8).join(", ")}.`);
  if (comissao.length > 0) recommendations.push(`Mapear comissão com o consultor antes de gerar regra executável: ${comissao.slice(0, 8).join(", ")}.`);
  if (dre.length === 0) recommendations.push("DRE explícita não foi identificada com alta confiança; tratar DRE como configuração pendente até validação humana.");
  if (params.dependencySummary[0]) {
    recommendations.push(`Revisar primeiro a dependência ${params.dependencySummary[0].from} -> ${params.dependencySummary[0].to}.`);
  }

  return recommendations;
}

export class WorkbookReverseEngineer {
  generateReport(catalog: WorkbookCatalog): WorkbookReverseEngineeringReport {
    const sheetRoles = classifyWorkbookSheets(catalog);
    const formulaPatterns = analyzeFormulaPatterns(catalog);
    const dependencySummary = buildDependencySummary(catalog);
    const businessRuleCandidates = detectBusinessRuleCandidates({ catalog, sheetRoles, formulaPatterns });
    const kpiCandidates = detectKpiCandidates(catalog, sheetRoles);
    const structuralRisks = analyzeWorkbookRisks({ catalog, sheetRoles, formulaPatterns, dependencySummary });

    return {
      workbookId: catalog.id,
      generatedAt: new Date().toISOString(),
      sheetRoles,
      formulaPatterns,
      businessRuleCandidates,
      kpiCandidates,
      dependencySummary,
      structuralRisks,
      recommendations: buildRecommendations({ sheetRoles, dependencySummary }),
    };
  }
}

export const workbookReverseEngineer = new WorkbookReverseEngineer();
