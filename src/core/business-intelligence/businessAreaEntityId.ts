/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared namespacing helper for Business Area Trash entries.
 *
 * Business Area ids are NOT globally unique (the same Blueprint applied to
 * two different companies produces the same area id, e.g. "comercial", in
 * both). Using the bare area id as a TrashRepository entityId would leak
 * archive/trash state across companies. Every Business Area lifecycle
 * operation must build its entityId through these helpers instead of
 * concatenating strings ad-hoc.
 */

export function businessAreaEntityNamespace(workspaceId: string, companyId?: string): string {
  return `bizarea::${workspaceId}::${companyId || "group"}::`;
}

export function businessAreaEntityId(workspaceId: string, companyId: string | undefined, areaId: string): string {
  return `${businessAreaEntityNamespace(workspaceId, companyId)}${areaId}`;
}
