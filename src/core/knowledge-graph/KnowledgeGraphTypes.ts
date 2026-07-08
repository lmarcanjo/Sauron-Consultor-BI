import { ActiveDataset } from "../../types/dataSource";
import { ModuleFieldMapping } from "../data/moduleMapping";
import { WorkbookCatalog } from "../workbook";
import { WorkbookReverseEngineeringReport } from "../workbook-reverse";

export type KnowledgeNodeType =
  | "Workbook"
  | "Sheet"
  | "Table"
  | "Column"
  | "Formula"
  | "NamedRange"
  | "BusinessRuleCandidate"
  | "KpiCandidate"
  | "ModuleMapping"
  | "Seller"
  | "Product"
  | "Customer"
  | "Branch"
  | "Department"
  | "Revenue"
  | "Cost"
  | "Commission"
  | "DRECandidate";

export type KnowledgeEdgeType =
  | "CONTAINS"
  | "DEPENDS_ON"
  | "MAPS_TO"
  | "FEEDS_MODULE"
  | "CANDIDATE_FOR"
  | "CALCULATED_BY"
  | "BELONGS_TO"
  | "DERIVED_FROM";

export interface KnowledgeGraphNode {
  id: string;
  type: KnowledgeNodeType;
  label: string;
  properties: Record<string, unknown>;
  evidence: string[];
  riskLevel?: "low" | "medium" | "high";
}

export interface KnowledgeGraphEdge {
  id: string;
  type: KnowledgeEdgeType;
  from: string;
  to: string;
  label?: string;
  weight?: number;
  evidence: string[];
}

export interface KnowledgeGraphDiagnostics {
  nodeCount: number;
  edgeCount: number;
  nodesByType: Record<string, number>;
  edgesByType: Record<string, number>;
  orphanNodeIds: string[];
  riskyNodeIds: string[];
  duplicateNodeIds: string[];
  duplicateEdgeIds: string[];
  warnings: string[];
}

export interface EnterpriseKnowledgeGraph {
  graphId: string;
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  diagnostics: KnowledgeGraphDiagnostics;
  createdAt: string;
}

export interface BuildKnowledgeGraphInput {
  workbookCatalog: WorkbookCatalog;
  reverseReport: WorkbookReverseEngineeringReport;
  activeDataset?: ActiveDataset | null;
  moduleMappings?: ModuleFieldMapping[];
}

export interface ModuleInputExplanation {
  moduleName: string;
  mappingNodes: KnowledgeGraphNode[];
  sheets: KnowledgeGraphNode[];
  columns: KnowledgeGraphNode[];
  semanticConcepts: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

export interface NodeExplanation {
  node: KnowledgeGraphNode | null;
  incomingEdges: KnowledgeGraphEdge[];
  outgoingEdges: KnowledgeGraphEdge[];
  dependencies: KnowledgeGraphNode[];
  consumers: KnowledgeGraphNode[];
  summary: string;
  evidence: string[];
}
