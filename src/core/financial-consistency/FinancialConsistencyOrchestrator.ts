import {
  ConsistencyLineage,
  ConsistencyMetric,
  ConsistencyReadiness,
  ConsistencyReadinessReport,
  CertifiedMetricSnapshot,
  FinancialConsistencyReport,
  FinancialConsistencyStage,
  FinancialConsistencyStageSnapshot,
} from "./FinancialConsistencyTypes";
import { createStageSnapshot, financialConsistencyEngine } from "./FinancialConsistencyEngine";

const VALUE_BY_STAGE: Record<FinancialConsistencyStage, keyof ConsistencyMetric> = {
  source: "sourceValue",
  dataset: "datasetValue",
  kpis: "kpiValue",
  dashboard: "dashboardValue",
  narrative: "narrativeValue",
  presentation: "presentationValue",
  meeting: "meetingValue",
  minutes: "minutesValue",
  actionPlan: "actionPlanValue",
};

export interface ConsistencyOrchestrationInput {
  contextId: string;
  metrics: ConsistencyMetric[];
  requiredStages: FinancialConsistencyStage[];
  reportId?: string;
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function readinessFor(requiredStages: FinancialConsistencyStage[], status: FinancialConsistencyReport["status"]): ConsistencyReadiness {
  if (status === "inconsistent") return "BLOCKED";
  if (status !== "consistent") return "PENDING";
  if (requiredStages.includes("actionPlan")) return "READY_FOR_MEETING";
  if (requiredStages.includes("presentation")) return "READY_FOR_PRESENTATION";
  return "READY_FOR_ANALYSIS";
}

function messageFor(status: FinancialConsistencyReport["status"]): ConsistencyReadinessReport["message"] {
  if (status === "consistent") return "Dados conferidos";
  if (status === "inconsistent") return "Encontramos uma diferença";
  return "Dados aguardando confirmação";
}

export function snapshotsFromConsistencyMetrics(metrics: ConsistencyMetric[]): FinancialConsistencyStageSnapshot[] {
  const stages = new Map<FinancialConsistencyStage, Record<string, number | null | undefined>>();
  metrics.forEach(metric => {
    (Object.keys(VALUE_BY_STAGE) as FinancialConsistencyStage[]).forEach(stage => {
      const values = stages.get(stage) || {};
      values[metric.metricKey] = metric[VALUE_BY_STAGE[stage]] as number | null | undefined;
      stages.set(stage, values);
    });
  });

  return Array.from(stages.entries()).map(([stage, values]) => createStageSnapshot(stage, values, {
    sourceName: metrics[0]?.displayLabel || null,
    datasetId: metrics[0]?.lineage.sourceId || null,
    workbookId: metrics[0]?.lineage.workbookId || null,
    sheetName: metrics[0]?.lineage.sheetName || null,
    columnsUsed: metrics.map(metric => metric.lineage.physicalColumnName).filter((value): value is string => Boolean(value)),
  }));
}

export function buildConsistencyMetricFromBusinessMetric(params: {
  metricKey: string;
  displayLabel: string;
  value: number | null;
  lineage: ConsistencyLineage;
  sourceValue?: number | null;
  datasetValue?: number | null;
  dashboardValue?: number | null;
  tolerance?: number;
}): ConsistencyMetric {
  return {
    metricKey: params.metricKey,
    displayLabel: params.displayLabel,
    sourceValue: params.sourceValue ?? null,
    datasetValue: params.datasetValue ?? params.value,
    kpiValue: params.value,
    dashboardValue: params.dashboardValue ?? params.value,
    narrativeValue: null,
    presentationValue: null,
    meetingValue: null,
    minutesValue: null,
    actionPlanValue: null,
    tolerance: params.tolerance ?? 0,
    lineage: params.lineage,
  };
}

export function buildCertifiedMetricSnapshot(params: {
  tenantId?: string;
  workspaceId?: string;
  contextType: "GROUP" | "COMPANY" | "UNIT" | "WORKBOOK";
  contextId: string;
  datasetVersion: string;
  period?: { start?: string; end?: string };
  metrics: ConsistencyMetric[];
  consistency?: FinancialConsistencyReport;
}): CertifiedMetricSnapshot {
  const metricResults = new Map((params.consistency?.metrics || []).map(metric => [metric.metricId, metric]));
  const metrics = Object.fromEntries(params.metrics.map(metric => {
    const result = metricResults.get(metric.metricKey);
    const status: CertifiedMetricSnapshot["consistencyStatus"] = result?.status === "inconsistent"
      ? "INCONSISTENT"
      : result?.status === "pending" || metric.sourceValue === null || (metric.dashboardValue ?? metric.kpiValue) === null
        ? "PENDING"
        : "CONSISTENT";
    return [metric.metricKey, { value: metric.dashboardValue ?? metric.kpiValue ?? null, sourceValue: metric.sourceValue ?? null, status }];
  }));
  const statuses = Object.values(metrics).map(metric => metric.status);
  const consistencyStatus: CertifiedMetricSnapshot["consistencyStatus"] = statuses.includes("INCONSISTENT")
    ? "INCONSISTENT"
    : statuses.includes("PENDING") || statuses.length === 0
      ? "PENDING"
      : "CONSISTENT";

  return {
    snapshotId: `snapshot:${params.contextId}:${params.datasetVersion}`,
    tenantId: params.tenantId || "local",
    workspaceId: params.workspaceId || "workspace_default",
    contextType: params.contextType,
    contextId: params.contextId,
    datasetVersion: params.datasetVersion,
    period: params.period,
    generatedAt: new Date().toISOString(),
    metrics,
    consistencyStatus,
    lineage: params.metrics.map(metric => metric.lineage),
  };
}

const CERTIFIED_SNAPSHOT_STORAGE_PREFIX = "sauron_certified_metric_snapshot:";

function mergeSnapshotStatus(
  left: CertifiedMetricSnapshot["consistencyStatus"],
  right: CertifiedMetricSnapshot["consistencyStatus"]
): CertifiedMetricSnapshot["consistencyStatus"] {
  if (left === "INCONSISTENT" || right === "INCONSISTENT") return "INCONSISTENT";
  if (left === "PENDING" || right === "PENDING") return "PENDING";
  if (left === "NOT_APPLICABLE" && right === "NOT_APPLICABLE") return "NOT_APPLICABLE";
  return "CONSISTENT";
}

/**
 * Small local persistence boundary for the immutable evidence envelope. It
 * stores metadata and metric values only; workbook rows remain in IndexedDB.
 * Saving is idempotent for a context/dataset version and merges module metric
 * contributions into the same certified snapshot.
 */
export const certifiedMetricSnapshotStore = {
  save(snapshot: CertifiedMetricSnapshot): CertifiedMetricSnapshot {
    if (typeof localStorage === "undefined") return snapshot;
    const key = `${CERTIFIED_SNAPSHOT_STORAGE_PREFIX}${snapshot.snapshotId}`;
    try {
      const previous = JSON.parse(localStorage.getItem(key) || "null") as CertifiedMetricSnapshot | null;
      const merged: CertifiedMetricSnapshot = previous
        ? {
            ...previous,
            generatedAt: snapshot.generatedAt,
            period: snapshot.period || previous.period,
            metrics: { ...previous.metrics, ...snapshot.metrics },
            consistencyStatus: mergeSnapshotStatus(previous.consistencyStatus, snapshot.consistencyStatus),
            lineage: Array.from(new Map(
              [...previous.lineage, ...snapshot.lineage].map(line => [
                `${line.producer}:${line.sourceId || ""}:${line.sheetName || ""}:${line.physicalColumnName || ""}`,
                line,
              ])
            ).values()),
          }
        : snapshot;
      localStorage.setItem(key, JSON.stringify(merged));
      localStorage.setItem(`${CERTIFIED_SNAPSHOT_STORAGE_PREFIX}latest`, merged.snapshotId);
      return merged;
    } catch {
      return snapshot;
    }
  },

  get(snapshotId: string): CertifiedMetricSnapshot | null {
    if (typeof localStorage === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem(`${CERTIFIED_SNAPSHOT_STORAGE_PREFIX}${snapshotId}`) || "null");
    } catch {
      return null;
    }
  },

