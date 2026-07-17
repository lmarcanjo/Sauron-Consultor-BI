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
}

const DATA_MODULES = new Set([
  "resumo", "comercial", "obstaculos", "consultor_ia", "relatorios", "narrativa_executiva",
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
