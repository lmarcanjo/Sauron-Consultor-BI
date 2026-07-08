import { EnterpriseKnowledgeGraph } from "../knowledge-graph";
import { WorkbookCatalog } from "../workbook";
import { WorkbookReverseEngineeringReport } from "../workbook-reverse";
import { FormulaClassification, ParsedFormula } from "./FormulaTypes";

export type BusinessRuleCategory =
  | "commission"
  | "goal"
  | "sales"
  | "margin"
  | "dre"
  | "registry"
  | "validation"
  | "lookup"
  | "conditional"
  | "aggregation"
  | "unknown";

export interface BusinessRuleSource {
  type: "workbook" | "reverseReport" | "knowledgeGraph";
  id: string;
  label: string;
  evidence: string[];
}

export interface BusinessRuleFormulaRef {
  id: string;
  sheetName: string;
  cell: string;
  formula: string;
  workbookFormulaType: string;
  classification: FormulaClassification;
  parsed: ParsedFormula;
}

export interface BusinessRuleIO {
  id: string;
  type: "sheet" | "column" | "formula" | "namedRange" | "module" | "concept";
  label: string;
  sourceId?: string;
  evidence: string[];
}

export interface BusinessRuleDependency {
  id: string;
  type: "formula" | "sheet" | "column" | "namedRange" | "module" | "concept";
  label: string;
  sourceId?: string;
  evidence: string[];
}

export interface BusinessRuleDiagnostics {
  riskLevel: "low" | "medium" | "high";
  warnings: string[];
  formulaCount: number;
  lookupFormulaCount: number;
  conditionalFormulaCount: number;
  aggregationFormulaCount: number;
  dynamicReferenceCount: number;
  requiresConsultantReview: boolean;
}

export interface BusinessRule {
  id: string;
  name: string;
  category: BusinessRuleCategory;
  confidence: number;
  source: BusinessRuleSource;
  formulas: BusinessRuleFormulaRef[];
  inputs: BusinessRuleIO[];
  outputs: BusinessRuleIO[];
  dependencies: BusinessRuleDependency[];
  impactedModules: string[];
  diagnostics: BusinessRuleDiagnostics;
}

export interface ExtractBusinessRulesInput {
  workbookCatalog: WorkbookCatalog;
  reverseReport: WorkbookReverseEngineeringReport;
  knowledgeGraph: EnterpriseKnowledgeGraph;
}

export interface RuleExplanation {
  rule: BusinessRule | null;
  summary: string;
  source: BusinessRuleSource | null;
  formulas: BusinessRuleFormulaRef[];
  inputs: BusinessRuleIO[];
  outputs: BusinessRuleIO[];
  dependencies: BusinessRuleDependency[];
  impactedModules: string[];
  diagnostics: BusinessRuleDiagnostics | null;
  evidence: string[];
}
