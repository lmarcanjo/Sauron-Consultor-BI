import { ActiveDataset } from "../../types/dataSource";
import { parseNumericValue } from "../data/activeDatasetView";
import { ModuleFieldMapping, ModuleName } from "../data/moduleMapping";
import { BusinessMetric, BusinessMetricName } from "./BusinessMetricTypes";

export interface PresentationMetricValues {
  totalRevenue: number | null;
  totalCost: number | null;
  totalExpense: number | null;
  totalCommission: number | null;
  netResult: number | null;
  sellerCount: number | null;
  averageTicket: number | null;
  grossMargin: number | null;
  targetTotal: number | null;
  totalCosts: number | null;
  targetGap: number | null;
  period: string;
  topCompany?: [string, number];
  topSeller?: [string, number];
  companyCount: number;
  status: "ready" | "pending";
  missingMetrics: BusinessMetricName[];
}

const ROLE_PATTERNS: Record<string, RegExp[]> = {
  revenue: [/receita/i, /venda/i, /fatur/i, /valor/i, /total/i],
  cost: [/custo/i, /cmv/i, /cpv/i],
  expense: [/despesa/i],
  commission: [/comiss/i],
  seller: [/vendedor/i, /consultor/i, /nome/i, /colaborador/i],
  company: [/empresa/i, /filial/i, /unidade/i, /loja/i],
  period: [/m[eê]s/i, /per[ií]odo/i, /data/i, /compet[eê]ncia/i],
  target: [/meta/i, /objetivo/i],
  category: [/raz[aã]o/i, /categoria/i, /conta/i, /centro/i],
};

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function columnFor(mappings: ModuleFieldMapping[], roles: string[]): string | null {
  for (const mapping of mappings) {
    for (const role of roles) {
      if (mapping.semanticRoles[role]) return mapping.semanticRoles[role];
    }
  }

  const columns = Array.from(new Set(mappings.flatMap(mapping => mapping.selectedColumns)));
  return columns.find(column => roles.some(role => (ROLE_PATTERNS[role] || []).some(pattern => pattern.test(column) || pattern.test(normalize(column))))) || null;
}

function groupTotals(rows: Record<string, unknown>[], labelColumn: string | null, valueColumn: string | null): Array<[string, number]> {
  if (!labelColumn || !valueColumn) return [];
  const totals = new Map<string, [string, number]>();
  rows.forEach(row => {
    const label = String(row[labelColumn] ?? "").trim();
    const value = parseNumericValue(row[valueColumn]);
    if (!label || value === null) return;
    const key = normalize(label);
    const current = totals.get(key) || [label, 0];
    current[1] += value;
    totals.set(key, current);
  });
  return Array.from(totals.values()).sort((left, right) => right[1] - left[1]);
}

function sumColumn(rows: Record<string, unknown>[], column: string | null): number | null {
  if (!column) return null;
  const values = rows
    .map(row => parseNumericValue(row[column]))
    .filter((value): value is number => value !== null);
  return values.length > 0 ? values.reduce((total, value) => total + value, 0) : null;
}

function metricColumn(metrics: BusinessMetric[], names: BusinessMetricName[]): string | null {
  for (const name of names) {
    const metric = metrics.find(item => item.name === name && item.status === "ready");
    if (metric?.columnsUsed[0]) return metric.columnsUsed[0];
  }
  return null;
}

function periodColumn(rows: Record<string, unknown>[], mappings: ModuleFieldMapping[]): string | null {
  const mapped = columnFor(mappings, ["period"]);
  if (mapped) return mapped;
  const columns = Array.from(new Set(rows.slice(0, 50).flatMap(row => Object.keys(row))));
  return columns.find(column => ROLE_PATTERNS.period.some(pattern => pattern.test(column))) || null;
}

export function getPresentationPeriods(rows: Record<string, unknown>[], mappings: ModuleFieldMapping[]): string[] {
  const column = periodColumn(rows, mappings);
  if (!column) return [];
  return Array.from(new Set(rows.map(row => String(row[column] ?? "").trim()).filter(Boolean))).sort();
}

export interface PresentationPeriodChange {
  id: string;
  label: string;
  currentValue: number | null;
  previousValue: number | null;
  changePercent: string | null;
  direction: "up" | "down" | "stable" | "no_data";
  isPositiveChange: boolean;
  lineage: string;
}

