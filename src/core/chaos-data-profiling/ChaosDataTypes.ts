import type { ActiveDataset, SourceIdentity } from "../../types/dataSource";
import type { SourceEnterpriseBinding } from "../persistence/EnterpriseRepository";

export type ChaosSourceType =
  | "mysql"
  | "postgres"
  | "mssql"
  | "oracle"
  | "mongodb"
  | "xlsx"
  | "xls"
  | "xlsb"
  | "csv"
  | "ods"
  | "spreadsheet"
  | "file";

export type PhysicalContainerType = "table" | "sheet" | "collection" | "file";

export interface PhysicalRecord {
  rowIndex: number;
  values: Record<string, unknown>;
  formulas?: Record<string, string>;
}

export interface PhysicalContainerInput {
  id: string;
  name: string;
  type: PhysicalContainerType;
  rowCount?: number;
  columns?: string[];
  records: PhysicalRecord[];
  metadata?: Record<string, unknown>;
}

export interface ChaosSourceInput {
  sourceId: string;
  sourceType: ChaosSourceType;
  groupId: string;
  companyId?: string;
  sourceName: string;
  sourceHash?: string;
  sourceIdentity?: SourceIdentity;
  binding?: SourceEnterpriseBinding;
  physicalContainers: PhysicalContainerInput[];
}

export type ChaosValueType = "empty" | "number" | "text" | "date" | "boolean" | "object" | "unknown";

export type ProbableColumnRole =
  | "identifier"
  | "code"
  | "name"
  | "dimension"
  | "metric"
  | "date"
  | "boolean"
  | "unknown";

export interface ColumnEvidence {
  signal: string;
  detail: string;
}

export interface PhysicalColumnProfile {
  physicalName: string;
  containerId: string;
  containerName?: string;
  position?: number;
  observedTypes: ChaosValueType[];
  typePercentages?: Partial<Record<ChaosValueType, number>>;
  numericPercentage?: number;
  textPercentage?: number;
  datePercentage?: number;
  booleanPercentage?: number;
  emptyPercentage: number;
  cardinality?: number;
  distinctValues?: string[];
  mostFrequentValues?: Array<{ value: string; count: number }>;
  examples: unknown[];
  averageLength?: number;
  minValue?: string | number | null;
  maxValue?: string | number | null;
  patterns?: string[];
  repeatedValueCount?: number;
  mixedTypes?: boolean;
  probableIdentifier?: boolean;
  probableCode?: boolean;
  probableName?: boolean;
  probableDimension?: boolean;
  probableMetric?: boolean;
  probableDate?: boolean;
  probableRoles?: ProbableColumnRole[];
  probableRole?: ProbableColumnRole;
  confidence?: number;
  evidence?: ColumnEvidence[];
}

export type RowClassificationKind =
  | "TITLE"
  | "HEADER"
  | "SUBHEADER"
  | "DATA"
  | "TOTAL"
  | "FOOTER"
  | "SEPARATOR"
  | "EMPTY"
  | "FORMULA_ROW"
  | "METADATA_ROW"
  | "UNKNOWN";

export interface ProfiledRow {
  containerId: string;
  rowIndex: number;
  classification: RowClassificationKind;
  density: number;
  nonEmptyCount: number;
  evidence: string[];
}

export type SuggestionStatus = "SUGGESTED" | "CONFIRMED" | "EDITED" | "REJECTED" | "IGNORED";
export type SuggestionScope = "source" | "container" | "block" | "datasetView";

export interface SemanticSuggestion {
  id: string;
  suggestedLabel: string;
  suggestedRole: string;
  scope?: SuggestionScope;
  sourceId?: string;
  containerId?: string;
  blockId?: string;
  physicalColumns: string[];
  confidence: number;
  evidence: string[];
  sampleValues?: unknown[];
  possibleRelations?: string[];
  warnings: string[];
  status: SuggestionStatus;
}

export type QualitySeverity = "info" | "low" | "medium" | "high";

export interface QualityFinding {
  id: string;
  code:
    | "MIXED_TYPES"
    | "NUMERIC_AS_TEXT"
    | "DATE_AS_TEXT"
    | "HEADER_IN_DATA"
    | "EMPTY_ROWS"
    | "DUPLICATE_ROWS"
    | "DUPLICATE_IDENTIFIER"
    | "NEAR_EMPTY_COLUMN"
    | "EXTREME_VALUES"
    | "STRUCTURAL_SHIFT"
    | "FORMULA_ERROR"
    | "DUPLICATE_CONTAINER"
    | "INCONSISTENT_RELATION"
    | "POSSIBLE_DUPLICATE_SOURCE"
    | "OTHER";
  severity: QualitySeverity;
  message: string;
  sourceId: string;
  containerId?: string;
  columnNames?: string[];
  rowIndexes?: number[];
  evidence: string[];
}

export interface DetectedBlock {
  blockId: string;
  sourceId: string;
  containerId: string;
  startRow: number;
  endRow: number;
  titleSuggestion: string | null;
  headerRows: number[];
  dataRows: number[];
  proposedColumns: string[];
  metadataContext: Record<string, unknown>;
  confidence: number;
  evidence: string[];
  status: SuggestionStatus;
}

export interface PhysicalContainerProfile {
  id: string;
  name: string;
  type: PhysicalContainerType;
  rowCount: number | null;
  sampledRecords?: number;
  columns?: string[];
  records?: PhysicalRecord[];
  rows?: ProfiledRow[];
  blocks?: DetectedBlock[];
  metadata?: Record<string, unknown>;
}

