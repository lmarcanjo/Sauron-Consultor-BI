import { DREGraphInvalidationResult } from './DREExecutionGraphContracts';

export class DREExecutionInvalidationEngine {
  private static readonly ENGINE_ID = 'DREExecutionInvalidationEngine';

  public static invalidate(
    nodeIds: string[],
    adjList: Map<string, string[]>,
    reason: string
  ): DREGraphInvalidationResult {
    const directlyInvalidatedNodeIds = [...nodeIds];
    const transitivelyInvalidated = new Set<string>();

    const dfs = (nodeId: string) => {
      const neighbors = adjList.get(nodeId) || [];
      neighbors.forEach(neighbor => {
        if (!transitivelyInvalidated.has(neighbor) && !directlyInvalidatedNodeIds.includes(neighbor)) {
          transitivelyInvalidated.add(neighbor);
          dfs(neighbor);
        }
      });
    };

    directlyInvalidatedNodeIds.forEach(id => dfs(id));

    const allNodes = Array.from(adjList.keys());
    const preserved = allNodes.filter(id => !directlyInvalidatedNodeIds.includes(id) && !transitivelyInvalidated.has(id));

    return {
      changedNodeIds: nodeIds,
      directlyInvalidatedNodeIds,
      transitivelyInvalidatedNodeIds: Array.from(transitivelyInvalidated),
      preservedNodeIds: preserved,
      reason,
      provenance: {
        engineId: this.ENGINE_ID
      },
      fingerprint: `fnv1a_inval_${Date.now()}`
    };
  }
}
