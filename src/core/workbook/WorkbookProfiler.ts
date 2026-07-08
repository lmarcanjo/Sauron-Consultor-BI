import { WorkbookCellValue, WorkbookColumnProfile } from "./WorkbookTypes";

interface CellCoord {
  address: string;
  row: number;
  column: number;
}

function normalize(value: unknown): string {
  return String(value ?? "").trim();
}

function inferSingleType(value: WorkbookCellValue): "text" | "number" | "date" | "boolean" | "empty" {
  if (value === null || value === undefined || normalize(value) === "") return "empty";
  if (value instanceof Date) return "date";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  const text = normalize(value);
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(text)) return "date";
  if (/^-?\d+(?:[,.]\d+)?$/.test(text)) return "number";
  return "text";
}

function inferColumnType(types: Set<string>): WorkbookColumnProfile["inferredType"] {
  const effective = Array.from(types).filter(type => type !== "empty");
  if (effective.length === 0) return "empty";
  if (effective.length === 1) return effective[0] as WorkbookColumnProfile["inferredType"];
  return "mixed";
}

function samplePattern(value: string): string {
  return value
    .replace(/[A-Za-zÀ-ÿ]/g, "A")
    .replace(/\d/g, "9")
    .replace(/\s/g, " ");
}

function possibleDate(value: string): boolean {
  return /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(value) || /^\d{4}-\d{1,2}-\d{1,2}$/.test(value);
}

function minMax(values: Array<string | number>): { min: string | number | null; max: string | number | null } {
  if (values.length === 0) return { min: null, max: null };
  const numeric = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (numeric.length === values.length) {
    return { min: Math.min(...numeric), max: Math.max(...numeric) };
  }
  const sorted = values.map(String).sort((a, b) => a.localeCompare(b));
  return { min: sorted[0], max: sorted[sorted.length - 1] };
}

export function profileColumns(params: {
  sheetName: string;
  worksheet: any;
  coords: CellCoord[];
  rowCount: number;
  columnCount: number;
  encodeCol: (column: number) => string;
  profileRowsPerSheetLimit: number | null;
  headerRowIndex: number;
}): WorkbookColumnProfile[] {
  const byColumn = new Map<number, CellCoord[]>();
  const maxRow = params.profileRowsPerSheetLimit === null
    ? Number.POSITIVE_INFINITY
    : Math.max(params.profileRowsPerSheetLimit, 1);

  params.coords
    .filter(coord => coord.row < maxRow)
    .forEach(coord => {
      const current = byColumn.get(coord.column) || [];
      current.push(coord);
      byColumn.set(coord.column, current);
    });

  const profiles: WorkbookColumnProfile[] = [];
  for (let column = 0; column < params.columnCount; column++) {
    const coords = byColumn.get(column) || [];
    const dataCoords = coords.filter(coord => coord.row !== params.headerRowIndex);
    const values = dataCoords
      .map(coord => params.worksheet[coord.address]?.v ?? params.worksheet[coord.address]?.w)
      .filter(value => normalize(value) !== "");
    const typeSet = new Set(values.map(inferSingleType));
    const examples = values.slice(0, 5);
    const uniqueValues = new Set(values.map(value => normalize(value)));
    const comparable = values
      .map(value => (typeof value === "number" ? value : normalize(value)))
      .filter(value => normalize(value) !== "");
    const { min, max } = minMax(comparable);
    const strings = values.map(value => normalize(value)).filter(Boolean);
    const patternCounts = new Map<string, number>();
    strings.slice(0, 100).forEach(value => {
      const pattern = samplePattern(value);
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
    });
    const dominantPattern = Array.from(patternCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    profiles.push({
      sheetName: params.sheetName,
      columnIndex: column,
      columnLetter: params.encodeCol(column),
      originalName: normalize(params.worksheet[`${params.encodeCol(column)}${params.headerRowIndex + 1}`]?.v) || "",
      alias: "",
      inferredType: inferColumnType(typeSet),
      valueCount: values.length,
      emptyCount: Math.max(params.rowCount - values.length, 0),
      uniqueCount: uniqueValues.size,
      duplicateCount: Math.max(values.length - uniqueValues.size, 0),
      fillRate: params.rowCount > 0 ? values.length / params.rowCount : 0,
      minValue: min,
      maxValue: max,
      examples,
      textPattern: dominantPattern,
      numericPattern: values.some(value => typeof value === "number" || /^-?\d/.test(normalize(value))) ? "numeric-like" : null,
      possibleDates: strings.filter(possibleDate).length,
      possibleCpfs: strings.filter(value => /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(value)).length,
      possibleCnpjs: strings.filter(value => /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(value)).length,
      possiblePhones: strings.filter(value => /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(value)).length,
      possibleCeps: strings.filter(value => /^\d{5}-?\d{3}$/.test(value)).length,
      possibleCodes: strings.filter(value => /^[A-Z0-9_.-]{4,}$/i.test(value)).length,
      possibleIds: strings.filter(value => /^\d+$/.test(value)).length,
    });
  }

  return profiles;
}
