export type FieldDecisionType =
  | 'CONFIRMED'
  | 'REJECTED'
  | 'KEEP_ORIGINAL'
  | 'CUSTOM_INTERPRETATION'
  | 'DEFERRED';

export type ConfirmationOverallStatus =
  | 'NOT_STARTED'
  | 'IN_REVIEW'
  | 'PARTIALLY_CONFIRMED'
  | 'CONFIRMED'
  | 'NEEDS_REVIEW'
  | 'INVALIDATED';

export interface CustomInterpretationPayload {
  readonly label: string;
  readonly category: string;
  readonly justification?: string;
  readonly supportingEvidenceIds?: readonly string[];
  readonly isManual: true;
}

export interface FieldSemanticDecision {
  readonly containerId: string;
  readonly columnId: string;
  readonly physicalName: string;
  readonly semanticFieldInterpretationId: string;
  readonly selectedInterpretationId?: string;
  readonly decision: FieldDecisionType;
  readonly consultantLabel?: string;
  readonly customPayload?: CustomInterpretationPayload;
  readonly justification?: string;
  readonly supportingEvidenceIds: readonly string[];
  readonly decidedBy: string;
  readonly decidedAt: string;
  readonly limitationsAcknowledged: readonly string[];
}

export interface ContainerSemanticDecision {
  readonly containerId: string;
  readonly physicalName: string;
  readonly confirmedLabel: string;
  readonly decidedBy: string;
  readonly decidedAt: string;
}

export interface RelationshipSemanticDecision {
  readonly relationshipId: string;
  readonly decision: FieldDecisionType;
  readonly decidedBy: string;
  readonly decidedAt: string;
}

export interface SemanticConfirmationMetadata {
  readonly engineVersion: string;
  readonly schemaVersionNumber: number;
  readonly totalFieldsCount: number;
  readonly confirmedFieldsCount: number;
  readonly rejectedFieldsCount: number;
  readonly keptOriginalFieldsCount: number;
  readonly customFieldsCount: number;
  readonly deferredFieldsCount: number;
  readonly materialFieldsPendingCount: number;
}

export interface SemanticConfirmationFingerprint {
  readonly semanticArtifactId: string;
  readonly confirmationHash: string;
  readonly algorithm: 'FNV1A_32_CANONICAL';
  readonly generatedAt: string;
}

export interface SemanticConfirmationArtifact {
  readonly artifactId: string;
  readonly semanticArtifactId: string;
  readonly discoveryArtifactId: string;
  readonly evidenceArtifactId: string;
  readonly dataSourceId: string;
  readonly engagementId: string;
  readonly schemaVersionNumber: number;
  readonly consultantId: string;
  readonly version: number;
  readonly fieldDecisions: readonly FieldSemanticDecision[];
  readonly containerDecisions: readonly ContainerSemanticDecision[];
  readonly relationshipDecisions: readonly RelationshipSemanticDecision[];
  readonly overallStatus: ConfirmationOverallStatus;
  readonly metadata: SemanticConfirmationMetadata;
  readonly fingerprint: SemanticConfirmationFingerprint;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export class UnauthorizedConfirmationError extends Error {
  constructor(reason: string) {
    super(`[SemanticConfirmationService] Acesso não autorizado: ${reason}`);
    this.name = 'UnauthorizedConfirmationError';
  }
}

export class IncompatibleConfirmationSchemaError extends Error {
  constructor(reason: string) {
    super(`[SemanticConfirmationService] Versão de schema incompatível com a confirmação vigente: ${reason}`);
    this.name = 'IncompatibleConfirmationSchemaError';
  }
}

export class MaterialConfirmationBlockedError extends Error {
  constructor(reason: string) {
    super(`[SemanticConfirmationService] Confirmação do entendimento bloqueada por pendências materiais: ${reason}`);
    this.name = 'MaterialConfirmationBlockedError';
  }
}
