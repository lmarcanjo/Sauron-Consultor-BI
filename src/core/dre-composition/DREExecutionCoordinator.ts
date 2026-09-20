import {
  DREExecutionGraphArtifact,
  DREExecutionTraceArtifact,
  DRENodeExecutionRecord,
  ExecutionState
} from './DREExecutionGraphContracts';

export class DREExecutionCoordinator {
  private static readonly ENGINE_ID = 'DREExecutionCoordinator';

  public static execute(
    graph: DREExecutionGraphArtifact,
    executor: (formulaId: string, inputs: number[]) => number,
    getInputsValues: (nodeId: string) => number[]
  ): DREExecutionTraceArtifact {
    const startedAt = new Date().toISOString();
    const nodeExecutions: DRENodeExecutionRecord[] = [];
    const completedNodeIds = new Set<string>();
    graph.nodes.forEach(n => {
      if (n.nodeType === 'LINE_INPUT' || n.nodeType.endsWith('_GATE')) {
        completedNodeIds.add(n.nodeId);
      }
    });

    const blockedNodes: string[] = [];
    const skippedNodes: string[] = [];
    const failedNodes: string[] = [];
    const invalidatedNodes: string[] = [];

    // Executar estritamente seguindo a ordem topológica
    graph.executionOrder.forEach((nodeId, idx) => {
      const node = graph.nodes.find(n => n.nodeId === nodeId);
      if (!node) return;

      const stateBefore = node.executionState;
      let stateAfter: ExecutionState = 'COMPLETED';

      // Validar se dependências estão completas
      const missingDeps = node.dependencyNodeIds.filter(depId => !completedNodeIds.has(depId));
      
      // Basic gates are considered completed by default on initial build
      const isGate = node.nodeType.endsWith('_GATE');

      if (missingDeps.length > 0 && !isGate) {
        stateAfter = 'BLOCKED';
        blockedNodes.push(nodeId);
      } else {
        completedNodeIds.add(nodeId);
      }

      nodeExecutions.push({
        nodeId,
        executionIndex: idx + 1,
        stateBefore,
        stateAfter,
        dependencyStates: {},
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        inputFingerprint: `in_${nodeId}`,
        outputFingerprint: `out_${nodeId}`,
        cacheStatus: 'MISS',
        limitations: []
      });
    });

    const completedAt = new Date().toISOString();
    return {
      traceId: `trace_${graph.artifactId}_${Date.now()}`,
      graphArtifactId: graph.artifactId,
      dreArtifactId: graph.dreArtifactId,
      startedAt,
      completedAt,
      executionSequence: graph.executionOrder,
      nodeExecutions,
      blockedNodes,
      skippedNodes,
      failedNodes,
      invalidatedNodes,
      cacheHits: 0,
      cacheMisses: nodeExecutions.length,
      limitations: [],
      provenance: {
        graphArtifactId: graph.artifactId,
        engineId: this.ENGINE_ID
      },
      fingerprint: `fnv1a_trace_${Date.now().toString(16)}`,
      version: 1
    };
  }
}
