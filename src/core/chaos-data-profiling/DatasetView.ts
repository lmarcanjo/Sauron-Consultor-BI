import type { ChaosSourceProfile, DatasetView, DatasetViewTransformation, SuggestionStatus } from "./ChaosDataTypes";

export interface CreateDatasetViewInput {
  profile: ChaosSourceProfile;
  containerIds: string[];
  blockIds: string[];
  selectedColumns: string[];
  selectedRowsRule: string;
  rowSelection?: DatasetView["rowSelection"];
  physicalToLogicalMapping?: Record<string, string>;
  consultantLabels?: Record<string, string>;
  inferredTypes?: Record<string, DatasetView["inferredTypes"][string]>;
  filters?: string[];
  transformations?: DatasetViewTransformation[];
  now?: string;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function createDatasetView(input: CreateDatasetViewInput): DatasetView {
  const now = input.now || new Date().toISOString();
  const selectedColumns = unique(input.selectedColumns);
  const mapping = { ...(input.physicalToLogicalMapping || {}) };
  const labels = { ...(input.consultantLabels || {}) };
  selectedColumns.forEach(column => {
    mapping[column] = mapping[column] || column;
    labels[column] = labels[column] || column;
  });
  return {
    datasetViewId: `view_${input.profile.sourceId}_${Date.now()}`,
    sourceId: input.profile.sourceId,
    containerIds: unique(input.containerIds),
    blockIds: unique(input.blockIds),
    selectedRowsRule: input.selectedRowsRule,
    rowSelection: input.rowSelection ? {
      ...input.rowSelection,
      rowIndexes: input.rowSelection.rowIndexes ? [...input.rowSelection.rowIndexes] : undefined,
    } : undefined,
    selectedColumns,
    physicalToLogicalMapping: mapping,
    consultantLabels: labels,
    inferredTypes: { ...(input.inferredTypes || {}) },
    transformations: (input.transformations || []).map(transformation => ({ ...transformation, reversible: true })),
    filters: [...(input.filters || [])],
    groupId: input.profile.groupId,
    companyId: input.profile.companyId,
    status: "DRAFT",
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export function confirmDatasetView(view: DatasetView, confirmedBy: string, now = new Date().toISOString()): DatasetView {
  if (!confirmedBy.trim()) throw new Error("A confirmação da DatasetView precisa identificar o consultor.");
  return {
    ...view,
    containerIds: [...view.containerIds],
    blockIds: [...view.blockIds],
    selectedColumns: [...view.selectedColumns],
    rowSelection: view.rowSelection ? {
      ...view.rowSelection,
      rowIndexes: view.rowSelection.rowIndexes ? [...view.rowSelection.rowIndexes] : undefined,
    } : undefined,
    physicalToLogicalMapping: { ...view.physicalToLogicalMapping },
    consultantLabels: { ...view.consultantLabels },
    inferredTypes: { ...view.inferredTypes },
    transformations: view.transformations.map(transformation => ({ ...transformation })),
    filters: [...view.filters],
    status: "CONFIRMED",
    confirmedBy,
    updatedAt: now,
  };
}

export function updateDatasetViewSuggestionStatus<T extends { status: SuggestionStatus }>(suggestion: T, status: SuggestionStatus): T {
  return { ...suggestion, status };
}

export function archiveDatasetView(view: DatasetView, now = new Date().toISOString()): DatasetView {
  return { ...view, status: "ARCHIVED", updatedAt: now };
}
