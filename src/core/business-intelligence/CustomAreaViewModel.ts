/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CustomAreaViewModel — F20.3 Block 4
 *
 * CustomAreaTab must never render raw dataset rows or invent generic stats.
 * This module is the single place that turns (area config + selected fields
 * + certified custom metrics + live rows) into a bounded, presentable view
 * model. UI components only render what this function returns.
 */

import { ConsultingModelConfiguration, CustomMetricConfig, SelectedFieldConfig } from "./ConsultingModelRepository";
import { LancamentoFinanceiro } from "../../types";

export type CustomAreaReadiness = "NOT_CONFIGURED" | "PARTIALLY_CONFIGURED" | "READY";
export type CustomAreaConsistency = "OK" | "NO_DATA" | "MISSING_FIELDS";

export interface CustomAreaFieldView {
  physicalName: string;
  label: string;
  isNumeric: boolean;
}

export interface CustomAreaMetricResult {
  id: string;
  name: string;
  value: number;
  format: CustomMetricConfig["format"];
}

export interface CustomAreaViewModel {
  areaId: string;
  areaName: string;
  areaDescription: string;
  readiness: CustomAreaReadiness;
  consistency: CustomAreaConsistency;
  fields: CustomAreaFieldView[];
  metrics: CustomAreaMetricResult[];
  summary: { totalRecords: number; previewCount: number };
  recordsPreview: Record<string, string | number>[];
  /** True when the caller lacks VIEW_AREA permission — no other field carries real data in that case (Bloco 10). */
  accessDenied: boolean;
}

const DEFAULT_PREVIEW_LIMIT = 50;

const ACCESS_DENIED_VIEW_MODEL: CustomAreaViewModel = {
  areaId: "",
  areaName: "",
  areaDescription: "",
  readiness: "NOT_CONFIGURED",
  consistency: "OK",
  fields: [],
  metrics: [],
  summary: { totalRecords: 0, previewCount: 0 },
  recordsPreview: [],
  accessDenied: true,
};

function isNumericColumn(rows: LancamentoFinanceiro[], physicalName: string): boolean {
  let numericCount = 0;
  let nonNumericCount = 0;
  for (const row of rows.slice(0, 100)) {
    const val = (row as any)[physicalName];
    if (val === undefined || val === null || val === "") continue;
    if (!isNaN(Number(val))) numericCount++; else nonNumericCount++;
  }
  return numericCount > 0 && numericCount >= nonNumericCount;
}

function numericValues(rows: LancamentoFinanceiro[], physicalName: string): number[] {
  const out: number[] = [];
  for (const row of rows) {
    const val = (row as any)[physicalName];
    if (val === undefined || val === null || val === "") continue;
    const num = Number(val);
    if (!isNaN(num)) out.push(num);
  }
  return out;
}

function computeMetric(rows: LancamentoFinanceiro[], metric: CustomMetricConfig): number {
  const values = numericValues(rows, metric.fieldId);
  switch (metric.operation) {
    case "sum":
      return values.reduce((acc, v) => acc + v, 0);
    case "average":
      return values.length > 0 ? values.reduce((acc, v) => acc + v, 0) / values.length : 0;
    case "count":
      return rows.filter(row => {
        const val = (row as any)[metric.fieldId];
        return val !== undefined && val !== null && val !== "";
      }).length;
    case "distinct_count": {
      const set = new Set<string>();
      rows.forEach(row => {
        const val = (row as any)[metric.fieldId];
        if (val !== undefined && val !== null && val !== "") set.add(String(val));
      });
      return set.size;
    }
    case "min":
      return values.length > 0 ? Math.min(...values) : 0;
    case "max":
      return values.length > 0 ? Math.max(...values) : 0;
    case "percentage":
      return values.length > 0 ? (values.reduce((acc, v) => acc + v, 0) / values.length) : 0;
    case "difference": {
      if (values.length === 0) return 0;
      return values[values.length - 1] - values[0];
    }
    default:
      return 0;
  }
}

/**
 * Build the bounded view model for a Business Area. Returns null when the
 * area does not exist in the active Project DNA (caller renders a
 * "not found" state rather than an empty dashboard).
 */
export function buildCustomAreaViewModel(
  areaId: string,
  config: ConsultingModelConfiguration | null,
  dataOrigem: LancamentoFinanceiro[],
  previewLimit: number = DEFAULT_PREVIEW_LIMIT,
  hasAccess: boolean = true
): CustomAreaViewModel | null {
  // Bloco 10 — access must be validated BEFORE resolving fields, metrics or
  // preview rows. A denied caller never receives the area name/description
  // either, so a restricted client cannot infer information about the area.
  if (!hasAccess) {
    return { ...ACCESS_DENIED_VIEW_MODEL, areaId };
  }

  const area = config?.businessAreas.find(a => a.id === areaId) ?? null;
  if (!area) return null;

  const selectedFields: SelectedFieldConfig[] = (area.relatedFields || [])
    .map(name => config?.selectedFields?.[name])
    .filter((f): f is SelectedFieldConfig => !!f && f.use !== "do_not_use" && f.visible);

  // Areas created before field-level configuration existed still declare
  // relatedFields directly; keep them usable instead of showing an empty area.
  const effectiveFieldNames = selectedFields.length > 0
    ? selectedFields.map(f => f.physicalName)
    : (area.relatedFields || []);

  const fields: CustomAreaFieldView[] = effectiveFieldNames.map(physicalName => {
    const cfg = config?.selectedFields?.[physicalName];
    return {
      physicalName,
      label: cfg?.consultantLabel || cfg?.displayLabel || physicalName,
      isNumeric: isNumericColumn(dataOrigem, physicalName),
    };
  });

  const metrics: CustomAreaMetricResult[] = (config?.customMetrics || [])
    .filter(m => m.visibleIn.includes(areaId))
    .map(m => ({
      id: m.id,
      name: m.name,
      value: computeMetric(dataOrigem, m),
      format: m.format,
    }));

  const readiness: CustomAreaReadiness =
    effectiveFieldNames.length === 0 ? "NOT_CONFIGURED" :
    metrics.length === 0 ? "PARTIALLY_CONFIGURED" : "READY";

  const consistency: CustomAreaConsistency =
    dataOrigem.length === 0 ? "NO_DATA" :
    effectiveFieldNames.length === 0 ? "MISSING_FIELDS" : "OK";

  const boundedRows = dataOrigem.slice(0, previewLimit);
  const recordsPreview = boundedRows.map(row => {
    const out: Record<string, string | number> = {};
    effectiveFieldNames.forEach(name => {
      const val = (row as any)[name];
      out[name] = val ?? "";
    });
    return out;
  });

  return {
    areaId,
    areaName: area.name,
    areaDescription: area.description,
    readiness,
    consistency,
    fields,
    metrics,
    summary: { totalRecords: dataOrigem.length, previewCount: recordsPreview.length },
    recordsPreview,
    accessDenied: false,
  };
}
