import {
  FinancialClassificationMaterialityPolicy,
  FinancialClassificationMaterialityAssessment,
  CategoryNormalizationMetadata,
  SignPolicy,
  DeclarativeCustomRule,
  FinancialClassificationDecision,
  FinancialClassificationProvenance
} from './FinancialClassificationContracts';
import { FieldSemanticDecision } from '../semantic/confirmation/SemanticConfirmationContracts';
import { TrustArtifact } from '../trust/TrustContracts';

export function computePolicyFingerprint(policy: Omit<FinancialClassificationMaterialityPolicy, 'fingerprint'>): string {
  const contentStr = `policy:${policy.policyId}:${policy.version}:${policy.absoluteValueShareThreshold}:${policy.recordCountShareThreshold}:${policy.recurrenceThreshold}:${policy.organizationalCoverageThreshold}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < contentStr.length; i++) {
    hash ^= contentStr.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a_${(hash >>> 0).toString(16)}`;
}

const v1Base = {
  policyId: 'asterion_materiality_policy_v1',
  version: '1.0.0',
  absoluteValueShareThreshold: 0.05, // 5%
  recordCountShareThreshold: 0.05, // 5%
  recurrenceThreshold: 2,
  organizationalCoverageThreshold: 1,
  invalidDataRules: Object.freeze({ maxAllowedInvalid: 0 }),
  mixedSignRules: Object.freeze({ flagAsMaterial: true }),
  manualOverrideRules: Object.freeze({ allowManualDeclaration: true })
};

export const CANONICAL_MATERIALITY_POLICY_V1: FinancialClassificationMaterialityPolicy = Object.freeze({
  ...v1Base,
  fingerprint: computePolicyFingerprint(v1Base)
});

export class FinancialClassificationEngine {
  private readonly ENGINE_VERSION = '1.0.0-HARDENED';

  /**
   * Avaliação determinística e multidimensional de materialidade.
   */
  public evaluateMateriality(
    input: {
      categoryIdentity: string;
      absoluteValue: number;
      datasetTotalAbsoluteValue: number;
      recordCount: number;
      datasetTotalRecordCount: number;
      temporalRecurrence?: number;
      organizationalCoverage?: number;
      invalidValueCount?: number;
      mixedSign?: boolean;
      qualityLimitations?: readonly string[];
      manuallyMaterial?: boolean;
    },
    policy: FinancialClassificationMaterialityPolicy = CANONICAL_MATERIALITY_POLICY_V1
  ): FinancialClassificationMaterialityAssessment {
    const valueShare = input.datasetTotalAbsoluteValue > 0 ? input.absoluteValue / input.datasetTotalAbsoluteValue : 0;
    const countShare = input.datasetTotalRecordCount > 0 ? input.recordCount / input.datasetTotalRecordCount : 0;
    const recurrence = input.temporalRecurrence ?? 1;
    const coverage = input.organizationalCoverage ?? 1;
    const invalidCount = input.invalidValueCount ?? 0;
    const isMixed = input.mixedSign ?? false;
    const isManual = input.manuallyMaterial ?? false;
    const limitations = input.qualityLimitations ?? [];

    const reasons: string[] = [];
    let isMaterial = false;

    if (valueShare >= policy.absoluteValueShareThreshold) {
      isMaterial = true;
      reasons.push(`Representa ${(valueShare * 100).toFixed(1)}% do valor absoluto total (limiar: ${(policy.absoluteValueShareThreshold * 100).toFixed(1)}%).`);
    }

    if (countShare >= policy.recordCountShareThreshold) {
      isMaterial = true;
      reasons.push(`Representa ${(countShare * 100).toFixed(1)}% do volume total de registros (limiar: ${(policy.recordCountShareThreshold * 100).toFixed(1)}%).`);
    }

    if (recurrence >= policy.recurrenceThreshold) {
      isMaterial = true;
      reasons.push(`Recorrência em ${recurrence} períodos (limiar: ${policy.recurrenceThreshold}).`);
    }

    if (isMixed && policy.mixedSignRules.flagAsMaterial) {
      isMaterial = true;
      reasons.push('Categoria com sinais mistos (entradas e saídas no mesmo agrupamento).');
    }

    if (invalidCount > policy.invalidDataRules.maxAllowedInvalid) {
      isMaterial = true;
      reasons.push(`Contém ${invalidCount} registros com valores inválidos ou nulos.`);
    }

    if (isManual && policy.manualOverrideRules.allowManualDeclaration) {
      isMaterial = true;
      reasons.push('Declarado manualmente como material pelo consultor.');
    }

    if (!isMaterial) {
      reasons.push(`Categoria secundária (${(valueShare * 100).toFixed(2)}% do valor, ${(countShare * 100).toFixed(2)}% dos registros).`);
    }

    return Object.freeze({
      categoryIdentity: input.categoryIdentity,
      absoluteValue: input.absoluteValue,
      absoluteValueShare: valueShare,
      recordCount: input.recordCount,
      recordCountShare: countShare,
      temporalRecurrence: recurrence,
      organizationalCoverage: coverage,
      invalidValueCount: invalidCount,
      mixedSign: isMixed,
      qualityLimitations: Object.freeze([...limitations]),
      manuallyMaterial: isManual,
      materialityReasons: Object.freeze(reasons),
      materialityState: isMaterial ? 'MATERIAL' : 'NON_MATERIAL',
      policyId: policy.policyId,
      policyVersion: policy.version
    });
  }

