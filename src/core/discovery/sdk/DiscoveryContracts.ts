import { PlatformUser } from '../../identity/types';

export type DiscoverySeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface DiscoveryWarning {
  code: string;
  message: string;
  severity: DiscoverySeverity;
  affectedContainerId?: string;
  affectedColumnName?: string;
  timestamp: string;
}

export interface DiscoverySuggestion {
  id: string;
  type: string;
  description: string;
  confidenceScore: number;
  targetRef: string;
  suggestedAction: string;
}

export interface DiscoveryStatistics {
  totalContainersCount: number;
  totalColumnsCount: number;
  totalEstimatedRows: number;
  nullPercentageOverall: number;
  distinctValuesEstimate: number;
  qualityScore: number; // 0 a 100
}

export interface DiscoveryColumn {
  name: string;
  originalName: string;
  index: number;
  inferredType: string;
  nullable: boolean;
  sampleValues: any[];
  distinctValuesCount?: number;
  nullsCount?: number;
  metadata?: Record<string, any>;
}

export interface DiscoveryRelationship {
  id: string;
  sourceContainerId: string;
  sourceColumnName: string;
  targetContainerId: string;
  targetColumnName: string;
  relationshipType: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';
  confidenceScore: number;
}

export interface DiscoveryContainer {
  id: string;
  name: string;
  type: 'table' | 'sheet' | 'endpoint' | 'file';
  rowCountEstimate: number;
  columns: DiscoveryColumn[];
  metadata?: Record<string, any>;
}

export interface DiscoveryFingerprint {
  physicalFingerprint: string;
  structuralFingerprint: string;
  generatedAt: string;
}

export interface DiscoveryMetadata {
  engineId: string;
  engineVersion: string;
  executionDurationMs: number;
  executedAt: string;
  parametersUsed?: Record<string, any>;
}

/**
 * DiscoveryArtifact — O artefato oficial e imutável produzido por qualquer motor de Discovery.
 */
export interface DiscoveryArtifact {
  artifactId: string;
  dataSourceId: string;
  engagementId: string;
  schemaVersionNumber: number;
  containers: DiscoveryContainer[];
  relationships: DiscoveryRelationship[];
  statistics: DiscoveryStatistics;
  warnings: DiscoveryWarning[];
  suggestions: DiscoverySuggestion[];
  fingerprint: DiscoveryFingerprint;
  metadata: DiscoveryMetadata;
}

/**
 * Contexto de Execução para qualquer Operação do Discovery SDK.
 */
export interface DiscoveryExecutionContext {
  dataSourceId: string;
  engagementId: string;
  user?: PlatformUser | null;
  correlationId?: string;
  options?: Record<string, any>;
}

/**
 * Contrato Principal da Interface do Motor de Discovery (Discovery Engine Contract).
 */
export interface IAsterionDiscoveryEngine {
  readonly metadata: {
    id: string;
    name: string;
    version: string;
    provider: string;
    description?: string;
  };

  runDiscovery(ctx: DiscoveryExecutionContext, inputData?: any): Promise<DiscoveryArtifact>;
}
