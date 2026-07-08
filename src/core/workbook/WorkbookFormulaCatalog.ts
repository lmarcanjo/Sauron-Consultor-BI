import { WorkbookFormulaCatalogItem } from "./WorkbookTypes";

const FORMULA_TYPES = [
  "SOMASES",
  "SUMIFS",
  "SOMASE",
  "SUMIF",
  "CONT.SES",
  "COUNTIFS",
  "CONT.SE",
  "COUNTIF",
  "SEERRO",
  "IFERROR",
  "SE",
  "IF",
  "PROCV",
  "VLOOKUP",
  "HLOOKUP",
  "XLOOKUP",
  "ÍNDICE",
  "INDICE",
  "INDEX",
  "CORRESP",
  "MATCH",
  "SOMA",
  "SUM",
  "DESLOC",
  "OFFSET",
  "INDIRETO",
  "INDIRECT",
  "MÉDIA",
  "MEDIA",
  "AVERAGE",
  "ARRED",
  "ROUND",
  "SUBTOTAL",
  "AGREGAR",
  "AGGREGATE",
  "CONCATENATE",
  "DATEVALUE",
  "TODAY",
  "NOW",
  "DAY",
  "MONTH",
  "YEAR",
];

function normalizeFormula(formula: string): string {
  return formula
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

export function detectFormulaType(formula: string): string {
  const normalized = normalizeFormula(formula);
  const found = FORMULA_TYPES.find(type => {
    const normalizedType = type.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const escapedType = normalizedType.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^A-Z0-9_.])${escapedType}\\s*\\(`).test(normalized);
  });
  return found || "OUTRA";
}

export function extractFormulaDependencies(formula: string): string[] {
  const dependencies = new Set<string>();
  const sheetReferenceTarget = String.raw`(?:\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?|\$?[A-Z]{1,3}:\$?[A-Z]{1,3}|\$?\d+:\$?\d+)`;
  const sheetRefs: string[] = formula.match(new RegExp(String.raw`'[^']+'!${sheetReferenceTarget}|[A-Za-zÀ-ÿ0-9_]+!${sheetReferenceTarget}`, "g")) ?? [];
  sheetRefs.forEach(ref => dependencies.add(ref));

  const ranges: string[] = formula.match(/\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?/g) ?? [];
  ranges.forEach(ref => dependencies.add(ref.replace(/\$/g, "")));

  return Array.from(dependencies);
}

export function catalogFormulas(params: {
  sheetName: string;
  worksheet: any;
  cellAddresses: string[];
}): WorkbookFormulaCatalogItem[] {
  return params.cellAddresses
    .filter(address => params.worksheet[address]?.f)
    .map(address => {
      const formula = String(params.worksheet[address].f || "");
      return {
        id: `${params.sheetName}!${address}`,
        type: detectFormulaType(formula),
        formula,
        sheetName: params.sheetName,
        range: address,
        cell: address,
        dependencies: extractFormulaDependencies(formula),
      };
    });
}
