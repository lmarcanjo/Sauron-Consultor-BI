import { EnterpriseKnowledgeGraph, KnowledgeGraphDiagnostics } from "./KnowledgeGraphTypes";

function countBy<T extends string>(values: T[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

export function buildKnowledgeGraphDiagnostics(
  graph: EnterpriseKnowledgeGraph,
  duplicates: { duplicateNodeIds: string[]; duplicateEdgeIds: string[] } = { duplicateNodeIds: [], duplicateEdgeIds: [] },
): KnowledgeGraphDiagnostics {
  const connected = new Set<string>();
  graph.edges.forEach(edge => {
    connected.add(edge.from);
    connected.add(edge.to);
  });
  const orphanNodeIds = graph.nodes
    .filter(node => node.type !== "Workbook" && !connected.has(node.id))
    .map(node => node.id);
  const riskyNodeIds = graph.nodes
    .filter(node => node.riskLevel === "medium" || node.riskLevel === "high")
    .map(node => node.id);
  const warnings: string[] = [];

  if (graph.nodes.length > 100000) {
    warnings.push("Grafo grande: consumidores de UI devem consultar por páginas/queries, não renderizar todos os nós.");
  }
  if (orphanNodeIds.length > 0) {
    warnings.push(`${orphanNodeIds.length} nó(s) sem arestas foram detectados.`);
  }
  if (riskyNodeIds.length > 0) {
    warnings.push(`${riskyNodeIds.length} nó(s) com risco estrutural médio/alto.`);
  }
  if (duplicates.duplicateNodeIds.length > 0 || duplicates.duplicateEdgeIds.length > 0) {
    warnings.push("Duplicidades foram mescladas durante a construção do grafo.");
  }

  return {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    nodesByType: countBy(graph.nodes.map(node => node.type)),
    edgesByType: countBy(graph.edges.map(edge => edge.type)),
    orphanNodeIds,
    riskyNodeIds,
    duplicateNodeIds: duplicates.duplicateNodeIds,
    duplicateEdgeIds: duplicates.duplicateEdgeIds,
    warnings,
  };
}
