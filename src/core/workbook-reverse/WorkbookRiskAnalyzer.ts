import { WorkbookCatalog } from "../workbook";
import {
  FormulaPatternAnalysis,
  SheetDependencySummary,
  SheetRoleClassification,
  StructuralRisk,
} from "./WorkbookReverseTypes";

function risk(params: StructuralRisk): StructuralRisk {
  return params;
}

function formulaTypeCount(patterns: FormulaPatternAnalysis, type: string): number {
  return patterns.formulaTypeCounts.find(item => item.type === type)?.count || 0;
}

export function analyzeWorkbookRisks(params: {
  catalog: WorkbookCatalog;
  sheetRoles: SheetRoleClassification[];
  formulaPatterns: FormulaPatternAnalysis;
  dependencySummary: SheetDependencySummary[];
}): StructuralRisk[] {
  const { catalog, sheetRoles, formulaPatterns, dependencySummary } = params;
  const risks: StructuralRisk[] = [];
  const hiddenSheets = catalog.sheets.filter(sheet => sheet.visibility !== "visible");
  const indirectCount = formulaTypeCount(formulaPatterns, "INDIRETO");
  const offsetCount = formulaTypeCount(formulaPatterns, "DESLOC");
  const lookupCount = ["PROCV", "XLOOKUP", "ÍNDICE", "INDICE", "CORRESP"]
    .reduce((total, type) => total + formulaTypeCount(formulaPatterns, type), 0);
  const topDependency = dependencySummary[0];
  const sheetsWithoutClearRole = sheetRoles.filter(sheet => sheet.primaryRole === "desconhecida");

  if (catalog.formulas.length >= 50000) {
    risks.push(risk({
      id: "risk:formula-volume",
      severity: "high",
      category: "performance",
      title: "Volume alto de fórmulas",
      evidence: [`${catalog.formulas.length} fórmulas catalogadas no workbook.`],
      recommendation: "Revisar quais fórmulas representam regras de negócio antes de migrar para engine no Sauron.",
    }));
  }

  if (indirectCount + offsetCount > 0) {
    risks.push(risk({
      id: "risk:dynamic-references",
      severity: "high",
      category: "formula",
      title: "Referências dinâmicas frágeis",
      evidence: [`INDIRETO: ${indirectCount}; DESLOC: ${offsetCount}.`],
      recommendation: "Mapear manualmente os intervalos dinâmicos antes de automatizar, pois eles podem esconder dependências.",
    }));
  }

  if (lookupCount >= 100) {
    risks.push(risk({
      id: "risk:lookup-dependencies",
      severity: "medium",
      category: "formula",
      title: "Muitas consultas entre abas/cadastros",
      evidence: [`${lookupCount} fórmulas de busca/índice detectadas.`],
      recommendation: "Identificar cadastros oficiais e chaves de junção antes de substituir PROCV/ÍNDICE/CORRESP.",
    }));
  }

  if (topDependency && topDependency.count >= 1000) {
    risks.push(risk({
      id: "risk:dependency-concentration",
      severity: "high",
      category: "structure",
      title: "Dependência concentrada entre abas",
      evidence: [`${topDependency.from} depende de ${topDependency.to} em ${topDependency.count} referência(s).`],
      recommendation: "Validar essa relação com o consultor; ela provavelmente representa uma regra central da planilha.",
    }));
  }

  if (catalog.namedRanges.length >= 50) {
    risks.push(risk({
      id: "risk:named-ranges",
      severity: "medium",
      category: "governance",
      title: "Uso intenso de named ranges",
      evidence: [`${catalog.namedRanges.length} named ranges catalogados.`],
      recommendation: "Revisar nomes definidos como possíveis parâmetros, ranges de validação ou regras implícitas.",
    }));
  }

  if (hiddenSheets.length > 0) {
    risks.push(risk({
      id: "risk:hidden-sheets",
      severity: "medium",
      category: "governance",
      title: "Abas ocultas ou veryHidden",
      evidence: hiddenSheets.map(sheet => `${sheet.name}: ${sheet.visibility}`).slice(0, 12),
      recommendation: "Confirmar se abas ocultas são apoio técnico, regra de negócio ou legado.",
    }));
  }

  if (catalog.diagnostics.mixedTypes.length > 0) {
    risks.push(risk({
      id: "risk:mixed-types",
      severity: catalog.diagnostics.mixedTypes.length > 20 ? "medium" : "low",
      category: "mapping",
      title: "Colunas com tipos mistos",
      evidence: catalog.diagnostics.mixedTypes.slice(0, 12).map(item => `${item.sheetName}!${item.columnLetter} (${item.originalName})`),
      recommendation: "Validar colunas antes de criar mapeamentos automáticos, especialmente valores e datas.",
    }));
  }

  if (catalog.diagnostics.duplicateHeaders.length > 0) {
    risks.push(risk({
      id: "risk:duplicate-headers",
      severity: "medium",
      category: "mapping",
      title: "Cabeçalhos duplicados",
      evidence: catalog.diagnostics.duplicateHeaders.slice(0, 12).map(item => `${item.sheetName}: ${item.header} em ${item.columns.join(", ")}`),
      recommendation: "Resolver ambiguidade de colunas antes de usar mapeamento assistido.",
    }));
  }

  if (catalog.metadata.cellCount >= 1000000) {
    risks.push(risk({
      id: "risk:large-workbook",
      severity: "high",
      category: "performance",
      title: "Workbook grande para processamento no navegador",
      evidence: [`${catalog.metadata.cellCount} células estimadas por usedRange.`],
      recommendation: "Em produção, executar reverse engineering no backend/worker e entregar apenas relatório paginado ao frontend.",
    }));
  }

  if (formulaPatterns.uniqueCriticalFormulas.length > 0) {
    risks.push(risk({
      id: "risk:unique-critical-formulas",
      severity: "medium",
      category: "formula",
      title: "Fórmulas únicas críticas",
      evidence: formulaPatterns.uniqueCriticalFormulas.slice(0, 8).map(item => `${item.sampleCells[0]}: ${item.type}`),
      recommendation: "Revisar fórmulas únicas antes de transformá-las em regra, pois podem ser exceções manuais.",
    }));
  }

  if (sheetsWithoutClearRole.length > 0) {
    risks.push(risk({
      id: "risk:unclear-sheet-role",
      severity: "low",
      category: "governance",
      title: "Abas sem papel claro",
      evidence: sheetsWithoutClearRole.map(sheet => sheet.sheetName).slice(0, 12),
      recommendation: "Perguntar ao consultor se essas abas são legado, apoio ou parte ativa do processo.",
    }));
  }

  return risks.sort((a, b) => {
    const score = { high: 2, medium: 1, low: 0 };
    return score[b.severity] - score[a.severity] || a.title.localeCompare(b.title);
  });
}
