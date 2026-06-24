/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LancamentoFinanceiro } from "../types";

export type ActiveDataSource =
  | "DEMO_DATA"
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
  importedAt: string;
  importedBy: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING_MAPPING" | "PENDING_APPROVAL" | "PENDING_VALIDATION" | "ERROR";
  sheets: SpreadsheetSheet[];
  totalRows: number;
  totalColumns: number;
  qualityScore?: number; // quality score (0-100)
  approvedByConsultant?: boolean;
}

export interface SpreadsheetColumn {
  name: string;
  type: string;
  hasEmptyValues: boolean;
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
  targetFilter?: string; // e.g. "Marca=Topázio Fiat"
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
