/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * BlueprintDiffService — F20.3 Final Closure, Bloco 5/6/7
 *
 * Computes a preview diff before applying an IndustryBlueprint, applies it
 * as an immutable deep clone (never sharing object references with the
 * `BLUEPRINTS` module constant), and supports scoped rollback snapshots.
 */

import {
  consultingModelRepository,
  ConsultingModelConfiguration,
  BusinessAreaConfig,
  CustomMetricConfig,
} from "./ConsultingModelRepository";
import { IndustryBlueprint } from "./ProjectDNA";

// ─── Diff ───────────────────────────────────────────────────────────────────────

export interface BlueprintDiffAreaEntry {
  areaId: string;
  areaName: string;
}

export interface BlueprintDiff {
  areasToAdd: BlueprintDiffAreaEntry[];
  areasToUpdate: BlueprintDiffAreaEntry[];
  areasUnchanged: BlueprintDiffAreaEntry[];
  /** Same area id already exists with a DIFFERENT name — never overwritten without explicit consent. */
  areasConflicting: BlueprintDiffAreaEntry[];
  metricsToAdd: string[];
  metricsConflicting: string[];
  labelsToChange: { key: string; from: string; to: string }[];
  modulesToEnable: string[];
  modulesToDisable: string[];
  permissionsSuggested: string[];
}

export function computeBlueprintDiff(
  blueprint: IndustryBlueprint,
  currentConfig: ConsultingModelConfiguration | null,
  incomingMetrics: CustomMetricConfig[] = [],
  incomingTerminology: Record<string, string> = {}
): BlueprintDiff {
  const existingAreas = currentConfig?.businessAreas ?? [];
  // A project that has never had a Blueprint applied is still on the plain
  // scaffold created by `createDefaultConfiguration` (generic placeholder
  // areas with no fields/metrics attached). The FIRST application always
  // fully populates that scaffold — there is nothing real to protect yet.
  // Only once a Blueprint has actually been applied (`appliedBlueprintId`
  // set) do subsequent applications need conservative conflict detection,
  // so a second/different Blueprint never silently overwrites real
  // project customization.
  const isFirstEverApplication = !currentConfig?.appliedBlueprintId;

  const areasToAdd: BlueprintDiffAreaEntry[] = [];
  const areasToUpdate: BlueprintDiffAreaEntry[] = [];
  const areasUnchanged: BlueprintDiffAreaEntry[] = [];
  const areasConflicting: BlueprintDiffAreaEntry[] = [];

  blueprint.businessAreas.forEach(bpArea => {
    const existing = existingAreas.find(a => a.id === bpArea.id);
    if (!existing) {
      areasToAdd.push({ areaId: bpArea.id, areaName: bpArea.name });
    } else if (isFirstEverApplication) {
      areasToUpdate.push({ areaId: bpArea.id, areaName: bpArea.name });
    } else if (existing.name !== bpArea.name) {
      areasConflicting.push({ areaId: bpArea.id, areaName: bpArea.name });
    } else if (existing.description !== bpArea.description) {
      areasToUpdate.push({ areaId: bpArea.id, areaName: bpArea.name });
    } else {
      areasUnchanged.push({ areaId: bpArea.id, areaName: bpArea.name });
    }
  });

  const existingMetricNames = new Set((currentConfig?.customMetrics ?? []).map(m => m.name));
  const metricsToAdd: string[] = [];
  const metricsConflicting: string[] = [];
  incomingMetrics.forEach(m => {
    if (existingMetricNames.has(m.name)) metricsConflicting.push(m.name);
    else metricsToAdd.push(m.name);
  });

  const labelsToChange: { key: string; from: string; to: string }[] = [];
  Object.entries({ ...blueprint.terminology, ...incomingTerminology }).forEach(([key, to]) => {
    const from = currentConfig?.displayDictionary?.[key];
    if (from && from !== to) labelsToChange.push({ key, from, to });
  });

  const enabledModules = new Set(currentConfig?.enabledModules ?? []);
  const modulesToEnable = blueprint.businessAreas.map(a => a.id).filter(id => !enabledModules.has(id));

  return {
    areasToAdd,
    areasToUpdate,
    areasUnchanged,
    areasConflicting,
    metricsToAdd,
    metricsConflicting,
    labelsToChange,
    modulesToEnable,
    modulesToDisable: [],
    permissionsSuggested: areasToAdd.map(a => `VIEW_AREA:${a.areaId}`),
  };
}

