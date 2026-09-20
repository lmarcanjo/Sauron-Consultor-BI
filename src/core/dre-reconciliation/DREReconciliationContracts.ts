import { AnalysisScope } from '../business-insight/BusinessArtifactContracts';
import { StatementGroup } from '../financial-classification/FinancialClassificationContracts';
import { DREArtifact, PhysicalContributionIdentity, ContributionIdentity } from '../dre-composition/DRECompositionContracts';

export type DREReconciliationStatus =
  | 'NOT_RECONCILED'
  | 'RECONCILED'
  | 'RECONCILED_WITH_LIMITATIONS'
  | 'PARTIALLY_RECONCILED'
  | 'BLOCKED'
  | 'INVALIDATED';

export type CoverageStatus =
  | 'USED'
  | 'EXCLUDED'
  | 'UNRESOLVED'
  | 'MISSING'
  | 'DUPLICATED'
  | 'INVALID'
  | 'OUT_OF_SCOPE';

export type LineReconciliationStatus =
  | 'MATCHED'
  | 'MATCHED_WITH_ROUNDING'
  | 'MISMATCHED'
  | 'BLOCKED'
  | 'INVALIDATED';

export type SubtotalReconciliationStatus =
  | 'MATCHED'
  | 'MATCHED_WITH_ROUNDING'
  | 'MISMATCHED'
  | 'BLOCKED'
  | 'INVALIDATED';

export interface ContributionCoverageItem {
  readonly physicalContributionIdentity: PhysicalContributionIdentity;
  readonly contributionIdentity?: ContributionIdentity;
  readonly sourceRecordIdentity: string;
  readonly dataSourceId: string;
  readonly schemaVersionNumber: number;
  readonly synchronizationIdentity?: string;
  readonly containerId: string;
  readonly periodId: string;
  readonly currencyCode: string;
  readonly classificationDecisionId?: string;
  readonly categoryIdentity?: string;
  readonly physicalValue: string;
  readonly projectedSignedValue: number;
  readonly coverageStatus: CoverageStatus;
  readonly reason: string;
  readonly provenance: {
    readonly dataSourceId: string;
    readonly schemaVersionNumber: number;
    readonly containerId: string;
  };
}

export interface ExcludedReconciliationItem {
  readonly exclusionId: string;
  readonly physicalContributionIdentity: PhysicalContributionIdentity;
  readonly classificationDecisionId?: string;
  readonly reasonCode: 'NON_FINANCIAL' | 'EXCLUDE_FROM_FINANCIAL_MODEL' | 'OUT_OF_SCOPE' | 'INVALID_RECORD' | 'POLICY_EXCLUSION';
  readonly rationale: string;
  readonly materiality: number;
  readonly excludedSignedValue: number;
  readonly excludedBy: string;
  readonly excludedAt: string;
  readonly provenance: {
    readonly dataSourceId: string;
    readonly schemaVersionNumber: number;
  };
}

export interface UnresolvedReconciliationItem {
  readonly itemId: string;
  readonly physicalContributionIdentity: PhysicalContributionIdentity;
  readonly reason: string;
  readonly materiality: number;
  readonly physicalValue: string;
  readonly projectedSignedValue?: number;
  readonly relatedDecisionIds: readonly string[];
  readonly affectedLineCodes: readonly string[];
  readonly affectedSubtotalCodes: readonly string[];
  readonly provenance: {
    readonly dataSourceId: string;
    readonly schemaVersionNumber: number;
  };
  readonly limitations: readonly string[];
}

export interface MissingContributionItem {
  readonly itemId: string;
  readonly physicalContributionIdentity: PhysicalContributionIdentity;
  readonly sourceRecordIdentity: string;
  readonly physicalValue: string;
  readonly monetaryValue: number;
  readonly materiality: number;
  readonly isMaterial: boolean;
  readonly expectedGroup?: StatementGroup;
  readonly potentialImpact: string;
  readonly provenance: {
    readonly dataSourceId: string;
    readonly schemaVersionNumber: number;
  };
}

export interface SourceReconciliationResult {
  readonly eligiblePhysicalRecordCount: number;
  readonly usedPhysicalRecordCount: number;
  readonly excludedPhysicalRecordCount: number;
  readonly unresolvedPhysicalRecordCount: number;
  readonly missingPhysicalRecordCount: number;
  readonly duplicatedPhysicalRecordCount: number;
  readonly eligibleSignedValue: number;
  readonly usedSignedValue: number;
  readonly excludedSignedValue: number;
  readonly unresolvedSignedValue: number;
  readonly missingSignedValue: number;
  readonly unexplainedDifference: number;
}

export interface LineReconciliationResult {
  readonly lineId: string;
  readonly lineCode: string;
  readonly periodId: string;
  readonly currencyCode: string;
  readonly expectedValue: number;
  readonly actualValue: number;
  readonly absoluteDifference: number;
  readonly tolerance: number;
  readonly status: LineReconciliationStatus;
  readonly contributionIds: readonly string[];
  readonly findings: readonly string[];
  readonly provenance: {
    readonly dataSourceId: string;
    readonly schemaVersionNumber: number;
    readonly lineId: string;
  };
}

