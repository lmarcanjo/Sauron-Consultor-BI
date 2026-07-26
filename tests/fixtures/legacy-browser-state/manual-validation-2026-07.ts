/**
 * Sanitized browser state captured from the manual validation scenario.
 * It intentionally models the old contracts so repair tests do not need to
 * clear IndexedDB or rely on a clean browser profile.
 */
export interface ManualValidationLegacyBrowserState {
  context: Record<string, unknown>;
  activeDataset: Record<string, unknown>;
  legacyDataset: Record<string, unknown>;
  sourceBinding: Record<string, unknown>;
  workspaceRegistry: Record<string, unknown>;
  oldKeys: Record<string, string>;
}

export const manualValidationLegacyBrowserState: ManualValidationLegacyBrowserState = {
  context: {
    scope: "COMPANY",
    groupId: undefined,
    companyId: "company_consultoria",
    unitId: "unit_geral",
    workspaceId: "ws_legacy_project",
    workbookIds: ["up_file_consultoria_legacy"],
    datasetIds: ["up_file_consultoria_legacy"],
  },
  activeDataset: {
    datasetId: "dataset_consultoria_legacy",
    sourceName: "consultoria-operacional.xlsx",
    rawStorageRef: "dataset_consultoria_legacy",
    rowCount: 12,
    columnCount: 4,
  },
  legacyDataset: {
    datasetId: "dataset_consultoria_legacy",
    sourceName: "consultoria-operacional.xlsx",
    rawStorageRef: "dataset_consultoria_legacy",
  },
  sourceBinding: {
    sourceId: "dataset_consultoria_legacy",
    workbookId: "workbook_consultoria_legacy",
    datasetId: "dataset_consultoria_legacy",
    tenantId: "local",
    workspaceId: "workspace_default",
    companyId: "company_consultoria",
    status: "ACTIVE",
  },
  workspaceRegistry: {
    currentWorkspaceId: "ws_legacy_project",
    workspaces: {
      ws_legacy_project: {
        id: "ws_legacy_project",
        name: "Projeto antigo",
        businessDomain: "unknown",
      },
    },
  },
  oldKeys: {
    dataset: "sauron_active_dataset",
    group: "sauron_active_group_id",
    company: "sauron_active_company_id",
    unit: "sauron_active_unit_id",
    upload: "up_file_consultoria_legacy",
  },
};

export function cloneManualValidationLegacyBrowserState(): ManualValidationLegacyBrowserState {
  return JSON.parse(JSON.stringify(manualValidationLegacyBrowserState)) as ManualValidationLegacyBrowserState;
}
