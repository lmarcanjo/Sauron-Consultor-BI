import { ActiveDataset } from "../../types/dataSource";
import { BusinessIntelligenceContext, BusinessMetric } from "../business-intelligence";
import { ModuleFieldMapping, ModuleName } from "../data/moduleMapping";
import { CertifiedMetricSnapshot, ConsistencyReadinessReport } from "../financial-consistency";

export type DashboardBlockType =
  | "MetricCard"
  | "RankingBlock"
  | "TableBlock"
  | "PendingConfigBlock"
  | "InsightBlock";

export type DashboardBlockStatus = "ready" | "pending" | "insufficient_data" | "empty" | "error";

export interface DashboardLineage {
  datasetId: string | null;
  workbookId?: string | null;
  sourceName: string | null;
  inputSheets: string[];
  inputColumns: string[];
  moduleMappings: Array<{
    moduleName: ModuleName;
    sheetName: string;
    selectedColumns: string[];
    semanticRoles: Record<string, string>;
  }>;
  metricIds: string[];
  knowledgeGraphNodes: string[];
  businessRules: string[];
  transformations: string[];
  rowAccess: {
    strategy: "rowProvider" | "indexedDB" | "api" | "preview" | "none";
    rowsRead: number;
    rowsSampled: number;
  };
}

export interface DashboardDiagnostics {
  confidence: number;
  warnings: string[];
  errors: string[];
  missingMappings: ModuleName[];
  missingColumns: string[];
  source: "BusinessIntelligenceEngine" | "ModuleMapping" | "ActiveDataset" | "WorkbookCatalog";
}

export interface DashboardRankingItem {
  label: string;
  count: number;
  value: number | null;
  formattedValue?: string | null;
  sourceRowCount?: number;
}

export interface DashboardTableData {
  columns: string[];
  rows: Record<string, unknown>[];
  sheetName: string | null;
  rowCount: number;
}

export interface DashboardMetricCardData {
  metricName: BusinessMetric["name"];
  label: string;
  value: number | null;
  formattedValue: string;
  unit: "currency" | "integer" | "number";
  sheetName: string | null;
  columnsUsed: string[];
}

export interface DashboardPendingConfigData {
  moduleName: ModuleName | "Executive";
  message: string;
  requiredMappings: ModuleName[];
  requiredColumns: string[];
  availableSheets: string[];
}

export interface DashboardInsightData {
  severity: "info" | "warning" | "critical";
  message: string;
  evidence: string[];
}

export interface DashboardBlock<TData = unknown> {
  id: string;
  title: string;
  type: DashboardBlockType;
  status: DashboardBlockStatus;
  data: TData;
  sourceMetrics: BusinessMetric[];
  lineage: DashboardLineage;
  diagnostics: DashboardDiagnostics;
}

export interface ExecutiveDashboard {
  dashboardId: string;
  moduleName: ModuleName | "Executive";
  datasetId: string | null;
  sourceName: string | null;
  blocks: DashboardBlock[];
  diagnostics: DashboardDiagnostics;
  lineage: DashboardLineage;
  createdAt: string;
  consistency?: ConsistencyReadinessReport;
  certifiedSnapshot?: CertifiedMetricSnapshot;
}

export interface DashboardEngineContext extends BusinessIntelligenceContext {
  activeDataset: ActiveDataset | null;
  moduleMappings: ModuleFieldMapping[];
  /** Canonical enterprise context used to label certified outputs. */
  contextType?: "GROUP" | "COMPANY" | "UNIT" | "WORKBOOK";
  contextId?: string;
  tenantId?: string;
  workspaceId?: string;
  period?: { start?: string; end?: string };
}

export interface DashboardBlockExplanation {
  block: DashboardBlock | null;
  summary: string;
  lineage: DashboardLineage | null;
  diagnostics: DashboardDiagnostics | null;
  evidence: string[];
}
