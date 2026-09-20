import { DREReconciliationArtifact } from './DREReconciliationContracts';

export interface SubtotalProvenanceValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

export class DREReconciliationProvenanceValidator {
  public static validate(artifact: DREReconciliationArtifact): SubtotalProvenanceValidationResult {
    const errors: string[] = [];

    if (!artifact) {
      return { isValid: false, errors: ['DREReconciliationArtifact é obrigatório.'] };
    }

    if (!artifact.dreArtifactId || !artifact.financialClassificationArtifactId || !artifact.trustArtifactId) {
      errors.push('DREReconciliationArtifact não possui referências completas aos artefatos de origem (DRE, Classificação, Trust).');
    }

    if (!artifact.provenance || !artifact.provenance.engineId || !artifact.provenance.engineVersion) {
      errors.push('DREReconciliationArtifact possui registro de proveniência do motor incompleto.');
    }

    // Validar proveniência de cada linha reconciliada
    for (const lineRec of artifact.lineReconciliations) {
      if (!lineRec.provenance || !lineRec.provenance.lineId) {
        errors.push(`LineReconciliation ${lineRec.lineId} possui proveniência incompleta.`);
      }
    }

    // Validar proveniência de cada subtotal reconciliado
    for (const subRec of artifact.subtotalReconciliations) {
      if (!subRec.provenance || !subRec.provenance.subtotalCode) {
        errors.push(`SubtotalReconciliation ${subRec.subtotalId} possui proveniência incompleta.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
