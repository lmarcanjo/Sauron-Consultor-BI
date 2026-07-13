import { ActiveDataset } from "../../types/dataSource";
import { WorkbookCatalog } from "../workbook";
import { getSheetRows, getWorkbookSheets, WorkbookSheetView } from "../data/businessViews";
import { RawRow } from "../data/activeDatasetView";
import { ModuleName } from "../data/moduleMapping";
import { columnTokenSimilarity, normalizeSmartConfigText, suggestColumnRoles } from "./ColumnRoleSuggestionEngine";
import { getWorkspaceModuleMemory, isSuggestionIgnored } from "./WorkspaceMappingMemory";
import {
  ModuleMappingSuggestion,
  SmartConfigurationContext,
  WorkspaceModuleMappingMemory,
} from "./SmartConfigurationTypes";

const MODULES: ModuleName[] = ["Comercial", "Pessoas", "Comissão", "Financeiro", "DRE"];

const SHEET_HINTS: Record<ModuleName, string[]> = {
  Comercial: ["imp vendas at", "imp vendas", "importacao detalhada", "vendas", "venda"],
  Pessoas: ["imp vendedores", "cadastros vendedores", "cadastros funcionarios", "funcionarios", "vendedores", "pessoas"],
  Comissão: ["comissao vendedores", "comissao", "comissão", "vendedores", "fechamento"],
  Financeiro: ["imp vendas at", "imp vendas", "rvd pecas", "rvd ac", "financeiro", "vendas", "importacao detalhada"],
  DRE: ["dre", "resultado", "rvd", "financeiro", "demonstrativo"],
};

const REQUIRED_ROLE_HINTS: Record<ModuleName, string[]> = {
  Comercial: ["product", "seller", "client", "value"],
  Pessoas: ["name", "seller", "employee", "department", "store"],
  Comissão: ["seller", "base", "amount", "goal"],
  Financeiro: ["value", "cost", "margin", "commission"],
  DRE: ["revenue", "cost", "expense", "account"],
};

function clamp(value: number): number {
  return Math.max(0, Math.min(0.98, Number(value.toFixed(2))));
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map(item => item.trim()).filter(Boolean)));
}

function datasetSheetName(sheet: ActiveDataset["sheets"][number]): string {
  return typeof sheet === "string" ? sheet : sheet.sheetName;
}

function sheetRowsFromPreview(dataset: ActiveDataset, sheetName: string, limit: number): RawRow[] {
  const normalizedSheet = normalizeSmartConfigText(sheetName);
  return dataset.previewRows
    .filter(row => normalizeSmartConfigText(row.metadata.sheetName) === normalizedSheet)
    .map(row => row.raw)
    .slice(0, limit) as RawRow[];
}

function collectColumns(rows: RawRow[], dataset: ActiveDataset, sheetName: string, catalog?: WorkbookCatalog): string[] {
  const rowColumns = new Set<string>();
  rows.slice(0, 100).forEach(row => {
    Object.keys(row || {}).forEach(column => {
      if (column !== "__sheetName" && column !== "__sourceRowNumber") rowColumns.add(column);
    });
  });

  const catalogColumns = (catalog?.columns || [])
    .filter(column => normalizeSmartConfigText(column.sheetName) === normalizeSmartConfigText(sheetName))
    .map(column => column.originalName || column.alias)
    .filter(Boolean);

  const sheetColumns = unique([...Array.from(rowColumns), ...catalogColumns]);
  if (sheetColumns.length > 0) return sheetColumns;

  const profileColumns = (dataset.columnProfiles || [])
    .map(profile => profile.originalName || profile.name)
    .filter(Boolean);

  return unique(profileColumns);
}

function sheetHintScore(moduleName: ModuleName, sheetName: string): { score: number; reasons: string[] } {
  const normalizedSheet = normalizeSmartConfigText(sheetName);
  const matched = SHEET_HINTS[moduleName].filter(hint => normalizedSheet.includes(normalizeSmartConfigText(hint)));
  return {
    score: Math.min(0.28, matched.length * 0.1),
    reasons: matched.map(hint => `Nome da aba combina com ${hint}`),
  };
}

