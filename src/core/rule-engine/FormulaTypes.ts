export type FormulaClassification =
  | "aggregation"
  | "lookup"
  | "conditional"
  | "arithmetic"
  | "reference"
  | "errorHandling"
  | "text"
  | "date"
  | "unknown";

export type FormulaReferenceKind =
  | "cell"
  | "range"
  | "columnRange"
  | "rowRange"
  | "namedRange";

export interface FormulaReference {
  raw: string;
  sheetName: string | null;
  address: string;
  kind: FormulaReferenceKind;
}

export interface FormulaConstant {
  raw: string;
  value: string | number | boolean;
  kind: "text" | "number" | "boolean";
}

export interface ParsedFormula {
  original: string;
  normalized: string;
  mainFunction: string | null;
  internalFunctions: string[];
  references: FormulaReference[];
  constants: FormulaConstant[];
  operators: string[];
  ranges: FormulaReference[];
  referencedSheets: string[];
  tokens: string[];
  diagnostics: string[];
}

export interface FormulaClassificationResult {
  classification: FormulaClassification;
  confidence: number;
  evidence: string[];
}
