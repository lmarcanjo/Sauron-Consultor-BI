export type InterpretationStatus =
  | 'SUGGESTED'
  | 'NEEDS_REVIEW'
  | 'REJECTED'
  | 'CONFIRMED'
  | 'UNINTERPRETED';

export type ConfidenceBand = 'HIGH' | 'MEDIUM' | 'LOW';

export type SemanticCategory =
  | 'IDENTIFIER'
  | 'TEMPORAL'
  | 'NUMERIC_MEASURE'
  | 'MONETARY_MEASURE'
  | 'PERCENTAGE'
  | 'CATEGORICAL'
  | 'TEXTUAL_DESCRIPTION'
  | 'ORGANIZATIONAL_REFERENCE'
  | 'GEOGRAPHIC_REFERENCE'
  | 'BOOLEAN_FLAG'
  | 'RELATIONSHIP_KEY'
  | 'UNKNOWN';

export interface SuggestedInterpretation {
  readonly interpretationId: string;
  readonly label: string;
  readonly category: SemanticCategory;
  readonly confidenceBand: ConfidenceBand;
  readonly confidenceScore: number; // 0.00 a 1.00 clamp
  readonly supportingEvidenceIds: readonly string[];
  readonly contradictingEvidenceIds: readonly string[];
  readonly explanation: string;
  readonly assumptions: readonly string[];
  readonly status: 'SUGGESTED' | 'NEEDS_REVIEW'; // O motor só pode produzir SUGGESTED ou NEEDS_REVIEW nas sugestões
}

export interface FieldInterpretation {
  readonly containerId: string;
  readonly columnId: string;
  readonly physicalName: string;
  readonly observedType: string;
  readonly sourceEvidenceIds: readonly string[];
  readonly suggestedInterpretations: readonly SuggestedInterpretation[];
  readonly interpretationStatus: 'UNINTERPRETED' | 'SUGGESTED' | 'NEEDS_REVIEW'; // O motor só produz estas 3
  readonly limitations: readonly string[];
}

export interface ContainerInterpretation {
  readonly containerId: string;
  readonly physicalName: string;
  readonly suggestedLabel: string;
  readonly fieldCount: number;
  readonly sourceEvidenceIds: readonly string[];
  readonly limitations: readonly string[];
}

export interface RelationshipInterpretation {
  readonly relationshipId: string;
  readonly sourceContainerId: string;
  readonly sourceColumnName: string;
  readonly targetContainerId: string;
  readonly targetColumnName: string;
  readonly relationshipType: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';
  readonly confidenceBand: ConfidenceBand;
  readonly confidenceScore: number;
  readonly supportingEvidenceIds: readonly string[];
  readonly status: 'SUGGESTED' | 'NEEDS_REVIEW';
}

export interface UnresolvedQuestion {
  readonly questionId: string;
  readonly questionType: 'AMBIGUOUS_INTERPRETATION' | 'AMBIGUOUS_DATE_FORMAT' | 'KEY_DUPLICATION' | 'UNCERTAIN_MEASURE_NATURE';
  readonly targetContainerId: string;
  readonly targetColumnName?: string;
  readonly title: string;
  readonly description: string;
  readonly options: readonly { label: string; action: string }[];
  readonly supportingEvidenceIds: readonly string[];
}

export interface GroupedUnresolvedQuestion {
  readonly groupId: string;
  readonly category: string;
  readonly reason: string;
  readonly affectedContainerId: string;
  readonly affectedColumnNames: readonly string[];
  readonly totalAffectedFields: number;
}

export interface SemanticFingerprint {
  readonly discoveryFingerprint: string;
  readonly evidenceHash: string;
  readonly semanticHash: string;
  readonly algorithm: 'FNV1A_32_CANONICAL';
  readonly generatedAt: string;
}

export interface SemanticMetadata {
  readonly engineId: string;
  readonly engineVersion: string;
  readonly executionDurationMs: number;
  readonly isEvidenceTruncated: boolean;
  readonly totalFieldsInterpreted: number;
  readonly totalSuggestionsGenerated: number;
  readonly totalQuestionsGenerated: number;
  readonly generatedAt: string;
}

export interface SemanticArtifact {
  readonly artifactId: string;
  readonly discoveryArtifactId: string;
  readonly qualityArtifactId: string;
  readonly evidenceArtifactId: string;
  readonly dataSourceId: string;
  readonly engagementId: string;
  readonly schemaVersionNumber: number;
  readonly fieldInterpretations: readonly FieldInterpretation[];
  readonly containerInterpretations: readonly ContainerInterpretation[];
  readonly relationshipInterpretations: readonly RelationshipInterpretation[];
  readonly unresolvedQuestions: readonly UnresolvedQuestion[];
  readonly groupedUnresolvedQuestions: readonly GroupedUnresolvedQuestion[];
  readonly metadata: SemanticMetadata;
  readonly fingerprint: SemanticFingerprint;
  readonly generatedAt: string;
}

export class IncompatibleSemanticArtifactsError extends Error {
  constructor(reason: string) {
    super(`[SourceDrivenSemanticEngine] Artefatos incompatíveis para interpretação semântica: ${reason}`);
    this.name = 'IncompatibleSemanticArtifactsError';
  }
}
