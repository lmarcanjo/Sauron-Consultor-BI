import type {
  ChaosProfilingOptions,
  ChaosSourceInput,
  ChaosSourceProfile,
  ChaosValueType,
  ColumnEvidence,
  DetectedBlock,
  PhysicalColumnProfile,
  PhysicalContainerInput,
  PhysicalContainerProfile,
  PhysicalRecord,
  ProbableColumnRole,
  ProfiledRow,
  QualityFinding,
  SemanticSuggestion,
} from "./ChaosDataTypes";
import { assertChaosSourceContext } from "./ChaosDataTypes";
import { classifyValue, normalizeComparableValue, safeDate, safeNumber, safeString, samplePattern, stableValue } from "./ChaosValueUtils";

// Keep this module pure: it receives a bounded sample and never writes to a source.
const HEADER_TERMS = ["id", "codigo", "cod", "nome", "descricao", "data", "valor", "total", "grupo", "empresa", "filial", "revenda", "marca", "produto", "cliente", "vendedor", "comissao", "comissão"];
const TOTAL_TERMS = ["total", "subtotal", "total geral", "saldo final"];
const FOOTER_TERMS = ["observacao", "observação", "fonte", "elaborado", "emitido", "pagina", "página"];
const METADATA_TERMS = ["empresa", "grupo", "revenda", "marca", "filial", "competencia", "competência", "periodo", "período"];
const CODE_TERMS = ["id", "codigo", "código", "cod", "grupo", "revenda", "marca", "filial", "chave"];
const NAME_TERMS = ["nome", "empresa", "descricao", "descrição", "cliente", "produto", "vendedor", "consultor", "funcionario", "funcionário"];
const METRIC_TERMS = ["valor", "venda", "receita", "custo", "lucro", "margem", "total", "quantidade", "qtd", "comissao", "comissão", "salario", "salário", "objetivo", "meta", "ticket"];
const DATE_TERMS = ["data", "dia", "mes", "mês", "ano", "periodo", "período", "competencia", "competência"];

