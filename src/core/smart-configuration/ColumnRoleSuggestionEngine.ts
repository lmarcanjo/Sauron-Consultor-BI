import {
  MODULE_ROLE_DEFINITIONS,
  ModuleName,
  ModuleRoleDefinition,
} from "../data/moduleMapping";
import {
  ColumnRoleSuggestion,
  SmartSuggestionSource,
  WorkspaceModuleMappingMemory,
} from "./SmartConfigurationTypes";
import { businessDomainEngine, businessDomainRegistry } from "../business-domains";

const GENERIC_TARGET_TO_ROLES: Record<string, string[]> = {
  empresa: ["store"],
  unidade: ["store"],
  filial: ["store"],
  loja: ["store"],
  vendedor: ["seller"],
  consultor: ["seller"],
  colaborador: ["name", "employee"],
  funcionario: ["name", "employee"],
  departamento: ["department", "category", "costCenter"],
  setor: ["department", "category", "costCenter"],
  produto: ["product"],
  item: ["product"],
  cliente: ["client"],
  data: ["date"],
  competencia: ["date"],
  receita: ["revenue"],
  custo: ["cost"],
  despesa: ["expense"],
  comissao: ["commission", "amount"],
};

const ROLE_LABELS: Partial<Record<ModuleName, Record<string, string>>> = {
  Comercial: {
    product: "Produto/Item",
    seller: "Pessoa/Vendedor",
    client: "Cliente",
    value: "Valor vendido",
    date: "Data",
    category: "Categoria",
  },
  Pessoas: {
    name: "Pessoa/Vendedor",
    seller: "Pessoa/Vendedor",
    employee: "Funcionário",
    cpf: "CPF",
    registration: "Matrícula",
    role: "Cargo",
    department: "Departamento",
    store: "Unidade",
    commission: "Comissão",
  },
  Comissão: {
    seller: "Pessoa/Vendedor",
    base: "Valor vendido",
    rate: "Percentual",
    amount: "Comissão",
    goal: "Meta/Objetivo",
    unit: "Unidade",
    date: "Data",
  },
  Financeiro: {
    value: "Valor vendido",
    cost: "Custo",
    margin: "Margem",
    commission: "Comissão",
    date: "Data",
  },
  DRE: {
    revenue: "Receita candidata",
    cost: "Custo candidato",
    expense: "Despesa candidata",
    deduction: "Dedução",
    account: "Conta",
    date: "Data",
    costCenter: "Centro de custo",
  },
};

const EXTRA_PATTERNS: Partial<Record<ModuleName, Record<string, string[]>>> = {
  Comercial: {
    product: ["produto", "item", "peca", "codigo", "cod", "descricao", "acessorio"],
    seller: ["vendedor", "consultor", "nome"],
    client: ["cliente", "razao", "cpf", "cnpj"],
    value: ["valor", "venda", "total", "faturamento", "vlr", "liquido", "bruto"],
  },
  Pessoas: {
    name: ["nome", "vendedor", "consultor", "colaborador"],
    department: ["departamento", "setor"],
    store: ["unidade", "loja", "filial"],
  },
  Comissão: {
    seller: ["nome", "vendedor", "consultor"],
    base: ["venda acess", "venda acessorio", "venda acessorios", "venda", "base", "valor", "total", "acess", "acessorio"],
    amount: ["comissao", "comiss"],
    goal: ["objetivo", "meta"],
    unit: ["unidade", "loja", "filial"],
  },
  Financeiro: {
    value: ["venda", "valor", "total", "faturamento"],
    commission: ["comissao", "comiss"],
  },
  DRE: {
    revenue: ["receita", "venda", "faturamento"],
    cost: ["custo", "cmv", "cpv"],
    expense: ["despesa"],
  },
};

