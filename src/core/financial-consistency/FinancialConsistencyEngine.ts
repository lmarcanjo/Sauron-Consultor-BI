import {
  FINANCIAL_CONSISTENCY_STAGES,
  FinancialConsistencyDifference,
  FinancialConsistencyInput,
  FinancialConsistencyMetricResult,
  FinancialConsistencyReport,
  FinancialConsistencyStage,
  FinancialConsistencyStageSnapshot,
  FinancialMetricRecord,
} from "./FinancialConsistencyTypes";

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function normalizeSnapshot(snapshot: FinancialConsistencyStageSnapshot): FinancialConsistencyStageSnapshot {
  return {
    ...snapshot,
    values: Object.fromEntries(
      Object.entries(snapshot.values).map(([metricId, value]) => [
        metricId,
        value === null || value === undefined || typeof value === "number" ? value : null,
      ]),
    ),
  };
}

function isInvalidNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isNaN(value);
}

function getSnapshot(
  stages: FinancialConsistencyStageSnapshot[],
  stage: FinancialConsistencyStage,
): FinancialConsistencyStageSnapshot | undefined {
  return stages.find(snapshot => snapshot.stage === stage);
}

function buildMetricIds(stages: FinancialConsistencyStageSnapshot[]): string[] {
  return unique(stages.flatMap(snapshot => Object.keys(snapshot.values)));
}

function compareMetric(
  metricId: string,
  sourceStage: FinancialConsistencyStage,
  stages: FinancialConsistencyStageSnapshot[],
  requiredStages: FinancialConsistencyStage[],
  tolerance: number,
): FinancialConsistencyMetricResult {
  const sourceSnapshot = getSnapshot(stages, sourceStage);
  const sourceValue = sourceSnapshot?.values[metricId];
  const hasSourceValue = isFiniteNumber(sourceValue);
  const valuesByStage: Partial<Record<FinancialConsistencyStage, number>> = {};
  const missingStages: FinancialConsistencyStage[] = [];
  const differences: FinancialConsistencyDifference[] = [];
  const invalidStages: FinancialConsistencyStage[] = [];

  requiredStages.forEach(stage => {
    const snapshot = getSnapshot(stages, stage);
    const value = snapshot?.values[metricId];
    if (isInvalidNumber(value)) {
      invalidStages.push(stage);
      return;
    }
    if (!isFiniteNumber(value)) {
      missingStages.push(stage);
      return;
    }

    valuesByStage[stage] = value;
    if (hasSourceValue && Math.abs(value - sourceValue) > tolerance && stage !== sourceStage) {
      differences.push({
        metricId,
        expectedValue: sourceValue,
        actualValue: value,
        difference: value - sourceValue,
        expectedStage: sourceStage,
        actualStage: stage,
      });
    }
  });

  const status = invalidStages.length > 0
    ? "inconsistent"
    : !hasSourceValue || missingStages.length > 0
    ? "pending"
    : differences.length > 0
      ? "inconsistent"
      : "consistent";

  return {
    metricId,
    status,
    expectedValue: hasSourceValue ? sourceValue : null,
    valuesByStage,
    missingStages,
    differences,
    invalidStages,
  };
}

export function createStageSnapshot(
  stage: FinancialConsistencyStage,
  values: Record<string, number | null | undefined>,
  source?: FinancialConsistencyStageSnapshot["source"],
): FinancialConsistencyStageSnapshot {
  return normalizeSnapshot({ stage, values, source });
}

export function snapshotFromMetricRecords(
  stage: FinancialConsistencyStage,
  metrics: FinancialMetricRecord[],
  source?: FinancialConsistencyStageSnapshot["source"],
): FinancialConsistencyStageSnapshot {
  const values: Record<string, number | null | undefined> = {};
  metrics.forEach(metric => {
    const metricId = metric.id || metric.name;
    if (metricId) values[metricId] = metric.value;
  });
  return createStageSnapshot(stage, values, source);
}

export function reconcileFinancialConsistency(input: FinancialConsistencyInput): FinancialConsistencyReport {
  const sourceStage = input.sourceStage || "source";
  const requiredStages = unique(input.requiredStages || [...FINANCIAL_CONSISTENCY_STAGES]) as FinancialConsistencyStage[];
  const tolerance = input.tolerance ?? 0;
  if (tolerance < 0 || !Number.isFinite(tolerance)) {
    throw new Error("Financial consistency tolerance must be a finite number greater than or equal to zero.");
  }

  const stages = input.stages.map(normalizeSnapshot);
  const metricIds = buildMetricIds(stages);
  const metrics = metricIds.map(metricId => compareMetric(metricId, sourceStage, stages, requiredStages, tolerance));
  const differences = metrics.flatMap(metric => metric.differences);
  const missingStages = unique(metrics.flatMap(metric => metric.missingStages)) as FinancialConsistencyStage[];
  const invalidValues = metrics.flatMap(metric => (metric.invalidStages || []).map(stage => ({ metricId: metric.metricId, stage })));
  const sourceExists = Boolean(getSnapshot(stages, sourceStage));
  const status: FinancialConsistencyReport["status"] = invalidValues.length > 0
    ? "inconsistent"
    : !sourceExists || metricIds.length === 0 || missingStages.length > 0
    ? "pending"
    : differences.length > 0
      ? "inconsistent"
      : "consistent";

  const diagnostics: string[] = [];
  if (!sourceExists) diagnostics.push(`Source stage '${sourceStage}' was not provided.`);
  if (metricIds.length === 0) diagnostics.push("No finite metric values were provided.");
  if (missingStages.length > 0) diagnostics.push(`Missing values in stages: ${missingStages.join(", ")}.`);
  if (invalidValues.length > 0) diagnostics.push(`${invalidValues.length} NaN value(s) detected; review the producing stage.`);
  if (differences.length > 0) diagnostics.push(`${differences.length} value difference(s) detected with tolerance ${tolerance}.`);
  if (status === "consistent") diagnostics.push("All required stages match the source with zero difference.");

  return {
    id: input.reportId || `financial-consistency:${Date.now()}`,
    status,
    sourceStage,
    requiredStages,
    stages,
    metrics,
    differences,
    missingStages,
    invalidValues,
    diagnostics,
    createdAt: new Date().toISOString(),
  };
}

export class FinancialConsistencyEngine {
  public reconcile(input: FinancialConsistencyInput): FinancialConsistencyReport {
    return reconcileFinancialConsistency(input);
  }

  public explain(report: FinancialConsistencyReport): string {
    if (report.status === "consistent") return "Reconciliação aprovada: todas as etapas possuem os mesmos valores da fonte.";
    if (report.status === "pending") return "Reconciliação pendente: faltam valores ou etapas para validar a cadeia completa.";
    if (report.invalidValues && report.invalidValues.length > 0) return "Reconciliação reprovada: há valor inválido (NaN) em uma etapa.";
    return `Reconciliação reprovada: ${report.differences.length} diferença(s) encontrada(s).`;
  }
}

export const financialConsistencyEngine = new FinancialConsistencyEngine();
