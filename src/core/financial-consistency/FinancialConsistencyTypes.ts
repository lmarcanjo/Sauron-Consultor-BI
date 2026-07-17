export const FINANCIAL_CONSISTENCY_STAGES = [
  "source",
  "dataset",
  "kpis",
  "dashboard",
  "narrative",
  "presentation",
  "meeting",
  "minutes",
  "actionPlan",
] as const;

export type FinancialConsistencyStage = typeof FINANCIAL_CONSISTENCY_STAGES[number];
export type FinancialConsistencyStatus = "consistent" | "inconsistent" | "pending";

export type CertifiedSnapshotStatus = "CONSISTENT" | "INCONSISTENT" | "PENDING" | "NOT_APPLICABLE";

export type ConsistencyValue = number | null | undefined;

export interface ConsistencyLineage {
  sourceId?: string | null;
  workbookId?: string | null;
  sheetName?: string | null;
  physicalColumnName?: string | null;
  semanticRole?: string | null;
  mappingId?: string | null;
  contextId?: string | null;
  companyId?: string | null;
  unitId?: string | null;
  period?: string | null;
  formulaId?: string | null;
  ruleId?: string | null;
  producer: string;
  calculatedAt: string;
}

export interface ConsistencyMetric {
  metricKey: string;
  displayLabel: string;
  sourceValue: ConsistencyValue;
  datasetValue: ConsistencyValue;
  kpiValue: ConsistencyValue;
  dashboardValue: ConsistencyValue;
  narrativeValue: ConsistencyValue;
  presentationValue: ConsistencyValue;
  meetingValue: ConsistencyValue;
  minutesValue: ConsistencyValue;
  actionPlanValue: ConsistencyValue;
  tolerance: number;
  lineage: ConsistencyLineage;
}

export interface FinancialConsistencySource {
  sourceName?: string | null;
  workbookId?: string | null;
  datasetId?: string | null;
  sheetName?: string | null;
  columnsUsed?: string[];
  description?: string | null;
}

export interface FinancialConsistencyStageSnapshot {
  stage: FinancialConsistencyStage;
  values: Record<string, number | null | undefined>;
  source?: FinancialConsistencySource;
}

export interface FinancialConsistencyDifference {
  metricId: string;
  expectedValue: number;
  actualValue: number;
  difference: number;
  expectedStage: FinancialConsistencyStage;
  actualStage: FinancialConsistencyStage;
}

export interface FinancialConsistencyMetricResult {
  metricId: string;
  status: FinancialConsistencyStatus;
  expectedValue: number | null;
  valuesByStage: Partial<Record<FinancialConsistencyStage, number>>;
  missingStages: FinancialConsistencyStage[];
  differences: FinancialConsistencyDifference[];
  invalidStages?: FinancialConsistencyStage[];
}

export interface FinancialConsistencyReport {
  id: string;
  status: FinancialConsistencyStatus;
  sourceStage: FinancialConsistencyStage;
  requiredStages: FinancialConsistencyStage[];
  stages: FinancialConsistencyStageSnapshot[];
  metrics: FinancialConsistencyMetricResult[];
  differences: FinancialConsistencyDifference[];
  missingStages: FinancialConsistencyStage[];
  invalidValues?: Array<{ metricId: string; stage: FinancialConsistencyStage }>;
  diagnostics: string[];
  createdAt: string;
}

export interface FinancialConsistencyInput {
  stages: FinancialConsistencyStageSnapshot[];
  requiredStages?: FinancialConsistencyStage[];
  sourceStage?: FinancialConsistencyStage;
  tolerance?: number;
  reportId?: string;
}

export type ConsistencyReadiness =
  | "READY_FOR_ANALYSIS"
  | "READY_FOR_PRESENTATION"
  | "READY_FOR_MEETING"
  | "PENDING"
  | "BLOCKED";

export interface ConsistencyReadinessReport {
  readiness: ConsistencyReadiness;
  status: FinancialConsistencyStatus;
  report: FinancialConsistencyReport;
  canPublish: boolean;
  message: "Dados conferidos" | "Dados aguardando confirmação" | "Encontramos uma diferença";
  applicableStages: FinancialConsistencyStage[];
}

export interface FinancialMetricRecord {
  id?: string;
  name?: string;
  value?: number | null;
}

/** Immutable evidence envelope shared by executive producers. */
export interface CertifiedMetricSnapshot {
  snapshotId: string;
  tenantId: string;
  workspaceId: string;
  contextType: "GROUP" | "COMPANY" | "UNIT" | "WORKBOOK";
  contextId: string;
  datasetVersion: string;
  period?: { start?: string; end?: string };
  generatedAt: string;
  metrics: Record<string, { value: number | null; sourceValue: number | null; status: CertifiedSnapshotStatus }>;
  consistencyStatus: CertifiedSnapshotStatus;
  lineage: ConsistencyLineage[];
}
