import {
  WorkbookCatalog,
  WorkbookColumnProfile,
  WorkbookFormulaCatalogItem,
  WorkbookSheetCatalog,
  WorkbookTableCatalog,
} from "./WorkbookTypes";

export interface WorkbookOverview {
  id: string;
  name: string;
  sheetCount: number;
  rowCount: number;
  columnCount: number;
  cellCount: number;
  formulaCount: number;
  tableCount: number;
  chartCount: number;
  pivotTableCount: number;
  namedRangeCount: number;
  hiddenSheetCount: number;
  sheetsWithFormulas: string[];
  sheetsWithTables: string[];
  sheetsWithHiddenRowsOrColumns: string[];
}

export function summarizeWorkbook(catalog: WorkbookCatalog): WorkbookOverview {
  return {
    id: catalog.id,
    name: catalog.metadata.name,
    sheetCount: catalog.metadata.sheetCount,
    rowCount: catalog.metadata.rowCount,
    columnCount: catalog.metadata.columnCount,
    cellCount: catalog.metadata.cellCount,
    formulaCount: catalog.formulas.length,
    tableCount: catalog.tables.length,
    chartCount: catalog.charts.length,
    pivotTableCount: catalog.pivotTables.length,
    namedRangeCount: catalog.namedRanges.length,
    hiddenSheetCount: catalog.sheets.filter(sheet => sheet.visibility !== "visible").length,
    sheetsWithFormulas: catalog.sheets.filter(sheet => sheet.hasFormulas).map(sheet => sheet.name),
    sheetsWithTables: catalog.sheets.filter(sheet => sheet.hasTables).map(sheet => sheet.name),
    sheetsWithHiddenRowsOrColumns: catalog.sheets
      .filter(sheet => sheet.hasHiddenRows || sheet.hasHiddenColumns)
      .map(sheet => sheet.name),
  };
}

export function findSheet(catalog: WorkbookCatalog, sheetName: string): WorkbookSheetCatalog | null {
  const normalized = sheetName.trim().toLowerCase();
  return catalog.sheets.find(sheet => sheet.name.trim().toLowerCase() === normalized) || null;
}

export function listSheetColumns(catalog: WorkbookCatalog, sheetName: string): WorkbookColumnProfile[] {
  return catalog.columns.filter(column => column.sheetName === sheetName);
}

export function listSheetTables(catalog: WorkbookCatalog, sheetName: string): WorkbookTableCatalog[] {
  return catalog.tables.filter(table => table.sheetName === sheetName);
}

export function listFormulaTypes(catalog: WorkbookCatalog): Array<{ type: string; count: number }> {
  const counts = new Map<string, number>();
  catalog.formulas.forEach(formula => counts.set(formula.type, (counts.get(formula.type) || 0) + 1));
  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
}

export function listSheetFormulas(catalog: WorkbookCatalog, sheetName: string): WorkbookFormulaCatalogItem[] {
  return catalog.formulas.filter(formula => formula.sheetName === sheetName);
}
