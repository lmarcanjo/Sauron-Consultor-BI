import { DREExecutionGraphArtifact, DREExecutionNode } from './DREExecutionGraphContracts';
import { DRECompositionPolicy } from './DRECompositionContracts';

export class DREExecutionGraphValidator {
  public static validate(graph: DREExecutionGraphArtifact, policy: DRECompositionPolicy): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const nodeMap = new Map<string, DREExecutionNode>();
    graph.nodes.forEach(n => nodeMap.set(n.nodeId, n));

    // 1. Validar existência de nós referenciados nas arestas
    for (const edge of graph.edges) {
      if (!nodeMap.has(edge.sourceNodeId)) {
        issues.push(`EXECUTION_GRAPH_MISSING_DEPENDENCY: Aresta ${edge.edgeId} referencia nó de origem inexistente ${edge.sourceNodeId}`);
      }
      if (!nodeMap.has(edge.targetNodeId)) {
        issues.push(`EXECUTION_GRAPH_MISSING_DEPENDENCY: Aresta ${edge.edgeId} referencia nó de destino inexistente ${edge.targetNodeId}`);
      }
    }

    // 2. Validar conformidade de SUM_LINES e ADD_SUBTOTALS
    for (const node of graph.nodes) {
      if (node.nodeType === 'FORMULA') {
        const matchingSub = graph.nodes.find(n => n.nodeType === 'SUBTOTAL' && n.code === node.code);
        
        // SUM_LINES só pode receber LINE_INPUT
        if (node.code.startsWith('TOTAL_') || node.code === 'TOTAL_GROSS_INFLOW' || node.code === 'TOTAL_DEDUCTIONS' || node.code === 'TOTAL_DIRECT_COST' || node.code === 'TOTAL_OPERATING_EXPENSE' || node.code === 'TOTAL_FINANCIAL_RESULT' || node.code === 'TOTAL_TAX_RESULT' || node.code === 'TOTAL_NON_OPERATING') {
          const badInputs = node.dependencyNodeIds.filter(depId => {
            const depNode = nodeMap.get(depId);
            return depNode && depNode.nodeType !== 'LINE_INPUT' && !depNode.nodeType.endsWith('_GATE');
          });
          if (badInputs.length > 0) {
            issues.push(`INVALID_FORMULA_INPUT_TYPE: Fórmulas SUM_LINES devem possuir apenas entradas de linhas. Nó: ${node.nodeId}`);
          }
        } else {
          // ADD_SUBTOTALS só pode receber SUBTOTAL
          const badInputs = node.dependencyNodeIds.filter(depId => {
            const depNode = nodeMap.get(depId);
            return depNode && depNode.nodeType !== 'SUBTOTAL' && !depNode.nodeType.endsWith('_GATE');
          });
          if (badInputs.length > 0) {
            issues.push(`INVALID_FORMULA_INPUT_TYPE: Fórmulas ADD_SUBTOTALS devem possuir apenas entradas de subtotais. Nó: ${node.nodeId}`);
          }
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}
