import { DREPeriodType, DRESubtotalOperation } from '../dre-composition/DRECompositionContracts';

export type GraphStatus =
  | 'NOT_BUILT'
  | 'VALID'
  | 'VALID_WITH_LIMITATIONS'
  | 'PARTIALLY_VALID'
  | 'BLOCKED'
  | 'INVALIDATED';

export type DREExecutionNodeType =
  | 'LINE_INPUT'
  | 'FORMULA'
  | 'SUBTOTAL'
  | 'POLICY_GATE'
  | 'TRUST_GATE'
  | 'PERIOD_GATE'
  | 'CURRENCY_GATE'
  | 'MATERIALITY_GATE'
  | 'RECONCILIATION_GATE';

export type ExecutionState =
  | 'PENDING'
  | 'READY'
  | 'RUNNING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_LIMITATIONS'
  | 'BLOCKED'
  | 'FAILED'
  | 'INVALIDATED'
  | 'SKIPPED_BY_POLICY';

export type InputState =
  | 'AVAILABLE'
  | 'PARTIAL'
  | 'MISSING'
  | 'BLOCKED'
  | 'INVALIDATED'
  | 'INCOMPATIBLE';

export type OutputState =
  | 'NOT_PRODUCED'
  | 'PRODUCED'
  | 'PRODUCED_WITH_LIMITATIONS'
  | 'BLOCKED'
  | 'FAILED'
  | 'INVALIDATED';

export type DREExecutionEdgeType =
  | 'LINE_TO_FORMULA'
  | 'FORMULA_TO_SUBTOTAL'
  | 'SUBTOTAL_TO_FORMULA'
  | 'GATE_TO_FORMULA'
  | 'GATE_TO_SUBTOTAL'
  | 'RECONCILIATION_DEPENDENCY';

export interface DREExecutionNode {
  readonly nodeId: string;
  readonly nodeType: DREExecutionNodeType;
  readonly code: string;
  readonly label: string;
  readonly periodId: string;
  readonly currencyCode: string;
  readonly formulaId?: string;
  readonly formulaVersion?: string;
  readonly subtotalCode?: string;
  readonly sourceLineIds: readonly string[];
  readonly dependencyNodeIds: readonly string[];
  readonly dependentNodeIds: readonly string[];
  readonly executionState: ExecutionState;
  readonly inputState: InputState;
  readonly outputState: OutputState;
  readonly limitations: readonly string[];
  readonly provenance: {
    readonly policyId: string;
    readonly policyVersion: string;
    readonly nodeSourceId: string;
  };
  readonly fingerprint: string;
  readonly orderHint: number;
}

export interface DREExecutionEdge {
  readonly edgeId: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly edgeType: DREExecutionEdgeType;
  readonly required: boolean;
  readonly dependencyRole: string;
  readonly periodId: string;
  readonly currencyCode: string;
  readonly provenance: {
    readonly policyId: string;
    readonly policyVersion: string;
  };
  readonly fingerprint: string;
}

export interface DREExecutionGraphArtifact {
  readonly artifactId: string;
  readonly dreArtifactId: string;
  readonly engagementId: string;
  readonly dataSourceIds: readonly string[];
  readonly schemaVersionReferences: readonly number[];
  readonly policyId: string;
  readonly policyVersion: string;
  readonly engineVersion: string;
  readonly graphVersion: number;
  readonly nodes: readonly DREExecutionNode[];
  readonly edges: readonly DREExecutionEdge[];
  readonly executionOrder: readonly string[];
  readonly graphStatus: GraphStatus;
  readonly invalidationState: {
    readonly isInvalidated: boolean;
    readonly invalidatedAt?: string;
    readonly reason?: string;
  };
  readonly limitations: readonly string[];
  readonly provenance: {
    readonly policyId: string;
    readonly policyVersion: string;
    readonly dreArtifactId: string;
    readonly engineId: string;
  };
  readonly metadata: {
    readonly disclaimer: string;
    readonly nodeCount: number;
    readonly edgeCount: number;
  };
  readonly fingerprint: string;
  readonly generatedAt: string;
  readonly version: number;
}

export interface DRENodeExecutionRecord {
  readonly nodeId: string;
  readonly executionIndex: number;
  readonly stateBefore: ExecutionState;
  readonly stateAfter: ExecutionState;
  readonly dependencyStates: Record<string, ExecutionState>;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly inputFingerprint: string;
  readonly outputFingerprint: string;
  readonly cacheStatus: 'HIT' | 'MISS' | 'BYPASS';
  readonly errorCode?: string;
  readonly limitations: readonly string[];
}

export interface DREExecutionTraceArtifact {
  readonly traceId: string;
  readonly graphArtifactId: string;
  readonly dreArtifactId: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly executionSequence: readonly string[];
  readonly nodeExecutions: readonly DRENodeExecutionRecord[];
  readonly blockedNodes: readonly string[];
  readonly skippedNodes: readonly string[];
  readonly failedNodes: readonly string[];
  readonly invalidatedNodes: readonly string[];
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly limitations: readonly string[];
  readonly provenance: {
    readonly graphArtifactId: string;
    readonly engineId: string;
  };
  readonly fingerprint: string;
  readonly version: number;
}

export interface DREGraphInvalidationResult {
  readonly changedNodeIds: readonly string[];
  readonly directlyInvalidatedNodeIds: readonly string[];
  readonly transitivelyInvalidatedNodeIds: readonly string[];
  readonly preservedNodeIds: readonly string[];
  readonly reason: string;
  readonly provenance: {
    readonly engineId: string;
  };
  readonly fingerprint: string;
}

export interface DREExecutionCacheEntry {
  readonly cacheKey: string;
  readonly nodeId: string;
  readonly graphFingerprint: string;
  readonly policyFingerprint: string;
  readonly inputFingerprint: string;
  readonly outputFingerprint: string;
  readonly periodId: string;
  readonly currencyCode: string;
  readonly dataSourceIds: readonly string[];
  readonly schemaVersionReferences: readonly number[];
  readonly outputValue: number;
  readonly calculationStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  readonly createdAt: string;
  readonly invalidatedAt?: string;
  readonly invalidationReason?: string;
  readonly provenance: {
    readonly policyId: string;
    readonly policyVersion: string;
  };
}

export interface DREExecutionCachePolicy {
  readonly policyId: string;
  readonly version: string;
  readonly enabled: boolean;
  readonly maximumEntries: number;
  readonly ttlBehavior: 'NO_EXPIRATION' | 'TTL_EXPIRED';
  readonly invalidationRules: readonly string[];
  readonly trustChangeBehavior: 'INVALIDATE' | 'PRESERVE';
  readonly schemaChangeBehavior: 'INVALIDATE' | 'PRESERVE';
  readonly policyChangeBehavior: 'INVALIDATE' | 'PRESERVE';
  readonly periodChangeBehavior: 'INVALIDATE' | 'PRESERVE';
  readonly currencyChangeBehavior: 'INVALIDATE' | 'PRESERVE';
  readonly fingerprint: string;
}

export interface IDREExecutionCache {
  get(key: string): DREExecutionCacheEntry | undefined;
  set(entry: DREExecutionCacheEntry): void;
  invalidate(reason: string): void;
  list(): readonly DREExecutionCacheEntry[];
}
