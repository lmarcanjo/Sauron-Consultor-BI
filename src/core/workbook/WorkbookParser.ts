import * as XLSX from "xlsx";
import { buildWorkbookDiagnostics } from "./WorkbookDiagnostics";
import { catalogFormulas } from "./WorkbookFormulaCatalog";
import { buildDependencyGraph } from "./WorkbookGraph";
import { buildWorkbookMetadata } from "./WorkbookMetadata";
import { profileColumns } from "./WorkbookProfiler";
import {
  WorkbookCatalog,
  WorkbookChartCatalog,
  WorkbookColumnProfile,
  WorkbookConditionalFormattingCatalog,
  WorkbookDataValidationCatalog,
  WorkbookFormulaCatalogItem,
  WorkbookFreezePaneCatalog,
  WorkbookHiddenAxisCatalog,
  WorkbookMergedCellCatalog,
  WorkbookNamedRangeCatalog,
  WorkbookParseOptions,
  WorkbookParserInput,
  WorkbookPivotTableCatalog,
  WorkbookPreviewRow,
  WorkbookRange,
  WorkbookSheetCatalog,
  WorkbookTableCatalog,
} from "./WorkbookTypes";

const CELL_ADDRESS_RE = /^[A-Z]{1,3}\d+$/;

function fileToText(file: any): string {
  const content = file?.content ?? file;
  if (!content) return "";
  if (typeof content === "string") return content;
  if (content instanceof Uint8Array) return new TextDecoder().decode(content);
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(content)) return content.toString("utf8");
  return String(content);
}

function getFileText(files: Record<string, any> | undefined, path: string): string {
  return fileToText(files?.[path]);
}

function appendMany<T>(target: T[], items: T[]): void {
  items.forEach(item => target.push(item));
}

function decodeRange(sheetName: string, address: string): WorkbookRange {
  const range = XLSX.utils.decode_range(address);
  return {
    sheetName,
    address,
    startRow: range.s.r,
    startColumn: range.s.c,
    endRow: range.e.r,
    endColumn: range.e.c,
  };
}

function rangeFromCoords(sheetName: string, coords: Array<{ row: number; column: number }>): WorkbookRange {
  let startRow = Number.POSITIVE_INFINITY;
  let endRow = Number.NEGATIVE_INFINITY;
  let startColumn = Number.POSITIVE_INFINITY;
  let endColumn = Number.NEGATIVE_INFINITY;

  coords.forEach(coord => {
    startRow = Math.min(startRow, coord.row);
    endRow = Math.max(endRow, coord.row);
    startColumn = Math.min(startColumn, coord.column);
    endColumn = Math.max(endColumn, coord.column);
  });

  const address = XLSX.utils.encode_range({ s: { r: startRow, c: startColumn }, e: { r: endRow, c: endColumn } });
  return { sheetName, address, startRow, startColumn, endRow, endColumn };
}

function getCellCoords(worksheet: any) {
  return Object.keys(worksheet || {})
    .filter(key => CELL_ADDRESS_RE.test(key))
    .map(address => ({ address, ...XLSX.utils.decode_cell(address) }))
    .map(coord => ({ address: coord.address, row: coord.r, column: coord.c }))
    .sort((a, b) => a.row - b.row || a.column - b.column);
}

function buildPreview(sheetName: string, worksheet: any, usedRange: WorkbookRange | null, rowLimit: number): WorkbookPreviewRow[] {
  if (!usedRange) return [];
  const rows: WorkbookPreviewRow[] = [];
  const endRow = Math.min(usedRange.endRow, usedRange.startRow + rowLimit - 1);
  for (let row = usedRange.startRow; row <= endRow; row++) {
    const cells = [];
    for (let column = usedRange.startColumn; column <= usedRange.endColumn; column++) {
      const address = XLSX.utils.encode_cell({ r: row, c: column });
      const cell = worksheet[address];
      if (!cell) continue;
      cells.push({
        address,
        value: cell.v ?? cell.w ?? null,
        formula: cell.f,
      });
    }
    rows.push({ rowIndex: row, cells });
  }
  return rows;
}

function hiddenIndexes(axis: any[] | undefined): number[] {
  return (axis || [])
    .map((item, index) => item?.hidden ? index : null)
    .filter((index): index is number => index !== null);
}