export interface RawZoneReference {
  sourceId: string;
  sourceHash?: string;
  sourceName: string;
  immutable: true;
  physicalReferences: Array<{
    containerId: string;
    containerName: string;
    rowIndexes: number[];
    columns: string[];
  }>;
  storageMetadataKey?: string;
  storageRowsKey?: string;
}

export interface ChaosSourceProfile {
  profileId?: string;
  sourceId: string;
  sourceType?: ChaosSourceType;
  groupId: string;
  companyId?: string;
  sourceName: string;
  sourceHash?: string;
  physicalContainers: PhysicalContainerProfile[];
  physicalColumns: PhysicalColumnProfile[];
  sampledRecords: number;
  profilingStatus?: "READY" | "PENDING" | "FAILED";
  detectedBlocks: DetectedBlock[];
  semanticSuggestions: SemanticSuggestion[];
  qualityFindings: QualityFinding[];
  rawZone?: RawZoneReference;
  totalKnownRows?: number;
  confidenceScore?: number;
  createdAt?: string;
  updatedAt: string;
  version?: number;
}

export interface ChaosProfilingOptions {
  maxRowsPerContainer?: number;
  maxDistinctValues?: number;
  maxExamples?: number;
  signal?: AbortSignal;
  now?: string;
  onProgress?: (progress: { phase: "sampling" | "profiling"; completed: number; total: number; message: string }) => void;
}

export interface DatasetViewTransformation {
  id: string;
  type: "DISPLAY_RENAME" | "TYPE_CONVERSION" | "UNION" | "SPLIT" | "FILTER" | "HEADER_DETECTION" | "PIVOT" | "UNPIVOT" | "NORMALIZE" | "DERIVED_FIELD";
  description: string;
  parameters: Record<string, unknown>;
  reversible: true;
  appliedBy: "CONSULTANT" | "SUGGESTION";
  appliedAt: string;
}

export interface DatasetView {
  datasetViewId: string;
  sourceId: string;
  containerIds: string[];
  blockIds: string[];
  selectedRowsRule: string;
  rowSelection?: {
    containerId: string;
    startRow?: number;
    endRow?: number;
    rowIndexes?: number[];
  };
  selectedColumns: string[];
  physicalToLogicalMapping: Record<string, string>;
  consultantLabels: Record<string, string>;
  inferredTypes: Record<string, ChaosValueType>;
  transformations: DatasetViewTransformation[];
  filters: string[];
  groupId: string;
  companyId?: string;
  status: "DRAFT" | "CONFIRMED" | "ARCHIVED";
  version: number;
  createdAt: string;
  updatedAt: string;
  confirmedBy?: string;
}

export interface SourceComparisonResult {
  relation: "EXACT_COPY" | "POSSIBLE_NEW_VERSION" | "DISTINCT";
  score: number;
  reasons: string[];
}

/** Fail closed when a caller presents a source with an unrelated canonical binding. */
export function assertChaosSourceContext(input: ChaosSourceInput): void {
  if (input.sourceIdentity?.sourceId && input.sourceIdentity.sourceId !== input.sourceId) {
    throw new Error("A identidade canônica da fonte não corresponde ao perfil solicitado.");
  }
  if (!input.binding) return;
  if (input.binding.sourceId !== input.sourceId) throw new Error("O vínculo canônico não corresponde à fonte solicitada.");
  if (input.binding.groupId && input.binding.groupId !== input.groupId) throw new Error("A fonte pertence a outro grupo no vínculo canônico.");
  if (input.binding.companyId && input.companyId && input.binding.companyId !== input.companyId) throw new Error("A fonte pertence a outra empresa no vínculo canônico.");
}

export interface DatabaseProfilingRequest {
  source: ChaosSourceInput;
  query: string;
  container: Omit<PhysicalContainerInput, "records">;
  records: PhysicalRecord[];
}

export interface SpreadsheetProfilingContext {
  groupId: string;
  companyId?: string;
  sourceId?: string;
  sourceHash?: string;
}

export function isConfirmedDatasetView(view: DatasetView | null | undefined): boolean {
  return view?.status === "CONFIRMED";
}

export function createDatasetViewFromActiveDataset(dataset: ActiveDataset, selectedColumns: string[] = []): DatasetView {
  const now = new Date().toISOString();
  const columns = selectedColumns.length > 0
    ? [...selectedColumns]
    : (dataset.physicalColumns || dataset.columnProfiles.map(profile => profile.originalName || profile.name));
  const sourceId = dataset.sourceIdentity?.sourceId || dataset.datasetId;
  return {
    datasetViewId: `view_${sourceId}_${Date.now()}`,
    sourceId,
    containerIds: dataset.sheets.map(sheet => typeof sheet === "string" ? sheet : sheet.sheetName),
    blockIds: [],
    selectedRowsRule: "rows selected explicitly by the consultant",
    selectedColumns: [...columns],
    physicalToLogicalMapping: Object.fromEntries(columns.map(column => [column, column])),
    consultantLabels: Object.fromEntries(columns.map(column => [column, column])),
    inferredTypes: Object.fromEntries(columns.map(column => [column, "unknown"])),
    transformations: [],
    filters: [],
    groupId: dataset.sourceIdentity?.groupId || "",
    companyId: dataset.sourceIdentity?.companyId,
    status: "DRAFT",
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}
