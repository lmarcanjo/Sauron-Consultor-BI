export interface AnalysisContext {
  kpis: KpiData[];
  dre: DreData[];
  costCenters: CostCenterData[];
  indicators: IndicatorData[];
  comparatives: ComparativeData[];
}

export interface KpiData { id: string; name: string; value: number; unit: string; }
export interface DreData { account: string; value: number; period: string; }
export interface CostCenterData { id: string; name: string; expenses: number; }
export interface IndicatorData { id: string; name: string; value: number; }
export interface ComparativeData { entityId: string; entityName: string; value: number; period: string; }

export interface Recommendation {
  problem: string;
  opportunity: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
  impactExpected: string;
  justification: string;
}

export interface Anomaly {
  description: string;
  severity: 'low' | 'medium' | 'high';
  impact: string;
  evidence: string;
  possibleCause: string;
}

export interface Trend {
  entityId: string;
  metric: string;
  period: 'monthly' | 'quarterly' | 'annual';
  direction: 'growth' | 'decline' | 'stable';
  value: number;
}

export interface BenchmarkResult {
  entityId: string;
  benchmarkValue: number;
  averageValue: number;
  difference: number;
  status: 'above' | 'below' | 'equal';
}

export interface ExecutiveSummary {
  summary: string;
}
