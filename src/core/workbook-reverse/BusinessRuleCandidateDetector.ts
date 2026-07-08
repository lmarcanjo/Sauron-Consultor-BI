import { WorkbookCatalog } from "../workbook";
import {
  BusinessRuleCandidate,
  FormulaPatternAnalysis,
  SheetRole,
  SheetRoleClassification,
} from "./WorkbookReverseTypes";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function countFormulaTypes(patterns: FormulaPatternAnalysis, types: string[]): number {
  const wanted = new Set(types);
  return patterns.formulaTypeCounts
    .filter(item => wanted.has(item.type))
    .reduce((total, item) => total + item.count, 0);
}

function sheetsForRole(sheetRoles: SheetRoleClassification[], role: SheetRole): string[] {
  return sheetRoles
    .filter(sheet => sheet.roles.some(item => item.role === role && item.confidence >= 0.45))
    .map(sheet => sheet.sheetName);
}

function columnsMatching(catalog: WorkbookCatalog, patterns: RegExp[]): Array<{ sheetName: string; columnName: string }> {
  return catalog.columns
    .filter(column => patterns.some(pattern => pattern.test(normalize(column.originalName))))
    .map(column => ({ sheetName: column.sheetName, columnName: column.originalName }));
}

function unique(values: string[]): string[] {
  return values.filter((value, index, all) => value && all.indexOf(value) === index);
}

function candidate(params: Omit<BusinessRuleCandidate, "requiresConsultantReview">): BusinessRuleCandidate {
  return {
    ...params,
    requiresConsultantReview: true,
  };
}

