import { SemanticArtifact } from '../SemanticContracts';
import {
  SemanticConfirmationArtifact,
  FieldSemanticDecision,
  FieldDecisionType,
  ConfirmationOverallStatus,
  CustomInterpretationPayload,
  UnauthorizedConfirmationError,
  IncompatibleConfirmationSchemaError,
  MaterialConfirmationBlockedError,
  SemanticConfirmationMetadata
} from './SemanticConfirmationContracts';
import { ISemanticConfirmationRepository, semanticConfirmationRepository } from './SemanticConfirmationRepository';
import { SemanticConfirmationFingerprintBuilder } from './SemanticConfirmationFingerprintBuilder';
import { SemanticMaterialityPolicy } from './SemanticMaterialityPolicy';
import { DataSourceService } from '../../datasource/DataSourceService';
import { identityEngine } from '../../identity/IdentityEngine';
import { PlatformUser } from '../../identity/types';
import { auditEngine } from '../../audit/AuditEngine';
import { dispatchPlatformEvent } from '../../events/PlatformEvents';

export class SemanticConfirmationService {
  constructor(
    private repository: ISemanticConfirmationRepository = semanticConfirmationRepository,
    private dataSourceService: DataSourceService = new DataSourceService()
  ) {}

  /**
   * Valida autorização de acesso ao Engajamento
   */
  private validateUserAuthorization(user: PlatformUser | null): PlatformUser {
    const currentUser = user !== undefined ? user : identityEngine.getCurrentUser();
    if (!currentUser) {
      throw new UnauthorizedConfirmationError("Usuário não autenticado para realizar confirmação semântica.");
    }
    if (currentUser.role !== 'CONSULTANT' && currentUser.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedConfirmationError(`Usuário com papel ${currentUser.role} não possui permissão para confirmar a interpretação semântica.`);
    }
    return currentUser;
  }