function abortIfRequested(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error("Profiling cancelado pelo consultor.");
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function textIncludes(value: unknown, terms: string[]): boolean {
  const normalized = normalizeComparableValue(value);
  return terms.some(term => normalized.includes(normalizeComparableValue(term)));
}

function emptyValue(value: unknown): boolean {
  return classifyValue(value) === "empty";
}

function numericValue(value: unknown): number | null {
  return safeNumber(value);
}

function hashText(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function columnNames(container: PhysicalContainerInput): string[] {
  const names = [...(container.columns || [])];
  container.records.forEach(record => Object.keys(record.values).forEach(name => names.push(name)));
  return unique(names);
}

function columnValues(records: PhysicalRecord[], column: string): unknown[] {
  return records.map(record => record.values[column]);
}

function typePercentages(values: unknown[]): { percentages: Partial<Record<ChaosValueType, number>>; observed: ChaosValueType[] } {
  const counts = new Map<ChaosValueType, number>();
  values.forEach(value => {
    const type = classifyValue(value);
    counts.set(type, (counts.get(type) || 0) + 1);
  });
  const denominator = Math.max(values.length, 1);
  const percentages: Partial<Record<ChaosValueType, number>> = {};
  counts.forEach((count, type) => { percentages[type] = count / denominator; });
  return { percentages, observed: Array.from(counts.keys()) };
}

function minMax(values: unknown[]): { min: string | number | null; max: string | number | null } {
  const numeric = values.map(numericValue).filter((value): value is number => value !== null);
  if (numeric.length === values.length && numeric.length > 0) {
    return { min: Math.min(...numeric), max: Math.max(...numeric) };
  }
  const strings = values.map(safeString).filter(Boolean).sort((a, b) => a.localeCompare(b));
  return { min: strings[0] || null, max: strings[strings.length - 1] || null };
}

function probableRoles(name: string, values: unknown[], percentages: Partial<Record<ChaosValueType, number>>, uniqueCount: number): {
  roles: ProbableColumnRole[];
  evidence: ColumnEvidence[];
} {
  const normalized = normalizeComparableValue(name);
  const roles: ProbableColumnRole[] = [];
  const evidence: ColumnEvidence[] = [];
  const add = (role: ProbableColumnRole, signal: string, detail: string) => {
    if (!roles.includes(role)) roles.push(role);
    evidence.push({ signal, detail });
  };
  if (CODE_TERMS.some(term => normalized.includes(normalizeComparableValue(term)))) {
    add("code", "nome da coluna", `O nome físico contém um termo de código: ${name}.`);
  }
  if (NAME_TERMS.some(term => normalized.includes(normalizeComparableValue(term)))) {
    add("name", "nome da coluna", `O nome físico sugere identificação textual: ${name}.`);
  }
  if (METRIC_TERMS.some(term => normalized.includes(normalizeComparableValue(term)))) {
    add("metric", "nome da coluna", `O nome físico sugere uma medida, sem confirmar seu significado: ${name}.`);
  }
  if (DATE_TERMS.some(term => normalized.includes(normalizeComparableValue(term))) || (percentages.date || 0) >= 0.7) {
    add("date", "padrão temporal", "A coluna possui nome ou valores compatíveis com datas.");
  }
  if ((percentages.boolean || 0) >= 0.7) add("boolean", "tipo observado", "A maior parte dos valores é booleana.");
  if (uniqueCount > 0 && values.length > 0 && uniqueCount / values.length >= 0.98) {
    add("identifier", "cardinalidade", "Quase todos os valores da amostra são distintos; isso pode indicar identificador.");
  }
  if (roles.length === 0 && (percentages.text || 0) >= 0.5) add("dimension", "tipo observado", "Valores textuais podem representar uma dimensão, sem confirmação semântica.");
  return { roles, evidence };
}

function profileColumn(container: PhysicalContainerInput, records: PhysicalRecord[], name: string, position: number, options: Required<Pick<ChaosProfilingOptions, "maxDistinctValues" | "maxExamples">>): PhysicalColumnProfile {
  const values = columnValues(records, name);
  const nonEmpty = values.filter(value => !emptyValue(value));
  const { percentages, observed } = typePercentages(values);
  const comparable = nonEmpty.map(stableValue);
  const counts = new Map<string, number>();
  comparable.forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
  const distinctValues = Array.from(counts.keys()).slice(0, options.maxDistinctValues);
  const mostFrequentValues = Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, options.maxDistinctValues)
    .map(([value, count]) => ({ value, count }));
  const strings = nonEmpty.map(safeString);
  const lengths = strings.map(value => value.length);
  const patterns = Array.from(new Set(strings.map(samplePattern))).slice(0, 10);
  const { min, max } = minMax(nonEmpty);
  const { roles, evidence } = probableRoles(name, nonEmpty, percentages, counts.size);
  const nativeNumeric = nonEmpty.filter(value => typeof value === "number").length;
  const numericLikeStrings = nonEmpty.filter(value => typeof value === "string" && numericValue(value) !== null).length;
  const dateLikeStrings = nonEmpty.filter(value => typeof value === "string" && safeDate(value) !== null).length;
  if (numericLikeStrings > 0 && nativeNumeric === 0) evidence.push({ signal: "tipo recebido", detail: "Valores numéricos foram recebidos como texto; a origem não foi convertida." });
  if (dateLikeStrings > 0 && (percentages.date || 0) >= 0.5) evidence.push({ signal: "tipo recebido", detail: "Valores compatíveis com data foram recebidos como texto; a origem não foi convertida." });

  const confidence = Math.min(1, 0.35 + Math.min(evidence.length, 4) * 0.12 + ((percentages.text || 0) + (percentages.number || 0) + (percentages.date || 0)) * 0.25);
  return {
    physicalName: name,
    containerId: container.id,
    containerName: container.name,
    position,
    observedTypes: observed,
    typePercentages: percentages,
    numericPercentage: percentages.number || 0,
    textPercentage: percentages.text || 0,
    datePercentage: percentages.date || 0,
    booleanPercentage: percentages.boolean || 0,
    emptyPercentage: percentages.empty || 0,
    cardinality: counts.size,
    distinctValues,
    mostFrequentValues,
    examples: nonEmpty.slice(0, options.maxExamples),
    averageLength: lengths.length > 0 ? lengths.reduce((sum, length) => sum + length, 0) / lengths.length : 0,
    minValue: min,
    maxValue: max,
    patterns,
    repeatedValueCount: Math.max(nonEmpty.length - counts.size, 0),
    mixedTypes: observed.filter(type => type !== "empty").length > 1,
    probableIdentifier: roles.includes("identifier"),
    probableCode: roles.includes("code"),
    probableName: roles.includes("name"),
    probableDimension: roles.includes("dimension") || roles.includes("name") || roles.includes("code"),
    probableMetric: roles.includes("metric"),
    probableDate: roles.includes("date"),
    probableRoles: roles,
    confidence,
    evidence,
  };
}

function rowText(record: PhysicalRecord): string[] {
  return Object.values(record.values).filter(value => !emptyValue(value)).map(safeString);
}

function hasFormula(record: PhysicalRecord): boolean {
  return Object.keys(record.formulas || {}).length > 0 || Object.values(record.values).some(value => typeof value === "string" && value.trim().startsWith("="));
}

function rowKind(record: PhysicalRecord, position: number, columnCount: number): ProfiledRow {
  const values = Object.values(record.values);
  const nonEmptyValues = values.filter(value => !emptyValue(value));
  const density = columnCount > 0 ? nonEmptyValues.length / columnCount : 0;
  const texts = nonEmptyValues.filter(value => classifyValue(value) === "text");
  const text = normalizeComparableValue(texts.join(" "));
  const evidence: string[] = [];
  if (nonEmptyValues.length === 0) return { containerId: "", rowIndex: record.rowIndex, classification: "EMPTY", density: 0, nonEmptyCount: 0, evidence: ["Nenhuma célula preenchida."] };
  if (hasFormula(record)) return { containerId: "", rowIndex: record.rowIndex, classification: "FORMULA_ROW", density, nonEmptyCount: nonEmptyValues.length, evidence: ["A linha contém fórmulas ou valores de fórmula."] };
  if (TOTAL_TERMS.some(term => text.includes(normalizeComparableValue(term)))) return { containerId: "", rowIndex: record.rowIndex, classification: "TOTAL", density, nonEmptyCount: nonEmptyValues.length, evidence: ["A linha contém termo de totalização."] };
  if (FOOTER_TERMS.some(term => text.includes(normalizeComparableValue(term))) && density < 0.6) return { containerId: "", rowIndex: record.rowIndex, classification: "FOOTER", density, nonEmptyCount: nonEmptyValues.length, evidence: ["A linha contém termo típico de rodapé."] };
  const headerHits = HEADER_TERMS.filter(term => text.includes(normalizeComparableValue(term))).length;
  if (headerHits >= 2 && texts.length >= Math.max(2, Math.ceil(nonEmptyValues.length * 0.5))) return { containerId: "", rowIndex: record.rowIndex, classification: position < 2 ? "HEADER" : "SUBHEADER", density, nonEmptyCount: nonEmptyValues.length, evidence: [`${headerHits} termos compatíveis com cabeçalho.`] };
  if (METADATA_TERMS.some(term => text.includes(normalizeComparableValue(term))) && nonEmptyValues.length <= 3 && position < 5) return { containerId: "", rowIndex: record.rowIndex, classification: "METADATA_ROW", density, nonEmptyCount: nonEmptyValues.length, evidence: ["A linha parece transportar contexto da fonte."] };
  if (position <= 2 && texts.length > 0 && nonEmptyValues.length <= 2 && density < 0.5) return { containerId: "", rowIndex: record.rowIndex, classification: "TITLE", density, nonEmptyCount: nonEmptyValues.length, evidence: ["Poucas células textuais no início do contêiner."] };
  if (density < 0.1) return { containerId: "", rowIndex: record.rowIndex, classification: "SEPARATOR", density, nonEmptyCount: nonEmptyValues.length, evidence: ["Densidade muito baixa de valores."] };
  if (density >= 0.25) return { containerId: "", rowIndex: record.rowIndex, classification: "DATA", density, nonEmptyCount: nonEmptyValues.length, evidence: ["Densidade compatível com registro de dados."] };
  evidence.push("A estrutura da linha não foi suficiente para uma classificação segura.");
  return { containerId: "", rowIndex: record.rowIndex, classification: "UNKNOWN", density, nonEmptyCount: nonEmptyValues.length, evidence };
}

function classifyRows(container: PhysicalContainerInput, records: PhysicalRecord[]): ProfiledRow[] {
  const columns = columnNames(container);
  return records.map((record, index) => ({ ...rowKind(record, index, columns.length), containerId: container.id }));
}

function blockFromRows(sourceId: string, container: PhysicalContainerInput, records: PhysicalRecord[], rows: ProfiledRow[], start: number, end: number, index: number): DetectedBlock | null {
  const segment = rows.slice(start, end + 1);
  const meaningful = segment.filter(row => row.classification !== "EMPTY" && row.classification !== "SEPARATOR");
  if (meaningful.length === 0) return null;
  const headerRows = meaningful.filter(row => row.classification === "HEADER" || row.classification === "SUBHEADER").map(row => row.rowIndex);
  const dataRows = meaningful.filter(row => row.classification === "DATA" || row.classification === "FORMULA_ROW").map(row => row.rowIndex);
  const title = meaningful.find(row => row.classification === "TITLE");
  const titleRecord = title ? records.find(record => record.rowIndex === title.rowIndex) : undefined;
  const titleSuggestion = titleRecord ? rowText(titleRecord).slice(0, 2).join(" - ") || null : null;
  const proposedColumns = columnNames(container);
  const confidence = Math.min(1, (dataRows.length > 0 ? 0.6 : 0.25) + (headerRows.length > 0 ? 0.25 : 0) + (title ? 0.1 : 0));
  return {
    blockId: `${sourceId}:${container.id}:block:${index}`,
    sourceId,
    containerId: container.id,
    startRow: meaningful[0].rowIndex,
    endRow: meaningful[meaningful.length - 1].rowIndex,
    titleSuggestion,
    headerRows,
    dataRows,
    proposedColumns,
    metadataContext: Object.fromEntries(meaningful.filter(row => row.classification === "METADATA_ROW").map(row => {
      const record = records.find(item => item.rowIndex === row.rowIndex);
      return record ? [row.rowIndex, { ...record.values }] : [row.rowIndex, {}];
    })),
    confidence,
    evidence: [
      `${headerRows.length} linha(s) sugerida(s) como cabeçalho.`,
      `${dataRows.length} linha(s) sugerida(s) como dados.`,
      "O bloco permanece somente uma sugestão até confirmação.",
    ],
    status: "SUGGESTED",
  };
}

function detectBlocks(sourceId: string, container: PhysicalContainerInput, records: PhysicalRecord[], rows: ProfiledRow[]): DetectedBlock[] {
  const blocks: DetectedBlock[] = [];
  let start = 0;
  let blockIndex = 0;
  const close = (end: number) => {
    const block = blockFromRows(sourceId, container, records, rows, start, end, blockIndex++);
    if (block) blocks.push(block);
  };
  rows.forEach((row, index) => {
    const boundary = row.classification === "EMPTY" || row.classification === "SEPARATOR";
    const repeatedHeader = index > start && (row.classification === "HEADER" || row.classification === "SUBHEADER") && rows.slice(start, index).some(item => item.classification === "DATA");
    if (boundary || repeatedHeader) {
      close(index - 1);
      start = index + 1;
    }
  });
  if (start < rows.length) close(rows.length - 1);
  return blocks;
}

function relationSuggestions(source: ChaosSourceInput, container: PhysicalContainerInput, columns: PhysicalColumnProfile[], records: PhysicalRecord[]): SemanticSuggestion[] {
  const suggestions: SemanticSuggestion[] = [];
  columns.forEach(column => {
    if (column.probableRoles.length === 0) return;
    const suggestedRole = column.probableRoles[0];
    const label = suggestedRole === "code" ? "Código" : suggestedRole === "name" ? "Nome" : suggestedRole === "metric" ? "Medida candidata" : suggestedRole === "date" ? "Data" : suggestedRole === "identifier" ? "Identificador candidato" : "Dimensão candidata";
    const warnings = suggestedRole === "metric" ? ["O número não foi tratado como indicador; confirme o significado antes de usar em relatório."] : [];
    const possibleRelations: string[] = [];
    if (column.probableCode) {
      const nameColumn = columns.find(candidate => candidate.physicalName !== column.physicalName && candidate.probableName);
      if (nameColumn) {
        const relation = relationEvidence(column.physicalName, nameColumn.physicalName, records);
        if (relation) possibleRelations.push(relation.description);
      }
    }
    suggestions.push({
      id: `${source.sourceId}:${container.id}:suggestion:${column.physicalName}`,
      suggestedLabel: label,
      suggestedRole,
      scope: "container",
      sourceId: source.sourceId,
      containerId: container.id,
      physicalColumns: [column.physicalName],
      confidence: column.confidence,
      evidence: column.evidence.map(item => item.detail),
      sampleValues: column.examples,
      possibleRelations,
      warnings,
      status: "SUGGESTED",
    });
  });
  return suggestions;
}

function relationEvidence(codeColumn: string, nameColumn: string, records: PhysicalRecord[]): { description: string; inconsistent: boolean } | null {
  const relation = new Map<string, Set<string>>();
  records.forEach(record => {
    const code = normalizeComparableValue(record.values[codeColumn]);
    const name = safeString(record.values[nameColumn]);
    if (!code || !name) return;
    const names = relation.get(code) || new Set<string>();
    names.add(name);
    relation.set(code, names);
  });
  if (relation.size === 0) return null;
  const consistent = Array.from(relation.entries()).filter(([, names]) => names.size === 1);
  const inconsistent = Array.from(relation.entries()).filter(([, names]) => names.size > 1);
  const examples = consistent.slice(0, 3).map(([code, names]) => `${code} -> ${Array.from(names)[0]}`).join(", ");
  const conflicts = inconsistent.slice(0, 2).map(([code, names]) => `${code} -> ${Array.from(names).join(" / ")}`).join(", ");
  return {
    description: inconsistent.length > 0
      ? `Relação ${codeColumn} ↔ ${nameColumn} possui conflitos: ${conflicts}. Confirme a regra antes de aplicar.`
      : `Relação possível ${codeColumn} ↔ ${nameColumn}; exemplos consistentes: ${examples}. Confirme antes de aplicar.`,
    inconsistent: inconsistent.length > 0,
  };
}

function qualityFindings(source: ChaosSourceInput, container: PhysicalContainerInput, records: PhysicalRecord[], columns: PhysicalColumnProfile[], rows: ProfiledRow[]): QualityFinding[] {
  const findings: QualityFinding[] = [];
  const add = (code: QualityFinding["code"], severity: QualityFinding["severity"], message: string, evidence: string[], columnNames?: string[], rowIndexes?: number[]) => findings.push({
    id: `${source.sourceId}:${container.id}:${code}:${findings.length}`,
    code,
    severity,
    message,
    sourceId: source.sourceId,
    containerId: container.id,
    columnNames,
    rowIndexes,
    evidence,
  });
  const emptyRows = rows.filter(row => row.classification === "EMPTY").map(row => row.rowIndex);
  if (emptyRows.length > 0) add("EMPTY_ROWS", "low", "Há linhas vazias no contêiner; elas foram preservadas.", [`${emptyRows.length} linha(s) vazia(s) na amostra.`], undefined, emptyRows.slice(0, 20));
  const rowSignatures = new Map<string, number[]>();
  records.forEach(record => {
    const signature = JSON.stringify(Object.keys(record.values).sort().map(key => [key, stableValue(record.values[key])]));
    rowSignatures.set(signature, [...(rowSignatures.get(signature) || []), record.rowIndex]);
  });
  const duplicatedRows = Array.from(rowSignatures.values()).filter(indexes => indexes.length > 1);
  if (duplicatedRows.length > 0) add("DUPLICATE_ROWS", "medium", "Há registros idênticos na amostra; confirme se são duplicidades ou repetições legítimas.", [`${duplicatedRows.length} conjunto(s) repetido(s).`], undefined, duplicatedRows.flat().slice(0, 20));
  columns.forEach(column => {
    const values = columnValues(records, column.physicalName);
    const nonEmpty = values.filter(value => !emptyValue(value));
    if (values.length > 0 && column.emptyPercentage >= 0.9) add("NEAR_EMPTY_COLUMN", "low", `A coluna ${column.physicalName} está quase vazia; ela não foi removida.`, [`Preenchimento de ${Math.round((1 - column.emptyPercentage) * 100)}%.`], [column.physicalName]);
    if (column.mixedTypes) add("MIXED_TYPES", "medium", `A coluna ${column.physicalName} mistura tipos de valor. A origem foi preservada.`, [`Tipos observados: ${column.observedTypes.join(", ")}.`], [column.physicalName]);
    const numericStrings = nonEmpty.filter(value => typeof value === "string" && numericValue(value) !== null).length;
    if (numericStrings > 0 && numericStrings / Math.max(nonEmpty.length, 1) >= 0.7) add("NUMERIC_AS_TEXT", "low", `A coluna ${column.physicalName} contém números recebidos como texto.`, ["A conversão só poderá ocorrer em uma view derivada confirmada."], [column.physicalName]);
    const dateStrings = nonEmpty.filter(value => typeof value === "string" && safeDate(value) !== null).length;
    if (dateStrings > 0 && dateStrings / Math.max(nonEmpty.length, 1) >= 0.7) add("DATE_AS_TEXT", "low", `A coluna ${column.physicalName} contém datas recebidas como texto.`, ["O valor físico não foi regravado."], [column.physicalName]);
    const formulaErrors = nonEmpty.filter(value => /^#(?:REF|DIV\/0|VALUE|N\/A|NAME|NUM|NULL)!?/i.test(safeString(value))).length;
    if (formulaErrors > 0) add("FORMULA_ERROR", "high", `A coluna ${column.physicalName} contém valores de erro de fórmula.`, [`${formulaErrors} valor(es) de erro na amostra.`], [column.physicalName]);
    if (column.probableIdentifier) {
      const duplicates = values.map(value => normalizeComparableValue(value)).filter(Boolean).length - column.cardinality;
      if (duplicates > 0) add("DUPLICATE_IDENTIFIER", "medium", `O possível identificador ${column.physicalName} se repete.`, [`${duplicates} repetição(ões) na amostra.`], [column.physicalName]);
    }
    const numeric = nonEmpty.map(numericValue).filter((value): value is number => value !== null);
    if (numeric.length >= 5) {
      const mean = numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
      const variance = numeric.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / numeric.length;
      const deviation = Math.sqrt(variance);
      if (deviation > 0 && numeric.some(value => Math.abs(value - mean) > deviation * 4)) add("EXTREME_VALUES", "medium", `A coluna ${column.physicalName} possui valores muito afastados do padrão da amostra.`, [`Média aproximada ${mean}; desvio padrão aproximado ${deviation}.`], [column.physicalName]);
    }
  });
  const codeColumns = columns.filter(column => column.probableCode);
  const nameColumns = columns.filter(column => column.probableName);
  codeColumns.forEach(codeColumn => nameColumns.forEach(nameColumn => {
    if (codeColumn.physicalName === nameColumn.physicalName) return;
    const relation = relationEvidence(codeColumn.physicalName, nameColumn.physicalName, records);
    if (relation?.inconsistent) {
      add("INCONSISTENT_RELATION", "medium", `A relação candidata entre ${codeColumn.physicalName} e ${nameColumn.physicalName} não é estável.`, [relation.description], [codeColumn.physicalName, nameColumn.physicalName]);
    }
  }));
  const dominantKeys = new Set(columns.map(column => column.physicalName));
  const shifted = records.filter(record => Object.keys(record.values).some(key => !dominantKeys.has(key)) || Object.keys(record.values).length !== dominantKeys.size);
  if (shifted.length > 0) add("STRUCTURAL_SHIFT", "medium", "Algumas linhas possuem estrutura diferente da maioria; revise possíveis células deslocadas.", [`${shifted.length} linha(s) com estrutura diferente na amostra.`], undefined, shifted.map(record => record.rowIndex).slice(0, 20));
  const headerInData = rows.filter(row => (row.classification === "HEADER" || row.classification === "SUBHEADER") && row.rowIndex > (rows[0]?.rowIndex ?? 0)).map(row => row.rowIndex);
  if (headerInData.length > 0) add("HEADER_IN_DATA", "medium", "Há cabeçalhos repetidos dentro do conjunto de linhas; nada foi removido.", ["Revise o bloco antes de confirmar uma DatasetView."], undefined, headerInData.slice(0, 20));
  return findings;
}

function duplicateContainerFindings(source: ChaosSourceInput, containers: PhysicalContainerProfile[]): QualityFinding[] {
  const findings: QualityFinding[] = [];
  for (let left = 0; left < containers.length; left++) {
    for (let right = left + 1; right < containers.length; right++) {
      const a = containers[left];
      const b = containers[right];
      if (a.columns.length === b.columns.length && a.columns.every(column => b.columns.includes(column)) && a.sampledRecords > 0 && a.sampledRecords === b.sampledRecords) {
        findings.push({
          id: `${source.sourceId}:DUPLICATE_CONTAINER:${left}:${right}`,
          code: "DUPLICATE_CONTAINER",
          severity: "medium",
          message: `Os contêineres ${a.name} e ${b.name} possuem estrutura semelhante; confirme se são cópias ou fontes distintas.`,
          sourceId: source.sourceId,
          columnNames: a.columns,
          evidence: ["Nomes físicos e quantidade de registros amostrados coincidem."],
        });
      }
    }
  }
  return findings;
}

function profileContainer(source: ChaosSourceInput, container: PhysicalContainerInput, options: Required<Pick<ChaosProfilingOptions, "maxRowsPerContainer" | "maxDistinctValues" | "maxExamples">>): { profile: PhysicalContainerProfile; columns: PhysicalColumnProfile[]; suggestions: SemanticSuggestion[]; findings: QualityFinding[] } {
  const records = container.records.slice(0, options.maxRowsPerContainer);
  const names = columnNames({ ...container, records });
  const columns = names.map((name, index) => profileColumn(container, records, name, index, options));
  const rows = classifyRows({ ...container, records, columns: names }, records);
  const blocks = detectBlocks(source.sourceId, container, records, rows);
  const profile: PhysicalContainerProfile = {
    id: container.id,
    name: container.name,
    type: container.type,
    rowCount: container.rowCount ?? null,
    sampledRecords: records.length,
    columns: names,
    rows,
    blocks,
    metadata: container.metadata ? { ...container.metadata } : undefined,
  };
  return {
    profile,
    columns,
    suggestions: relationSuggestions(source, container, columns, records),
    findings: qualityFindings(source, container, records, columns, rows),
  };
}

export function buildStructuralFingerprint(source: Pick<ChaosSourceInput, "sourceName" | "physicalContainers">): string {
  const structural = source.physicalContainers.map(container => ({
    name: normalizeComparableValue(container.name),
    type: container.type,
    columns: columnNames(container).map(normalizeComparableValue),
    rowCount: container.rowCount ?? container.records.length,
    sample: container.records.slice(0, 3).map(record => Object.keys(record.values).sort().map(key => [key, stableValue(record.values[key])])),
  }));
  return hashText(JSON.stringify({ name: normalizeComparableValue(source.sourceName), structural }));
}

export function profileChaosSource(input: ChaosSourceInput, options: ChaosProfilingOptions = {}): ChaosSourceProfile {
  assertChaosSourceContext(input);
  abortIfRequested(options.signal);
  const limits = {
    maxRowsPerContainer: Math.max(1, options.maxRowsPerContainer ?? 500),
    maxDistinctValues: Math.max(1, options.maxDistinctValues ?? 20),
    maxExamples: Math.max(1, options.maxExamples ?? 5),
  };
  const now = options.now || new Date().toISOString();
  const containers: PhysicalContainerProfile[] = [];
  const physicalColumns: PhysicalColumnProfile[] = [];
  const detectedBlocks: DetectedBlock[] = [];
  const suggestions: SemanticSuggestion[] = [];
  const findings: QualityFinding[] = [];
  let sampledRecords = 0;
  input.physicalContainers.forEach((container, containerIndex) => {
    abortIfRequested(options.signal);
    const result = profileContainer(input, container, limits);
    containers.push(result.profile);
    physicalColumns.push(...result.columns);
    detectedBlocks.push(...result.profile.blocks);
    suggestions.push(...result.suggestions);
    findings.push(...result.findings);
    sampledRecords += result.profile.sampledRecords;
    options.onProgress?.({
      phase: "profiling",
      completed: containerIndex + 1,
      total: input.physicalContainers.length,
      message: `Estrutura analisada: ${container.name}`,
    });
  });
  findings.push(...duplicateContainerFindings(input, containers));
  const rawZone: ChaosSourceProfile["rawZone"] = {
    sourceId: input.sourceId,
    sourceHash: input.sourceHash,
    sourceName: input.sourceName,
    immutable: true,
    physicalReferences: input.physicalContainers.map(container => ({
      containerId: container.id,
      containerName: container.name,
      rowIndexes: container.records.slice(0, limits.maxRowsPerContainer).map(record => record.rowIndex),
      columns: columnNames(container),
    })),
    storageMetadataKey: input.sourceIdentity?.storageMetadataKey,
    storageRowsKey: input.sourceIdentity?.storageRowsKey,
  };
  return {
    profileId: `profile_${input.sourceId}_${Date.now()}`,
    sourceId: input.sourceId,
    sourceType: input.sourceType,
    groupId: input.groupId,
    companyId: input.companyId,
    sourceName: input.sourceName,
    sourceHash: input.sourceHash,
    physicalContainers: containers,
    physicalColumns,
    sampledRecords,
    profilingStatus: input.physicalContainers.length > 0 ? "READY" : "PENDING",
    detectedBlocks,
    semanticSuggestions: suggestions,
    qualityFindings: findings,
    rawZone,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

export class ChaosDataProfiler {
  profile(input: ChaosSourceInput, options?: ChaosProfilingOptions): ChaosSourceProfile {
    return profileChaosSource(input, options);
  }
}

export const chaosDataProfiler = new ChaosDataProfiler();
