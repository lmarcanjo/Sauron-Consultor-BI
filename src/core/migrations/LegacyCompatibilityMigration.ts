const MIGRATION_KEY = "sauron_migrations_completed_v1";
const ACTIVE_DATASET_KEY = "sauron_ds_active_dataset";
const CONTEXT_KEY = "sauron_active_enterprise_context";

const LEGACY_DATASET_KEYS = ["sauron_active_dataset", "active_dataset"];
const LEGACY_CONTEXT_KEYS = {
  groupId: "sauron_active_group_id",
  companyId: "sauron_active_company_id",
  unitId: "sauron_active_unit_id",
} as const;

function storageAvailable(): boolean {
  return typeof localStorage !== "undefined";
}

function parseObject(value: string | null): Record<string, any> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Moves only known compatibility records to current contracts. It is safe to
 * run repeatedly and never removes a current record or IndexedDB data.
 */
export function runLegacyCompatibilityMigration(): void {
  if (!storageAvailable()) return;

  const completed = localStorage.getItem(MIGRATION_KEY) === "1";
  if (completed) return;

  const currentDataset = parseObject(localStorage.getItem(ACTIVE_DATASET_KEY));
  if (!currentDataset) {
    for (const key of LEGACY_DATASET_KEYS) {
      const legacyDataset = parseObject(localStorage.getItem(key));
      if (legacyDataset?.datasetId && legacyDataset.rawStorageRef) {
        localStorage.setItem(ACTIVE_DATASET_KEY, JSON.stringify(legacyDataset));
        break;
      }
    }
  }

  if (!localStorage.getItem(CONTEXT_KEY)) {
    const groupId = localStorage.getItem(LEGACY_CONTEXT_KEYS.groupId) || undefined;
    const companyId = localStorage.getItem(LEGACY_CONTEXT_KEYS.companyId) || undefined;
    const unitId = localStorage.getItem(LEGACY_CONTEXT_KEYS.unitId) || undefined;
    if (groupId || companyId || unitId) {
      localStorage.setItem(CONTEXT_KEY, JSON.stringify({
        groupId,
        companyId,
        unitId,
        workbookIds: [],
        datasetIds: [],
        scope: unitId ? "UNIT" : companyId ? "COMPANY" : "GROUP",
      }));
    }
  }

  // These keys represented the old upload queue. Remove only orphaned queue
  // entries; workbook metadata and IndexedDB rows are never touched here.
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith("up_file_")) localStorage.removeItem(key);
  }

  for (const key of LEGACY_DATASET_KEYS) localStorage.removeItem(key);
  for (const key of Object.values(LEGACY_CONTEXT_KEYS)) localStorage.removeItem(key);
  localStorage.setItem(MIGRATION_KEY, "1");
}