  /**
   * Normalização determinística de categoria preservando o physicalValue original.
   */
  public normalizeCategory(physicalValue: string): {
    normalizedValue: string;
    categoryIdentity: string;
    metadata: CategoryNormalizationMetadata;
  } {
    const trimmed = physicalValue.trim();
    if (!trimmed) {
      return {
        normalizedValue: 'UNRESOLVED_EMPTY',
        categoryIdentity: 'cat_id_UNRESOLVED_EMPTY',
        metadata: {
          algorithm: 'DETERMINISTIC_CANONICAL_V1',
          version: '1.0.0',
          locale: 'pt-BR',
          trimApplied: trimmed !== physicalValue,
          caseFoldApplied: false,
          diacriticPolicy: 'STRIP_DIACRITICS',
          collisionDetected: false,
          originalValues: [physicalValue]
        }
      };
    }
    // Remover diacríticos/acentos, pontuações e caixa alta
    const stripped = trimmed.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9\s]/g, '');
    const normalized = stripped.toUpperCase().replace(/\s+/g, '_');
    const categoryIdentity = `cat_id_${normalized}`;

    return {
      normalizedValue: normalized,
      categoryIdentity,
      metadata: {
        algorithm: 'DETERMINISTIC_CANONICAL_V1',
        version: '1.0.0',
        locale: 'pt-BR',
        trimApplied: trimmed !== physicalValue,
        caseFoldApplied: stripped.toUpperCase() !== stripped,
        diacriticPolicy: 'STRIP_DIACRITICS',
        collisionDetected: false,
        originalValues: [physicalValue]
      }
    };
  }

  /**
   * Validação rigorosa de elegibilidade da fonte.
   */
  public validateDecisionEligibility(
    decision: Omit<FinancialClassificationDecision, 'decisionId' | 'decidedAt'>,
    confirmedDecisions: readonly FieldSemanticDecision[],
    trustArtifact: TrustArtifact
  ): void {
    const financialTrust = trustArtifact.usageAssessments.find(u => u.usageType === 'FINANCIAL_ANALYSIS');
    if (!financialTrust || (financialTrust.status !== 'TRUSTED' && financialTrust.status !== 'CONDITIONALLY_TRUSTED')) {
      throw new Error('TrustArtifact não autorizado para FINANCIAL_ANALYSIS.');
    }

    const monetaryConfirmed = confirmedDecisions.some(
      d => d.physicalName === decision.monetaryFieldPhysicalName && (d.decision === 'CONFIRMED' || d.decision === 'CUSTOM_INTERPRETATION')
    );
    if (!monetaryConfirmed) {
      throw new Error(`Campo monetário "${decision.monetaryFieldPhysicalName}" não possui decisão semântica confirmada.`);
    }

    const categoryConfirmed = confirmedDecisions.some(
      d => d.physicalName === decision.categoryFieldPhysicalName && (d.decision === 'CONFIRMED' || d.decision === 'CUSTOM_INTERPRETATION')
    );
    if (!categoryConfirmed) {
      throw new Error(`Campo categórico "${decision.categoryFieldPhysicalName}" não possui decisão semântica confirmada.`);
    }
  }

  /**
   * Aplicação segura de SignPolicy e CustomRule sem eval ou dynamic execution.
   */
  public projectValue(physicalValue: number, signPolicy: SignPolicy, customRule?: DeclarativeCustomRule): number {
    if (signPolicy === 'CUSTOM_RULE') {
      if (!customRule) return physicalValue;
      const val = physicalValue;
      let matches = false;
      if (customRule.condition === 'POSITIVE' && val > 0) matches = true;
      if (customRule.condition === 'NEGATIVE' && val < 0) matches = true;
      if (customRule.condition === 'ZERO' && val === 0) matches = true;
      if (customRule.condition === 'ANY') matches = true;

      if (matches) {
        if (customRule.operation === 'PRESERVE') return val;
        if (customRule.operation === 'ABSOLUTE') return Math.abs(val);
        if (customRule.operation === 'INVERT' || customRule.operation === 'MULTIPLY_BY_NEGATIVE_ONE') return -val;
      }
      return val;
    }

    switch (signPolicy) {
      case 'PRESERVE_SOURCE_SIGN':
        return physicalValue;
      case 'ABSOLUTE_VALUE_AS_INFLOW':
        return Math.abs(physicalValue);
      case 'ABSOLUTE_VALUE_AS_OUTFLOW':
        return -Math.abs(physicalValue);
      case 'INVERT_SOURCE_SIGN':
        return -physicalValue;
      default:
        return physicalValue;
    }
  }
}
