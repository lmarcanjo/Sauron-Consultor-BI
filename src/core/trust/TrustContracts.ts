import { DataSource } from '../datasource/DataSource';
import { DiscoveryArtifact } from '../discovery/sdk/DiscoveryContracts';
import { QualityArtifact } from '../quality/QualityContracts';
import { EvidenceArtifact } from '../evidence/EvidenceContracts';
import { SemanticArtifact } from '../semantic/SemanticContracts';
import { SemanticConfirmationArtifact } from '../semantic/confirmation/SemanticConfirmationContracts';

export type TrustState =
  | 'NOT_ASSESSED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'BLOCKED'
  | 'LIMITED'
  | 'CONDITIONALLY_TRUSTED'
  | 'TRUSTED'
  | 'INVALIDATED';

export type TrustDimensionType =
  | 'STRUCTURAL_INTEGRITY'
  | 'DATA_QUALITY'
  | 'SEMANTIC_COVERAGE'
  | 'HUMAN_CONFIRMATION'
  | 'EVIDENCE_COVERAGE'
  | 'SCHEMA_STABILITY'
  | 'SYNCHRONIZATION_RECENCY'
  | 'LINEAGE_READINESS'
  | 'OPERATIONAL_HEALTH';

export type CertifiableUsageType =
  | 'EXPLORATORY_ANALYSIS'
  | 'INTERNAL_MONITORING'
  | 'EXECUTIVE_PRESENTATION'
  | 'FINANCIAL_ANALYSIS'
  | 'OPERATIONAL_DIAGNOSIS'
  | 'EXTERNAL_REPORTING'
  | 'AUTOMATED_DECISION_SUPPORT';

export type BlockingConditionCode =
  | 'SOURCE_NOT_READY'
  | 'CONFIRMATION_INVALIDATED'
  | 'MATERIAL_DECISIONS_PENDING'
  | 'CRITICAL_QUALITY_ALERT'
  | 'INSUFFICIENT_EVIDENCE'
  | 'SCHEMA_VERSION_MISMATCH'
  | 'ARTIFACT_INCOMPATIBILITY'
  | 'SOURCE_ARCHIVED'
  | 'SOURCE_UNAVAILABLE'
  | 'STALE_SYNCHRONIZATION';

export interface BlockingCondition {
  readonly code: BlockingConditionCode;
  readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  readonly affectedDimensions: readonly TrustDimensionType[];
  readonly affectedUsages: readonly CertifiableUsageType[];
  readonly supportingEvidenceIds: readonly string[];
  readonly remediationHint: string;
  readonly explanation: string;
}

export interface TrustDimensionAssessment {
  readonly dimension: TrustDimensionType;
  readonly status: TrustState;
  readonly score?: number; // Clamped strictly between 0 and 1
  readonly supportingEvidenceIds: readonly string[];
  readonly blockingReasons: readonly string[];
  readonly limitations: readonly string[];
  readonly explanation: string;
  readonly evaluatedAt: string;
}

export interface UsageAssessment {
  readonly usageType: CertifiableUsageType;
  readonly status: TrustState;
  readonly score?: number; // Clamped strictly between 0 and 1
  readonly requiredDimensions: readonly TrustDimensionType[];
  readonly satisfiedConditions: readonly string[];
  readonly blockingConditions: readonly BlockingCondition[];
  readonly limitations: readonly string[];
  readonly explanation: string;
  readonly evidenceIds: readonly string[];
}

export interface TrustFinding {
  readonly id: string;
  readonly category: 'SUCCESS' | 'WARNING' | 'LIMITATION' | 'BLOCKER';
  readonly message: string;
  readonly affectedDimensions: readonly TrustDimensionType[];
  readonly affectedUsages: readonly CertifiableUsageType[];
  readonly supportingEvidenceIds: readonly string[];
  readonly sourceArtifact: 'DISCOVERY' | 'QUALITY' | 'EVIDENCE' | 'SEMANTIC' | 'CONFIRMATION' | 'DATA_SOURCE';
}

export interface TrustArtifactProvenance {
  readonly dataSourceId: string;
  readonly engagementId: string;
  readonly schemaVersionNumber: number;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly discoveryArtifactId?: string;
  readonly qualityArtifactId?: string;
  readonly evidenceArtifactId?: string;
  readonly semanticArtifactId?: string;
  readonly semanticConfirmationArtifactId?: string;
}

export interface TrustMetadata {
  readonly engineVersion: string;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly rulesAppliedCount: number;
  readonly totalFindingsCount: number;
  readonly executionDurationMs: number;
}

export interface TrustFingerprint {
  readonly trustHash: string;
  readonly algorithm: string;
  readonly generatedAt: string;
}

export interface TrustArtifact {
  readonly artifactId: string;
  readonly dataSourceId: string;
  readonly engagementId: string;
  readonly schemaVersionNumber: number;

  readonly discoveryArtifactId?: string;
  readonly qualityArtifactId?: string;
  readonly evidenceArtifactId?: string;
  readonly semanticArtifactId?: string;
  readonly semanticConfirmationArtifactId?: string;

  readonly trustAssessment: {
    readonly overallState: TrustState;
    readonly overallScore?: number; // Clamped [0, 1]
    readonly scoreSuppressed: boolean;
    readonly scoreSuppressionReason?: string;
    readonly isUsableForAny: boolean;
    readonly primaryBlockingReason?: string;
  };

  readonly dimensionAssessments: readonly TrustDimensionAssessment[];
  readonly usageAssessments: readonly UsageAssessment[];
  readonly trustFindings: readonly TrustFinding[];
  readonly blockingConditions: readonly BlockingCondition[];
  readonly limitations: readonly string[];
  readonly provenance: TrustArtifactProvenance;
  readonly metadata: TrustMetadata;
  readonly fingerprint: TrustFingerprint;
  readonly evaluatedAt: string;
  readonly version: number;
}

export interface TrustEvaluationInput {
  readonly dataSource: DataSource;
  readonly discoveryArtifact?: DiscoveryArtifact | null;
  readonly qualityArtifact?: QualityArtifact | null;
  readonly evidenceArtifact?: EvidenceArtifact | null;
  readonly semanticArtifact?: SemanticArtifact | null;
  readonly semanticConfirmationArtifact?: SemanticConfirmationArtifact | null;
}

export class IncompatibleTrustArtifactsError extends Error {
  constructor(message: string) {
    super(`[TrustEngine] Artifact Incompatibility Error: ${message}`);
    this.name = 'IncompatibleTrustArtifactsError';
  }
}