export function buildPresentationPeriodChanges(params: {
  rows: Record<string, unknown>[];
  mappings: ModuleFieldMapping[];
  metrics: BusinessMetric[];
  currentPeriod: string;
  previousPeriod: string | null;
}): PresentationPeriodChange[] {
  if (!params.previousPeriod) return [];

  const period = periodColumn(params.rows, params.mappings);
  const revenue = columnFor(params.mappings, ["revenue", "value"])
    || metricColumn(params.metrics, ["receitaCandidata", "totalVendido"]);
  const cost = columnFor(params.mappings, ["cost", "expense"])
    || metricColumn(params.metrics, ["custoCandidato", "despesaCandidata"]);
  if (!period || (!revenue && !cost)) return [];

  const currentRows = params.rows.filter(row => String(row[period] ?? "").trim() === params.currentPeriod);
  const previousRows = params.rows.filter(row => String(row[period] ?? "").trim() === params.previousPeriod);
  const change = (currentValue: number | null, previousValue: number | null) => {
    if (currentValue === null || previousValue === null) {
      return { pct: null, direction: "no_data" as const };
    }
    if (previousValue === 0) return { pct: null, direction: "stable" as const };
    const diff = ((currentValue - previousValue) / previousValue) * 100;
    if (Math.abs(diff) < 0.1) return { pct: "0.0%", direction: "stable" as const };
    return {
      pct: `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`,
      direction: diff > 0 ? "up" as const : "down" as const,
    };
  };
  const lineage = (metricName: BusinessMetricName, label: string) => {
    const metric = params.metrics.find(item => item.name === metricName);
    return metric ? `Aba: ${metric.sheetName || "N/A"} | Col: ${metric.columnsUsed.join(", ") || "N/A"}` : label;
  };
  const changes: PresentationPeriodChange[] = [];

  if (revenue) {
    const currentValue = sumColumn(currentRows, revenue);
    const previousValue = sumColumn(previousRows, revenue);
    const result = change(currentValue, previousValue);
    changes.push({
      id: "change_receita",
      label: "Receita Operacional",
      currentValue,
      previousValue,
      changePercent: result.pct,
      direction: result.direction,
      isPositiveChange: result.direction === "up",
      lineage: lineage("receitaCandidata", "Mapeamento de receita pendente"),
    });
  }

  if (cost) {
    const currentValue = sumColumn(currentRows, cost);
    const previousValue = sumColumn(previousRows, cost);
    const result = change(currentValue, previousValue);
    changes.push({
      id: "change_custo",
      label: "Custos Totais",
      currentValue,
      previousValue,
      changePercent: result.pct,
      direction: result.direction,
      isPositiveChange: result.direction === "down",
      lineage: lineage("custoCandidato", "Mapeamento de custo pendente"),
    });
  }

  return changes;
}

function metricValue(metrics: BusinessMetric[], name: BusinessMetricName): number | null {
  const metric = metrics.find(item => item.name === name);
  return metric?.status === "ready" && metric.value !== null ? metric.value : null;
}

export function inferPresentationMappings(activeDataset: ActiveDataset, rows: Record<string, unknown>[]): ModuleFieldMapping[] {
  const columns = Array.from(new Set([
    ...activeDataset.columnProfiles.map(profile => profile.name),
    ...rows.slice(0, 50).flatMap(row => Object.keys(row)),
  ]));
  const sheetName = activeDataset.activeSheet || (typeof activeDataset.sheets[0] === "string" ? activeDataset.sheets[0] : activeDataset.sheets[0]?.sheetName) || "ActiveDataset";
  const makeMapping = (moduleName: ModuleName, roles: string[]): ModuleFieldMapping => ({
    projectId: "__derived_presentation__",
    datasetId: activeDataset.datasetId,
    moduleName,
    sheetName,
    selectedColumns: columns,
    semanticRoles: Object.fromEntries(roles.map(role => [role, columnFor([{ moduleName, selectedColumns: columns, semanticRoles: {}, projectId: "", datasetId: "", sheetName: "", updatedAt: "" }], [role])]).filter((entry): entry is [string, string] => Boolean(entry[1]))),
    updatedAt: activeDataset.importedAt,
  });

  return [
    makeMapping("Comercial", ["value", "revenue", "seller", "company", "date", "target"]),
    makeMapping("Financeiro", ["value", "revenue", "cost", "expense", "commission", "target"]),
    makeMapping("DRE", ["revenue", "cost", "expense", "date"]),
    makeMapping("Pessoas", ["name", "seller"]),
    makeMapping("Comissão", ["seller", "amount", "commission"]),
  ];
}

