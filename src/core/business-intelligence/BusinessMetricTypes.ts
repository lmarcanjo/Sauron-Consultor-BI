import { ActiveDataset } from "../../types/dataSource";
import { ModuleFieldMapping, ModuleName } from "../data/moduleMapping";
import { EnterpriseKnowledgeGraph } from "../knowledge-graph";
import { BusinessRule } from "../rule-engine";
import { WorkbookCatalog } from "../workbook";
import { WorkbookReverseEngineeringReport } from "../workbook-reverse";

export type BusinessMetricName =
  | "totalVendido"
  | "totalComissao"
  | "quantidadeVendedores"
  | "quantidadeClientes"
  | "quantidadeProdutos"
  | "ticketMedio"
  | "margemCandidata"
  | "receitaCandidata"
  | "custoCandidato";

export type BusinessMetricStatus = "ready" | "pending" | "insufficient_data";

export interface BusinessMetricSource {
  datasetId: string | null;
  sourceName: string | null;
  workbookId?: string | null;
  moduleName?: ModuleName | null;
  mappingId?: string | null;
  ruleIds?: string[];
}

export interface BusinessMetricLineage {
  datasetId: string | null;
  workbookId?: string | null;
  inputSheets: string[];
  inputColumns: string[];
  moduleMappings: Array<{
    moduleName: ModuleName;
    sheetName: string;
    selectedColumns: string[];
    semanticRoles: Record<string, string>;
  }>;
  knowledgeGraphNodes: string[];
  businessRules: string[];
  transformations: string[];
  rowAccess: {
    strategy: "rowProvider" | "indexedDB" | "api" | "preview" | "none";
    rowsRead: number;
    rowsSampled: number;
  };
}

export interface BusinessMetricDiagnostics {
  confidence: number;
  warnings: string[];
  errors: string[];
  missingMappings: ModuleName[];
  missingColumns: string[];
  rowsRead: number;
  calculation: string;
}

export interface BusinessMetric {
  id: string;
  name: BusinessMetricName;
  label: string;
  value: number | null;
  status: BusinessMetricStatus;
  source: BusinessMetricSource;
  sheetName: string | null;
  columnsUsed: string[];
  rowsSampled: number;
  lineage: BusinessMetricLineage;
  diagnostics: BusinessMetricDiagnostics;
}

export interface BusinessMetricExplanation {
  metric: BusinessMetric | null;
  summary: string;
  source: BusinessMetricSource | null;
  lineage: BusinessMetricLineage | null;
  diagnostics: BusinessMetricDiagnostics | null;
  evidence: string[];
}

export type BusinessMetricRowProvider = (sheetName: string, limit: number) => Promise<Record<string, any>[]>;

export interface BusinessIntelligenceContext {
  activeDataset: ActiveDataset | null;
  moduleMappings: ModuleFieldMapping[];
  workbookCatalog?: WorkbookCatalog | null;
  reverseReport?: WorkbookReverseEngineeringReport | null;
  knowledgeGraph?: EnterpriseKnowledgeGraph | null;
  rules?: BusinessRule[];
  rowProvider?: BusinessMetricRowProvider;
  maxRowsPerMetric?: number;
}

export interface MetricRowsResult {
  rows: Record<string, any>[];
  strategy: BusinessMetricLineage["rowAccess"]["strategy"];
}