export function detectBusinessRuleCandidates(params: {
  catalog: WorkbookCatalog;
  sheetRoles: SheetRoleClassification[];
  formulaPatterns: FormulaPatternAnalysis;
}): BusinessRuleCandidate[] {
  const { catalog, sheetRoles, formulaPatterns } = params;
  const candidates: BusinessRuleCandidate[] = [];
  const lookupCount = countFormulaTypes(formulaPatterns, ["PROCV", "XLOOKUP", "ÍNDICE", "INDICE", "CORRESP"]);
  const conditionalCount = countFormulaTypes(formulaPatterns, ["SE", "SEERRO"]);
  const aggregationCount = countFormulaTypes(formulaPatterns, ["SOMASE", "SOMASES", "CONT.SE", "CONT.SES", "SUBTOTAL", "AGREGAR", "SOMA"]);
  const indirectCount = countFormulaTypes(formulaPatterns, ["INDIRETO", "DESLOC"]);
  const commissionSheets = sheetsForRole(sheetRoles, "comissao");
  const dreSheets = sheetsForRole(sheetRoles, "dre");
  const reportSheets = sheetsForRole(sheetRoles, "relatorio");
  const registrySheets = sheetsForRole(sheetRoles, "cadastro");
  const commissionColumns = columnsMatching(catalog, [/comissao/, /premio/, /bonificacao/, /percentual/]);
  const financialColumns = columnsMatching(catalog, [/receita/, /despesa/, /custo/, /lucro/, /margem/, /resultado/]);

  if (lookupCount > 0) {
    candidates.push(candidate({
      id: "rule:lookup",
      category: "lookup",
      title: "Consultas entre abas/cadastros por fórmulas de busca",
      confidence: Math.min(0.95, 0.55 + lookupCount / Math.max(catalog.formulas.length, 1)),
      sheetNames: unique([
        ...formulaPatterns.repeatedPatterns.filter(pattern => ["PROCV", "XLOOKUP", "ÍNDICE", "INDICE", "CORRESP"].includes(pattern.type)).flatMap(pattern => pattern.sheets),
        ...registrySheets,
      ]).slice(0, 12),
      relatedColumns: [],
      formulaTypes: ["PROCV", "XLOOKUP", "ÍNDICE", "INDICE", "CORRESP"],
      evidence: [`${lookupCount} fórmulas de busca/índice detectadas.`],
    }));
  }

  if (conditionalCount > 0) {
    candidates.push(candidate({
      id: "rule:conditional",
      category: "conditional",
      title: "Regras condicionais embutidas em fórmulas",
      confidence: Math.min(0.95, 0.5 + conditionalCount / Math.max(catalog.formulas.length, 1)),
      sheetNames: unique(formulaPatterns.repeatedPatterns.filter(pattern => ["SE", "SEERRO"].includes(pattern.type)).flatMap(pattern => pattern.sheets)).slice(0, 12),
      relatedColumns: [],
      formulaTypes: ["SE", "SEERRO"],
      evidence: [`${conditionalCount} fórmulas condicionais catalogadas.`],
    }));
  }

  if (aggregationCount > 0) {
    candidates.push(candidate({
      id: "rule:aggregation",
      category: "aggregation",
      title: "Apurações por soma, contagem e agregação",
      confidence: Math.min(0.95, 0.5 + aggregationCount / Math.max(catalog.formulas.length, 1)),
      sheetNames: unique([...reportSheets, ...formulaPatterns.repeatedPatterns.filter(pattern => ["SOMASE", "SOMASES", "CONT.SE", "CONT.SES", "SUBTOTAL", "AGREGAR", "SOMA"].includes(pattern.type)).flatMap(pattern => pattern.sheets)]).slice(0, 12),
      relatedColumns: [],
      formulaTypes: ["SOMA", "SOMASE", "SOMASES", "CONT.SE", "CONT.SES", "SUBTOTAL", "AGREGAR"],
      evidence: [`${aggregationCount} fórmulas de agregação detectadas.`],
    }));
  }

  if (commissionSheets.length > 0 || commissionColumns.length > 0) {
    candidates.push(candidate({
      id: "rule:commission",
      category: "commission",
      title: "Apuração de comissão de vendedores",
      confidence: commissionSheets.length > 0 ? 0.9 : 0.65,
      sheetNames: unique([...commissionSheets, ...commissionColumns.map(item => item.sheetName)]).slice(0, 12),
      relatedColumns: unique(commissionColumns.map(item => item.columnName)).slice(0, 12),
      formulaTypes: formulaPatterns.formulaTypeCounts.filter(item => item.count > 0).slice(0, 6).map(item => item.type),
      evidence: [
        commissionSheets.length > 0 ? `Abas classificadas como comissão: ${commissionSheets.join(", ")}.` : "Colunas sugerem comissão.",
      ],
    }));
  }

  if (dreSheets.length > 0 || financialColumns.length > 0) {
    candidates.push(candidate({
      id: "rule:dre-financial",
      category: "dre",
      title: "Estrutura financeira compatível com DRE ou resultado gerencial",
      confidence: dreSheets.length > 0 ? 0.85 : 0.55,
      sheetNames: unique([...dreSheets, ...financialColumns.map(item => item.sheetName)]).slice(0, 12),
      relatedColumns: unique(financialColumns.map(item => item.columnName)).slice(0, 12),
      formulaTypes: formulaPatterns.formulaTypeCounts.filter(item => item.count > 0).slice(0, 6).map(item => item.type),
      evidence: [
        dreSheets.length > 0 ? `Abas classificadas como DRE: ${dreSheets.join(", ")}.` : "Colunas financeiras candidatas detectadas.",
      ],
    }));
  }

  if (catalog.dataValidation.length > 0) {
    candidates.push(candidate({
      id: "rule:validation",
      category: "validation",
      title: "Validações de entrada e listas controladas",
      confidence: 0.75,
      sheetNames: unique(catalog.dataValidation.map(item => item.sheetName)).slice(0, 12),
      relatedColumns: [],
      formulaTypes: [],
      evidence: [`${catalog.dataValidation.length} validações de dados detectadas.`],
    }));
  }

  if (indirectCount > 0) {
    candidates.push(candidate({
      id: "rule:dynamic-reference",
      category: "allocation",
      title: "Referências dinâmicas por INDIRETO/DESLOC",
      confidence: 0.8,
      sheetNames: unique(formulaPatterns.repeatedPatterns.filter(pattern => ["INDIRETO", "DESLOC"].includes(pattern.type)).flatMap(pattern => pattern.sheets)).slice(0, 12),
      relatedColumns: [],
      formulaTypes: ["INDIRETO", "DESLOC"],
      evidence: [`${indirectCount} fórmulas com referência dinâmica detectadas.`],
    }));
  }

  if (catalog.namedRanges.length > 0) {
    candidates.push(candidate({
      id: "rule:named-ranges",
      category: "reference",
      title: "Regras ou parâmetros definidos por nomes de intervalo",
      confidence: 0.65,
      sheetNames: unique(catalog.namedRanges.map(item => item.sheetName || "").filter(Boolean)).slice(0, 12),
      relatedColumns: catalog.namedRanges.slice(0, 12).map(item => item.name),
      formulaTypes: [],
      evidence: [`${catalog.namedRanges.length} named ranges catalogados.`],
    }));
  }

  return candidates.sort((a, b) => b.confidence - a.confidence || a.title.localeCompare(b.title));
}