/** Human-readable one-line summary for the operator (Bloco 5). */
export function describeBlueprintDiff(diff: BlueprintDiff): string {
  const parts: string[] = [];
  if (diff.areasToAdd.length > 0) parts.push(`${diff.areasToAdd.length} área(s) nova(s)`);
  if (diff.metricsToAdd.length > 0) parts.push(`${diff.metricsToAdd.length} indicador(es) novo(s)`);
  if (diff.areasConflicting.length > 0) parts.push(`${diff.areasConflicting.length} conflito(s) de nome`);
  if (parts.length === 0) return "Este modelo não altera nada em relação à configuração atual.";
  return `Este modelo adicionará ${parts.join(" e ")}.`;
}

// ─── Immutable apply ────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  const suffix = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().slice(0, 8)
    : Date.now().toString(36);
  return `${prefix}_${Date.now()}_${suffix}`;
}

/** Deep clone via JSON round-trip — guarantees zero shared references with the BLUEPRINTS constant. */
function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export interface BlueprintApplySelection {
  /** Area ids (from areasToAdd/areasToUpdate/areasConflicting) selected for application. */
  includeAreaIds: string[];
  /** Must be explicitly true for a conflicting area to be overwritten. */
  overwriteConflicts: boolean;
  /** Optional metric selection for partial applications. Omitted means all incoming metrics. */
  includeMetricNames?: string[];
  /** Existing metrics are never replaced unless this flag is explicit. */
  overwriteMetricConflicts?: boolean;
}

export interface BlueprintApplyResult {
  nextConfig: ConsultingModelConfiguration;
  snapshotId: string;
}

const SNAPSHOT_KEY_PREFIX = "sauron_blueprint_snapshot_";
const SNAPSHOT_HISTORY_KEY_PREFIX = "sauron_blueprint_snapshot_history_";

function snapshotKey(workspaceId: string, companyId?: string): string {
  return `${SNAPSHOT_KEY_PREFIX}${workspaceId}_${companyId || "group_default"}`;
}

function snapshotHistoryKey(workspaceId: string, companyId?: string): string {
  return `${SNAPSHOT_HISTORY_KEY_PREFIX}${workspaceId}_${companyId || "group_default"}`;
}

/**
 * Applies a Blueprint as an immutable, deep-cloned operation. Builds the
 * entire next config in memory first and persists it in a single write —
 * if anything throws before that write, nothing is partially saved (no
 * partial areas, no orphaned indicators).
 */
