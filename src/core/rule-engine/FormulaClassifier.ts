import { FormulaClassificationResult, ParsedFormula } from "./FormulaTypes";

const AGGREGATION_FUNCTIONS = new Set(["SOMA", "SUM", "SOMASE", "SUMIF", "SOMASES", "SUMIFS", "CONT.SE", "COUNTIF", "CONT.SES", "COUNTIFS", "SUBTOTAL", "AGREGAR", "AGGREGATE", "MEDIA", "MÉDIA", "AVERAGE", "MAXIMO", "MAX", "MINIMO", "MIN"]);
const LOOKUP_FUNCTIONS = new Set(["PROCV", "VLOOKUP", "PROCH", "HLOOKUP", "XLOOKUP", "ÍNDICE", "INDICE", "INDEX", "CORRESP", "MATCH", "BUSCAR", "BUSCARV"]);
const CONDITIONAL_FUNCTIONS = new Set(["SE", "IF", "SES", "IFS"]);
const ERROR_FUNCTIONS = new Set(["SEERRO", "IFERROR", "SEERROU", "ÉERROS", "EERROS", "ISERROR"]);
const TEXT_FUNCTIONS = new Set(["CONCAT", "CONCATENAR", "CONCATENATE", "TEXTO", "TEXT", "DIREITA", "RIGHT", "ESQUERDA", "LEFT", "EXT.TEXTO", "MID", "MAIUSCULA", "UPPER", "MINUSCULA", "LOWER"]);
const DATE_FUNCTIONS = new Set(["DATA", "DATE", "DIA", "DAY", "MES", "MÊS", "MONTH", "ANO", "YEAR", "HOJE", "TODAY", "AGORA", "NOW", "FIMMÊS", "FIMMES", "EOMONTH", "DATEVALUE"]);

function hasFunction(parsed: ParsedFormula, functions: Set<string>): boolean {
  const all = [parsed.mainFunction, ...parsed.internalFunctions].filter((item): item is string => Boolean(item));
  return all.some(fn => functions.has(fn));
}

export function classifyFormula(parsedFormula: ParsedFormula): FormulaClassificationResult {
  const evidence: string[] = [];

  if (hasFunction(parsedFormula, ERROR_FUNCTIONS)) {
    evidence.push("Função de tratamento de erro detectada.");
    return { classification: "errorHandling", confidence: 0.9, evidence };
  }

  if (hasFunction(parsedFormula, CONDITIONAL_FUNCTIONS)) {
    evidence.push("Função condicional detectada.");
    return { classification: "conditional", confidence: 0.88, evidence };
  }

  if (hasFunction(parsedFormula, LOOKUP_FUNCTIONS)) {
    evidence.push("Função de busca/referência cruzada detectada.");
    return { classification: "lookup", confidence: 0.9, evidence };
  }

  if (hasFunction(parsedFormula, AGGREGATION_FUNCTIONS)) {
    evidence.push("Função de agregação detectada.");
    return { classification: "aggregation", confidence: 0.9, evidence };
  }

  if (!parsedFormula.mainFunction && parsedFormula.referencedSheets.length > 0) {
    evidence.push("Referência direta entre abas detectada; tratada como consulta/referência cruzada.");
    return { classification: "lookup", confidence: 0.64, evidence };
  }

  if (hasFunction(parsedFormula, TEXT_FUNCTIONS)) {
    evidence.push("Função textual detectada.");
    return { classification: "text", confidence: 0.8, evidence };
  }

  if (hasFunction(parsedFormula, DATE_FUNCTIONS)) {
    evidence.push("Função de data detectada.");
    return { classification: "date", confidence: 0.8, evidence };
  }

  if (parsedFormula.operators.some(operator => ["+", "-", "*", "/", "^"].includes(operator))) {
    evidence.push("Operadores aritméticos detectados.");
    return { classification: "arithmetic", confidence: 0.72, evidence };
  }

  if (parsedFormula.references.length > 0) {
    evidence.push("Referências de célula, range ou named range detectadas.");
    return { classification: "reference", confidence: 0.7, evidence };
  }

  return {
    classification: "unknown",
    confidence: 0.25,
    evidence: ["Sem sinais suficientes para classificação automática."],
  };
}
