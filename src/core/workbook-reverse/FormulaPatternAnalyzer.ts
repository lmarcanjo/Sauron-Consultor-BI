import { WorkbookCatalog, WorkbookFormulaCatalogItem } from "../workbook";
import { FormulaPatternAnalysis, FormulaPatternSummary } from "./WorkbookReverseTypes";

const HIGH_RISK_TYPES = new Set(["PROCV", "XLOOKUP", "INDIRETO", "DESLOC", "ÍNDICE", "INDICE", "CORRESP"]);
const BUSINESS_TYPES = new Set(["SE", "SEERRO", "SOMASE", "SOMASES", "CONT.SE", "CONT.SES", "SUBTOTAL", "AGREGAR"]);

function normalizeFormulaPattern(formula: string): string {
  return formula
    .toUpperCase()
    .replace(/"[^"]*"/g, "\"TEXT\"")
    .replace(/'[^']+'!\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?/g, "SHEET!REF")
    .replace(/[A-ZÀ-ÿ0-9_]+!\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?/g, "SHEET!REF")
    .replace(/\$?[A-Z]{1,3}\$?\d+:\$?[A-Z]{1,3}\$?\d+/g, "RANGE")
    .replace(/\$?[A-Z]{1,3}\$?\d+/g, "CELL")
    .replace(/\b\d+(?:[,.]\d+)?\b/g, "N")
    .replace(/\s+/g, "");
}

function normalizeDependency(dep: string): string {
  return dep.replace(/\$/g, "");
}

function formulaCriticality(formula: WorkbookFormulaCatalogItem, occurrences: number, dependencies: string[]): FormulaPatternSummary["criticality"] {
  const crossSheetDependencies = dependencies.filter(dep => dep.includes("!")).length;
  if (HIGH_RISK_TYPES.has(formula.type) || crossSheetDependencies >= 2) return "high";
  if (BUSINESS_TYPES.has(formula.type) || occurrences === 1 || crossSheetDependencies === 1) return "medium";
  return "low";
}

function buildEvidence(params: {
  formula: WorkbookFormulaCatalogItem;
  occurrences: number;
  sheets: string[];
  dependencies: string[];
}): string[] {
  const evidence = [
    `${params.occurrences} ocorrência(s) do tipo ${params.formula.type}.`,
    `Exemplo em ${params.formula.sheetName}!${params.formula.cell}.`,
  ];
  if (params.sheets.length > 1) evidence.push(`Padrão aparece em ${params.sheets.length} abas.`);
  if (params.dependencies.length > 0) evidence.push(`Dependências textuais detectadas: ${params.dependencies.slice(0, 5).join(", ")}.`);
  if (HIGH_RISK_TYPES.has(params.formula.type)) evidence.push("Tipo de fórmula sensível a referências, cadastros ou intervalos.");
  return evidence;
}

export function analyzeFormulaPatterns(catalog: WorkbookCatalog, limit = 50): FormulaPatternAnalysis {
  const typeCounts = new Map<string, number>();
  const groups = new Map<string, {
    normalizedFormula: string;
    formulas: WorkbookFormulaCatalogItem[];
    dependencies: Set<string>;
    sheets: Set<string>;
  }>();

  catalog.formulas.forEach(formula => {
    typeCounts.set(formula.type, (typeCounts.get(formula.type) || 0) + 1);
    const normalizedFormula = normalizeFormulaPattern(formula.formula);
    const key = `${formula.type}::${normalizedFormula}`;
    const current = groups.get(key) || {
      normalizedFormula,
      formulas: [],
      dependencies: new Set<string>(),
      sheets: new Set<string>(),
    };
    current.formulas.push(formula);
    current.sheets.add(formula.sheetName);
    formula.dependencies.map(normalizeDependency).forEach(dep => current.dependencies.add(dep));
    groups.set(key, current);
  });

  const summaries = Array.from(groups.values()).map((group, index) => {
    const sample = group.formulas[0];
    const dependencies = Array.from(group.dependencies).slice(0, 20);
    const sheets = Array.from(group.sheets).sort();
    const occurrences = group.formulas.length;
    const criticality = formulaCriticality(sample, occurrences, dependencies);
    return {
      id: `formula-pattern:${index}`,
      type: sample.type,
      normalizedFormula: group.normalizedFormula,
      occurrences,
      sheets,
      sampleCells: group.formulas.slice(0, 8).map(formula => `${formula.sheetName}!${formula.cell}`),
      sampleFormula: sample.formula,
      dependencies,
      criticality,
      evidence: buildEvidence({ formula: sample, occurrences, sheets, dependencies }),
    };
  });

  const repeatedPatterns = summaries
    .filter(summary => summary.occurrences > 1)
    .sort((a, b) => b.occurrences - a.occurrences || b.sheets.length - a.sheets.length)
    .slice(0, limit);

  const uniqueCriticalFormulas = summaries
    .filter(summary => summary.occurrences === 1 && summary.criticality !== "low")
    .sort((a, b) => {
      const score = { high: 2, medium: 1, low: 0 };
      return score[b.criticality] - score[a.criticality] || b.dependencies.length - a.dependencies.length;
    })
    .slice(0, limit);

  return {
    totalFormulas: catalog.formulas.length,
    repeatedPatterns,
    uniqueCriticalFormulas,
    formulaTypeCounts: Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type)),
  };
}
