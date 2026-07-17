import { ActiveDataset, SourceIdentity } from "../../types/dataSource";

export function isTemporarySourceId(value: string | undefined | null): boolean {
  return typeof value === "string" && value.startsWith("up_file_");
}

export function assertCanonicalSourceId(value: string): string {
  if (!value || isTemporarySourceId(value)) {
    throw new Error("A fonte precisa de um identificador persistido antes de continuar.");
  }
  return value;
}

function fingerprintForDataset(dataset: ActiveDataset): string {
  const sheets = dataset.sheets
    .map(sheet => typeof sheet === "string" ? sheet : `${sheet.sheetName}:${sheet.rowCount}:${sheet.columnCount}`)
    .join("|");
  const columns = dataset.columnProfiles.map(column => column.name).join("|");
  return [dataset.sourceName, dataset.rowCount, dataset.columnCount, sheets, columns].join("::");
}

export function getSourceIdentity(dataset: ActiveDataset): SourceIdentity {
  const previous = dataset.sourceIdentity;
  const datasetId = previous?.datasetId || dataset.datasetId;
  const workbookId = previous?.workbookId || datasetId;
  const sourceId = previous?.sourceId || datasetId;
  const fileName = previous?.fileName || previous?.originalFileName || dataset.sourceName;
  const storageMetadataKey = previous?.storageMetadataKey || previous?.storageKey || dataset.rawStorageRef || datasetId;
  const storageRowsKey = previous?.storageRowsKey || previous?.storageKey || dataset.rawStorageRef || datasetId;

  return {
    sourceId: assertCanonicalSourceId(sourceId),
    workbookId: assertCanonicalSourceId(workbookId),
    datasetId: assertCanonicalSourceId(datasetId),
    importJobId: previous?.importJobId,
    fingerprint: previous?.fingerprint || fingerprintForDataset(dataset),
    fileName,
    storageMetadataKey,
    storageRowsKey,
    tenantId: previous?.tenantId,
    enterpriseId: previous?.enterpriseId,
    companyId: previous?.companyId,
    unitId: previous?.unitId,
    groupId: previous?.groupId,
    workspaceId: previous?.workspaceId || "workspace_default",
    storageKey: storageRowsKey,
    originalFileName: fileName,
  };
}

export function withSourceIdentity(dataset: ActiveDataset): ActiveDataset {
  return { ...dataset, sourceIdentity: getSourceIdentity(dataset) };
}