export function buildPresentationMetricValues(metrics: BusinessMetric[], rows: Record<string, unknown>[], mappings: ModuleFieldMapping[]): PresentationMetricValues {
  const required: BusinessMetricName[] = ["receitaCandidata", "custoCandidato", "despesaCandidata", "resultadoLiquido", "totalComissao", "quantidadeVendedores", "ticketMedio"];
  const missingMetrics = required.filter(name => metricValue(metrics, name) === null);
  const revenueColumn = columnFor(mappings, ["revenue", "value"]);
  const sellerColumn = columnFor(mappings, ["seller"]);
  const companyColumn = columnFor(mappings, ["company"]);
  const periodColumn = columnFor(mappings, ["period"]);
  const targetColumn = columnFor(mappings, ["target"]);
  const sellerTotals = groupTotals(rows, sellerColumn, revenueColumn);
  const companyTotals = groupTotals(rows, companyColumn, revenueColumn);
  const periods = periodColumn
    ? Array.from(new Set(rows.map(row => String(row[periodColumn] ?? "").trim()).filter(Boolean)))
    : [];

  return {
    totalRevenue: metricValue(metrics, "receitaCandidata"),
    totalCost: metricValue(metrics, "custoCandidato"),
    totalExpense: metricValue(metrics, "despesaCandidata"),
    totalCommission: metricValue(metrics, "totalComissao"),
    netResult: metricValue(metrics, "resultadoLiquido"),
    sellerCount: metricValue(metrics, "quantidadeVendedores"),
    averageTicket: metricValue(metrics, "ticketMedio"),
    grossMargin: metricValue(metrics, "margemCandidata") !== null && metricValue(metrics, "receitaCandidata") !== null
      ? (metricValue(metrics, "margemCandidata") as number) / (metricValue(metrics, "receitaCandidata") as number) * 100
      : null,
    targetTotal: targetColumn
      ? rows.reduce((total, row) => total + (parseNumericValue(row[targetColumn]) || 0), 0)
      : null,
    totalCosts: metricValue(metrics, "custoCandidato") !== null && metricValue(metrics, "despesaCandidata") !== null
      ? (metricValue(metrics, "custoCandidato") as number) + (metricValue(metrics, "despesaCandidata") as number)
      : null,
    targetGap: targetColumn && metricValue(metrics, "receitaCandidata") !== null
      ? (() => {
        const target = rows.reduce((total, row) => total + (parseNumericValue(row[targetColumn]) || 0), 0);
        return target > 0 ? ((metricValue(metrics, "receitaCandidata") as number) - target) / target * 100 : null;
      })()
      : null,
    period: periods.length > 0 ? periods.sort().join(" a ") : "Período não identificado",
    topCompany: companyTotals[0],
    topSeller: sellerTotals[0],
    companyCount: companyTotals.length,
    status: missingMetrics.length === 0 ? "ready" : "pending",
    missingMetrics,
  };
}

export interface MeetingChartData {
  revenue: Array<{ name: string; Receita: number; Meta: number }>;
  costs: Array<{ name: string; valor: number; fill: string }>;
}

export function buildMeetingChartData(rows: Record<string, unknown>[], mappings: ModuleFieldMapping[]): MeetingChartData {
  const periodColumn = columnFor(mappings, ["period"]);
  const revenueColumn = columnFor(mappings, ["revenue", "value"]);
  const targetColumn = columnFor(mappings, ["target"]);
  const costColumn = columnFor(mappings, ["cost"]);
  const expenseColumn = columnFor(mappings, ["expense"]);
  const categoryColumn = columnFor(mappings, ["category"]);
  const byPeriod = new Map<string, { name: string; Receita: number; Meta: number }>();
  rows.forEach(row => {
    const name = String((periodColumn && row[periodColumn]) || "Sem período");
    const current = byPeriod.get(name) || { name, Receita: 0, Meta: 0 };
    current.Receita += revenueColumn ? parseNumericValue(row[revenueColumn]) || 0 : 0;
    current.Meta += targetColumn ? parseNumericValue(row[targetColumn]) || 0 : 0;
    byPeriod.set(name, current);
  });

  const colors = ["#2F80FF", "#38D39F", "#F5B942", "#E95D5D", "#8B5CF6"];
  const byCategory = new Map<string, { name: string; valor: number; fill: string }>();
  rows.forEach(row => {
    const name = String((categoryColumn && row[categoryColumn]) || "Custos e despesas");
    const current = byCategory.get(name) || { name, valor: 0, fill: colors[byCategory.size % colors.length] };
    current.valor += (costColumn ? parseNumericValue(row[costColumn]) || 0 : 0) + (expenseColumn ? parseNumericValue(row[expenseColumn]) || 0 : 0);
    byCategory.set(name, current);
  });

  return {
    revenue: Array.from(byPeriod.values()).filter(item => item.Receita > 0 || item.Meta > 0),
    costs: Array.from(byCategory.values()).filter(item => item.valor > 0).slice(0, 8),
  };
}
