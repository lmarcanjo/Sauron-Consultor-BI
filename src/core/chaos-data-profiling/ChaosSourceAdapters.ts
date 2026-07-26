import type { ActiveDataset } from "../../types/dataSource";
import type { WorkbookCatalog } from "../workbook/WorkbookTypes";
import type { SpreadsheetStoragePort } from "../storage/SpreadsheetStoragePort";
import { spreadsheetStorageAdapter } from "../storage/IndexedSpreadsheetStorageAdapter";
import { securityEngine } from "../security/SecurityEngine";
import { profileChaosSource } from "./ChaosDataProfiler";
import type {
  ChaosProfilingOptions,
  ChaosSourceInput,
  ChaosSourceProfile,
  DatabaseProfilingRequest,
  DatasetView,
  PhysicalContainerInput,
  PhysicalRecord,
  SourceComparisonResult,
  SpreadsheetProfilingContext,
} from "./ChaosDataTypes";
import { normalizeComparableValue, stableValue } from "./ChaosValueUtils";

function sourceTypeFromName(name: string): ChaosSourceInput["sourceType"] {
  const extension = name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (extension === "xlsx" || extension === "xls" || extension === "xlsb" || extension === "ods" || extension === "csv") return extension;
  return "file";
}

function sourceIdForDataset(dataset: ActiveDataset): string {
  return dataset.sourceIdentity?.sourceId || dataset.datasetId;
}

function sheetNameOf(sheet: ActiveDataset["sheets"][number]): string {
  return typeof sheet === "string" ? sheet : sheet.sheetName;
}

export async function buildActiveDatasetProfilingInput(
  dataset: ActiveDataset,
  context: SpreadsheetProfilingContext,
  options: ChaosProfilingOptions & { storage?: SpreadsheetStoragePort } = {},
): Promise<ChaosSourceInput> {
  const storage = options.storage || spreadsheetStorageAdapter;
  const sampleLimit = Math.max(1, options.maxRowsPerContainer ?? 500);
  const physicalContainers: PhysicalContainerInput[] = [];
  const sheets = dataset.sheets.length > 0 ? dataset.sheets : (dataset.activeSheet ? [dataset.activeSheet] : []);
  for (const [sheetIndex, sheet] of sheets.entries()) {
    const name = sheetNameOf(sheet);
    const rows = await storage.getRowsPaged(dataset.rawStorageRef, name, 0, sampleLimit);
    const metadata = typeof sheet === "string" ? undefined : sheet;
    const records: PhysicalRecord[] = rows.map((row, index) => ({
      rowIndex: Number(row?.__sourceRowNumber ?? row?.__rowIndex ?? index),
      values: row && typeof row === "object"
        ? Object.fromEntries(Object.entries(row).filter(([key]) => !key.startsWith("__")))
        : { value: row },
    }));
    physicalContainers.push({
      id: name,
      name,
      type: "sheet",
      rowCount: metadata?.rowCount,
      columns: metadata?.columns || [],
      records,
    });
    options.onProgress?.({
      phase: "sampling",
      completed: sheetIndex + 1,
      total: sheets.length,
      message: `Amostra lida: ${name}`,
    });
  }
  return {
    sourceId: context.sourceId || sourceIdForDataset(dataset),
    sourceType: dataset.sourceType === "DATABASE_DATA" ? ((dataset.databaseType || "mysql") as ChaosSourceInput["sourceType"]) : sourceTypeFromName(dataset.sourceName),
    groupId: context.groupId,
    companyId: context.companyId,
    sourceName: dataset.sourceName,
    sourceHash: dataset.sourceIdentity?.fingerprint,
    sourceIdentity: dataset.sourceIdentity,
    physicalContainers,
  };
}

export async function profileActiveDataset(
  dataset: ActiveDataset,
  context: SpreadsheetProfilingContext,
  options: ChaosProfilingOptions & { storage?: SpreadsheetStoragePort } = {},
): Promise<ChaosSourceProfile> {
  const input = await buildActiveDatasetProfilingInput(dataset, context, options);
  return profileChaosSource(input, options);
}

