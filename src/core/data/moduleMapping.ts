import { ActiveDataset } from "../../types/dataSource";
import { activeDatasetStore } from "./ActiveDatasetStore";
import { dispatchPlatformEvent, PLATFORM_EVENTS } from "../events/PlatformEvents";

export type ModuleName = "Financeiro" | "Comercial" | "Pessoas" | "DRE" | "Comissão";

export interface ModuleFieldMapping {
  projectId: string;
  datasetId: string;
  moduleName: ModuleName;
  sheetName: string;
  selectedColumns: string[];
  semanticRoles: Record<string, string>;
  updatedAt: string;
}

export interface SaveModuleFieldMappingInput {
  projectId?: string;
  datasetId?: string;
  moduleName: ModuleName;
  sheetName: string;
  selectedColumns: string[];
  semanticRoles?: Record<string, string>;
}

export interface ModuleRoleDefinition {
  role: string;
  label: string;
  patterns: string[];
}

const STORAGE_KEY = "sauron_module_field_mappings_v1";
const DEFAULT_PROJECT_ID = "default";

export const MODULE_ROLE_DEFINITIONS: Record<ModuleName, ModuleRoleDefinition[]> = {
  Financeiro: [
    { role: "value", label: "Valor", patterns: ["valor", "venda", "total", "vlr", "liquido", "bruto"] },
    { role: "cost", label: "Custo", patterns: ["custo", "cmv", "cpv"] },
    { role: "margin", label: "Margem/Lucro", patterns: ["margem", "lucro", "rentabilidade"] },
    { role: "commission", label: "Comissão", patterns: ["comiss"] },
    { role: "date", label: "Data", patterns: ["data", "emissao", "dt", "mes"] },
  ],
  Comercial: [
    { role: "product", label: "Produto/Item", patterns: ["produto", "item", "peca", "peça", "codigo", "código", "descrição", "descricao"] },
    { role: "seller", label: "Vendedor/Consultor", patterns: ["vendedor", "consultor", "colaborador"] },
    { role: "client", label: "Cliente", patterns: ["cliente", "comprador", "contato", "empresa", "cpf", "cnpj"] },
    { role: "value", label: "Valor de venda", patterns: ["valor", "venda", "total", "receita", "faturamento", "mercadoria", "fatur", "vlr", "liquido", "líquido", "bruto"] },
    { role: "date", label: "Data", patterns: ["data", "emissao", "emissão", "dt", "mes", "mês"] },
    { role: "category", label: "Marca/Grupo", patterns: ["marca", "grupo", "familia", "família", "categoria", "departamento", "linha"] },
  ],
  Pessoas: [
    { role: "name", label: "Nome", patterns: ["nome", "colaborador", "funcionario", "funcionário", "consultor", "vendedor"] },
    { role: "seller", label: "Vendedor", patterns: ["vendedor", "consultor"] },
    { role: "employee", label: "Funcionário", patterns: ["funcionario", "funcionário", "colaborador"] },
    { role: "cpf", label: "CPF", patterns: ["cpf"] },
    { role: "registration", label: "Matrícula", patterns: ["matricula", "matrícula", "mat", "registro"] },
    { role: "role", label: "Cargo/Função", patterns: ["cargo", "funcao", "função"] },
    { role: "department", label: "Setor", patterns: ["setor", "departamento", "equipe"] },
    { role: "store", label: "Loja/Unidade", patterns: ["loja", "unidade", "filial", "empresa"] },
    { role: "commission", label: "Comissão", patterns: ["comiss"] },
  ],
  DRE: [
    { role: "revenue", label: "Receita", patterns: ["receita", "venda", "fatur"] },
    { role: "cost", label: "Custo", patterns: ["custo", "cmv", "cpv"] },
    { role: "expense", label: "Despesa", patterns: ["despesa"] },
    { role: "deduction", label: "Dedução", patterns: ["deducao", "dedução", "imposto"] },
    { role: "account", label: "Conta", patterns: ["conta", "razao", "razão", "categoria"] },
    { role: "date", label: "Data", patterns: ["data", "mes", "mês", "competencia", "competência"] },
    { role: "costCenter", label: "Centro de custo", patterns: ["centro", "setor", "departamento"] },
  ],
  Comissão: [
    { role: "seller", label: "Vendedor", patterns: ["nome", "vendedor", "consultor", "colaborador", "funcionario", "funcionário"] },
    { role: "base", label: "Base de cálculo", patterns: ["base", "valor", "venda", "total", "fatur"] },
    { role: "rate", label: "Percentual", patterns: ["percentual", "perc", "%", "taxa"] },
    { role: "amount", label: "Comissão", patterns: ["comiss"] },
    { role: "goal", label: "Meta", patterns: ["meta", "objetivo"] },
    { role: "unit", label: "Loja/Unidade", patterns: ["unidade", "loja", "filial", "empresa"] },
    { role: "date", label: "Data", patterns: ["data", "mes", "mês"] },
  ],
};

