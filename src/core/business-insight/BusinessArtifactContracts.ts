import { TrustState, CertifiableUsageType } from '../trust/TrustContracts';

export type BusinessInsightCapability =
  | 'DESCRIPTIVE_ANALYSIS'
  | 'VARIANCE_ANALYSIS'
  | 'TREND_ANALYSIS'
  | 'COMPARATIVE_ANALYSIS'
  | 'CONTRIBUTION_ANALYSIS'
  | 'CONCENTRATION_ANALYSIS'
  | 'ANOMALY_INTERPRETATION'
  | 'RISK_IDENTIFICATION'
  | 'OPPORTUNITY_IDENTIFICATION'
  | 'ACTION_HYPOTHESIS_GENERATION';

export interface AnalysisScope {
  readonly scopeLevel: 'ENGAGEMENT' | 'GROUP' | 'COMPANY' | 'UNIT' | 'DATA_SOURCE' | 'CONTAINER';
  readonly scopeId: string;
  readonly engagementId: string;
  readonly period?: string;
  readonly confirmedDimensionFilters?: readonly {
    readonly dimensionName: string;
    readonly confirmedValue: string;
  }[];
}

export interface BusinessObservationProvenance {
  readonly dataSourceId: string;
  readonly schemaVersionNumber: number;
  readonly trustArtifactId: string;
  readonly trustUsage: CertifiableUsageType;
  readonly semanticConfirmationArtifactId?: string;
  readonly engineId: string;
  readonly engineVersion: string;
}

export interface BusinessObservation {
  readonly observationId: string;
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly scope: AnalysisScope;
  readonly period?: string;
  readonly status: 'OBSERVED' | 'INFERRED' | 'INSUFFICIENT_DATA';
  readonly calculatedValue?: number;
  readonly comparisonValue?: number;
  readonly variance?: number;
  readonly unit?: string;
  readonly supportingMetricIds: readonly string[];
  readonly supportingEvidenceIds: readonly string[];
  readonly trustUsage: CertifiableUsageType;
  readonly trustState: TrustState;
  readonly assumptions: readonly string[];
  readonly limitations: readonly string[];
  readonly provenance: BusinessObservationProvenance;
}

export type MetricCalculationStatus =
  | 'CALCULATED'
  | 'NOT_CALCULABLE'
  | 'PARTIALLY_CALCULATED'
  | 'INVALID_INPUT'
  | 'BLOCKED_BY_TRUST';

export interface CalculatedMetricProvenance {
  readonly dataSourceId: string;
  readonly schemaVersionNumber: number;
  readonly trustArtifactId: string;
  readonly trustUsage: CertifiableUsageType;
  readonly semanticConfirmationArtifactId?: string;
  readonly metricDefinitionId: string;
  readonly definitionVersion: string;
}

export interface CalculatedMetric {
  readonly metricId: string;
  readonly metricDefinitionId: string;
  readonly definitionVersion: string;
  readonly name: string;
  readonly value: number;
  readonly unit: string;
  readonly period?: string;
  readonly scope: AnalysisScope;
  readonly formulaReference: string;
  readonly inputFieldReferences: readonly string[];
  readonly semanticDecisionReferences: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly trustArtifactId: string;
  readonly trustUsage: CertifiableUsageType;
  readonly calculationStatus: MetricCalculationStatus;
  readonly limitations: readonly string[];
  readonly provenance: CalculatedMetricProvenance;
}

export type ComparisonType =
  | 'PERIOD_OVER_PERIOD'
  | 'YEAR_OVER_YEAR'
  | 'TARGET_VS_ACTUAL'
  | 'BUDGET_VS_ACTUAL'
  | 'BENCHMARK_COMPARISON';

export interface BusinessComparisonProvenance {
  readonly dataSourceId: string;
  readonly schemaVersionNumber: number;
  readonly trustArtifactId: string;
  readonly trustUsage: CertifiableUsageType;
  readonly engineId: string;
  readonly engineVersion: string;
}

export interface BusinessComparison {
  readonly comparisonId: string;
  readonly comparisonType: ComparisonType;
  readonly title: string;
  readonly basePeriod: string;
  readonly comparisonPeriod: string;
  readonly baseValue?: number;
  readonly comparisonValue?: number;
  readonly absoluteVariance?: number;
  readonly relativeVariance?: number; // NaN e Infinity estritamente proibidos
  readonly unit: string;
  readonly calculationStatus: 'COMPLETED' | 'UNAVAILABLE' | 'INCOMPATIBLE_PERIODS' | 'ZERO_DIVISION_SUPPRESSED';
  readonly supportingMetricIds: readonly string[];
  readonly supportingEvidenceIds: readonly string[];
  readonly trustArtifactId: string;
  readonly limitations: readonly string[];
  readonly provenance: BusinessComparisonProvenance;
}

export interface BusinessFindingProvenance {
  readonly dataSourceId: string;
  readonly trustArtifactId: string;
  readonly trustUsage: CertifiableUsageType;
  readonly ruleId: string;
  readonly engineId: string;
  readonly engineVersion: string;
}

export interface BusinessFinding {
  readonly findingId: string;
  readonly category: 'STRENGTH' | 'WEAKNESS' | 'NEUTRAL_FACT' | 'CRITICAL_ALERT';
  readonly title: string;
  readonly summary: string;
  readonly supportingObservationIds: readonly string[];
  readonly supportingMetricIds: readonly string[];
  readonly trustUsage: CertifiableUsageType;
  readonly provenance: BusinessFindingProvenance;
}

export interface BusinessRiskProvenance {
  readonly dataSourceId: string;
  readonly trustArtifactId: string;
  readonly trustUsage: CertifiableUsageType;
  readonly engineId: string;
  readonly engineVersion: string;
}

