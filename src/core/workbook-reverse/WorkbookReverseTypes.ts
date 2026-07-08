export type SheetRole =
  | "entrada"
  | "calculo"
  | "relatorio"
  | "cadastro"
  | "comissao"
  | "dre"
  | "suporte"
  | "desconhecida";

export interface SheetRoleClassification {
  sheetName: string;
  primaryRole: SheetRole;
  roles: Array<{
    role: SheetRole;
    confidence: number;
    evidence: string[];
  }>;
  formulaCount: number;
  formulaDensity: number;
  rowCount: number;
  columnCount: number;
  importantColumns: string[];
}

export interface FormulaPatternSummary {
  id: string;
  type: string;
  normalizedFormula: string;
  occurrences: number;
  sheets: string[];
  sampleCells: string[];
  sampleFormula: string;
  dependencies: string[];
  criticality: "low" | "medium" | "high";
  evidence: string[];
}

export interface FormulaPatternAnalysis {
  totalFormulas: number;
  repeatedPatterns: FormulaPatternSummary[];
  uniqueCriticalFormulas: FormulaPatternSummary[];
  formulaTypeCounts: Array<{ type: string; count: number }>;
}

export interface BusinessRuleCandidate {
  id: string;
  category:
    | "lookup"
    | "conditional"
    | "aggregation"
    | "commission"
    | "dre"
    | "validation"
    | "allocation"
    | "reference";
  title: string;
  confidence: number;
  sheetNames: string[];
  relatedColumns: string[];
  formulaTypes: string[];
  evidence: string[];
  requiresConsultantReview: boolean;
}

export interface KpiCandidate {
  id: string;
  name: string;
  category: "sales" | "margin" | "commission" | "people" | "financial" | "operational" | "dre";
  confidence: number;
  sheetNames: string[];
  relatedColumns: string[];
  evidence: string[];
}

export interface SheetDependencySummary {
  from: string;
  to: string;
  count: number;
  formulaTypes: string[];
  sampleEvidence: string[];
  importance: "low" | "medium" | "high";
}

export interface StructuralRisk {
  id: string;
  severity: "low" | "medium" | "high";
  category: "formula" | "structure" | "governance" | "performance" | "mapping";
  title: string;
  evidence: string[];
  recommendation: string;
}

export interface WorkbookReverseEngineeringReport {
  workbookId: string;
  generatedAt: string;
  sheetRoles: SheetRoleClassification[];
  formulaPatterns: FormulaPatternAnalysis;
  businessRuleCandidates: BusinessRuleCandidate[];
  kpiCandidates: KpiCandidate[];
  dependencySummary: SheetDependencySummary[];
  structuralRisks: StructuralRisk[];
  recommendations: string[];
}
