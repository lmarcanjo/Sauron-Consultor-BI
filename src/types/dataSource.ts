/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LancamentoFinanceiro } from "../types";

export type ActiveDataSource =
  | "SPREADSHEET_DATA"
  | "DATABASE_DATA"
  | "CONSULTANT_DATA"
  | "MIXED_APPROVED_DATA";

export interface DataSourceState {
  activeDataSource: ActiveDataSource;
  activeSpreadsheetIds: string[];
  activeDatabaseConnectionId?: string;
  allowMixedSources: boolean;
  approvedByConsultant: boolean;
  lastUpdatedAt: string;
}

// 5. Spreadsheet Workspace Manager types
export interface SpreadsheetWorkspace {
  id: string;
  name: string;
  clientId?: string;
  files: SpreadsheetFile[];
  activeFileIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SpreadsheetFile {
  id: string;
  fileName: string;
  nome?: string; // alias in Portuguese
  importedAt: string;
  dataImportacao?: string; // alias in Portuguese
  importedBy: string;
  usuario?: string; // alias in Portuguese
  status: "ACTIVE" | "INACTIVE" | "PENDING_MAPPING" | "PENDING_APPROVAL" | "PENDING_VALIDATION" | "ERROR";
  sheets: SpreadsheetSheet[];
  totalRows: number;
  totalColumns: number;
  totalAbas?: number; // count of sheets
  qualityScore?: number; // quality score (0-100)
  qualityLabel?: "Excelente" | "Boa" | "Atenção" | "Crítica"; // quality rating
  scoreQualidade?: "Excelente" | "Boa" | "Atenção" | "Crítica"; // alias in Portuguese
  approvedByConsultant?: boolean;
  version?: string; // e.g., "v1", "v2", "v3"
  versao?: string; // alias in Portuguese
}

export interface SpreadsheetColumn {
  name: string;
  type: string;
  hasEmptyValues: boolean;
  alias?: string;
  ignored?: boolean;
  dataType?: string;
  isFilter?: boolean;
  isKPI?: boolean;
  isDRE?: boolean;
  isPessoas?: boolean;
  isComissao?: boolean;
  isApresentacao?: boolean;
  description?: string;
}

export interface SpreadsheetSheet {
  id: string;
  fileId: string;
  sheetName: string;
  rows: Record<string, any>[];
  columns: SpreadsheetColumn[];
}

// 7. Client Filter Manager configuration
export interface ClientFilterConfig {
  id: string;
  sourceColumn: string;
  friendlyName: string;
  type: "text" | "select" | "multiselect" | "date" | "month" | "year" | "number" | "currency" | "range";
  visibleToConsultant: boolean;
  visibleToClient: boolean;
  visibleInReports: boolean;
  visibleInPresentations: boolean;
  required: boolean;
  defaultValue?: any;
  order: number;
}

// 12. Consultant Data separate layer
export interface ConsultantAdjustment {
  id: string;
  type: "meta" | "comentario" | "observacao" | "cenario" | "classificacao" | "agrupamento" | "indicador" | "plano_acao" | "insight_favorito" | "bookmark" | "nota";
  targetField?: string; // e.g. "Receita" or "Lucro"
  targetFilter?: string; // e.g. "Campo=Valor"
  value: any;
  description: string;
  createdAt: string;
  createdBy: string;
}

// 14. Versioning of importations
export interface DataVersion {
  versionId: string; // e.g., "v001"
  label: string; // e.g., "Importação 001"
  timestamp: string;
  user: string;
  recordsCount: number;
  status: "OFFICIAL" | "DISCARDED" | "PREVIEW";
  notes?: string;
  source: "SPREADSHEET" | "DATABASE";
  // The records in this version
  data: LancamentoFinanceiro[];
}

export interface ColumnProfile {
  name: string;
  type: string;
  originalName: string;
  isFilter?: boolean;
  isKPI?: boolean;
  isDRE?: boolean;
  isPessoas?: boolean;
  isComissao?: boolean;
  isApresentacao?: boolean;
  description?: string;
  hasEmptyValues?: boolean;
}

export interface ActiveDatasetRow {
  raw: Record<string, any>;
  normalized?: Record<string, any>;
  metadata: {
    rowIndex: number;
    sheetName: string;
    fileName: string;
  };
}

export interface SheetMetadata {
  sheetName: string;
  rowCount: number;
  columnCount: number;
  /** Physical headers found in the source file. Never renamed by the UI. */
  columns?: string[];
  formulaCount: number;
  storageRef: string;
  classification: "Base de dados" | "Cadastro" | "Relatório" | "Cálculo/Fórmulas" | "Configuração" | "Vazia" | "Não classificada";
  selectedForImport: boolean;
}

export interface ActiveDataset {
  datasetId: string;
  /** Source datasets represented by a multi-workbook selection. */
  sourceDatasetIds?: string[];
  sourceWorkbookIds?: string[];
  sourceType: ActiveDataSource;
  sourceName: string;
  importedAt: string;
  rowCount: number;
  columnCount: number;
  sheets: (string | SheetMetadata)[]; // Support both old and new
  activeSheet: string;
  previewRows: ActiveDatasetRow[];
  columnProfiles: ColumnProfile[];
  importProfile: ImportProfile | null;
  rawStorageRef: string;
  status:
    | "PENDING"
    | "PARSING"
    | "PERSISTING"
    | "READY"
    | "ACTIVE"
    | "PENDING_CONFIGURATION"
    | "STORAGE_INCOMPLETE"
    | "FAILED"
    | "ARCHIVED"
    | "DELETED";
  sourceIdentity?: SourceIdentity;
  databaseType?: string;
  databaseHost?: string;
  databasePort?: number;
  databaseName?: string;
  tableName?: string;
  physicalColumns?: string[];
  activatedAt?: string;
  version?: number;
}

export interface ActiveWorkbookDataset extends ActiveDataset {
  workbookId: string;
  sheets: SheetMetadata[];
  formulaCount: number;
}

// 18. Import Profile
export interface ImportProfile {
  id: string;
  clientName: string;
  profileName: string;
  mappings: Record<string, string>;
  selectedFilters: ClientFilterConfig[];
  expectedFiles: string[];
  lastApplied: string;
}

// 19. Source Identity Canonical Definition
export interface SourceIdentity {
  sourceId: string;
  workbookId: string;
  datasetId: string;
  importJobId?: string;
  fingerprint: string;
  fileName: string;
  storageMetadataKey: string;
  storageRowsKey: string;
  tenantId?: string;
  enterpriseId?: string;
  companyId?: string;
  unitId?: string;
  groupId?: string;
  workspaceId?: string;
  /** Compatibility alias retained while older persisted datasets migrate. */
  storageKey?: string;
  /** Compatibility alias retained while older persisted datasets migrate. */
  originalFileName: string;
}

// 20. Explicit ActiveSourceSelection Entity
export interface ActiveSourceSelection {
  contextId: string;
  sourceIds: string[];
  updatedAt: string;
  tenantId?: string;
  workspaceId?: string;
  scopeType?: "GROUP" | "COMPANY" | "UNIT";
  scopeId?: string;
}
