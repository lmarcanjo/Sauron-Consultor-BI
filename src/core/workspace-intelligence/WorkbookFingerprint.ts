import { SheetMetadata } from "../../types/dataSource";
import { WorkbookFingerprint, WorkbookFingerprintInput } from "./WorkspaceIntelligenceTypes";

const GENERIC_TOKENS = new Set([
  "aba",
  "ativo",
  "base",
  "coluna",
  "data",
  "dados",
  "id",
  "importacao",
  "linha",
  "nome",
  "planilha",
  "total",
  "valor",
]);

export function normalizeBusinessToken(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokenizeBusinessText(value: unknown): string[] {
  return normalizeBusinessToken(value)
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length > 1);
}

function uniqueSorted(tokens: string[]): string[] {
  return Array.from(new Set(tokens.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function getSheetName(sheet: string | SheetMetadata): string {
  return typeof sheet === "string" ? sheet : sheet.sheetName;
}

function getFormulaHints(sheet: string | SheetMetadata): string[] {
  if (typeof sheet === "string") return [];
  if (!sheet.formulaCount) return [];
  return ["formula", sheet.classification, String(sheet.formulaCount)];
}

function extractFormulaFunctions(formula: string): string[] {
  return Array.from(formula.matchAll(/([A-Za-z_][A-Za-z0-9_.]*)\s*\(/g))
    .map(match => match[1])
    .flatMap(tokenizeBusinessText);
}

function collectColumnNames(input: WorkbookFingerprintInput): string[] {
  const { dataset } = input;
  const profileColumns = dataset.columnProfiles.flatMap(profile => [
    profile.name,
    profile.originalName,
    profile.description,
  ]);
  const previewColumns = dataset.previewRows.flatMap(row => [
    ...Object.keys(row.raw || {}),
    ...Object.keys(row.normalized || {}),
  ]);
  return [...profileColumns, ...previewColumns].filter(Boolean) as string[];
}

export function createWorkbookFingerprint(input: WorkbookFingerprintInput): WorkbookFingerprint {
  const { dataset } = input;
  const workbookId = input.workbookId || dataset.rawStorageRef || dataset.datasetId;
  const sheetNames = uniqueSorted(dataset.sheets.map(getSheetName));
  const columnTokens = uniqueSorted(collectColumnNames(input).flatMap(tokenizeBusinessText));
  const formulaTokens = uniqueSorted([
    ...dataset.sheets.flatMap(getFormulaHints).flatMap(tokenizeBusinessText),
    ...(input.formulas || []).flatMap(extractFormulaFunctions),
  ]);
  const namedRangeTokens = uniqueSorted((input.namedRanges || []).flatMap(tokenizeBusinessText));
  const sourceTokens = tokenizeBusinessText(dataset.sourceName);
  const sheetTokens = sheetNames.flatMap(tokenizeBusinessText);

  const businessTerms = uniqueSorted([
    ...sourceTokens,
    ...sheetTokens,
    ...columnTokens,
    ...formulaTokens,
    ...namedRangeTokens,
  ]).filter(token => !GENERIC_TOKENS.has(token));

  const rowBucket = Math.ceil(dataset.rowCount / 1000);
  const columnBucket = Math.ceil(dataset.columnCount / 25);
  const structuralSignature = [
    `sheets:${sheetNames.length}`,
    `columns:${columnBucket}`,
    `rows:${rowBucket}`,
    `active:${normalizeBusinessToken(dataset.activeSheet).replace(/\s+/g, "_")}`,
  ].join("|");

  return {
    workbookId,
    sourceName: dataset.sourceName,
    sheetNames,
    columnTokens,
    formulaTokens,
    namedRangeTokens,
    structuralSignature,
    businessTerms,
    createdAt: new Date().toISOString(),
  };
}
