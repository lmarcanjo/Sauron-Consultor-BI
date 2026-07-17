import type { BusinessMetricName } from "./BusinessMetricTypes";
import type { ModuleName } from "../data/moduleMapping";

export type MetricKey =
  | "revenue"
  | "cost"
  | "expense"
  | "gross_margin"
  | "net_result"
  | "quantity"
  | "average_ticket"
  | "commission"
  | "headcount"
  | "seller_count"
  | "customer_count"
  | "product_count"
  | "target"
  | "achievement_rate";

export type MetricFormat = "currency" | "number" | "percentage" | "integer";
export type MetricAggregation = "sum" | "distinct_count" | "average" | "derived";

export interface MetricDefinition {
  metricKey: MetricKey;
  displayName: string;
  format: MetricFormat;
  unit: "BRL" | "count" | "ratio" | "percent";
  precision: number;
  aggregationMethod: MetricAggregation;
  semanticRoles: string[];
  applicableModules: ModuleName[];
  domainPackLabelKey: string;
  producer: string;
}

const DEFINITIONS: MetricDefinition[] = [
  { metricKey: "revenue", displayName: "Receita", format: "currency", unit: "BRL", precision: 2, aggregationMethod: "sum", semanticRoles: ["revenue", "value", "sales"], applicableModules: ["Comercial", "Financeiro", "DRE"], domainPackLabelKey: "revenue", producer: "BusinessMetricCalculator" },
  { metricKey: "cost", displayName: "Custo", format: "currency", unit: "BRL", precision: 2, aggregationMethod: "sum", semanticRoles: ["cost", "cmv", "cpv"], applicableModules: ["Financeiro", "DRE"], domainPackLabelKey: "cost", producer: "BusinessMetricCalculator" },
  { metricKey: "expense", displayName: "Despesa", format: "currency", unit: "BRL", precision: 2, aggregationMethod: "sum", semanticRoles: ["expense", "despesa"], applicableModules: ["Financeiro", "DRE"], domainPackLabelKey: "expense", producer: "BusinessMetricCalculator" },
  { metricKey: "gross_margin", displayName: "Margem bruta", format: "percentage", unit: "percent", precision: 4, aggregationMethod: "derived", semanticRoles: ["margin", "gross_margin"], applicableModules: ["Financeiro", "DRE", "Comercial"], domainPackLabelKey: "gross_margin", producer: "BusinessMetricCalculator" },
  { metricKey: "net_result", displayName: "Resultado líquido", format: "currency", unit: "BRL", precision: 2, aggregationMethod: "derived", semanticRoles: ["profit", "net_result"], applicableModules: ["Financeiro", "DRE"], domainPackLabelKey: "net_result", producer: "BusinessMetricCalculator" },
  { metricKey: "quantity", displayName: "Quantidade", format: "integer", unit: "count", precision: 0, aggregationMethod: "sum", semanticRoles: ["quantity", "volume"], applicableModules: ["Comercial", "Financeiro"], domainPackLabelKey: "quantity", producer: "BusinessMetricCalculator" },
  { metricKey: "average_ticket", displayName: "Ticket médio", format: "currency", unit: "BRL", precision: 2, aggregationMethod: "average", semanticRoles: ["average_ticket", "ticket"], applicableModules: ["Comercial"], domainPackLabelKey: "average_ticket", producer: "BusinessMetricCalculator" },
  { metricKey: "commission", displayName: "Comissão", format: "currency", unit: "BRL", precision: 2, aggregationMethod: "sum", semanticRoles: ["commission", "comissao"], applicableModules: ["Comissão", "Pessoas"], domainPackLabelKey: "commission", producer: "BusinessMetricCalculator" },
  { metricKey: "headcount", displayName: "Pessoas", format: "integer", unit: "count", precision: 0, aggregationMethod: "distinct_count", semanticRoles: ["person", "employee"], applicableModules: ["Pessoas"], domainPackLabelKey: "headcount", producer: "BusinessMetricCalculator" },
  { metricKey: "seller_count", displayName: "Vendedores", format: "integer", unit: "count", precision: 0, aggregationMethod: "distinct_count", semanticRoles: ["seller", "vendedor"], applicableModules: ["Pessoas", "Comercial", "Comissão"], domainPackLabelKey: "seller_count", producer: "BusinessMetricCalculator" },
  { metricKey: "customer_count", displayName: "Clientes", format: "integer", unit: "count", precision: 0, aggregationMethod: "distinct_count", semanticRoles: ["customer", "client"], applicableModules: ["Comercial"], domainPackLabelKey: "customer_count", producer: "BusinessMetricCalculator" },
  { metricKey: "product_count", displayName: "Produtos", format: "integer", unit: "count", precision: 0, aggregationMethod: "distinct_count", semanticRoles: ["product", "item"], applicableModules: ["Comercial"], domainPackLabelKey: "product_count", producer: "BusinessMetricCalculator" },
  { metricKey: "target", displayName: "Meta", format: "currency", unit: "BRL", precision: 2, aggregationMethod: "sum", semanticRoles: ["target", "goal", "meta"], applicableModules: ["Comercial", "Financeiro", "Pessoas"], domainPackLabelKey: "target", producer: "BusinessMetricCalculator" },
  { metricKey: "achievement_rate", displayName: "Atingimento", format: "percentage", unit: "percent", precision: 4, aggregationMethod: "derived", semanticRoles: ["achievement", "target_rate"], applicableModules: ["Comercial", "Pessoas"], domainPackLabelKey: "achievement_rate", producer: "BusinessMetricCalculator" },
];

export const METRIC_REGISTRY: Readonly<Record<MetricKey, MetricDefinition>> = Object.freeze(
  Object.fromEntries(DEFINITIONS.map(definition => [definition.metricKey, Object.freeze(definition)])) as Record<MetricKey, MetricDefinition>,
);

export const BUSINESS_METRIC_KEY_ALIASES: Readonly<Record<BusinessMetricName, MetricKey>> = Object.freeze({
  totalVendido: "revenue",
  totalComissao: "commission",
  despesaCandidata: "expense",
  resultadoLiquido: "net_result",
  quantidadeVendedores: "seller_count",
  quantidadeClientes: "customer_count",
  quantidadeProdutos: "product_count",
  ticketMedio: "average_ticket",
  margemCandidata: "gross_margin",
  receitaCandidata: "revenue",
  custoCandidato: "cost",
});

export function metricKeyFor(name: BusinessMetricName): MetricKey {
  return BUSINESS_METRIC_KEY_ALIASES[name];
}

export function getMetricDefinition(metricKey: MetricKey): MetricDefinition {
  return METRIC_REGISTRY[metricKey];
}

export function listMetricDefinitions(): MetricDefinition[] {
  return Object.values(METRIC_REGISTRY);
}