function visibility(hidden: number | undefined): WorkbookSheetCatalog["visibility"] {
  if (hidden === 2) return "veryHidden";
  if (hidden === 1) return "hidden";
  return "visible";
}

function parseAttributes(xmlFragment: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const matches = xmlFragment.matchAll(/([A-Za-z_:][\w:.-]*)="([^"]*)"/g);
  for (const match of matches) attrs[match[1]] = match[2];
  return attrs;
}

function detectDataValidations(sheetName: string, sheetXml: string): WorkbookDataValidationCatalog[] {
  const validations: WorkbookDataValidationCatalog[] = [];
  const matches = sheetXml.matchAll(/<dataValidation\b([^>]*)>([\s\S]*?)<\/dataValidation>|<dataValidation\b([^>]*)\/>/g);
  let idx = 0;
  for (const match of matches) {
    const attrs = parseAttributes(match[1] || match[3] || "");
    const body = match[2] || "";
    const formula1 = body.match(/<formula1>([\s\S]*?)<\/formula1>/)?.[1];
    const formula2 = body.match(/<formula2>([\s\S]*?)<\/formula2>/)?.[1];
    validations.push({
      id: `${sheetName}:validation:${idx++}`,
      sheetName,
      range: attrs.sqref || "",
      type: attrs.type || "unknown",
      formula1,
      formula2,
      allowBlank: attrs.allowBlank === "1",
      required: attrs.allowBlank !== "1",
    });
  }
  return validations;
}

function detectConditionalFormatting(sheetName: string, sheetXml: string): WorkbookConditionalFormattingCatalog[] {
  const items: WorkbookConditionalFormattingCatalog[] = [];
  const matches = sheetXml.matchAll(/<conditionalFormatting\b([^>]*)>([\s\S]*?)<\/conditionalFormatting>/g);
  let idx = 0;
  for (const match of matches) {
    const attrs = parseAttributes(match[1] || "");
    const body = match[2] || "";
    items.push({
      id: `${sheetName}:cf:${idx++}`,
      sheetName,
      range: attrs.sqref || "",
      type: body.match(/<cfRule\b[^>]*type="([^"]+)"/)?.[1] || "unknown",
      colors: Array.from(body.matchAll(/rgb="([^"]+)"/g)).map(item => item[1]),
      icons: Array.from(body.matchAll(/iconSet="([^"]+)"/g)).map(item => item[1]),
      bars: body.includes("<dataBar") ? ["dataBar"] : [],
      scales: body.includes("<colorScale") ? ["colorScale"] : [],
    });
  }
  return items;
}

function detectFreezePane(sheetName: string, sheetXml: string) {
  const pane = sheetXml.match(/<pane\b([^>]*)\/?>/);
  if (!pane) return { sheetName, topLeftCell: null, xSplit: null, ySplit: null };
  const attrs = parseAttributes(pane[1]);
  return {
    sheetName,
    topLeftCell: attrs.topLeftCell || null,
    xSplit: attrs.xSplit ? Number(attrs.xSplit) : null,
    ySplit: attrs.ySplit ? Number(attrs.ySplit) : null,
  };
}

function detectStructuredTables(files: Record<string, any> | undefined): WorkbookTableCatalog[] {
  return Object.keys(files || {})
    .filter(path => /xl\/tables\/table\d+\.xml$/.test(path))
    .map((path, index) => {
      const xml = getFileText(files, path);
      const attrs = parseAttributes(xml.match(/<table\b([^>]*)/)?.[1] || "");
      const ref = attrs.ref || "A1:A1";
      const sheetName = "unknown";
      const range = decodeRange(sheetName, ref);
      return {
        id: attrs.id || `structured-table-${index}`,
        sheetName,
        type: "structuredTable" as const,
        range,
        headerRow: range.startRow,
        headers: Array.from(xml.matchAll(/<tableColumn\b[^>]*name="([^"]+)"/g)).map(match => match[1]),
        rowCount: range.endRow - range.startRow + 1,
        columnCount: range.endColumn - range.startColumn + 1,
      };
    });
}