  getLatest(): CertifiedMetricSnapshot | null {
    if (typeof localStorage === "undefined") return null;
    try {
      const snapshotId = localStorage.getItem(`${CERTIFIED_SNAPSHOT_STORAGE_PREFIX}latest`);
      return snapshotId ? this.get(snapshotId) : null;
    } catch {
      return null;
    }
  },
};

export class FinancialConsistencyOrchestrator {
  public reconcile(input: ConsistencyOrchestrationInput): ConsistencyReadinessReport {
    const metrics = input.metrics;
    const report = financialConsistencyEngine.reconcile({
      reportId: input.reportId || `consistency:${input.contextId}`,
      requiredStages: unique(input.requiredStages),
      stages: snapshotsFromConsistencyMetrics(metrics),
      tolerance: Math.max(0, ...metrics.map(metric => metric.tolerance)),
    });
    const readiness = readinessFor(input.requiredStages, report.status);
    return {
      readiness,
      status: report.status,
      report,
      canPublish: report.status === "consistent",
      message: messageFor(report.status),
      applicableStages: input.requiredStages,
    };
  }

  public explain(report: ConsistencyReadinessReport): string {
    if (report.status === "consistent") return "Dados conferidos. Os valores aplicáveis são iguais à fonte.";
    if (report.status === "inconsistent") {
      const difference = report.report.differences[0];
      if (difference) return `Encontramos uma diferença em ${difference.metricId}: fonte ${difference.expectedValue}, etapa ${difference.actualValue}. Revise a configuração antes de apresentar.`;
      return "Encontramos um valor inválido. Revise a origem antes de apresentar.";
    }
    return "Dados aguardando confirmação. Algumas etapas ainda não foram geradas.";
  }
}

export const financialConsistencyOrchestrator = new FinancialConsistencyOrchestrator();