const ROLE_EXCLUSIONS: Partial<Record<ModuleName, Record<string, string[]>>> = {
  Comercial: {
    product: ["vlr", "valor", "venda", "custo", "imposto", "total", "margem"],
    value: ["custo", "imposto", "margem"],
  },
  Financeiro: {
    value: ["custo", "imposto"],
    commission: ["comissionado"],
  },
  Comissão: {
    base: ["comissao", "comiss", "dsr"],
    amount: ["base", "objetivo", "meta"],
  },
  DRE: {
    revenue: ["custo", "despesa", "imposto"],
    cost: ["receita"],
    expense: ["receita"],
  },
};

export function normalizeSmartConfigText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();
}

function tokens(value: unknown): string[] {
  return normalizeSmartConfigText(value).split(/\s+/).filter(Boolean);
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(0.98, Number(value.toFixed(2))));
}

export function columnTokenSimilarity(left: string, right: string): number {
  const leftTokens = tokens(left);
  const rightTokens = tokens(right);
  if (leftTokens.length === 0 || rightTokens.length === 0) return 0;

  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  const shared = leftTokens.filter(token => rightSet.has(token)).length;
  const contains = normalizeSmartConfigText(left).includes(normalizeSmartConfigText(right)) ||
    normalizeSmartConfigText(right).includes(normalizeSmartConfigText(left));
  const union = new Set([...leftSet, ...rightSet]).size;

  return clampConfidence((shared / union) + (contains ? 0.35 : 0));
}

function rolePatterns(moduleName: ModuleName, definition: ModuleRoleDefinition): string[] {
  const basePatterns = definition.patterns || [];
  const extraPatterns = EXTRA_PATTERNS[moduleName]?.[definition.role] || [];
  const domainPatterns = getDomainTermsForRole(definition.role);

  return Array.from(new Set([...domainPatterns, ...extraPatterns, ...basePatterns].map(normalizeSmartConfigText).filter(Boolean)));
}

function patternMatchScore(column: string, patterns: string[]): { score: number; matched: string[] } {
  const normalizedColumn = normalizeSmartConfigText(column);
  const columnTokens = new Set(tokens(column));
  const matchedEntries = patterns
    .map((pattern, index) => ({ pattern, index }))
    .filter(({ pattern }) => {
    if (!pattern) return false;
    if (normalizedColumn === pattern || normalizedColumn.includes(pattern)) return true;
    return pattern.split(/\s+/).some(token => columnTokens.has(token));
  });
  const matched = matchedEntries.map(entry => entry.pattern);

  if (matched.length === 0) return { score: 0, matched: [] };

  const exact = matched.some(pattern => normalizedColumn === pattern);
  const tokenMatch = matched.some(pattern => columnTokens.has(pattern));
  const earliestIndex = Math.min(...matchedEntries.map(entry => entry.index));
  const priorityBoost = Math.max(0, 0.12 - earliestIndex * 0.02);
  const score = 0.58 + priorityBoost + (exact ? 0.08 : 0) + (tokenMatch ? 0.04 : 0);
  return { score: clampConfidence(score), matched };
}

function getRoleLabel(moduleName: ModuleName, definition: ModuleRoleDefinition): string {
  const domainLabel = getDomainTermsForRole(definition.role)[0];
  if (domainLabel) return domainLabel;
  return ROLE_LABELS[moduleName]?.[definition.role] || definition.label;
}

function getDomainTermsForRole(role: string): string[] {
  const domainId = businessDomainEngine.getActiveDomainId();
  if (!domainId || domainId === "shared" || domainId === "unknown") return [];

  const pack = businessDomainRegistry.get(domainId);
  if (!pack?.mapping?.suggestedMappings) return [];

  const vocabulary = pack.vocabulary?.terms || [];
  const terms: string[] = [];

  Object.entries(pack.mapping.suggestedMappings).forEach(([sourceTerm, genericTarget]) => {
    const normalizedTarget = normalizeSmartConfigText(genericTarget);
    const targetRoles = GENERIC_TARGET_TO_ROLES[normalizedTarget] || [];
    if (!targetRoles.includes(role)) return;

    terms.push(sourceTerm);
    const vocabularyTerm = vocabulary.find(item => normalizeSmartConfigText(item.term) === normalizeSmartConfigText(sourceTerm));
    if (vocabularyTerm) terms.push(...vocabularyTerm.synonyms);
  });

  return Array.from(new Set(terms));
}