function memorySheetScore(sheetName: string, memory?: WorkspaceModuleMappingMemory | null): { score: number; reasons: string[] } {
  if (!memory?.sheetName) return { score: 0, reasons: [] };
  const similarity = columnTokenSimilarity(sheetName, memory.sheetName);
  if (similarity < 0.45) return { score: 0, reasons: [] };
  return {
    score: Math.min(0.18, similarity * 0.18),
    reasons: [`Aba semelhante ao mapeamento aceito anteriormente: ${memory.sheetName}`],
  };
}

function buildSuggestionId(moduleName: ModuleName, sheetName: string, semanticRoles: Record<string, string>): string {
  const rolePart = Object.entries(semanticRoles)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([role, column]) => `${normalizeSmartConfigText(role)}:${normalizeSmartConfigText(column)}`)
    .join("|");
  return `smart:${normalizeSmartConfigText(moduleName)}:${normalizeSmartConfigText(sheetName)}:${rolePart}`;
}

function scoreRequiredRoles(moduleName: ModuleName, roles: Record<string, string>): number {
  const found = REQUIRED_ROLE_HINTS[moduleName].filter(role => !!roles[role]).length;
  const denominator = Math.max(1, REQUIRED_ROLE_HINTS[moduleName].length);
  return found / denominator;
}

function moduleRichnessBoost(moduleName: ModuleName, roles: Record<string, string>): number {
  if (moduleName === "Pessoas") {
    return (roles.department ? 0.16 : 0) + (roles.store ? 0.16 : 0) + (roles.cpf || roles.registration ? 0.04 : 0);
  }
  if (moduleName === "Comissão") {
    return (roles.goal ? 0.06 : 0) + (roles.base ? 0.04 : 0) + (roles.amount ? 0.04 : 0);
  }
  if (moduleName === "Comercial") {
    return (roles.product ? 0.05 : 0) + (roles.client ? 0.04 : 0) + (roles.value ? 0.04 : 0);
  }
  return 0;
}

function hasMinimumSignal(moduleName: ModuleName, roles: Record<string, string>): boolean {
  if (moduleName === "Pessoas") return !!(roles.name || roles.seller || roles.employee);
  if (moduleName === "Comissão") return !!roles.seller && !!(roles.base || roles.amount || roles.goal);
  if (moduleName === "Comercial") return !!(roles.product || roles.seller || roles.client || roles.value);
  if (moduleName === "Financeiro") return !!(roles.value || roles.cost || roles.margin || roles.commission);
  return !!(roles.revenue || roles.cost || roles.expense || roles.account || roles.costCenter);
}

function rowsForScoring(rows: RawRow[], sheet: WorkbookSheetView): number {
  return rows.length || sheet.rowCount || 0;
}

function sourceFromMemory(columnMemoryUsed: boolean, sheetMemoryUsed: boolean): "heuristic" | "workspace_memory" | "mixed" {
  if (columnMemoryUsed && sheetMemoryUsed) return "workspace_memory";
  if (columnMemoryUsed || sheetMemoryUsed) return "mixed";
  return "heuristic";
}

