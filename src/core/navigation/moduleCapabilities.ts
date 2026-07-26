export type ModuleCapabilityState =
  | "AVAILABLE"
  | "PENDING_CONFIGURATION"
  | "NOT_APPLICABLE"
  | "EXPERIMENTAL"
  | "DISABLED";

export interface ModuleCapabilityContext {
  hasActiveDataset: boolean;
  hasMapping?: boolean;
  permissionGranted?: boolean;
  /** The consultant confirmed the source interpretation in Structural Analysis. */
  hasConfirmedDatasetView?: boolean;
  confirmedColumns?: string[];
  mappings?: Array<{
    moduleName: string;
    selectedColumns: string[];
    semanticRoles: Record<string, string>;
  }>;
  numericColumns?: string[];
  textColumns?: string[];
}

const DATA_MODULES = new Set([
  "resumo", "comercial", "obstaculos", "consultor_ia", "relatorios",
  "apresentacoes", "preparacao_reuniao", "modo_reuniao", "reuniao_ata", "plano_executivo",
  "comissoes", "historico_executivo", "comparativos_mensais", "fechamento_mensal",
]);

export function getModuleCapabilityState(
  moduleId: string,
  context: ModuleCapabilityContext,
): ModuleCapabilityState {
  if (context.permissionGranted === false) return "DISABLED";
  if (moduleId === "apresentacoes_templates") return "AVAILABLE";
  if (DATA_MODULES.has(moduleId) && !context.hasActiveDataset) return "PENDING_CONFIGURATION";
  return "AVAILABLE";
}

export function shouldExposeModule(state: ModuleCapabilityState): boolean {
  return state !== "EXPERIMENTAL" && state !== "DISABLED";
}

const columnPatterns: Record<string, RegExp[]> = {
  value: [/valor/i, /venda/i, /receita/i, /fatur/i, /total/i],
  cost: [/custo/i, /cmv/i, /cpv/i],
  person: [/pessoa/i, /nome/i, /vendedor/i, /consultor/i, /colaborador/i, /funcion/i],
  product: [/produto/i, /item/i, /peca/i, /peça/i, /codigo/i, /código/i],
  client: [/cliente/i, /comprador/i, /cpf/i, /cnpj/i],
};

function hasPattern(columns: string[], patterns: RegExp[]): boolean {
  return columns.some(column => patterns.some(pattern => pattern.test(column)));
}

function mappingFor(
  context: ModuleCapabilityContext,
  names: string[],
): ModuleCapabilityContext["mappings"][number] | undefined {
  return context.mappings?.find(mapping => names.includes(mapping.moduleName));
}

/**
 * Resolves the result surface from the confirmed source, instead of exposing
 * every historical tab and asking each module to configure itself again.
 */
export function resolveResultModuleCapability(
  moduleId: string,
  context: ModuleCapabilityContext,
): ModuleCapabilityState {
  if (context.permissionGranted === false) return "DISABLED";
  if (!context.hasActiveDataset) return "PENDING_CONFIGURATION";
  if (moduleId === "resumo") return "AVAILABLE";
  if (!context.hasConfirmedDatasetView) return "NOT_APPLICABLE";

  const columns = context.confirmedColumns || [];
  const numericColumns = context.numericColumns || [];
  const textColumns = context.textColumns || [];

  switch (moduleId) {
    case "financeiro":
      return mappingFor(context, ["Financeiro"])
        || numericColumns.length > 0
        ? "AVAILABLE"
        : "NOT_APPLICABLE";
    case "comercial":
      return mappingFor(context, ["Comercial"])
        || (hasPattern(columns, columnPatterns.value) && hasPattern(columns, columnPatterns.product))
        ? "AVAILABLE"
        : "NOT_APPLICABLE";
    case "comissoes":
    case "vendedores":
      return mappingFor(context, ["Pessoas", "Comissão"])
        || hasPattern(columns, columnPatterns.person)
        ? "AVAILABLE"
        : "NOT_APPLICABLE";
    case "dre_inteligente":
      return mappingFor(context, ["DRE"])
        || (hasPattern(columns, columnPatterns.value) && (hasPattern(columns, columnPatterns.cost) || numericColumns.length > 1))
        ? "AVAILABLE"
        : "NOT_APPLICABLE";
    case "obstaculos":
    case "consultor_ia":
      return numericColumns.length > 0 ? "AVAILABLE" : "NOT_APPLICABLE";
    case "contabil":
      return hasPattern(columns, [/conta/i, /razão/i, /razao/i]) ? "AVAILABLE" : "NOT_APPLICABLE";
    case "itens":
    case "estoque":
      return hasPattern(columns, columnPatterns.product) ? "AVAILABLE" : "NOT_APPLICABLE";
    default:
      return textColumns.length > 0 || numericColumns.length > 0 ? "AVAILABLE" : "NOT_APPLICABLE";
  }
}