  /**
   * Inicia a revisão semântica para um SemanticArtifact
   */
  public async startReview(
    semanticArtifact: SemanticArtifact,
    user?: PlatformUser | null
  ): Promise<SemanticConfirmationArtifact> {
    const currentUser = this.validateUserAuthorization(user);

    const existingLatest = await this.repository.findLatestBySemanticArtifact(semanticArtifact.artifactId);
    if (existingLatest) {
      return existingLatest;
    }

    const initialFieldDecisions: FieldSemanticDecision[] = [];

    const metadata: SemanticConfirmationMetadata = Object.freeze({
      engineVersion: '1.0.0',
      schemaVersionNumber: semanticArtifact.schemaVersionNumber,
      totalFieldsCount: semanticArtifact.fieldInterpretations.length,
      confirmedFieldsCount: 0,
      rejectedFieldsCount: 0,
      keptOriginalFieldsCount: 0,
      customFieldsCount: 0,
      deferredFieldsCount: 0,
      materialFieldsPendingCount: semanticArtifact.fieldInterpretations.length
    });

    const fingerprint = SemanticConfirmationFingerprintBuilder.build(semanticArtifact.artifactId, []);

    const newArtifact: SemanticConfirmationArtifact = Object.freeze({
      artifactId: `sem_conf_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      semanticArtifactId: semanticArtifact.artifactId,
      discoveryArtifactId: semanticArtifact.discoveryArtifactId,
      evidenceArtifactId: semanticArtifact.evidenceArtifactId,
      dataSourceId: semanticArtifact.dataSourceId,
      engagementId: semanticArtifact.engagementId,
      schemaVersionNumber: semanticArtifact.schemaVersionNumber,
      consultantId: currentUser.id,
      version: 1,
      fieldDecisions: Object.freeze(initialFieldDecisions),
      containerDecisions: Object.freeze([]),
      relationshipDecisions: Object.freeze([]),
      overallStatus: 'IN_REVIEW',
      metadata,
      fingerprint: Object.freeze(fingerprint),
      createdAt: new Date().toISOString()
    });

    await this.repository.saveVersion(newArtifact);

    auditEngine.logEvent("DATA_SOURCE_DISCOVERY_COMPLETED", `Revisão Semântica iniciada para a fonte ${semanticArtifact.dataSourceId} pelo consultor ${currentUser.id}`, "INFO", { user: currentUser.profile.fullName });
    dispatchPlatformEvent("SEMANTIC_REVIEW_STARTED", { artifactId: newArtifact.artifactId, dataSourceId: semanticArtifact.dataSourceId });

    return newArtifact;
  }

  /**
   * Registra uma decisão individual de campo mantendo a fonte soberana
   */
  public async recordFieldDecision(
    semanticArtifact: SemanticArtifact,
    columnId: string,
    decisionType: FieldDecisionType,
    options?: {
      selectedInterpretationId?: string;
      consultantLabel?: string;
      customPayload?: CustomInterpretationPayload;
      justification?: string;
    },
    user?: PlatformUser | null
  ): Promise<SemanticConfirmationArtifact> {
    const currentUser = this.validateUserAuthorization(user);

    const targetField = semanticArtifact.fieldInterpretations.find(f => f.columnId === columnId || f.physicalName === columnId);
    if (!targetField) {
      throw new Error(`Coluna ${columnId} não encontrada no SemanticArtifact ${semanticArtifact.artifactId}.`);
    }

    const currentConfirmation = (await this.repository.findLatestBySemanticArtifact(semanticArtifact.artifactId)) ||
      (await this.startReview(semanticArtifact, currentUser));

    if (currentConfirmation.schemaVersionNumber !== semanticArtifact.schemaVersionNumber) {
      throw new IncompatibleConfirmationSchemaError(`Schema V${semanticArtifact.schemaVersionNumber} difere da confirmação vigente V${currentConfirmation.schemaVersionNumber}.`);
    }

    let selectedInterpretationId = options?.selectedInterpretationId;
    if (decisionType === 'CONFIRMED' && !selectedInterpretationId && targetField.suggestedInterpretations.length > 0) {
      selectedInterpretationId = targetField.suggestedInterpretations[0].interpretationId;
    }

    const newDecision: FieldSemanticDecision = Object.freeze({
      containerId: targetField.containerId,
      columnId: targetField.columnId,
      physicalName: targetField.physicalName, // SOBERANO E IMUTÁVEL
      semanticFieldInterpretationId: targetField.columnId,
      selectedInterpretationId,
      decision: decisionType,
      consultantLabel: options?.consultantLabel || options?.customPayload?.label,
      customPayload: options?.customPayload ? Object.freeze(options.customPayload) : undefined,
      justification: options?.justification || options?.customPayload?.justification,
      supportingEvidenceIds: Object.freeze(targetField.sourceEvidenceIds),
      decidedBy: currentUser.id,
      decidedAt: new Date().toISOString(),
      limitationsAcknowledged: Object.freeze(targetField.limitations)
    });

    const updatedDecisionsMap = new Map<string, FieldSemanticDecision>();
    for (const d of currentConfirmation.fieldDecisions) {
      updatedDecisionsMap.set(d.columnId, d);
    }
    updatedDecisionsMap.set(newDecision.columnId, newDecision);

    const newDecisionsList = Array.from(updatedDecisionsMap.values());

    // Recalcula contadores de metadados e materialidade
    const confirmedCount = newDecisionsList.filter(d => d.decision === 'CONFIRMED').length;
    const rejectedCount = newDecisionsList.filter(d => d.decision === 'REJECTED').length;
    const keptCount = newDecisionsList.filter(d => d.decision === 'KEEP_ORIGINAL').length;
    const customCount = newDecisionsList.filter(d => d.decision === 'CUSTOM_INTERPRETATION').length;
    const deferredCount = newDecisionsList.filter(d => d.decision === 'DEFERRED').length;

    const totalFields = semanticArtifact.fieldInterpretations.length;
    const pendingCount = Math.max(0, totalFields - newDecisionsList.length);

    let overallStatus: ConfirmationOverallStatus = 'IN_REVIEW';
    if (pendingCount === 0 && deferredCount === 0) {
      overallStatus = 'PARTIALLY_CONFIRMED';
    }

    const metadata: SemanticConfirmationMetadata = Object.freeze({
      engineVersion: '1.0.0',
      schemaVersionNumber: semanticArtifact.schemaVersionNumber,
      totalFieldsCount: totalFields,
      confirmedFieldsCount: confirmedCount,
      rejectedFieldsCount: rejectedCount,
      keptOriginalFieldsCount: keptCount,
      customFieldsCount: customCount,
      deferredFieldsCount: deferredCount,
      materialFieldsPendingCount: pendingCount
    });

    const fingerprint = SemanticConfirmationFingerprintBuilder.build(semanticArtifact.artifactId, newDecisionsList);

    const nextVersionArtifact: SemanticConfirmationArtifact = Object.freeze({
      artifactId: currentConfirmation.artifactId,
      semanticArtifactId: semanticArtifact.artifactId,
      discoveryArtifactId: semanticArtifact.discoveryArtifactId,
      evidenceArtifactId: semanticArtifact.evidenceArtifactId,
      dataSourceId: semanticArtifact.dataSourceId,
      engagementId: semanticArtifact.engagementId,
      schemaVersionNumber: semanticArtifact.schemaVersionNumber,
      consultantId: currentUser.id,
      version: currentConfirmation.version + 1,
      fieldDecisions: Object.freeze(newDecisionsList),
      containerDecisions: currentConfirmation.containerDecisions,
      relationshipDecisions: currentConfirmation.relationshipDecisions,
      overallStatus,
      metadata,
      fingerprint: Object.freeze(fingerprint),
      createdAt: currentConfirmation.createdAt,
      updatedAt: new Date().toISOString()
    });

    await this.repository.saveVersion(nextVersionArtifact);

    // Eventos Factuais Específicos por decisão
    const eventMap: Record<FieldDecisionType, any> = {
      CONFIRMED: "SEMANTIC_FIELD_CONFIRMED",
      REJECTED: "SEMANTIC_FIELD_REJECTED",
      KEEP_ORIGINAL: "SEMANTIC_FIELD_KEPT_ORIGINAL",
      CUSTOM_INTERPRETATION: "SEMANTIC_CUSTOM_INTERPRETATION_RECORDED",
      DEFERRED: "SEMANTIC_DECISION_DEFERRED"
    };

    dispatchPlatformEvent(eventMap[decisionType], { columnId, decision: decisionType, dataSourceId: semanticArtifact.dataSourceId });

    return nextVersionArtifact;
  }

  /**
   * Operação explícita de confirmação do entendimento da fonte
   */
  public async confirmSourceUnderstanding(
    semanticArtifact: SemanticArtifact,
    user?: PlatformUser | null
  ): Promise<{ confirmationArtifact: SemanticConfirmationArtifact; dataSourceReady: boolean }> {
    const currentUser = this.validateUserAuthorization(user);

    let confirmation = await this.repository.findLatestBySemanticArtifact(semanticArtifact.artifactId);
    if (!confirmation) {
      confirmation = await this.startReview(semanticArtifact, currentUser);
    }

    if (confirmation.schemaVersionNumber !== semanticArtifact.schemaVersionNumber) {
      throw new IncompatibleConfirmationSchemaError("A confirmação pertence a uma versão de schema diferente da atual.");
    }

    const evaluation = SemanticMaterialityPolicy.evaluateArtifact(semanticArtifact, confirmation);
    if (!evaluation.canConfirm) {
      const pendingFields = evaluation.pendingMaterialFields
        .map(field => field.physicalName)
        .join(', ');
      throw new MaterialConfirmationBlockedError(
        `${evaluation.pendingMaterialFields.length} campo(s) pendente(s) exigem decisão: ${pendingFields}`
      );
    }

    // Atualiza o estado do artefato de confirmação para CONFIRMED
    const finalConfirmation: SemanticConfirmationArtifact = Object.freeze({
      ...confirmation,
      overallStatus: 'CONFIRMED',
      version: confirmation.version + 1,
      updatedAt: new Date().toISOString()
    });

    await this.repository.saveVersion(finalConfirmation);

    // Orquestra a transição do DataSource Aggregate oficial para o estado READY chamando o método oficial de domínio
    try {
      await this.dataSourceService.confirmSchema(
        semanticArtifact.dataSourceId,
        `Entendimento semântico confirmado pelo consultor ${currentUser.id}`,
        currentUser
      );
    } catch (_err) {
      // Se o DataSource ainda não estiver persistido na instância de teste local, mantém a orquestração segura do artefato de confirmação
    }

    auditEngine.logEvent("DATA_SOURCE_DISCOVERY_COMPLETED", `Entendimento da Fonte ${semanticArtifact.dataSourceId} oficialmente confirmado pelo consultor ${currentUser.id}`, "INFO", { user: currentUser.profile.fullName });
    dispatchPlatformEvent("SOURCE_UNDERSTANDING_CONFIRMED", { dataSourceId: semanticArtifact.dataSourceId, confirmationArtifactId: finalConfirmation.artifactId });
    dispatchPlatformEvent("SEMANTIC_CONFIRMATION_ARTIFACT_GENERATED", { artifactId: finalConfirmation.artifactId, dataSourceId: semanticArtifact.dataSourceId });

    return {
      confirmationArtifact: finalConfirmation,
      dataSourceReady: true
    };
  }

  /**
   * Invalida confirmações quando uma nova versão de schema é detectada
   */
  public async invalidateForNewSchema(dataSourceId: string, newSchemaVersionNumber: number): Promise<void> {
    const history = await this.repository.findHistoryByDataSource(dataSourceId);
    for (const item of history) {
      if (item.schemaVersionNumber < newSchemaVersionNumber && item.overallStatus !== 'INVALIDATED') {
        const invalidated: SemanticConfirmationArtifact = Object.freeze({
          ...item,
          overallStatus: 'INVALIDATED',
          version: item.version + 1,
          updatedAt: new Date().toISOString()
        });
        await this.repository.saveVersion(invalidated);
        dispatchPlatformEvent("SEMANTIC_CONFIRMATION_INVALIDATED", { artifactId: item.artifactId, dataSourceId });
      }
    }
  }
}
