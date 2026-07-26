import type { ChaosSourceProfile, PhysicalColumnProfile } from "./ChaosDataTypes";
import { normalizeComparableValue } from "./ChaosValueUtils";

function scopedColumns(profile: ChaosSourceProfile, containerId?: string): PhysicalColumnProfile[] {
  return containerId ? profile.physicalColumns.filter(column => column.containerId === containerId) : profile.physicalColumns;
}

export function selectAllPhysicalColumns(profile: ChaosSourceProfile, containerId?: string): string[] {
  return scopedColumns(profile, containerId).map(column => column.physicalName);
}

export function selectVisiblePhysicalColumns(profile: ChaosSourceProfile, containerId?: string): string[] {
  return scopedColumns(profile, containerId)
    .filter(column => column.emptyPercentage < 1)
    .map(column => column.physicalName);
}

export function selectColumnsByType(profile: ChaosSourceProfile, type: PhysicalColumnProfile["observedTypes"][number], containerId?: string): string[] {
  return scopedColumns(profile, containerId)
    .filter(column => column.observedTypes.includes(type))
    .map(column => column.physicalName);
}

export function selectColumnsBySuggestion(profile: ChaosSourceProfile, role: string, containerId?: string): string[] {
  const normalizedRole = normalizeComparableValue(role);
  return profile.semanticSuggestions
    .filter(suggestion => (!containerId || suggestion.containerId === containerId) && normalizeComparableValue(suggestion.suggestedRole) === normalizedRole)
    .flatMap(suggestion => suggestion.physicalColumns);
}

export function searchPhysicalColumns(profile: ChaosSourceProfile, search: string, containerId?: string): PhysicalColumnProfile[] {
  const term = normalizeComparableValue(search);
  if (!term) return scopedColumns(profile, containerId);
  return scopedColumns(profile, containerId).filter(column => normalizeComparableValue(column.physicalName).includes(term));
}

export function countSelectedPhysicalColumns(profile: ChaosSourceProfile, selectedColumns: string[], containerId?: string): number {
  const available = new Set(selectAllPhysicalColumns(profile, containerId));
  return Array.from(new Set(selectedColumns)).filter(column => available.has(column)).length;
}
