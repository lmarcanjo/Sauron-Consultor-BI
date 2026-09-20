import { TrustDimensionType, CertifiableUsageType } from './TrustContracts';

export interface DimensionWeightConfig {
  readonly dimension: TrustDimensionType;
  readonly weight: number; // Sum of weights = 1.0
  readonly isOptional: boolean;
}

export interface UsageRequirementConfig {
  readonly usageType: CertifiableUsageType;
  readonly requiredDimensions: readonly TrustDimensionType[];
  readonly mandatoryArtifacts: readonly ('DISCOVERY' | 'QUALITY' | 'EVIDENCE' | 'SEMANTIC' | 'CONFIRMATION')[];
  readonly requiresSourceReady: boolean;
  readonly minimumOverallScore: number;
}

export interface StateThresholdConfig {
  readonly trustedMinScore: number; // e.g. 0.80
  readonly conditionallyTrustedMinScore: number; // e.g. 0.60
  readonly limitedMinScore: number; // e.g. 0.35
}

export interface SamplingRuleConfig {
  readonly minimumRatioForFullTrust: number; // e.g. 0.10 (10%)
  readonly minimumAbsoluteRows: number; // e.g. 100
}

export interface StalenessRuleConfig {
  readonly maxStaleHoursForMonitoring: number; // e.g. 72 hours
  readonly maxStaleHoursForExecutive: number; // e.g. 168 hours (7 days)
}

export interface TrustPolicy {
  readonly policyId: string;
  readonly version: string;
  readonly name: string;
  readonly dimensionWeights: readonly DimensionWeightConfig[];
  readonly usageRequirements: readonly UsageRequirementConfig[];
  readonly stateThresholds: StateThresholdConfig;
  readonly samplingRules: SamplingRuleConfig;
  readonly stalenessRules: StalenessRuleConfig;
  readonly fingerprint: string;
}