export function applyBlueprintSafely(params: {
  blueprint: IndustryBlueprint;
  currentConfig: ConsultingModelConfiguration;
  diff: BlueprintDiff;
  selection: BlueprintApplySelection;
  incomingMetrics?: CustomMetricConfig[];
  incomingTerminology?: Record<string, string>;
}): BlueprintApplyResult {
  const { blueprint, currentConfig, diff, selection, incomingMetrics = [], incomingTerminology = {} } = params;

  // Snapshot BEFORE mutating anything, so a rollback is always possible (Bloco 7).
  const snapshotId = generateId("snap");
  if (typeof localStorage !== "undefined") {
    const snapshot: BlueprintSnapshotRecord = {
      snapshotId,
      config: deepClone(currentConfig),
      appliedAt: new Date().toISOString(),
      blueprintId: blueprint.id,
    };
    localStorage.setItem(snapshotKey(currentConfig.workspaceId, currentConfig.companyId), JSON.stringify(snapshot));
    try {
      const previous = JSON.parse(localStorage.getItem(snapshotHistoryKey(currentConfig.workspaceId, currentConfig.companyId)) || "[]") as BlueprintSnapshotRecord[];
      const history = [snapshot, ...previous.filter(item => item.snapshotId !== snapshotId)].slice(0, 20);
      localStorage.setItem(snapshotHistoryKey(currentConfig.workspaceId, currentConfig.companyId), JSON.stringify(history));
    } catch {
      // A malformed history must not prevent the atomic configuration preview.
    }
  }

  const includeSet = new Set(selection.includeAreaIds);
  const nextAreas: BusinessAreaConfig[] = deepClone(currentConfig.businessAreas);

  const cloneBlueprintArea = (bpArea: BusinessAreaConfig, order: number): BusinessAreaConfig => ({
    ...deepClone(bpArea),
    order,
  });

  diff.areasToAdd.forEach(entry => {
    if (!includeSet.has(entry.areaId)) return;
    const bpArea = blueprint.businessAreas.find(a => a.id === entry.areaId);
    if (bpArea) nextAreas.push(cloneBlueprintArea(bpArea, nextAreas.length + 1));
  });

  diff.areasToUpdate.forEach(entry => {
    if (!includeSet.has(entry.areaId)) return;
    const bpArea = blueprint.businessAreas.find(a => a.id === entry.areaId);
    const idx = nextAreas.findIndex(a => a.id === entry.areaId);
    if (bpArea && idx >= 0) nextAreas[idx] = cloneBlueprintArea(bpArea, nextAreas[idx].order);
  });

  diff.areasConflicting.forEach(entry => {
    // Conflicting areas are NEVER overwritten unless both selected AND explicitly confirmed.
    if (!includeSet.has(entry.areaId) || !selection.overwriteConflicts) return;
    const bpArea = blueprint.businessAreas.find(a => a.id === entry.areaId);
    const idx = nextAreas.findIndex(a => a.id === entry.areaId);
    if (bpArea && idx >= 0) nextAreas[idx] = cloneBlueprintArea(bpArea, nextAreas[idx].order);
  });

  const existingMetricNames = new Set(currentConfig.customMetrics.map(m => m.name));
  const selectedMetricNames = selection.includeMetricNames
    ? new Set(selection.includeMetricNames)
    : new Set(incomingMetrics.map(metric => metric.name));
  const nextMetrics: CustomMetricConfig[] = deepClone(currentConfig.customMetrics);
  incomingMetrics.filter(metric => selectedMetricNames.has(metric.name)).forEach(metric => {
    const existingIndex = nextMetrics.findIndex(existing => existing.name === metric.name);
    if (existingIndex >= 0) {
      if (selection.overwriteMetricConflicts && diff.metricsConflicting.includes(metric.name)) {
        nextMetrics[existingIndex] = { ...deepClone(metric), id: nextMetrics[existingIndex].id };
      }
      return;
    }
    if (!existingMetricNames.has(metric.name)) nextMetrics.push({ ...deepClone(metric), id: generateId("metric") });
  });

  const nextDisplayDictionary = { ...currentConfig.displayDictionary };
  diff.labelsToChange.forEach(l => { nextDisplayDictionary[l.key] = l.to; });
  Object.entries({ ...blueprint.terminology, ...incomingTerminology }).forEach(([key, value]) => {
    if (!(key in nextDisplayDictionary)) nextDisplayDictionary[key] = value;
  });

  const nextEnabledModules = Array.from(new Set([
    ...currentConfig.enabledModules,
    ...diff.modulesToEnable.filter(moduleId => includeSet.has(moduleId)),
  ]));

  const nextConfig: ConsultingModelConfiguration = {
    ...currentConfig,
    businessAreas: nextAreas,
    customMetrics: nextMetrics,
    displayDictionary: nextDisplayDictionary,
    enabledModules: nextEnabledModules,
    appliedBlueprintId: blueprint.id,
    appliedBlueprintVersion: new Date().toISOString(),
  };

  return { nextConfig, snapshotId };
}

/** Persists the result of `applyBlueprintSafely` — separated so callers can inspect the diff before committing. */
export async function commitBlueprintApplication(nextConfig: ConsultingModelConfiguration): Promise<void> {
  await consultingModelRepository.saveConfiguration(nextConfig);
}

// ─── Rollback ───────────────────────────────────────────────────────────────────

export interface BlueprintSnapshotRecord {
  snapshotId: string;
  config: ConsultingModelConfiguration;
  appliedAt: string;
  blueprintId: string;
}

export function getLastBlueprintSnapshot(workspaceId: string, companyId?: string): BlueprintSnapshotRecord | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(snapshotKey(workspaceId, companyId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getBlueprintSnapshotHistory(workspaceId: string, companyId?: string): BlueprintSnapshotRecord[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(snapshotHistoryKey(workspaceId, companyId));
    return raw ? (JSON.parse(raw) as BlueprintSnapshotRecord[]) : [];
  } catch {
    return [];
  }
}

/**
 * Restores the configuration exactly as it was before the last Blueprint
 * application in this workspace/company. The active pointer is removed after
 * rollback while the bounded history remains available for audit.
 */
export async function rollbackBlueprintApplication(
  workspaceId: string,
  companyId: string | undefined,
  expectedSnapshotId: string
): Promise<ConsultingModelConfiguration> {
  const snapshot = getLastBlueprintSnapshot(workspaceId, companyId);
  if (!snapshot || snapshot.snapshotId !== expectedSnapshotId) {
    throw new Error("Não há aplicação recente para desfazer nesta sessão.");
  }
  await consultingModelRepository.saveConfiguration(snapshot.config);
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(snapshotKey(workspaceId, companyId));
    const history = getBlueprintSnapshotHistory(workspaceId, companyId)
      .filter(item => item.snapshotId !== expectedSnapshotId);
    localStorage.setItem(snapshotHistoryKey(workspaceId, companyId), JSON.stringify(history));
  }
  return snapshot.config;
}
