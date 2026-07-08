import {
  EnterpriseKnowledgeGraph,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  KnowledgeNodeType,
  ModuleInputExplanation,
  NodeExplanation,
} from "./KnowledgeGraphTypes";

function nodeMap(graph: EnterpriseKnowledgeGraph): Map<string, KnowledgeGraphNode> {
  return new Map(graph.nodes.map(node => [node.id, node]));
}

function moduleNameOf(node: KnowledgeGraphNode): string {
  return String(node.properties.moduleName || node.label.replace(/^Mapeamento\s+/, "").replace(/^Módulo\s+/, "").replace(/\s+\(inferido\)$/, ""));
}

function connectedNodes(edges: KnowledgeGraphEdge[], nodes: Map<string, KnowledgeGraphNode>, direction: "from" | "to"): KnowledgeGraphNode[] {
  const ids = new Set(edges.map(edge => direction === "from" ? edge.from : edge.to));
  return Array.from(ids)
    .map(id => nodes.get(id))
    .filter((node): node is KnowledgeGraphNode => Boolean(node));
}

export function findNodesByType(graph: EnterpriseKnowledgeGraph, type: KnowledgeNodeType): KnowledgeGraphNode[] {
  return graph.nodes.filter(node => node.type === type);
}

export function findDependencies(graph: EnterpriseKnowledgeGraph, nodeId: string): KnowledgeGraphNode[] {
  const nodes = nodeMap(graph);
  const dependencyEdges = graph.edges.filter(edge => (
    edge.from === nodeId &&
    ["DEPENDS_ON", "DERIVED_FROM", "MAPS_TO", "CALCULATED_BY"].includes(edge.type)
  ));
  return connectedNodes(dependencyEdges, nodes, "to");
}

export function findConsumers(graph: EnterpriseKnowledgeGraph, nodeId: string): KnowledgeGraphNode[] {
  const nodes = nodeMap(graph);
  const consumerEdges = graph.edges.filter(edge => (
    edge.to === nodeId &&
    ["DEPENDS_ON", "DERIVED_FROM", "MAPS_TO", "FEEDS_MODULE", "CANDIDATE_FOR", "CALCULATED_BY"].includes(edge.type)
  ));
  return connectedNodes(consumerEdges, nodes, "from");
}

export function findModuleInputs(graph: EnterpriseKnowledgeGraph, moduleName: string): ModuleInputExplanation {
  const normalized = moduleName.trim().toLowerCase();
  const nodes = nodeMap(graph);
  const mappingNodes = graph.nodes.filter(node => node.type === "ModuleMapping" && moduleNameOf(node).toLowerCase() === normalized);
  const mappingIds = new Set(mappingNodes.map(node => node.id));
  const edges = graph.edges.filter(edge => mappingIds.has(edge.from) || mappingIds.has(edge.to));
  const connected = connectedNodes(edges, nodes, "from").concat(connectedNodes(edges, nodes, "to"));
  const unique = new Map(connected.map(node => [node.id, node]));
  const relatedNodes = Array.from(unique.values()).filter(node => !mappingIds.has(node.id));

  return {
    moduleName,
    mappingNodes,
    sheets: relatedNodes.filter(node => node.type === "Sheet"),
    columns: relatedNodes.filter(node => node.type === "Column"),
    semanticConcepts: relatedNodes.filter(node => [
      "Seller",
      "Product",
      "Customer",
      "Branch",
      "Department",
      "Revenue",
      "Cost",
      "Commission",
      "DRECandidate",
    ].includes(node.type)),
    edges,
  };
}

export function findRiskyNodes(graph: EnterpriseKnowledgeGraph): KnowledgeGraphNode[] {
  const risky = new Set(graph.diagnostics.riskyNodeIds);
  return graph.nodes.filter(node => risky.has(node.id) || node.riskLevel === "medium" || node.riskLevel === "high");
}

export function explainNode(graph: EnterpriseKnowledgeGraph, nodeId: string): NodeExplanation {
  const nodes = nodeMap(graph);
  const node = nodes.get(nodeId) || null;
  const incomingEdges = graph.edges.filter(edge => edge.to === nodeId);
  const outgoingEdges = graph.edges.filter(edge => edge.from === nodeId);
  const dependencies = findDependencies(graph, nodeId);
  const consumers = findConsumers(graph, nodeId);
  const evidence = [
    ...(node?.evidence || []),
    ...incomingEdges.flatMap(edge => edge.evidence).slice(0, 12),
    ...outgoingEdges.flatMap(edge => edge.evidence).slice(0, 12),
  ];
  const summary = node
    ? `${node.label} é um nó ${node.type} com ${dependencies.length} dependência(s) direta(s) e ${consumers.length} consumidor(es) direto(s).`
    : `Nó ${nodeId} não encontrado no grafo.`;

  return {
    node,
    incomingEdges,
    outgoingEdges,
    dependencies,
    consumers,
    summary,
    evidence: Array.from(new Set(evidence)),
  };
}