export const CANONICAL_TRUST_POLICY_V1: TrustPolicy = Object.freeze({
  policyId: 'asterion_trust_policy_v1',
  version: '1.0.0',
  name: 'ASTERION Canonical Trust & Aptitude Policy V1',
  dimensionWeights: Object.freeze([
    { dimension: 'STRUCTURAL_INTEGRITY' as TrustDimensionType, weight: 0.15, isOptional: false },
    { dimension: 'DATA_QUALITY' as TrustDimensionType, weight: 0.20, isOptional: true },
    { dimension: 'SEMANTIC_COVERAGE' as TrustDimensionType, weight: 0.10, isOptional: true },
    { dimension: 'HUMAN_CONFIRMATION' as TrustDimensionType, weight: 0.20, isOptional: false },
    { dimension: 'EVIDENCE_COVERAGE' as TrustDimensionType, weight: 0.10, isOptional: true },
    { dimension: 'SCHEMA_STABILITY' as TrustDimensionType, weight: 0.05, isOptional: false },
    { dimension: 'SYNCHRONIZATION_RECENCY' as TrustDimensionType, weight: 0.05, isOptional: true },
    { dimension: 'LINEAGE_READINESS' as TrustDimensionType, weight: 0.05, isOptional: false },
    { dimension: 'OPERATIONAL_HEALTH' as TrustDimensionType, weight: 0.10, isOptional: false }
  ]),
  usageRequirements: Object.freeze([
    {
      usageType: 'EXPLORATORY_ANALYSIS' as CertifiableUsageType,
      requiredDimensions: Object.freeze(['STRUCTURAL_INTEGRITY' as TrustDimensionType, 'OPERATIONAL_HEALTH' as TrustDimensionType]),
      mandatoryArtifacts: Object.freeze(['DISCOVERY'] as const),
      requiresSourceReady: false,
      minimumOverallScore: 0.30
    },
    {
      usageType: 'INTERNAL_MONITORING' as CertifiableUsageType,
      requiredDimensions: Object.freeze(['STRUCTURAL_INTEGRITY' as TrustDimensionType, 'DATA_QUALITY' as TrustDimensionType, 'OPERATIONAL_HEALTH' as TrustDimensionType]),
      mandatoryArtifacts: Object.freeze(['DISCOVERY', 'QUALITY'] as const),
      requiresSourceReady: false,
      minimumOverallScore: 0.50
    },
    {
      usageType: 'EXECUTIVE_PRESENTATION' as CertifiableUsageType,
      requiredDimensions: Object.freeze(['STRUCTURAL_INTEGRITY' as TrustDimensionType, 'HUMAN_CONFIRMATION' as TrustDimensionType, 'SEMANTIC_COVERAGE' as TrustDimensionType, 'OPERATIONAL_HEALTH' as TrustDimensionType]),
      mandatoryArtifacts: Object.freeze(['DISCOVERY', 'SEMANTIC', 'CONFIRMATION'] as const),
      requiresSourceReady: true,
      minimumOverallScore: 0.70
    },
    {
      usageType: 'FINANCIAL_ANALYSIS' as CertifiableUsageType,
      requiredDimensions: Object.freeze(['STRUCTURAL_INTEGRITY' as TrustDimensionType, 'DATA_QUALITY' as TrustDimensionType, 'HUMAN_CONFIRMATION' as TrustDimensionType, 'EVIDENCE_COVERAGE' as TrustDimensionType, 'LINEAGE_READINESS' as TrustDimensionType]),
      mandatoryArtifacts: Object.freeze(['DISCOVERY', 'QUALITY', 'EVIDENCE', 'SEMANTIC', 'CONFIRMATION'] as const),
      requiresSourceReady: true,
      minimumOverallScore: 0.80
    },
    {
      usageType: 'OPERATIONAL_DIAGNOSIS' as CertifiableUsageType,
      requiredDimensions: Object.freeze(['STRUCTURAL_INTEGRITY' as TrustDimensionType, 'DATA_QUALITY' as TrustDimensionType, 'HUMAN_CONFIRMATION' as TrustDimensionType, 'LINEAGE_READINESS' as TrustDimensionType]),
      mandatoryArtifacts: Object.freeze(['DISCOVERY', 'QUALITY', 'SEMANTIC', 'CONFIRMATION'] as const),
      requiresSourceReady: true,
      minimumOverallScore: 0.65
    },
    {
      usageType: 'EXTERNAL_REPORTING' as CertifiableUsageType,
      requiredDimensions: Object.freeze(['STRUCTURAL_INTEGRITY' as TrustDimensionType, 'DATA_QUALITY' as TrustDimensionType, 'HUMAN_CONFIRMATION' as TrustDimensionType, 'EVIDENCE_COVERAGE' as TrustDimensionType, 'SCHEMA_STABILITY' as TrustDimensionType, 'LINEAGE_READINESS' as TrustDimensionType]),
      mandatoryArtifacts: Object.freeze(['DISCOVERY', 'QUALITY', 'EVIDENCE', 'SEMANTIC', 'CONFIRMATION'] as const),
      requiresSourceReady: true,
      minimumOverallScore: 0.85
    },
    {
      usageType: 'AUTOMATED_DECISION_SUPPORT' as CertifiableUsageType,
      requiredDimensions: Object.freeze(['STRUCTURAL_INTEGRITY' as TrustDimensionType, 'DATA_QUALITY' as TrustDimensionType, 'HUMAN_CONFIRMATION' as TrustDimensionType, 'EVIDENCE_COVERAGE' as TrustDimensionType, 'SCHEMA_STABILITY' as TrustDimensionType, 'SYNCHRONIZATION_RECENCY' as TrustDimensionType, 'LINEAGE_READINESS' as TrustDimensionType, 'OPERATIONAL_HEALTH' as TrustDimensionType]),
      mandatoryArtifacts: Object.freeze(['DISCOVERY', 'QUALITY', 'EVIDENCE', 'SEMANTIC', 'CONFIRMATION'] as const),
      requiresSourceReady: true,
      minimumOverallScore: 0.90
    }
  ]),
  stateThresholds: Object.freeze({
    trustedMinScore: 0.80,
    conditionallyTrustedMinScore: 0.60,
    limitedMinScore: 0.35
  }),
  samplingRules: Object.freeze({
    minimumRatioForFullTrust: 0.10,
    minimumAbsoluteRows: 100
  }),
  stalenessRules: Object.freeze({
    maxStaleHoursForMonitoring: 72,
    maxStaleHoursForExecutive: 168
  }),
  fingerprint: 'policy_asterion_v1_fnv1a_canonical'
});