function detectContinuousRegions(sheetName: string, coords: Array<{ row: number; column: number }>): WorkbookTableCatalog[] {
  if (coords.length === 0) return [];

  const range = rangeFromCoords(sheetName, coords);
  const rowCount = range.endRow - range.startRow + 1;
  const columnCount = range.endColumn - range.startColumn + 1;
  if (rowCount <= 1 || columnCount <= 1) return [];

  return [{
    id: `${sheetName}:region:0`,
    sheetName,
    type: "continuousRegion",
    range,
    headerRow: range.startRow,
    headers: [],
    rowCount,
    columnCount,
  }];
}

function catalogNamedRanges(workbook: any): WorkbookNamedRangeCatalog[] {
  return (workbook.Workbook?.Names || []).map((name: any, index: number) => ({
    id: `name:${index}`,
    name: name.Name,
    refersTo: name.Ref || "",
    sheetName: typeof name.Sheet === "number" ? workbook.SheetNames?.[name.Sheet] || null : null,
    hidden: Boolean(name.Hidden),
  }));
}

function catalogCharts(files: Record<string, any> | undefined): WorkbookChartCatalog[] {
  return Object.keys(files || {})
    .filter(path => /xl\/charts\/chart\d+\.xml$/.test(path))
    .map((path, index) => {
      const xml = getFileText(files, path);
      return {
        id: `chart:${index}`,
        type: xml.match(/<c:([a-zA-Z]+)Chart\b/)?.[1] || "unknown",
        source: path,
        sheetName: null,
        position: null,
        size: null,
      };
    });
}

function catalogPivots(files: Record<string, any> | undefined): WorkbookPivotTableCatalog[] {
  return Object.keys(files || {})
    .filter(path => /xl\/pivotTables\/pivotTable\d+\.xml$/.test(path))
    .map((path, index) => {
      const xml = getFileText(files, path);
      return {
        id: `pivot:${index}`,
        source: path,
        sheetName: null,
        fields: Array.from(xml.matchAll(/name="([^"]+)"/g)).map(match => match[1]),
        filters: [],
        rows: [],
        columns: [],
        values: [],
      };
    });
}

