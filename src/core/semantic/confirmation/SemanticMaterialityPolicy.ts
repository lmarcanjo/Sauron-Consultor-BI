import { FieldInterpretation, SemanticArtifact } from '../SemanticContracts';
import { FieldSemanticDecision, SemanticConfirmationArtifact } from './SemanticConfirmationContracts';

export interface MaterialityEvaluationResult {
  readonly isMaterial: boolean;
  readonly reason?: string;
  readonly isSatisfied: boolean;
  readonly decision?: FieldSemanticDecision;
}

export class SemanticMaterialityPolicy {
  public static isMaterialField(field: FieldInterpretation): boolean {
    // Para análise preliminar descritiva (PRELIMINARY) ou simplificada, nenhum campo deve bloquear o entendimento geral de forma absoluta.
    // Retornamos true apenas se o status necessitar de revisão crítica expressa pelo validador.
    if (field.interpretationStatus === 'NEEDS_REVIEW') return true;
    return false;
  }

  /**
   * Avalia se as decisões vigentes satisfazem a regra de materialidade para um campo específico
   */
  public static evaluateFieldMateriality(
    field: FieldInterpretation,
    decision?: FieldSemanticDecision
  ): MaterialityEvaluationResult {
    const isMaterial = this.isMaterialField(field);

    if (!isMaterial) {
      return Object.freeze({
        isMaterial: false,
        isSatisfied: true,
        decision
      });
    }

    if (!decision) {
      return Object.freeze({
        isMaterial: true,
        reason: `Decisão pendente para o campo material ${field.physicalName}`,
        isSatisfied: false
      });
    }

    // Regras de satisfação por tipo de decisão
    switch (decision.decision) {
      case 'CONFIRMED':
      case 'REJECTED':
      case 'KEEP_ORIGINAL':
      case 'CUSTOM_INTERPRETATION':
        return Object.freeze({
          isMaterial: true,
          isSatisfied: true,
          decision
        });
      case 'DEFERRED':
        return Object.freeze({
          isMaterial: true,
          reason: `A decisão sobre o campo material ${field.physicalName} foi adiada pelo consultor`,
          isSatisfied: false,
          decision
        });
      default:
        return Object.freeze({
          isMaterial: true,
          reason: `Estado de decisão desconhecido para ${field.physicalName}`,
          isSatisfied: false,
          decision
        });
    }
  }

  /**
   * Avalia a materialidade de todos os campos de um SemanticArtifact frente às decisões do consultor
   */
  public static evaluateArtifact(
    semanticArtifact: SemanticArtifact,
    confirmationArtifact?: SemanticConfirmationArtifact | null
  ): {
    readonly canConfirm: boolean;
    readonly totalMaterialFields: number;
    readonly satisfiedMaterialFields: number;
    readonly pendingMaterialFields: readonly FieldInterpretation[];
    readonly blockingReasons: readonly string[];
  } {
    if (!semanticArtifact || !semanticArtifact.fieldInterpretations) {
      return Object.freeze({
        canConfirm: false,
        totalMaterialFields: 0,
        satisfiedMaterialFields: 0,
        pendingMaterialFields: Object.freeze([]),
        blockingReasons: Object.freeze(['SemanticArtifact inválido ou sem campos'])
      });
    }

    const fieldDecisionsMap = new Map<string, FieldSemanticDecision>();
    if (confirmationArtifact && confirmationArtifact.fieldDecisions) {
      for (const d of confirmationArtifact.fieldDecisions) {
        fieldDecisionsMap.set(d.columnId, d);
        if (d.physicalName) {
          fieldDecisionsMap.set(d.physicalName, d);
        }
      }
    }

    let totalMaterialFields = 0;
    let satisfiedMaterialFields = 0;
    const pendingMaterialFields: FieldInterpretation[] = [];
    const blockingReasons: string[] = [];

    for (const field of semanticArtifact.fieldInterpretations) {
      const decision = fieldDecisionsMap.get(field.columnId);
      const evalRes = this.evaluateFieldMateriality(field, decision);

      if (evalRes.isMaterial) {
        totalMaterialFields++;
        if (evalRes.isSatisfied) {
          satisfiedMaterialFields++;
        } else {
          pendingMaterialFields.push(field);
          if (evalRes.reason) {
            blockingReasons.push(evalRes.reason);
          }
        }
      }
    }

    const canConfirm = pendingMaterialFields.length === 0;

    return Object.freeze({
      canConfirm,
      totalMaterialFields,
      satisfiedMaterialFields,
      pendingMaterialFields: Object.freeze(pendingMaterialFields),
      blockingReasons: Object.freeze(blockingReasons)
    });
  }
}