export interface SubtotalReconciliationResult {
  readonly subtotalId: string;
  readonly subtotalCode: string;
  readonly formulaId: string;
  readonly formulaVersion: string;
  readonly periodId: string;
  readonly currencyCode: string;
  readonly operation: string;
  readonly inputLineIds: readonly string[];
  readonly inputSubtotalIds: readonly string[];
  readonly recordedExpression: string;
  readonly independentlyCalculatedValue: number;
  readonly artifactRawValue: number;
  readonly difference: number;
  readonly tolerance: number;
  readonly status: SubtotalReconciliationStatus;
  readonly findings: readonly string[];
  readonly provenance: {
    readonly policyId: string;
    readonly policyVersion: string;
    readonly subtotalCode: string;
  };
}

export interface DREReconciliationExclusionPolicy {
  readonly policyId: string;
  readonly version: string;
  readonly allowedReasonCodes: readonly string[];
  readonly requiresRationale: boolean;
  readonly requiresConsultantIdentity: boolean;
  readonly requiresTimestamp: boolean;
  readonly materialExclusionBehavior: 'RECONCILED_WITH_LIMITATIONS' | 'BLOCKED';
  readonly nonMaterialExclusionBehavior: 'RECONCILED' | 'RECONCILED_WITH_LIMITATIONS';
  readonly affectsReconciliationStatus: boolean;
  readonly fingerprint: string;
}

export const DEFAULT_RECONCILIATION_EXCLUSION_POLICY: DREReconciliationExclusionPolicy = Object.freeze({
  policyId: 'asterion_dre_reconciliation_exclusion_policy_v1',
  version: '1.0.0',
  allowedReasonCodes: Object.freeze(['NON_FINANCIAL', 'EXCLUDE_FROM_FINANCIAL_MODEL', 'OUT_OF_SCOPE', 'INVALID_RECORD', 'POLICY_EXCLUSION']),
  requiresRationale: true,
  requiresConsultantIdentity: true,
  requiresTimestamp: true,
  materialExclusionBehavior: 'RECONCILED_WITH_LIMITATIONS',
  nonMaterialExclusionBehavior: 'RECONCILED',
  affectsReconciliationStatus: true,
  fingerprint: 'fnv1a_exclusion_policy_v1'
});

export interface DREReconciliationTolerancePolicy {
  readonly policyId: string;
  readonly version: string;
  readonly absoluteTolerance: number;
  readonly relativeTolerance: number;
  readonly currencyDecimalPlaces: number;
  readonly roundingMode: 'ROUND_HALF_UP' | 'TRUNCATE';
  readonly residualHandling: 'EXPLICIT_RESIDUAL' | 'FAIL_ON_RESIDUAL';
  readonly materialityThreshold: number;
  readonly fingerprint: string;
}

export const DEFAULT_RECONCILIATION_TOLERANCE_POLICY: DREReconciliationTolerancePolicy = Object.freeze({
  policyId: 'asterion_dre_reconciliation_tolerance_policy_v1',
  version: '1.0.0',
  absoluteTolerance: 0.01,
  relativeTolerance: 0.0001,
  currencyDecimalPlaces: 2,
  roundingMode: 'ROUND_HALF_UP',
  residualHandling: 'EXPLICIT_RESIDUAL',
  materialityThreshold: 0.05,
  fingerprint: 'fnv1a_reconciliation_tolerance_v1'
});

export interface DREReconciliationArtifact {
  readonly artifactId: string;
  readonly dreArtifactId: string;
  readonly financialClassificationArtifactId: string;
  readonly businessArtifactIds: readonly string[];
  readonly trustArtifactId: string;
  readonly dataSourceIds: readonly string[];
  readonly engagementId: string;
  readonly schemaVersionReferences: readonly number[];
  readonly policyId: string;
  readonly policyVersion: string;
  readonly reconciliationStatus: DREReconciliationStatus;
  readonly sourceReconciliation: SourceReconciliationResult;
  readonly lineReconciliations: readonly LineReconciliationResult[];
  readonly subtotalReconciliations: readonly SubtotalReconciliationResult[];
  readonly contributionCoverages: readonly ContributionCoverageItem[];
  readonly exclusions: readonly ExcludedReconciliationItem[];
  readonly unresolvedItems: readonly UnresolvedReconciliationItem[];
  readonly missingItems: readonly MissingContributionItem[];
  readonly unexplainedDifferences: readonly string[];
  readonly limitations: readonly string[];
  readonly provenance: {
    readonly dataSourceIds: readonly string[];
    readonly schemaVersionReferences: readonly number[];
    readonly dreArtifactId: string;
    readonly financialClassificationArtifactId: string;
    readonly trustArtifactId: string;
    readonly engineId: string;
    readonly engineVersion: string;
  };
  readonly metadata: {
    readonly disclaimer: string;
    readonly isOfficialFinancialAudit: false;
    readonly tolerancePolicyId: string;
    readonly exclusionPolicyId: string;
  };
  readonly fingerprint: string;
  readonly generatedAt: string;
  readonly version: number;
}

export class DREReconciliationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'DREReconciliationError';
  }
}
