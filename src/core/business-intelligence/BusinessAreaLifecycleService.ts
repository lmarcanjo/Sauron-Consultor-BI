/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * BusinessAreaLifecycleService — F20.3 Final Closure, Bloco 1/2/4
 *
 * Owns the ACTIVE → ARCHIVED → TRASHED → DELETED lifecycle for business
 * Business Areas. Orchestrates the existing generic `TrashRepository`
 * (no second repository is created) and `ConsultingModelRepository`. All
 * lifecycle logic lives here — React components only call these functions
 * and re-render from the resulting config / NavigationRegistry state.
 */

import {
  consultingModelRepository,
  ConsultingModelConfiguration,
  BusinessAreaConfig,
} from "./ConsultingModelRepository";
import { BLUEPRINTS } from "./ProjectDNA";
import { businessAreaEntityId } from "./businessAreaEntityId";
import { trashRepository, TrashItem, PermanentDeletionResult } from "../persistence/TrashRepository";
import { areaPermissionRepository } from "../identity/AreaPermissionRepository";

export interface BusinessAreaImpactReport {
  areaId: string;
  areaName: string;
  /** Custom indicators (customMetrics) scoped to this area via `visibleIn`. */
  linkedMetricNames: string[];
  /** Blueprint ids that ship an area with this same id (informational only). */
  blueprintReferenceIds: string[];
  /** Whether the project renamed this area via the display dictionary. */
  hasDisplayLabelOverride: boolean;
  linkedDashboardCount: number;
  linkedSlideCount: number;
  linkedMeetingCount: number;
  permissionCount: number;
  historicalArtifactCount: number;
}

export interface DependencyValidation {
  /** Reasons the requested transition cannot proceed at all. */
  blocking: string[];
  /** Non-blocking facts the operator should see before confirming. */
  informational: string[];
}

/** Impact report shown before archiving, trashing, or deleting an area (Bloco 2). */
export function getImpactReport(config: ConsultingModelConfiguration, areaId: string): BusinessAreaImpactReport | null {
  const area = config.businessAreas.find(a => a.id === areaId);
  if (!area) return null;
  const linkedMetrics = config.customMetrics.filter(m => area.relatedMetrics.includes(m.id) || m.visibleIn.includes(areaId));
  return {
    areaId,
    areaName: area.name,
    linkedMetricNames: linkedMetrics.map(m => m.name),
    blueprintReferenceIds: BLUEPRINTS.filter(bp => bp.businessAreas.some(a => a.id === areaId)).map(bp => bp.id),
    hasDisplayLabelOverride: !!config.displayDictionary[areaId],
    linkedDashboardCount: linkedMetrics.filter(m => m.visibleIn.includes("dashboard")).length,
    linkedSlideCount: linkedMetrics.filter(m => m.visibleIn.includes("presentation")).length,
    linkedMeetingCount: linkedMetrics.filter(m => m.visibleIn.includes("meeting")).length,
    permissionCount: areaPermissionRepository.getGrantsForArea(areaId, { groupId: config.groupId, companyId: config.companyId }).length,
    historicalArtifactCount: 0,
  };
}

/** Pre-flight checks the UI should run before allowing a transition (Bloco 1). */
export function validateDependencies(
  config: ConsultingModelConfiguration,
  areaId: string,
  transition: "ARCHIVE" | "TRASH" | "DELETE"
): DependencyValidation {
  const blocking: string[] = [];
  const informational: string[] = [];
  const area = config.businessAreas.find(a => a.id === areaId);

  if (transition === "ARCHIVE" && !area) {
    blocking.push("Área não está ativa neste projeto.");
  }
  if ((transition === "TRASH" || transition === "DELETE") && area) {
    blocking.push("Área ainda está ativa — arquive antes de enviar para a Lixeira ou excluir.");
  }

  const linkedMetrics = config.customMetrics.filter(m => area.relatedMetrics.includes(m.id) || m.visibleIn.includes(areaId));
  if (linkedMetrics.length > 0) {
    informational.push(`${linkedMetrics.length} indicador(es) ficarão sem esta área associada: ${linkedMetrics.map(m => m.name).join(", ")}.`);
  }

  return { blocking, informational };
}

/**
 * ACTIVE → ARCHIVED. Removes the area from the live config (so it stops
 * appearing in navigation/dashboards/new presentations) while preserving its
 * full configuration as a Trash snapshot for instant, lossless restoration.
 */
