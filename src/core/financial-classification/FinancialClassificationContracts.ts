import { AnalysisScope } from '../business-insight/BusinessArtifactContracts';
import { CertifiableUsageType } from '../trust/TrustContracts';
import { PlatformUser } from '../identity/types';

export type ClassificationType =
  | 'INFLOW'
  | 'OUTFLOW'
  | 'BALANCE'
  | 'NON_FINANCIAL'
  | 'UNRESOLVED';

export type FinancialNature =
  | 'OPERATING'
  | 'FINANCING'
  | 'INVESTING'
  | 'TAX'
  | 'PERSONNEL'
  | 'OTHER'
  | 'UNKNOWN';

export type StatementGroup =
  | 'GROSS_INFLOW'
  | 'DEDUCTION'
  | 'DIRECT_COST'
  | 'OPERATING_EXPENSE'
  | 'FINANCIAL_RESULT'
  | 'TAX_RESULT'
  | 'NON_OPERATING'
  | 'UNCLASSIFIED';

export type SignPolicy =
  | 'PRESERVE_SOURCE_SIGN'
  | 'ABSOLUTE_VALUE_AS_INFLOW'
  | 'ABSOLUTE_VALUE_AS_OUTFLOW'
  | 'INVERT_SOURCE_SIGN'
  | 'CUSTOM_RULE';

export type DeclarativeCustomRuleOperation =
  | 'PRESERVE'
  | 'ABSOLUTE'
  | 'INVERT'
  | 'MULTIPLY_BY_NEGATIVE_ONE';

export type DeclarativeCustomRuleCondition =
  | 'POSITIVE'
  | 'NEGATIVE'
  | 'ZERO'
  | 'ANY';

export interface DeclarativeCustomRule {
  readonly ruleId: string;
  readonly version: string;
  readonly operation: DeclarativeCustomRuleOperation;
  readonly condition: DeclarativeCustomRuleCondition;
  readonly rationale: string;
}

export type MaterialityState =
  | 'MATERIAL'
  | 'NON_MATERIAL'
  | 'REQUIRES_REVIEW';

export interface FinancialClassificationMaterialityAssessment {
  readonly categoryIdentity: string;
  readonly absoluteValue: number;
  readonly absoluteValueShare: number;
  readonly recordCount: number;
  readonly recordCountShare: number;
  readonly temporalRecurrence: number;
  readonly organizationalCoverage: number;
  readonly invalidValueCount: number;
  readonly mixedSign: boolean;
  readonly qualityLimitations: readonly string[];
  readonly manuallyMaterial: boolean;
  readonly materialityReasons: readonly string[];
  readonly materialityState: MaterialityState;
  readonly policyId: string;
  readonly policyVersion: string;
}

export interface FinancialClassificationMaterialityPolicy {
  readonly policyId: string;
  readonly version: string;
  readonly absoluteValueShareThreshold: number; // e.g. 0.05 (5%)
  readonly recordCountShareThreshold: number; // e.g. 0.05 (5%)
  readonly recurrenceThreshold: number; // e.g. 2 periods
  readonly organizationalCoverageThreshold: number;
  readonly invalidDataRules: { readonly maxAllowedInvalid: number };
  readonly mixedSignRules: { readonly flagAsMaterial: boolean };
  readonly manualOverrideRules: { readonly allowManualDeclaration: boolean };
  readonly fingerprint: string;
}

export interface CategoryNormalizationMetadata {
  readonly algorithm: 'DETERMINISTIC_CANONICAL_V1';
  readonly version: '1.0.0';
  readonly locale: 'pt-BR';
  readonly trimApplied: boolean;
  readonly caseFoldApplied: boolean;
  readonly diacriticPolicy: 'STRIP_DIACRITICS';
  readonly collisionDetected: boolean;
  readonly originalValues: readonly string[];
}

export type FinancialClassificationArtifactStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'CONFIRMED'
  | 'INVALIDATED'
  | 'SUPERSEDED'
  | 'REASSESSMENT_REQUIRED';

export type DecisionStatus =
  | 'CONFIRM_CLASSIFICATION'
  | 'CHANGE_CLASSIFICATION'
  | 'KEEP_UNCLASSIFIED'
  | 'DEFER'
  | 'EXCLUDE_FROM_FINANCIAL_MODEL';

export interface FinancialClassificationProvenance {
  readonly dataSourceId: string;
  readonly schemaVersionNumber: number;
  readonly trustArtifactId: string;
  readonly trustUsage: CertifiableUsageType;
  readonly semanticConfirmationArtifactId: string;
  readonly businessArtifactId?: string;
  readonly engineId: string;
  readonly engineVersion: string;
}

export interface FinancialClassificationDecision {
  readonly decisionId: string;
  readonly categoryIdentity: string;
  readonly physicalValue: string;
  readonly normalizedValue: string;
  readonly categoryNormalizationMetadata: CategoryNormalizationMetadata;
  readonly categoryFieldPhysicalName: string;
  readonly monetaryFieldPhysicalName: string;
  readonly classificationType: ClassificationType;
  readonly financialNature: FinancialNature;
  readonly statementGroup: StatementGroup;
  readonly signPolicy: SignPolicy;
  readonly customRule?: DeclarativeCustomRule;
  readonly scope: AnalysisScope;
  readonly periodApplicability?: string;
  readonly rationale: string;
  readonly consultantId: string;
  readonly supportingEvidenceIds: readonly string[];
  readonly semanticDecisionIds: readonly string[];
  readonly trustArtifactId: string;
  readonly limitations: readonly string[];
  readonly status: DecisionStatus;
  readonly provenance: FinancialClassificationProvenance;
  readonly decidedAt: string;
  readonly materialityAssessment: FinancialClassificationMaterialityAssessment;
}

export interface FinancialClassificationArtifact {
  readonly artifactId: string;
  readonly engagementId: string;
  readonly dataSourceId: string;
  readonly schemaVersionNumber: number;
  readonly semanticConfirmationArtifactId: string;
  readonly trustArtifactId: string;
  readonly businessArtifactId?: string;
  readonly scope: AnalysisScope;
  readonly containerId: string;
  readonly monetaryFieldReference: string;
  readonly temporalFieldReference?: string;
  readonly categoryFieldReference: string;
  readonly classificationDecisions: readonly FinancialClassificationDecision[];
  readonly unresolvedClassifications: readonly string[];
  readonly limitations: readonly string[];
  readonly provenance: FinancialClassificationProvenance;
  readonly metadata: {
    readonly engineVersion: string;
    readonly policyId: string;
    readonly policyVersion: string;
  };
  readonly fingerprint: string;
  readonly version: number;
  readonly status: FinancialClassificationArtifactStatus;
  readonly createdAt: string;
  readonly confirmedAt?: string;
  readonly invalidatedAt?: string;
}
