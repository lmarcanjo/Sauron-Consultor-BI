export interface AnalysisContext {
  period: { current: string; previous: string };
  client: string;
  segment: string;
  company: string;
  cnpj: string;
  store?: string;
  brand?: string;
  department?: string;
  costCenter?: string;
  account?: string;
  salesperson?: string;
  dre: DreData[];
  kpis: KpiData[];
  targets: KpiData[];
  entries: FinancialEntry[];
  filters: FilterDefinition[];
  costCenters: CostCenterData[];
  comparatives: ComparativeData[];
}

export interface ComparativeData { entityId: string; entityName: string; value: number; period: string; }

export interface CostCenterData { id: string; name: string; expenses: number; }

export interface KpiData { id: string; name: string; value: number; unit: string; target: number; }
export interface DreData { account: string; value: number; period: string; category: 'revenue' | 'expense' | 'other'; }
export interface FinancialEntry { id: string; account: string; value: number; date: string; }
export interface FilterDefinition { field: string; operator: string; value: any; }

export interface Recommendation {
  problem: string;
  evidence: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  impactExpected: string;
  responsible: string;
  deadline: string;
  origin: string;
}

export interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
  entity: string;
  evidence: string;
  impactEstimated: number;
  possibleCause: string;
  recommendation: string;
  origin: string;
}

export interface Trend {
  metric: string;
  previousValue: number;
  currentValue: number;
  variationPercent: number;
  direction: 'growth' | 'decline' | 'stable';
  severity: 'low' | 'medium' | 'high';
}

export interface BenchmarkResult {
  entityId: string;
  benchmarkValue: number;
  averageValue: number;
  difference: number;
  status: 'above' | 'below' | 'equal';
  ranking: number;
}

export interface ExecutiveSummary {
  summary: string;
}