export async function archiveArea(
  config: ConsultingModelConfiguration,
  areaId: string,
  performedBy: string
): Promise<ConsultingModelConfiguration> {
  const area = config.businessAreas.find(a => a.id === areaId);
  if (!area) throw new Error(`Área "${areaId}" não encontrada ou já arquivada.`);

  const dependencyRefs = config.customMetrics
    .filter(m => area.relatedMetrics.includes(m.id) || m.visibleIn.includes(areaId))
    .map(m => m.id);
  const entityId = businessAreaEntityId(config.workspaceId, config.companyId, areaId);

  await trashRepository.archive(
    "BusinessArea",
    entityId,
    area.name,
    { ...(area as unknown as Record<string, unknown>), lifecycle: "ARCHIVED" },
    performedBy,
    dependencyRefs.length > 0 ? dependencyRefs : undefined
  );

  const nextConfig: ConsultingModelConfiguration = {
    ...config,
    businessAreas: config.businessAreas.filter(a => a.id !== areaId),
  };
  await consultingModelRepository.saveConfiguration(nextConfig);
  return nextConfig;
}

/** ARCHIVED → TRASHED. The area no longer appears even in the "archived" list, only in the Lixeira. */
export async function moveAreaToTrash(
  config: ConsultingModelConfiguration,
  areaId: string,
  performedBy: string
): Promise<void> {
  const entityId = businessAreaEntityId(config.workspaceId, config.companyId, areaId);
  await trashRepository.moveToTrash(entityId, performedBy);
  const archived = await trashRepository.getTrash("BusinessArea");
  const item = archived.find(entry => entry.entityId === entityId);
  if (item) await trashRepository.updateSnapshot(entityId, { ...item.snapshot, lifecycle: "TRASHED" });
}

/**
 * ARCHIVED or TRASHED → ACTIVE. Preserves the original areaId, name,
 * configuration and (best-effort) relative order. Never generates a new id
 * and never duplicates the area — if it is somehow already active, this is
 * a no-op that returns the config unchanged.
 */
export async function restoreArea(
  config: ConsultingModelConfiguration,
  areaId: string,
  performedBy: string
): Promise<ConsultingModelConfiguration> {
  if (config.businessAreas.some(a => a.id === areaId)) {
    return config; // already active — do not duplicate
  }

  const entityId = businessAreaEntityId(config.workspaceId, config.companyId, areaId);
  const item = await trashRepository.restore(entityId, performedBy);
  const restoredArea: BusinessAreaConfig = {
    ...(item.snapshot as unknown as BusinessAreaConfig),
    lifecycle: "ACTIVE",
    visible: true,
  };

  const nextConfig: ConsultingModelConfiguration = {
    ...config,
    businessAreas: [...config.businessAreas, restoredArea].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  };
  await consultingModelRepository.saveConfiguration(nextConfig);
  return nextConfig;
}

/**
 * TRASHED → DELETED. Requires the operator to type the exact area name as
 * confirmation. Strips any dangling `visibleIn` references from
 * customMetrics and revokes area-scoped permissions so no orphaned
 * references remain.
 */
export async function permanentlyDeleteArea(
  config: ConsultingModelConfiguration,
  areaId: string,
  confirmationText: string,
  performedBy: string
): Promise<PermanentDeletionResult> {
  const entityId = businessAreaEntityId(config.workspaceId, config.companyId, areaId);
  const trashed = await trashRepository.getTrash("BusinessArea");
  const item = trashed.find(i => i.entityId === entityId);
  if (!item) {
    throw new Error("Esta área precisa estar na Lixeira antes de ser excluída definitivamente.");
  }
  if (confirmationText.trim() !== item.entityName) {
    throw new Error("Texto de confirmação incorreto. Digite exatamente o nome da área para confirmar.");
  }

  const result = await trashRepository.permanentlyDelete(entityId, performedBy);

  // Prevent orphan references (Bloco 1): strip the deleted area from every metric's visibleIn.
  const hadOrphanRefs = config.customMetrics.some(m => m.visibleIn.includes(areaId));
  if (hadOrphanRefs) {
    const nextConfig: ConsultingModelConfiguration = {
      ...config,
      customMetrics: config.customMetrics.map(m => ({ ...m, visibleIn: m.visibleIn.filter(v => v !== areaId) })),
    };
    await consultingModelRepository.saveConfiguration(nextConfig);
  }
  areaPermissionRepository.revokeAllForArea(areaId, { groupId: config.groupId, companyId: config.companyId });

  return result;
}

/** Areas currently archived (stage ARCHIVED) for a given workspace/company, for a Lixeira-style listing. */
export async function getArchivedAreas(workspaceId: string, companyId?: string): Promise<TrashItem[]> {
  const prefix = businessAreaEntityId(workspaceId, companyId, "");
  const archived = await trashRepository.getArchived("BusinessArea");
  return archived.filter(i => i.entityId.startsWith(prefix));
}

/** Areas currently in the Lixeira (stage TRASH) for a given workspace/company. */
export async function getTrashedAreas(workspaceId: string, companyId?: string): Promise<TrashItem[]> {
  const prefix = businessAreaEntityId(workspaceId, companyId, "");
  const trashed = await trashRepository.getTrash("BusinessArea");
  return trashed.filter(i => i.entityId.startsWith(prefix));
}