/** Read only the bounded page selected by a confirmed DatasetView. */
export async function readDatasetViewRows(
  dataset: ActiveDataset,
  view: DatasetView,
  storage: SpreadsheetStoragePort = spreadsheetStorageAdapter,
): Promise<Record<string, unknown>[]> {
  const containerId = view.rowSelection?.containerId || view.containerIds[0] || dataset.activeSheet;
  if (!containerId) return [];
  const rows = await storage.getRowsPaged(dataset.rawStorageRef, containerId, 0, 100);
  const scoped = rows.filter((row, index) => {
    if (!view.rowSelection) return true;
    const rowIndex = Number(row?.__sourceRowNumber ?? row?.__rowIndex ?? index);
    if (view.rowSelection.rowIndexes && view.rowSelection.rowIndexes.length > 0) {
      return view.rowSelection.rowIndexes.includes(rowIndex);
    }
    if (typeof view.rowSelection.startRow === "number" && rowIndex < view.rowSelection.startRow) return false;
    if (typeof view.rowSelection.endRow === "number" && rowIndex > view.rowSelection.endRow) return false;
    return true;
  });
  return scoped.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => !key.startsWith("__"))));
}

function columnLetters(address: string): string {
  return address.match(/^[A-Z]+/i)?.[0]?.toUpperCase() || address;
}

export function buildWorkbookCatalogProfilingInput(catalog: WorkbookCatalog, context: SpreadsheetProfilingContext): ChaosSourceInput {
  const physicalContainers: PhysicalContainerInput[] = catalog.sheets.map(sheet => {
    const profiles = catalog.columns.filter(column => column.sheetName === sheet.name).sort((left, right) => left.columnIndex - right.columnIndex);
    const columns = profiles.map(profile => profile.originalName || profile.columnLetter);
    const nameByLetter = new Map(profiles.map(profile => [profile.columnLetter.toUpperCase(), profile.originalName || profile.columnLetter]));
    const records: PhysicalRecord[] = sheet.preview.map(preview => {
      const values: Record<string, unknown> = {};
      const formulas: Record<string, string> = {};
      preview.cells.forEach(cell => {
        const letter = columnLetters(cell.address);
        const name = nameByLetter.get(letter) || letter;
        values[name] = cell.value;
        if (cell.formula) formulas[name] = cell.formula;
      });
      return { rowIndex: preview.rowIndex, values, formulas };
    });
    return {
      id: sheet.id,
      name: sheet.name,
      type: "sheet",
      rowCount: sheet.rowCount,
      columns,
      records,
      metadata: {
        visibility: sheet.visibility,
        hasFormulas: sheet.hasFormulas,
        hasMergedCells: sheet.hasMergedCells,
        hasHiddenRows: sheet.hasHiddenRows,
        hasHiddenColumns: sheet.hasHiddenColumns,
        hasTables: sheet.hasTables,
        hasNamedRanges: sheet.hasNamedRanges,
        hiddenRowIndexes: catalog.hiddenRows.find(item => item.sheetName === sheet.name)?.indexes || [],
        hiddenColumnIndexes: catalog.hiddenColumns.find(item => item.sheetName === sheet.name)?.indexes || [],
      },
    };
  });
  return {
    sourceId: context.sourceId || catalog.id,
    sourceType: sourceTypeFromName(catalog.metadata.name),
    groupId: context.groupId,
    companyId: context.companyId,
    sourceName: catalog.metadata.name,
    sourceHash: context.sourceHash || catalog.metadata.hash,
    physicalContainers,
  };
}

/**
 * Security is checked before a database sample is accepted. This helper does
 * not open a connection and therefore cannot mutate a database by itself.
 */
export function assertReadOnlyProfilingQuery(query: string): void {
  securityEngine.assertReadOnlyQuery(query);
  const statements = query.split(";").map(statement => statement.trim()).filter(Boolean);
  if (statements.length !== 1) throw new Error("Profiling aceita somente uma instrução de leitura por amostra.");
  const firstKeyword = statements[0].match(/^(?:\/\*[\s\S]*?\*\/\s*|--[^\n]*\n\s*)*([A-Z]+)/i)?.[1]?.toUpperCase();
  if (!firstKeyword || !["SELECT", "SHOW", "DESCRIBE", "DESC", "EXPLAIN"].includes(firstKeyword)) {
    throw new Error("Instrução bloqueada: profiling aceita somente SELECT, SHOW, DESCRIBE ou EXPLAIN.");
  }
  if (firstKeyword === "SELECT" && !/\bLIMIT\s+\d+/i.test(statements[0])) {
    throw new Error("Instrução bloqueada: amostras SELECT precisam ter LIMIT explícito.");
  }
}

