export type WorkbookCellValue = string | number | boolean | Date | null | undefined;

export interface WorkbookSourceMetadata {
  id: string;
  name: string;
  extension: string;
  importedAt: string;
  hash: string;
  sizeBytes?: number;
  author?: string;
  company?: string;
  lastModified?: string;
  officeVersion?: string;
  libreOfficeVersion?: string;
  encoding?: string;
  language?: string;
  sheetCount: number;
  rowCount: number;
  columnCount: number;
  cellCount: number;
}

export interface WorkbookRange {
  sheetName: string;
  address: string;
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
}

export interface WorkbookPreviewCell {
  address: string;
  value: WorkbookCellValue;
  formula?: string;
}

export interface WorkbookPreviewRow {
  rowIndex: number;
  cells: WorkbookPreviewCell[];
}

export interface WorkbookSheetCatalog {
  id: string;
  name: string;
  index: number;
  visibility: "visible" | "hidden" | "veryHidden";
  rowCount: number;
  columnCount: number;
  usedRange: WorkbookRange | null;
  preview: WorkbookPreviewRow[];
  hasFormulas: boolean;
  hasCharts: boolean;
  hasPivot: boolean;
  hasTables: boolean;
  hasMergedCells: boolean;
  hasConditionalFormatting: boolean;
  hasNamedRanges: boolean;
  hasHiddenRows: boolean;
  hasHiddenColumns: boolean;
}

export interface WorkbookTableCatalog {
  id: string;
  sheetName: string;
  type: "structuredTable" | "dataBlock" | "continuousRegion";
  range: WorkbookRange;
  headerRow: number | null;
  headers: string[];
  rowCount: number;
  columnCount: number;
}

export interface WorkbookColumnProfile {
  sheetName: string;
  columnIndex: number;
  columnLetter: string;
  originalName: string;
  alias: string;
  inferredType: "empty" | "text" | "number" | "date" | "boolean" | "mixed";
  valueCount: number;
  emptyCount: number;
  uniqueCount: number;
  duplicateCount: number;
  fillRate: number;
  minValue: string | number | null;
  maxValue: string | number | null;
  examples: WorkbookCellValue[];
  textPattern: string | null;
  numericPattern: string | null;
  possibleDates: number;
  possibleCpfs: number;
  possibleCnpjs: number;
  possiblePhones: number;
  possibleCeps: number;
  possibleCodes: number;
  possibleIds: number;
}

export interface WorkbookFormulaCatalogItem {
  id: string;
  type: string;
  formula: string;
  sheetName: string;
  range: string;
  cell: string;
  dependencies: string[];
}

export interface WorkbookChartCatalog {
  id: string;
  type: string;
  source: string | null;
  sheetName: string | null;
  position: string | null;
  size: string | null;
}

export interface WorkbookPivotTableCatalog {
  id: string;
  source: string | null;
  sheetName: string | null;
  fields: string[];
  filters: string[];
  rows: string[];
  columns: string[];
  values: string[];
}

export interface WorkbookNamedRangeCatalog {
  id: string;
  name: string;
  refersTo: string;
  sheetName: string | null;
  hidden: boolean;
}

export interface WorkbookDataValidationCatalog {
  id: string;
  sheetName: string;
  range: string;
  type: string;
  formula1?: string;
  formula2?: string;
  allowBlank?: boolean;
  required: boolean;
}

export interface WorkbookConditionalFormattingCatalog {
  id: string;
  sheetName: string;
  range: string;
  type: string;
  colors: string[];
  icons: string[];
  bars: string[];
  scales: string[];
}

export interface WorkbookMergedCellCatalog {
  id: string;
  sheetName: string;
  range: WorkbookRange;
}

export interface WorkbookHiddenAxisCatalog {
  sheetName: string;
  indexes: number[];
}

export interface WorkbookFreezePaneCatalog {
  sheetName: string;
  topLeftCell: string | null;
  xSplit: number | null;
  ySplit: number | null;
}

export interface WorkbookDependencyEdge {
  from: string;
  to: string;
  type: "formula" | "namedRange" | "sheetReference" | "externalReference";
  evidence: string;
}

export interface WorkbookDependencyGraph {
  nodes: string[];
  edges: WorkbookDependencyEdge[];
}

export interface WorkbookDiagnostics {
  sheetCount: number;
  rowCount: number;
  columnCount: number;
  formulaCount: number;
  chartCount: number;
  tableCount: number;
  pivotTableCount: number;
  namedRangeCount: number;
  mergedCellCount: number;
  dataValidationCount: number;
  conditionalFormattingCount: number;
  emptyColumns: Array<{ sheetName: string; columnLetter: string; columnIndex: number }>;
  duplicateHeaders: Array<{ sheetName: string; header: string; columns: string[] }>;
  mixedTypes: Array<{ sheetName: string; columnLetter: string; originalName: string }>;
  patternChanges: Array<{ sheetName: string; columnLetter: string; reason: string }>;
  structuralIssues: string[];
  performance: {
    profilingRowsPerSheetLimit: number | null;
    pagedReading: boolean;
    fullWorkbookLoadedByParser: boolean;
  };
}

export interface WorkbookCatalog {
  id: string;
  metadata: WorkbookSourceMetadata;
  sheets: WorkbookSheetCatalog[];
  tables: WorkbookTableCatalog[];
  columns: WorkbookColumnProfile[];
  namedRanges: WorkbookNamedRangeCatalog[];
  formulas: WorkbookFormulaCatalogItem[];
  pivotTables: WorkbookPivotTableCatalog[];
  charts: WorkbookChartCatalog[];
  hiddenRows: WorkbookHiddenAxisCatalog[];
  hiddenColumns: WorkbookHiddenAxisCatalog[];
  freezePanes: WorkbookFreezePaneCatalog[];
  mergedCells: WorkbookMergedCellCatalog[];
  conditionalFormatting: WorkbookConditionalFormattingCatalog[];
  dataValidation: WorkbookDataValidationCatalog[];
  dependencies: WorkbookDependencyGraph;
  diagnostics: WorkbookDiagnostics;
  createdAt: string;
}

export interface WorkbookParseOptions {
  sourceName?: string;
  sourceSizeBytes?: number;
  hash?: string;
  importedAt?: string;
  previewRowsPerSheet?: number;
  profileRowsPerSheetLimit?: number | null;
}

export interface WorkbookParserInput {
  workbook: any;
  files?: Record<string, any>;
  options?: WorkbookParseOptions;
}

