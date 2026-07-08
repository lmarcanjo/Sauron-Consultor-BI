import {
  EnterpriseKnowledgeGraph,
  KnowledgeEdgeType,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  KnowledgeNodeType,
} from "./KnowledgeGraphTypes";

export function safeGraphIdPart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 140) || "empty";
}

export function workbookNodeId(workbookId: string): string {
  return `workbook:${safeGraphIdPart(workbookId)}`;
}

export function sheetNodeId(workbookId: string, sheetName: string): string {
  return `sheet:${safeGraphIdPart(workbookId)}:${safeGraphIdPart(sheetName)}`;
}

export function columnNodeId(workbookId: string, sheetName: string, columnKey: string): string {
  return `column:${safeGraphIdPart(workbookId)}:${safeGraphIdPart(sheetName)}:${safeGraphIdPart(columnKey)}`;
}

export function formulaNodeId(workbookId: string, formulaId: string): string {
  return `formula:${safeGraphIdPart(workbookId)}:${safeGraphIdPart(formulaId)}`;
}

export function namedRangeNodeId(workbookId: string, name: string): string {
  return `named-range:${safeGraphIdPart(workbookId)}:${safeGraphIdPart(name)}`;
}

export function moduleMappingNodeId(datasetId: string, projectId: string, moduleName: string): string {
  return `module-mapping:${safeGraphIdPart(datasetId)}:${safeGraphIdPart(projectId)}:${safeGraphIdPart(moduleName)}`;
}

export function semanticNodeId(workbookId: string, type: KnowledgeNodeType, key: string): string {
  return `semantic:${safeGraphIdPart(workbookId)}:${type}:${safeGraphIdPart(key)}`;
}

export class KnowledgeGraphDraft {
  private readonly nodes = new Map<string, KnowledgeGraphNode>();
  private readonly edges = new Map<string, KnowledgeGraphEdge>();
  private readonly duplicateNodeIds = new Set<string>();
  private readonly duplicateEdgeIds = new Set<string>();

  addNode(node: KnowledgeGraphNode): KnowledgeGraphNode {
    const existing = this.nodes.get(node.id);
    if (existing) {
      this.duplicateNodeIds.add(node.id);
      existing.evidence = Array.from(new Set([...existing.evidence, ...node.evidence]));
      existing.properties = { ...existing.properties, ...node.properties };
      existing.riskLevel = existing.riskLevel === "high" || node.riskLevel === "high"
        ? "high"
        : existing.riskLevel === "medium" || node.riskLevel === "medium"
          ? "medium"
          : existing.riskLevel || node.riskLevel;
      return existing;
    }

    this.nodes.set(node.id, node);
    return node;
  }

  addEdge(edge: Omit<KnowledgeGraphEdge, "id"> & { id?: string }): KnowledgeGraphEdge {
    const id = edge.id || `${edge.type}:${edge.from}->${edge.to}:${safeGraphIdPart(edge.label || "")}`;
    const existing = this.edges.get(id);
    if (existing) {
      this.duplicateEdgeIds.add(id);
      existing.evidence = Array.from(new Set([...existing.evidence, ...edge.evidence]));
      existing.weight = Math.max(existing.weight || 0, edge.weight || 0) || undefined;
      return existing;
    }

    const created: KnowledgeGraphEdge = {
      id,
      type: edge.type,
      from: edge.from,
      to: edge.to,
      label: edge.label,
      weight: edge.weight,
      evidence: edge.evidence,
    };
    this.edges.set(created.id, created);
    return created;
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  build(graphId: string, diagnosticsFactory: (graph: EnterpriseKnowledgeGraph, duplicates: {
    duplicateNodeIds: string[];
    duplicateEdgeIds: string[];
  }) => EnterpriseKnowledgeGraph["diagnostics"]): EnterpriseKnowledgeGraph {
    const graph: EnterpriseKnowledgeGraph = {
      graphId,
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      diagnostics: {
        nodeCount: 0,
        edgeCount: 0,
        nodesByType: {},
        edgesByType: {},
        orphanNodeIds: [],
        riskyNodeIds: [],
        duplicateNodeIds: [],
        duplicateEdgeIds: [],
        warnings: [],
      },
      createdAt: new Date().toISOString(),
    };

    graph.diagnostics = diagnosticsFactory(graph, {
      duplicateNodeIds: Array.from(this.duplicateNodeIds),
      duplicateEdgeIds: Array.from(this.duplicateEdgeIds),
    });
    return graph;
  }
}

export function makeNode(params: {
  id: string;
  type: KnowledgeNodeType;
  label: string;
  properties?: Record<string, unknown>;
  evidence?: string[];
  riskLevel?: KnowledgeGraphNode["riskLevel"];
}): KnowledgeGraphNode {
  return {
    id: params.id,
    type: params.type,
    label: params.label,
    properties: params.properties || {},
    evidence: params.evidence || [],
    riskLevel: params.riskLevel,
  };
}

export function makeEdge(params: {
  type: KnowledgeEdgeType;
  from: string;
  to: string;
  label?: string;
  weight?: number;
  evidence?: string[];
}): Omit<KnowledgeGraphEdge, "id"> {
  return {
    type: params.type,
    from: params.from,
    to: params.to,
    label: params.label,
    weight: params.weight,
    evidence: params.evidence || [],
  };
}