export function buildDatabaseProfilingInput(request: DatabaseProfilingRequest): ChaosSourceInput {
  assertReadOnlyProfilingQuery(request.query);
  return {
    ...request.source,
    physicalContainers: [{ ...request.container, records: request.records.map(record => ({ ...record, values: { ...record.values } })) }],
  };
}

export function profileDatabaseSample(request: DatabaseProfilingRequest, options?: ChaosProfilingOptions): ChaosSourceProfile {
  return profileChaosSource(buildDatabaseProfilingInput(request), options);
}

export interface DatabasePagedProfilingRequest {
  source: ChaosSourceInput;
  query: string;
  container: Omit<PhysicalContainerInput, "records">;
  readPage: (offset: number, limit: number) => Promise<PhysicalRecord[]>;
}

export async function profileDatabasePagedSample(request: DatabasePagedProfilingRequest, options: ChaosProfilingOptions = {}): Promise<ChaosSourceProfile> {
  assertReadOnlyProfilingQuery(request.query);
  const limit = Math.max(1, options.maxRowsPerContainer ?? 500);
  const pageSize = Math.min(100, limit);
  const records: PhysicalRecord[] = [];
  for (let offset = 0; records.length < limit; offset += pageSize) {
    if (options.signal?.aborted) throw new Error("Profiling cancelado pelo consultor.");
    const page = await request.readPage(offset, Math.min(pageSize, limit - records.length));
    if (page.length === 0) break;
    records.push(...page);
    if (page.length < pageSize) break;
  }
  return profileChaosSource({ ...request.source, physicalContainers: [{ ...request.container, records }] }, options);
}

export function compareChaosSources(left: ChaosSourceProfile, right: ChaosSourceProfile): SourceComparisonResult {
  const reasons: string[] = [];
  if (left.sourceHash && right.sourceHash && left.sourceHash === right.sourceHash) {
    return { relation: "EXACT_COPY", score: 1, reasons: ["O hash da fonte coincide."] };
  }
  const leftContainers = new Set(left.physicalContainers.map(container => normalizeComparableValue(container.name)));
  const rightContainers = new Set(right.physicalContainers.map(container => normalizeComparableValue(container.name)));
  const containerIntersection = Array.from(leftContainers).filter(name => rightContainers.has(name)).length;
  const containerUnion = new Set([...leftContainers, ...rightContainers]).size;
  const containerScore = containerUnion > 0 ? containerIntersection / containerUnion : 0;
  const leftColumns = new Set(left.physicalColumns.map(column => `${normalizeComparableValue(column.containerName)}:${normalizeComparableValue(column.physicalName)}`));
  const rightColumns = new Set(right.physicalColumns.map(column => `${normalizeComparableValue(column.containerName)}:${normalizeComparableValue(column.physicalName)}`));
  const columnIntersection = Array.from(leftColumns).filter(name => rightColumns.has(name)).length;
  const columnUnion = new Set([...leftColumns, ...rightColumns]).size;
  const columnScore = columnUnion > 0 ? columnIntersection / columnUnion : 0;
  const nameScore = normalizeComparableValue(left.sourceName) === normalizeComparableValue(right.sourceName) ? 1 : 0;
  if (containerScore > 0) reasons.push(`Abas/tabelas coincidem em ${Math.round(containerScore * 100)}%.`);
  if (columnScore > 0) reasons.push(`Colunas físicas coincidem em ${Math.round(columnScore * 100)}%.`);
  if (nameScore) reasons.push("O nome da fonte coincide.");
  const score = containerScore * 0.4 + columnScore * 0.5 + nameScore * 0.1;
  return { relation: score >= 0.8 ? "POSSIBLE_NEW_VERSION" : "DISTINCT", score, reasons: reasons.length > 0 ? reasons : ["Não há sinais estruturais suficientes de duplicidade."] };
}

export function structuralFingerprint(profile: ChaosSourceProfile): string {
  const body = profile.physicalContainers.map(container => ({
    name: normalizeComparableValue(container.name),
    columns: container.columns.map(normalizeComparableValue),
    rowCount: container.rowCount,
    sample: container.rows.slice(0, 3).map(row => [row.rowIndex, row.classification]),
  }));
  return stableValue(body);
}