type MappingStorage = Record<string, ModuleFieldMapping>;
type MappingListener = (mapping: ModuleFieldMapping) => void;

const listeners = new Set<MappingListener>();

function getActiveDatasetId(): string | null {
  return activeDatasetStore.getActiveDataset()?.datasetId || null;
}

function normalizeProjectId(projectId?: string): string {
  return projectId?.trim() || DEFAULT_PROJECT_ID;
}

function buildMappingKey(projectId: string, datasetId: string, moduleName: ModuleName): string {
  return `${projectId}::${datasetId}::${moduleName}`;
}

function readStorage(): MappingStorage {
  if (typeof localStorage === "undefined") return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStorage(storage: MappingStorage): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

function uniqueColumns(columns: string[]): string[] {
  return Array.from(new Set(columns.map(column => column.trim()).filter(Boolean)));
}

function cleanSemanticRoles(roles: Record<string, string> | undefined, selectedColumns: string[]): Record<string, string> {
  const selected = new Set(selectedColumns);
  return Object.fromEntries(
    Object.entries(roles || {})
      .map(([role, column]) => [role, column.trim()] as const)
      .filter(([, column]) => column && selected.has(column))
  );
}

function emitMappingUpdated(mapping: ModuleFieldMapping): void {
  listeners.forEach(listener => listener(mapping));
  if (typeof window !== "undefined") {
    dispatchPlatformEvent(PLATFORM_EVENTS.SOURCE_CONFIGURED, mapping);
  }
}

export function getDefaultProjectId(dataset?: ActiveDataset | null): string {
  return dataset?.importProfile?.id || DEFAULT_PROJECT_ID;
}

export function getModuleMapping(
  moduleName: ModuleName,
  datasetId = getActiveDatasetId(),
  projectId = DEFAULT_PROJECT_ID,
): ModuleFieldMapping | null {
  if (!datasetId) return null;

  const storage = readStorage();
  return storage[buildMappingKey(normalizeProjectId(projectId), datasetId, moduleName)] || null;
}

export function listModuleMappings(datasetId = getActiveDatasetId(), projectId = DEFAULT_PROJECT_ID): ModuleFieldMapping[] {
  if (!datasetId) return [];
  const prefix = `${normalizeProjectId(projectId)}::${datasetId}::`;
  return Object.entries(readStorage())
    .filter(([key]) => key.startsWith(prefix))
    .map(([, mapping]) => mapping);
}

export function saveModuleMapping(input: SaveModuleFieldMappingInput): ModuleFieldMapping {
  const datasetId = input.datasetId || getActiveDatasetId();
  if (!datasetId) {
    throw new Error("Não há ActiveDataset para salvar o mapeamento do módulo.");
  }

  const selectedColumns = uniqueColumns(input.selectedColumns);
  const mapping: ModuleFieldMapping = {
    projectId: normalizeProjectId(input.projectId),
    datasetId,
    moduleName: input.moduleName,
    sheetName: input.sheetName,
    selectedColumns,
    semanticRoles: cleanSemanticRoles(input.semanticRoles, selectedColumns),
    updatedAt: new Date().toISOString(),
  };

  const storage = readStorage();
  storage[buildMappingKey(mapping.projectId, mapping.datasetId, mapping.moduleName)] = mapping;
  writeStorage(storage);
  emitMappingUpdated(mapping);
  return mapping;
}

export function removeModuleMapping(moduleName: ModuleName, datasetId = getActiveDatasetId(), projectId = DEFAULT_PROJECT_ID): void {
  if (!datasetId) return;
  const storage = readStorage();
  delete storage[buildMappingKey(normalizeProjectId(projectId), datasetId, moduleName)];
  writeStorage(storage);
}

export function subscribeModuleMappings(listener: MappingListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