export interface BusinessRisk {
  readonly riskId: string;
  readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  readonly title: string;
  readonly description: string;
  readonly supportingFindingIds: readonly string[];
  readonly potentialImpactSummary: string;
  readonly limitations: readonly string[];
  readonly provenance: BusinessRiskProvenance;
}

export interface BusinessOpportunityProvenance {
  readonly dataSourceId: string;
  readonly trustArtifactId: string;
  readonly trustUsage: CertifiableUsageType;
  readonly engineId: string;
  readonly engineVersion: string;
}

export interface BusinessOpportunity {
  readonly opportunityId: string;
  readonly potentialValue: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly title: string;
  readonly description: string;
  readonly supportingFindingIds: readonly string[];
  readonly expectedBenefitSummary: string;
  readonly limitations: readonly string[];
  readonly provenance: BusinessOpportunityProvenance;
}

export interface ActionHypothesisProvenance {
  readonly dataSourceId: string;
  readonly trustArtifactId: string;
  readonly trustUsage: CertifiableUsageType;
  readonly engineId: string;
  readonly engineVersion: string;
}

export interface ActionHypothesis {
  readonly hypothesisId: string;
  readonly title: string;
  readonly rationale: string;
  readonly expectedImpact: string;
  readonly suggestedAction: string;
  readonly supportingFindingIds: readonly string[];
  readonly supportingEvidenceIds: readonly string[];
  readonly supportingRiskIds: readonly string[];
  readonly supportingOpportunityIds: readonly string[];
  readonly assumptions: readonly string[];
  readonly risks: readonly string[];
  readonly limitations: readonly string[];
  readonly requiresConsultantDecision: true;
  readonly executionStatus: 'NOT_EXECUTED';
  readonly disclaimer: string; // "Hipótese de ação para consideração exclusiva do consultor. Nenhuma ação é executada automaticamente."
  readonly provenance: ActionHypothesisProvenance;
}

export interface UnresolvedBusinessQuestionProvenance {
  readonly dataSourceId: string;
  readonly trustArtifactId: string;
  readonly trustUsage: CertifiableUsageType;
  readonly engineId: string;
  readonly engineVersion: string;
}

export interface UnresolvedBusinessQuestion {
  readonly questionId: string;
  readonly category: string;
  readonly question: string;
  readonly reason: string;
  readonly scope: AnalysisScope;
  readonly materiality: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly relatedObservationIds: readonly string[];
  readonly relatedMetricIds: readonly string[];
  readonly supportingEvidenceIds: readonly string[];
  readonly trustArtifactId: string;
  readonly limitations: readonly string[];
  readonly status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  readonly provenance: UnresolvedBusinessQuestionProvenance;
}

export interface BusinessArtifactProvenance {
  readonly engineId: string;
  readonly engineVersion: string;
  readonly sdkVersion: string;
  readonly dataSourceIds: readonly string[];
  readonly engagementId: string;
  readonly schemaVersionReferences: readonly { readonly dataSourceId: string; readonly schemaVersionNumber: number }[];
  readonly trustArtifactIds: readonly string[];
  readonly semanticConfirmationArtifactIds: readonly string[];
  readonly policyId: string;
  readonly policyVersion: string;
}

export interface BusinessArtifactMetadata {
  readonly engineId: string;
  readonly engineVersion: string;
  readonly sdkVersion: string;
  readonly capabilitiesUsed: readonly BusinessInsightCapability[];
  readonly executionDurationMs: number;
  readonly generatedAt: string;
}

export interface BusinessArtifactFingerprint {
  readonly artifactHash: string;
  readonly algorithm: string;
  readonly version?: string;
  readonly cryptographic?: boolean;
  readonly generatedAt: string;
}

export type BusinessArtifactInvalidationReason =
  | 'TRUST_ARTIFACT_CHANGED'
  | 'TRUST_POLICY_CHANGED'
  | 'SCHEMA_CHANGED'
  | 'SEMANTIC_CONFIRMATION_CHANGED'
  | 'FACTUAL_ARTIFACT_CHANGED'
  | 'METRIC_DEFINITION_CHANGED'
  | 'ENGINE_VERSION_CHANGED'
  | 'ANALYSIS_SCOPE_CHANGED'
  | 'ANALYSIS_PERIOD_CHANGED'
  | 'DATA_SOURCE_ARCHIVED';

export interface BusinessArtifact {
  readonly artifactId: string;
  readonly engineId: string;
  readonly engineVersion: string;
  readonly sdkVersion: string;
  readonly dataSourceIds: readonly string[];
  readonly engagementId: string;
  readonly schemaVersionReferences: readonly { readonly dataSourceId: string; readonly schemaVersionNumber: number }[];
  readonly trustArtifactIds: readonly string[];
  readonly semanticConfirmationArtifactIds: readonly string[];

  readonly analysisScope: AnalysisScope;
  readonly businessObservations: readonly BusinessObservation[];
  readonly calculatedMetrics: readonly CalculatedMetric[];
  readonly comparisons: readonly BusinessComparison[];
  readonly findings: readonly BusinessFinding[];
  readonly risks: readonly BusinessRisk[];
  readonly opportunities: readonly BusinessOpportunity[];
  readonly actionHypotheses: readonly ActionHypothesis[];
  readonly unresolvedBusinessQuestions: readonly UnresolvedBusinessQuestion[];
  readonly limitations: readonly string[];

  readonly provenance: BusinessArtifactProvenance;
  readonly metadata: BusinessArtifactMetadata;
  readonly fingerprint: BusinessArtifactFingerprint;
  readonly generatedAt: string;
  readonly version: number;
}