function isExcludedForRole(moduleName: ModuleName, role: string, column: string): boolean {
  const exclusions = ROLE_EXCLUSIONS[moduleName]?.[role] || [];
  const normalizedColumn = normalizeSmartConfigText(column);
  const columnTokens = new Set(tokens(column));
  return exclusions.some(exclusion => {
    const normalizedExclusion = normalizeSmartConfigText(exclusion);
    return normalizedColumn.includes(normalizedExclusion) || columnTokens.has(normalizedExclusion);
  });
}

function findMemorySuggestion(
  definition: ModuleRoleDefinition,
  columns: string[],
  memory?: WorkspaceModuleMappingMemory | null,
): ColumnRoleSuggestion | null {
  const previousColumn = memory?.semanticRoles?.[definition.role];
  if (!previousColumn) return null;

  let bestColumn = "";
  let bestScore = 0;
  columns.forEach(column => {
    const score = columnTokenSimilarity(column, previousColumn);
    if (score > bestScore) {
      bestScore = score;
      bestColumn = column;
    }
  });

  if (!bestColumn || bestScore < 0.45) return null;

  return {
    column: bestColumn,
    semanticRole: definition.role,
    label: definition.label,
    confidence: clampConfidence(0.72 + bestScore * 0.22),
    evidence: [`Coluna semelhante ao mapeamento aceito anteriormente: ${previousColumn}`],
    source: "workspace_memory",
  };
}

export function suggestColumnRoles(
  moduleName: ModuleName,
  columns: string[],
  memory?: WorkspaceModuleMappingMemory | null,
): ColumnRoleSuggestion[] {
  const availableColumns = Array.from(new Set(columns.map(column => column.trim()).filter(Boolean)));
  const usedColumns = new Set<string>();
  const suggestions: ColumnRoleSuggestion[] = [];

  MODULE_ROLE_DEFINITIONS[moduleName].forEach(definition => {
    const memorySuggestion = findMemorySuggestion(definition, availableColumns, memory);
    const patterns = rolePatterns(moduleName, definition);
    let heuristicSuggestion: ColumnRoleSuggestion | null = null;

    availableColumns.forEach(column => {
      if (usedColumns.has(column)) return;
      if (isExcludedForRole(moduleName, definition.role, column)) return;
      const match = patternMatchScore(column, patterns);
      if (match.score <= 0) return;
      if (!heuristicSuggestion || match.score > heuristicSuggestion.confidence) {
        heuristicSuggestion = {
          column,
          semanticRole: definition.role,
          label: getRoleLabel(moduleName, definition),
          confidence: match.score,
          evidence: match.matched.map(pattern => `Padrão encontrado: ${pattern}`),
          source: "heuristic",
        };
      }
    });

    const selected = [memorySuggestion, heuristicSuggestion]
      .filter((item): item is ColumnRoleSuggestion => !!item)
      .sort((left, right) => right.confidence - left.confidence)[0];

    if (!selected || usedColumns.has(selected.column)) return;

    const heuristicSameColumn = heuristicSuggestion?.column === selected.column;
    const source: SmartSuggestionSource = selected.source === "workspace_memory" && heuristicSameColumn ? "mixed" : selected.source;
    suggestions.push({
      ...selected,
      label: getRoleLabel(moduleName, definition),
      source,
      confidence: clampConfidence(source === "mixed" ? Math.max(selected.confidence, (heuristicSuggestion?.confidence || 0) + 0.08) : selected.confidence),
      evidence: Array.from(new Set([
        ...selected.evidence,
        ...(source === "mixed" ? ["Confirmado por memória do workspace e padrões da coluna."] : []),
      ])),
    });
    usedColumns.add(selected.column);
  });

  return suggestions;
}
