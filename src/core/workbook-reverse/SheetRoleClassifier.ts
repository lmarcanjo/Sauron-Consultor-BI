import { WorkbookCatalog } from "../workbook";
import { SheetRole, SheetRoleClassification } from "./WorkbookReverseTypes";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function matchesAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(value));
}

function addScore(
  scores: Map<SheetRole, { score: number; evidence: string[] }>,
  role: SheetRole,
  score: number,
  evidence: string,
): void {
  const current = scores.get(role) || { score: 0, evidence: [] };
  current.score += score;
  current.evidence.push(evidence);
  scores.set(role, current);
}

export function classifyWorkbookSheets(catalog: WorkbookCatalog): SheetRoleClassification[] {
  const formulasBySheet = new Map<string, number>();
  catalog.formulas.forEach(formula => {
    formulasBySheet.set(formula.sheetName, (formulasBySheet.get(formula.sheetName) || 0) + 1);
  });

  const columnsBySheet = new Map<string, string[]>();
  catalog.columns.forEach(column => {
    if (!column.originalName.trim()) return;
    const current = columnsBySheet.get(column.sheetName) || [];
    current.push(column.originalName);
    columnsBySheet.set(column.sheetName, current);
  });

  return catalog.sheets.map(sheet => {
    const normalizedName = normalize(sheet.name);
    const importantColumns = (columnsBySheet.get(sheet.name) || [])
      .filter((column, index, all) => all.indexOf(column) === index)
      .slice(0, 12);
    const normalizedColumns = normalize(importantColumns.join(" "));
    const formulaCount = formulasBySheet.get(sheet.name) || 0;
    const cellCount = Math.max(sheet.rowCount * sheet.columnCount, 1);
    const formulaDensity = formulaCount / cellCount;
    const scores = new Map<SheetRole, { score: number; evidence: string[] }>();

    if (matchesAny(normalizedName, [/^imp_/, /importacao/, /importacao_detalhada/, /\binput\b/, /\bbase\b/])) {
      addScore(scores, "entrada", 0.65, `Nome da aba sugere importação/entrada: ${sheet.name}`);
    }
    if (formulaDensity < 0.05 && sheet.rowCount >= 20 && sheet.columnCount >= 2) {
      addScore(scores, "entrada", 0.2, "Baixa densidade de fórmulas em aba com volume de dados.");
    }
    if (matchesAny(normalizedName, [/cadastro/, /funcionario/, /vendedor/, /cliente/, /colaborador/])) {
      addScore(scores, "cadastro", 0.75, `Nome da aba sugere cadastro: ${sheet.name}`);
    }
    if (matchesAny(normalizedColumns, [/cpf/, /cnpj/, /matricula/, /cargo/, /setor/, /gerente/])) {
      addScore(scores, "cadastro", 0.25, "Colunas sugerem cadastro de pessoas/entidades.");
    }
    if (matchesAny(normalizedName, [/comissao/, /comissoes/, /premiacao/, /bonus/])) {
      addScore(scores, "comissao", 0.85, `Nome da aba sugere comissão: ${sheet.name}`);
    }
    if (matchesAny(normalizedColumns, [/comissao/, /percentual/, /premio/, /bonificacao/])) {
      addScore(scores, "comissao", 0.25, "Colunas sugerem regra ou apuração de comissão.");
    }
    if (matchesAny(normalizedName, [/dre/, /resultado/, /demonstrativo/, /receita/, /despesa/, /ebitda/])) {
      addScore(scores, "dre", 0.85, `Nome da aba sugere DRE/resultado: ${sheet.name}`);
    }
    if (matchesAny(normalizedColumns, [/receita/, /despesa/, /custo/, /lucro/, /margem/, /resultado/])) {
      addScore(scores, "dre", 0.25, "Colunas sugerem indicadores financeiros/DRE.");
    }
    if (matchesAny(normalizedName, [/^rvd/, /^an_/, /relatorio/, /resumo/, /analise/, /detalhes/, /pendencia/, /cockpit/])) {
      addScore(scores, "relatorio", 0.7, `Nome da aba sugere relatório/análise: ${sheet.name}`);
    }
    if (sheet.hasCharts || sheet.hasPivot || sheet.hasConditionalFormatting) {
      addScore(scores, "relatorio", 0.2, "Aba possui objeto visual, pivô ou formatação condicional.");
    }
    if (formulaDensity >= 0.25 || formulaCount >= 100) {
      addScore(scores, "calculo", Math.min(0.75, 0.35 + formulaDensity), `Aba possui ${formulaCount} fórmulas catalogadas.`);
    }
    if (matchesAny(normalizedName, [/calc/, /apoio/, /config/, /parametro/])) {
      addScore(scores, "calculo", 0.3, `Nome da aba sugere suporte/cálculo: ${sheet.name}`);
    }
    if (matchesAny(normalizedName, [/menu/, /instrucao/, /instrucoes/, /config/])) {
      addScore(scores, "suporte", 0.55, `Nome da aba sugere suporte operacional: ${sheet.name}`);
    }

    if (scores.size === 0) {
      addScore(scores, "desconhecida", 0.35, "Sem sinais suficientes para classificação automática.");
    }

    const roles = Array.from(scores.entries())
      .map(([role, value]) => ({
        role,
        confidence: clampConfidence(value.score),
        evidence: value.evidence,
      }))
      .sort((a, b) => b.confidence - a.confidence || a.role.localeCompare(b.role));

    return {
      sheetName: sheet.name,
      primaryRole: roles[0]?.role || "desconhecida",
      roles,
      formulaCount,
      formulaDensity: clampConfidence(formulaDensity),
      rowCount: sheet.rowCount,
      columnCount: sheet.columnCount,
      importantColumns,
    };
  });
}
