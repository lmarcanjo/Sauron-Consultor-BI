export type SupportedDatabaseType = "postgres" | "mysql" | "mssql" | "oracle" | "mongodb";

export interface NormalizedDatabaseConfig {
  type: SupportedDatabaseType;
  host: string;
  port: number;
  user: string;
  database: string;
  ssl: boolean;
  table: string;
  query: string;
  mappings: Record<string, string>;
}

export interface DatabaseSourceSelection {
  sourceLabel: string;
  config: NormalizedDatabaseConfig;
  enterpriseContext: EnterpriseContext;
  expectedSourceId?: string;
}

export type DatabaseConfigNormalization =
  | { success: true; config: NormalizedDatabaseConfig }
  | { success: false; stage: "configuration"; message: string };

const SUPPORTED_TYPES = new Set<SupportedDatabaseType>(["postgres", "mysql", "mssql", "oracle", "mongodb"]);

function normalizeType(value: unknown): SupportedDatabaseType | null {
  const type = String(value || "").trim().toLowerCase() as SupportedDatabaseType;
  return SUPPORTED_TYPES.has(type) ? type : null;
}

/** Normalizes both the persisted dbType name and the runtime type name. */
export function normalizeDatabaseConfig(input: Record<string, any> = {}): DatabaseConfigNormalization {
  const typeValue = input.type == null ? null : normalizeType(input.type);
  const dbTypeValue = input.dbType == null ? null : normalizeType(input.dbType);

  if (input.type != null && !typeValue) {
    return { success: false, stage: "configuration", message: "Tipo de banco de dados não suportado." };
  }
  if (input.dbType != null && !dbTypeValue) {
    return { success: false, stage: "configuration", message: "Tipo de banco de dados não suportado." };
  }
  if (typeValue && dbTypeValue && typeValue !== dbTypeValue) {
    return { success: false, stage: "configuration", message: "A configuração informa tipos de banco conflitantes." };
  }

  const type = typeValue || dbTypeValue;
  if (!type) {
    return { success: false, stage: "configuration", message: "Tipo de banco de dados obrigatório." };
  }

  const portValue = Number(input.port || 0);
  return {
    success: true,
    config: {
      type,
      host: String(input.host || "").trim(),
      port: Number.isInteger(portValue) && portValue > 0 ? portValue : 0,
      user: String(input.user || "").trim(),
      database: String(input.database || "").trim(),
      ssl: Boolean(input.ssl),
      table: String(input.table ?? input.tableName ?? input.selectedTable ?? "").trim(),
      query: String(input.query || "").trim(),
      mappings: input.mappings && typeof input.mappings === "object" ? { ...input.mappings } : {},
    },
  };
}
import type { EnterpriseContext } from "../enterprise-consolidation/EnterpriseContextTypes";