export class WorkbookParser {
  parse(input: WorkbookParserInput): WorkbookCatalog {
    const workbook = input.workbook;
    const files = input.files || workbook.files;
    const options: WorkbookParseOptions = input.options || {};
    const previewRowsPerSheet = options.previewRowsPerSheet ?? 10;
    const profileRowsPerSheetLimit = options.profileRowsPerSheetLimit ?? null;
    const workbookSheets = workbook.Workbook?.Sheets || [];
    const namedRanges = catalogNamedRanges(workbook);
    const structuredTables = detectStructuredTables(files);
    const charts = catalogCharts(files);
    const pivotTables = catalogPivots(files);

    const sheets: WorkbookSheetCatalog[] = [];
    const tables: WorkbookTableCatalog[] = [...structuredTables];
    const columns: WorkbookColumnProfile[] = [];
    const formulas: WorkbookFormulaCatalogItem[] = [];
    const mergedCells: WorkbookMergedCellCatalog[] = [];
    const hiddenRows: WorkbookHiddenAxisCatalog[] = [];
    const hiddenColumns: WorkbookHiddenAxisCatalog[] = [];
    const freezePanes: WorkbookFreezePaneCatalog[] = [];
    const dataValidation: WorkbookDataValidationCatalog[] = [];
    const conditionalFormatting: WorkbookConditionalFormattingCatalog[] = [];

    let totalRows = 0;
    let maxColumns = 0;
    let totalCells = 0;

    workbook.SheetNames.forEach((sheetName: string, index: number) => {
      const worksheet = workbook.Sheets[sheetName];
      const usedRange = worksheet?.["!ref"] ? decodeRange(sheetName, worksheet["!ref"]) : null;
      const rowCount = usedRange ? usedRange.endRow - usedRange.startRow + 1 : 0;
      const columnCount = usedRange ? usedRange.endColumn - usedRange.startColumn + 1 : 0;
      const coords = getCellCoords(worksheet);
      const cellAddresses = coords.map(coord => coord.address);
      const sheetFormulas = catalogFormulas({ sheetName, worksheet, cellAddresses });
      const sheetXml = getFileText(files, `xl/worksheets/sheet${index + 1}.xml`);
      const sheetDataValidations = detectDataValidations(sheetName, sheetXml);
      const sheetConditionalFormatting = detectConditionalFormatting(sheetName, sheetXml);
      const sheetMergedCells = (worksheet?.["!merges"] || []).map((merge: any, mergeIndex: number) => {
        const address = XLSX.utils.encode_range(merge);
        return {
          id: `${sheetName}:merge:${mergeIndex}`,
          sheetName,
          range: decodeRange(sheetName, address),
        };
      });
      const sheetHiddenRows = hiddenIndexes(worksheet?.["!rows"]);
      const sheetHiddenColumns = hiddenIndexes(worksheet?.["!cols"]);
      const sheetNamedRanges = namedRanges.filter(namedRange => namedRange.refersTo.includes(`${sheetName}!`) || namedRange.sheetName === sheetName);

      totalRows += rowCount;
      maxColumns = Math.max(maxColumns, columnCount);
      totalCells += rowCount * columnCount;
      appendMany(formulas, sheetFormulas);
      appendMany(mergedCells, sheetMergedCells);
      if (sheetHiddenRows.length > 0) hiddenRows.push({ sheetName, indexes: sheetHiddenRows });
      if (sheetHiddenColumns.length > 0) hiddenColumns.push({ sheetName, indexes: sheetHiddenColumns });
      freezePanes.push(detectFreezePane(sheetName, sheetXml));
      appendMany(dataValidation, sheetDataValidations);
      appendMany(conditionalFormatting, sheetConditionalFormatting);
      appendMany(tables, detectContinuousRegions(sheetName, coords));
      appendMany(columns, profileColumns({
        sheetName,
        worksheet,
        coords,
        rowCount,
        columnCount,
        encodeCol: XLSX.utils.encode_col,
        profileRowsPerSheetLimit,
        headerRowIndex: usedRange?.startRow ?? 0,
      }));

      sheets.push({
        id: `sheet:${index}`,
        name: sheetName,
        index,
        visibility: visibility(workbookSheets[index]?.Hidden),
        rowCount,
        columnCount,
        usedRange,
        preview: buildPreview(sheetName, worksheet, usedRange, previewRowsPerSheet),
        hasFormulas: sheetFormulas.length > 0,
        hasCharts: charts.some(chart => chart.sheetName === sheetName),
        hasPivot: pivotTables.some(pivot => pivot.sheetName === sheetName),
        hasTables: tables.some(table => table.sheetName === sheetName),
        hasMergedCells: sheetMergedCells.length > 0,
        hasConditionalFormatting: sheetConditionalFormatting.length > 0,
        hasNamedRanges: sheetNamedRanges.length > 0,
        hasHiddenRows: sheetHiddenRows.length > 0,
        hasHiddenColumns: sheetHiddenColumns.length > 0,
      });
    });

    const importedAt = options.importedAt || new Date().toISOString();
    const id = options.hash || `workbook:${options.sourceName || "unnamed"}:${importedAt}`;
    const metadata = buildWorkbookMetadata({
      id,
      fileName: options.sourceName || workbook.Props?.Title || "workbook.xlsx",
      hash: options.hash || id,
      importedAt,
      sizeBytes: options.sourceSizeBytes,
      props: workbook.Props,
      sheetCount: workbook.SheetNames.length,
      rowCount: totalRows,
      columnCount: maxColumns,
      cellCount: totalCells,
    });
    const dependencies = buildDependencyGraph({ sheetNames: workbook.SheetNames, formulas, namedRanges });

    const partial = {
      id,
      metadata,
      sheets,
      tables,
      columns,
      namedRanges,
      formulas,
      pivotTables,
      charts,
      hiddenRows,
      hiddenColumns,
      freezePanes,
      mergedCells,
      conditionalFormatting,
      dataValidation,
      dependencies,
    };

    return {
      ...partial,
      diagnostics: buildWorkbookDiagnostics(partial, {
        profilingRowsPerSheetLimit: profileRowsPerSheetLimit,
        pagedReading: profileRowsPerSheetLimit !== null,
        fullWorkbookLoadedByParser: true,
      }),
      createdAt: new Date().toISOString(),
    };
  }
}
