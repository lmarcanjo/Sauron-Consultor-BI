import { WorkbookCatalog, WorkbookColumnProfile, WorkbookDiagnostics } from "./WorkbookTypes";

function findDuplicateHeaders(columns: WorkbookColumnProfile[]) {
  const grouped = new Map<string, WorkbookColumnProfile[]>();
  columns.forEach(column => {
    const header = column.originalName.trim().toLowerCase();
    if (!header) return;
    const key = `${column.sheetName}::${header}`;
    const current = grouped.get(key) || [];
    current.push(column);
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .filter(items => items.length > 1)
    .map(items => ({
      sheetName: items[0].sheetName,
      header: items[0].originalName,
      columns: items.map(item => item.columnLetter),
    }));
}

export function buildWorkbookDiagnostics(
  partial: Omit<WorkbookCatalog, "diagnostics" | "createdAt">,
  performance: WorkbookDiagnostics["performance"],
): WorkbookDiagnostics {
  const emptyColumns = partial.columns
    .filter(column => column.valueCount === 0)
    .map(column => ({ sheetName: column.sheetName, columnLetter: column.columnLetter, columnIndex: column.columnIndex }));
  const mixedTypes = partial.columns
    .filter(column => column.inferredType === "mixed")
    .map(column => ({ sheetName: column.sheetName, columnLetter: column.columnLetter, originalName: column.originalName }));
  const patternChanges = partial.columns
    .filter(column => column.inferredType === "text" && column.uniqueCount > 0 && column.textPattern === null)
    .map(column => ({ sheetName: column.sheetName, columnLetter: column.columnLetter, reason: "Padrão textual não dominante." }));
  const structuralIssues: string[] = [];

  if (partial.sheets.length === 0) structuralIssues.push("Workbook sem abas detectadas.");
  if (partial.formulas.length > 0 && partial.dependencies.edges.length === 0) {
    structuralIssues.push("Fórmulas detectadas sem dependências resolvidas pelo catálogo inicial.");
  }

  return {
    sheetCount: partial.sheets.length,
    rowCount: partial.metadata.rowCount,
    columnCount: partial.metadata.columnCount,
    formulaCount: partial.formulas.length,
    chartCount: partial.charts.length,
    tableCount: partial.tables.length,
    pivotTableCount: partial.pivotTables.length,
    namedRangeCount: partial.namedRanges.length,
    mergedCellCount: partial.mergedCells.length,
    dataValidationCount: partial.dataValidation.length,
    conditionalFormattingCount: partial.conditionalFormatting.length,
    emptyColumns,
    duplicateHeaders: findDuplicateHeaders(partial.columns),
    mixedTypes,
    patternChanges,
    structuralIssues,
    performance,
  };
}

