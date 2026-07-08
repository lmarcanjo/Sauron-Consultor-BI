import { FormulaConstant, FormulaReference, ParsedFormula } from "./FormulaTypes";

function normalizeFormula(value: string): string {
  return value.trim().replace(/^=/, "");
}

function normalizeFunctionName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function unique(values: string[]): string[] {
  return values.filter((value, index, all) => value && all.indexOf(value) === index);
}

function parseReference(raw: string): FormulaReference {
  const cleaned = raw.replace(/\$/g, "");
  const bang = cleaned.indexOf("!");
  const sheetName = bang >= 0
    ? cleaned.slice(0, bang).replace(/^'/, "").replace(/'$/, "")
    : null;
  const address = bang >= 0 ? cleaned.slice(bang + 1) : cleaned;

  let kind: FormulaReference["kind"] = "cell";
  if (/^[A-Z]{1,3}:[A-Z]{1,3}$/i.test(address)) kind = "columnRange";
  else if (/^\d+:\d+$/.test(address)) kind = "rowRange";
  else if (address.includes(":")) kind = "range";
  else if (!/^[A-Z]{1,3}\d+$/i.test(address)) kind = "namedRange";

  return {
    raw,
    sheetName,
    address,
    kind,
  };
}

function extractReferences(formula: string): FormulaReference[] {
  const references = new Map<string, FormulaReference>();
  const sheetTarget = String.raw`(?:\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?|\$?[A-Z]{1,3}:\$?[A-Z]{1,3}|\$?\d+:\$?\d+)`;
  const sheetReferenceRegex = new RegExp(String.raw`'[^']+'!${sheetTarget}|[A-Za-zÀ-ÿ0-9_]+!${sheetTarget}`, "g");
  const localReferenceRegex = /\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?|\$?[A-Z]{1,3}:\$?[A-Z]{1,3}|\$?\d+:\$?\d+/g;

  Array.from(formula.matchAll(sheetReferenceRegex)).forEach(match => {
    const reference = parseReference(match[0]);
    references.set(reference.raw, reference);
  });

  const withoutSheetRefs = formula.replace(sheetReferenceRegex, " ");
  Array.from(withoutSheetRefs.matchAll(localReferenceRegex)).forEach(match => {
    const reference = parseReference(match[0]);
    references.set(reference.raw, reference);
  });

  return Array.from(references.values());
}

function extractFunctions(formula: string): string[] {
  return Array.from(formula.matchAll(/([A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ0-9_.]*)\s*\(/g))
    .map(match => normalizeFunctionName(match[1]));
}

function extractConstants(formula: string, references: FormulaReference[]): FormulaConstant[] {
  const constants: FormulaConstant[] = [];
  Array.from(formula.matchAll(/"([^"]*)"/g)).forEach(match => {
    constants.push({ raw: match[0], value: match[1], kind: "text" });
  });

  const scrubbed = references.reduce((text, reference) => text.replace(reference.raw, " "), formula.replace(/"[^"]*"/g, " "));
  Array.from(scrubbed.matchAll(/(?<![A-Za-z])[-+]?\d+(?:[,.]\d+)?%?/g)).forEach(match => {
    const raw = match[0];
    const normalized = raw.replace("%", "").replace(",", ".");
    const value = Number(normalized);
    if (Number.isFinite(value)) {
      constants.push({ raw, value: raw.includes("%") ? value / 100 : value, kind: "number" });
    }
  });

  Array.from(scrubbed.matchAll(/\b(VERDADEIRO|FALSO|TRUE|FALSE)\b/gi)).forEach(match => {
    const raw = match[0];
    constants.push({
      raw,
      value: /^(VERDADEIRO|TRUE)$/i.test(raw),
      kind: "boolean",
    });
  });

  return constants;
}

function extractOperators(formula: string): string[] {
  const operators = Array.from(formula.matchAll(/<>|<=|>=|[+\-*/^&=<>:;,]/g)).map(match => match[0]);
  return unique(operators);
}

function tokenize(formula: string): string[] {
  return formula
    .replace(/([()+\-*/^&=<>:;,])/g, " $1 ")
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean);
}

export function parseFormula(formula: string): ParsedFormula {
  const original = formula;
  const normalized = normalizeFormula(formula);
  const functions = extractFunctions(normalized);
  const references = extractReferences(normalized);
  const constants = extractConstants(normalized, references);
  const operators = extractOperators(normalized);
  const ranges = references.filter(reference => reference.kind === "range" || reference.kind === "columnRange" || reference.kind === "rowRange");
  const referencedSheets = unique(references.map(reference => reference.sheetName || "").filter(Boolean));
  const diagnostics: string[] = [];

  if (!normalized) diagnostics.push("Fórmula vazia.");
  if (functions.length === 0 && operators.length === 0 && references.length === 0) {
    diagnostics.push("Nenhuma função, operador ou referência detectada.");
  }

  return {
    original,
    normalized,
    mainFunction: functions[0] || null,
    internalFunctions: unique(functions.slice(1)),
    references,
    constants,
    operators,
    ranges,
    referencedSheets,
    tokens: tokenize(normalized),
    diagnostics,
  };
}