async function buildSuggestionForSheet(
  context: SmartConfigurationContext,
  moduleName: ModuleName,
  sheet: WorkbookSheetView,
): Promise<ModuleMappingSuggestion | null> {
  const memory = getWorkspaceModuleMemory(context.workspaceId, moduleName);
  const rows = await getSheetRows(sheet.sheetName, 300);
  const fallbackRows = rows.length > 0 ? rows : sheetRowsFromPreview(context.activeDataset, sheet.sheetName, 300);
  const columns = collectColumns(fallbackRows, context.activeDataset, sheet.sheetName, context.workbookCatalog);
  if (columns.length === 0) return null;

  const columnSuggestions = suggestColumnRoles(moduleName, columns, memory);
  const semanticRoles = Object.fromEntries(columnSuggestions.map(suggestion => [suggestion.semanticRole, suggestion.column]));
  if (!hasMinimumSignal(moduleName, semanticRoles)) return null;

  const selectedColumns = unique(columnSuggestions.map(suggestion => suggestion.column));
  const roleScore = scoreRequiredRoles(moduleName, semanticRoles);
  const avgColumnConfidence = columnSuggestions.reduce((sum, suggestion) => sum + suggestion.confidence, 0) / Math.max(1, columnSuggestions.length);
  const sheetScore = sheetHintScore(moduleName, sheet.sheetName);
  const memoryScore = memorySheetScore(sheet.sheetName, memory);
  const rowScore = rowsForScoring(fallbackRows, sheet) > 0 ? 0.08 : 0;
  const richnessBoost = moduleRichnessBoost(moduleName, semanticRoles);
  const columnMemoryUsed = columnSuggestions.some(suggestion => suggestion.source !== "heuristic");
  const sheetMemoryUsed = memoryScore.score > 0;
  const confidence = clamp((avgColumnConfidence * 0.55) + (roleScore * 0.22) + sheetScore.score + memoryScore.score + rowScore + richnessBoost);
  const source = sourceFromMemory(columnMemoryUsed, sheetMemoryUsed);
  const id = buildSuggestionId(moduleName, sheet.sheetName, semanticRoles);

  return {
    id,
    moduleName,
    sheetName: sheet.sheetName,
    selectedColumns,
    semanticRoles,
    confidence,
    source,
    status: confidence >= 0.58 ? "suggested" : "review_only",
    reasons: unique([
      ...sheetScore.reasons,
      ...memoryScore.reasons,
      `${columnSuggestions.length} coluna(s) candidata(s) encontrada(s).`,
      rowsForScoring(fallbackRows, sheet) > 0 ? "A sugestão usa linhas reais da aba." : "",
    ]),
    warnings: confidence < 0.58 ? ["Confiança baixa: revisar antes de aplicar."] : [],
    columnSuggestions,
  };
}

function getCandidateSheets(context: SmartConfigurationContext, moduleName: ModuleName): WorkbookSheetView[] {
  const activeSheets = getWorkbookSheets();
  const datasetSheets = context.activeDataset.sheets.map(sheet => ({
    sheetName: datasetSheetName(sheet),
    rowCount: typeof sheet === "string" ? 0 : sheet.rowCount,
    columnCount: typeof sheet === "string" ? context.activeDataset.columnCount : sheet.columnCount,
    formulaCount: typeof sheet === "string" ? 0 : sheet.formulaCount,
    classification: typeof sheet === "string" ? "Não classificada" : sheet.classification,
    selectedForImport: typeof sheet === "string" ? true : sheet.selectedForImport,
  }));
  const sheetMap = new Map<string, WorkbookSheetView>();
  [...activeSheets, ...datasetSheets].forEach(sheet => {
    if (!sheetMap.has(sheet.sheetName)) sheetMap.set(sheet.sheetName, sheet);
  });

  return Array.from(sheetMap.values()).sort((left, right) => {
    const leftScore = sheetHintScore(moduleName, left.sheetName).score;
    const rightScore = sheetHintScore(moduleName, right.sheetName).score;
    if (rightScore !== leftScore) return rightScore - leftScore;
    return (right.rowCount || 0) - (left.rowCount || 0);
  });
}

export async function buildModuleSuggestions(context: SmartConfigurationContext): Promise<ModuleMappingSuggestion[]> {
  const suggestions: ModuleMappingSuggestion[] = [];

  for (const moduleName of MODULES) {
    const candidates = getCandidateSheets(context, moduleName).slice(0, 10);
    const moduleSuggestions = (await Promise.all(
      candidates.map(sheet => buildSuggestionForSheet(context, moduleName, sheet))
    ))
      .filter((suggestion): suggestion is ModuleMappingSuggestion => !!suggestion)
      .filter(suggestion => !isSuggestionIgnored(context.workspaceId, suggestion.id))
      .sort((left, right) => right.confidence - left.confidence);

    if (moduleSuggestions[0]) suggestions.push(moduleSuggestions[0]);
  }

  return suggestions;
}
