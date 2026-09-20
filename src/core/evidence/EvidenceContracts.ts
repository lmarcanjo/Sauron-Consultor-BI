export type EvidenceType = 'PHYSICAL' | 'STRUCTURAL' | 'STATISTICAL' | 'QUALITY_ANOMALY';

export type EvidenceSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type SamplingMethod = 'NONE' | 'HEAD_SAMPLE' | 'RANDOM_SAMPLE' | 'STRATIFIED_SAMPLE';

export interface SamplingMetadata {
  isSampled: boolean;
  sampleSize?: number;
  populationSize?: number;
  coverageRatio?: number; // 0.00 a 1.00 (e.g. 0.25 = 25%)
  samplingMethod?: SamplingMethod;
  limitations?: string[];
}

export interface GranularProvenance {
  sourceArtifactType: 'DiscoveryArtifact' | 'QualityArtifact';
  sourceArtifactId: string;
  dataSourceId: string;
  engagementId: string;
  schemaVersionNumber: number;
  sourceEngine: string;
  containerId?: string;
  columnName?: string;
  relationshipId?: string;
  alertId?: string;
  metricId?: string;
  synchronizationId?: string;
  sourceFingerprint: string;
  observedAt: string;
}

export interface BaseEvidenceItem {
  id: string;
  type: EvidenceType;
  severity: EvidenceSeverity;
  code: string;
  description: string;
  provenance: GranularProvenance;
  sampling: SamplingMetadata;
  details?: Record<string, any>;
  observedAt: string;
}

export interface PhysicalEvidenceItem extends BaseEvidenceItem {
  type: 'PHYSICAL';
  containerId: string;
}

export interface StructuralEvidenceItem extends BaseEvidenceItem {
  type: 'STRUCTURAL';
  containerId: string;
  columnName?: string;
}

export interface StatisticalEvidenceItem extends BaseEvidenceItem {
  type: 'STATISTICAL';
  containerId: string;
  columnName?: string;
}

export interface QualityAnomalyEvidenceItem extends BaseEvidenceItem {
  type: 'QUALITY_ANOMALY';
  alertId: string;
  containerId?: string;
  columnName?: string;
}

export type EvidenceItem =
  | PhysicalEvidenceItem
  | StructuralEvidenceItem
  | StatisticalEvidenceItem
  | QualityAnomalyEvidenceItem;

export interface EvidenceFingerprint {
  discoveryFingerprint: string;
  qualityArtifactId: string;
  evidenceHash: string;
  generatedAt: string;
}

export interface EvidenceMetadata {
  totalEvidenceCount: number;
  includedEvidenceCount: number;
  truncated: boolean;
  truncationReason?: string;
  maxEvidenceLimit: number;
}

export interface EvidenceArtifact {
  readonly artifactId: string;
  readonly discoveryArtifactId: string;
  readonly qualityArtifactId: string;
  readonly dataSourceId: string;
  readonly engagementId: string;
  readonly evidences: readonly EvidenceItem[];
  readonly fingerprint: EvidenceFingerprint;
  readonly metadata: EvidenceMetadata;
  readonly totalEvidencesCount: number;
  readonly evaluatedAt: string;
}

export class IncompatibleArtifactsError extends Error {
  constructor(reason: string) {
    super(`[EvidenceEngine] Artefatos incompatíveis para consolidação: ${reason}`);
    this.name = 'IncompatibleArtifactsError';
  }
}
